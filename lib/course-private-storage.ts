import "server-only";

import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

/**
 * ============================================================================
 * AFRISKILL AI — COURSE PRIVATE STORAGE
 * ============================================================================
 *
 * RESPONSABILITÉ :
 *
 * - accéder au bucket privé contenant les ressources des formations ;
 * - supporter PDF, Word et ZIP ;
 * - supporter plusieurs fichiers par formation ;
 * - utiliser Supabase exclusivement côté serveur ;
 * - générer uniquement des URL signées temporaires ;
 * - ne jamais rendre le bucket public ;
 * - ne jamais exposer la clé Supabase serveur ;
 * - ne jamais retourner le chemin Storage brut au navigateur ;
 * - conserver la compatibilité avec l'ancien privatePdfPath ;
 * - fournir un adaptateur stable à lib/course-delivery.ts.
 *
 * IMPORTANT :
 *
 * Ce fichier ne décide PAS si un client a payé.
 *
 * La validation :
 *
 *   Order   = PAID
 *   Payment = PAID
 *
 * reste sous la responsabilité de lib/course-delivery.ts.
 *
 * ============================================================================
 */

/**
 * ============================================================================
 * CONSTANTES
 * ============================================================================
 */

export const DEFAULT_COURSE_FILE_SIGNED_URL_TTL_SECONDS =
  60 * 60;

/**
 * Alias historique.
 *
 * Ne pas supprimer :
 * d'autres fichiers peuvent encore importer cette constante.
 */
export const DEFAULT_COURSE_PDF_SIGNED_URL_TTL_SECONDS =
  DEFAULT_COURSE_FILE_SIGNED_URL_TTL_SECONDS;

const MIN_SIGNED_URL_TTL_SECONDS = 60;

const MAX_SIGNED_URL_TTL_SECONDS =
  60 * 60 * 24;

const MAX_STORAGE_PATH_LENGTH = 1024;

const MAX_FILENAME_LENGTH = 180;

const DEFAULT_PRIVATE_BUCKET =
  "course-files";

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

export type CoursePrivateFileType =
  | "PDF"
  | "WORD"
  | "ZIP";

export type CoursePrivateFileInput = {
  /**
   * Chemin privé relatif au bucket Supabase.
   *
   * Exemple :
   * formations/course-id/resources/file.pdf
   *
   * Il ne doit jamais s'agir d'une URL publique.
   */
  path: string;

  /**
   * Nom présenté au client lors du téléchargement.
   */
  filename?: string | null;

  /**
   * Type logique enregistré dans CourseFile.
   */
  type?: CoursePrivateFileType | null;

  /**
   * MIME enregistré en base.
   *
   * Informatif ici : la sécurité principale repose sur
   * le chemin privé + l'URL signée.
   */
  mimeType?: string | null;

  /**
   * Durée de validité de l'URL signée.
   */
  expiresInSeconds?: number;
};

export type CoursePrivateFileAccessResult = {
  url: string;
  filename: string;
  type: CoursePrivateFileType;
  mimeType: string | null;
  expiresInSeconds: number;
  expiresAt: Date;
};

/**
 * ============================================================================
 * COMPATIBILITÉ PDF HISTORIQUE
 * ============================================================================
 */

export type CoursePrivatePdfInput = {
  privatePdfPath: string;
  filename?: string | null;
  expiresInSeconds?: number;
};

export type CoursePrivatePdfAccess = {
  url: string;
  filename: string;
  expiresInSeconds: number;
  expiresAt: Date;
};

/**
 * ============================================================================
 * ADAPTATEUR PUBLIC INTERNE
 * ============================================================================
 *
 * createSignedPdfUrl() reste volontairement présent.
 *
 * lib/course-delivery.ts peut donc continuer à fonctionner pendant
 * la migration vers CourseFile.
 */

