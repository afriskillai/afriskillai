"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/components/cart/CartProvider";
import type { PublicCourseCardData } from "@/types/public-course";

/**
 * ============================================================================
 * AFRISKILL AI â€” HOME COURSE CARD
 * ============================================================================
 *
 * Carte de formation utilisÃ©e sur la page d'accueil.
 *
 * Objectifs :
 * - mettre l'image de la formation en valeur ;
 * - conserver un titre rÃ©ellement lisible sur mobile ;
 * - afficher clairement prix normal / promotion ;
 * - permettre d'ouvrir rapidement la formation ;
 * - permettre l'ajout direct au panier ;
 * - conserver un Ã©tat visuel clair lorsque la formation est dÃ©jÃ  ajoutÃ©e ;
 * - rester homogÃ¨ne sur mobile, tablette et desktop ;
 * - rester compacte lorsque deux cartes sont affichÃ©es par ligne sur mobile.
 * ============================================================================
 */

type HomeCourseCardProps = Readonly<{
  course: PublicCourseCardData;
}>;

/**
 * ============================================================================
 * PRIX
 * ============================================================================
 */

function formatPrice(
  amount: number,
  currency: string,
): string {
  const safeAmount =
    Number.isFinite(amount) && amount >= 0
      ? amount
      : 0;

  const safeCurrency =
    currency.trim().toUpperCase() || "XOF";

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    const formattedAmount =
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
      }).format(safeAmount);

    return `${formattedAmount} ${safeCurrency}`;
  }
}

/**
 * ============================================================================
 * ICÃ”NES
 * ============================================================================
 */

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="16"
      height="16"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M5 12h13M13 7l5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="17"
      height="17"
      className="h-[17px] w-[17px] shrink-0"
    >
      <path
        d="M3.75 5.25h2l1.6 8.05a2 2 0 0 0 1.96 1.6h7.96a2 2 0 0 0 1.94-1.5l1.04-4.15H7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="9.25"
        cy="19"
        r="1"
        fill="currentColor"
      />

      <circle
        cx="17.5"
        cy="19"
        r="1"
        fill="currentColor"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="17"
      height="17"
      className="h-[17px] w-[17px] shrink-0"
    >
      <path
        d="m5.5 12.5 4 4 9-9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ============================================================================
 * PLACEHOLDER
 * ============================================================================
 *
 * AffichÃ© uniquement lorsqu'aucune image publique valide n'est disponible.
 */

