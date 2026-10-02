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
 * Fichier :
 * lib/course-private-storage.ts
 *
 * RESPONSABILITÉ :
 *
 * - accéder au bucket privé contenant les PDF des formations ;
 * - utiliser Supabase exclusivement côté serveur ;
 * - utiliser la Service Role Key uniquement côté serveur ;
 * - recevoir le privatePdfPath enregistré en base de données ;
 * - générer une URL signée temporaire pour le PDF ;
 * - ne jamais transformer le bucket en bucket public ;
 * - ne jamais exposer la Service Role Key ;
 * - ne jamais retourner le chemin privé brut au navigateur ;
 * - fournir un adaptateur utilisable par lib/course-delivery.ts.
 *
 * IMPORTANT :
 *
 * Ce fichier ne décide PAS si un client a payé.
 *
 * La vérification :
 *
 *   Order = PAID
 *   Payment = PAID
 *
 * reste sous la responsabilité de lib/course-delivery.ts.
 *
 * Ce service doit donc être appelé uniquement après validation serveur
 * du paiement.
 * ============================================================================
 */

/**
 * ============================================================================
 * CONSTANTES
 * ============================================================================
 */

/**
 * Durée par défaut d'une URL signée.
 *
 * 1 heure.
 *
 * Une URL signée ne doit pas devenir une URL permanente.
 */
export const DEFAULT_COURSE_PDF_SIGNED_URL_TTL_SECONDS =
  60 * 60;

/**
 * Limites raisonnables.
 */
const MIN_SIGNED_URL_TTL_SECONDS =
  60;

const MAX_SIGNED_URL_TTL_SECONDS =
  60 * 60 * 24;

const MAX_STORAGE_PATH_LENGTH =
  1024;

const MAX_FILENAME_LENGTH =
  180;

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

export type CoursePrivatePdfInput = {
  /**
   * Chemin privé enregistré dans Course.privatePdfPath.
   *
   * Exemple :
   *
   * courses/abc123/formation.pdf
   *
   * Il ne doit PAS s'agir d'une URL publique.
   */
  privatePdfPath: string;

  /**
   * Nom du fichier présenté au client.
   *
   * Exemple :
   *
   * Formation-AfriSkill-AI.pdf
   */
  filename?: string | null;

  /**
   * Durée de validité de l'URL signée.
   *
   * Facultatif.
   */
  expiresInSeconds?: number;
};

export type CoursePrivatePdfAccess = {
  /**
   * URL HTTPS temporaire signée.
   */
  url: string;

  /**
   * Nom propre du fichier.
   */
  filename: string;

  /**
   * Durée de validité en secondes.
   */
  expiresInSeconds: number;

  /**
   * Date d'expiration informative.
   */
  expiresAt: Date;
};

/**
 * Contrat attendu par lib/course-delivery.ts.
 */
export interface CoursePrivateFileAccess {
  createSignedPdfUrl(input: {
    privatePdfPath: string;
    filename?: string | null;
    expiresInSeconds?: number;
  }): Promise<{
    url: string;
    filename: string;
  }>;
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
  | "STORAGE_SIGNED_URL_FAILED"
  | "STORAGE_SIGNED_URL_INVALID";

export class CoursePrivateStorageError extends Error {
  readonly code:
    CoursePrivateStorageErrorCode;

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

    this.code =
      code;
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
    getEnvironmentVariable(
      ...names,
    );

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
 *
 * On accepte plusieurs noms afin de rester compatible avec
 * l'architecture existante du projet.
 *
 * La préférence va à SUPABASE_URL côté serveur.
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
      url.protocol !== "https:" &&
      process.env.NODE_ENV ===
        "production"
    ) {
      throw new Error(
        "HTTPS_REQUIRED",
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
 * SERVICE ROLE KEY
 * ============================================================================
 *
 * IMPORTANT :
 *
 * Cette clé contourne les politiques RLS lorsqu'elle est utilisée
 * correctement côté serveur.
 *
 * Elle ne doit JAMAIS porter le préfixe NEXT_PUBLIC_.
 * ============================================================================
 */

function getSupabaseServiceRoleKey(): string {
  return getRequiredEnvironmentVariable([
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);
}

/**
 * ============================================================================
 * BUCKET PRIVÉ
 * ============================================================================
 */

function getPrivateBucketName(): string {
  const bucket =
    getRequiredEnvironmentVariable([
      "COURSE_PRIVATE_BUCKET",
    ]);

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
        "COURSE_PRIVATE_BUCKET est invalide.",
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
  SupabaseClient | null =
  null;

function getSupabaseAdminClient():
  SupabaseClient {
  if (supabaseAdminClient) {
    return supabaseAdminClient;
  }

  supabaseAdminClient =
    createClient(
      getSupabaseUrl(),
      getSupabaseServiceRoleKey(),
      {
        auth: {
          /**
           * Ce client est un client serveur technique.
           *
           * Il ne doit jamais maintenir de session utilisateur.
           */
          persistSession:
            false,

          autoRefreshToken:
            false,

          detectSessionInUrl:
            false,
        },
      },
    );

  return supabaseAdminClient;
}

/**
 * ============================================================================
 * NORMALISATION DU CHEMIN PRIVÉ
 * ============================================================================
 */

function normalizePrivatePdfPath(
  value: string,
): string {
  if (
    typeof value !== "string"
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "Le chemin privé du PDF est invalide.",
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
        "Le chemin privé du PDF est vide ou trop long.",
    });
  }

  /**
   * privatePdfPath doit être un chemin de stockage,
   * jamais une URL.
   */
  if (
    /^https?:\/\//i.test(
      path,
    ) ||
    /^data:/i.test(
      path,
    ) ||
    /^javascript:/i.test(
      path,
    )
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "privatePdfPath doit contenir un chemin de stockage privé et non une URL.",
    });
  }

