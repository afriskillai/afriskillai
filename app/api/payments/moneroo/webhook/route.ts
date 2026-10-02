import "server-only";

import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
} from "@/generated/prisma/client";

import { deliverPaidOrder } from "@/lib/course-delivery";
import { db } from "@/lib/db";

/**
 * ============================================================================
 * AFRISKILL AI — WEBHOOK MONEROO
 * ============================================================================
 *
 * Route :
 * POST /api/payments/moneroo/webhook
 *
 * RESPONSABILITÉS :
 *
 * - recevoir les notifications Moneroo ;
 * - lire le corps brut de la requête ;
 * - vérifier X-Moneroo-Signature avec HMAC-SHA256 ;
 * - refuser toute notification non authentifiée ;
 * - retrouver le paiement dans PostgreSQL ;
 * - vérifier provider, commande, montant, devise et références ;
 * - appliquer les transitions Payment / Order transactionnellement ;
 * - empêcher la rétrogradation d'un paiement PAID ;
 * - gérer les webhooks répétés de manière idempotente ;
 * - déclencher la livraison uniquement après PAID confirmé ;
 * - ne jamais délivrer depuis la page de retour navigateur ;
 * - ne jamais exposer les liens privés ou PDF dans la réponse.
 *
 * IMPORTANT :
 * MONEROO_WEBHOOK_SECRET doit être exactement le même secret que celui
 * configuré dans le webhook du tableau de bord Moneroo.
 * ============================================================================
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_WEBHOOK_BODY_BYTES = 256 * 1024;
const MAX_REFERENCE_LENGTH = 200;
const MAX_PROVIDER_PAYMENT_ID_LENGTH = 300;
const MAX_STATUS_LENGTH = 100;
const MAX_CURRENCY_LENGTH = 3;

const MONEROO_SIGNATURE_HEADER =
  "x-moneroo-signature";

/**
 * ============================================================================
 * TYPES JSON
 * ============================================================================
 */

type JsonPrimitive =
  | string
  | number
  | boolean
  | null;

type JsonValue =
  | JsonPrimitive
  | JsonObject
  | JsonValue[];

type JsonObject = {
  [key: string]: JsonValue;
};

type NormalizedProviderStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "UNKNOWN";

type ExtractedWebhookPayment = {
  eventType: string | null;
  providerPaymentId: string | null;
  internalPaymentReference: string | null;
  orderReference: string | null;
  status: NormalizedProviderStatus;
  amount: number | null;
  currency: string | null;
};

type WebhookVerificationResult =
  | {
      valid: true;
      reason: "VERIFIED";
    }
  | {
      valid: false;
      reason:
        | "NOT_CONFIGURED"
        | "MISSING_SIGNATURE"
        | "INVALID_SIGNATURE";
    };

type DeliverySummary = {
  triggered: boolean;
  sent: number;
  alreadySent: number;
  processing: number;
  failed: number;
};

/**
 * ============================================================================
 * ERREUR CONTRÔLÉE
 * ============================================================================
 */

class MonerooWebhookError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    code: string,
    message: string,
    statusCode = 400,
    options?: {
      cause?: unknown;
    },
  ) {
    super(message, {
      cause: options?.cause,
    });

    this.name = "MonerooWebhookError";
    this.code = code;
    this.statusCode = statusCode;

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}

/**
 * ============================================================================
 * RÉPONSES
 * ============================================================================
 */

function webhookResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return Response.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate",

        Pragma:
          "no-cache",

        Expires:
          "0",

        "X-Content-Type-Options":
          "nosniff",
      },
    },
  );
}

function webhookErrorResponse(
  error: unknown,
): Response {
  if (
    error instanceof
    MonerooWebhookError
  ) {
    return webhookResponse(
      {
        success: false,

        error: {
          code:
            error.code,

          message:
            error.message,
        },
      },
      error.statusCode,
    );
  }

  /**
   * Ne jamais exposer :
   *
   * - stack trace ;
   * - erreur Prisma ;
   * - corps du webhook ;
   * - clé API ;
   * - secret webhook ;
   * - URL privée ;
   * - URL signée Supabase.
   */
  return webhookResponse(
    {
      success: false,

      error: {
        code:
          "WEBHOOK_INTERNAL_ERROR",

        message:
          "Impossible de traiter la notification de paiement.",
      },
    },
    500,
  );
}

