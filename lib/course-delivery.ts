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
import { coursePrivateFileAccess } from "@/lib/course-private-storage";

/**
 * ============================================================================
 * AFRISKILL AI — LIVRAISON AUTOMATIQUE DES FORMATIONS
 * ============================================================================
 *
 * Ce service orchestre la livraison d'une formation APRÈS confirmation réelle
 * du paiement côté serveur.
 *
 * RÈGLES DE SÉCURITÉ :
 *
 * - aucune livraison si Payment.status !== PAID ;
 * - aucune livraison si Order.status !== PAID ;
 * - le paiement doit appartenir à la commande ;
 * - le montant et la devise doivent correspondre à la commande ;
 * - chaque formation doit réellement appartenir à la commande ;
 * - la quantité d'une formation doit être égale à 1 ;
 * - le PDF reste dans le stockage privé ;
 * - le PDF est transmis via une URL temporaire signée ;
 * - aucune URL publique permanente du PDF n'est enregistrée ;
 * - aucune ressource privée n'est envoyée avant paiement ;
 * - Enrollment est créé/réactivé uniquement après paiement ;
 * - CourseDelivery conserve l'historique des livraisons ;
 * - les tentatives sont comptabilisées ;
 * - une livraison SENT n'est jamais renvoyée automatiquement ;
 * - une panne e-mail ne remet jamais le paiement PAID en cause ;
 * - les informations sensibles ne sont jamais journalisées ici.
 *
 * IMPORTANT :
 * cette fonction doit être déclenchée par le serveur après confirmation
 * authentique du paiement, notamment depuis le webhook Moneroo vérifié.
 *
 * Elle ne doit jamais être déclenchée simplement parce que le navigateur
 * arrive sur une page /paiement/succes.
 * ============================================================================
 */

const MAX_ERROR_MESSAGE_LENGTH = 1_000;
const PROCESSING_LOCK_MINUTES = 15;

/**
 * ============================================================================
 * TYPES PUBLICS
 * ============================================================================
 */

export type DeliverPaidOrderInput = Readonly<{
  orderId: string;
  paymentId: string;
}>;

export type CourseDeliveryItemResult = Readonly<{
  courseId: string;
  courseTitle: string;
  deliveryId: string;

  status:
    | "SENT"
    | "ALREADY_SENT"
    | "PROCESSING"
    | "FAILED";

  providerMessageId: string | null;
}>;

export type DeliverPaidOrderResult = Readonly<{
  orderId: string;
  orderReference: string;
  paymentId: string;
  deliveries: CourseDeliveryItemResult[];
}>;

/**
 * ============================================================================
 * ERREUR CONTRÔLÉE
 * ============================================================================
 */

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

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}

/**
 * ============================================================================
 * TYPES INTERNES
 * ============================================================================
 */

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

/**
 * ============================================================================
 * OUTILS
 * ============================================================================
 */

