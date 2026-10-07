import "server-only";
import {
  DeliveryStatus,
  DeliveryType,
  EnrollmentStatus,
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { courseDeliveryEmailSender } from "@/lib/course-delivery-email";
import {
  coursePrivateFileAccess,
  type CoursePrivateFileType,
} from "@/lib/course-private-storage";

// Livraison serveur uniquement, après confirmation du paiement.
// Les URL signées restent temporaires et ne sont jamais enregistrées en base.

const MAX_ERROR_MESSAGE_LENGTH = 1000;

const PROCESSING_LOCK_MS = 15 * 60 * 1_000;

export type DeliverPaidOrderInput = Readonly<{
  orderId: string;
  paymentId: string;
}>;

export type CourseDeliveryItemResult = Readonly<{
  courseId: string;
  courseTitle: string;
  deliveryId: string;
  status: "SENT" | "ALREADY_SENT" | "PROCESSING" | "FAILED";
  providerMessageId: string | null;
}>;

export type DeliverPaidOrderResult = Readonly<{
  orderId: string;
  orderReference: string;
  paymentId: string;
  deliveries: CourseDeliveryItemResult[];
}>;

export class CourseDeliveryError extends Error {
  readonly code: string;
  readonly statusCode: number;
  constructor(
    code: string,
    message: string,
    statusCode = 500,
    options?: {
      cause?: unknown;
    },
  ) {
    super(message, {
      cause: options?.cause,
    });
    this.name = "CourseDeliveryError";
    this.code = code;
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

type CourseFileForDelivery = {
  id: string;
  type: CoursePrivateFileType;
  name: string;
  path: string;
  mimeType: string | null;
  size: number;
  position: number;
};

type PaidOrderForDelivery = {
  id: string;
  reference: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  currency: string;
  customerFirstName: string | null;
  customerLastName: string | null;
  customerEmail: string;
  items: Array<{
    id: string;
    courseId: string;
    courseTitle: string;
    unitPrice: number;
    quantity: number;
    totalAmount: number;
    currency: string;
    course: {
      id: string;
      title: string;
      privatePdfPath: string | null;
      privatePdfName: string | null;
      privateAccessUrl: string | null;
      files: CourseFileForDelivery[];
    };
  }>;
};

type PaidPaymentForDelivery = {
  id: string;
  orderId: string;
  reference: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  paidAt: Date | null;
};

type DeliveryIdentity = Readonly<{
  orderId: string;
  courseId: string;
}>;

type DeliveryClaimInput = DeliveryIdentity &
  Readonly<{
    paymentId: string;
    recipientEmail: string;
  }>;

type EnrollmentInput = Readonly<{
  userId: string;
  courseId: string;
  orderId: string;
  paymentId: string;
}>;

type DeliveryClaimResult =
  | {
      kind: "CLAIMED";
      deliveryId: string;
    }
  | {
      kind: "ALREADY_SENT";
      deliveryId: string;
      providerMessageId: string | null;
    }
  | {
      kind: "PROCESSING";
      deliveryId: string;
    };

type PrivateDeliveryFile = {
  filename: string;
  url: string;
  type: CoursePrivateFileType;
  mimeType: string | null;
};

function normalizeRequiredId(value: string, fieldName: string): string {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    throw new CourseDeliveryError(
      "INVALID_IDENTIFIER",
      `${fieldName} est obligatoire.`,
      400,
    );
  }
  if (normalized.length > 191) {
    throw new CourseDeliveryError(
      "INVALID_IDENTIFIER",
      `${fieldName} est invalide.`,
      400,
    );
  }
  return normalized;
}

function normalizeEmail(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (
    !normalized ||
    normalized.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
  ) {
    throw new CourseDeliveryError(
      "INVALID_RECIPIENT_EMAIL",
      "L'adresse e-mail de livraison est invalide.",
      500,
    );
  }
  return normalized;
}

function normalizeCurrency(value: string): string {
  const normalized = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new CourseDeliveryError(
      "INVALID_CURRENCY",
      "La devise enregistrée est invalide.",
      500,
    );
  }
  return normalized;
}

function normalizeErrorMessage(error: unknown): string {
  const rawMessage =
    error instanceof Error
      ? error.message
      : "Erreur inconnue pendant la livraison.";
  const normalized = rawMessage
    .replace(/https?:\/\/[^\s"'<>]+/gi, "[URL_MASQUEE]")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) {
    return "Erreur inconnue pendant la livraison.";
  }
  return normalized.slice(0, MAX_ERROR_MESSAGE_LENGTH);
}

function isPositiveSafeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value > 0;
}

// Charger les données de confiance depuis la base.

async function getPaidOrderForDelivery(
  orderId: string,
): Promise<PaidOrderForDelivery> {
  const order = await db.order.findUnique({
    where: {
      id: orderId,
    },
    select: {
      id: true,
      reference: true,
      userId: true,
      status: true,
      totalAmount: true,
      currency: true,
      customerFirstName: true,
      customerLastName: true,
      customerEmail: true,
      items: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          courseId: true,
          courseTitle: true,
          unitPrice: true,
          quantity: true,
          totalAmount: true,
          currency: true,
          course: {
            select: {
              id: true,
              title: true,
              privatePdfPath: true,
              privatePdfName: true,
              privateAccessUrl: true,
              files: {
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
                  name: true,
                  path: true,
                  mimeType: true,
                  size: true,
                  position: true,
                },
              },
            },
          },
        },
      },
    },
  });
  if (!order) {
    throw new CourseDeliveryError(
      "ORDER_NOT_FOUND",
      "La commande est introuvable.",
      404,
    );
  }
  if (order.status !== OrderStatus.PAID) {
    throw new CourseDeliveryError(
      "ORDER_NOT_PAID",
      "La commande n'est pas confirmée comme payée.",
      409,
    );
  }
  if (order.items.length === 0) {
    throw new CourseDeliveryError(
      "ORDER_WITHOUT_COURSE",
      "La commande ne contient aucune formation.",
      409,
    );
  }
  return order;
}

