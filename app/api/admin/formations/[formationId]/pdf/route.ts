import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PDF_SIZE = 25 * 1024 * 1024;
const PDF_MIME_TYPE = "application/pdf";

const DEFAULT_BUCKET = "course-files";

type RouteContext = {
  params: Promise<{
    formationId: string;
  }>;
};

type SupabaseStorageError = {
  statusCode?: string | number;
  error?: string;
  message?: string;
};

/**
 * ============================================================================
 * POST /api/admin/formations/[formationId]/pdf
 * ============================================================================
 *
 * Upload ou remplacement du PDF privé d'une formation.
 *
 * Sécurité :
 * - administrateur authentifié obligatoire ;
 * - formation vérifiée en base ;
 * - multipart/form-data uniquement ;
 * - PDF uniquement ;
 * - taille maximale de 25 Mo ;
 * - vérification de la signature réelle "%PDF-" ;
 * - bucket Supabase privé ;
 * - aucune URL publique permanente enregistrée ;
 * - seul le chemin Storage est conservé en base ;
 * - l'ancien fichier n'est supprimé qu'après la réussite complète
 *   du nouvel upload et de la mise à jour PostgreSQL.
 */
export async function POST(
  request: Request,
  context: RouteContext,
) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const formationId = await getFormationId(context);

  if (!formationId) {
    return errorResponse(
      "Identifiant de formation invalide.",
      400,
    );
  }

  if (!isMultipartRequest(request)) {
    return errorResponse(
      "Le fichier PDF doit être envoyé au format multipart/form-data.",
      415,
    );
  }

  const storageConfig = getStorageConfig();

  if (!storageConfig.ok) {
    console.error(
      "[ADMIN_FORMATION_PDF_CONFIG]",
      storageConfig.error,
    );

    return errorResponse(
      "Le stockage privé des formations n'est pas configuré.",
      500,
    );
  }

  try {
    const formation = await db.course.findUnique({
      where: {
        id: formationId,
      },

      select: {
        id: true,
        title: true,

        privatePdfPath: true,
        privatePdfName: true,
        privatePdfSize: true,
      },
    });

    if (!formation) {
      return errorResponse(
        "Formation introuvable.",
        404,
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return errorResponse(
        "Impossible de lire le fichier envoyé.",
        400,
      );
    }

    /*
     * Le formulaire peut envoyer "pdf".
     * On accepte également "file" afin de rendre l'endpoint
     * plus robuste si le composant d'upload évolue.
     */
    const uploadedValue =
      formData.get("pdf") ??
      formData.get("file");

    if (!(uploadedValue instanceof File)) {
      return validationError(
        "pdf",
        "Aucun fichier PDF n'a été envoyé.",
      );
    }

    const file = uploadedValue;

    const validation = await validatePdf(file);

    if (!validation.ok) {
      return validationError(
        "pdf",
        validation.message,
      );
    }

    const originalFileName =
      sanitizeOriginalFileName(file.name);

    const fileExtension = ".pdf";

    /*
     * Le nom Storage n'utilise jamais directement le nom fourni
     * par l'utilisateur.
     *
     * Cela évite :
     * - collisions ;
     * - caractères spéciaux ;
     * - tentatives de manipulation de chemin.
     */
    const storageFileName =
      `${Date.now()}-${randomUUID()}${fileExtension}`;

    const storagePath =
      `formations/${formation.id}/${storageFileName}`;

    const bytes = new Uint8Array(
      await file.arrayBuffer(),
    );

    // ========================================================================
    // 1. UPLOAD DU NOUVEAU PDF
    // ========================================================================

    const uploadResult =
      await uploadPrivatePdfToSupabase({
        supabaseUrl: storageConfig.supabaseUrl,
        secretKey: storageConfig.secretKey,
        bucket: storageConfig.bucket,
        storagePath,
        bytes,
      });

    if (!uploadResult.ok) {
      console.error(
        "[ADMIN_FORMATION_PDF_UPLOAD]",
        uploadResult.error,
      );

      return errorResponse(
        "Impossible d'enregistrer le PDF dans le stockage privé.",
        502,
      );
    }

    // ========================================================================
    // 2. MISE À JOUR POSTGRESQL
    // ========================================================================

    let updatedFormation: {
      id: string;
      title: string;
      privatePdfPath: string | null;
      privatePdfName: string | null;
      privatePdfSize: number | null;
      updatedAt: Date;
    };

    try {
      updatedFormation = await db.course.update({
        where: {
          id: formation.id,
        },

        data: {
          privatePdfPath: storagePath,
          privatePdfName: originalFileName,
          privatePdfSize: file.size,
        },

        select: {
          id: true,
          title: true,

          privatePdfPath: true,
          privatePdfName: true,
          privatePdfSize: true,

          updatedAt: true,
        },
      });
    } catch (databaseError) {
      /*
       * La base n'a pas pu être mise à jour.
       *
       * Le nouveau fichier ne doit donc pas rester orphelin
       * dans Supabase.
       */
      const rollbackResult =
        await deletePrivatePdfFromSupabase({
          supabaseUrl:
            storageConfig.supabaseUrl,
          secretKey:
            storageConfig.secretKey,
          bucket:
            storageConfig.bucket,
          storagePaths: [
            storagePath,
          ],
        });

      if (!rollbackResult.ok) {
        console.error(
          "[ADMIN_FORMATION_PDF_ROLLBACK_FAILED]",
          rollbackResult.error,
        );
      }

      throw databaseError;
    }

    // ========================================================================
    // 3. SUPPRESSION DE L'ANCIEN PDF
    // ========================================================================

    /*
     * On supprime l'ancien PDF seulement APRÈS :
     *
     * 1. nouvel upload réussi ;
     * 2. base PostgreSQL mise à jour.
     *
     * Ainsi, une erreur pendant l'upload ne détruit jamais
     * le PDF actuellement utilisé par la formation.
     */
    if (
      formation.privatePdfPath &&
      formation.privatePdfPath !== storagePath
    ) {
      const deleteOldResult =
        await deletePrivatePdfFromSupabase({
          supabaseUrl:
            storageConfig.supabaseUrl,
          secretKey:
            storageConfig.secretKey,
          bucket:
            storageConfig.bucket,
          storagePaths: [
            formation.privatePdfPath,
          ],
        });

      /*
       * Une erreur de nettoyage de l'ancien fichier ne doit pas
       * invalider le nouvel upload déjà correctement enregistré.
       *
       * On journalise l'incident pour pouvoir nettoyer le fichier
       * orphelin ultérieurement.
       */
      if (!deleteOldResult.ok) {
        console.error(
          "[ADMIN_FORMATION_OLD_PDF_DELETE_FAILED]",
          {
            formationId:
              formation.id,

            oldPath:
              formation.privatePdfPath,

            error:
              deleteOldResult.error,
          },
        );
      }
    }

    // ========================================================================
    // RÉPONSE
    // ========================================================================

    return NextResponse.json(
      {
        success: true,

        message:
          formation.privatePdfPath
            ? "Le PDF privé de la formation a été remplacé avec succès."
            : "Le PDF privé de la formation a été ajouté avec succès.",

        pdf: {
          name:
            updatedFormation.privatePdfName,

          size:
            updatedFormation.privatePdfSize,

          hasPdf: Boolean(
            updatedFormation.privatePdfPath,
          ),

          updatedAt:
            updatedFormation.updatedAt.toISOString(),
        },
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_PDF_POST]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * DELETE /api/admin/formations/[formationId]/pdf
 * ============================================================================
 *
 * Supprime le PDF privé d'une formation.
 *
 * La base est mise à jour avant le nettoyage Storage afin que
 * l'application cesse immédiatement de considérer le PDF comme actif.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const formationId = await getFormationId(context);

  if (!formationId) {
    return errorResponse(
      "Identifiant de formation invalide.",
      400,
    );
  }

  const storageConfig = getStorageConfig();

  if (!storageConfig.ok) {
    console.error(
      "[ADMIN_FORMATION_PDF_CONFIG]",
      storageConfig.error,
    );

    return errorResponse(
      "Le stockage privé des formations n'est pas configuré.",
      500,
    );
  }

  try {
    const formation = await db.course.findUnique({
      where: {
        id: formationId,
      },

      select: {
        id: true,
        privatePdfPath: true,
      },
    });

    if (!formation) {
      return errorResponse(
        "Formation introuvable.",
        404,
      );
    }

    if (!formation.privatePdfPath) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Aucun PDF privé n'est associé à cette formation.",
        },
        {
          status: 200,
          headers: noStoreHeaders(),
        },
      );
    }

    const oldPath =
      formation.privatePdfPath;

    /*
     * On retire d'abord la référence en base.
     */
    await db.course.update({
      where: {
        id: formation.id,
      },

      data: {
        privatePdfPath: null,
        privatePdfName: null,
        privatePdfSize: null,
      },
    });

    /*
     * Puis on nettoie Storage.
     */
    const deleteResult =
      await deletePrivatePdfFromSupabase({
        supabaseUrl:
          storageConfig.supabaseUrl,
        secretKey:
          storageConfig.secretKey,
        bucket:
          storageConfig.bucket,
        storagePaths: [
          oldPath,
        ],
      });

    if (!deleteResult.ok) {
      console.error(
        "[ADMIN_FORMATION_PDF_DELETE_STORAGE_FAILED]",
        {
          formationId:
            formation.id,

          path:
            oldPath,

          error:
            deleteResult.error,
        },
      );

      /*
       * La référence a déjà été supprimée de PostgreSQL.
       * Le fichier restant est donc seulement un fichier orphelin
       * et n'est plus considéré comme contenu actif.
       */
      return NextResponse.json(
        {
          success: true,

          message:
            "Le PDF a été retiré de la formation. Le nettoyage du stockage devra être réessayé.",

          storageCleanupPending: true,
        },
        {
          status: 200,
          headers: noStoreHeaders(),
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          "Le PDF privé a été supprimé avec succès.",

        storageCleanupPending: false,
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_PDF_DELETE]",
      error,
    );

    return serverError();
  }
}