function normalizeRequiredId(
  value: string,
  fieldName: string,
): string {
  const normalized = value.trim();

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

function normalizeEmail(
  value: string,
): string {
  const normalized = value
    .trim()
    .toLowerCase();

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

function normalizeCurrency(
  value: string,
): string {
  const normalized = value
    .trim()
    .toUpperCase();

  if (!/^[A-Z]{3}$/.test(normalized)) {
    throw new CourseDeliveryError(
      "INVALID_CURRENCY",
      "La devise enregistrée est invalide.",
      500,
    );
  }

  return normalized;
}

function normalizeErrorMessage(
  error: unknown,
): string {
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

  return normalized.slice(
    0,
    MAX_ERROR_MESSAGE_LENGTH,
  );
}

function isPositiveSafeInteger(
  value: number,
): boolean {
  return (
    Number.isSafeInteger(value) &&
    value > 0
  );
}

/**
 * ============================================================================
 * CHARGEMENT DE LA COMMANDE
 * ============================================================================
 */

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

/**
 * ============================================================================
 * CHARGEMENT DU PAIEMENT
 * ============================================================================
 */

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

/**
 * ============================================================================
 * CONTRÔLES PAIEMENT / COMMANDE
 * ============================================================================
 */

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

  const orderCurrency =
    normalizeCurrency(order.currency);

  const paymentCurrency =
    normalizeCurrency(payment.currency);

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

    if (
      normalizeCurrency(item.currency) !==
      orderCurrency
    ) {
      throw new CourseDeliveryError(
        "ORDER_ITEM_CURRENCY_MISMATCH",
        "La devise d'une formation ne correspond pas à celle de la commande.",
        409,
      );
    }
  }

  const computedTotal =
    order.items.reduce(
      (total, item) =>
        total + item.totalAmount,
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

/**
 * ============================================================================
 * ENROLLMENT
 * ============================================================================
 */

async function ensureEnrollment(
  input: Readonly<{
    userId: string;
    courseId: string;
    orderId: string;
    paymentId: string;
  }>,
): Promise<void> {
  const existing =
    await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId: input.courseId,
        },
      },

      select: {
        id: true,
        status: true,
        orderId: true,
        paymentId: true,
      },
    });

  if (!existing) {
    try {
      await db.enrollment.create({
        data: {
          userId: input.userId,
          courseId: input.courseId,
          orderId: input.orderId,
          paymentId: input.paymentId,
          status: EnrollmentStatus.ACTIVE,
        },
      });

      return;
    } catch (error) {
      /**
       * Une deuxième exécution concurrente peut avoir créé l'Enrollment
       * entre le findUnique et le create.
       *
       * On recharge donc l'état réel avant de considérer l'opération
       * comme échouée.
       */
      const concurrentlyCreated =
        await db.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: input.userId,
              courseId: input.courseId,
            },
          },

          select: {
            id: true,
            status: true,
            paymentId: true,
          },
        });

      if (!concurrentlyCreated) {
        throw new CourseDeliveryError(
          "ENROLLMENT_CREATION_FAILED",
          "Impossible d'activer l'accès à la formation.",
          500,
          {
            cause: error,
          },
        );
      }

      if (
        concurrentlyCreated.status !==
          EnrollmentStatus.ACTIVE ||
        !concurrentlyCreated.paymentId
      ) {
        await db.enrollment.update({
          where: {
            id: concurrentlyCreated.id,
          },

          data: {
            status: EnrollmentStatus.ACTIVE,

            paymentId:
              concurrentlyCreated.paymentId ??
              input.paymentId,
          },
        });
      }

      return;
    }
  }

  /**
   * On ne modifie pas orderId d'un Enrollment déjà existant.
   *
   * L'unicité userId/courseId signifie que l'utilisateur possède déjà
   * cette formation. Une nouvelle commande ne doit pas effacer la
   * commande d'origine de l'accès.
   */
  if (
    existing.status !== EnrollmentStatus.ACTIVE ||
    !existing.paymentId
  ) {
    await db.enrollment.update({
      where: {
        id: existing.id,
      },

      data: {
        status: EnrollmentStatus.ACTIVE,

        paymentId:
          existing.paymentId ??
          input.paymentId,
      },
    });
  }
}

/**
 * ============================================================================
 * LIVRAISON — LECTURE
 * ============================================================================
 */