export interface CoursePrivateFileAccess {
  /**
   * Ancienne API.
   *
   * NE PAS SUPPRIMER.
   */
  createSignedPdfUrl(input: {
    privatePdfPath: string;
    filename?: string | null;
    expiresInSeconds?: number;
  }): Promise<{
    url: string;
    filename: string;
  }>;

  /**
   * Nouvelle API générique.
   */
  createSignedFileUrl(input: {
    path: string;
    filename?: string | null;
    type?: CoursePrivateFileType | null;
    mimeType?: string | null;
    expiresInSeconds?: number;
  }): Promise<{
    url: string;
    filename: string;
    type: CoursePrivateFileType;
    mimeType: string | null;
  }>;

  /**
   * Génération de plusieurs accès privés.
   */
  createSignedFileUrls(
    inputs: Array<{
      path: string;
      filename?: string | null;
      type?: CoursePrivateFileType | null;
      mimeType?: string | null;
      expiresInSeconds?: number;
    }>,
  ): Promise<
    Array<{
      url: string;
      filename: string;
      type: CoursePrivateFileType;
      mimeType: string | null;
    }>
  >;
}

/**
 * ============================================================================
 * ERREURS
 * ============================================================================
 */

export type CoursePrivateStorageErrorCode =
  | "STORAGE_CONFIGURATION_MISSING"
  | "STORAGE_CONFIGURATION_INVALID"
  | "STORAGE_PATH_INVALID"
  | "STORAGE_FILENAME_INVALID"
  | "STORAGE_FILE_TYPE_INVALID"
  | "STORAGE_SIGNED_URL_FAILED"
  | "STORAGE_SIGNED_URL_INVALID";

export class CoursePrivateStorageError extends Error {
  readonly code: CoursePrivateStorageErrorCode;

  constructor({
    code,
    message,
    cause,
  }: {
    code: CoursePrivateStorageErrorCode;
    message: string;
    cause?: unknown;
  }) {
    super(
      message,
      cause !== undefined
        ? {
            cause,
          }
        : undefined,
    );

    this.name =
      "CoursePrivateStorageError";

    this.code = code;
  }
}

/**
 * ============================================================================
 * ENVIRONNEMENT
 * ============================================================================
 */

function getEnvironmentVariable(
  ...names: string[]
): string | null {
  for (const name of names) {
    const value =
      process.env[name]?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}

function getRequiredEnvironmentVariable(
  names: string[],
): string {
  const value =
    getEnvironmentVariable(...names);

  if (!value) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_CONFIGURATION_MISSING",

      message:
        `Configuration Supabase manquante : ${names.join(
          " ou ",
        )}.`,
    });
  }

  return value;
}

/**
 * ============================================================================
 * SUPABASE URL
 * ============================================================================
 */

function getSupabaseUrl(): string {
  const value =
    getRequiredEnvironmentVariable([
      "SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_URL",
    ]);

  try {
    const url =
      new URL(value);

    if (
      process.env.NODE_ENV ===
        "production" &&
      url.protocol !== "https:"
    ) {
      throw new Error(
        "HTTPS_REQUIRED",
      );
    }

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      throw new Error(
        "INVALID_PROTOCOL",
      );
    }

    return url
      .toString()
      .replace(/\/+$/, "");
  } catch {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_CONFIGURATION_INVALID",

      message:
        "L'URL Supabase configurée est invalide.",
    });
  }
}

/**
 * ============================================================================
 * CLÉ SUPABASE SERVEUR
 * ============================================================================
 *
 * L'architecture actuelle utilise SUPABASE_SECRET_KEY.
 *
 * SUPABASE_SERVICE_ROLE_KEY reste accepté uniquement comme fallback
 * afin de ne pas casser une ancienne configuration déjà déployée.
 *
 * Aucune de ces clés ne doit porter NEXT_PUBLIC_.
 */

