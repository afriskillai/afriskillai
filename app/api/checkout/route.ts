import "server-only";

import { randomBytes } from "node:crypto";

import {
  CourseStatus,
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  UserStatus,
} from "@/generated/prisma/client";

import { db } from "@/lib/db";

import {
  initializeMonerooPayment,
  MonerooError,
} from "@/lib/moneroo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BODY_BYTES = 16_384;

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 320;
const MAX_PHONE_LENGTH = 50;
const MAX_COURSE_ID_LENGTH = 191;

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PHONE_PATTERN =
  /^\+?[0-9][0-9\s().-]{5,48}$/;

type CheckoutRequestBody = {
  courseId?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  email?: unknown;
  whatsapp?: unknown;
  phone?: unknown;
};

type CheckoutCustomer = {
  firstName: string;
  lastName: string | null;
  email: string;
  phone: string;
};

type CheckoutCourse = {
  id: string;
  title: string;
  regularPrice: number;
  effectivePrice: number;
  promotionalPrice: number | null;
  currency: string;
};

type CheckoutIdentity = {
  userId: string;
};

type CreatedCheckout = {
  order: {
    id: string;
    reference: string;
    status: OrderStatus;
    subtotal: number;
    discountAmount: number;
    totalAmount: number;
    currency: string;
  };

  payment: {
    id: string;
    reference: string;
    status: PaymentStatus;
    amount: number;
    currency: string;
  };
};

class CheckoutError extends Error {
  readonly code: string;
  readonly statusCode: number;

  constructor(
    code: string,
    message: string,
    statusCode: number,
    options?: {
      cause?: unknown;
    },
  ) {
    super(message, {
      cause: options?.cause,
    });

    this.name = "CheckoutError";
    this.code = code;
    this.statusCode = statusCode;

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );
  }
}

function jsonResponse(
  body: Record<string, unknown>,
  status = 200,
): Response {
  return Response.json(body, {
    status,

    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",

      Pragma: "no-cache",
      Expires: "0",

      "X-Content-Type-Options":
        "nosniff",
    },
  });
}

function redirectResponse(
  url: string,
  status = 303,
): Response {
  return new Response(null, {
    status,

    headers: {
      Location: url,

      "Cache-Control":
        "no-store, no-cache, must-revalidate",

      Pragma: "no-cache",
      Expires: "0",

      "X-Content-Type-Options":
        "nosniff",
    },
  });
}

function errorResponse(
  error: unknown,
): Response {
  if (
    error instanceof CheckoutError
  ) {
    return jsonResponse(
      {
        success: false,

        error: {
          code: error.code,
          message: error.message,
        },
      },
      error.statusCode,
    );
  }

  return jsonResponse(
    {
      success: false,

      error: {
        code:
          "CHECKOUT_INTERNAL_ERROR",

        message:
          "Impossible de préparer le paiement pour le moment.",
      },
    },
    500,
  );
}

function normalizeRequiredString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string {
  if (
    typeof value !== "string"
  ) {
    throw new CheckoutError(
      "INVALID_CHECKOUT_DATA",
      `${fieldName} est obligatoire.`,
      400,
    );
  }

  const normalized =
    value.trim();

  if (!normalized) {
    throw new CheckoutError(
      "INVALID_CHECKOUT_DATA",
      `${fieldName} est obligatoire.`,
      400,
    );
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new CheckoutError(
      "INVALID_CHECKOUT_DATA",
      `${fieldName} est trop long.`,
      400,
    );
  }

  return normalized;
}

function normalizeOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number,
): string | null {
  if (
    value === undefined ||
    value === null
  ) {
    return null;
  }

  if (
    typeof value !== "string"
  ) {
    throw new CheckoutError(
      "INVALID_CHECKOUT_DATA",
      `${fieldName} est invalide.`,
      400,
    );
  }

  const normalized =
    value.trim();

  if (!normalized) {
    return null;
  }

  if (
    normalized.length >
    maxLength
  ) {
    throw new CheckoutError(
      "INVALID_CHECKOUT_DATA",
      `${fieldName} est trop long.`,
      400,
    );
  }

  return normalized;
}

function normalizeEmail(
  value: unknown,
): string {
  const email =
    normalizeRequiredString(
      value,
      "L'adresse e-mail",
      MAX_EMAIL_LENGTH,
    ).toLowerCase();

  if (
    !EMAIL_PATTERN.test(email)
  ) {
    throw new CheckoutError(
      "INVALID_EMAIL",
      "L'adresse e-mail est invalide.",
      400,
    );
  }

  return email;
}

