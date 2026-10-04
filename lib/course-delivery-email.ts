import "server-only";

import { Resend } from "resend";

/**
 * ============================================================================
 * AFRISKILL AI — COURSE DELIVERY EMAIL
 * ============================================================================
 *
 * Fichier :
 * lib/course-delivery-email.ts
 *
 * RESPONSABILITÉ :
 *
 * Envoyer l'e-mail transactionnel final après confirmation réelle
 * du paiement d'une formation.
 *
 * Ce service :
 *
 * - fonctionne exclusivement côté serveur ;
 * - utilise Resend ;
 * - envoie une version HTML professionnelle ;
 * - envoie également une version texte ;
 * - affiche le logo AfriSkill AI ;
 * - fournit le lien privé de la formation ;
 * - prend en charge plusieurs fichiers privés ;
 * - prend en charge PDF, Word, ZIP et autres ressources autorisées ;
 * - conserve la compatibilité avec l'ancien champ `pdf` ;
 * - retourne l'identifiant Resend du message ;
 * - ne confirme JAMAIS lui-même un paiement ;
 * - ne lit jamais directement un chemin privé Supabase ;
 * - ne doit être appelé qu'après validation serveur du paiement.
 *
 * IMPORTANT :
 *
 * Tous les fichiers reçus ici doivent déjà avoir été transformés
 * en URL HTTPS temporaire et sécurisée par le service de stockage privé.
 *
 * ============================================================================
 */

/**
 * ============================================================================
 * CONSTANTES
 * ============================================================================
 */

const BRAND_NAME = "AfriSkill AI";

const DEFAULT_APP_URL =
  "https://afriskill-ai.com";

const DEFAULT_SUPPORT_EMAIL =
  "contact@afriskill-ai.com";

const DEFAULT_FROM_EMAIL =
  "AfriSkill AI <formation@afriskill-ai.com>";

const LOGO_PATH =
  "/logo/logo.png";

const MAX_EMAIL_LENGTH =
  320;

const MAX_NAME_LENGTH =
  160;

const MAX_TITLE_LENGTH =
  300;

const MAX_REFERENCE_LENGTH =
  200;

const MAX_FILENAME_LENGTH =
  180;

const MAX_FILES_PER_EMAIL =
  100;

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

/**
 * Types fonctionnels supportés par l'e-mail.
 *
 * Les valeurs correspondent à l'architecture CourseFile.
 * OTHER permet de rester robuste si un nouveau type de fichier
 * est introduit ultérieurement.
 */
export type CourseDeliveryEmailFileType =
  | "PDF"
  | "WORD"
  | "ZIP"
  | "OTHER";

/**
 * Ancien contrat conservé pour rétrocompatibilité.
 */
export type CourseDeliveryEmailAttachment = {
  /**
   * Nom présenté au client.
   */
  filename: string;

  /**
   * URL HTTPS temporaire et sécurisée.
   */
  url: string;
};

/**
 * Nouveau contrat multi-fichiers.
 */
export type CourseDeliveryEmailFile = {
  /**
   * Identifiant éventuel de la ressource.
   */
  id?: string;

  /**
   * Type fonctionnel.
   */
  type: CourseDeliveryEmailFileType;

  /**
   * Nom présenté au client.
   */
  filename: string;

  /**
   * URL HTTPS temporaire et sécurisée.
   */
  url: string;

  /**
   * Taille éventuelle en octets.
   */
  size?: number | null;

  /**
   * MIME type éventuel.
   */
  mimeType?: string | null;

  /**
   * Position d'affichage.
   */
  position?: number;
};

export type CourseDeliveryEmailInput = {
  /**
   * Destinataire.
   */
  recipientEmail: string;

  /**
   * Informations client.
   */
  customerFirstName?: string | null;
  customerLastName?: string | null;

  /**
   * Informations de commande.
   */
  orderReference: string;

  /**
   * Formation achetée.
   */
  courseTitle: string;

  /**
   * Lien privé configuré dans l'administration.
   */
  privateAccessUrl?: string | null;

  /**
   * Nouveau système multi-fichiers.
   *
   * Ces URLs doivent déjà être temporaires et sécurisées.
   */
  files?: CourseDeliveryEmailFile[] | null;

  /**
   * Ancien système mono-PDF.
   *
   * Conservé temporairement pour assurer la rétrocompatibilité
   * avec les formations ou appels existants.
   */
  pdf?: CourseDeliveryEmailAttachment | null;
};

export type CourseDeliveryEmailResult = {
  providerMessageId: string;
};

export interface CourseDeliveryEmailSender {
  sendCourseDeliveryEmail(
    input: CourseDeliveryEmailInput,
  ): Promise<CourseDeliveryEmailResult>;
}

type CourseDeliveryEmailErrorCode =
  | "EMAIL_CONFIGURATION_MISSING"
  | "EMAIL_INPUT_INVALID"
  | "EMAIL_DELIVERY_CONTENT_MISSING"
  | "EMAIL_PROVIDER_REJECTED"
  | "EMAIL_PROVIDER_RESPONSE_INVALID"
  | "EMAIL_SEND_FAILED";