async function getPaidPaymentForDelivery(
  paymentId: string,
): Promise<PaidPaymentForDelivery> {
  const payment = await db.payment.findUnique({
    where: {
      id: paymentId,
    },
    select: {
      id: true,
      orderId: true,
      reference: true,
      status: true,
      amount: true,
      currency: true,
      paidAt: true,
    },
  });
  if (!payment) {
    throw new CourseDeliveryError(
      "PAYMENT_NOT_FOUND",
      "Le paiement est introuvable.",
      404,
    );
  }
  if (payment.status !== PaymentStatus.PAID) {
    throw new CourseDeliveryError(
      "PAYMENT_NOT_PAID",
      "Le paiement n'est pas confirmé comme payé.",
      409,
    );
  }
  if (!payment.paidAt) {
    throw new CourseDeliveryError(
      "PAYMENT_WITHOUT_PAID_DATE",
      "Le paiement est marqué payé sans date de confirmation.",
      409,
    );
  }
  return payment;
}

// Vérifier l’appartenance du paiement, les montants et les devises.

function assertPaymentMatchesOrder(
  order: PaidOrderForDelivery,
  payment: PaidPaymentForDelivery,
): void {
  if (payment.orderId !== order.id) {
    throw new CourseDeliveryError(
      "PAYMENT_ORDER_MISMATCH",
      "Le paiement n'appartient pas à cette commande.",
      409,
    );
  }
  if (!isPositiveSafeInteger(order.totalAmount)) {
    throw new CourseDeliveryError(
      "INVALID_ORDER_AMOUNT",
      "Le montant de la commande est invalide.",
      500,
    );
  }
  if (!isPositiveSafeInteger(payment.amount)) {
    throw new CourseDeliveryError(
      "INVALID_PAYMENT_AMOUNT",
      "Le montant du paiement est invalide.",
      500,
    );
  }
  if (payment.amount !== order.totalAmount) {
    throw new CourseDeliveryError(
      "PAYMENT_AMOUNT_MISMATCH",
      "Le montant payé ne correspond pas au montant de la commande.",
      409,
    );
  }
  const orderCurrency = normalizeCurrency(order.currency);
  const paymentCurrency = normalizeCurrency(payment.currency);
  if (paymentCurrency !== orderCurrency) {
    throw new CourseDeliveryError(
      "PAYMENT_CURRENCY_MISMATCH",
      "La devise du paiement ne correspond pas à celle de la commande.",
      409,
    );
  }
  for (const item of order.items) {
    if (item.course.id !== item.courseId) {
      throw new CourseDeliveryError(
        "COURSE_ORDER_MISMATCH",
        "Une formation de la commande est incohérente.",
        500,
      );
    }
    if (item.quantity !== 1) {
      throw new CourseDeliveryError(
        "INVALID_COURSE_QUANTITY",
        "La quantité d'une formation doit être égale à 1.",
        409,
      );
    }
    if (!isPositiveSafeInteger(item.unitPrice)) {
      throw new CourseDeliveryError(
        "INVALID_ORDER_ITEM_UNIT_PRICE",
        "Le prix d'une formation dans la commande est invalide.",
        500,
      );
    }
    if (!isPositiveSafeInteger(item.totalAmount)) {
      throw new CourseDeliveryError(
        "INVALID_ORDER_ITEM_AMOUNT",
        "Le montant d'une formation dans la commande est invalide.",
        500,
      );
    }
    if (item.totalAmount !== item.unitPrice) {
      throw new CourseDeliveryError(
        "INVALID_ORDER_ITEM_AMOUNT",
        "Le montant d'une formation dans la commande est incohérent.",
        409,
      );
    }
    if (normalizeCurrency(item.currency) !== orderCurrency) {
      throw new CourseDeliveryError(
        "ORDER_ITEM_CURRENCY_MISMATCH",
        "La devise d'une formation ne correspond pas à celle de la commande.",
        409,
      );
    }
  }
  const computedTotal = order.items.reduce(
    (total, item) => total + item.totalAmount,
    0,
  );
  if (!isPositiveSafeInteger(computedTotal)) {
    throw new CourseDeliveryError(
      "INVALID_COMPUTED_TOTAL",
      "Le total calculé de la commande est invalide.",
      500,
    );
  }
  if (computedTotal !== order.totalAmount) {
    throw new CourseDeliveryError(
      "ORDER_TOTAL_MISMATCH",
      "Le total de la commande ne correspond pas aux formations achetées.",
      409,
    );
  }
}