function normalizePhone(
  value: unknown,
): string {
  const phone =
    normalizeRequiredString(
      value,
      "Le numéro WhatsApp",
      MAX_PHONE_LENGTH,
    );

  if (
    !PHONE_PATTERN.test(phone)
  ) {
    throw new CheckoutError(
      "INVALID_WHATSAPP",
      "Le numéro WhatsApp est invalide.",
      400,
    );
  }

  return phone;
}

function normalizeCurrency(
  value: string,
): string {
  const currency =
    value
      .trim()
      .toUpperCase();

  if (
    !/^[A-Z]{3}$/.test(
      currency,
    )
  ) {
    throw new CheckoutError(
      "INVALID_COURSE_CURRENCY",
      "La devise de la formation est invalide.",
      500,
    );
  }

  return currency;
}

function formDataToCheckoutBody(
  formData: FormData,
): CheckoutRequestBody {
  const read =
    (
      name: string,
    ): string | undefined => {
      const value =
        formData.get(name);

      return typeof value ===
        "string"
        ? value
        : undefined;
    };

  return {
    courseId:
      read("courseId"),

    firstName:
      read("firstName"),

    lastName:
      read("lastName"),

    email:
      read("email"),

    whatsapp:
      read("whatsapp"),

    phone:
      read("phone"),
  };
}

async function readCheckoutBody(
  request: Request,
): Promise<{
  body: CheckoutRequestBody;
  nativeForm: boolean;
}> {
  const contentLengthHeader =
    request.headers.get(
      "content-length",
    );

  if (contentLengthHeader) {
    const contentLength =
      Number.parseInt(
        contentLengthHeader,
        10,
      );

    if (
      Number.isFinite(
        contentLength,
      ) &&
      contentLength >
        MAX_REQUEST_BODY_BYTES
    ) {
      throw new CheckoutError(
        "REQUEST_TOO_LARGE",
        "Le formulaire envoyé est trop volumineux.",
        413,
      );
    }
  }

  const contentType =
    (
      request.headers.get(
        "content-type",
      ) ?? ""
    ).toLowerCase();

  if (
    contentType.includes(
      "application/json",
    )
  ) {
    let rawBody: string;

    try {
      rawBody =
        await request.text();
    } catch {
      throw new CheckoutError(
        "INVALID_REQUEST_BODY",
        "Impossible de lire le formulaire de commande.",
        400,
      );
    }

    if (
      Buffer.byteLength(
        rawBody,
        "utf8",
      ) >
      MAX_REQUEST_BODY_BYTES
    ) {
      throw new CheckoutError(
        "REQUEST_TOO_LARGE",
        "Le formulaire envoyé est trop volumineux.",
        413,
      );
    }

    if (!rawBody.trim()) {
      throw new CheckoutError(
        "EMPTY_REQUEST_BODY",
        "Le formulaire de commande est vide.",
        400,
      );
    }

    let parsed: unknown;

    try {
      parsed =
        JSON.parse(rawBody);
    } catch {
      throw new CheckoutError(
        "INVALID_JSON",
        "Le formulaire de commande est invalide.",
        400,
      );
    }

    if (
      typeof parsed !==
        "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new CheckoutError(
        "INVALID_REQUEST_BODY",
        "Le formulaire de commande est invalide.",
        400,
      );
    }

    return {
      body:
        parsed as CheckoutRequestBody,

      nativeForm: false,
    };
  }

  if (
    contentType.includes(
      "application/x-www-form-urlencoded",
    ) ||
    contentType.includes(
      "multipart/form-data",
    )
  ) {
    let formData: FormData;

    try {
      formData =
        await request.formData();
    } catch {
      throw new CheckoutError(
        "INVALID_REQUEST_BODY",
        "Impossible de lire le formulaire de commande.",
        400,
      );
    }

    return {
      body:
        formDataToCheckoutBody(
          formData,
        ),

      nativeForm: true,
    };
  }

  throw new CheckoutError(
    "UNSUPPORTED_CONTENT_TYPE",
    "Le formulaire de commande est invalide.",
    415,
  );
}