  /**
   * Supabase attend le chemin relatif au bucket.
   */
  path =
    path
      .replace(
        /\\/g,
        "/",
      )
      .replace(
        /^\/+/,
        "",
      );

  if (!path) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "Le chemin privé du PDF est invalide.",
    });
  }

  /**
   * Empêche les segments suspects.
   */
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
        "Le chemin privé du PDF contient un segment interdit.",
    });
  }

  /**
   * Protection contre caractères de contrôle.
   */
  if (
    /[\u0000-\u001F\u007F]/.test(
      path,
    )
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_PATH_INVALID",

      message:
        "Le chemin privé du PDF contient des caractères interdits.",
    });
  }

  return path;
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

  const lastPart =
    parts[
      parts.length - 1
    ];

  return (
    lastPart ||
    "formation-afriskill-ai.pdf"
  );
}

function normalizePdfFilename({
  filename,
  path,
}: {
  filename?:
    | string
    | null;

  path: string;
}): string {
  const source =
    filename?.trim() ||
    getFilenameFromPath(
      path,
    );

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
      "formation-afriskill-ai.pdf";
  }

  if (
    cleaned.length >
    MAX_FILENAME_LENGTH
  ) {
    const extension =
      cleaned
        .toLowerCase()
        .endsWith(".pdf")
        ? ".pdf"
        : "";

    const maxBaseLength =
      MAX_FILENAME_LENGTH -
      extension.length;

    cleaned =
      cleaned
        .slice(
          0,
          maxBaseLength,
        )
        .trim();

    cleaned +=
      extension;
  }

  if (
    !cleaned
      .toLowerCase()
      .endsWith(".pdf")
  ) {
    cleaned +=
      ".pdf";
  }

  if (
    cleaned.length >
    MAX_FILENAME_LENGTH
  ) {
    cleaned =
      `${cleaned.slice(
        0,
        MAX_FILENAME_LENGTH -
          4,
      )}.pdf`;
  }

  if (!cleaned) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_FILENAME_INVALID",

      message:
        "Le nom du PDF est invalide.",
    });
  }

  return cleaned;
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
  if (
    value === undefined
  ) {
    return DEFAULT_COURSE_PDF_SIGNED_URL_TTL_SECONDS;
  }

  if (
    !Number.isFinite(
      value,
    )
  ) {
    throw new CoursePrivateStorageError({
      code:
        "STORAGE_CONFIGURATION_INVALID",

      message:
        "La durée de validité de l'URL signée est invalide.",
    });
  }

  const seconds =
    Math.floor(
      value,
    );

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
      new URL(
        normalized,
      );

    /**
     * En production, aucune URL HTTP.
     */
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
 * GÉNÉRATION DE L'URL SIGNÉE
 * ============================================================================
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
     * createSignedUrl() ne rend PAS le fichier public.
     *
     * Supabase génère uniquement un accès temporaire.
     */
    const {
      data,
      error,
    } =
      await supabase.storage
        .from(
          bucket,
        )
        .createSignedUrl(
          privatePdfPath,
          expiresInSeconds,
          {
            /**
             * Demande au navigateur de présenter
             * un nom de téléchargement propre.
             */
            download:
              filename,
          },
        );

    if (error) {
      /**
       * Ne pas logger :
       *
       * - la Service Role Key ;
       * - l'URL signée ;
       * - le contenu du PDF.
       *
       * Le chemin n'est pas non plus envoyé au client.
       */
      console.error(
        "[COURSE_PRIVATE_STORAGE_SIGN_FAILED]",
        {
          name:
            error.name,

          message:
            error.message,

          bucket,
        },
      );

      throw new CoursePrivateStorageError({
        code:
          "STORAGE_SIGNED_URL_FAILED",

        message:
          "Impossible de générer l'accès sécurisé au PDF de la formation.",

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
          }
        : {
            bucket,
          },
    );

    throw new CoursePrivateStorageError({
      code:
        "STORAGE_SIGNED_URL_FAILED",

      message:
        "Impossible de préparer le PDF sécurisé de la formation.",

      cause:
        error,
    });
  }
}

/**
 * ============================================================================
 * ADAPTATEUR POUR lib/course-delivery.ts
 * ============================================================================
 *
 * Cet objet sera injecté directement dans deliverPaidOrder().
 *
 * Exemple :
 *
 * await deliverPaidOrder({
 *   orderId,
 *   paymentId,
 *   emailSender: courseDeliveryEmailSender,
 *   privateFileAccess: coursePrivateFileAccess,
 * });
 *
 * ============================================================================
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
};