function CoursePlaceholder() {
  return (
    <div
      className={[
        "flex",
        "h-full",
        "w-full",
        "items-center",
        "justify-center",

        "bg-[radial-gradient(circle_at_30%_20%,#0B3B8F_0%,#061A40_48%,#031027_100%)]",

        "px-3",
        "sm:px-4",
      ].join(" ")}
    >
      <div className="text-center">
        <div
          className={[
            "mx-auto",

            "flex",
            "h-10",
            "w-10",
            "items-center",
            "justify-center",

            "rounded-xl",

            "border",
            "border-[var(--afriskill-gold)]/30",

            "bg-white/[0.06]",

            "text-lg",
            "font-black",
            "text-[var(--afriskill-gold)]",

            "shadow-[0_8px_24px_rgba(0,0,0,0.12)]",

            "sm:h-14",
            "sm:w-14",
            "sm:rounded-2xl",
            "sm:text-2xl",
          ].join(" ")}
        >
          A
        </div>

        <p
          className={[
            "mt-2",

            "text-[10px]",
            "font-bold",
            "tracking-[-0.01em]",
            "text-white",

            "sm:mt-2.5",
            "sm:text-sm",
          ].join(" ")}
        >
          AfriSkill{" "}
          <span className="text-[var(--afriskill-cyan-light)]">
            AI
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * COMPOSANT PRINCIPAL
 * ============================================================================
 */

export default function HomeCourseCard({
  course,
}: HomeCourseCardProps) {
  const {
    addCourse,
    hasCourse,
    isHydrated,
  } = useCart();

  const inCart =
    isHydrated && hasCourse(course.id);

  /**
   * On conserve ici une validation locale.
   *
   * MÃªme si les donnÃ©es sont dÃ©jÃ  normalisÃ©es dans la couche publique,
   * la carte reste robuste lorsqu'elle reÃ§oit une donnÃ©e inattendue.
   */
  const hasPromotion =
    course.promotionalPrice !== null &&
    Number.isFinite(
      course.promotionalPrice,
    ) &&
    course.promotionalPrice >= 0 &&
    Number.isFinite(course.price) &&
    course.promotionalPrice < course.price;

  const currentPrice =
    hasPromotion &&
    course.promotionalPrice !== null
      ? course.promotionalPrice
      : course.price;

  const courseHref =
    `/formations/${course.id}`;

  /**
   * Ajout au panier.
   */
  function handleAddToCart() {
    if (!isHydrated || inCart) {
      return;
    }

    addCourse(course.id);
  }

  return (
    <article
      className={[
        "group",

        "relative",

        "flex",
        "h-full",
        "min-w-0",
        "flex-col",

        "overflow-hidden",

        "rounded-xl",

        "border",
        "border-[var(--border)]",

        "bg-white",

        "shadow-[var(--shadow-card)]",

        "transition-[border-color,box-shadow,transform]",
        "duration-300",

        "hover:-translate-y-1",
        "hover:border-[var(--afriskill-cyan)]/45",
        "hover:shadow-[var(--shadow-card-hover)]",

        "sm:rounded-[20px]",
      ].join(" ")}
    >
      {/* ================================================================
          IMAGE
          ================================================================ */}

      <Link
        href={courseHref}
        aria-label={`Voir la formation ${course.title}`}
        className={[
          "relative",
          "block",
          "w-full",
          "shrink-0",

          "aspect-[16/10]",

          "overflow-hidden",

          "bg-[var(--afriskill-navy)]",

          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-inset",
          "focus-visible:ring-[var(--afriskill-cyan)]",

          "sm:aspect-[16/9]",
        ].join(" ")}
      >
        {course.imageUrl ? (
          <Image
            src={course.imageUrl}
            alt={
              course.imageAlt ||
              `Formation ${course.title}`
            }
            fill
            sizes={[
              "(max-width: 639px) calc(50vw - 24px)",
              "(max-width: 767px) calc(50vw - 28px)",
              "(max-width: 1023px) 33vw",
              "(max-width: 1279px) 33vw",
              "25vw",
            ].join(", ")}
            className={[
              "object-cover",
              "object-center",

              "transition-transform",
              "duration-500",

              "group-hover:scale-[1.035]",
            ].join(" ")}
          />
        ) : (
          <CoursePlaceholder />
        )}

        {/* ==============================================================
            DÃ‰GRADÃ‰ SUR IMAGE
            ============================================================== */}

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none",
            "absolute",
            "inset-0",

            "bg-gradient-to-t",

            "from-[var(--afriskill-navy-dark)]/40",
            "via-transparent",
            "to-transparent",
          ].join(" ")}
        />

        {/* ==============================================================
            BADGE PROMOTION
            ============================================================== */}

        {hasPromotion ? (
          <span
            className={[
              "absolute",
              "left-2",
              "top-2",

              "inline-flex",
              "min-h-6",
              "items-center",
              "justify-center",

              "rounded-full",

              "bg-[var(--afriskill-gold)]",

              "px-2",
              "py-1",

              "text-[8px]",
              "font-black",
              "uppercase",
              "leading-none",
              "tracking-[0.06em]",

              "text-[var(--afriskill-navy-dark)]",

              "shadow-[0_5px_16px_rgba(0,0,0,0.18)]",

              "sm:left-3.5",
              "sm:top-3.5",
              "sm:min-h-7",
              "sm:px-3",
              "sm:text-[10px]",
              "sm:tracking-[0.08em]",
            ].join(" ")}
          >
            Promotion
          </span>
        ) : null}

        {/* ==============================================================
            INDICATION VISUELLE
            ============================================================== */}

        <span
          aria-hidden="true"
          className={[
            "absolute",
            "bottom-2",
            "right-2",

            "flex",
            "h-7",
            "w-7",
            "items-center",
            "justify-center",

            "rounded-full",

            "border",
            "border-white/20",

            "bg-[var(--afriskill-navy-dark)]/80",

            "text-white",

            "shadow-md",
            "backdrop-blur-md",

            "transition-[background-color,transform]",
            "duration-300",

            "group-hover:translate-x-0.5",
            "group-hover:bg-[var(--afriskill-blue)]",

            "sm:bottom-3",
            "sm:right-3",
            "sm:h-9",
            "sm:w-9",
          ].join(" ")}
        >
          <ArrowIcon />
        </span>
      </Link>

      {/* ================================================================
          CONTENU
          ================================================================ */}

      <div
        className={[
          "flex",
          "min-w-0",
          "flex-1",
          "flex-col",

          "p-3",

          "sm:p-5",
        ].join(" ")}
      >
        {/* ==============================================================
            INFORMATIONS
            ============================================================== */}

        <div className="flex-1">
          <Link
            href={courseHref}
            className={[
              "block",
              "rounded-md",

              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--afriskill-cyan)]",
              "focus-visible:ring-offset-2",
            ].join(" ")}
          >
            <h3
              className={[
                "line-clamp-2",

                "text-[13px]",

                /**
                 * Titre principal de la formation.
                 *
                 * On conserve exactement la taille, la hauteur,
                 * le responsive et le comportement de la version
                 * de base. Seule la graisse est renforcÃ©e afin
                 * d'obtenir un rendu plus commercial et plus net.
                 */
                "font-black",
                "[font-weight:900]",

                "leading-[1.35]",
                "tracking-[-0.02em]",

                "text-[var(--text-primary)]",

                "transition-colors",
                "duration-200",

                "group-hover:text-[var(--afriskill-blue)]",

                "min-[380px]:text-[14px]",

                "sm:text-[17px]",
                "sm:tracking-[-0.025em]",

                "lg:text-[18px]",
              ].join(" ")}
            >
              {course.title}
            </h3>
          </Link>

          {course.shortDescription ? (
            <p
              className={[
                "mt-1.5",

                "line-clamp-2",

                "text-[10px]",
                "leading-4",

                "text-[var(--text-muted)]",

                "min-[380px]:text-[11px]",

                "sm:mt-2",
                "sm:text-[13px]",
                "sm:leading-[1.65]",
              ].join(" ")}
            >
              {course.shortDescription}
            </p>
          ) : null}
        </div>

        {/* ==============================================================
            SÃ‰PARATION
            ============================================================== */}

        <div
          aria-hidden="true"
          className={[
            "my-3",
            "h-px",
            "w-full",
            "bg-[var(--border-soft)]",

            "sm:my-4",
          ].join(" ")}
        />

        {/* ==============================================================
            PRIX
            ============================================================== */}

        <div
          className={[
            "flex",
            "min-h-[44px]",
            "min-w-0",
            "flex-col",
            "justify-end",

            "sm:min-h-[48px]",
          ].join(" ")}
        >
          {hasPromotion ? (
            <span
              className={[
                "truncate",

                "text-[9px]",
                "font-medium",
                "leading-none",

                "text-[var(--text-subtle)]",

                "line-through",

                "sm:text-[11px]",
              ].join(" ")}
            >
              {formatPrice(
                course.price,
                course.currency,
              )}
            </span>
          ) : (
            <span
              className={[
                "text-[9px]",
                "font-bold",
                "uppercase",
                "tracking-[0.08em]",

                "text-[var(--text-subtle)]",

                "sm:text-[10px]",
                "sm:tracking-[0.1em]",
              ].join(" ")}
            >
              Prix
            </span>
          )}

          <span
            className={[
              hasPromotion
                ? "mt-1.5"
                : "mt-1",

              "min-w-0",
              "break-words",

              "text-[15px]",
              "font-black",
              "leading-tight",
              "tracking-[-0.025em]",

              hasPromotion
                ? "text-[var(--afriskill-blue)]"
                : "text-[var(--text-primary)]",

              "min-[380px]:text-[16px]",

              "sm:text-[20px]",
            ].join(" ")}
          >
            {formatPrice(
              currentPrice,
              course.currency,
            )}
          </span>
        </div>

        {/* ==============================================================
            ACTIONS
            ============================================================== */}

        <div
          className={[
            "mt-3",

            "grid",
            "grid-cols-[minmax(0,1fr)_40px]",
            "gap-2",

            "sm:mt-4",
            "sm:grid-cols-[minmax(0,1fr)_48px]",
            "sm:gap-2.5",
          ].join(" ")}
        >
          {/* VOIR LA FORMATION */}

          <Link
            href={courseHref}
            aria-label={`Voir la formation ${course.title}`}
            className={[
              "group/action",

              "inline-flex",
              "min-h-10",
              "min-w-0",
              "items-center",
              "justify-center",
              "gap-1.5",

              "rounded-lg",

              "border",
              "border-[var(--afriskill-navy)]",

              "bg-[var(--afriskill-navy)]",

              "px-2",
              "py-2",

              "text-center",
              "text-[10px]",
              "font-bold",
              "leading-4",

              "!text-white",

              "shadow-[0_6px_18px_rgba(6,26,64,0.10)]",

              "transition-[background-color,border-color,box-shadow,transform,color]",
              "duration-200",

              "hover:border-[var(--afriskill-blue)]",
              "hover:bg-[var(--afriskill-blue)]",
              "hover:!text-white",
              "hover:shadow-[0_8px_22px_rgba(6,26,64,0.14)]",

              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--afriskill-cyan)]",
              "focus-visible:ring-offset-2",

              "active:translate-y-px",

              "sm:min-h-12",
              "sm:gap-2",
              "sm:rounded-xl",
              "sm:px-3",
              "sm:py-2.5",
              "sm:text-[13px]",
            ].join(" ")}
          >
            <span className="min-w-0 truncate !text-white">
              Voir la formation
            </span>

            <span
              aria-hidden="true"
              className={[
                "hidden",
                "shrink-0",
                "!text-white",

                "transition-transform",
                "duration-200",

                "group-hover/action:translate-x-0.5",

                "min-[380px]:inline-flex",
              ].join(" ")}
            >
              <ArrowIcon />
            </span>
          </Link>

          {/* AJOUT AU PANIER */}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!isHydrated || inCart}
            aria-label={
              inCart
                ? `${course.title} est dÃ©jÃ  dans le panier`
                : `Ajouter ${course.title} au panier`
            }
            title={
              inCart
                ? "DÃ©jÃ  dans le panier"
                : "Ajouter au panier"
            }
            className={[
              "inline-flex",
              "h-10",
              "w-10",
              "shrink-0",
              "items-center",
              "justify-center",

              "rounded-lg",

              "border",

              "transition-[background-color,border-color,color,box-shadow,transform]",
              "duration-200",

              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--afriskill-gold)]",
              "focus-visible:ring-offset-2",

              "active:scale-[0.97]",

              "sm:h-12",
              "sm:w-12",
              "sm:rounded-xl",

              !isHydrated
                ? [
                    "cursor-wait",
                    "border-[var(--border)]",
                    "bg-[var(--surface-soft)]",
                    "text-[var(--text-subtle)]",
                  ].join(" ")
                : inCart
                  ? [
                      "cursor-default",
                      "border-emerald-200",
                      "bg-emerald-50",
                      "text-emerald-700",
                    ].join(" ")
                  : [
                      "border-[var(--afriskill-gold)]",
                      "bg-[var(--afriskill-gold)]",
                      "text-[var(--afriskill-navy-dark)]",

                      "shadow-[0_6px_18px_rgba(245,180,0,0.18)]",

                      "hover:border-[var(--afriskill-gold-light)]",
                      "hover:bg-[var(--afriskill-gold-light)]",
                      "hover:shadow-[0_8px_22px_rgba(245,180,0,0.22)]",
                    ].join(" "),
            ].join(" ")}
          >
            {inCart ? (
              <CheckIcon />
            ) : (
              <CartIcon />
            )}
          </button>
        </div>

        {/* ==============================================================
            Ã‰TAT DU PANIER
            ============================================================== */}

        <div
          aria-live="polite"
          className="min-h-[18px] sm:min-h-[20px]"
        >
          {inCart ? (
            <p
              className={[
                "mt-2",

                "inline-flex",
                "items-center",
                "gap-1",

                "text-[9px]",
                "font-semibold",
                "leading-4",

                "text-emerald-700",

                "sm:gap-1.5",
                "sm:text-[11px]",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "flex",
                  "h-4",
                  "w-4",
                  "shrink-0",
                  "items-center",
                  "justify-center",

                  "rounded-full",

                  "bg-emerald-100",
                ].join(" ")}
              >
                <CheckIcon />
              </span>

              <span className="truncate">
                AjoutÃ© au panier
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