// ============================================================================
// ROUTE PARAMS
// ============================================================================

async function getFormationId(
  context: RouteContext,
) {
  try {
    const params = await context.params;

    return cleanString(
      params.formationId,
    );
  } catch {
    return "";
  }
}

// ============================================================================
// PDF VALIDATION
// ============================================================================

async function validatePdf(
  file: File,
): Promise<
  | {
      ok: true;
    }
  | {
      ok: false;
      message: string;
    }
> {
  if (file.size <= 0) {
    return {
      ok: false,
      message:
        "Le fichier PDF est vide.",
    };
  }

  if (file.size > MAX_PDF_SIZE) {
    return {
      ok: false,

      message:
        "Le PDF ne doit pas dépasser 25 Mo.",
    };
  }

  /*
   * Le navigateur fournit normalement application/pdf.
   *
   * Certains navigateurs peuvent cependant envoyer un type vide.
   * On autorise donc le type vide uniquement parce que nous vérifions
   * également la signature réelle du fichier juste après.
   */
  if (
    file.type &&
    file.type.toLowerCase() !==
      PDF_MIME_TYPE
  ) {
    return {
      ok: false,

      message:
        "Seuls les fichiers PDF sont autorisés.",
    };
  }

  if (
    !file.name
      .toLowerCase()
      .endsWith(".pdf")
  ) {
    return {
      ok: false,

      message:
        "Le fichier doit avoir l'extension .pdf.",
    };
  }

  /*
   * Vérification de la signature PDF.
   *
   * Un simple changement d'extension vers ".pdf"
   * ne suffit donc pas.
   */
  const headerBuffer =
    await file
      .slice(0, 5)
      .arrayBuffer();

  const header =
    new Uint8Array(headerBuffer);

  const isPdfSignature =
    header.length === 5 &&
    header[0] === 0x25 &&
    header[1] === 0x50 &&
    header[2] === 0x44 &&
    header[3] === 0x46 &&
    header[4] === 0x2d;

  if (!isPdfSignature) {
    return {
      ok: false,

      message:
        "Le fichier envoyé n'est pas un PDF valide.",
    };
  }

  return {
    ok: true,
  };
}