function normalizeCustomer(
  body: CheckoutRequestBody,
): CheckoutCustomer {
  const firstName =
    normalizeRequiredString(
      body.firstName,
      "Le nom",
      MAX_NAME_LENGTH,
    );

  const lastName =
    normalizeOptionalString(
      body.lastName,
      "Le nom de famille",
      MAX_NAME_LENGTH,
    );

  const email =
    normalizeEmail(
      body.email,
    );

  const phone =
    normalizePhone(
      body.whatsapp ??
        body.phone,
    );

  return {
    firstName,
    lastName,
    email,
    phone,
  };
}

async function getCourseForCheckout(
  courseIdInput: unknown,
): Promise<CheckoutCourse> {
  const courseId =
    normalizeRequiredString(
      courseIdInput,
      "La formation",
      MAX_COURSE_ID_LENGTH,
    );

  const course =
    await db.course.findFirst({
      where: {
        id: courseId,

        status:
          CourseStatus.PUBLISHED,
      },

      select: {
        id: true,
        title: true,

        price: true,
        promotionalPrice: true,

        currency: true,
      },
    });

  if (!course) {
    throw new CheckoutError(
      "COURSE_NOT_AVAILABLE",
      "Cette formation n'est pas disponible à la commande.",
      404,
    );
  }

  if (
    !Number.isSafeInteger(
      course.price,
    ) ||
    course.price <= 0
  ) {
    throw new CheckoutError(
      "INVALID_COURSE_PRICE",
      "Le prix de cette formation est invalide.",
      500,
    );
  }

  if (
    course.promotionalPrice !==
      null &&
    (
      !Number.isSafeInteger(
        course.promotionalPrice,
      ) ||
      course.promotionalPrice <=
        0 ||
      course.promotionalPrice >
        course.price
    )
  ) {
    throw new CheckoutError(
      "INVALID_PROMOTIONAL_PRICE",
      "Le prix promotionnel de cette formation est invalide.",
      500,
    );
  }

  const effectivePrice =
    course.promotionalPrice ??
    course.price;

  return {
    id:
      course.id,

    title:
      course.title,

    regularPrice:
      course.price,

    effectivePrice,

    promotionalPrice:
      course.promotionalPrice,

    currency:
      normalizeCurrency(
        course.currency,
      ),
  };
}

/**
 * ============================================================================
 * IDENTITÉ CLIENT
 * ============================================================================
 *
 * Le checkout public ne doit pas obliger le client à posséder déjà un compte.
 *
 * Cependant le schéma actuel impose Order.userId.
 *
 * Stratégie :
 *
 * 1. Si l'e-mail appartient déjà à un utilisateur ACTIVE :
 *    la commande est attachée à cet utilisateur.
 *
 * 2. Si l'utilisateur existe mais est désactivé :
 *    on refuse d'utiliser silencieusement ce compte.
 *
 * 3. Si aucun utilisateur n'existe :
 *    on crée une identité client technique minimale.
 *
 * IMPORTANT :
 *
 * - aucun mot de passe connu du client n'est créé ;
 * - aucun mot de passe fixe n'est utilisé ;
 * - le hash aléatoire est uniquement destiné à satisfaire le schéma actuel ;
 * - cette création ne constitue pas une authentification ;
 * - le paiement reste validé exclusivement côté serveur.
 * ============================================================================
 */

function createUnusablePasswordHash():
  string {
  return [
    "CHECKOUT_ONLY",
    randomBytes(48)
      .toString("hex"),
  ].join("$");
}