/**
 * ============================================================================
 * OUTILS JSON
 * ============================================================================
 */

function isJsonObject(
  value: unknown,
): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getNestedValue(
  object: JsonObject,
  path: string[],
): JsonValue | undefined {
  let current:
    JsonValue | undefined =
    object;

  for (const key of path) {
    if (!isJsonObject(current)) {
      return undefined;
    }

    current =
      current[key];
  }

  return current;
}

function firstValue(
  object: JsonObject,
  paths: string[][],
): JsonValue | undefined {
  for (const path of paths) {
    const value =
      getNestedValue(
        object,
        path,
      );

    if (
      value !== undefined &&
      value !== null
    ) {
      return value;
    }
  }

  return undefined;
}

function toSafeString(
  value: JsonValue | undefined,
  maxLength: number,
): string | null {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const normalized =
    value.trim();

  if (
    !normalized ||
    normalized.length >
      maxLength
  ) {
    return null;
  }

  return normalized;
}

function toSafeInteger(
  value: JsonValue | undefined,
): number | null {
  if (
    typeof value === "number"
  ) {
    if (
      Number.isSafeInteger(value) &&
      value >= 0
    ) {
      return value;
    }

    return null;
  }

  if (
    typeof value === "string"
  ) {
    const normalized =
      value.trim();

    if (
      !/^\d+$/.test(normalized)
    ) {
      return null;
    }

    const parsed =
      Number.parseInt(
        normalized,
        10,
      );

    if (
      Number.isSafeInteger(parsed) &&
      parsed >= 0
    ) {
      return parsed;
    }
  }

  return null;
}

function normalizeCurrency(
  value: JsonValue | undefined,
): string | null {
  const currency =
    toSafeString(
      value,
      MAX_CURRENCY_LENGTH,
    )?.toUpperCase();

  if (
    !currency ||
    !/^[A-Z]{3}$/.test(currency)
  ) {
    return null;
  }

  return currency;
}

/**
 * ============================================================================
 * STATUT MONEROO
 * ============================================================================
 */

function normalizeProviderStatus(
  value: JsonValue | undefined,
): NormalizedProviderStatus {
  const status =
    toSafeString(
      value,
      MAX_STATUS_LENGTH,
    )
      ?.toLowerCase()
      .replace(
        /[\s-]+/g,
        "_",
      );

  switch (status) {
    case "paid":
    case "successful":
    case "success":
    case "completed":
    case "complete":
      return "PAID";

    case "processing":
    case "in_progress":
      return "PROCESSING";

    case "pending":
    case "initiated":
    case "created":
      return "PENDING";

    case "failed":
    case "failure":
    case "error":
      return "FAILED";

    case "cancelled":
    case "canceled":
      return "CANCELLED";

    case "refunded":
    case "refund":
      return "REFUNDED";

    default:
      return "UNKNOWN";
  }
}

function statusFromEventType(
  eventType: string | null,
): NormalizedProviderStatus {
  const event =
    eventType
      ?.trim()
      .toLowerCase();

  switch (event) {
    case "payment.success":
      return "PAID";

    case "payment.failed":
      return "FAILED";

    case "payment.cancelled":
      return "CANCELLED";

    case "payment.initiated":
      return "PENDING";

    default:
      return "UNKNOWN";
  }
}

/**
 * ============================================================================
 * LECTURE DU CORPS BRUT
 * ============================================================================
 */

async function readRawWebhookBody(
  request: Request,
): Promise<string> {
  const contentLength =
    request.headers.get(
      "content-length",
    );

  if (contentLength) {
    const parsed =
      Number.parseInt(
        contentLength,
        10,
      );

    if (
      Number.isFinite(parsed) &&
      parsed >
        MAX_WEBHOOK_BODY_BYTES
    ) {
      throw new MonerooWebhookError(
        "WEBHOOK_TOO_LARGE",
        "La notification est trop volumineuse.",
        413,
      );
    }
  }

  let rawBody: string;

  try {
    rawBody =
      await request.text();
  } catch {
    throw new MonerooWebhookError(
      "WEBHOOK_BODY_UNREADABLE",
      "Impossible de lire la notification.",
      400,
    );
  }

  if (!rawBody.trim()) {
    throw new MonerooWebhookError(
      "WEBHOOK_EMPTY",
      "La notification est vide.",
      400,
    );
  }

  if (
    Buffer.byteLength(
      rawBody,
      "utf8",
    ) >
    MAX_WEBHOOK_BODY_BYTES
  ) {
    throw new MonerooWebhookError(
      "WEBHOOK_TOO_LARGE",
      "La notification est trop volumineuse.",
      413,
    );
  }

  return rawBody;
}