// ============================================================================
// FILE NAME
// ============================================================================

function sanitizeOriginalFileName(
  fileName: string,
) {
  const trimmed =
    fileName.trim();

  if (!trimmed) {
    return "formation.pdf";
  }

  /*
   * On retire les caractères de contrôle et les séparateurs
   * de chemin avant d'enregistrer le nom d'affichage.
   */
  const sanitized = trimmed
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[\\/]/g, "-")
    .slice(0, 255);

  if (!sanitized) {
    return "formation.pdf";
  }

  return sanitized
    .toLowerCase()
    .endsWith(".pdf")
    ? sanitized
    : `${sanitized}.pdf`;
}

// ============================================================================
// SUPABASE CONFIG
// ============================================================================

function getStorageConfig():
  | {
      ok: true;
      supabaseUrl: string;
      secretKey: string;
      bucket: string;
    }
  | {
      ok: false;
      error: string;
    } {
  const supabaseUrl =
    cleanString(
      process.env.SUPABASE_URL,
    ).replace(/\/+$/, "");

  const secretKey =
    cleanString(
      process.env.SUPABASE_SECRET_KEY,
    );

  const bucket =
    cleanString(
      process.env
        .SUPABASE_COURSE_FILES_BUCKET,
    ) || DEFAULT_BUCKET;

  if (!supabaseUrl) {
    return {
      ok: false,

      error:
        "SUPABASE_URL est manquant.",
    };
  }

  if (!isHttpsUrl(supabaseUrl)) {
    return {
      ok: false,

      error:
        "SUPABASE_URL est invalide.",
    };
  }

  if (!secretKey) {
    return {
      ok: false,

      error:
        "SUPABASE_SECRET_KEY est manquant.",
    };
  }

  if (!bucket) {
    return {
      ok: false,

      error:
        "SUPABASE_COURSE_FILES_BUCKET est manquant.",
    };
  }

  return {
    ok: true,
    supabaseUrl,
    secretKey,
    bucket,
  };
}