async function resolveCheckoutIdentity(
  customer: CheckoutCustomer,
): Promise<CheckoutIdentity> {
  const existingUser =
    await db.user.findUnique({
      where: {
        email:
          customer.email,
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (existingUser) {
    if (
      existingUser.status !==
      UserStatus.ACTIVE
    ) {
      throw new CheckoutError(
        "CUSTOMER_ACCOUNT_UNAVAILABLE",
        "Cette adresse e-mail est associée à un compte actuellement indisponible.",
        403,
      );
    }

    return {
      userId:
        existingUser.id,
    };
  }

  try {
    const createdUser =
      await db.user.create({
        data: {
          email:
            customer.email,

          firstName:
            customer.firstName,

          lastName:
            customer.lastName,

          phone:
            customer.phone,

          passwordHash:
            createUnusablePasswordHash(),

          status:
            UserStatus.ACTIVE,
        },

        select: {
          id: true,
        },
      });

    return {
      userId:
        createdUser.id,
    };
  } catch (error) {
    /**
     * Une autre requête peut avoir créé exactement
     * le même utilisateur entre findUnique() et create().
     *
     * Dans ce cas on récupère simplement le compte.
     */
    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const concurrentUser =
        await db.user.findUnique({
          where: {
            email:
              customer.email,
          },

          select: {
            id: true,
            status: true,
          },
        });

      if (
        concurrentUser &&
        concurrentUser.status ===
          UserStatus.ACTIVE
      ) {
        return {
          userId:
            concurrentUser.id,
        };
      }

      if (concurrentUser) {
        throw new CheckoutError(
          "CUSTOMER_ACCOUNT_UNAVAILABLE",
          "Cette adresse e-mail est associée à un compte actuellement indisponible.",
          403,
        );
      }
    }

    throw new CheckoutError(
      "CUSTOMER_IDENTITY_CREATION_FAILED",
      "Impossible de préparer votre commande pour le moment.",
      500,
      {
        cause: error,
      },
    );
  }
}

function randomReferencePart(
  byteLength = 9,
): string {
  return randomBytes(
    byteLength,
  )
    .toString("hex")
    .toUpperCase();
}

function createOrderReference():
  string {
  return `AFR-ORD-${Date.now()}-${randomReferencePart(
    6,
  )}`;
}

function createPaymentReference():
  string {
  return `AFR-PAY-${Date.now()}-${randomReferencePart(
    8,
  )}`;
}

async function createPendingCheckout(
  input: Readonly<{
    identity:
      CheckoutIdentity;

    customer:
      CheckoutCustomer;

    course:
      CheckoutCourse;
  }>,
): Promise<CreatedCheckout> {
  const orderReference =
    createOrderReference();

  const paymentReference =
    createPaymentReference();

  const discountAmount =
    input.course.regularPrice -
    input.course.effectivePrice;

  try {
    return await db.$transaction(
      async (tx) => {
        const order =
          await tx.order.create({
            data: {
              reference:
                orderReference,

              userId:
                input.identity.userId,

              status:
                OrderStatus.PENDING,

              subtotal:
                input.course
                  .regularPrice,

              discountAmount,

              totalAmount:
                input.course
                  .effectivePrice,

              currency:
                input.course.currency,

              customerFirstName:
                input.customer
                  .firstName,

              customerLastName:
                input.customer
                  .lastName,

              customerEmail:
                input.customer.email,

              customerPhone:
                input.customer.phone,

              items: {
                create: {
                  courseId:
                    input.course.id,

                  courseTitle:
                    input.course.title,

                  unitPrice:
                    input.course
                      .effectivePrice,

                  quantity: 1,

                  totalAmount:
                    input.course
                      .effectivePrice,

                  currency:
                    input.course
                      .currency,
                },
              },
            },

            select: {
              id: true,
              reference: true,
              status: true,
              subtotal: true,
              discountAmount: true,
              totalAmount: true,
              currency: true,
            },
          });

        const payment =
          await tx.payment.create({
            data: {
              orderId:
                order.id,

              reference:
                paymentReference,

              provider:
                PaymentProvider.MONEROO,

              status:
                PaymentStatus.PENDING,

              amount:
                order.totalAmount,

              currency:
                order.currency,

              metadata: {
                courseId:
                  input.course.id,

                orderReference:
                  order.reference,

                source:
                  "AFRISKILL_CHECKOUT",
              },
            },

            select: {
              id: true,
              reference: true,
              status: true,
              amount: true,
              currency: true,
            },
          });

        return {
          order,
          payment,
        };
      },
      {
        isolationLevel:
          Prisma
            .TransactionIsolationLevel
            .Serializable,
      },
    );
  } catch (error) {
    if (
      error instanceof
        Prisma
          .PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new CheckoutError(
        "CHECKOUT_REFERENCE_CONFLICT",
        "Impossible de générer la commande. Veuillez réessayer.",
        409,
        {
          cause: error,
        },
      );
    }

    throw error;
  }
}

function getApplicationBaseUrl():
  string {
  const raw =
    process.env
      .NEXT_PUBLIC_APP_URL
      ?.trim() ||
    process.env
      .APP_URL
      ?.trim();

  if (!raw) {
    throw new CheckoutError(
      "APP_URL_NOT_CONFIGURED",
      "L'adresse publique de l'application n'est pas configurée.",
      500,
    );
  }

  let url: URL;

  try {
    url =
      new URL(raw);
  } catch {
    throw new CheckoutError(
      "APP_URL_INVALID",
      "L'adresse publique de l'application est invalide.",
      500,
    );
  }

  if (
    process.env.NODE_ENV ===
      "production" &&
    url.protocol !== "https:"
  ) {
    throw new CheckoutError(
      "APP_URL_INVALID",
      "L'adresse publique de l'application doit utiliser HTTPS.",
      500,
    );
  }

  return url
    .toString()
    .replace(/\/+$/, "");
}

function buildReturnUrl(
  paymentReference: string,
): string {
  const url =
    new URL(
      "/paiement/succes",
      `${getApplicationBaseUrl()}/`,
    );

  url.searchParams.set(
    "reference",
    paymentReference,
  );

  return url.toString();
}

function buildWebhookUrl():
  string {
  return new URL(
    "/api/payments/moneroo/webhook",
    `${getApplicationBaseUrl()}/`,
  ).toString();
}

async function attachMonerooPayment(
  input: Readonly<{
    orderId: string;
    paymentId: string;
    providerPaymentId: string;
    checkoutUrl: string;
  }>,
): Promise<void> {
  await db.$transaction(
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
            metadata: true,
          },
        });

      if (
        !payment ||
        payment.orderId !==
          input.orderId
      ) {
        throw new CheckoutError(
          "PAYMENT_NOT_FOUND",
          "Le paiement interne est introuvable.",
          500,
        );
      }

      if (
        payment.provider !==
        PaymentProvider.MONEROO
      ) {
        throw new CheckoutError(
          "PAYMENT_PROVIDER_MISMATCH",
          "Le fournisseur du paiement est invalide.",
          500,
        );
      }

      if (
        payment.providerPaymentId &&
        payment.providerPaymentId !==
          input.providerPaymentId
      ) {
        throw new CheckoutError(
          "PROVIDER_PAYMENT_ID_CONFLICT",
          "L'identifiant Moneroo ne correspond pas au paiement enregistré.",
          409,
        );
      }

      const existingMetadata =
        payment.metadata &&
        typeof payment.metadata ===
          "object" &&
        !Array.isArray(
          payment.metadata,
        )
          ? payment.metadata
          : {};

      await tx.payment.update({
        where: {
          id:
            payment.id,
        },

        data: {
          providerPaymentId:
            input.providerPaymentId,

          metadata: {
            ...existingMetadata,

            checkoutUrl:
              input.checkoutUrl,
          },
        },
      });
    },
    {
      isolationLevel:
        Prisma
          .TransactionIsolationLevel
          .Serializable,
    },
  );
}

