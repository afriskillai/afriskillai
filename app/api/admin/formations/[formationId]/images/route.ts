import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_BUCKET = "course-images";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

const MAX_ALT_TEXT_LENGTH = 300;
const MAX_CAPTION_LENGTH = 1000;

type RouteContext = {
  params: Promise<{
    formationId: string;
  }>;
};

type PresentationImageSlot =
  | "PRIMARY"
  | "SECONDARY";

type ImageType =
  | PresentationImageSlot
  | "DESCRIPTION";

type SupabaseStorageError = {
  statusCode?: string | number;
  error?: string;
  message?: string;
};

type StorageConfig =
  | {
      ok: true;
      supabaseUrl: string;
      secretKey: string;
      bucket: string;
    }
  | {
      ok: false;
      error: string;
    };

type UploadResult =
  | {
      ok: true;
      publicUrl: string;
    }
  | {
      ok: false;
      error: SupabaseStorageError;
    };

type DeleteResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: SupabaseStorageError;
    };

type ImageValidationResult =
  | {
      ok: true;
      contentType: string;
      extension: string;
    }
  | {
      ok: false;
      message: string;
    };

/**
 * ============================================================================
 * GET /api/admin/formations/[formationId]/images
 * ============================================================================
 *
 * Retourne :
 * - les images de présentation PRIMARY / SECONDARY ;
 * - les images utilisées dans la description enrichie.
 *
 * Route strictement réservée à l'administrateur.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const formationId =
    await getFormationId(context);

  if (!formationId) {
    return errorResponse(
      "Identifiant de formation invalide.",
      400,
    );
  }

  try {
    const formation =
      await db.course.findUnique({
        where: {
          id: formationId,
        },

        select: {
          id: true,
          title: true,

          images: {
            orderBy: [
              {
                position: "asc",
              },
              {
                createdAt: "asc",
              },
            ],

            select: {
              id: true,
              type: true,
              url: true,
              altText: true,
              position: true,
              createdAt: true,
              updatedAt: true,
            },
          },

          descriptionImages: {
            orderBy: [
              {
                position: "asc",
              },
              {
                createdAt: "asc",
              },
            ],

            select: {
              id: true,
              url: true,
              altText: true,
              caption: true,
              position: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

    if (!formation) {
      return errorResponse(
        "Formation introuvable.",
        404,
      );
    }

    return NextResponse.json(
      {
        success: true,

        formation: {
          id: formation.id,
          title: formation.title,
        },

        /*
         * Compatibilité conservée avec le formulaire actuel.
         */
        images: formation.images.map(
          (image) => ({
            id: image.id,
            type: image.type,
            url: image.url,
            altText: image.altText,
            position: image.position,
            createdAt:
              image.createdAt.toISOString(),
            updatedAt:
              image.updatedAt.toISOString(),
          }),
        ),

        /*
         * Nouvelles images utilisées dans
         * la description enrichie.
         */
        descriptionImages:
          formation.descriptionImages.map(
            (image) => ({
              id: image.id,
              type: "DESCRIPTION" as const,
              url: image.url,
              altText: image.altText,
              caption: image.caption,
              position: image.position,
              createdAt:
                image.createdAt.toISOString(),
              updatedAt:
                image.updatedAt.toISOString(),
            }),
          ),
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_IMAGES_GET]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * POST /api/admin/formations/[formationId]/images
 * ============================================================================
 *
 * multipart/form-data
 *
 * Images de présentation :
 * - file
 * - type = PRIMARY | SECONDARY
 *
 * Images de description :
 * - file
 * - type = DESCRIPTION
 * - altText facultatif
 * - caption facultatif
 * - position facultatif
 *
 * "image" reste accepté comme alias de "file".
 *
 * Sécurité :
 * - session administrateur obligatoire ;
 * - formation vérifiée ;
 * - JPEG / PNG / WEBP uniquement ;
 * - 5 Mo maximum ;
 * - signature binaire contrôlée ;
 * - chemin Storage généré côté serveur ;
 * - rollback Storage si PostgreSQL échoue ;
 * - aucun nom fourni par l'utilisateur dans le chemin Storage.
 */