/**
 * ============================================================================
 * ERREUR MÉTIER
 * ============================================================================
 */

export class CourseDeliveryEmailError extends Error {
  readonly code:
    CourseDeliveryEmailErrorCode;

  constructor({
    code,
    message,
    cause,
  }: {
    code: CourseDeliveryEmailErrorCode;
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
      "CourseDeliveryEmailError";

    this.code =
      code;
  }
}

/**
 * ============================================================================
 * ENVIRONNEMENT
 * ============================================================================
 */

function getRequiredEnvironmentVariable(
  name: string,
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new CourseDeliveryEmailError({
      code:
        "EMAIL_CONFIGURATION_MISSING",

      message:
        `Configuration e-mail manquante : ${name}.`,
    });
  }

  return value;
}

function getOptionalEnvironmentVariable(
  name: string,
): string | null {
  const value =
    process.env[name]?.trim();

  return value || null;
}

/**
 * ============================================================================
 * CONFIGURATION RESEND
 * ============================================================================
 */

function getResendApiKey(): string {
  return getRequiredEnvironmentVariable(
    "RESEND_API_KEY",
  );
}

function getMailFrom(): string {
  return (
    getOptionalEnvironmentVariable(
      "COURSE_DELIVERY_FROM_EMAIL",
    ) ||
    getOptionalEnvironmentVariable(
      "RESEND_FROM_EMAIL",
    ) ||
    DEFAULT_FROM_EMAIL
  );
}

function getReplyTo(): string {
  return (
    getOptionalEnvironmentVariable(
      "COURSE_DELIVERY_REPLY_TO",
    ) ||
    getOptionalEnvironmentVariable(
      "MAIL_REPLY_TO_SUPPORT",
    ) ||
    getOptionalEnvironmentVariable(
      "RESEND_REPLY_TO_EMAIL",
    ) ||
    DEFAULT_SUPPORT_EMAIL
  );
}

function getAppUrl(): string {
  const value =
    getOptionalEnvironmentVariable(
      "NEXT_PUBLIC_APP_URL",
    ) ||
    getOptionalEnvironmentVariable(
      "APP_URL",
    ) ||
    DEFAULT_APP_URL;

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
    throw new CourseDeliveryEmailError({
      code:
        "EMAIL_CONFIGURATION_MISSING",

      message:
        "NEXT_PUBLIC_APP_URL est invalide.",
    });
  }
}

function getLogoUrl(): string {
  return `${getAppUrl()}${LOGO_PATH}`;
}

/**
 * ============================================================================
 * CLIENT RESEND
 * ============================================================================
 */

let resendClient:
  Resend | null =
  null;

function getResendClient(): Resend {
  if (resendClient) {
    return resendClient;
  }

  resendClient =
    new Resend(
      getResendApiKey(),
    );

  return resendClient;
}

/**
 * ============================================================================
 * NORMALISATION
 * ============================================================================
 */

function normalizeText(
  value:
    | string
    | null
    | undefined,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  return normalized || null;
}

function requireText({
  value,
  field,
  maxLength,
}: {
  value:
    | string
    | null
    | undefined;
  field: string;
  maxLength: number;
}): string {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    throw new CourseDeliveryEmailError({
      code:
        "EMAIL_INPUT_INVALID",

      message:
        `Le champ ${field} est obligatoire.`,
    });
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new CourseDeliveryEmailError({
      code:
        "EMAIL_INPUT_INVALID",

      message:
        `Le champ ${field} est trop long.`,
    });
  }

  return normalized;
}

function normalizeEmail(
  value: string,
): string {
  const email =
    value
      .trim()
      .toLowerCase();

  if (
    email.length >
      MAX_EMAIL_LENGTH ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    )
  ) {
    throw new CourseDeliveryEmailError({
      code:
        "EMAIL_INPUT_INVALID",

      message:
        "L'adresse e-mail du destinataire est invalide.",
    });
  }

  return email;
}