// Conserver la commande d’origine d’un accès existant. Un nouvel achat peut

// réactiver cet accès et compléter son paiement s’il était absent.

async function activateExistingEnrollment(
  enrollment: {
    id: string;
    status: EnrollmentStatus;
    paymentId: string | null;
  },
  paymentId: string,
): Promise<void> {
  if (enrollment.status === EnrollmentStatus.ACTIVE && enrollment.paymentId)
    return;

  await db.enrollment.update({
    where: { id: enrollment.id },
    data: {
      status: EnrollmentStatus.ACTIVE,
      paymentId: enrollment.paymentId ?? paymentId,
    },
  });
}

async function ensureEnrollment(input: EnrollmentInput): Promise<void> {
  const where = {
    userId_courseId: { userId: input.userId, courseId: input.courseId },
  };
  const select = { id: true, status: true, paymentId: true } as const;
  const existing = await db.enrollment.findUnique({ where, select });

  if (existing) {
    await activateExistingEnrollment(existing, input.paymentId);
    return;
  }

  try {
    await db.enrollment.create({
      data: { ...input, status: EnrollmentStatus.ACTIVE },
    });
  } catch (error) {
    // Une autre exécution a pu créer l’accès entre la lecture et l’insertion.
    const concurrent = await db.enrollment.findUnique({ where, select });
    if (!concurrent) {
      throw new CourseDeliveryError(
        "ENROLLMENT_CREATION_FAILED",
        "Impossible d’activer l’accès à la formation.",
        500,
        { cause: error },
      );
    }
    await activateExistingEnrollment(concurrent, input.paymentId);
  }
}

async function findExistingSentDelivery(input: DeliveryIdentity) {
  return db.courseDelivery.findFirst({
    where: {
      orderId: input.orderId,
      courseId: input.courseId,
      type: DeliveryType.PURCHASE_EMAIL,
      status: DeliveryStatus.SENT,
    },
    orderBy: {
      sentAt: "desc",
    },
    select: {
      id: true,
      providerMessageId: true,
    },
  });
}