function getSupabaseServerSecret(): string {
  return getRequiredEnvironmentVariable([
    "SUPABASE_SECRET_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);
}

/**
 * ============================================================================
 * BUCKET PRIVÉ
 * ============================================================================
 *
 * Ordre :
 *
 * 1. SUPABASE_COURSE_FILES_BUCKET
 * 2. COURSE_PRIVATE_BUCKET
 * 3. course-files
 *
 * Cela aligne ce service sur la route admin multi-fichiers.
 */

function getPrivateBucketName(): string {
  const configuredBucket =
    getEnvironmentVariable(
      "SUPABASE_COURSE_FILES_BUCKET",
      "COURSE_PRIVATE_BUCKET",
    );

  const bucket =
    configuredBucket ??
    DEFAULT_PRIVATE_BUCKET;

  const normalized =
    bucket.trim();

  if (
    !normalized ||
    normalized.length > 100 ||
    normalized.includes("/") ||
    normalized.includes("\\")
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_CONFIGURATION_INVALID",

      message:
        "Le bucket privé des fichiers de formation est invalide.",
    });
  }

  return normalized;
}

/**
 * ============================================================================
 * CLIENT SUPABASE SERVEUR
 * ============================================================================
 */

let supabaseAdminClient:
  SupabaseClient | null = null;

let supabaseAdminClientSignature:
  string | null = null;

function getSupabaseAdminClient():
  SupabaseClient {
  const supabaseUrl =
    getSupabaseUrl();

  const serverSecret =
    getSupabaseServerSecret();

  /**
   * Permet de recréer proprement le client si l'environnement
   * change pendant certains scénarios de développement/test.
   *
   * On ne stocke pas la clé elle-même dans la signature.
   */
  const signature =
    `${supabaseUrl}:${serverSecret.length}`;

  if (
    supabaseAdminClient &&
    supabaseAdminClientSignature ===
      signature
  ) {
    return supabaseAdminClient;
  }

  supabaseAdminClient =
    createClient(
      supabaseUrl,
      serverSecret,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      },
    );

  supabaseAdminClientSignature =
    signature;

  return supabaseAdminClient;
}

/**
 * ============================================================================
 * NORMALISATION DU CHEMIN PRIVÉ
 * ============================================================================
 */

function normalizePrivateStoragePath(
  value: string,
): string {
  if (typeof value !== "string") {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "Le chemin privé du fichier est invalide.",
    });
  }

  let path =
    value.trim();

  if (
    !path ||
    path.length >
      MAX_STORAGE_PATH_LENGTH
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "Le chemin privé du fichier est vide ou trop long.",
    });
  }

  /**
   * Un chemin privé doit rester un chemin Storage.
   *
   * Les URL signées/publics/data/javascript sont refusées.
   */
  if (
    /^https?:\/\//i.test(path) ||
    /^data:/i.test(path) ||
    /^javascript:/i.test(path)
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "Le chemin privé doit contenir un chemin Storage et non une URL.",
    });
  }

  path = path
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");

  if (!path) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "Le chemin privé du fichier est invalide.",
    });
  }

  const segments =
    path.split("/");

  if (
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === "..",
    )
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "Le chemin privé contient un segment interdit.",
    });
  }

  if (
    /[\u0000-\u001F\u007F]/.test(
      path,
    )
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "Le chemin privé contient des caractères interdits.",
    });
  }

  return path;
}

/**
 * Alias historique interne.
 */

function normalizePrivatePdfPath(
  value: string,
): string {
  return normalizePrivateStoragePath(
    value,
  );
}

/**
 * ============================================================================
 * TYPE DE FICHIER
 * ============================================================================
 */

function inferFileTypeFromPath(
  path: string,
): CoursePrivateFileType {
  const lowerPath =
    path.toLowerCase();

  if (
    lowerPath.endsWith(".doc") ||
    lowerPath.endsWith(".docx")
  ) {
    return "WORD";
  }

  if (
    lowerPath.endsWith(".zip")
  ) {
    return "ZIP";
  }

  return "PDF";
}

