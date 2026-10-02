import type { Metadata } from "next";

import Link from "next/link";

import {
  OrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "@/generated/prisma/client";

import { db } from "@/lib/db";

/**
 * ============================================================================
 * AFRISKILL AI — RETOUR APRÈS PAIEMENT
 * ============================================================================
 *
 * Route :
 * /paiement/succes
 *
 * Cette page est uniquement une page de retour utilisateur.
 *
 * RÈGLE CRITIQUE :
 * --------------------------------------------------------------------------
 * Le navigateur ne confirme JAMAIS le paiement.
 *
 * Les paramètres :
 *
 * ?status=success
 * ?paid=true
 * ?payment=completed
 *
 * ne donnent aucun accès à une formation.
 *
 * Cette page affiche uniquement l'état déjà enregistré dans PostgreSQL
 * après traitement serveur du paiement.
 *
 * La confirmation réelle doit être effectuée par le webhook Moneroo.
 *
 * Cette page :
 * - ne modifie aucun paiement ;
 * - ne modifie aucune commande ;
 * - ne crée aucun Enrollment ;
 * - ne déclenche aucune livraison ;
 * - n'affiche aucun PDF privé ;
 * - n'affiche aucun lien privé ;
 * - ne fait confiance à aucun statut venant de l'URL.
 * ============================================================================
 */

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Statut du paiement | AfriSkill AI",
  description:
    "Consultez le statut de votre paiement AfriSkill AI.",
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

type PageProps = {
  searchParams: Promise<{
    order?: string | string[];
    orderId?: string | string[];
    reference?: string | string[];
    payment?: string | string[];
    paymentId?: string | string[];
    paymentReference?: string | string[];
    status?: string | string[];
  }>;
};

type PaymentResultState =
  | "PAID"
  | "PENDING"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED"
  | "NOT_FOUND"
  | "INVALID_REFERENCE";

type SafePaymentResult = {
  state: PaymentResultState;

  orderReference: string | null;
  paymentReference: string | null;

  courseId: string | null;
  courseTitle: string | null;

  amount: number | null;
  currency: string | null;

  paidAt: Date | null;
};

/**
 * ============================================================================
 * PARAMÈTRES
 * ============================================================================
 */

function getSingleSearchParam(
  value: string | string[] | undefined,
): string | null {
  if (typeof value === "string") {
    const normalized = value.trim();

    return normalized || null;
  }

  if (Array.isArray(value)) {
    const first = value[0]?.trim();

    return first || null;
  }

  return null;
}

function normalizeReference(
  value: string | null,
): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();

  if (
    !normalized ||
    normalized.length > 300
  ) {
    return null;
  }

  return normalized;
}

/**
 * ============================================================================
 * FORMATAGE
 * ============================================================================
 */

