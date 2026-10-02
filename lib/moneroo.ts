import "server-only";

import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

/**
 * ============================================================================
 * AFRISKILL AI — MONEROO
 * ============================================================================
 *
 * Couche serveur centralisée et sécurisée pour l'intégration Moneroo.
 *
 * Responsabilités :
 * - configuration serveur Moneroo ;
 * - initialisation d'un paiement ;
 * - récupération de l'URL de paiement ;
 * - vérification serveur d'un paiement ;
 * - normalisation des statuts ;
 * - vérification cryptographique des webhooks ;
 * - validation paiement / commande ;
 * - protection des secrets et des logs.
 *
 * RÈGLE ABSOLUE :
 *
 * Une redirection navigateur ou un paramètre tel que :
 *
 * ?status=success
 * ?paid=true
 *
 * ne constitue JAMAIS une confirmation de paiement.
 *
 * Seule une confirmation serveur Moneroo authentifiée et vérifiée
 * peut autoriser la livraison d'une formation.
 * ============================================================================
 */

const MONEROO_API_BASE_URL =
  "https://api.moneroo.io";

const MONEROO_INITIALIZE_PATH =
  "/v1/payments/initialize";

const MONEROO_REQUEST_TIMEOUT_MS =
  30_000;

const MAX_REFERENCE_LENGTH =
  200;

const MAX_DESCRIPTION_LENGTH =
  500;

const MAX_PROVIDER_PAYMENT_ID_LENGTH =
  300;

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

export type MonerooPaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "unknown";

export type MonerooJsonPrimitive =
  | string
  | number
  | boolean
  | null;

export type MonerooJsonValue =
  | MonerooJsonPrimitive
  | MonerooJsonValue[]
  | {
      [key: string]:
        MonerooJsonValue;
    };

export type MonerooJsonObject = {
  [key: string]:
    MonerooJsonValue;
};

export type MonerooCustomer = {
  firstName?:
    | string
    | null;

  lastName?:
    | string
    | null;

  email: string;

  phone?:
    | string
    | null;
};

export type MonerooCreatePaymentInput = {
  /**
   * Référence interne du Payment AfriSkill AI.
   */
  reference: string;

  /**
   * Montant enregistré côté serveur.
   */
  amount: number;

  /**
   * Code ISO 4217.
   *
   * Exemples :
   * XOF
   * EUR
   * USD
   */
  currency: string;

  customer:
    MonerooCustomer;

  description?:
    | string
    | null;

  /**
   * URL vers laquelle Moneroo peut retourner le navigateur.
   *
   * Cette URL ne valide jamais le paiement.
   */
  returnUrl: string;

  /**
   * URL serveur du webhook Moneroo.
   */
  webhookUrl: string;

  /**
   * Métadonnées non sensibles.
   */
  metadata?: Record<
    string,
    | string
    | number
    | boolean
    | null
  >;
};

export type MonerooPaymentResult = {
  providerPaymentId: string;

  status:
    MonerooPaymentStatus;

  checkoutUrl:
    string | null;

  raw:
    MonerooJsonObject;
};

export type MonerooVerifiedPayment = {
  providerPaymentId: string;

  status:
    MonerooPaymentStatus;

  amount:
    number | null;

  currency:
    string | null;

  reference:
    string | null;

  raw:
    MonerooJsonObject;
};

export type MonerooWebhookVerificationInput = {
  rawBody: string;

  signature:
    string | null;
};

export type MonerooWebhookVerificationResult = {
  valid: boolean;
};

export type MonerooConfig = {
  apiBaseUrl: string;

  secretKey: string;

  webhookSecret:
    string | null;
};

/**
 * ============================================================================
 * ERREURS
 * ============================================================================
 */

export class MonerooError extends Error {
  readonly statusCode:
    number | null;

  readonly responseBody:
    unknown;