async function markCheckoutInitializationFailed(
  input: Readonly<{
    orderId: string;
    paymentId: string;
  }>,
): Promise<void> {
  try {
    await db.$transaction(
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
              status: true,
            },
          });

        if (
          !payment ||
          payment.orderId !==
            input.orderId
        ) {
          return;
        }

        if (
          payment.status ===
            PaymentStatus.PAID ||
          payment.status ===
            PaymentStatus.REFUNDED
        ) {
          return;
        }

        if (
          payment.status !==
          PaymentStatus.FAILED
        ) {
          await tx.payment.update({
            where: {
              id:
                payment.id,
            },

            data: {
              status:
                PaymentStatus.FAILED,

              failedAt:
                new Date(),
            },
          });
        }

        const order =
          await tx.order.findUnique({
            where: {
              id:
                input.orderId,
            },

            select: {
              status: true,
            },
          });

        if (
          order?.status ===
          OrderStatus.PENDING
        ) {
          await tx.order.update({
            where: {
              id:
                input.orderId,
            },

            data: {
              status:
                OrderStatus.FAILED,
            },
          });
        }
      },
    );
  } catch {
    // Ne jamais masquer l'erreur Moneroo originale.
  }
}

async function initializeCheckoutWithMoneroo(
  input: Readonly<{
    checkout:
      CreatedCheckout;

    customer:
      CheckoutCustomer;

    course:
      CheckoutCourse;
  }>,
) {
  try {
    const monerooPayment =
      await initializeMonerooPayment({
        reference:
          input.checkout.payment
            .reference,

        amount:
          input.checkout.payment
            .amount,

        currency:
          input.checkout.payment
            .currency,

        customer: {
          firstName:
            input.customer.firstName,

          /**
           * Moneroo exige first_name + last_name.
           *
           * Le formulaire AfriSkill ne demande actuellement
           * qu'un seul champ "Nom".
           *
           * On utilise donc le nom saisi comme valeur de repli
           * lorsque lastName n'est pas fourni.
           */
          lastName:
            input.customer.lastName ??
            input.customer.firstName,

          email:
            input.customer.email,

          phone:
            input.customer.phone,
        },

        description:
          `Formation AfriSkill AI — ${input.course.title}`,

        returnUrl:
          buildReturnUrl(
            input.checkout.payment
              .reference,
          ),

        webhookUrl:
          buildWebhookUrl(),

        metadata: {
          paymentReference:
            input.checkout.payment
              .reference,

          orderReference:
            input.checkout.order
              .reference,

          orderId:
            input.checkout.order.id,

          paymentId:
            input.checkout.payment.id,

          courseId:
            input.course.id,

          source:
            "AFRISKILL_CHECKOUT",
        },
      });

    if (
      !monerooPayment
        .providerPaymentId
        .trim()
    ) {
      throw new CheckoutError(
        "MONEROO_INVALID_RESPONSE",
        "Moneroo n'a retourné aucun identifiant de paiement.",
        502,
      );
    }

    const checkoutUrl =
  monerooPayment.checkoutUrl?.trim();

if (!checkoutUrl) {
  throw new CheckoutError(
    "MONEROO_CHECKOUT_URL_MISSING",
    "Moneroo n'a retourné aucune page de paiement.",
    502,
  );
}

await attachMonerooPayment({
  orderId:
    input.checkout.order.id,

  paymentId:
    input.checkout.payment.id,

  providerPaymentId:
    monerooPayment.providerPaymentId,

  checkoutUrl,
});

return {
  ...monerooPayment,
  checkoutUrl,
};
  } catch (error) {
    await markCheckoutInitializationFailed({
      orderId:
        input.checkout.order.id,

      paymentId:
        input.checkout.payment.id,
    });

    if (
      error instanceof
      CheckoutError
    ) {
      throw error;
    }

    if (
      error instanceof
      MonerooError
    ) {
      throw new CheckoutError(
        "MONEROO_INITIALIZATION_FAILED",
        "Impossible d'ouvrir la page de paiement Moneroo pour le moment. Veuillez réessayer.",
        502,
        {
          cause: error,
        },
      );
    }

    throw new CheckoutError(
      "PAYMENT_INITIALIZATION_FAILED",
      "Impossible de préparer le paiement pour le moment.",
      500,
      {
        cause: error,
      },
    );
  }
}