/**
 * ============================================================================
 * PARSING JSON
 * ============================================================================
 */

function parseWebhookBody(
  rawBody: string,
): JsonObject {
  let parsed: unknown;

  try {
    parsed =
      JSON.parse(rawBody);
  } catch {
    throw new MonerooWebhookError(
      "WEBHOOK_INVALID_JSON",
      "La notification reçue est invalide.",
      400,
    );
  }

  if (!isJsonObject(parsed)) {
    throw new MonerooWebhookError(
      "WEBHOOK_INVALID_PAYLOAD",
      "La notification reçue est invalide.",
      400,
    );
  }

  return parsed;
}

/**
 * ============================================================================
 * VÉRIFICATION OFFICIELLE DE LA SIGNATURE MONEROO
 * ============================================================================
 *
 * Documentation Moneroo :
 *
 * Header :
 * X-Moneroo-Signature
 *
 * Algorithme :
 * HMAC-SHA256
 *
 * Clé :
 * secret configuré sur le webhook Moneroo
 *
 * Valeur :
 * payload/corps du webhook
 *
 * Encodage :
 * hexadécimal
 * ============================================================================
 */

function normalizeWebhookSignature(
  value: string,
): string | null {
  const normalized =
    value
      .trim()
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

function safeSignatureEqual(
  expectedHex: string,
  receivedHex: string,
): boolean {
  try {
    const expected =
      Buffer.from(
        expectedHex,
        "hex",
      );

    const received =
      Buffer.from(
        receivedHex,
        "hex",
      );

    if (
      expected.length === 0 ||
      expected.length !==
        received.length
    ) {
      return false;
    }

    return timingSafeEqual(
      expected,
      received,
    );
  } catch {
    return false;
  }
}

function verifyOfficialMonerooWebhook(
  request: Request,
  rawBody: string,
): WebhookVerificationResult {
  const webhookSecret =
    process.env
      .MONEROO_WEBHOOK_SECRET
      ?.trim();

  if (!webhookSecret) {
    return {
      valid: false,
      reason:
        "NOT_CONFIGURED",
    };
  }

  const signatureHeader =
    request.headers.get(
      MONEROO_SIGNATURE_HEADER,
    );

  if (!signatureHeader) {
    return {
      valid: false,
      reason:
        "MISSING_SIGNATURE",
    };
  }

  const receivedSignature =
    normalizeWebhookSignature(
      signatureHeader,
    );

  if (!receivedSignature) {
    return {
      valid: false,
      reason:
        "INVALID_SIGNATURE",
    };
  }

  const expectedSignature =
    createHmac(
      "sha256",
      webhookSecret,
    )
      .update(
        rawBody,
        "utf8",
      )
      .digest("hex");

  if (
    !safeSignatureEqual(
      expectedSignature,
      receivedSignature,
    )
  ) {
    return {
      valid: false,
      reason:
        "INVALID_SIGNATURE",
    };
  }

  return {
    valid: true,
    reason:
      "VERIFIED",
  };
}

/**
 * ============================================================================
 * EXTRACTION DU WEBHOOK
 * ============================================================================
 */

function extractWebhookPayment(
  payload: JsonObject,
): ExtractedWebhookPayment {
  const eventType =
    toSafeString(
      firstValue(
        payload,
        [
          ["event"],
          ["type"],
          ["event_type"],
        ],
      ),
      100,
    );

  const providerPaymentId =
    toSafeString(
      firstValue(
        payload,
        [
          ["data", "id"],
          ["data", "payment_id"],
          ["data", "paymentId"],
          ["payment", "id"],
          ["payment_id"],
          ["paymentId"],
          ["id"],
        ],
      ),
      MAX_PROVIDER_PAYMENT_ID_LENGTH,
    );

  const internalPaymentReference =
    toSafeString(
      firstValue(
        payload,
        [
          [
            "data",
            "metadata",
            "paymentReference",
          ],
          [
            "data",
            "metadata",
            "payment_reference",
          ],
          [
            "metadata",
            "paymentReference",
          ],
          [
            "metadata",
            "payment_reference",
          ],
          ["data", "reference"],
          ["payment", "reference"],
          ["reference"],
        ],
      ),
      MAX_REFERENCE_LENGTH,
    );

  const orderReference =
    toSafeString(
      firstValue(
        payload,
        [
          [
            "data",
            "metadata",
            "orderReference",
          ],
          [
            "data",
            "metadata",
            "order_reference",
          ],
          [
            "metadata",
            "orderReference",
          ],
          [
            "metadata",
            "order_reference",
          ],
          ["order_reference"],
        ],
      ),
      MAX_REFERENCE_LENGTH,
    );

  const payloadStatus =
    normalizeProviderStatus(
      firstValue(
        payload,
        [
          ["data", "status"],
          ["payment", "status"],
          ["status"],
        ],
      ),
    );

  const eventStatus =
    statusFromEventType(
      eventType,
    );

  /**
   * L'événement officiel Moneroo est utilisé comme information
   * complémentaire lorsque data.status n'est pas exploitable.
   */
  const status =
    payloadStatus !== "UNKNOWN"
      ? payloadStatus
      : eventStatus;

  const amount =
    toSafeInteger(
      firstValue(
        payload,
        [
          ["data", "amount"],
          ["payment", "amount"],
          ["amount"],
        ],
      ),
    );

  const currency =
    normalizeCurrency(
      firstValue(
        payload,
        [
          ["data", "currency"],
          ["payment", "currency"],
          ["currency"],
        ],
      ),
    );

  return {
    eventType,
    providerPaymentId,
    internalPaymentReference,
    orderReference,
    status,
    amount,
    currency,
  };
}

/**
 * ============================================================================
 * RECHERCHE DU PAIEMENT
 * ============================================================================
 */

const paymentSelect = {
  id: true,
  orderId: true,
  reference: true,
  provider: true,
  providerPaymentId: true,
  status: true,
  amount: true,
  currency: true,
  verifiedAt: true,
  paidAt: true,
  failedAt: true,
  cancelledAt: true,
  refundedAt: true,

  order: {
    select: {
      id: true,
      reference: true,
      status: true,
      totalAmount: true,
      currency: true,
      paidAt: true,
      cancelledAt: true,
      refundedAt: true,
    },
  },
} satisfies Prisma.PaymentSelect;

async function findPayment(
  extracted: ExtractedWebhookPayment,
) {
  /**
   * Priorité :
   *
   * 1. providerPaymentId
   * 2. référence interne
   *
   * Jamais :
   * - e-mail ;
   * - téléphone ;
   * - montant seul.
   */

  if (
    extracted.providerPaymentId
  ) {
    const byProvider =
      await db.payment.findFirst({
        where: {
          provider:
            PaymentProvider.MONEROO,

          providerPaymentId:
            extracted.providerPaymentId,
        },

        select:
          paymentSelect,
      });

    if (byProvider) {
      return byProvider;
    }
  }

  if (
    extracted.internalPaymentReference
  ) {
    const byReference =
      await db.payment.findUnique({
        where: {
          reference:
            extracted
              .internalPaymentReference,
        },

        select:
          paymentSelect,
      });

    if (byReference) {
      return byReference;
    }
  }

  return null;
}

type StoredPayment =
  NonNullable<
    Awaited<
      ReturnType<
        typeof findPayment
      >
    >
  >;

/**
 * ============================================================================
 * CONTRÔLES MÉTIER
 * ============================================================================
 */

function assertPaymentConsistency(
  payment: StoredPayment,
  extracted: ExtractedWebhookPayment,
): void {
  if (
    payment.provider !==
    PaymentProvider.MONEROO
  ) {
    throw new MonerooWebhookError(
      "PAYMENT_PROVIDER_MISMATCH",
      "Le paiement ne correspond pas au fournisseur attendu.",
      409,
    );
  }

  if (
    payment.orderId !==
    payment.order.id
  ) {
    throw new MonerooWebhookError(
      "PAYMENT_ORDER_MISMATCH",
      "Le paiement est incohérent.",
      409,
    );
  }

  if (
    !Number.isSafeInteger(
      payment.amount,
    ) ||
    payment.amount <= 0 ||
    !Number.isSafeInteger(
      payment.order.totalAmount,
    ) ||
    payment.order.totalAmount <= 0
  ) {
    throw new MonerooWebhookError(
      "INVALID_STORED_AMOUNT",
      "Le montant enregistré est invalide.",
      500,
    );
  }

  if (
    payment.amount !==
    payment.order.totalAmount
  ) {
    throw new MonerooWebhookError(
      "STORED_AMOUNT_MISMATCH",
      "Le paiement ne correspond pas au montant de la commande.",
      409,
    );
  }

  const paymentCurrency =
    payment.currency
      .trim()
      .toUpperCase();

  const orderCurrency =
    payment.order.currency
      .trim()
      .toUpperCase();

  if (
    !/^[A-Z]{3}$/.test(
      paymentCurrency,
    ) ||
    !/^[A-Z]{3}$/.test(
      orderCurrency,
    )
  ) {
    throw new MonerooWebhookError(
      "INVALID_STORED_CURRENCY",
      "La devise enregistrée est invalide.",
      500,
    );
  }

  if (
    paymentCurrency !==
    orderCurrency
  ) {
    throw new MonerooWebhookError(
      "STORED_CURRENCY_MISMATCH",
      "La devise du paiement ne correspond pas à la commande.",
      409,
    );
  }

  if (
    extracted.amount !== null &&
    extracted.amount !==
      payment.amount
  ) {
    throw new MonerooWebhookError(
      "PROVIDER_AMOUNT_MISMATCH",
      "Le montant confirmé par le fournisseur ne correspond pas à la commande.",
      409,
    );
  }

  if (
    extracted.currency &&
    extracted.currency !==
      paymentCurrency
  ) {
    throw new MonerooWebhookError(
      "PROVIDER_CURRENCY_MISMATCH",
      "La devise confirmée par le fournisseur ne correspond pas à la commande.",
      409,
    );
  }

  if (
    extracted
      .internalPaymentReference &&
    extracted
      .internalPaymentReference !==
      payment.reference
  ) {
    throw new MonerooWebhookError(
      "PAYMENT_REFERENCE_MISMATCH",
      "La référence du paiement ne correspond pas.",
      409,
    );
  }

  if (
    extracted.orderReference &&
    extracted.orderReference !==
      payment.order.reference
  ) {
    throw new MonerooWebhookError(
      "ORDER_REFERENCE_MISMATCH",
      "La référence de commande ne correspond pas.",
      409,
    );
  }

  if (
    extracted.providerPaymentId &&
    payment.providerPaymentId &&
    extracted.providerPaymentId !==
      payment.providerPaymentId
  ) {
    throw new MonerooWebhookError(
      "PROVIDER_PAYMENT_ID_MISMATCH",
      "L'identifiant fournisseur du paiement ne correspond pas.",
      409,
    );
  }
}

/**
 * ============================================================================
 * TRANSITIONS DE STATUT
 * ============================================================================
 */

function canTransitionPayment(
  current: PaymentStatus,
  next: PaymentStatus,
): boolean {
  if (current === next) {
    return true;
  }

  /**
   * Un paiement confirmé ne peut pas redevenir :
   *
   * - PENDING ;
   * - PROCESSING ;
   * - FAILED ;
   * - CANCELLED.
   *
   * REFUNDED reste possible.
   */
  if (
    current ===
    PaymentStatus.PAID
  ) {
    return (
      next ===
        PaymentStatus.PAID ||
      next ===
        PaymentStatus.REFUNDED
    );
  }

  /**
   * Un remboursement est terminal.
   */
  if (
    current ===
    PaymentStatus.REFUNDED
  ) {
    return (
      next ===
      PaymentStatus.REFUNDED
    );
  }

  /**
   * Une notification PAID authentifiée peut arriver après
   * CANCELLED/FAILED dans certains scénarios asynchrones.
   */
  if (
    current ===
    PaymentStatus.CANCELLED
  ) {
    return (
      next ===
        PaymentStatus.CANCELLED ||
      next ===
        PaymentStatus.PAID
    );
  }

  if (
    current ===
    PaymentStatus.FAILED
  ) {
    return (
      next ===
        PaymentStatus.FAILED ||
      next ===
        PaymentStatus.PAID
    );
  }

  return true;
}

function providerStatusToPaymentStatus(
  status: NormalizedProviderStatus,
): PaymentStatus | null {
  switch (status) {
    case "PENDING":
      return PaymentStatus.PENDING;

    case "PROCESSING":
      return PaymentStatus.PROCESSING;

    case "PAID":
      return PaymentStatus.PAID;

    case "FAILED":
      return PaymentStatus.FAILED;

    case "CANCELLED":
      return PaymentStatus.CANCELLED;

    case "REFUNDED":
      return PaymentStatus.REFUNDED;

    case "UNKNOWN":
      return null;
  }
}

/**
 * ============================================================================
 * MISE À JOUR TRANSACTIONNELLE
 * ============================================================================
 */

async function applyVerifiedPaymentStatus(
  input: Readonly<{
    paymentId: string;
    providerPaymentId:
      string | null;
    status:
      PaymentStatus;
  }>,
) {
  const now =
    new Date();

  return db.$transaction(
    async (tx) => {
      const payment =
        await tx.payment.findUnique({
          where: {
            id:
              input.paymentId,
          },

          select: {
            id: true,
            orderId: true,
            provider: true,
            providerPaymentId: true,
            status: true,
            amount: true,
            currency: true,

            order: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
                currency: true,
              },
            },
          },
        });

      if (!payment) {
        throw new MonerooWebhookError(
          "PAYMENT_NOT_FOUND",
          "Le paiement est introuvable.",
          404,
        );
      }

      if (
        payment.provider !==
        PaymentProvider.MONEROO
      ) {
        throw new MonerooWebhookError(
          "PAYMENT_PROVIDER_MISMATCH",
          "Le paiement ne correspond pas au fournisseur attendu.",
          409,
        );
      }

      if (
        payment.orderId !==
        payment.order.id
      ) {
        throw new MonerooWebhookError(
          "PAYMENT_ORDER_MISMATCH",
          "Le paiement est incohérent.",
          409,
        );
      }

      if (
        payment.providerPaymentId &&
        input.providerPaymentId &&
        payment.providerPaymentId !==
          input.providerPaymentId
      ) {
        throw new MonerooWebhookError(
          "PROVIDER_PAYMENT_ID_CONFLICT",
          "L'identifiant fournisseur ne correspond pas au paiement enregistré.",
          409,
        );
      }

      if (
        !canTransitionPayment(
          payment.status,
          input.status,
        )
      ) {
        return {
          paymentId:
            payment.id,

          orderId:
            payment.orderId,

          paymentStatus:
            payment.status,

          orderStatus:
            payment.order.status,

          changed:
            false,

          shouldDeliver:
            payment.status ===
              PaymentStatus.PAID &&
            payment.order.status ===
              OrderStatus.PAID,
        };
      }

      const providerPaymentId =
        payment.providerPaymentId ??
        input.providerPaymentId;

      /**
       * Idempotence.
       *
       * Même si le webhook PAID revient plusieurs fois,
       * la livraison elle-même est également idempotente.
       */
      if (
        payment.status ===
          input.status &&
        (
          !input.providerPaymentId ||
          payment.providerPaymentId ===
            input.providerPaymentId
        )
      ) {
        return {
          paymentId:
            payment.id,

          orderId:
            payment.orderId,

          paymentStatus:
            payment.status,

          orderStatus:
            payment.order.status,

          changed:
            false,

          shouldDeliver:
            payment.status ===
              PaymentStatus.PAID &&
            payment.order.status ===
              OrderStatus.PAID,
        };
      }

      const paymentData:
        Prisma.PaymentUpdateInput =
      {
        status:
          input.status,

        providerPaymentId,

        verifiedAt:
          now,
      };

      switch (
        input.status
      ) {
        case PaymentStatus.PAID:
          paymentData.paidAt =
            now;

          paymentData.failedAt =
            null;

          paymentData.cancelledAt =
            null;

          break;

        case PaymentStatus.FAILED:
          paymentData.failedAt =
            now;

          break;

        case PaymentStatus.CANCELLED:
          paymentData.cancelledAt =
            now;

          break;

        case PaymentStatus.REFUNDED:
          paymentData.refundedAt =
            now;

          break;

        case PaymentStatus.PENDING:
        case PaymentStatus.PROCESSING:
          break;
      }

      const updatedPayment =
        await tx.payment.update({
          where: {
            id:
              payment.id,
          },

          data:
            paymentData,

          select: {
            id: true,
            status: true,
          },
        });

      let targetOrderStatus:
        OrderStatus | null =
        null;

      switch (
        input.status
      ) {
        case PaymentStatus.PAID:
          targetOrderStatus =
            OrderStatus.PAID;
          break;

        case PaymentStatus.FAILED:
          if (
            payment.order.status ===
            OrderStatus.PENDING
          ) {
            targetOrderStatus =
              OrderStatus.FAILED;
          }
          break;

        case PaymentStatus.CANCELLED:
          if (
            payment.order.status ===
            OrderStatus.PENDING
          ) {
            targetOrderStatus =
              OrderStatus.CANCELLED;
          }
          break;

        case PaymentStatus.REFUNDED:
          if (
            payment.order.status ===
              OrderStatus.PAID ||
            payment.order.status ===
              OrderStatus.REFUNDED
          ) {
            targetOrderStatus =
              OrderStatus.REFUNDED;
          }
          break;

        case PaymentStatus.PENDING:
        case PaymentStatus.PROCESSING:
          break;
      }

      let updatedOrderStatus =
        payment.order.status;

      if (
        targetOrderStatus &&
        targetOrderStatus !==
          payment.order.status
      ) {
        const orderData:
          Prisma.OrderUpdateInput =
        {
          status:
            targetOrderStatus,
        };

        if (
          targetOrderStatus ===
          OrderStatus.PAID
        ) {
          orderData.paidAt =
            now;

          orderData.cancelledAt =
            null;
        }

        if (
          targetOrderStatus ===
          OrderStatus.CANCELLED
        ) {
          orderData.cancelledAt =
            now;
        }

        if (
          targetOrderStatus ===
          OrderStatus.REFUNDED
        ) {
          orderData.refundedAt =
            now;
        }

        const updatedOrder =
          await tx.order.update({
            where: {
              id:
                payment.orderId,
            },

            data:
              orderData,

            select: {
              status: true,
            },
          });

        updatedOrderStatus =
          updatedOrder.status;
      }

      return {
        paymentId:
          updatedPayment.id,

        orderId:
          payment.orderId,

        paymentStatus:
          updatedPayment.status,

        orderStatus:
          updatedOrderStatus,

        changed:
          true,

        shouldDeliver:
          updatedPayment.status ===
            PaymentStatus.PAID &&
          updatedOrderStatus ===
            OrderStatus.PAID,
      };
    },
    {
      isolationLevel:
        Prisma
          .TransactionIsolationLevel
          .Serializable,
    },
  );
}