function normalizeCourseFileType({
  type,
  path,
}: {
  type?:
    | CoursePrivateFileType
    | null;

  path: string;
}): CoursePrivateFileType {
  if (!type) {
    return inferFileTypeFromPath(
      path,
    );
  }

  if (
    type !== "PDF" &&
    type !== "WORD" &&
    type !== "ZIP"
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_FILE_TYPE_INVALID",

      message:
        "Le type du fichier privé est invalide.",
    });
  }

  return type;
}

/**
 * ============================================================================
 * NOM DU FICHIER
 * ============================================================================
 */

function getFilenameFromPath(
  path: string,
): string {
  const parts =
    path.split("/");

  return (
    parts[
      parts.length - 1
    ] ||
    "ressource-afriskill-ai"
  );
}

function getExpectedExtension({
  type,
  source,
}: {
  type: CoursePrivateFileType;
  source: string;
}):
  | ".pdf"
  | ".doc"
  | ".docx"
  | ".zip" {
  const lower =
    source.toLowerCase();

  switch (type) {
    case "PDF":
      return ".pdf";

    case "ZIP":
      return ".zip";

    case "WORD":
      return lower.endsWith(".doc")
        ? ".doc"
        : ".docx";
  }
}

function normalizePrivateFilename({
  filename,
  path,
  type,
}: {
  filename?:
    | string
    | null;

  path: string;

  type: CoursePrivateFileType;
}): string {
  const source =
    filename?.trim() ||
    getFilenameFromPath(path);

  const extension =
    getExpectedExtension({
      type,
      source:
        source || path,
    });

  let cleaned =
    source
      .replace(
        /[\u0000-\u001F\u007F]/g,
        "",
      )
      .replace(
        /[<>:"/\\|?*]/g,
        "-",
      )
      .replace(
        /\s+/g,
        " ",
      )
      .trim();

  if (!cleaned) {
    cleaned =
      `ressource-afriskill-ai${extension}`;
  }

  /**
   * On évite de créer :
   *
   * fichier.pdf.pdf
   * fichier.zip.zip
   *
   * et on corrige une extension incohérente avec le type.
   */
  const knownExtensionMatch =
    cleaned.match(
      /\.(pdf|docx?|zip)$/i,
    );

  if (knownExtensionMatch) {
    cleaned =
      cleaned.slice(
        0,
        -knownExtensionMatch[0]
          .length,
      );
  }

  cleaned =
    cleaned.trim();

  if (!cleaned) {
    cleaned =
      "ressource-afriskill-ai";
  }

  const maximumBaseLength =
    MAX_FILENAME_LENGTH -
    extension.length;

  if (
    cleaned.length >
    maximumBaseLength
  ) {
    cleaned =
      cleaned
        .slice(
          0,
          maximumBaseLength,
        )
        .trim();
  }

  cleaned += extension;

  if (
    !cleaned ||
    cleaned.length >
      MAX_FILENAME_LENGTH
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_FILENAME_INVALID",

      message:
        "Le nom du fichier privé est invalide.",
    });
  }

  return cleaned;
}

/**
 * Ancienne normalisation PDF.
 *
 * Conservée pour assurer une compatibilité maximale.
 */

function normalizePdfFilename({
  filename,
  path,
}: {
  filename?:
    | string
    | null;

  path: string;
}): string {
  return normalizePrivateFilename({
    filename,
    path,
    type: "PDF",
  });
}

/**
 * ============================================================================
 * MIME
 * ============================================================================
 */

function normalizeMimeType(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const normalized =
    value
      .trim()
      .toLowerCase();

  if (
    !normalized ||
    normalized.length > 255 ||
    /[\u0000-\u001F\u007F]/.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

/**
 * ============================================================================
 * DURÉE URL SIGNÉE
 * ============================================================================
 */

function normalizeExpiresInSeconds(
  value:
    | number
    | undefined,
): number {
  if (value === undefined) {
    return DEFAULT_COURSE_FILE_SIGNED_URL_TTL_SECONDS;
  }

  if (
    !Number.isFinite(value)
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_CONFIGURATION_INVALID",

      message:
        "La durée de validité de l'URL signée est invalide.",
    });
  }

  const seconds =
    Math.floor(value);

  if (
    seconds <
      MIN_SIGNED_URL_TTL_SECONDS ||
    seconds >
      MAX_SIGNED_URL_TTL_SECONDS
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_CONFIGURATION_INVALID",

      message:
        `La durée de validité doit être comprise entre ${MIN_SIGNED_URL_TTL_SECONDS} et ${MAX_SIGNED_URL_TTL_SECONDS} secondes.`,
    });
  }

  return seconds;
}