// ============================================================================
// SUPABASE — UPLOAD
// ============================================================================

async function uploadPrivatePdfToSupabase(
  input: {
    supabaseUrl: string;
    secretKey: string;
    bucket: string;
    storagePath: string;
    bytes: Uint8Array;
  },
): Promise<
  | {
      ok: true;
    }
  | {
      ok: false;
      error: SupabaseStorageError;
    }
> {
  const endpoint =
    createSupabaseObjectEndpoint(
      input.supabaseUrl,
      input.bucket,
      input.storagePath,
    );

  try {
    const response = await fetch(
      endpoint,
      {
        method: "POST",

        headers: {
          Authorization:
            `Bearer ${input.secretKey}`,

          apikey:
            input.secretKey,

          "Content-Type":
            PDF_MIME_TYPE,

          /*
           * Le chemin généré est unique.
           * On ne remplace donc jamais silencieusement
           * un objet existant.
           */
          "x-upsert": "false",

          "Cache-Control":
            "no-store",
        },

        body: Buffer.from(input.bytes),
        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        ok: false,
        error:
          await readSupabaseError(
            response,
          ),
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,

      error: {
        error:
          "STORAGE_NETWORK_ERROR",

        message:
          error instanceof Error
            ? error.message
            : "Erreur réseau inconnue.",
      },
    };
  }
}

// ============================================================================
// SUPABASE — DELETE
// ============================================================================

async function deletePrivatePdfFromSupabase(
  input: {
    supabaseUrl: string;
    secretKey: string;
    bucket: string;
    storagePaths: string[];
  },
): Promise<
  | {
      ok: true;
    }
  | {
      ok: false;
      error: SupabaseStorageError;
    }
> {
  if (input.storagePaths.length === 0) {
    return {
      ok: true,
    };
  }

  const endpoint =
    `${input.supabaseUrl}` +
    `/storage/v1/object/${encodeURIComponent(
      input.bucket,
    )}`;

  try {
    const response = await fetch(
      endpoint,
      {
        method: "DELETE",

        headers: {
          Authorization:
            `Bearer ${input.secretKey}`,

          apikey:
            input.secretKey,

          "Content-Type":
            "application/json",

          "Cache-Control":
            "no-store",
        },

        body: JSON.stringify({
          prefixes:
            input.storagePaths,
        }),

        cache: "no-store",
      },
    );

    if (!response.ok) {
      return {
        ok: false,

        error:
          await readSupabaseError(
            response,
          ),
      };
    }

    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,

      error: {
        error:
          "STORAGE_NETWORK_ERROR",

        message:
          error instanceof Error
            ? error.message
            : "Erreur réseau inconnue.",
      },
    };
  }
}