/**
 * ============================================================================
 * LIVRAISON AUTOMATIQUE
 * ============================================================================
 *
 * Cette fonction appelle désormais le vrai service :
 *
 * lib/course-delivery.ts
 *
 * Celui-ci est déjà raccordé à :
 *
 * - Resend ;
 * - Supabase Storage privé ;
 * - Enrollment ;
 * - CourseDelivery.
 *
 * Une panne d'e-mail ne remet jamais le paiement PAID en cause.
 * ============================================================================
 */

async function triggerCourseDelivery(
  orderId: string,
  paymentId: string,
): Promise<DeliverySummary> {
  const result =
    await deliverPaidOrder({
      orderId,
      paymentId,
    });

  let sent = 0;
  let alreadySent = 0;
  let processing = 0;
  let failed = 0;

  for (
    const delivery of
    result.deliveries
  ) {
    switch (
      delivery.status
    ) {
      case "SENT":
        sent += 1;
        break;

      case "ALREADY_SENT":
        alreadySent += 1;
        break;

      case "PROCESSING":
        processing += 1;
        break;

      case "FAILED":
        failed += 1;
        break;
    }
  }

  return {
    triggered: true,
    sent,
    alreadySent,
    processing,
    failed,
  };
}

/**
 * ============================================================================
 * POST
 * ============================================================================
 */