/**
 * ============================================================================
 * VALIDATION URL SIGNÉE
 * ============================================================================
 */

function assertSignedUrl(
  value:
    | string
    | null
    | undefined,
): string {
  const normalized =
    value?.trim();

  if (!normalized) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_SIGNED_URL_INVALID",

      message:
        "Supabase n'a retourné aucune URL signée.",
    });
  }

  try {
    const url =
      new URL(normalized);

    if (
      process.env.NODE_ENV ===
        "production" &&
      url.protocol !== "https:"
    ) {
      throw new Error(
        "HTTPS_REQUIRED",
      );
    }

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      throw new Error(
        "INVALID_PROTOCOL",
      );
    }

    return url.toString();
  } catch {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_SIGNED_URL_INVALID",

      message:
        "L'URL signée retournée par Supabase est invalide.",
    });
  }
}

/**
 * ============================================================================
 * GÉNÉRATION D'UN ACCÈS PRIVÉ GÉNÉRIQUE
 * ============================================================================
 */

export async function createCoursePrivateFileAccess(
  input: CoursePrivateFileInput,
): Promise<CoursePrivateFileAccessResult> {
  const path =
    normalizePrivateStoragePath(
      input.path,
    );

  const type =
    normalizeCourseFileType({
      type:
        input.type,
      path,
    });

  const filename =
    normalizePrivateFilename({
      filename:
        input.filename,

      path,

      type,
    });

  const mimeType =
    normalizeMimeType(
      input.mimeType,
    );

  const expiresInSeconds =
    normalizeExpiresInSeconds(
      input.expiresInSeconds,
    );

  const bucket =
    getPrivateBucketName();

  const supabase =
    getSupabaseAdminClient();

  try {
    /**
     * createSignedUrl() ne rend jamais le fichier public.
     *
     * Supabase fournit uniquement un accès temporaire.
     */
    const {
      data,
      error,
    } =
      await supabase.storage
        .from(bucket)
        .createSignedUrl(
          path,
          expiresInSeconds,
          {
            download:
              filename,
          },
        );

    if (error) {
      /**
       * Ne jamais logger :
       *
       * - la clé Supabase ;
       * - l'URL signée ;
       * - le contenu du fichier ;
       * - le chemin privé.
       */
      console.error(
        "[COURSE_PRIVATE_STORAGE_SIGN_FAILED]",
        {
          name:
            error.name,

          message:
            error.message,

          bucket,

          type,
        },
      );

      throw new CoursePrivateStorageError({
        code:
          "STORAGE_SIGNED_URL_FAILED",

        message:
          "Impossible de générer l'accès sécurisé à une ressource de la formation.",

        cause:
          error,
      });
    }

    const url =
      assertSignedUrl(
        data?.signedUrl,
      );

    const expiresAt =
      new Date(
        Date.now() +
          expiresInSeconds *
            1000,
      );

    return {
      url,
      filename,
      type,
      mimeType,
      expiresInSeconds,
      expiresAt,
    };
  } catch (error) {
    if (
      error instanceof
      CoursePrivateStorageError
    ) {
      throw error;
    }

    console.error(
      "[COURSE_PRIVATE_STORAGE_ERROR]",
      error instanceof Error
        ? {
            name:
              error.name,

            message:
              error.message,

            bucket,

            type,
          }
        : {
            bucket,
            type,
          },
    );

    throw new CoursePrivateStorageError({
      code:
        "STORAGE_SIGNED_URL_FAILED",

      message:
        "Impossible de préparer l'accès sécurisé à une ressource de la formation.",

      cause:
        error,
    });
  }
}