  constructor(
    message: string,
    options?: {
      statusCode?:
        number | null;

      responseBody?:
        unknown;

      cause?:
        unknown;
    },
  ) {
    super(
      message,
      {
        cause:
          options?.cause,
      },
    );

    this.name =
      "MonerooError";

    this.statusCode =
      options?.statusCode ??
      null;

    this.responseBody =
      options?.responseBody ??
      null;

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}

export class MonerooConfigurationError
  extends MonerooError {
  constructor(
    message: string,
  ) {
    super(message);

    this.name =
      "MonerooConfigurationError";

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}

/**
 * ============================================================================
 * ENVIRONNEMENT
 * ============================================================================
 */

function readRequiredEnvironmentVariable(
  name: string,
): string {
  const value =
    process.env[name]
      ?.trim();

  if (!value) {
    throw new MonerooConfigurationError(
      `La variable d'environnement ${name} est absente ou vide.`,
    );
  }

  return value;
}

function readOptionalEnvironmentVariable(
  name: string,
): string | null {
  return (
    process.env[name]
      ?.trim() ||
    null
  );
}

/**
 * ============================================================================
 * CONFIGURATION
 * ============================================================================
 */

export function getMonerooConfig():
  MonerooConfig {
  return {
    apiBaseUrl:
      MONEROO_API_BASE_URL,

    secretKey:
      readRequiredEnvironmentVariable(
        "MONEROO_SECRET_KEY",
      ),

    webhookSecret:
      readOptionalEnvironmentVariable(
        "MONEROO_WEBHOOK_SECRET",
      ),
  };
}

export function getMonerooSecretKey():
  string {
  return readRequiredEnvironmentVariable(
    "MONEROO_SECRET_KEY",
  );
}

export function getMonerooWebhookSecret():
  string {
  return readRequiredEnvironmentVariable(
    "MONEROO_WEBHOOK_SECRET",
  );
}

/**
 * ============================================================================
 * VALIDATION GÉNÉRALE
 * ============================================================================
 */

function assertNonEmptyString(
  value: string,
  fieldName: string,
): void {
  if (!value.trim()) {
    throw new MonerooError(
      `${fieldName} est obligatoire.`,
    );
  }
}

function assertPositiveInteger(
  value: number,
  fieldName: string,
): void {
  if (
    !Number.isSafeInteger(
      value,
    ) ||
    value <= 0
  ) {
    throw new MonerooError(
      `${fieldName} doit être un entier strictement positif.`,
    );
  }
}

function normalizeCurrency(
  currency: string,
): string {
  const normalized =
    currency
      .trim()
      .toUpperCase();

  if (
    !/^[A-Z]{3}$/.test(
      normalized,
    )
  ) {
    throw new MonerooError(
      "La devise doit être un code ISO 4217 composé de 3 lettres.",
    );
  }

  return normalized;
}

function normalizeEmail(
  email: string,
): string {
  const normalized =
    email
      .trim()
      .toLowerCase();

  if (
    !normalized ||
    normalized.length >
      320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalized,
    )
  ) {
    throw new MonerooError(
      "L'adresse e-mail du client est invalide.",
    );
  }

  return normalized;
}

function normalizeOptionalString(
  value:
    | string
    | null
    | undefined,
): string | null {
  return (
    value?.trim() ||
    null
  );
}

function normalizeReference(
  value: string,
): string {
  const reference =
    value.trim();

  if (!reference) {
    throw new MonerooError(
      "La référence du paiement est obligatoire.",
    );
  }

  if (
    reference.length >
    MAX_REFERENCE_LENGTH
  ) {
    throw new MonerooError(
      "La référence du paiement est trop longue.",
    );
  }

  return reference;
}

function assertHttpUrl(
  value: string,
  fieldName: string,
): void {
  let parsedUrl: URL;

  try {
    parsedUrl =
      new URL(value);
  } catch {
    throw new MonerooError(
      `${fieldName} doit être une URL valide.`,
    );
  }

  if (
    parsedUrl.protocol !==
      "https:" &&
    parsedUrl.protocol !==
      "http:"
  ) {
    throw new MonerooError(
      `${fieldName} doit utiliser HTTP ou HTTPS.`,
    );
  }

  if (
    process.env.NODE_ENV ===
      "production" &&
    parsedUrl.protocol !==
      "https:"
  ) {
    throw new MonerooError(
      `${fieldName} doit utiliser HTTPS en production.`,
    );
  }
}

function assertCheckoutUrl(
  value: string,
): string {
  let parsedUrl: URL;

  try {
    parsedUrl =
      new URL(value);
  } catch {
    throw new MonerooError(
      "L'URL de paiement retournée par Moneroo est invalide.",
    );
  }

  if (
    parsedUrl.protocol !==
    "https:"
  ) {
    throw new MonerooError(
      "L'URL de paiement retournée par Moneroo doit utiliser HTTPS.",
    );
  }

  return parsedUrl.toString();
}

/**
 * ============================================================================
 * CLIENT
 * ============================================================================
 */

export function normalizeMonerooCustomer(
  customer:
    MonerooCustomer,
): MonerooCustomer {
  return {
    firstName:
      normalizeOptionalString(
        customer.firstName,
      ),

    lastName:
      normalizeOptionalString(
        customer.lastName,
      ),

    email:
      normalizeEmail(
        customer.email,
      ),

    phone:
      normalizeOptionalString(
        customer.phone,
      ),
  };
}

/**
 * ============================================================================
 * DEMANDE DE PAIEMENT
 * ============================================================================
 */

export function validateMonerooPaymentInput(
  input:
    MonerooCreatePaymentInput,
): MonerooCreatePaymentInput {
  const reference =
    normalizeReference(
      input.reference,
    );

  assertPositiveInteger(
    input.amount,
    "Le montant du paiement",
  );

  assertHttpUrl(
    input.returnUrl,
    "L'URL de retour",
  );

  assertHttpUrl(
    input.webhookUrl,
    "L'URL webhook",
  );

  const description =
    normalizeOptionalString(
      input.description,
    );

  if (
    description &&
    description.length >
      MAX_DESCRIPTION_LENGTH
  ) {
    throw new MonerooError(
      "La description du paiement est trop longue.",
    );
  }

  return {
    reference,

    amount:
      input.amount,

    currency:
      normalizeCurrency(
        input.currency,
      ),

    customer:
      normalizeMonerooCustomer(
        input.customer,
      ),

    description,

    returnUrl:
      input.returnUrl.trim(),

    webhookUrl:
      input.webhookUrl.trim(),

    metadata:
      input.metadata
        ? {
            ...input.metadata,
          }
        : undefined,
  };
}

/**
 * ============================================================================
 * JSON
 * ============================================================================
 */

export function isMonerooJsonObject(
  value: unknown,
): value is MonerooJsonObject {
  return (
    typeof value ===
      "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function toMonerooJsonObject(
  value: unknown,
  errorMessage: string,
): MonerooJsonObject {
  if (
    !isMonerooJsonObject(
      value,
    )
  ) {
    throw new MonerooError(
      errorMessage,
    );
  }

  return value;
}

export function parseMonerooWebhookBody(
  rawBody: string,
): MonerooJsonObject {
  if (
    !rawBody.trim()
  ) {
    throw new MonerooError(
      "Le webhook Moneroo ne contient aucune donnée.",
    );
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(rawBody);
  } catch {
    throw new MonerooError(
      "Le corps du webhook Moneroo n'est pas un JSON valide.",
    );
  }

  return toMonerooJsonObject(
    parsed,
    "Le corps du webhook Moneroo doit être un objet JSON.",
  );
}

/**
 * ============================================================================
 * STATUTS
 * ============================================================================
 */

export function normalizeMonerooPaymentStatus(
  value: unknown,
): MonerooPaymentStatus {
  if (
    typeof value !==
    "string"
  ) {
    return "unknown";
  }

  const normalized =
    value
      .trim()
      .toLowerCase()
      .replace(
        /[\s-]+/g,
        "_",
      );

  switch (normalized) {
    case "paid":
    case "success":
    case "successful":
    case "completed":
    case "complete":
      return "paid";

    case "pending":
    case "initiated":
    case "created":
      return "pending";

    case "processing":
    case "in_progress":
      return "processing";

    case "failed":
    case "failure":
    case "error":
      return "failed";

    case "cancelled":
    case "canceled":
      return "cancelled";

    case "refunded":
    case "refund":
      return "refunded";

    default:
      return "unknown";
  }
}

/**
 * ============================================================================
 * HTTP MONEROO
 * ============================================================================
 */

async function parseMonerooResponse(
  response: Response,
): Promise<MonerooJsonObject> {
  const text =
    await response.text();

  if (!text.trim()) {
    throw new MonerooError(
      "Moneroo a retourné une réponse vide.",
      {
        statusCode:
          response.status,
      },
    );
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(text);
  } catch {
    throw new MonerooError(
      "Moneroo a retourné une réponse JSON invalide.",
      {
        statusCode:
          response.status,
      },
    );
  }

  if (
    !isMonerooJsonObject(
      parsed,
    )
  ) {
    throw new MonerooError(
      "La réponse Moneroo est invalide.",
      {
        statusCode:
          response.status,
      },
    );
  }

  return parsed;
}

async function monerooRequest(
  path: string,
  options: {
    method:
      | "GET"
      | "POST";

    body?:
      MonerooJsonObject;
  },
): Promise<MonerooJsonObject> {
  const config =
    getMonerooConfig();

  const normalizedPath =
    path.startsWith("/")
      ? path
      : `/${path}`;

  const url =
    `${config.apiBaseUrl}${normalizedPath}`;

  const headers =
    new Headers();

  headers.set(
    "Accept",
    "application/json",
  );

  headers.set(
    "Authorization",
    `Bearer ${config.secretKey}`,
  );

  if (options.body) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  let response: Response;

  try {
    response =
      await fetch(
        url,
        {
          method:
            options.method,

          headers,

          body:
            options.body
              ? JSON.stringify(
                  options.body,
                )
              : undefined,

          cache:
            "no-store",

          signal:
            AbortSignal.timeout(
              MONEROO_REQUEST_TIMEOUT_MS,
            ),
        },
      );
  } catch (error) {
    throw new MonerooError(
      "Impossible de communiquer avec Moneroo.",
      {
        cause: error,
      },
    );
  }

  const body =
    await parseMonerooResponse(
      response,
    );

  if (!response.ok) {
    throw new MonerooError(
      `Moneroo a retourné une erreur HTTP ${response.status}.`,
      {
        statusCode:
          response.status,

        responseBody:
          sanitizeMonerooLogData(
            body,
          ),
      },
    );
  }

  return body;
}

/**
 * ============================================================================
 * EXTRACTION DES RÉPONSES
 * ============================================================================
 */

function getNestedObject(
  source:
    MonerooJsonObject,
  key: string,
): MonerooJsonObject | null {
  const value =
    source[key];

  return isMonerooJsonObject(
    value,
  )
    ? value
    : null;
}

function firstString(
  values:
    MonerooJsonValue[],
): string | null {
  for (
    const value of values
  ) {
    if (
      typeof value ===
      "string"
    ) {
      const normalized =
        value.trim();

      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
}

function parsePositiveIntegerValue(
  value:
    MonerooJsonValue
    | undefined,
): number | null {
  if (
    typeof value ===
      "number" &&
    Number.isSafeInteger(
      value,
    ) &&
    value > 0
  ) {
    return value;
  }

  if (
    typeof value ===
      "string" &&
    /^\d+$/.test(
      value.trim(),
    )
  ) {
    const parsed =
      Number.parseInt(
        value.trim(),
        10,
      );

    if (
      Number.isSafeInteger(
        parsed,
      ) &&
      parsed > 0
    ) {
      return parsed;
    }
  }

  return null;
}

function parseCurrencyValue(
  value:
    MonerooJsonValue
    | undefined,
): string | null {
  if (
    typeof value !==
    "string"
  ) {
    return null;
  }

  const currency =
    value
      .trim()
      .toUpperCase();

  return /^[A-Z]{3}$/.test(
    currency,
  )
    ? currency
    : null;
}

/**
 * ============================================================================
 * INITIALISATION DU PAIEMENT
 * ============================================================================
 */

export async function initializeMonerooPayment(
  input:
    MonerooCreatePaymentInput,
): Promise<MonerooPaymentResult> {
  const validated =
    validateMonerooPaymentInput(
      input,
    );

  /**
   * Le payload est construit uniquement côté serveur.
   *
   * Le navigateur ne décide jamais :
   * - du montant ;
   * - de la devise ;
   * - de la référence ;
   * - du webhook.
   */
  const payload:
    MonerooJsonObject =
  {
    amount:
      validated.amount,

    currency:
      validated.currency,

    description:
      validated.description ??
      `Paiement ${validated.reference}`,

    return_url:
      validated.returnUrl,

    webhook_url:
      validated.webhookUrl,

    customer: {
      email:
        validated.customer.email,

      ...(validated.customer.firstName
        ? {
            first_name:
              validated.customer.firstName,
          }
        : {}),

      ...(validated.customer.lastName
        ? {
            last_name:
              validated.customer.lastName,
          }
        : {}),

      ...(validated.customer.phone
        ? {
            phone:
              validated.customer.phone,
          }
        : {}),
    },

    metadata: {
      paymentReference:
        validated.reference,

      ...(validated.metadata ??
        {}),
    },
  };

  const raw =
    await monerooRequest(
      MONEROO_INITIALIZE_PATH,
      {
        method: "POST",
        body: payload,
      },
    );

  const data =
    getNestedObject(
      raw,
      "data",
    ) ??
    raw;

  const providerPaymentId =
    firstString([
      data.id,
      data.payment_id,
      data.paymentId,
    ]);

  if (
    !providerPaymentId ||
    providerPaymentId.length >
      MAX_PROVIDER_PAYMENT_ID_LENGTH
  ) {
    throw new MonerooError(
      "Moneroo n'a retourné aucun identifiant de paiement valide.",
      {
        responseBody:
          sanitizeMonerooLogData(
            raw,
          ),
      },
    );
  }

  const checkoutUrlValue =
    firstString([
      data.checkout_url,
      data.checkoutUrl,
      data.url,
    ]);

  if (!checkoutUrlValue) {
    throw new MonerooError(
      "Moneroo n'a retourné aucune URL de paiement.",
      {
        responseBody:
          sanitizeMonerooLogData(
            raw,
          ),
      },
    );
  }

  const checkoutUrl =
    assertCheckoutUrl(
      checkoutUrlValue,
    );

  const status =
    normalizeMonerooPaymentStatus(
      data.status,
    );

  return {
    providerPaymentId,

    status,

    checkoutUrl,

    raw,
  };
}

/**
 * ============================================================================
 * VÉRIFICATION SERVEUR DU PAIEMENT
 * ============================================================================
 */

export async function verifyMonerooPayment(
  providerPaymentId: string,
): Promise<MonerooVerifiedPayment> {
  const normalizedPaymentId =
    providerPaymentId.trim();

  if (
    !normalizedPaymentId ||
    normalizedPaymentId.length >
      MAX_PROVIDER_PAYMENT_ID_LENGTH
  ) {
    throw new MonerooError(
      "L'identifiant du paiement Moneroo est invalide.",
    );
  }

  const raw =
    await monerooRequest(
      `/v1/payments/${encodeURIComponent(
        normalizedPaymentId,
      )}/verify`,
      {
        method: "GET",
      },
    );

  const data =
    getNestedObject(
      raw,
      "data",
    ) ??
    raw;

  const returnedPaymentId =
    firstString([
      data.id,
      data.payment_id,
      data.paymentId,
    ]) ??
    normalizedPaymentId;

  if (
    returnedPaymentId !==
    normalizedPaymentId
  ) {
    throw new MonerooError(
      "L'identifiant retourné par Moneroo ne correspond pas au paiement demandé.",
    );
  }

  const status =
    normalizeMonerooPaymentStatus(
      data.status,
    );

  const amount =
    parsePositiveIntegerValue(
      data.amount,
    );

  const currency =
    parseCurrencyValue(
      data.currency,
    );

  const metadata =
    getNestedObject(
      data,
      "metadata",
    ) ??
    getNestedObject(
      raw,
      "metadata",
    );

  const reference =
    firstString([
      data.reference,

      metadata
        ? metadata.paymentReference
        : null,

      metadata
        ? metadata.payment_reference
        : null,
    ]);

  return {
    providerPaymentId:
      returnedPaymentId,

    status,

    amount,

    currency,

    reference,

    raw,
  };
}

/**
 * ============================================================================
 * SIGNATURE WEBHOOK
 * ============================================================================
 */

function normalizeReceivedSignature(
  signature: string,
): string | null {
  const normalized =
    signature
      .trim()
      .replace(
        /^sha256=/i,
        "",
      )
      .toLowerCase();

  if (
    !/^[a-f0-9]{64}$/.test(
      normalized,
    )
  ) {
    return null;
  }

  return normalized;
}

function safeHexCompare(
  leftHex: string,
  rightHex: string,
): boolean {
  try {
    const left =
      Buffer.from(
        leftHex,
        "hex",
      );

    const right =
      Buffer.from(
        rightHex,
        "hex",
      );

    if (
      left.length === 0 ||
      left.length !==
        right.length
    ) {
      return false;
    }

    return timingSafeEqual(
      left,
      right,
    );
  } catch {
    return false;
  }
}

export function verifyHmacSha256Signature(
  rawBody: string,
  receivedSignature: string,
  secret: string,
): boolean {
  if (
    !rawBody ||
    !receivedSignature ||
    !secret
  ) {
    return false;
  }

  const normalizedReceived =
    normalizeReceivedSignature(
      receivedSignature,
    );

  if (!normalizedReceived) {
    return false;
  }

  const expected =
    createHmac(
      "sha256",
      secret,
    )
      .update(
        rawBody,
        "utf8",
      )
      .digest("hex")
      .toLowerCase();

  return safeHexCompare(
    expected,
    normalizedReceived,
  );
}

export function verifyMonerooWebhookSignature(
  input:
    MonerooWebhookVerificationInput,
): MonerooWebhookVerificationResult {
  const secret =
    process.env
      .MONEROO_WEBHOOK_SECRET
      ?.trim();

  if (
    !secret ||
    !input.signature
  ) {
    return {
      valid: false,
    };
  }

  return {
    valid:
      verifyHmacSha256Signature(
        input.rawBody,
        input.signature,
        secret,
      ),
  };
}

/**
 * ============================================================================
 * PAIEMENT VÉRIFIÉ
 * ============================================================================
 */

export function assertServerVerifiedPayment(
  payment:
    MonerooVerifiedPayment,
): void {
  if (
    payment.status !==
    "paid"
  ) {
    throw new MonerooError(
      "Le paiement n'est pas confirmé comme payé par Moneroo.",
    );
  }

  if (
    !payment.providerPaymentId
      .trim()
  ) {
    throw new MonerooError(
      "L'identifiant du paiement Moneroo est absent.",
    );
  }

  if (
    payment.amount ===
      null ||
    !Number.isSafeInteger(
      payment.amount,
    ) ||
    payment.amount <= 0
  ) {
    throw new MonerooError(
      "Le montant vérifié du paiement est invalide.",
    );
  }

  if (
    !payment.currency ||
    !/^[A-Z]{3}$/.test(
      payment.currency,
    )
  ) {
    throw new MonerooError(
      "La devise vérifiée du paiement est invalide.",
    );
  }

  if (
    !payment.reference
      ?.trim()
  ) {
    throw new MonerooError(
      "La référence vérifiée du paiement est absente.",
    );
  }
}

/**
 * ============================================================================
 * CORRESPONDANCE PAIEMENT / COMMANDE
 * ============================================================================
 */

export function assertPaymentMatchesOrder(
  payment:
    MonerooVerifiedPayment,

  expected: {
    reference: string;
    amount: number;
    currency: string;
  },
): void {
  assertServerVerifiedPayment(
    payment,
  );

  const expectedReference =
    normalizeReference(
      expected.reference,
    );

  const expectedCurrency =
    normalizeCurrency(
      expected.currency,
    );

  assertPositiveInteger(
    expected.amount,
    "Le montant attendu",
  );

  if (
    payment.reference !==
    expectedReference
  ) {
    throw new MonerooError(
      "La référence du paiement ne correspond pas à la commande.",
    );
  }

  if (
    payment.amount !==
    expected.amount
  ) {
    throw new MonerooError(
      "Le montant payé ne correspond pas au montant de la commande.",
    );
  }

  if (
    payment.currency !==
    expectedCurrency
  ) {
    throw new MonerooError(
      "La devise du paiement ne correspond pas à celle de la commande.",
    );
  }
}

/**
 * ============================================================================
 * LOGS
 * ============================================================================
 */

const FORBIDDEN_LOG_KEYS =
  new Set([
    "authorization",
    "api_key",
    "apikey",
    "api-key",
    "secret",
    "secret_key",
    "secretkey",
    "webhook_secret",
    "password",
    "card",
    "card_number",
    "cardnumber",
    "cvv",
    "cvc",
    "pin",
    "token",
    "access_token",
    "refresh_token",
  ]);

export function sanitizeMonerooLogData(
  value: unknown,
): unknown {
  if (
    Array.isArray(value)
  ) {
    return value.map(
      sanitizeMonerooLogData,
    );
  }

  if (
    typeof value !==
      "object" ||
    value === null
  ) {
    return value;
  }

  const source =
    value as Record<
      string,
      unknown
    >;

  const result:
    Record<
      string,
      unknown
    > = {};

  for (
    const [
      key,
      childValue,
    ] of Object.entries(
      source,
    )
  ) {
    const normalizedKey =
      key
        .trim()
        .toLowerCase();

    if (
      FORBIDDEN_LOG_KEYS.has(
        normalizedKey,
      )
    ) {
      result[key] =
        "[REDACTED]";

      continue;
    }

    result[key] =
      sanitizeMonerooLogData(
        childValue,
      );
  }

  return result;
}

/**
 * ============================================================================
 * ÉTAT DE CONFIGURATION
 * ============================================================================
 */

export function getMonerooConfigurationStatus() {
  const secretKeyConfigured =
    Boolean(
      process.env
        .MONEROO_SECRET_KEY
        ?.trim(),
    );

  const webhookSecretConfigured =
    Boolean(
      process.env
        .MONEROO_WEBHOOK_SECRET
        ?.trim(),
    );

  return {
    apiBaseUrl:
      MONEROO_API_BASE_URL,

    secretKeyConfigured,

    webhookSecretConfigured,

    readyForPaymentApi:
      secretKeyConfigured,

    readyForWebhook:
      webhookSecretConfigured,

    ready:
      secretKeyConfigured &&
      webhookSecretConfigured,
  };
}

/**
 * ============================================================================
 * GARDE DE SÉCURITÉ
 * ============================================================================
 *
 * La page :
 *
 * /paiement/succes
 *
 * n'a aucune autorité pour confirmer un paiement.
 *
 * Les paramètres navigateur :
 *
 * ?status=success
 * ?paid=true
 * ?payment=completed
 *
 * ne doivent JAMAIS :
 *
 * - passer Payment à PAID ;
 * - passer Order à PAID ;
 * - créer Enrollment ;
 * - créer CourseDelivery ;
 * - envoyer le PDF ;
 * - envoyer le lien privé.
 *
 * Seule la confirmation serveur Moneroo peut déclencher la livraison.
 * ============================================================================
 */