function normalizeHttpsUrl(
  value:
    | string
    | null
    | undefined,
): string | null {
  const normalized =
    normalizeText(value);

  if (!normalized) {
    return null;
  }

  try {
    const url =
      new URL(normalized);

    if (
      url.protocol !== "https:"
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

/**
 * ============================================================================
 * SÉCURITÉ HTML
 * ============================================================================
 */

function escapeHtml(
  value: string,
): string {
  return value
    .replace(
      /&/g,
      "&amp;",
    )
    .replace(
      /</g,
      "&lt;",
    )
    .replace(
      />/g,
      "&gt;",
    )
    .replace(
      /"/g,
      "&quot;",
    )
    .replace(
      /'/g,
      "&#039;",
    );
}

/**
 * ============================================================================
 * NOM DU CLIENT
 * ============================================================================
 */

function getCustomerDisplayName({
  firstName,
  lastName,
}: {
  firstName?:
    | string
    | null;
  lastName?:
    | string
    | null;
}): string {
  const safeFirstName =
    normalizeText(
      firstName,
    );

  const safeLastName =
    normalizeText(
      lastName,
    );

  const fullName =
    [
      safeFirstName,
      safeLastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  if (!fullName) {
    return "cher client";
  }

  return fullName.slice(
    0,
    MAX_NAME_LENGTH,
  );
}

/**
 * ============================================================================
 * FICHIERS
 * ============================================================================
 */

function normalizeFilename(
  filename:
    | string
    | null
    | undefined,
  fallback = "ressource-afriskill-ai",
): string {
  const normalized =
    normalizeText(
      filename,
    );

  if (!normalized) {
    return fallback;
  }

  const cleaned =
    normalized
      .replace(
        /[\r\n\t]/g,
        " ",
      )
      .replace(
        /[<>:"/\\|?*]/g,
        "-",
      )
      .replace(
        /\s+/g,
        " ",
      )
      .trim()
      .slice(
        0,
        MAX_FILENAME_LENGTH,
      );

  return cleaned || fallback;
}

function normalizePdfFilename(
  filename:
    | string
    | null
    | undefined,
): string {
  const cleaned =
    normalizeFilename(
      filename,
      "formation-afriskill-ai.pdf",
    );

  return cleaned
    .toLowerCase()
    .endsWith(".pdf")
    ? cleaned
    : `${cleaned}.pdf`;
}

function normalizeFileType(
  value:
    | string
    | null
    | undefined,
): CourseDeliveryEmailFileType {
  const normalized =
    normalizeText(value)
      ?.toUpperCase();

  if (
    normalized === "PDF" ||
    normalized === "WORD" ||
    normalized === "ZIP"
  ) {
    return normalized;
  }

  return "OTHER";
}

function normalizeFilePosition(
  value:
    | number
    | null
    | undefined,
  fallback: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return fallback;
  }

  return Math.max(
    0,
    Math.trunc(value),
  );
}

function normalizeFileSize(
  value:
    | number
    | null
    | undefined,
): number | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0
  ) {
    return null;
  }

  return Math.trunc(value);
}

function formatFileSize(
  size:
    | number
    | null
    | undefined,
): string | null {
  if (
    typeof size !== "number" ||
    !Number.isFinite(size) ||
    size < 0
  ) {
    return null;
  }

  if (size < 1024) {
    return `${size} octets`;
  }

  if (size < 1024 * 1024) {
    return `${(
      size / 1024
    ).toFixed(1)} Ko`;
  }

  if (
    size <
    1024 * 1024 * 1024
  ) {
    return `${(
      size /
      (1024 * 1024)
    ).toFixed(1)} Mo`;
  }

  return `${(
    size /
    (1024 * 1024 * 1024)
  ).toFixed(2)} Go`;
}

function getFileTypeLabel(
  type: CourseDeliveryEmailFileType,
): string {
  switch (type) {
    case "PDF":
      return "PDF";

    case "WORD":
      return "WORD";

    case "ZIP":
      return "ZIP";

    default:
      return "FICHIER";
  }
}

function getFileActionLabel(
  type: CourseDeliveryEmailFileType,
): string {
  switch (type) {
    case "PDF":
      return "Ouvrir le PDF";

    case "WORD":
      return "Télécharger";

    case "ZIP":
      return "Télécharger";

    default:
      return "Télécharger";
  }
}

/**
 * ============================================================================
 * DONNÉES NORMALISÉES
 * ============================================================================
 */

type NormalizedDeliveryEmailFile = {
  id: string | null;
  type: CourseDeliveryEmailFileType;
  filename: string;
  url: string;
  size: number | null;
  mimeType: string | null;
  position: number;
};

type NormalizedDeliveryEmailInput = {
  recipientEmail: string;

  customerDisplayName: string;

  orderReference: string;

  courseTitle: string;

  privateAccessUrl:
    | string
    | null;

  files:
    NormalizedDeliveryEmailFile[];
};

function normalizeInput(
  input: CourseDeliveryEmailInput,
): NormalizedDeliveryEmailInput {
  const recipientEmail =
    normalizeEmail(
      requireText({
        value:
          input.recipientEmail,

        field:
          "recipientEmail",

        maxLength:
          MAX_EMAIL_LENGTH,
      }),
    );

  const orderReference =
    requireText({
      value:
        input.orderReference,

      field:
        "orderReference",

      maxLength:
        MAX_REFERENCE_LENGTH,
    });

  const courseTitle =
    requireText({
      value:
        input.courseTitle,

      field:
        "courseTitle",

      maxLength:
        MAX_TITLE_LENGTH,
    });

  const privateAccessUrl =
    normalizeHttpsUrl(
      input.privateAccessUrl,
    );

  if (
    input.privateAccessUrl &&
    !privateAccessUrl
  ) {
    throw new CourseDeliveryEmailError({
      code:
        "EMAIL_INPUT_INVALID",

      message:
        "Le lien privé de la formation est invalide.",
    });
  }

  const normalizedFiles:
    NormalizedDeliveryEmailFile[] =
    [];

  const incomingFiles =
    Array.isArray(
      input.files,
    )
      ? input.files
      : [];

  if (
    incomingFiles.length >
    MAX_FILES_PER_EMAIL
  ) {
    throw new CourseDeliveryEmailError({
      code:
        "EMAIL_INPUT_INVALID",

      message:
        `Le nombre de fichiers dépasse la limite autorisée de ${MAX_FILES_PER_EMAIL}.`,
    });
  }

  for (
    let index = 0;
    index < incomingFiles.length;
    index += 1
  ) {
    const file =
      incomingFiles[index];

    if (!file) {
      continue;
    }

    const fileUrl =
      normalizeHttpsUrl(
        file.url,
      );

    if (!fileUrl) {
      throw new CourseDeliveryEmailError({
        code:
          "EMAIL_INPUT_INVALID",

        message:
          `L'URL temporaire du fichier n°${index + 1} est invalide.`,
      });
    }

    normalizedFiles.push({
      id:
        normalizeText(
          file.id,
        ),

      type:
        normalizeFileType(
          file.type,
        ),

      filename:
        normalizeFilename(
          file.filename,
          `ressource-${index + 1}`,
        ),

      url:
        fileUrl,

      size:
        normalizeFileSize(
          file.size,
        ),

      mimeType:
        normalizeText(
          file.mimeType,
        ),

      position:
        normalizeFilePosition(
          file.position,
          index,
        ),
    });
  }

  /**
   * Compatibilité avec l'ancien système.
   *
   * Si `pdf` est encore envoyé par un ancien appel,
   * il est converti automatiquement en ressource PDF.
   */
  if (input.pdf) {
    const legacyPdfUrl =
      normalizeHttpsUrl(
        input.pdf.url,
      );

    if (!legacyPdfUrl) {
      throw new CourseDeliveryEmailError({
        code:
          "EMAIL_INPUT_INVALID",

        message:
          "L'URL temporaire du PDF est invalide.",
      });
    }

    const alreadyPresent =
      normalizedFiles.some(
        (file) =>
          file.url ===
          legacyPdfUrl,
      );

    if (!alreadyPresent) {
      normalizedFiles.push({
        id:
          null,

        type:
          "PDF",

        filename:
          normalizePdfFilename(
            input.pdf.filename,
          ),

        url:
          legacyPdfUrl,

        size:
          null,

        mimeType:
          "application/pdf",

        position:
          normalizedFiles.length,
      });
    }
  }

  /**
   * Suppression des doublons.
   *
   * Une même URL sécurisée ne doit pas apparaître
   * plusieurs fois dans l'e-mail.
   */
  const uniqueFiles =
    Array.from(
      new Map(
        normalizedFiles.map(
          (file) => [
            file.url,
            file,
          ],
        ),
      ).values(),
    )
      .sort(
        (a, b) => {
          if (
            a.position !==
            b.position
          ) {
            return (
              a.position -
              b.position
            );
          }

          return a.filename
            .localeCompare(
              b.filename,
              "fr",
            );
        },
      );

  /**
   * Une livraison doit contenir au minimum :
   *
   * - un lien privé ;
   * OU
   * - au moins un fichier.
   */
  if (
    !privateAccessUrl &&
    uniqueFiles.length === 0
  ) {
    throw new CourseDeliveryEmailError({
      code:
        "EMAIL_DELIVERY_CONTENT_MISSING",

      message:
        "Aucun lien privé ni fichier sécurisé n'est disponible pour cette formation.",
    });
  }

  return {
    recipientEmail,

    customerDisplayName:
      getCustomerDisplayName({
        firstName:
          input.customerFirstName,

        lastName:
          input.customerLastName,
      }),

    orderReference,

    courseTitle,

    privateAccessUrl,

    files:
      uniqueFiles,
  };
}

/**
 * ============================================================================
 * VERSION TEXTE
 * ============================================================================
 */

function buildTextEmail(
  input:
    NormalizedDeliveryEmailInput,
): string {
  const lines: string[] =
    [
      BRAND_NAME,
      "",
      `Bonjour ${input.customerDisplayName},`,
      "",
      "Votre paiement a bien été confirmé.",
      "",
      `Votre formation : ${input.courseTitle}`,
      `Référence de commande : ${input.orderReference}`,
      "",
      "Votre accès est maintenant disponible.",
      "",
    ];

  if (
    input.privateAccessUrl
  ) {
    lines.push(
      "ACCÉDER À LA FORMATION",
      input.privateAccessUrl,
      "",
    );
  }

  if (
    input.files.length > 0
  ) {
    lines.push(
      input.files.length === 1
        ? "FICHIER DE LA FORMATION"
        : "FICHIERS DE LA FORMATION",
      "",
    );

    input.files.forEach(
      (file, index) => {
        const size =
          formatFileSize(
            file.size,
          );

        lines.push(
          `${index + 1}. [${getFileTypeLabel(file.type)}] ${file.filename}`,
        );

        if (size) {
          lines.push(
            `Taille : ${size}`,
          );
        }

        lines.push(
          `Télécharger : ${file.url}`,
          "",
        );
      },
    );
  }

  lines.push(
    "Ces accès sont personnels. Nous vous recommandons de conserver cet e-mail.",
    "",
    "Besoin d'aide ?",
    getReplyTo(),
    "",
    "Merci pour votre confiance.",
    "",
    "L'équipe AfriSkill AI",
    "Apprenez. Progressez. Passez à l'action.",
    getAppUrl(),
  );

  return lines.join(
    "\n",
  );
}

/**
 * ============================================================================
 * COMPOSANT HTML — FICHIERS
 * ============================================================================
 */

function buildFilesHtml(
  files:
    NormalizedDeliveryEmailFile[],
): string {
  if (
    files.length === 0
  ) {
    return "";
  }

  const cards =
    files
      .map(
        (file) => {
          const safeFilename =
            escapeHtml(
              file.filename,
            );

          const safeUrl =
            escapeHtml(
              file.url,
            );

          const typeLabel =
            escapeHtml(
              getFileTypeLabel(
                file.type,
              ),
            );

          const actionLabel =
            escapeHtml(
              getFileActionLabel(
                file.type,
              ),
            );

          const size =
            formatFileSize(
              file.size,
            );

          const safeSize =
            size
              ? escapeHtml(size)
              : null;

          return `
            <tr>
              <td
                style="
                  padding: 0 0 12px 0;
                "
              >
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    width: 100%;
                    border: 1px solid #dbe7f5;
                    border-radius: 16px;
                    background-color: #f4f8ff;
                  "
                >
                  <tr>
                    <td
                      width="62"
                      valign="middle"
                      style="
                        padding: 17px 0 17px 18px;
                      "
                    >
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                      >
                        <tr>
                          <td
                            align="center"
                            valign="middle"
                            width="46"
                            height="46"
                            style="
                              width: 46px;
                              height: 46px;
                              border-radius: 12px;
                              background-color: #ffffff;
                              color: #0759d9;
                              font-size: 10px;
                              line-height: 46px;
                              font-weight: 900;
                            "
                          >
                            ${typeLabel}
                          </td>
                        </tr>
                      </table>
                    </td>

                    <td
                      valign="middle"
                      style="
                        padding: 17px 10px;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          color: #0f2b5b;
                          font-size: 14px;
                          line-height: 20px;
                          font-weight: 800;
                          word-break: break-word;
                        "
                      >
                        ${safeFilename}
                      </p>

                      <p
                        style="
                          margin: 4px 0 0 0;
                          color: #64748b;
                          font-size: 11px;
                          line-height: 17px;
                        "
                      >
                        ${typeLabel}${
                          safeSize
                            ? ` • ${safeSize}`
                            : ""
                        }
                      </p>
                    </td>

                    <td
                      align="right"
                      valign="middle"
                      style="
                        padding: 17px 18px 17px 5px;
                      "
                    >
                      <a
                        href="${safeUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                          display: inline-block;
                          border: 1px solid #cddbf0;
                          border-radius: 10px;
                          background-color: #ffffff;
                          padding: 10px 13px;
                          color: #0759d9;
                          font-size: 11px;
                          line-height: 16px;
                          font-weight: 800;
                          text-decoration: none;
                          white-space: nowrap;
                        "
                      >
                        ${actionLabel}
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          `.trim();
        },
      )
      .join("");

  const title =
    files.length === 1
      ? "Votre fichier de formation"
      : `Vos fichiers de formation — ${files.length} fichiers`;

  return `
    <tr>
      <td
        style="
          padding: 24px 30px 0 30px;
        "
      >
        <p
          style="
            margin: 0 0 7px 0;
            color: #172033;
            font-size: 16px;
            line-height: 24px;
            font-weight: 800;
          "
        >
          ${escapeHtml(title)}
        </p>

        <p
          style="
            margin: 0 0 16px 0;
            color: #64748b;
            font-size: 13px;
            line-height: 21px;
          "
        >
          ${
            files.length === 1
              ? "Votre ressource est disponible ci-dessous."
              : "Toutes les ressources associées à votre formation sont disponibles ci-dessous."
          }
        </p>

        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
        >
          ${cards}
        </table>
      </td>
    </tr>
  `.trim();
}

/**
 * ============================================================================
 * VERSION HTML PROFESSIONNELLE
 * ============================================================================
 */

function buildHtmlEmail(
  input:
    NormalizedDeliveryEmailInput,
): string {
  const appUrl =
    getAppUrl();

  const logoUrl =
    getLogoUrl();

  const supportEmail =
    getReplyTo();

  const safeCustomerName =
    escapeHtml(
      input.customerDisplayName,
    );

  const safeCourseTitle =
    escapeHtml(
      input.courseTitle,
    );

  const safeOrderReference =
    escapeHtml(
      input.orderReference,
    );

  const safeSupportEmail =
    escapeHtml(
      supportEmail,
    );

  const safeAppUrl =
    escapeHtml(
      appUrl,
    );

  const safeLogoUrl =
    escapeHtml(
      logoUrl,
    );

  const safePrivateAccessUrl =
    input.privateAccessUrl
      ? escapeHtml(
          input.privateAccessUrl,
        )
      : null;

  const filesHtml =
    buildFilesHtml(
      input.files,
    );

  return `
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />

    <meta
      name="viewport"
      content="width=device-width, initial-scale=1"
    />

    <meta
      name="color-scheme"
      content="light"
    />

    <meta
      name="supported-color-schemes"
      content="light"
    />

    <title>
      Votre formation AfriSkill AI est disponible
    </title>
  </head>

  <body
    style="
      margin: 0;
      padding: 0;
      width: 100%;
      background-color: #f4f7fb;
      font-family: Arial, Helvetica, sans-serif;
      color: #172033;
      -webkit-font-smoothing: antialiased;
    "
  >
    <table
      role="presentation"
      width="100%"
      cellspacing="0"
      cellpadding="0"
      border="0"
      style="
        width: 100%;
        margin: 0;
        padding: 0;
        background-color: #f4f7fb;
      "
    >
      <tr>
        <td
          align="center"
          style="
            padding: 32px 12px;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="
              width: 100%;
              max-width: 640px;
              margin: 0 auto;
            "
          >
            <tr>
              <td
                align="center"
                style="
                  padding: 0 0 22px 0;
                "
              >
                <a
                  href="${safeAppUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="
                    text-decoration: none;
                  "
                >
                  <img
                    src="${safeLogoUrl}"
                    width="170"
                    alt="AfriSkill AI"
                    style="
                      display: block;
                      width: 170px;
                      max-width: 72%;
                      height: auto;
                      margin: 0 auto;
                      border: 0;
                      outline: none;
                      text-decoration: none;
                    "
                  />
                </a>
              </td>
            </tr>

            <tr>
              <td
                style="
                  overflow: hidden;
                  border: 1px solid #e2e8f0;
                  border-radius: 28px;
                  background-color: #ffffff;
                  box-shadow: 0 18px 50px rgba(15, 43, 91, 0.08);
                "
              >
                <!-- HEADER -->
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                >
                  <tr>
                    <td
                      align="center"
                      style="
                        padding: 38px 30px 34px 30px;
                        background-color: #0f2b5b;
                      "
                    >
                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                      >
                        <tr>
                          <td
                            align="center"
                            valign="middle"
                            width="64"
                            height="64"
                            style="
                              width: 64px;
                              height: 64px;
                              border-radius: 50%;
                              background-color: #ffffff;
                              color: #15803d;
                              font-size: 31px;
                              font-weight: 900;
                              line-height: 64px;
                            "
                          >
                            ✓
                          </td>
                        </tr>
                      </table>

                      <p
                        style="
                          margin: 20px 0 0 0;
                          color: #f5aa00;
                          font-size: 12px;
                          line-height: 18px;
                          font-weight: 800;
                          letter-spacing: 1.5px;
                          text-transform: uppercase;
                        "
                      >
                        Paiement confirmé
                      </p>

                      <h1
                        style="
                          margin: 9px 0 0 0;
                          color: #ffffff;
                          font-size: 30px;
                          line-height: 38px;
                          font-weight: 800;
                          letter-spacing: -0.7px;
                        "
                      >
                        Votre formation est disponible
                      </h1>

                      <p
                        style="
                          margin: 13px auto 0 auto;
                          max-width: 500px;
                          color: #dbe7f8;
                          font-size: 15px;
                          line-height: 24px;
                          font-weight: 400;
                        "
                      >
                        Votre paiement a été confirmé avec succès.
                        Vous pouvez maintenant accéder aux éléments
                        de votre formation AfriSkill AI.
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- CONTENU -->
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                >
                  <tr>
                    <td
                      style="
                        padding: 34px 30px 12px 30px;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          color: #172033;
                          font-size: 17px;
                          line-height: 27px;
                          font-weight: 700;
                        "
                      >
                        Bonjour ${safeCustomerName},
                      </p>

                      <p
                        style="
                          margin: 12px 0 0 0;
                          color: #526176;
                          font-size: 15px;
                          line-height: 25px;
                        "
                      >
                        Merci pour votre confiance. Votre commande
                        a été validée et vos accès sont maintenant
                        disponibles ci-dessous.
                      </p>
                    </td>
                  </tr>

                  <!-- FORMATION -->
                  <tr>
                    <td
                      style="
                        padding: 18px 30px 0 30px;
                      "
                    >
                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="
                          width: 100%;
                          border: 1px solid #e4eaf2;
                          border-radius: 18px;
                          background-color: #f8fafc;
                        "
                      >
                        <tr>
                          <td
                            style="
                              padding: 20px;
                            "
                          >
                            <p
                              style="
                                margin: 0;
                                color: #718096;
                                font-size: 11px;
                                line-height: 17px;
                                font-weight: 800;
                                letter-spacing: 1px;
                                text-transform: uppercase;
                              "
                            >
                              Formation achetée
                            </p>

                            <p
                              style="
                                margin: 7px 0 0 0;
                                color: #0f2b5b;
                                font-size: 19px;
                                line-height: 27px;
                                font-weight: 800;
                              "
                            >
                              ${safeCourseTitle}
                            </p>

                            <p
                              style="
                                margin: 11px 0 0 0;
                                color: #64748b;
                                font-size: 12px;
                                line-height: 19px;
                              "
                            >
                              Référence :
                              <strong
                                style="
                                  color: #334155;
                                "
                              >
                                ${safeOrderReference}
                              </strong>
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  ${
                    safePrivateAccessUrl
                      ? `
                  <!-- LIEN PRIVÉ -->
                  <tr>
                    <td
                      style="
                        padding: 26px 30px 0 30px;
                      "
                    >
                      <p
                        style="
                          margin: 0 0 8px 0;
                          color: #172033;
                          font-size: 16px;
                          line-height: 24px;
                          font-weight: 800;
                        "
                      >
                        Accéder à votre formation
                      </p>

                      <p
                        style="
                          margin: 0 0 16px 0;
                          color: #64748b;
                          font-size: 13px;
                          line-height: 21px;
                        "
                      >
                        Cliquez sur le bouton ci-dessous pour ouvrir
                        l'accès privé associé à votre formation.
                      </p>

                      <table
                        role="presentation"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        width="100%"
                      >
                        <tr>
                          <td
                            align="center"
                            style="
                              border-radius: 14px;
                              background-color: #0759d9;
                            "
                          >
                            <a
                              href="${safePrivateAccessUrl}"
                              target="_blank"
                              rel="noopener noreferrer"
                              style="
                                display: block;
                                padding: 16px 24px;
                                border-radius: 14px;
                                color: #ffffff;
                                font-size: 15px;
                                line-height: 21px;
                                font-weight: 800;
                                text-decoration: none;
                              "
                            >
                              Accéder à ma formation
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  `
                      : ""
                  }

                  ${filesHtml}

                  <!-- SÉCURITÉ -->
                  <tr>
                    <td
                      style="
                        padding: 26px 30px 0 30px;
                      "
                    >
                      <table
                        role="presentation"
                        width="100%"
                        cellspacing="0"
                        cellpadding="0"
                        border="0"
                        style="
                          width: 100%;
                          border-radius: 16px;
                          background-color: #fff9eb;
                        "
                      >
                        <tr>
                          <td
                            style="
                              padding: 17px 18px;
                            "
                          >
                            <p
                              style="
                                margin: 0;
                                color: #8a5a00;
                                font-size: 13px;
                                line-height: 21px;
                                font-weight: 700;
                              "
                            >
                              🔒 Vos accès sont personnels
                            </p>

                            <p
                              style="
                                margin: 5px 0 0 0;
                                color: #876a2d;
                                font-size: 12px;
                                line-height: 19px;
                              "
                            >
                              Conservez cet e-mail. Les liens fournis
                              sont destinés à l'utilisation du client
                              ayant effectué cette commande.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <!-- AIDE -->
                  <tr>
                    <td
                      align="center"
                      style="
                        padding: 30px 30px 32px 30px;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          color: #64748b;
                          font-size: 13px;
                          line-height: 21px;
                        "
                      >
                        Une question ou un problème avec votre accès ?
                      </p>

                      <p
                        style="
                          margin: 5px 0 0 0;
                          font-size: 13px;
                          line-height: 21px;
                        "
                      >
                        <a
                          href="mailto:${safeSupportEmail}"
                          style="
                            color: #0759d9;
                            font-weight: 800;
                            text-decoration: none;
                          "
                        >
                          ${safeSupportEmail}
                        </a>
                      </p>
                    </td>
                  </tr>
                </table>

                <!-- SIGNATURE -->
                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  border="0"
                  style="
                    border-top: 1px solid #edf1f6;
                    background-color: #fafbfd;
                  "
                >
                  <tr>
                    <td
                      align="center"
                      style="
                        padding: 27px 24px 29px 24px;
                      "
                    >
                      <img
                        src="${safeLogoUrl}"
                        width="112"
                        alt="AfriSkill AI"
                        style="
                          display: block;
                          width: 112px;
                          max-width: 50%;
                          height: auto;
                          margin: 0 auto 13px auto;
                          border: 0;
                        "
                      />

                      <p
                        style="
                          margin: 0;
                          color: #0f2b5b;
                          font-size: 14px;
                          line-height: 21px;
                          font-weight: 800;
                        "
                      >
                        L'équipe AfriSkill AI
                      </p>

                      <p
                        style="
                          margin: 3px 0 0 0;
                          color: #7b8798;
                          font-size: 11px;
                          line-height: 18px;
                        "
                      >
                        Apprenez. Progressez. Passez à l'action.
                      </p>

                      <p
                        style="
                          margin: 11px 0 0 0;
                          color: #94a3b8;
                          font-size: 10px;
                          line-height: 17px;
                        "
                      >
                        Cet e-mail a été envoyé automatiquement
                        après confirmation de votre paiement.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- FOOTER -->
            <tr>
              <td
                align="center"
                style="
                  padding: 21px 20px 0 20px;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #94a3b8;
                    font-size: 10px;
                    line-height: 17px;
                  "
                >
                  © ${new Date().getFullYear()} AfriSkill AI.
                  Tous droits réservés.
                </p>

                <p
                  style="
                    margin: 4px 0 0 0;
                    color: #94a3b8;
                    font-size: 10px;
                    line-height: 17px;
                  "
                >
                  <a
                    href="${safeAppUrl}"
                    target="_blank"
                    rel="noopener noreferrer"
                    style="
                      color: #64748b;
                      text-decoration: none;
                    "
                  >
                    afriskill-ai.com
                  </a>

                  &nbsp;•&nbsp;

                  <a
                    href="mailto:${safeSupportEmail}"
                    style="
                      color: #64748b;
                      text-decoration: none;
                    "
                  >
                    ${safeSupportEmail}
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

/**
 * ============================================================================
 * SUJET
 * ============================================================================
 */

function buildSubject(
  courseTitle: string,
): string {
  const title =
    courseTitle.length > 90
      ? `${courseTitle.slice(
          0,
          87,
        )}...`
      : courseTitle;

  return `Votre formation est disponible — ${title}`;
}

/**
 * ============================================================================
 * ENVOI RESEND
 * ============================================================================
 */

export async function sendCourseDeliveryEmail(
  input: CourseDeliveryEmailInput,
): Promise<CourseDeliveryEmailResult> {
  const normalizedInput =
    normalizeInput(
      input,
    );

  const resend =
    getResendClient();

  const subject =
    buildSubject(
      normalizedInput.courseTitle,
    );

  const text =
    buildTextEmail(
      normalizedInput,
    );

  const html =
    buildHtmlEmail(
      normalizedInput,
    );

  try {
    const response =
      await resend.emails.send({
        from:
          getMailFrom(),

        to: [
          normalizedInput
            .recipientEmail,
        ],

        replyTo:
          getReplyTo(),

        subject,

        text,

        html,

        /**
         * Permet de retrouver facilement l'e-mail
         * correspondant à la commande dans Resend.
         *
         * Aucun secret n'est placé dans cet en-tête.
         */
        headers: {
          "X-Entity-Ref-ID":
            normalizedInput
              .orderReference,
        },

        tags: [
          {
            name:
              "category",

            value:
              "course-delivery",
          },
          {
            name:
              "application",

            value:
              "afriskill-ai",
          },
        ],
      });

    if (response.error) {
      throw new CourseDeliveryEmailError({
        code:
          "EMAIL_PROVIDER_REJECTED",

        message:
          response.error.message ||
          "Resend a refusé l'envoi de l'e-mail de formation.",

        cause:
          response.error,
      });
    }

    const providerMessageId =
      response.data?.id?.trim();

    if (!providerMessageId) {
      throw new CourseDeliveryEmailError({
        code:
          "EMAIL_PROVIDER_RESPONSE_INVALID",

        message:
          "Resend n'a retourné aucun identifiant de message.",
      });
    }

    return {
      providerMessageId,
    };
  } catch (error) {
    if (
      error instanceof
      CourseDeliveryEmailError
    ) {
      throw error;
    }

    /**
     * IMPORTANT :
     *
     * On ne logue ici :
     *
     * - ni le lien privé ;
     * - ni les URLs temporaires des fichiers ;
     * - ni le contenu HTML ;
     * - ni la clé Resend.
     */
    console.error(
      "[COURSE_DELIVERY_EMAIL_SEND_FAILED]",
      error instanceof Error
        ? {
            name:
              error.name,

            message:
              error.message,

            orderReference:
              normalizedInput
                .orderReference,
          }
        : {
            orderReference:
              normalizedInput
                .orderReference,
          },
    );

    throw new CourseDeliveryEmailError({
      code:
        "EMAIL_SEND_FAILED",

      message:
        "Impossible d'envoyer l'e-mail de livraison de la formation.",

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
 * Notre orchestrateur de livraison attend un objet disposant de :
 *
 * sendCourseDeliveryEmail(...)
 *
 * On exporte donc directement cet adaptateur.
 * ============================================================================
 */

export const courseDeliveryEmailSender:
  CourseDeliveryEmailSender = {
  sendCourseDeliveryEmail,
};