function formatPrice(
  amount: number,
  currency: string,
): string {
  const normalizedCurrency =
    currency.trim().toUpperCase();

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits:
        normalizedCurrency === "XOF" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(
      "fr-FR",
    )} ${normalizedCurrency}`;
  }
}

function formatDate(
  date: Date,
): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toLocaleString("fr-FR");
  }
}

/**
 * ============================================================================
 * CHARGEMENT SÉCURISÉ DU STATUT
 * ============================================================================
 */

async function getPaymentResult(
  params: Awaited<PageProps["searchParams"]>,
): Promise<SafePaymentResult> {
  /**
   * On accepte plusieurs noms de paramètres uniquement pour faciliter
   * le branchement final avec le return_url Moneroo.
   *
   * IMPORTANT :
   * ces valeurs servent seulement à RETROUVER le paiement.
   * Elles ne déterminent jamais son statut.
   */

  const orderReference =
    normalizeReference(
      getSingleSearchParam(
        params.order,
      ),
    );

  const orderId =
    normalizeReference(
      getSingleSearchParam(
        params.orderId,
      ),
    );

  const paymentReference =
    normalizeReference(
      getSingleSearchParam(
        params.paymentReference,
      ) ??
        getSingleSearchParam(
          params.payment,
        ),
    );

  const paymentId =
    normalizeReference(
      getSingleSearchParam(
        params.paymentId,
      ),
    );

  if (
    !orderReference &&
    !orderId &&
    !paymentReference &&
    !paymentId
  ) {
    return {
      state: "INVALID_REFERENCE",
      orderReference: null,
      paymentReference: null,
      courseId: null,
      courseTitle: null,
      amount: null,
      currency: null,
      paidAt: null,
    };
  }

  /**
   * Priorité aux références internes AfriSkill AI.
   *
   * Le statut éventuellement présent dans params.status
   * est volontairement ignoré.
   */

  const payment =
    await db.payment.findFirst({
      where: {
        provider:
          PaymentProvider.MONEROO,

        OR: [
          ...(paymentId
            ? [
                {
                  id: paymentId,
                },
              ]
            : []),

          ...(paymentReference
            ? [
                {
                  reference:
                    paymentReference,
                },
              ]
            : []),

          ...(orderId
            ? [
                {
                  order: {
                    id: orderId,
                  },
                },
              ]
            : []),

          ...(orderReference
            ? [
                {
                  order: {
                    reference:
                      orderReference,
                  },
                },
              ]
            : []),
        ],
      },

      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        reference: true,
        status: true,
        amount: true,
        currency: true,
        paidAt: true,

        order: {
          select: {
            id: true,
            reference: true,
            status: true,

            items: {
              orderBy: {
                createdAt: "asc",
              },

              take: 1,

              select: {
                courseId: true,
                courseTitle: true,
              },
            },
          },
        },
      },
    });

  if (!payment) {
    return {
      state: "NOT_FOUND",
      orderReference:
        orderReference,
      paymentReference:
        paymentReference,
      courseId: null,
      courseTitle: null,
      amount: null,
      currency: null,
      paidAt: null,
    };
  }

  const course =
    payment.order.items[0] ?? null;

  /**
   * Une commande n'est considérée payée sur cette page que si :
   *
   * Payment.status === PAID
   * ET
   * Order.status === PAID
   *
   * Cela empêche un état partiellement synchronisé d'afficher
   * prématurément "Paiement confirmé".
   */

  let state: PaymentResultState;

  if (
    payment.status === PaymentStatus.PAID &&
    payment.order.status === OrderStatus.PAID
  ) {
    state = "PAID";
  } else if (
    payment.status === PaymentStatus.REFUNDED ||
    payment.order.status === OrderStatus.REFUNDED
  ) {
    state = "REFUNDED";
  } else if (
    payment.status === PaymentStatus.CANCELLED ||
    payment.order.status === OrderStatus.CANCELLED
  ) {
    state = "CANCELLED";
  } else if (
    payment.status === PaymentStatus.FAILED ||
    payment.order.status === OrderStatus.FAILED
  ) {
    state = "FAILED";
  } else {
    state = "PENDING";
  }

  return {
    state,

    orderReference:
      payment.order.reference,

    paymentReference:
      payment.reference,

    courseId:
      course?.courseId ?? null,

    courseTitle:
      course?.courseTitle ?? null,

    amount:
      payment.amount,

    currency:
      payment.currency,

    paidAt:
      payment.paidAt,
  };
}

/**
 * ============================================================================
 * ICÔNES
 * ============================================================================
 */

function SuccessIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-10 w-10"
    >
      <path
        d="M7.5 12.5 10.5 15.5 17 9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-10 w-10"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 7V12L15.5 14"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-10 w-10"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M12 7.5V13"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />

      <circle
        cx="12"
        cy="16.5"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function RefundIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-10 w-10"
    >
      <path
        d="M7 8H15.5C18 8 20 10 20 12.5C20 15 18 17 15.5 17H8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M10 5 7 8 10 11"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M4 6.5H20V17.5H4V6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M5 8 12 13 19 8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M12 3 19 6V11.5C19 16.1 16.1 19.4 12 21C7.9 19.4 5 16.1 5 11.5V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M9 12 11 14 15.5 9.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M5 12H19M13 6L19 12L13 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ============================================================================
 * CONFIGURATION VISUELLE
 * ============================================================================
 */

function getStateContent(
  state: PaymentResultState,
) {
  switch (state) {
    case "PAID":
      return {
        eyebrow:
          "Paiement confirmé",

        title:
          "Votre paiement a bien été confirmé",

        description:
          "Votre commande est validée. Les informations d’accès à votre formation sont traitées après confirmation du paiement.",

        icon:
          <SuccessIcon />,

        iconClassName:
          "bg-[#ecfdf3] text-[#15803d]",

        badgeClassName:
          "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
      };

    case "PENDING":
      return {
        eyebrow:
          "Vérification en cours",

        title:
          "Votre paiement est en cours de confirmation",

        description:
          "Votre retour depuis la plateforme de paiement a bien été reçu. Nous attendons encore la confirmation sécurisée côté serveur.",

        icon:
          <PendingIcon />,

        iconClassName:
          "bg-[#eff6ff] text-[#2563eb]",

        badgeClassName:
          "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
      };

    case "FAILED":
      return {
        eyebrow:
          "Paiement non confirmé",

        title:
          "Le paiement n’a pas été validé",

        description:
          "Aucun accès à la formation n’a été délivré. Vous pouvez revenir à la formation et effectuer une nouvelle tentative de paiement.",

        icon:
          <ErrorIcon />,

        iconClassName:
          "bg-[#fef2f2] text-[#dc2626]",

        badgeClassName:
          "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
      };

    case "CANCELLED":
      return {
        eyebrow:
          "Paiement annulé",

        title:
          "Votre paiement a été annulé",

        description:
          "Aucun débit confirmé ne donne accès à la formation et aucun contenu privé n’a été délivré.",

        icon:
          <ErrorIcon />,

        iconClassName:
          "bg-[#fff7ed] text-[#c2410c]",

        badgeClassName:
          "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
      };

    case "REFUNDED":
      return {
        eyebrow:
          "Paiement remboursé",

        title:
          "Cette transaction est indiquée comme remboursée",

        description:
          "Le statut enregistré pour cette transaction indique qu’un remboursement a été effectué.",

        icon:
          <RefundIcon />,

        iconClassName:
          "bg-[#f8fafc] text-[#475569]",

        badgeClassName:
          "border-[#cbd5e1] bg-[#f8fafc] text-[#475569]",
      };

    case "NOT_FOUND":
      return {
        eyebrow:
          "Transaction introuvable",

        title:
          "Nous ne retrouvons pas encore cette transaction",

        description:
          "La référence reçue ne correspond actuellement à aucun paiement Moneroo enregistré dans AfriSkill AI.",

        icon:
          <PendingIcon />,

        iconClassName:
          "bg-[#f8fafc] text-[#475569]",

        badgeClassName:
          "border-[#cbd5e1] bg-[#f8fafc] text-[#475569]",
      };

    case "INVALID_REFERENCE":
      return {
        eyebrow:
          "Référence manquante",

        title:
          "Impossible d’afficher le statut du paiement",

        description:
          "Aucune référence de commande ou de paiement valide n’a été fournie à cette page.",

        icon:
          <ErrorIcon />,

        iconClassName:
          "bg-[#f8fafc] text-[#475569]",

        badgeClassName:
          "border-[#cbd5e1] bg-[#f8fafc] text-[#475569]",
      };
  }
}

/**
 * ============================================================================
 * PAGE
 * ============================================================================
 */

export default async function PaymentSuccessPage({
  searchParams,
}: PageProps) {
  const params =
    await searchParams;

  const result =
    await getPaymentResult(
      params,
    );

  const content =
    getStateContent(
      result.state,
    );

  const isPaid =
    result.state === "PAID";

  const canRetry =
    result.state === "FAILED" ||
    result.state === "CANCELLED";

  const formattedAmount =
    result.amount !== null &&
    result.currency
      ? formatPrice(
          result.amount,
          result.currency,
        )
      : null;

  return (
    <main
      className="
        min-h-screen
        bg-[#f6f8fc]
        px-4
        pb-16
        pt-8
        sm:px-6
        sm:pb-20
        sm:pt-12
        lg:px-8
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-3xl
        "
      >
        {/* ================================================================
            CARTE PRINCIPALE
        ================================================================= */}

        <section
          className="
            overflow-hidden
            rounded-[28px]
            border
            border-[#e2e8f0]
            bg-white
            shadow-[0_24px_65px_rgba(15,43,91,0.09)]
            sm:rounded-[34px]
          "
        >
          <div
            className="
              px-5
              pb-7
              pt-7
              text-center
              sm:px-9
              sm:pb-9
              sm:pt-9
            "
          >
            {/* ICÔNE */}

            <div
              className={`
                mx-auto
                flex
                h-20
                w-20
                items-center
                justify-center
                rounded-full
                ${content.iconClassName}
              `}
            >
              {content.icon}
            </div>

            {/* BADGE */}

            <div
              className={`
                mt-5
                inline-flex
                items-center
                rounded-full
                border
                px-3.5
                py-1.5
                text-xs
                font-black
                uppercase
                tracking-[0.11em]
                ${content.badgeClassName}
              `}
            >
              {content.eyebrow}
            </div>

            {/* TITRE */}

            <h1
              className="
                mx-auto
                mt-5
                max-w-2xl
                text-[2rem]
                font-black
                leading-[1.03]
                tracking-[-0.045em]
                sm:text-[2.7rem]
              "
              style={{
                color: "#0f2b5b",
                fontWeight: 900,
              }}
            >
              {content.title}
            </h1>

            <p
              className="
                mx-auto
                mt-4
                max-w-xl
                text-sm
                font-medium
                leading-6
                text-[#64748b]
                sm:text-base
                sm:leading-7
              "
            >
              {content.description}
            </p>
          </div>

          {/* ==============================================================
              RÉCAPITULATIF
          =============================================================== */}

          {(result.courseTitle ||
            result.orderReference ||
            formattedAmount) ? (
            <div
              className="
                border-y
                border-[#edf1f7]
                bg-[#fbfcfe]
                px-5
                py-6
                sm:px-9
              "
            >
              <div
                className="
                  mx-auto
                  max-w-xl
                  space-y-4
                "
              >
                {result.courseTitle ? (
                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-5
                    "
                  >
                    <span
                      className="
                        shrink-0
                        text-sm
                        font-semibold
                        text-[#64748b]
                      "
                    >
                      Formation
                    </span>

                    <strong
                      className="
                        text-right
                        text-sm
                        font-black
                        leading-5
                        text-[#172033]
                      "
                    >
                      {result.courseTitle}
                    </strong>
                  </div>
                ) : null}

                {formattedAmount ? (
                  <div
                    className="
                      flex
                      items-center
                      justify-between
                      gap-5
                    "
                  >
                    <span
                      className="
                        text-sm
                        font-semibold
                        text-[#64748b]
                      "
                    >
                      Montant
                    </span>

                    <strong
                      className="
                        text-lg
                        font-black
                      "
                      style={{
                        color: "#0f2b5b",
                        fontWeight: 900,
                      }}
                    >
                      {formattedAmount}
                    </strong>
                  </div>
                ) : null}

                {result.orderReference ? (
                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-5
                    "
                  >
                    <span
                      className="
                        shrink-0
                        text-sm
                        font-semibold
                        text-[#64748b]
                      "
                    >
                      Référence
                    </span>

                    <span
                      className="
                        break-all
                        text-right
                        text-xs
                        font-black
                        text-[#334155]
                        sm:text-sm
                      "
                    >
                      {result.orderReference}
                    </span>
                  </div>
                ) : null}

                {isPaid &&
                result.paidAt ? (
                  <div
                    className="
                      flex
                      items-start
                      justify-between
                      gap-5
                    "
                  >
                    <span
                      className="
                        shrink-0
                        text-sm
                        font-semibold
                        text-[#64748b]
                      "
                    >
                      Confirmé le
                    </span>

                    <span
                      className="
                        text-right
                        text-sm
                        font-bold
                        text-[#334155]
                      "
                    >
                      {formatDate(
                        result.paidAt,
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {/* ==============================================================
              INFORMATIONS
          =============================================================== */}

          <div
            className="
              px-5
              py-7
              sm:px-9
              sm:py-8
            "
          >
            <div
              className="
                grid
                gap-4
                sm:grid-cols-2
              "
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-[#e2e8f0]
                  bg-[#f8fafc]
                  p-4
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#eff6ff]
                    text-[#2563eb]
                  "
                >
                  <ShieldIcon />
                </div>

                <h2
                  className="
                    mt-3
                    text-sm
                    font-black
                    text-[#172033]
                  "
                >
                  Validation sécurisée
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    font-medium
                    leading-5
                    text-[#64748b]
                  "
                >
                  Le statut affiché provient de nos
                  données serveur, jamais d’un simple
                  paramètre de retour du navigateur.
                </p>
              </div>

              <div
                className="
                  rounded-2xl
                  border
                  border-[#e2e8f0]
                  bg-[#f8fafc]
                  p-4
                "
              >
                <div
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#f0fdf4]
                    text-[#15803d]
                  "
                >
                  <MailIcon />
                </div>

                <h2
                  className="
                    mt-3
                    text-sm
                    font-black
                    text-[#172033]
                  "
                >
                  Accès à la formation
                </h2>

                <p
                  className="
                    mt-1
                    text-xs
                    font-medium
                    leading-5
                    text-[#64748b]
                  "
                >
                  {isPaid
                    ? "Votre paiement est confirmé. La livraison de vos accès peut maintenant être traitée de manière sécurisée."
                    : "Aucun contenu privé n’est délivré tant que le paiement n’est pas réellement confirmé."}
                </p>
              </div>
            </div>

            {/* ============================================================
                ACTION PRINCIPALE
            ============================================================= */}

            <div
              className="
                mt-6
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:justify-center
              "
            >
              {isPaid ? (
                <Link
                  href="/formations"
                  className="
                    inline-flex
                    min-h-13
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    bg-[#0f2b5b]
                    px-6
                    py-3.5
                    text-sm
                    font-black
                    shadow-[0_12px_28px_rgba(15,43,91,0.18)]
                    transition
                    hover:bg-[#173b75]
                  "
                  style={{
                    color: "#ffffff",
                    fontWeight: 900,
                  }}
                >
                  <span
                    style={{
                      color: "#ffffff",
                    }}
                  >
                    Retour aux formations
                  </span>

                  <ArrowIcon />
                </Link>
              ) : null}

              {canRetry &&
              result.courseId ? (
                <Link
                  href={`/formations/${result.courseId}/commande`}
                  className="
                    inline-flex
                    min-h-13
                    items-center
                    justify-center
                    gap-2
                    rounded-2xl
                    bg-[#0f2b5b]
                    px-6
                    py-3.5
                    text-sm
                    font-black
                    shadow-[0_12px_28px_rgba(15,43,91,0.18)]
                    transition
                    hover:bg-[#173b75]
                  "
                  style={{
                    color: "#ffffff",
                    fontWeight: 900,
                  }}
                >
                  <span
                    style={{
                      color: "#ffffff",
                    }}
                  >
                    Réessayer le paiement
                  </span>

                  <ArrowIcon />
                </Link>
              ) : null}

              {!isPaid &&
              !canRetry ? (
                <Link
                  href="/formations"
                  className="
                    inline-flex
                    min-h-13
                    items-center
                    justify-center
                    rounded-2xl
                    border
                    border-[#dbe3ef]
                    bg-white
                    px-6
                    py-3.5
                    text-sm
                    font-black
                    text-[#0f2b5b]
                    transition
                    hover:bg-[#f8fafc]
                  "
                >
                  Voir les formations
                </Link>
              ) : null}
            </div>

            {/* ============================================================
                AIDE
            ============================================================= */}

            <div
              className="
                mt-7
                border-t
                border-[#edf1f7]
                pt-6
                text-center
              "
            >
              <p
                className="
                  text-sm
                  font-medium
                  leading-6
                  text-[#64748b]
                "
              >
                Besoin d’aide concernant votre paiement ?{" "}
                <a
                  href="mailto:contact@afriskill-ai.com"
                  className="
                    font-black
                    text-[#0f2b5b]
                    underline
                    decoration-[#cbd5e1]
                    underline-offset-4
                    transition
                    hover:text-[#2563eb]
                  "
                >
                  contact@afriskill-ai.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* ================================================================
            NOTE DE SÉCURITÉ
        ================================================================= */}

        <p
          className="
            mx-auto
            mt-5
            max-w-xl
            text-center
            text-xs
            font-medium
            leading-5
            text-[#94a3b8]
          "
        >
          Ne fermez pas définitivement votre dossier de
          paiement tant que la confirmation n’est pas
          affichée. Selon le moyen de paiement utilisé,
          la confirmation peut nécessiter un court délai.
        </p>
      </div>
    </main>
  );
}