async function findReusableDelivery(input: DeliveryIdentity) {
  return db.courseDelivery.findFirst({
    where: {
      orderId: input.orderId,
      courseId: input.courseId,
      type: DeliveryType.PURCHASE_EMAIL,
      status: {
        in: [
          DeliveryStatus.PENDING,
          DeliveryStatus.PROCESSING,
          DeliveryStatus.FAILED,
        ],
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      status: true,
      lastAttemptAt: true,
    },
  });
}

async function createPendingDelivery(input: DeliveryClaimInput) {
  return db.courseDelivery.create({
    data: {
      orderId: input.orderId,
      courseId: input.courseId,
      paymentId: input.paymentId,
      recipientEmail: input.recipientEmail,
      type: DeliveryType.PURCHASE_EMAIL,
      status: DeliveryStatus.PENDING,
    },
    select: {
      id: true,
      status: true,
      lastAttemptAt: true,
    },
  });
}

// Réutiliser les tentatives et verrouiller leur traitement par mise à jour conditionnelle.

async function claimDelivery(
  input: DeliveryClaimInput,
): Promise<DeliveryClaimResult> {
  const alreadySent = await findExistingSentDelivery({
    orderId: input.orderId,
    courseId: input.courseId,
  });
  if (alreadySent) {
    return {
      kind: "ALREADY_SENT",
      deliveryId: alreadySent.id,
      providerMessageId: alreadySent.providerMessageId,
    };
  }
  let delivery = await findReusableDelivery({
    orderId: input.orderId,
    courseId: input.courseId,
  });
  if (!delivery) {
    try {
      delivery = await createPendingDelivery({
        orderId: input.orderId,
        courseId: input.courseId,
        paymentId: input.paymentId,
        recipientEmail: input.recipientEmail,
      });
    } catch (error) {
      const sentAfterRace = await findExistingSentDelivery({
        orderId: input.orderId,
        courseId: input.courseId,
      });
      if (sentAfterRace) {
        return {
          kind: "ALREADY_SENT",
          deliveryId: sentAfterRace.id,
          providerMessageId: sentAfterRace.providerMessageId,
        };
      }
      const concurrentDelivery = await findReusableDelivery({
        orderId: input.orderId,
        courseId: input.courseId,
      });
      if (!concurrentDelivery) {
        throw new CourseDeliveryError(
          "DELIVERY_CREATION_FAILED",
          "Impossible de préparer la livraison de la formation.",
          500,
          {
            cause: error,
          },
        );
      }
      delivery = concurrentDelivery;
    }
  }
  if (delivery.status === DeliveryStatus.PROCESSING) {
    const staleBefore = new Date(Date.now() - PROCESSING_LOCK_MS);
    if (delivery.lastAttemptAt && delivery.lastAttemptAt > staleBefore) {
      return {
        kind: "PROCESSING",
        deliveryId: delivery.id,
      };
    }
    await db.courseDelivery.updateMany({
      where: {
        id: delivery.id,
        status: DeliveryStatus.PROCESSING,
        OR: [
          {
            lastAttemptAt: null,
          },
          {
            lastAttemptAt: {
              lte: staleBefore,
            },
          },
        ],
      },
      data: {
        status: DeliveryStatus.FAILED,
        errorMessage:
          "Une tentative précédente de livraison a été interrompue.",
      },
    });
  }
  const claimed = await db.courseDelivery.updateMany({
    where: {
      id: delivery.id,
      status: {
        in: [DeliveryStatus.PENDING, DeliveryStatus.FAILED],
      },
    },
    data: {
      status: DeliveryStatus.PROCESSING,
      paymentId: input.paymentId,
      recipientEmail: input.recipientEmail,
      attempts: {
        increment: 1,
      },
      lastAttemptAt: new Date(),
      errorMessage: null,
    },
  });
  if (claimed.count === 1) {
    return {
      kind: "CLAIMED",
      deliveryId: delivery.id,
    };
  }
  const current = await db.courseDelivery.findUnique({
    where: {
      id: delivery.id,
    },
    select: {
      id: true,
      status: true,
      providerMessageId: true,
    },
  });
  if (current?.status === DeliveryStatus.SENT) {
    return {
      kind: "ALREADY_SENT",
      deliveryId: current.id,
      providerMessageId: current.providerMessageId,
    };
  }
  if (current?.status === DeliveryStatus.PROCESSING) {
    return {
      kind: "PROCESSING",
      deliveryId: current.id,
    };
  }
  throw new CourseDeliveryError(
    "DELIVERY_CLAIM_FAILED",
    "Impossible de verrouiller la livraison de la formation.",
    409,
  );
}

// Les fichiers CourseFile sont prioritaires ; le PDF historique sert de repli.

async function createPrivateFileAttachments(
  input: Readonly<{
    courseTitle: string;
    files: CourseFileForDelivery[];
    legacyPrivatePdfPath: string | null;
    legacyPrivatePdfName: string | null;
  }>,
): Promise<PrivateDeliveryFile[]> {
  if (input.files.length > 0) {
    try {
      const accesses = await coursePrivateFileAccess.createSignedFileUrls(
        input.files.map((file) => ({
          path: file.path,
          filename: file.name,
          type: file.type,
          mimeType: file.mimeType,
        })),
      );
      return accesses.map((access) => ({
        filename: access.filename,
        url: access.url,
        type: access.type,
        mimeType: access.mimeType,
      }));
    } catch (error) {
      throw new CourseDeliveryError(
        "PRIVATE_FILES_ACCESS_FAILED",
        "Impossible de préparer l'accès sécurisé aux fichiers de la formation.",
        500,
        {
          cause: error,
        },
      );
    }
  }
  const legacyPrivatePdfPath = input.legacyPrivatePdfPath?.trim();
  if (!legacyPrivatePdfPath) {
    return [];
  }
  try {
    const pdfAccess = await coursePrivateFileAccess.createSignedPdfUrl({
      privatePdfPath: legacyPrivatePdfPath,
      filename:
        input.legacyPrivatePdfName?.trim() || `${input.courseTitle}.pdf`,
    });
    return [
      {
        filename: pdfAccess.filename,
        url: pdfAccess.url,
        type: "PDF",
        mimeType: "application/pdf",
      },
    ];
  } catch (error) {
    throw new CourseDeliveryError(
      "PRIVATE_PDF_ACCESS_FAILED",
      "Impossible de préparer l'accès sécurisé au PDF historique de la formation.",
      500,
      {
        cause: error,
      },
    );
  }
}

function normalizePrivateAccessUrl(value: string | null): string | null {
  const normalized = value?.trim();
  if (!normalized) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new CourseDeliveryError(
      "INVALID_PRIVATE_ACCESS_URL",
      "Le lien privé de la formation est invalide.",
      500,
    );
  }
  if (url.protocol !== "https:") {
    throw new CourseDeliveryError(
      "INVALID_PRIVATE_ACCESS_URL",
      "Le lien privé de la formation doit utiliser HTTPS.",
      500,
    );
  }
  return url.toString();
}