// ============================================================================
// SUPABASE — URL
// ============================================================================

function createSupabaseObjectEndpoint(
  supabaseUrl: string,
  bucket: string,
  storagePath: string,
) {
  const encodedBucket =
    encodeURIComponent(bucket);

  const encodedPath =
    storagePath
      .split("/")
      .map((segment) =>
        encodeURIComponent(segment),
      )
      .join("/");

  return (
    `${supabaseUrl}` +
    `/storage/v1/object/` +
    `${encodedBucket}/` +
    `${encodedPath}`
  );
}

// ============================================================================
// SUPABASE — ERROR
// ============================================================================

async function readSupabaseError(
  response: Response,
): Promise<SupabaseStorageError> {
  try {
    const payload =
      (await response.json()) as
        SupabaseStorageError;

    return {
      statusCode:
        payload.statusCode ??
        response.status,

      error:
        payload.error ??
        "SUPABASE_STORAGE_ERROR",

      message:
        payload.message ??
        response.statusText,
    };
  } catch {
    return {
      statusCode:
        response.status,

      error:
        "SUPABASE_STORAGE_ERROR",

      message:
        response.statusText ||
        "Erreur Supabase Storage.",
    };
  }
}

// ============================================================================
// REQUEST
// ============================================================================

function isMultipartRequest(
  request: Request,
) {
  return (
    request.headers
      .get("content-type")
      ?.toLowerCase()
      .includes(
        "multipart/form-data",
      ) ?? false
  );
}

// ============================================================================
// URL VALIDATION
// ============================================================================

function isHttpsUrl(
  value: string,
) {
  try {
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

// ============================================================================
// STRING
// ============================================================================

function cleanString(
  value: unknown,
): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

// ============================================================================
// RESPONSES
// ============================================================================

function validationError(
  field: string,
  message: string,
) {
  return NextResponse.json(
    {
      success: false,
      message,

      fieldErrors: {
        [field]: message,
      },
    },
    {
      status: 400,
      headers: noStoreHeaders(),
    },
  );
}

function errorResponse(
  message: string,
  status: number,
) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
      headers: noStoreHeaders(),
    },
  );
}

function unauthorized() {
  return errorResponse(
    "Authentification administrateur requise.",
    401,
  );
}

function serverError() {
  return errorResponse(
    "Une erreur interne est survenue.",
    500,
  );
}

function noStoreHeaders() {
  return {
    "Cache-Control":
      "private, no-store, no-cache, must-revalidate, max-age=0",

    Pragma:
      "no-cache",

    Expires:
      "0",
  };
}