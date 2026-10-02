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
 * - fournit éventuellement un lien temporaire sécurisé vers le PDF ;
 * - retourne l'identifiant Resend du message ;
 * - ne confirme JAMAIS lui-même un paiement ;
 * - ne lit jamais privatePdfPath directement ;
 * - ne doit être appelé qu'après validation serveur du paiement.
 *
 * IMPORTANT :
 *
 * Le PDF reçu ici doit déjà avoir été transformé en URL temporaire
 * sécurisée par le service de stockage privé.
 * ============================================================================
 */

/**
 * ============================================================================
 * CONSTANTES
 * ============================================================================
 */

const BRAND_NAME =
  "AfriSkill AI";

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

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

export type CourseDeliveryEmailAttachment = {
  /**
   * Nom présenté au client.
   *
   * Exemple :
   * Formation-AfriSkill-AI.pdf
   */
  filename: string;

  /**
   * URL HTTPS temporaire et sécurisée.
   *
   * Cette URL doit être générée par le service
   * de stockage privé.
   */
  url: string;
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
   * PDF sécurisé.
   *
   * Il ne s'agit PAS du privatePdfPath Supabase.
   *
   * Il s'agit d'une URL temporaire déjà générée.
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
 * NOM DU PDF
 * ============================================================================
 */

function normalizePdfFilename(
  filename:
    | string
    | null
    | undefined,
): string {
  const normalized =
    normalizeText(
      filename,
    );

  if (!normalized) {
    return "formation-afriskill-ai.pdf";
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
        180,
      );

  if (!cleaned) {
    return "formation-afriskill-ai.pdf";
  }

  return cleaned
    .toLowerCase()
    .endsWith(".pdf")
    ? cleaned
    : `${cleaned}.pdf`;
}

/**
 * ============================================================================
 * DONNÉES NORMALISÉES
 * ============================================================================
 */

type NormalizedDeliveryEmailInput = {
  recipientEmail: string;
  customerDisplayName: string;
  orderReference: string;
  courseTitle: string;

  privateAccessUrl:
    | string
    | null;

  pdf:
    | {
        filename: string;
        url: string;
      }
    | null;
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

  let pdf:
    NormalizedDeliveryEmailInput["pdf"] =
    null;

  if (input.pdf) {
    const pdfUrl =
      normalizeHttpsUrl(
        input.pdf.url,
      );

    if (!pdfUrl) {
      throw new CourseDeliveryEmailError({
        code:
          "EMAIL_INPUT_INVALID",

        message:
          "L'URL temporaire du PDF est invalide.",
      });
    }

    pdf = {
      filename:
        normalizePdfFilename(
          input.pdf.filename,
        ),

      url:
        pdfUrl,
    };
  }

  /**
   * Une livraison de formation doit contenir
   * au minimum un accès utile.
   */
  if (
    !privateAccessUrl &&
    !pdf
  ) {
    throw new CourseDeliveryEmailError({
      code:
        "EMAIL_DELIVERY_CONTENT_MISSING",

      message:
        "Aucun lien privé ni PDF sécurisé n'est disponible pour cette formation.",
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

    pdf,
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

  if (input.pdf) {
    lines.push(
      "PDF DE LA FORMATION",
      input.pdf.url,
      "",
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

  const safePdfUrl =
    input.pdf
      ? escapeHtml(
          input.pdf.url,
        )
      : null;

  const safePdfFilename =
    input.pdf
      ? escapeHtml(
          input.pdf.filename,
        )
      : null;

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
            <!-- =========================================================
                 LOGO
            ========================================================== -->

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

            <!-- =========================================================
                 CARTE PRINCIPALE
            ========================================================== -->

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
                      <!-- CHECK -->

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

                  ${
                    safePdfUrl &&
                    safePdfFilename
                      ? `
                  <!-- PDF -->

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
                          border: 1px solid #dbe7f5;
                          border-radius: 16px;
                          background-color: #f4f8ff;
                        "
                      >
                        <tr>
                          <td
                            width="54"
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
                                  width="42"
                                  height="42"
                                  style="
                                    width: 42px;
                                    height: 42px;
                                    border-radius: 12px;
                                    background-color: #ffffff;
                                    color: #0759d9;
                                    font-size: 12px;
                                    line-height: 42px;
                                    font-weight: 900;
                                  "
                                >
                                  PDF
                                </td>
                              </tr>
                            </table>
                          </td>

                          <td
                            valign="middle"
                            style="
                              padding: 17px 12px;
                            "
                          >
                            <p
                              style="
                                margin: 0;
                                color: #0f2b5b;
                                font-size: 14px;
                                line-height: 20px;
                                font-weight: 800;
                              "
                            >
                              PDF de votre formation
                            </p>

                            <p
                              style="
                                margin: 4px 0 0 0;
                                color: #64748b;
                                font-size: 11px;
                                line-height: 17px;
                              "
                            >
                              ${safePdfFilename}
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
                              href="${safePdfUrl}"
                              target="_blank"
                              rel="noopener noreferrer"
                              style="
                                display: inline-block;
                                border: 1px solid #cddbf0;
                                border-radius: 10px;
                                background-color: #ffffff;
                                padding: 10px 13px;
                                color: #0759d9;
                                font-size: 12px;
                                line-height: 16px;
                                font-weight: 800;
                                text-decoration: none;
                                white-space: nowrap;
                              "
                            >
                              Ouvrir le PDF
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  `
                      : ""
                  }

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

                <!-- =====================================================
                     SIGNATURE
                ====================================================== -->

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

            <!-- =========================================================
                 FOOTER
            ========================================================== -->

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
     * - ni le lien privé ;
     * - ni l'URL temporaire du PDF ;
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