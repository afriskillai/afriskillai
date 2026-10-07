"use client";

import Link from "next/link";
import styles from "./FormationSalesPage.module.css";

import {
  getPublicCourseDiscountPercentage,
  getPublicCourseEffectivePrice,
  publicCourseHasPromotion,
  type PublicCoursePricing,
} from "@/types/public-course";

/**
 * ============================================================================
 * AFRISKILL AI — FORMATION ORDER BAR
 * ============================================================================
 *
 * Barre de commande persistante de la page formation.
 *
 * - Prix réel immédiatement visible.
 * - Promotion clairement identifiable.
 * - Aucun panier.
 * - Aucune quantité.
 * - Un seul achat : la formation affichée.
 * - CTA relié à /formations/[formationId]/commande.
 * - Mobile : barre placée au-dessus de la navigation inférieure.
 * - Desktop : barre fixée en bas de l'écran.
 * - Safe-area mobile prise en compte.
 *
 * IMPORTANT :
 * Cette barre ne traite aucun paiement.
 * Elle conduit uniquement vers la page de commande.
 *
 * La page de commande collecte ensuite :
 * - nom ;
 * - e-mail ;
 * - numéro WhatsApp.
 *
 * La validation réelle du paiement reste exclusivement côté serveur.
 * ============================================================================
 */

type FormationOrderBarProps = {
  course: PublicCoursePricing & {
    id: string;
    title: string;
    currency: string;
  };

  /**
   * Permet éventuellement de remplacer la route automatique.
   *
   * Sans checkoutHref :
   * /formations/[course.id]/commande
   */
  checkoutHref?: string | null;

  className?: string;
  placement?: "fixed" | "inline";
};

/**
 * ============================================================================
 * OUTILS
 * ============================================================================
 */

function joinClassNames(
  ...values: Array<
    string | null | undefined | false
  >
): string {
  return values
    .filter(Boolean)
    .join(" ");
}

function normalizeCurrency(
  currency: string,
): string {
  const value =
    currency
      .trim()
      .toUpperCase();

  return value || "XOF";
}

function formatCoursePrice(
  amount: number,
  currency: string,
): string {
  const safeAmount =
    Number.isFinite(amount)
      ? Math.max(0, amount)
      : 0;

  const normalizedCurrency =
    normalizeCurrency(
      currency,
    );

  try {
    return new Intl.NumberFormat(
      "fr-FR",
      {
        style: "currency",
        currency:
          normalizedCurrency,

        maximumFractionDigits:
          normalizedCurrency ===
            "XOF" ||
          Number.isInteger(
            safeAmount,
          )
            ? 0
            : 2,
      },
    ).format(
      safeAmount,
    );
  } catch {
    return `${new Intl.NumberFormat(
      "fr-FR",
      {
        maximumFractionDigits:
          Number.isInteger(
            safeAmount,
          )
            ? 0
            : 2,
      },
    ).format(
      safeAmount,
    )} ${normalizedCurrency}`;
  }
}

/**
 * ============================================================================
 * ROUTE DE COMMANDE
 * ============================================================================
 */

function normalizeCheckoutHref(
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

  const href =
    value.trim();

  if (!href) {
    return null;
  }

  /**
   * On accepte :
   * - les routes internes ;
   * - HTTPS uniquement pour une éventuelle destination externe.
   *
   * Pas de javascript:
   * Pas de data:
   * Pas de HTTP non sécurisé.
   */
  if (
    href.startsWith("/") ||
    href.startsWith(
      "https://",
    )
  ) {
    return href;
  }

  return null;
}

function buildDefaultCheckoutHref(
  courseId: string,
): string | null {
  const normalizedCourseId =
    courseId.trim();

  if (!normalizedCourseId) {
    return null;
  }

  return `/formations/${encodeURIComponent(
    normalizedCourseId,
  )}/commande`;
}

/**
 * ============================================================================
 * ICÔNES
 * ============================================================================
 */

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M4.5 10.25 8.1 13.8 15.6 6.4"
        stroke="currentColor"
        strokeWidth="1.9"
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
      className="
        h-5
        w-5
        shrink-0
        transition-transform
        duration-200
        group-hover:translate-x-1
      "
    >
      <path
        d="M5 12h13M13.5 6.5 19 12l-5.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4 shrink-0"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M8.5 10V7.5a3.5 3.5 0 1 1 7 0V10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M12 3 5 6v5c0 4.8 2.9 8.2 7 10 4.1-1.8 7-5.2 7-10V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m9.2 12 1.8 1.8 3.8-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ============================================================================
 * CONTENU DU BOUTON
 * ============================================================================
 */