export async function POST(
  request: Request,
): Promise<Response> {
  try {
    /**
     * 1. Lire le corps brut.
     *
     * Ne pas appeler request.json() avant la vérification de signature.
     */
    const rawBody =
      await readRawWebhookBody(
        request,
      );

    /**
     * 2. Vérifier l'authenticité.
     */
    const verification =
      verifyOfficialMonerooWebhook(
        request,
        rawBody,
      );

    if (!verification.valid) {
      /**
       * Moneroo demande 403 pour une signature invalide.
       *
       * Aucun accès DB métier.
       * Aucun Payment PAID.
       * Aucun Enrollment.
       * Aucun e-mail.
       */
      throw new MonerooWebhookError(
        "WEBHOOK_AUTHENTICATION_FAILED",
        "La notification de paiement n'a pas pu être authentifiée.",
        403,
      );
    }

    /**
     * 3. Parser seulement après authentification.
     */
    const payload =
      parseWebhookBody(
        rawBody,
      );

    /**
     * 4. Extraire les données.
     */
    const extracted =
      extractWebhookPayment(
        payload,
      );

    /**
     * Seuls les événements de paiement nous concernent.
     */
    if (
      extracted.eventType &&
      !extracted.eventType
        .toLowerCase()
        .startsWith(
          "payment.",
        )
    ) {
      return webhookResponse(
        {
          success: true,
          received: true,
          processed: false,
          reason:
            "IGNORED_NON_PAYMENT_EVENT",
        },
        200,
      );
    }

    const nextPaymentStatus =
      providerStatusToPaymentStatus(
        extracted.status,
      );

    if (!nextPaymentStatus) {
      return webhookResponse(
        {
          success: true,
          received: true,
          processed: false,
          reason:
            "UNSUPPORTED_PAYMENT_STATUS",
        },
        200,
      );
    }

    /**
     * Il faut au minimum disposer d'un identifiant permettant
     * de retrouver le paiement interne.
     */
    if (
      !extracted.providerPaymentId &&
      !extracted
        .internalPaymentReference
    ) {
      throw new MonerooWebhookError(
        "WEBHOOK_PAYMENT_IDENTIFIER_MISSING",
        "La notification ne contient aucun identifiant de paiement exploitable.",
        400,
      );
    }

    /**
     * 5. Retrouver le paiement enregistré côté serveur.
     */
    const payment =
      await findPayment(
        extracted,
      );

    if (!payment) {
      throw new MonerooWebhookError(
        "PAYMENT_NOT_FOUND",
        "Aucun paiement correspondant n'a été trouvé.",
        404,
      );
    }

    /**
     * 6. Contrôles métier.
     */
    assertPaymentConsistency(
      payment,
      extracted,
    );

    /**
     * 7. Mise à jour transactionnelle.
     */
    const result =
      await applyVerifiedPaymentStatus({
        paymentId:
          payment.id,

        providerPaymentId:
          extracted.providerPaymentId,

        status:
          nextPaymentStatus,
      });

    /**
     * 8. Livraison uniquement après PAID.
     *
     * Elle est exécutée APRÈS le commit PostgreSQL.
     *
     * Une panne Resend ou Supabase ne doit jamais annuler
     * un paiement réellement confirmé.
     */
    let delivery:
      DeliverySummary | null =
      null;

    if (
      result.shouldDeliver
    ) {
      try {
        delivery =
          await triggerCourseDelivery(
            result.orderId,
            result.paymentId,
          );
      } catch {
        /**
         * Le paiement reste PAID.
         *
         * Le webhook ne doit pas exposer les détails de l'erreur
         * de livraison.
         *
         * CourseDelivery conserve son propre état FAILED lorsque
         * l'échec se produit pendant son traitement.
         */
        delivery = {
          triggered: true,
          sent: 0,
          alreadySent: 0,
          processing: 0,
          failed: 1,
        };
      }
    }

    /**
     * 9. Réponse sans données privées.
     */
    return webhookResponse(
      {
        success: true,
        received: true,
        processed: true,

        paymentStatus:
          result.paymentStatus,

        orderStatus:
          result.orderStatus,

        changed:
          result.changed,

        delivery,
      },
      200,
    );
  } catch (error) {
    return webhookErrorResponse(
      error,
    );
  }
}

/**
 * ============================================================================
 * AUTRES MÉTHODES HTTP
 * ============================================================================
 */

function methodNotAllowed():
  Response {
  return webhookResponse(
    {
      success: false,

      error: {
        code:
          "METHOD_NOT_ALLOWED",

        message:
          "Méthode non autorisée.",
      },
    },
    405,
  );
}

export async function GET():
  Promise<Response> {
  return methodNotAllowed();
}

export async function PUT():
  Promise<Response> {
  return methodNotAllowed();
}

export async function PATCH():
  Promise<Response> {
  return methodNotAllowed();
}

export async function DELETE():
  Promise<Response> {
  return methodNotAllowed();
}