async function findExistingSentDelivery(
  input: Readonly<{
    orderId: string;
    courseId: string;
  }>,
) {
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

async function findReusableDelivery(
  input: Readonly<{
    orderId: string;
    courseId: string;
  }>,
) {
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

/**
 * ============================================================================
 * LIVRAISON — CRÉATION
 * ============================================================================
 */

async function createPendingDelivery(
  input: Readonly<{
    orderId: string;
    courseId: string;
    paymentId: string;
    recipientEmail: string;
  }>,
) {
  return db.courseDelivery.create({
    data: {
      orderId: input.orderId,
      courseId: input.courseId,
      paymentId: input.paymentId,

      recipientEmail:
        input.recipientEmail,

      type:
        DeliveryType.PURCHASE_EMAIL,

      status:
        DeliveryStatus.PENDING,
    },

    select: {
      id: true,
      status: true,
      lastAttemptAt: true,
    },
  });
}

/**
 * ============================================================================
 * VERROU DE LIVRAISON
 * ============================================================================
 *
 * Le webhook peut être reçu plusieurs fois.
 *
 * On utilise donc CourseDelivery.status comme verrou logique :
 *
 * PENDING / FAILED -> PROCESSING
 *
 * Un PROCESSING récent n'est pas repris.
 *
 * Un PROCESSING ancien est considéré comme abandonné et peut être repris.
 *
 * Cela évite autant que possible deux appels simultanés à Resend.
 * ============================================================================
 */

async function claimDelivery(
  input: Readonly<{
    orderId: string;
    courseId: string;
    paymentId: string;
    recipientEmail: string;
  }>,
): Promise<DeliveryClaimResult> {
  const alreadySent =
    await findExistingSentDelivery({
      orderId: input.orderId,
      courseId: input.courseId,
    });

  if (alreadySent) {
    return {
      kind: "ALREADY_SENT",
      deliveryId: alreadySent.id,
      providerMessageId:
        alreadySent.providerMessageId,
    };
  }

  let delivery =
    await findReusableDelivery({
      orderId: input.orderId,
      courseId: input.courseId,
    });

  if (!delivery) {
    try {
      delivery =
        await createPendingDelivery({
          orderId: input.orderId,
          courseId: input.courseId,
          paymentId: input.paymentId,
          recipientEmail:
            input.recipientEmail,
        });
    } catch (error) {
      /**
       * Une exécution concurrente peut avoir créé la livraison.
       * On recharge avant de considérer l'opération comme échouée.
       */
      const sentAfterRace =
        await findExistingSentDelivery({
          orderId: input.orderId,
          courseId: input.courseId,
        });

      if (sentAfterRace) {
        return {
          kind: "ALREADY_SENT",
          deliveryId: sentAfterRace.id,
          providerMessageId:
            sentAfterRace.providerMessageId,
        };
      }

      const concurrentDelivery =
        await findReusableDelivery({
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

  if (
    delivery.status ===
    DeliveryStatus.PROCESSING
  ) {
    const staleBefore =
      new Date(
        Date.now() -
          PROCESSING_LOCK_MINUTES *
            60 *
            1_000,
      );

    if (
      delivery.lastAttemptAt &&
      delivery.lastAttemptAt > staleBefore
    ) {
      return {
        kind: "PROCESSING",
        deliveryId: delivery.id,
      };
    }

    /**
     * PROCESSING trop ancien :
     * une ancienne exécution a probablement été interrompue.
     *
     * On le remet FAILED afin qu'une nouvelle tentative puisse
     * reprendre proprement.
     */
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

  const claimed =
    await db.courseDelivery.updateMany({
      where: {
        id: delivery.id,

        status: {
          in: [
            DeliveryStatus.PENDING,
            DeliveryStatus.FAILED,
          ],
        },
      },

      data: {
        status:
          DeliveryStatus.PROCESSING,

        paymentId:
          input.paymentId,

        recipientEmail:
          input.recipientEmail,

        attempts: {
          increment: 1,
        },

        lastAttemptAt:
          new Date(),

        errorMessage:
          null,
      },
    });

  if (claimed.count === 1) {
    return {
      kind: "CLAIMED",
      deliveryId: delivery.id,
    };
  }

  /**
   * Une autre exécution a pu prendre le verrou juste avant nous.
   * On recharge l'état réel.
   */
  const current =
    await db.courseDelivery.findUnique({
      where: {
        id: delivery.id,
      },

      select: {
        id: true,
        status: true,
        providerMessageId: true,
      },
    });

  if (
    current?.status ===
    DeliveryStatus.SENT
  ) {
    return {
      kind: "ALREADY_SENT",
      deliveryId: current.id,
      providerMessageId:
        current.providerMessageId,
    };
  }

  if (
    current?.status ===
    DeliveryStatus.PROCESSING
  ) {
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

/**
 * ============================================================================
 * PRÉPARATION DU PDF PRIVÉ
 * ============================================================================
 */

async function createPrivatePdfAttachment(
  input: Readonly<{
    courseTitle: string;
    privatePdfPath: string | null;
    privatePdfName: string | null;
  }>,
): Promise<{
  filename: string;
  url: string;
} | null> {
  const privatePdfPath =
    input.privatePdfPath?.trim();

  if (!privatePdfPath) {
    return null;
  }

  try {
    const pdfAccess =
      await coursePrivateFileAccess.createSignedPdfUrl({
        privatePdfPath,

        filename:
          input.privatePdfName?.trim() ||
          `${input.courseTitle}.pdf`,
      });

    return {
      filename:
        pdfAccess.filename,

      url:
        pdfAccess.url,
    };
  } catch (error) {
    throw new CourseDeliveryError(
      "PRIVATE_PDF_ACCESS_FAILED",
      "Impossible de préparer l'accès sécurisé au PDF de la formation.",
      500,
      {
        cause: error,
      },
    );
  }
}

/**
 * ============================================================================
 * LIEN PRIVÉ DE FORMATION
 * ============================================================================
 */

function normalizePrivateAccessUrl(
  value: string | null,
): string | null {
  const normalized =
    value?.trim();

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

/**
 * ============================================================================
 * MARQUAGE FAILED
 * ============================================================================
 */

async function markDeliveryFailed(
  deliveryId: string,
  error: unknown,
): Promise<void> {
  const errorMessage =
    normalizeErrorMessage(error);

  try {
    await db.courseDelivery.updateMany({
      where: {
        id: deliveryId,
        status:
          DeliveryStatus.PROCESSING,
      },

      data: {
        status:
          DeliveryStatus.FAILED,

        errorMessage,
      },
    });
  } catch {
    /**
     * Ne jamais masquer l'erreur originale parce que la mise à jour
     * du statut de livraison a elle-même échoué.
     *
     * Aucun secret n'est journalisé ici.
     */
  }
}

/**
 * ============================================================================
 * LIVRAISON D'UNE FORMATION
 * ============================================================================
 */

async function deliverCourse(
  input: Readonly<{
    order: PaidOrderForDelivery;
    payment: PaidPaymentForDelivery;
    item: PaidOrderForDelivery["items"][number];
    recipientEmail: string;
  }>,
): Promise<CourseDeliveryItemResult> {
  const {
    order,
    payment,
    item,
    recipientEmail,
  } = input;

  /**
   * L'accès applicatif est créé uniquement après :
   *
   * - Order PAID ;
   * - Payment PAID ;
   * - contrôle montant ;
   * - contrôle devise ;
   * - contrôle d'appartenance du paiement ;
   * - contrôle de la formation.
   */
  await ensureEnrollment({
    userId: order.userId,
    courseId: item.courseId,
    orderId: order.id,
    paymentId: payment.id,
  });

  const claim =
    await claimDelivery({
      orderId: order.id,
      courseId: item.courseId,
      paymentId: payment.id,
      recipientEmail,
    });

  if (
    claim.kind ===
    "ALREADY_SENT"
  ) {
    return {
      courseId:
        item.courseId,

      courseTitle:
        item.courseTitle,

      deliveryId:
        claim.deliveryId,

      status:
        "ALREADY_SENT",

      providerMessageId:
        claim.providerMessageId,
    };
  }

  if (
    claim.kind ===
    "PROCESSING"
  ) {
    return {
      courseId:
        item.courseId,

      courseTitle:
        item.courseTitle,

      deliveryId:
        claim.deliveryId,

      status:
        "PROCESSING",

      providerMessageId:
        null,
    };
  }

  const deliveryId =
    claim.deliveryId;

  try {
    /**
     * Le lien signé n'est généré qu'après acquisition du verrou.
     *
     * Il n'est ni stocké dans PostgreSQL ni journalisé.
     */
    const pdf =
      await createPrivatePdfAttachment({
        courseTitle:
          item.courseTitle,

        privatePdfPath:
          item.course.privatePdfPath,

        privatePdfName:
          item.course.privatePdfName,
      });

    const privateAccessUrl =
      normalizePrivateAccessUrl(
        item.course.privateAccessUrl,
      );

    if (
      !pdf &&
      !privateAccessUrl
    ) {
      throw new CourseDeliveryError(
        "COURSE_HAS_NO_PRIVATE_CONTENT",
        `La formation "${item.courseTitle}" ne contient aucun PDF ni lien privé à livrer.`,
        409,
      );
    }

    /**
     * Envoi réel via Resend.
     *
     * courseDeliveryEmailSender est le service serveur défini dans :
     * lib/course-delivery-email.ts
     */
    const emailResult =
      await courseDeliveryEmailSender.sendCourseDeliveryEmail({
        recipientEmail,

        customerFirstName:
          order.customerFirstName,

        customerLastName:
          order.customerLastName,

        orderReference:
          order.reference,

        courseTitle:
          item.courseTitle,

        privateAccessUrl,

        pdf,
      });

    const providerMessageId =
      emailResult.providerMessageId
        ?.trim() || null;

    /**
     * SENT n'est enregistré qu'après réussite effective de Resend.
     *
     * updateMany + status PROCESSING empêche une ancienne exécution
     * de réécrire un état terminal inattendu.
     */
    const markedSent =
      await db.courseDelivery.updateMany({
        where: {
          id: deliveryId,
          status:
            DeliveryStatus.PROCESSING,
        },

        data: {
          status:
            DeliveryStatus.SENT,

          providerMessageId,

          sentAt:
            new Date(),

          errorMessage:
            null,
        },
      });

    if (markedSent.count !== 1) {
      throw new CourseDeliveryError(
        "DELIVERY_FINALIZATION_FAILED",
        "L'e-mail a été envoyé mais son statut de livraison n'a pas pu être finalisé correctement.",
        500,
      );
    }

    return {
      courseId:
        item.courseId,

      courseTitle:
        item.courseTitle,

      deliveryId,

      status:
        "SENT",

      providerMessageId,
    };
  } catch (error) {
    /**
     * IMPORTANT :
     *
     * Payment reste PAID.
     * Order reste PAID.
     * Enrollment reste actif.
     *
     * Une panne Resend/Supabase ne doit jamais annuler
     * un paiement réellement confirmé.
     */
    await markDeliveryFailed(
      deliveryId,
      error,
    );

    return {
      courseId:
        item.courseId,

      courseTitle:
        item.courseTitle,

      deliveryId,

      status:
        "FAILED",

      providerMessageId:
        null,
    };
  }
}

/**
 * ============================================================================
 * LIVRAISON PRINCIPALE
 * ============================================================================
 *
 * Fonction à appeler APRÈS confirmation serveur authentique du paiement.
 *
 * Exemple :
 *
 * await deliverPaidOrder({
 *   orderId,
 *   paymentId,
 * });
 *
 * Les services Resend et Supabase sont maintenant raccordés directement.
 *
 * Aucun adaptateur n'est à transmettre depuis le webhook.
 * ============================================================================
 */

export async function deliverPaidOrder(
  input: DeliverPaidOrderInput,
): Promise<DeliverPaidOrderResult> {
  const orderId =
    normalizeRequiredId(
      input.orderId,
      "L'identifiant de la commande",
    );

  const paymentId =
    normalizeRequiredId(
      input.paymentId,
      "L'identifiant du paiement",
    );

  /**
   * On recharge toujours les données depuis PostgreSQL.
   *
   * Aucune donnée critique provenant du navigateur ou du webhook brut
   * n'est utilisée comme source de vérité.
   */
  const [
    order,
    payment,
  ] = await Promise.all([
    getPaidOrderForDelivery(
      orderId,
    ),

    getPaidPaymentForDelivery(
      paymentId,
    ),
  ]);

  assertPaymentMatchesOrder(
    order,
    payment,
  );

  const recipientEmail =
    normalizeEmail(
      order.customerEmail,
    );

  const deliveries:
    CourseDeliveryItemResult[] = [];

  /**
   * Traitement séquentiel volontaire.
   *
   * Cela simplifie :
   * - l'idempotence ;
   * - le suivi des tentatives ;
   * - la traçabilité ;
   * - la protection contre plusieurs appels externes simultanés.
   */
  for (const item of order.items) {
    const result =
      await deliverCourse({
        order,
        payment,
        item,
        recipientEmail,
      });

    deliveries.push(
      result,
    );
  }

  return {
    orderId:
      order.id,

    orderReference:
      order.reference,

    paymentId:
      payment.id,

    deliveries,
  };
}

/**
 * ============================================================================
 * RELANCE D'UNE LIVRAISON
 * ============================================================================
 *
 * Une relance repasse obligatoirement par les mêmes contrôles :
 *
 * - Order PAID ;
 * - Payment PAID ;
 * - paiement appartenant à la commande ;
 * - montant identique ;
 * - devise identique ;
 * - formation appartenant à la commande.
 *
 * Une livraison SENT n'est jamais renvoyée.
 *
 * Une livraison FAILED peut être reprise.
 * ============================================================================
 */

export async function retryPaidOrderDelivery(
  input: DeliverPaidOrderInput,
): Promise<DeliverPaidOrderResult> {
  return deliverPaidOrder(
    input,
  );
}

/**
 * ============================================================================
 * LECTURE DU STATUT DE LIVRAISON
 * ============================================================================
 */

export async function getOrderDeliveryStatus(
  orderIdInput: string,
) {
  const orderId =
    normalizeRequiredId(
      orderIdInput,
      "L'identifiant de la commande",
    );

  const order =
    await db.order.findUnique({
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
    orderId:
      order.id,

    orderReference:
      order.reference,

    orderStatus:
      order.status,

    deliveries:
      order.deliveries.map(
        (delivery) => ({
          id:
            delivery.id,

          courseId:
            delivery.courseId,

          courseTitle:
            delivery.course.title,

          paymentId:
            delivery.paymentId,

          recipientEmail:
            delivery.recipientEmail,

          type:
            delivery.type,

          status:
            delivery.status,

          attempts:
            delivery.attempts,

          lastAttemptAt:
            delivery.lastAttemptAt,

          sentAt:
            delivery.sentAt,

          providerMessageId:
            delivery.providerMessageId,

          createdAt:
            delivery.createdAt,

          updatedAt:
            delivery.updatedAt,
        }),
      ),
  };
}