function OrderButtonContent() {
  return (
    <>
      <span
        className="
          truncate
          text-white
        "
        style={{
          color: "#ffffff",
          fontWeight: 900,
        }}
      >
        Commander la formation
      </span>

      <span
        className="
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-white/15
          text-white
          ring-1
          ring-inset
          ring-white/15
        "
        style={{
          color: "#ffffff",
        }}
      >
        <ArrowIcon />
      </span>
    </>
  );
}

const ORDER_BUTTON_CLASS_NAME =
  [
    "group",
    "relative",
    "isolate",
    "flex",
    "min-h-[54px]",
    "items-center",
    "justify-center",
    "gap-2.5",
    "overflow-hidden",
    "rounded-2xl",

    "bg-[#0759D9]",

    "px-4",
    "py-2.5",

    "text-sm",
    "font-black",
    "text-white",

    "shadow-[0_12px_30px_rgba(7,89,217,0.34)]",

    "ring-1",
    "ring-inset",
    "ring-white/15",

    "transition-all",
    "duration-200",

    "sm:min-h-[58px]",
    "sm:px-7",
    "sm:text-base",
  ].join(" ");

/**
 * ============================================================================
 * COMPOSANT
 * ============================================================================
 */

export default function FormationOrderBar({
  course,
  checkoutHref,
  className,
  placement = "fixed",
}: FormationOrderBarProps) {
  /**
   * --------------------------------------------------------------------------
   * PRIX
   * --------------------------------------------------------------------------
   */

  const hasPromotion =
    publicCourseHasPromotion(
      course,
    );

  const effectivePrice =
    getPublicCourseEffectivePrice(
      course,
    );

  const discountPercentage =
    getPublicCourseDiscountPercentage(
      course,
    );

  const formattedEffectivePrice =
    formatCoursePrice(
      effectivePrice,
      course.currency,
    );

  const formattedRegularPrice =
    formatCoursePrice(
      course.price,
      course.currency,
    );

  /**
   * --------------------------------------------------------------------------
   * DESTINATION
   * --------------------------------------------------------------------------
   *
   * 1. checkoutHref valide fourni explicitement ;
   * 2. sinon route de commande de la formation.
   */

  const explicitCheckoutHref =
    normalizeCheckoutHref(
      checkoutHref,
    );

  const automaticCheckoutHref =
    buildDefaultCheckoutHref(
      course.id,
    );

  const finalCheckoutHref =
    explicitCheckoutHref ??
    automaticCheckoutHref;

  if (placement === "inline") {
    return finalCheckoutHref ? (
      <Link href={finalCheckoutHref} className={styles.orderButton} aria-label={`Commander ${course.title} pour ${formattedEffectivePrice}`}>
        <span>Commander la formation</span><ArrowIcon />
      </Link>
    ) : <span className={styles.orderButton} aria-disabled="true">Commande indisponible</span>;
  }

  return (
    <aside
      aria-label={`Commander la formation ${course.title}`}
      className={joinClassNames(
        "fixed inset-x-0 z-40",

        /**
         * Mobile :
         * la navigation publique inférieure occupe déjà
         * le bas de l'écran.
         */
        styles.fixedBar,

        /**
         * Desktop :
         * la barre repose directement en bas.
         */
        "lg:bottom-0",

        className,
      )}
    >
      <div
        className="
          border-t
          border-slate-200/80
          bg-white/95
          shadow-[0_-16px_45px_rgba(15,23,42,0.12)]
          backdrop-blur-xl
        "
      >
        {/* ================================================================
            SIGNATURE AFRISKILL AI
        ================================================================= */}

        <div
          aria-hidden="true"
          className="
            h-[3px]
            w-full
            bg-gradient-to-r
            from-[#0759D9]
            via-[#1685F8]
            to-[#F5AA00]
          "
        />

        <div
          className="
            mx-auto
            w-full
            max-w-7xl
            px-3
            py-2.5
            sm:px-6
            sm:py-3
            lg:px-8
          "
        >
          <div
            className="
              flex
              items-center
              gap-3
              sm:gap-5
            "
          >
            {/* ============================================================
                PRIX
            ============================================================= */}

            <div
              className="
                min-w-0
                flex-1
              "
            >
              <p
                className="
                  hidden
                  text-[9px]
                  font-black
                  uppercase
                  tracking-[0.2em]
                  text-slate-400
                  sm:block
                "
              >
                Votre formation
              </p>

              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-x-2
                  gap-y-1
                  sm:mt-1
                "
              >
                <span
                  className="
                    whitespace-nowrap
                    text-[1.15rem]
                    font-black
                    leading-none
                    tracking-[-0.035em]
                    sm:text-2xl
                  "
                  style={{
                    color: "#071936",
                    fontWeight: 900,
                  }}
                >
                  {formattedEffectivePrice}
                </span>

                {hasPromotion ? (
                  <>
                    <span
                      className="
                        hidden
                        whitespace-nowrap
                        text-xs
                        font-bold
                        text-slate-400
                        line-through
                        sm:inline
                      "
                    >
                      {formattedRegularPrice}
                    </span>

                    {discountPercentage !==
                    null ? (
                      <span
                        className="
                          rounded-full
                          bg-emerald-50
                          px-2
                          py-1
                          text-[9px]
                          font-black
                          text-emerald-700
                          ring-1
                          ring-inset
                          ring-emerald-100
                          sm:text-[10px]
                        "
                      >
                        -
                        {
                          discountPercentage
                        }
                        %
                      </span>
                    ) : null}
                  </>
                ) : null}
              </div>

              <div
                className="
                  mt-1.5
                  hidden
                  items-center
                  gap-1.5
                  text-[11px]
                  font-semibold
                  text-slate-500
                  lg:flex
                "
              >
                <span
                  className="
                    flex
                    h-4
                    w-4
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-emerald-50
                    text-emerald-700
                  "
                >
                  <CheckIcon />
                </span>

                <span>
                  Accès activé après validation
                  du paiement
                </span>
              </div>
            </div>

            {/* ============================================================
                SÉPARATION DESKTOP
            ============================================================= */}

            <div
              aria-hidden="true"
              className="
                hidden
                h-12
                w-px
                bg-slate-200
                lg:block
              "
            />

            {/* ============================================================
                CTA
            ============================================================= */}

            <div
              className="
                w-[56%]
                min-w-0
                max-w-[340px]
                sm:w-auto
                sm:min-w-[270px]
              "
            >
              {finalCheckoutHref ? (
                <Link
                  href={
                    finalCheckoutHref
                  }
                  aria-label={`Commander ${course.title} pour ${formattedEffectivePrice}`}
                  className={joinClassNames(
                    ORDER_BUTTON_CLASS_NAME,

                    "w-full",

                    "hover:-translate-y-0.5",
                    "hover:bg-[#064DBB]",
                    "hover:shadow-[0_16px_36px_rgba(7,89,217,0.42)]",

                    "focus-visible:outline-none",
                    "focus-visible:ring-2",
                    "focus-visible:ring-[#0759D9]",
                    "focus-visible:ring-offset-2",
                  )}
                >
                  {/* Reflet supérieur */}

                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-x-0
                      top-0
                      -z-10
                      h-1/2
                      bg-gradient-to-b
                      from-white/15
                      to-transparent
                    "
                  />

                  {/* Accent AfriSkill */}

                  <span
                    aria-hidden="true"
                    className="
                      absolute
                      bottom-0
                      left-0
                      h-[3px]
                      w-full
                      bg-gradient-to-r
                      from-[#F5AA00]
                      via-[#FFC331]
                      to-[#F5AA00]
                    "
                  />

                  <OrderButtonContent />
                </Link>
              ) : (
                /**
                 * Cette branche ne devrait normalement jamais
                 * être atteinte si course.id est valide.
                 *
                 * Elle reste néanmoins présente en sécurité.
                 */
                <div
                  role="button"
                  aria-disabled="true"
                  aria-label="Commande indisponible"
                  title="La commande est momentanément indisponible."
                  className={joinClassNames(
                    ORDER_BUTTON_CLASS_NAME,

                    "w-full",
                    "cursor-not-allowed",
                    "select-none",
                    "opacity-70",
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="
                      pointer-events-none
                      absolute
                      inset-x-0
                      top-0
                      -z-10
                      h-1/2
                      bg-gradient-to-b
                      from-white/15
                      to-transparent
                    "
                  />

                  <span
                    className="
                      truncate
                      text-white
                    "
                    style={{
                      color: "#ffffff",
                      fontWeight: 900,
                    }}
                  >
                    Commande indisponible
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ==============================================================
              CONFIANCE MOBILE
          =============================================================== */}

          <div
            className="
              mt-2
              flex
              items-center
              justify-center
              gap-3
              border-t
              border-slate-100
              pt-2
              sm:hidden
            "
          >
            <span
              className="
                inline-flex
                items-center
                gap-1.5
                text-[9px]
                font-bold
                text-slate-500
              "
            >
              <ShieldIcon />

              Paiement sécurisé
            </span>

            <span
              aria-hidden="true"
              className="
                h-3
                w-px
                bg-slate-200
              "
            />

            <span
              className="
                inline-flex
                items-center
                gap-1.5
                text-[9px]
                font-bold
                text-slate-500
              "
            >
              <LockIcon />

              Accès personnel
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