export async function POST(
  request: Request,
  context: RouteContext,
) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const formationId =
    await getFormationId(context);

  if (!formationId) {
    return errorResponse(
      "Identifiant de formation invalide.",
      400,
    );
  }

  if (!isMultipartRequest(request)) {
    return errorResponse(
      "L'image doit être envoyée au format multipart/form-data.",
      415,
    );
  }

  const storageConfig =
    getStorageConfig();

  if (!storageConfig.ok) {
    console.error(
      "[ADMIN_FORMATION_IMAGES_CONFIG]",
      storageConfig.error,
    );

    return errorResponse(
      "Le stockage des images de formation n'est pas configuré.",
      500,
    );
  }

  try {
    const formation =
      await db.course.findUnique({
        where: {
          id: formationId,
        },

        select: {
          id: true,
          title: true,
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
      formData =
        await request.formData();
    } catch {
      return errorResponse(
        "Impossible de lire les données envoyées.",
        400,
      );
    }

    const rawType =
      cleanString(
        formData.get("type"),
      ).toUpperCase();

    if (!isImageType(rawType)) {
      return validationError(
        "type",
        "Le type d'image doit être PRIMARY, SECONDARY ou DESCRIPTION.",
      );
    }

    const uploadedValue =
      formData.get("file") ??
      formData.get("image");

    if (!(uploadedValue instanceof File)) {
      return validationError(
        "file",
        "Aucune image n'a été envoyée.",
      );
    }

    const file = uploadedValue;

    const validation =
      await validateImage(file);

    if (!validation.ok) {
      return validationError(
        "file",
        validation.message,
      );
    }

    if (rawType === "DESCRIPTION") {
      return uploadDescriptionImage({
        formation,
        file,
        validation,
        formData,
        storageConfig,
      });
    }

    return uploadPresentationImage({
      formation,
      file,
      validation,
      slot: rawType,
      storageConfig,
    });
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_IMAGES_POST]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * UPLOAD PRIMARY / SECONDARY
 * ============================================================================
 *
 * Cette fonction conserve le fonctionnement historique :
 * une seule image par emplacement.
 */
async function uploadPresentationImage(input: {
  formation: {
    id: string;
    title: string;
  };

  file: File;

  validation: {
    contentType: string;
    extension: string;
  };

  slot: PresentationImageSlot;

  storageConfig: Extract<
    StorageConfig,
    { ok: true }
  >;
}) {
  const {
    formation,
    file,
    validation,
    slot,
    storageConfig,
  } = input;

  const existingImage =
    await db.courseImage.findUnique({
      where: {
        courseId_type: {
          courseId: formation.id,
          type: slot,
        },
      },

      select: {
        id: true,
        url: true,
        type: true,
        position: true,
      },
    });

  const storageFileName =
    `${Date.now()}-${randomUUID()}.${validation.extension}`;

  const storagePath =
    `formations/${formation.id}/${slot.toLowerCase()}/${storageFileName}`;

  const bytes =
    new Uint8Array(
      await file.arrayBuffer(),
    );

  /*
   * 1. Upload Storage
   */
  const uploadResult =
    await uploadPublicImageToSupabase({
      supabaseUrl:
        storageConfig.supabaseUrl,

      secretKey:
        storageConfig.secretKey,

      bucket:
        storageConfig.bucket,

      storagePath,

      bytes,

      contentType:
        validation.contentType,
    });

  if (!uploadResult.ok) {
    console.error(
      "[ADMIN_FORMATION_IMAGE_UPLOAD]",
      uploadResult.error,
    );

    return errorResponse(
      "Impossible d'enregistrer l'image dans le stockage.",
      502,
    );
  }

  const position =
    slot === "PRIMARY"
      ? 0
      : 1;

  const altText =
    buildPresentationAltText(
      formation.title,
      slot,
    );

  let savedImage: {
    id: string;
    type: PresentationImageSlot;
    url: string;
    altText: string | null;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  };

  /*
   * 2. PostgreSQL
   */
  try {
    savedImage =
      await db.courseImage.upsert({
        where: {
          courseId_type: {
            courseId:
              formation.id,

            type: slot,
          },
        },

        create: {
          courseId:
            formation.id,

          type: slot,

          url:
            uploadResult.publicUrl,

          altText,

          position,
        },

        update: {
          url:
            uploadResult.publicUrl,

          altText,

          position,
        },

        select: {
          id: true,
          type: true,
          url: true,
          altText: true,
          position: true,
          createdAt: true,
          updatedAt: true,
        },
      });
  } catch (databaseError) {
    await rollbackUploadedObject({
      storageConfig,
      storagePath,
      logKey:
        "[ADMIN_FORMATION_IMAGE_ROLLBACK_FAILED]",
    });

    throw databaseError;
  }

  /*
   * 3. Ancien fichier
   */
  if (
    existingImage?.url &&
    existingImage.url !==
      savedImage.url
  ) {
    await cleanupPublicImage({
      publicUrl:
        existingImage.url,

      storageConfig,

      logKey:
        "[ADMIN_FORMATION_OLD_IMAGE_DELETE_FAILED]",

      metadata: {
        formationId:
          formation.id,

        type: slot,
      },
    });
  }

  return NextResponse.json(
    {
      success: true,

      message:
        existingImage
          ? "L'image de la formation a été remplacée avec succès."
          : "L'image de la formation a été ajoutée avec succès.",

      image: {
        id:
          savedImage.id,

        type:
          savedImage.type,

        url:
          savedImage.url,

        altText:
          savedImage.altText,

        position:
          savedImage.position,

        createdAt:
          savedImage.createdAt.toISOString(),

        updatedAt:
          savedImage.updatedAt.toISOString(),
      },
    },
    {
      status: 200,
      headers: noStoreHeaders(),
    },
  );
}

/**
 * ============================================================================
 * UPLOAD IMAGE DE DESCRIPTION
 * ============================================================================
 */
async function uploadDescriptionImage(input: {
  formation: {
    id: string;
    title: string;
  };

  file: File;

  validation: {
    contentType: string;
    extension: string;
  };

  formData: FormData;

  storageConfig: Extract<
    StorageConfig,
    { ok: true }
  >;
}) {
  const {
    formation,
    file,
    validation,
    formData,
    storageConfig,
  } = input;

  const rawAltText =
    cleanString(
      formData.get("altText"),
    );

  const rawCaption =
    cleanString(
      formData.get("caption"),
    );

  if (
    rawAltText.length >
    MAX_ALT_TEXT_LENGTH
  ) {
    return validationError(
      "altText",
      `Le texte alternatif ne doit pas dépasser ${MAX_ALT_TEXT_LENGTH} caractères.`,
    );
  }

  if (
    rawCaption.length >
    MAX_CAPTION_LENGTH
  ) {
    return validationError(
      "caption",
      `La légende ne doit pas dépasser ${MAX_CAPTION_LENGTH} caractères.`,
    );
  }

  const requestedPosition =
    parseOptionalPosition(
      formData.get("position"),
    );

  if (
    requestedPosition ===
    "INVALID"
  ) {
    return validationError(
      "position",
      "La position de l'image est invalide.",
    );
  }

  /*
   * Si aucune position n'est fournie,
   * on place l'image à la fin.
   */
  let position: number;

  if (
    typeof requestedPosition ===
    "number"
  ) {
    position =
      requestedPosition;
  } else {
    const lastImage =
      await db.courseDescriptionImage.findFirst({
        where: {
          courseId:
            formation.id,
        },

        orderBy: {
          position: "desc",
        },

        select: {
          position: true,
        },
      });

    position =
      (lastImage?.position ?? -1) +
      1;
  }

  /*
   * La contrainte Prisma est :
   * @@unique([courseId, position])
   *
   * Si le client demande une position déjà utilisée,
   * nous décalons les images existantes avant
   * d'enregistrer la nouvelle.
   */
  if (
    typeof requestedPosition ===
    "number"
  ) {
    await shiftDescriptionImagesForInsert(
      formation.id,
      position,
    );
  }

  const storageFileName =
    `${Date.now()}-${randomUUID()}.${validation.extension}`;

  const storagePath =
    `formations/${formation.id}/description/${storageFileName}`;

  const bytes =
    new Uint8Array(
      await file.arrayBuffer(),
    );

  const uploadResult =
    await uploadPublicImageToSupabase({
      supabaseUrl:
        storageConfig.supabaseUrl,

      secretKey:
        storageConfig.secretKey,

      bucket:
        storageConfig.bucket,

      storagePath,

      bytes,

      contentType:
        validation.contentType,
    });

  if (!uploadResult.ok) {
    /*
     * Si nous avions déplacé des positions avant
     * l'upload, nous les normalisons à nouveau.
     */
    if (
      typeof requestedPosition ===
      "number"
    ) {
      await normalizeDescriptionImagePositions(
        formation.id,
      ).catch((error) => {
        console.error(
          "[ADMIN_DESCRIPTION_IMAGE_POSITION_ROLLBACK]",
          error,
        );
      });
    }

    console.error(
      "[ADMIN_FORMATION_DESCRIPTION_IMAGE_UPLOAD]",
      uploadResult.error,
    );

    return errorResponse(
      "Impossible d'enregistrer l'image de description dans le stockage.",
      502,
    );
  }

  const altText =
    rawAltText ||
    `${formation.title} - image de description`;

  const caption =
    rawCaption || null;

  let savedImage: {
    id: string;
    url: string;
    altText: string | null;
    caption: string | null;
    position: number;
    createdAt: Date;
    updatedAt: Date;
  };

  try {
    savedImage =
      await db.courseDescriptionImage.create({
        data: {
          courseId:
            formation.id,

          url:
            uploadResult.publicUrl,

          altText,

          caption,

          position,
        },

        select: {
          id: true,
          url: true,
          altText: true,
          caption: true,
          position: true,
          createdAt: true,
          updatedAt: true,
        },
      });
  } catch (databaseError) {
    await rollbackUploadedObject({
      storageConfig,
      storagePath,
      logKey:
        "[ADMIN_FORMATION_DESCRIPTION_IMAGE_ROLLBACK_FAILED]",
    });

    if (
      typeof requestedPosition ===
      "number"
    ) {
      await normalizeDescriptionImagePositions(
        formation.id,
      ).catch((error) => {
        console.error(
          "[ADMIN_DESCRIPTION_IMAGE_POSITION_NORMALIZE_FAILED]",
          error,
        );
      });
    }

    throw databaseError;
  }

  return NextResponse.json(
    {
      success: true,

      message:
        "L'image a été ajoutée à la description avec succès.",

      image: {
        id:
          savedImage.id,

        type:
          "DESCRIPTION" as const,

        url:
          savedImage.url,

        altText:
          savedImage.altText,

        caption:
          savedImage.caption,

        position:
          savedImage.position,

        createdAt:
          savedImage.createdAt.toISOString(),

        updatedAt:
          savedImage.updatedAt.toISOString(),
      },
    },
    {
      status: 201,
      headers: noStoreHeaders(),
    },
  );
}

/**
 * ============================================================================
 * DELETE /api/admin/formations/[formationId]/images
 * ============================================================================
 *
 * PRIMARY / SECONDARY :
 *
 * DELETE ?type=PRIMARY
 * DELETE ?type=SECONDARY
 *
 * DESCRIPTION :
 *
 * DELETE ?type=DESCRIPTION&imageId=<id>
 *
 * ou JSON :
 *
 * {
 *   "type": "DESCRIPTION",
 *   "imageId": "<id>"
 * }
 */
export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  const session =
    await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const formationId =
    await getFormationId(context);

  if (!formationId) {
    return errorResponse(
      "Identifiant de formation invalide.",
      400,
    );
  }

  const storageConfig =
    getStorageConfig();

  if (!storageConfig.ok) {
    console.error(
      "[ADMIN_FORMATION_IMAGES_CONFIG]",
      storageConfig.error,
    );

    return errorResponse(
      "Le stockage des images de formation n'est pas configuré.",
      500,
    );
  }

  try {
    const formation =
      await db.course.findUnique({
        where: {
          id: formationId,
        },

        select: {
          id: true,
        },
      });

    if (!formation) {
      return errorResponse(
        "Formation introuvable.",
        404,
      );
    }

    const deleteInput =
      await readDeleteInput(
        request,
      );

    if (!deleteInput.type) {
      return validationError(
        "type",
        "Le type d'image doit être PRIMARY, SECONDARY ou DESCRIPTION.",
      );
    }

    if (
      deleteInput.type ===
      "DESCRIPTION"
    ) {
      if (!deleteInput.imageId) {
        return validationError(
          "imageId",
          "L'identifiant de l'image de description est obligatoire.",
        );
      }

      return deleteDescriptionImage({
        formationId:
          formation.id,

        imageId:
          deleteInput.imageId,

        storageConfig,
      });
    }

    return deletePresentationImage({
      formationId:
        formation.id,

      slot:
        deleteInput.type,

      storageConfig,
    });
  } catch (error) {
    console.error(
      "[ADMIN_FORMATION_IMAGES_DELETE]",
      error,
    );

    return serverError();
  }
}

/**
 * ============================================================================
 * SUPPRESSION PRIMARY / SECONDARY
 * ============================================================================
 */
async function deletePresentationImage(input: {
  formationId: string;
  slot: PresentationImageSlot;
  storageConfig: Extract<
    StorageConfig,
    { ok: true }
  >;
}) {
  const {
    formationId,
    slot,
    storageConfig,
  } = input;

  const existingImage =
    await db.courseImage.findUnique({
      where: {
        courseId_type: {
          courseId:
            formationId,

          type:
            slot,
        },
      },

      select: {
        id: true,
        url: true,
        type: true,
      },
    });

  if (!existingImage) {
    return NextResponse.json(
      {
        success: true,

        message:
          "Aucune image de ce type n'est enregistrée pour cette formation.",
      },
      {
        status: 200,
        headers: noStoreHeaders(),
      },
    );
  }

  await db.courseImage.delete({
    where: {
      id:
        existingImage.id,
    },
  });

  const storageCleanupPending =
    await removeStoredPublicImage({
      publicUrl:
        existingImage.url,

      storageConfig,

      logKey:
        "[ADMIN_FORMATION_IMAGE_DELETE_STORAGE_FAILED]",

      metadata: {
        formationId,
        type:
          existingImage.type,
      },
    });

  return NextResponse.json(
    {
      success: true,

      message:
        storageCleanupPending
          ? "L'image a été retirée de la formation. Le nettoyage du stockage devra être réessayé."
          : "L'image a été supprimée avec succès.",

      storageCleanupPending,
    },
    {
      status: 200,
      headers: noStoreHeaders(),
    },
  );
}

/**
 * ============================================================================
 * SUPPRESSION IMAGE DE DESCRIPTION
 * ============================================================================
 */
async function deleteDescriptionImage(input: {
  formationId: string;
  imageId: string;
  storageConfig: Extract<
    StorageConfig,
    { ok: true }
  >;
}) {
  const {
    formationId,
    imageId,
    storageConfig,
  } = input;

  const existingImage =
    await db.courseDescriptionImage.findFirst({
      where: {
        id:
          imageId,

        courseId:
          formationId,
      },

      select: {
        id: true,
        url: true,
        position: true,
      },
    });

  if (!existingImage) {
    return errorResponse(
      "Image de description introuvable.",
      404,
    );
  }

  await db.courseDescriptionImage.delete({
    where: {
      id:
        existingImage.id,
    },
  });

  /*
   * On remet les positions à 0, 1, 2, 3...
   * après suppression.
   */
  await normalizeDescriptionImagePositions(
    formationId,
  );

  const storageCleanupPending =
    await removeStoredPublicImage({
      publicUrl:
        existingImage.url,

      storageConfig,

      logKey:
        "[ADMIN_FORMATION_DESCRIPTION_IMAGE_DELETE_STORAGE_FAILED]",

      metadata: {
        formationId,
        imageId:
          existingImage.id,
      },
    });

  return NextResponse.json(
    {
      success: true,

      message:
        storageCleanupPending
          ? "L'image a été retirée de la description. Le nettoyage du stockage devra être réessayé."
          : "L'image de description a été supprimée avec succès.",

      imageId:
        existingImage.id,

      storageCleanupPending,
    },
    {
      status: 200,
      headers: noStoreHeaders(),
    },
  );
}

// ============================================================================
// POSITION DES IMAGES DE DESCRIPTION
// ============================================================================

async function shiftDescriptionImagesForInsert(
  courseId: string,
  targetPosition: number,
) {
  const images =
    await db.courseDescriptionImage.findMany({
      where: {
        courseId,

        position: {
          gte:
            targetPosition,
        },
      },

      orderBy: {
        position: "desc",
      },

      select: {
        id: true,
        position: true,
      },
    });

  /*
   * Mise à jour de la fin vers le début.
   * Cela respecte @@unique([courseId, position]).
   */
  for (const image of images) {
    await db.courseDescriptionImage.update({
      where: {
        id:
          image.id,
      },

      data: {
        position:
          image.position + 1,
      },
    });
  }
}

async function normalizeDescriptionImagePositions(
  courseId: string,
) {
  const images =
    await db.courseDescriptionImage.findMany({
      where: {
        courseId,
      },

      orderBy: [
        {
          position: "asc",
        },
        {
          createdAt: "asc",
        },
      ],

      select: {
        id: true,
        position: true,
      },
    });

  /*
   * Première passe :
   * positions temporaires négatives pour éviter
   * toute collision avec la contrainte unique.
   */
  for (
    let index = 0;
    index < images.length;
    index += 1
  ) {
    const image =
      images[index];

    await db.courseDescriptionImage.update({
      where: {
        id:
          image.id,
      },

      data: {
        position:
          -(index + 1),
      },
    });
  }

  /*
   * Deuxième passe :
   * positions finales 0..n.
   */
  for (
    let index = 0;
    index < images.length;
    index += 1
  ) {
    const image =
      images[index];

    await db.courseDescriptionImage.update({
      where: {
        id:
          image.id,
      },

      data: {
        position:
          index,
      },
    });
  }
}

// ============================================================================
// PARAMÈTRES DE ROUTE
// ============================================================================

async function getFormationId(
  context: RouteContext,
) {
  try {
    const params =
      await context.params;

    return cleanString(
      params.formationId,
    );
  } catch {
    return "";
  }
}

// ============================================================================
// LECTURE DELETE
// ============================================================================

async function readDeleteInput(
  request: Request,
): Promise<{
  type: ImageType | null;
  imageId: string;
}> {
  let queryType = "";
  let queryImageId = "";

  try {
    const url =
      new URL(request.url);

    queryType =
      cleanString(
        url.searchParams.get(
          "type",
        ),
      ).toUpperCase();

    queryImageId =
      cleanString(
        url.searchParams.get(
          "imageId",
        ),
      );

    if (
      isImageType(queryType)
    ) {
      return {
        type:
          queryType,

        imageId:
          queryImageId,
      };
    }
  } catch {
    // Lecture JSON ci-dessous.
  }

  try {
    const contentType =
      request.headers
        .get("content-type")
        ?.toLowerCase() ?? "";

    if (
      !contentType.includes(
        "application/json",
      )
    ) {
      return {
        type: null,
        imageId: "",
      };
    }

    const body =
      (await request.json()) as {
        type?: unknown;
        imageId?: unknown;
      };

    const bodyType =
      cleanString(
        body.type,
      ).toUpperCase();

    const bodyImageId =
      cleanString(
        body.imageId,
      );

    return {
      type:
        isImageType(bodyType)
          ? bodyType
          : null,

      imageId:
        bodyImageId,
    };
  } catch {
    return {
      type: null,
      imageId: "",
    };
  }
}

// ============================================================================
// VALIDATION IMAGE
// ============================================================================

async function validateImage(
  file: File,
): Promise<ImageValidationResult> {
  if (file.size <= 0) {
    return {
      ok: false,
      message:
        "L'image sélectionnée est vide.",
    };
  }

  if (
    file.size >
    MAX_IMAGE_SIZE
  ) {
    return {
      ok: false,
      message:
        "Chaque image ne doit pas dépasser 5 Mo.",
    };
  }

  const mimeType =
    file.type
      .trim()
      .toLowerCase();

  const expectedExtension =
    ALLOWED_IMAGE_TYPES.get(
      mimeType,
    );

  if (!expectedExtension) {
    return {
      ok: false,
      message:
        "Seules les images JPEG, PNG et WEBP sont autorisées.",
    };
  }

  const header =
    new Uint8Array(
      await file
        .slice(0, 16)
        .arrayBuffer(),
    );

  if (
    !matchesImageSignature(
      header,
      mimeType,
    )
  ) {
    return {
      ok: false,
      message:
        "Le contenu du fichier ne correspond pas à un format d'image autorisé.",
    };
  }

  return {
    ok: true,
    contentType:
      mimeType,
    extension:
      expectedExtension,
  };
}

function matchesImageSignature(
  bytes: Uint8Array,
  mimeType: string,
) {
  if (
    mimeType ===
    "image/jpeg"
  ) {
    return (
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff
    );
  }

  if (
    mimeType ===
    "image/png"
  ) {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (
    mimeType ===
    "image/webp"
  ) {
    return (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    );
  }

  return false;
}

// ============================================================================
// TYPES D'IMAGES
// ============================================================================

function isPresentationImageSlot(
  value: string,
): value is PresentationImageSlot {
  return (
    value === "PRIMARY" ||
    value === "SECONDARY"
  );
}

function isImageType(
  value: string,
): value is ImageType {
  return (
    isPresentationImageSlot(
      value,
    ) ||
    value === "DESCRIPTION"
  );
}

// ============================================================================
// POSITION
// ============================================================================

function parseOptionalPosition(
  value: FormDataEntryValue | null,
):
  | number
  | null
  | "INVALID" {
  if (value === null) {
    return null;
  }

  if (
    typeof value !==
    "string"
  ) {
    return "INVALID";
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  if (
    !/^\d+$/.test(
      normalized,
    )
  ) {
    return "INVALID";
  }

  const position =
    Number(normalized);

  if (
    !Number.isSafeInteger(
      position,
    ) ||
    position < 0
  ) {
    return "INVALID";
  }

  return position;
}

// ============================================================================
// ALT TEXT
// ============================================================================

function buildPresentationAltText(
  title: string,
  slot: PresentationImageSlot,
) {
  const cleanTitle =
    title.trim() ||
    "Formation AfriSkill AI";

  return slot === "PRIMARY"
    ? `${cleanTitle} - image principale`
    : `${cleanTitle} - image secondaire`;
}

// ============================================================================
// CONFIGURATION SUPABASE
// ============================================================================

function getStorageConfig():
  StorageConfig {
  const supabaseUrl =
    cleanString(
      process.env.SUPABASE_URL,
    ).replace(/\/+$/, "");

  const secretKey =
    cleanString(
      process.env
        .SUPABASE_SECRET_KEY,
    );

  const bucket =
    cleanString(
      process.env
        .SUPABASE_COURSE_IMAGES_BUCKET,
    ) || DEFAULT_BUCKET;

  if (!supabaseUrl) {
    return {
      ok: false,
      error:
        "SUPABASE_URL est manquant.",
    };
  }

  if (
    !isHttpsUrl(
      supabaseUrl,
    )
  ) {
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
        "SUPABASE_COURSE_IMAGES_BUCKET est manquant.",
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
// UPLOAD SUPABASE STORAGE
// ============================================================================

async function uploadPublicImageToSupabase(
  input: {
    supabaseUrl: string;
    secretKey: string;
    bucket: string;
    storagePath: string;
    bytes: Uint8Array;
    contentType: string;
  },
): Promise<UploadResult> {
  const endpoint =
    createSupabaseObjectEndpoint(
      input.supabaseUrl,
      input.bucket,
      input.storagePath,
    );

  try {
    const response =
      await fetch(
        endpoint,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${input.secretKey}`,

            apikey:
              input.secretKey,

            "Content-Type":
              input.contentType,

            "x-upsert":
              "false",

            "Cache-Control":
              "no-store",
          },

          body:
            Buffer.from(
              input.bytes,
            ),

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

      publicUrl:
        createPublicStorageUrl(
          input.supabaseUrl,
          input.bucket,
          input.storagePath,
        ),
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
// ROLLBACK STORAGE
// ============================================================================

async function rollbackUploadedObject(
  input: {
    storageConfig: Extract<
      StorageConfig,
      { ok: true }
    >;

    storagePath: string;
    logKey: string;
  },
) {
  const rollbackResult =
    await deleteStorageObjects({
      supabaseUrl:
        input.storageConfig
          .supabaseUrl,

      secretKey:
        input.storageConfig
          .secretKey,

      bucket:
        input.storageConfig
          .bucket,

      storagePaths: [
        input.storagePath,
      ],
    });

  if (!rollbackResult.ok) {
    console.error(
      input.logKey,
      rollbackResult.error,
    );
  }
}

// ============================================================================
// NETTOYAGE D'UNE IMAGE PUBLIQUE
// ============================================================================

async function cleanupPublicImage(
  input: {
    publicUrl: string;

    storageConfig: Extract<
      StorageConfig,
      { ok: true }
    >;

    logKey: string;

    metadata?: Record<
      string,
      unknown
    >;
  },
) {
  const storagePath =
    getStoragePathFromPublicUrl(
      input.publicUrl,
      input.storageConfig
        .supabaseUrl,
      input.storageConfig
        .bucket,
    );

  if (!storagePath) {
    return;
  }

  const deleteResult =
    await deleteStorageObjects({
      supabaseUrl:
        input.storageConfig
          .supabaseUrl,

      secretKey:
        input.storageConfig
          .secretKey,

      bucket:
        input.storageConfig
          .bucket,

      storagePaths: [
        storagePath,
      ],
    });

  if (!deleteResult.ok) {
    console.error(
      input.logKey,
      {
        ...(input.metadata ?? {}),
        storagePath,
        error:
          deleteResult.error,
      },
    );
  }
}

async function removeStoredPublicImage(
  input: {
    publicUrl: string;

    storageConfig: Extract<
      StorageConfig,
      { ok: true }
    >;

    logKey: string;

    metadata?: Record<
      string,
      unknown
    >;
  },
) {
  const storagePath =
    getStoragePathFromPublicUrl(
      input.publicUrl,
      input.storageConfig
        .supabaseUrl,
      input.storageConfig
        .bucket,
    );

  if (!storagePath) {
    return false;
  }

  const deleteResult =
    await deleteStorageObjects({
      supabaseUrl:
        input.storageConfig
          .supabaseUrl,

      secretKey:
        input.storageConfig
          .secretKey,

      bucket:
        input.storageConfig
          .bucket,

      storagePaths: [
        storagePath,
      ],
    });

  if (!deleteResult.ok) {
    console.error(
      input.logKey,
      {
        ...(input.metadata ?? {}),
        storagePath,
        error:
          deleteResult.error,
      },
    );

    return true;
  }

  return false;
}

// ============================================================================
// SUPPRESSION SUPABASE STORAGE
// ============================================================================

async function deleteStorageObjects(
  input: {
    supabaseUrl: string;
    secretKey: string;
    bucket: string;
    storagePaths: string[];
  },
): Promise<DeleteResult> {
  if (
    input.storagePaths.length ===
    0
  ) {
    return {
      ok: true,
    };
  }

  const endpoint =
    `${input.supabaseUrl}` +
    `/storage/v1/object/` +
    `${encodeURIComponent(
      input.bucket,
    )}`;

  try {
    const response =
      await fetch(
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
// URL STORAGE
// ============================================================================

function createSupabaseObjectEndpoint(
  supabaseUrl: string,
  bucket: string,
  storagePath: string,
) {
  const encodedBucket =
    encodeURIComponent(
      bucket,
    );

  const encodedPath =
    storagePath
      .split("/")
      .map((segment) =>
        encodeURIComponent(
          segment,
        ),
      )
      .join("/");

  return (
    `${supabaseUrl}` +
    `/storage/v1/object/` +
    `${encodedBucket}/` +
    `${encodedPath}`
  );
}

function createPublicStorageUrl(
  supabaseUrl: string,
  bucket: string,
  storagePath: string,
) {
  const encodedBucket =
    encodeURIComponent(
      bucket,
    );

  const encodedPath =
    storagePath
      .split("/")
      .map((segment) =>
        encodeURIComponent(
          segment,
        ),
      )
      .join("/");

  return (
    `${supabaseUrl}` +
    `/storage/v1/object/public/` +
    `${encodedBucket}/` +
    `${encodedPath}`
  );
}

// ============================================================================
// EXTRACTION DU CHEMIN DEPUIS UNE URL PUBLIQUE
// ============================================================================

function getStoragePathFromPublicUrl(
  publicUrl: string,
  supabaseUrl: string,
  bucket: string,
): string | null {
  try {
    const url =
      new URL(publicUrl);

    const baseUrl =
      new URL(supabaseUrl);

    /*
     * On refuse de supprimer un fichier
     * provenant d'un autre domaine.
     */
    if (
      url.origin !==
      baseUrl.origin
    ) {
      return null;
    }

    const prefix =
      `/storage/v1/object/public/${encodeURIComponent(
        bucket,
      )}/`;

    if (
      !url.pathname.startsWith(
        prefix,
      )
    ) {
      return null;
    }

    const encodedPath =
      url.pathname.slice(
        prefix.length,
      );

    if (!encodedPath) {
      return null;
    }

    return encodedPath
      .split("/")
      .map((segment) =>
        decodeURIComponent(
          segment,
        ),
      )
      .join("/");
  } catch {
    return null;
  }
}

// ============================================================================
// ERREURS SUPABASE
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
// URL
// ============================================================================

function isHttpsUrl(
  value: string,
) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
      "https:"
    );
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
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

// ============================================================================
// RÉPONSES HTTP
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
        [field]:
          message,
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