async function markDeliveryFailed(
  deliveryId: string,
  error: unknown,
): Promise<void> {
  const errorMessage = normalizeErrorMessage(error);
  try {
    await db.courseDelivery.updateMany({
      where: {
        id: deliveryId,
        status: DeliveryStatus.PROCESSING,
      },
      data: {
        status: DeliveryStatus.FAILED,
        errorMessage,
      },
    });
  } catch {
    // Préserver l’erreur de livraison si la mise à jour échoue également.
  }
}

function buildDeliveryResult(
  item: PaidOrderForDelivery["items"][number],
  deliveryId: string,
  status: CourseDeliveryItemResult["status"],
  providerMessageId: string | null = null,
): CourseDeliveryItemResult {
  return {
    courseId: item.courseId,
    courseTitle: item.courseTitle,
    deliveryId,
    status,
    providerMessageId,
  };
}

// Une panne de stockage ou d’e-mail ne doit pas annuler un paiement confirmé.

async function deliverCourse(
  input: Readonly<{
    order: PaidOrderForDelivery;
    payment: PaidPaymentForDelivery;
    item: PaidOrderForDelivery["items"][number];
    recipientEmail: string;
  }>,
): Promise<CourseDeliveryItemResult> {
  const { order, payment, item, recipientEmail } = input;
  await ensureEnrollment({
    userId: order.userId,
    courseId: item.courseId,
    orderId: order.id,
    paymentId: payment.id,
  });
  const claim = await claimDelivery({
    orderId: order.id,
    courseId: item.courseId,
    paymentId: payment.id,
    recipientEmail,
  });
  if (claim.kind === "ALREADY_SENT") {
    return buildDeliveryResult(
      item,
      claim.deliveryId,
      "ALREADY_SENT",
      claim.providerMessageId,
    );
  }
  if (claim.kind === "PROCESSING") {
    return buildDeliveryResult(item, claim.deliveryId, "PROCESSING");
  }
  const deliveryId = claim.deliveryId;
  try {
    const files = await createPrivateFileAttachments({
      courseTitle: item.courseTitle,
      files: item.course.files,
      legacyPrivatePdfPath: item.course.privatePdfPath,
      legacyPrivatePdfName: item.course.privatePdfName,
    });
    const privateAccessUrl = normalizePrivateAccessUrl(
      item.course.privateAccessUrl,
    );
    if (files.length === 0 && !privateAccessUrl) {
      throw new CourseDeliveryError(
        "COURSE_HAS_NO_PRIVATE_CONTENT",
        `La formation "${item.courseTitle}" ne contient aucun fichier privé ni lien privé à livrer.`,
        409,
      );
    }
    const firstPdf = files.find((file) => file.type === "PDF") ?? null;
    const emailResult = await courseDeliveryEmailSender.sendCourseDeliveryEmail(
      {
        recipientEmail,
        customerFirstName: order.customerFirstName,
        customerLastName: order.customerLastName,
        orderReference: order.reference,
        courseTitle: item.courseTitle,
        privateAccessUrl,
        pdf: firstPdf
          ? {
              filename: firstPdf.filename,
              url: firstPdf.url,
            }
          : null,
        files,
      },
    );
    const providerMessageId = emailResult.providerMessageId?.trim() || null;
    const markedSent = await db.courseDelivery.updateMany({
      where: {
        id: deliveryId,
        status: DeliveryStatus.PROCESSING,
      },
      data: {
        status: DeliveryStatus.SENT,
        providerMessageId,
        sentAt: new Date(),
        errorMessage: null,
      },
    });
    if (markedSent.count !== 1) {
      throw new CourseDeliveryError(
        "DELIVERY_FINALIZATION_FAILED",
        "L'e-mail a été envoyé mais son statut de livraison n'a pas pu être finalisé correctement.",
        500,
      );
    }
    return buildDeliveryResult(item, deliveryId, "SENT", providerMessageId);
  } catch (error) {
    await markDeliveryFailed(deliveryId, error);
    return buildDeliveryResult(item, deliveryId, "FAILED");
  }
}