export async function POST(
  request: Request,
): Promise<Response> {
  try {
    const {
      body,
      nativeForm,
    } =
      await readCheckoutBody(
        request,
      );

    const customer =
      normalizeCustomer(
        body,
      );

    /**
     * Formation et identité sont résolues
     * indépendamment côté serveur.
     */
    const [
      course,
      identity,
    ] = await Promise.all([
      getCourseForCheckout(
        body.courseId,
      ),

      resolveCheckoutIdentity(
        customer,
      ),
    ]);

    /**
     * Création interne :
     *
     * Order = PENDING
     * Payment = PENDING
     *
     * Rien n'est considéré comme payé ici.
     */
    const checkout =
      await createPendingCheckout({
        identity,
        customer,
        course,
      });

    /**
     * Initialisation réelle Moneroo.
     */
    const monerooPayment =
      await initializeCheckoutWithMoneroo({
        checkout,
        customer,
        course,
      });

    /**
     * Formulaire HTML natif :
     *
     * le navigateur est envoyé directement
     * vers la page sécurisée Moneroo.
     */
    if (nativeForm) {
      return redirectResponse(
        monerooPayment.checkoutUrl,
        303,
      );
    }

    /**
     * Client JavaScript/fetch :
     *
     * on retourne checkoutUrl au frontend.
     *
     * Cela ne constitue JAMAIS une preuve
     * de paiement.
     */
    return jsonResponse(
      {
        success: true,

        checkout: {
          orderId:
            checkout.order.id,

          orderReference:
            checkout.order.reference,

          orderStatus:
            checkout.order.status,

          paymentId:
            checkout.payment.id,

          paymentReference:
            checkout.payment.reference,

          paymentStatus:
            checkout.payment.status,

          provider:
            "MONEROO",

          providerPaymentId:
            monerooPayment
              .providerPaymentId,

          amount:
            checkout.payment.amount,

          currency:
            checkout.payment.currency,

          checkoutUrl:
            monerooPayment
              .checkoutUrl,

          paymentInitialization:
            "INITIALIZED",
        },
      },
      201,
    );
  } catch (error) {
    return errorResponse(
      error,
    );
  }
}

function methodNotAllowed():
  Response {
  return jsonResponse(
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