/**
 * ============================================================================
 * GÉNÉRATION DE PLUSIEURS ACCÈS
 * ============================================================================
 *
 * Utilisé lorsqu'une formation contient plusieurs CourseFile.
 *
 * Chaque fichier reçoit sa propre URL signée.
 */

export async function createCoursePrivateFileAccesses(
  inputs: CoursePrivateFileInput[],
): Promise<CoursePrivateFileAccessResult[]> {
  if (!Array.isArray(inputs)) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "La liste des fichiers privés est invalide.",
    });
  }

  if (inputs.length === 0) {
    return [];
  }

  /**
   * Une formation peut avoir plusieurs ressources.
   *
   * Promise.all est adapté ici car chaque signature est indépendante
   * et aucun état métier n'est modifié.
   */
  return Promise.all(
    inputs.map((input) =>
      createCoursePrivateFileAccess(
        input,
      ),
    ),
  );
}

/**
 * ============================================================================
 * COMPATIBILITÉ AVEC L'ANCIEN PDF
 * ============================================================================
 *
 * Cette fonction conserve exactement le contrat déjà utilisé ailleurs :
 *
 * createCoursePrivatePdfAccess({
 *   privatePdfPath,
 *   filename
 * })
 *
 * Aucun appel existant n'a besoin d'être modifié immédiatement.
 */

export async function createCoursePrivatePdfAccess(
  input: CoursePrivatePdfInput,
): Promise<CoursePrivatePdfAccess> {
  const privatePdfPath =
    normalizePrivatePdfPath(
      input.privatePdfPath,
    );

  const filename =
    normalizePdfFilename({
      filename:
        input.filename,

      path:
        privatePdfPath,
    });

  const result =
    await createCoursePrivateFileAccess({
      path:
        privatePdfPath,

      filename,

      type:
        "PDF",

      mimeType:
        "application/pdf",

      expiresInSeconds:
        input.expiresInSeconds,
    });

  return {
    url:
      result.url,

    filename:
      result.filename,

    expiresInSeconds:
      result.expiresInSeconds,

    expiresAt:
      result.expiresAt,
  };
}

/**
 * ============================================================================
 * ADAPTATEUR POUR lib/course-delivery.ts
 * ============================================================================
 *
 * Ancien :
 *
 * coursePrivateFileAccess.createSignedPdfUrl(...)
 *
 * Nouveau :
 *
 * coursePrivateFileAccess.createSignedFileUrl(...)
 *
 * Multi :
 *
 * coursePrivateFileAccess.createSignedFileUrls(...)
 *
 * L'ancienne méthode reste disponible pour éviter toute cassure pendant
 * la migration du système de livraison.
 */

export const coursePrivateFileAccess:
  CoursePrivateFileAccess = {
  async createSignedPdfUrl({
    privatePdfPath,
    filename,
    expiresInSeconds,
  }) {
    const result =
      await createCoursePrivatePdfAccess({
        privatePdfPath,
        filename,
        expiresInSeconds,
      });

    return {
      url:
        result.url,

      filename:
        result.filename,
    };
  },

  async createSignedFileUrl({
    path,
    filename,
    type,
    mimeType,
    expiresInSeconds,
  }) {
    const result =
      await createCoursePrivateFileAccess({
        path,
        filename,
        type,
        mimeType,
        expiresInSeconds,
      });

    return {
      url:
        result.url,

      filename:
        result.filename,

      type:
        result.type,

      mimeType:
        result.mimeType,
    };
  },

  async createSignedFileUrls(
    inputs,
  ) {
    const results =
      await createCoursePrivateFileAccesses(
        inputs,
      );

    return results.map(
      (result) => ({
        url:
          result.url,

        filename:
          result.filename,

        type:
          result.type,

        mimeType:
          result.mimeType,
      }),
    );
  },
};