/** Livrer une commande payée. À appeler depuis le serveur après vérification du paiement. */

export async function deliverPaidOrder(
  input: DeliverPaidOrderInput,
): Promise<DeliverPaidOrderResult> {
  const orderId = normalizeRequiredId(
    input.orderId,
    "L'identifiant de la commande",
  );
  const paymentId = normalizeRequiredId(
    input.paymentId,
    "L'identifiant du paiement",
  );
  const [order, payment] = await Promise.all([
    getPaidOrderForDelivery(orderId),
    getPaidPaymentForDelivery(paymentId),
  ]);
  assertPaymentMatchesOrder(order, payment);
  const recipientEmail = normalizeEmail(order.customerEmail);
  const deliveries: CourseDeliveryItemResult[] = [];
  for (const item of order.items) {
    const result = await deliverCourse({
      order,
      payment,
      item,
      recipientEmail,
    });
    deliveries.push(result);
  }
  return {
    orderId: order.id,
    orderReference: order.reference,
    paymentId: payment.id,
    deliveries,
  };
}

/** Relancer en appliquant les mêmes contrôles ; une livraison SENT est ignorée. */

export async function retryPaidOrderDelivery(
  input: DeliverPaidOrderInput,
): Promise<DeliverPaidOrderResult> {
  return deliverPaidOrder(input);
}

/** Lire l’historique. Le point d’entrée appelant doit contrôler l’autorisation. */

export async function getOrderDeliveryStatus(orderIdInput: string) {
  const orderId = normalizeRequiredId(
    orderIdInput,
    "L'identifiant de la commande",
  );
  const order = await db.order.findUnique({
    where: {
      id: orderId,
    },
    select: {
      id: true,
      reference: true,
      status: true,
      deliveries: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          courseId: true,
          paymentId: true,
          recipientEmail: true,
          type: true,
          status: true,
          attempts: true,
          lastAttemptAt: true,
          sentAt: true,
          providerMessageId: true,
          createdAt: true,
          updatedAt: true,
          course: {
            select: {
              title: true,
            },
          },
        },
      },
    },
  });
  if (!order) {
    throw new CourseDeliveryError(
      "ORDER_NOT_FOUND",
      "La commande est introuvable.",
      404,
    );
  }
  return {
    orderId: order.id,
    orderReference: order.reference,
    orderStatus: order.status,
    deliveries: order.deliveries.map((delivery) => ({
      id: delivery.id,
      courseId: delivery.courseId,
      courseTitle: delivery.course.title,
      paymentId: delivery.paymentId,
      recipientEmail: delivery.recipientEmail,
      type: delivery.type,
      status: delivery.status,
      attempts: delivery.attempts,
      lastAttemptAt: delivery.lastAttemptAt,
      sentAt: delivery.sentAt,
      providerMessageId: delivery.providerMessageId,
      createdAt: delivery.createdAt,
      updatedAt: delivery.updatedAt,
    })),
  };
}
