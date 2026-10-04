import type { CSSProperties, ReactNode } from "react";

import FormationDescriptionRenderer from "@/components/public/formations/FormationDescriptionRenderer";
import FormationFaq from "@/components/public/formations/FormationFaq";
import FormationOrderBar from "@/components/public/formations/FormationOrderBar";

import {
  getPublicCourseDiscountAmount,
  getPublicCourseDiscountPercentage,
  getPublicCourseEffectivePrice,
  publicCourseHasPromotion,
  type PublicCourseDetail,
} from "@/types/public-course";

/**
 * ============================================================================
 * AFRISKILL AI — FORMATION SALES PAGE
 * ============================================================================
 *
 * Page publique premium de présentation et de vente d'une formation.
 *
 * Principes :
 * - titre principal immédiatement identifiable ;
 * - excellente lisibilité mobile et desktop ;
 * - hiérarchie commerciale forte ;
 * - prix et promotion clairement présentés ;
 * - description enrichie conservée ;
 * - images affichées entièrement sans recadrage ;
 * - images conservées dans leur ordre ;
 * - FAQ interactive intégrée ;
 * - informations de livraison clairement expliquées ;
 * - contraste sécurisé sur les zones sombres ;
 * - aucun faux avis ou faux chiffre ;
 * - aucun panier ni sélecteur de quantité ;
 * - aucune logique de paiement exécutée ici ;
 * - barre de commande persistante conservée.
 * ============================================================================
 */

type FormationSalesPageProps = {
  course: PublicCourseDetail;
  checkoutHref?: string | null;
};

/**
 * ============================================================================
 * COULEURS
 * ============================================================================
 */

const BRAND_COLORS = {
  navy: "#071936",
  blue: "#0759D9",
  brightBlue: "#1685F8",
  gold: "#F5AA00",
  white: "#FFFFFF",
} as const;

const DARK_CARD_COLORS = {
  background: "#071936",
  white: "#FFFFFF",
  primaryText: "#FFFFFF",
  secondaryText: "#E8EEF8",
  mutedText: "#C7D2E3",
  labelText: "#DCEBFF",
  oldPrice: "#CBD5E1",
  success: "#A7F3D0",
} as const;

/**
 * Les styles inline importants protègent la lisibilité contre
 * d'éventuelles règles typographiques globales du projet.
 */

const heroTitleStyle: CSSProperties = {
  color: BRAND_COLORS.navy,
  fontWeight: 900,
};

const darkTitleStyle: CSSProperties = {
  color: DARK_CARD_COLORS.primaryText,
  fontWeight: 900,
};

const darkDescriptionStyle: CSSProperties = {
  color: DARK_CARD_COLORS.secondaryText,
};

const darkLabelStyle: CSSProperties = {
  color: DARK_CARD_COLORS.labelText,
};

const darkOldPriceStyle: CSSProperties = {
  color: DARK_CARD_COLORS.oldPrice,
};

const darkSuccessStyle: CSSProperties = {
  color: DARK_CARD_COLORS.success,
};

/**
 * ============================================================================
 * FORMATAGE
 * ============================================================================
 */

function normalizeCurrency(currency: string): string {
  const normalized = currency.trim().toUpperCase();

  return normalized || "XOF";
}

function formatCoursePrice(
  amount: number,
  currency: string,
): string {
  const safeAmount = Number.isFinite(amount)
    ? Math.max(0, amount)
    : 0;

  const normalizedCurrency =
    normalizeCurrency(currency);

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits: Number.isInteger(safeAmount)
        ? 0
        : 2,
    }).format(safeAmount);
  } catch {
    return `${new Intl.NumberFormat("fr-FR", {
      maximumFractionDigits: Number.isInteger(safeAmount)
        ? 0
        : 2,
    }).format(safeAmount)} ${normalizedCurrency}`;
  }
}

/**
 * ============================================================================
 * ICONS
 * ============================================================================
 */

function CheckIcon({
  className = "h-4 w-4",
}: {
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      className={className}
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

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <rect
        x="3.5"
        y="4"
        width="17"
        height="13"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m10 8 5 2.5-5 2.5V8Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 20h8"
        stroke="currentColor"
        strokeWidth="1.7"
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
      className="h-5 w-5"
    >
      <path
        d="M12 3 5 6v5c0 4.8 2.9 8.2 7 10 4.1-1.8 7-5.2 7-10V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="m9.2 12 1.8 1.8 3.8-4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <circle
        cx="12"
        cy="8"
        r="3.25"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5.5 19c.75-3.15 3-5 6.5-5s5.75 1.85 6.5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
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
      className="h-5 w-5"
    >
      <rect
        x="5"
        y="10"
        width="14"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M8.5 10V7.5a3.5 3.5 0 1 1 7 0V10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 14v2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M12 3.5c.65 4.05 2.45 5.85 6.5 6.5-4.05.65-5.85 2.45-6.5 6.5-.65-4.05-2.45-5.85-6.5-6.5 4.05-.65 5.85-2.45 6.5-6.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M18.5 16.5c.25 1.55.95 2.25 2.5 2.5-1.55.25-2.25.95-2.5 2.5-.25-1.55-.95-2.25-2.5-2.5 1.55-.25 2.25-.95 2.5-2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LightningIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="m13.5 2.8-7 10.1h5.2l-1.2 8.3 7-10.1h-5.2l1.2-8.3Z"
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
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="m5 8 7 5 7-5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M14 3.8V8h4.2M9 12h6M9 15.5h6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ============================================================================
 * IMAGE PRINCIPALE
 * ============================================================================
 *
 * L'image réelle conserve maintenant son ratio naturel.
 * Aucun aspect ratio fixe et aucun object-cover ne sont appliqués.
 * L'image est donc affichée entièrement.
 * ============================================================================
 */

function FormationPrimaryImage({
  course,
}: {
  course: PublicCourseDetail;
}) {
  if (!course.primaryImage) {
    return (
      <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-[#071936] px-8 text-center">
        <div
          aria-hidden="true"
          className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blue-500/25 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-amber-400/15 blur-3xl"
        />

        <div className="relative z-10 max-w-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur">
            <PlayIcon />
          </div>

          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-blue-200">
            Formation AfriSkill AI
          </p>

          <p
            className="mt-3 text-2xl font-black leading-tight tracking-[-0.035em] sm:text-3xl"
            style={{
              color: BRAND_COLORS.white,
              fontWeight: 900,
            }}
          >
            {course.title}
          </p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={course.primaryImage.url}
      alt={course.primaryImage.alt}
      loading="eager"
      decoding="async"
      className="block h-auto w-full object-contain"
    />
  );
}

/**
 * ============================================================================
 * IMAGE SECONDAIRE
 * ============================================================================
 *
 * Aucun recadrage.
 * L'image conserve également son ratio naturel.
 * ============================================================================
 */

function FormationSecondaryImage({
  course,
}: {
  course: PublicCourseDetail;
}) {
  if (!course.secondaryImage) {
    return null;
  }

  return (
    <figure className="overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white p-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
      <div className="overflow-hidden rounded-[1.3rem] bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={course.secondaryImage.url}
          alt={course.secondaryImage.alt}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full object-contain"
        />
      </div>
    </figure>
  );
}

/**
 * ============================================================================
 * AVANTAGE
 * ============================================================================
 */

function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
        {icon}
      </div>

      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-black leading-5 text-slate-950">
          {title}
        </p>

        <p className="mt-1 text-[13px] leading-5 text-slate-600">
          {description}
        </p>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * CARTE PRIX PREMIUM
 * ============================================================================
 */

function PremiumPricingCard({
  course,
}: {
  course: PublicCourseDetail;
}) {
  const hasPromotion =
    publicCourseHasPromotion(course);

  const effectivePrice =
    getPublicCourseEffectivePrice(course);

  const discountAmount =
    getPublicCourseDiscountAmount(course);

  const discountPercentage =
    getPublicCourseDiscountPercentage(course);

  return (
    <div className="relative overflow-hidden rounded-[1.65rem] border border-slate-200/90 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.09)]">
      <div className="h-1.5 bg-gradient-to-r from-[#0759D9] via-[#1685F8] to-[#F5AA00]" />

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Prix de la formation
            </p>

            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2">
              <span
                className="text-[2rem] font-black leading-none tracking-[-0.045em] sm:text-[2.6rem]"
                style={{
                  color: BRAND_COLORS.navy,
                  fontWeight: 900,
                }}
              >
                {formatCoursePrice(
                  effectivePrice,
                  course.currency,
                )}
              </span>

              {hasPromotion ? (
                <span className="pb-1 text-sm font-bold text-slate-500 line-through sm:text-base">
                  {formatCoursePrice(
                    course.price,
                    course.currency,
                  )}
                </span>
              ) : null}
            </div>
          </div>

          {hasPromotion &&
          discountPercentage !== null ? (
            <div className="shrink-0 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-700">
                Offre
              </p>

              <p className="mt-0.5 text-sm font-black text-emerald-800">
                -{discountPercentage}%
              </p>
            </div>
          ) : null}
        </div>

        {hasPromotion &&
        discountAmount > 0 ? (
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800">
            <CheckIcon />

            <span>
              Vous économisez{" "}
              {formatCoursePrice(
                discountAmount,
                course.currency,
              )}
            </span>
          </div>
        ) : null}

        <div className="my-5 h-px bg-slate-100" />

        <div className="grid gap-5 sm:grid-cols-2">
          <BenefitItem
            icon={<PlayIcon />}
            title="Formation numérique"
            description="Votre contenu est accessible en ligne après validation."
          />

          <BenefitItem
            icon={<ShieldIcon />}
            title="Accès sécurisé"
            description="L'accès est activé après confirmation du paiement."
          />
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * CARTE D'ACCÈS
 * ============================================================================
 */

function AccessCard() {
  return (
    <div className="relative overflow-hidden rounded-[1.7rem] border border-slate-200/80 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.075)] sm:p-6">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-blue-100/70 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#071936] text-white shadow-[0_10px_25px_rgba(7,25,54,0.22)]">
            <LockIcon />
          </div>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-blue-700">
              Votre accès
            </p>

            <h2 className="mt-1 text-lg font-black tracking-[-0.025em] text-slate-950">
              Simple et sécurisé
            </h2>
          </div>
        </div>

        <div className="my-6 h-px bg-slate-100" />

        <div className="space-y-5">
          <BenefitItem
            icon={<CheckIcon className="h-5 w-5" />}
            title="Accès après validation"
            description="Votre formation est débloquée lorsque le paiement est confirmé."
          />

          <BenefitItem
            icon={<UserIcon />}
            title="Accès personnel"
            description="La formation reste associée au compte utilisé pour la commande."
          />

          <BenefitItem
            icon={<ShieldIcon />}
            title="Commande protégée"
            description="La validation de votre accès est gérée par AfriSkill AI."
          />
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * LIVRAISON APRÈS PAIEMENT
 * ============================================================================
 */

function AutomaticDeliverySection() {
  return (
    <div className="relative overflow-hidden rounded-[1.8rem] border border-blue-100 bg-[linear-gradient(135deg,#f7faff_0%,#ffffff_55%,#fff9e8_100%)] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-blue-100/70 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#071936] text-white shadow-[0_10px_25px_rgba(7,25,54,0.18)]">
            <LightningIcon />
          </span>

          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-blue-700">
              Après votre paiement
            </p>

            <h3 className="mt-1 text-lg font-black tracking-[-0.025em] text-[#071936] sm:text-xl">
              Votre formation vous est délivrée automatiquement
            </h3>
          </div>
        </div>

        <p className="mt-5 max-w-3xl text-sm font-medium leading-7 text-slate-600 sm:text-[15px]">
          Une fois votre paiement confirmé, votre accès à la
          formation est activé automatiquement. Les éléments
          associés à votre achat sont également envoyés à
          l'adresse e-mail utilisée pour votre compte.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <PlayIcon />
            </span>

            <p className="mt-4 text-sm font-black text-[#071936]">
              Formation complète
            </p>

            <p className="mt-1.5 text-xs font-medium leading-5 text-slate-600">
              Votre accès est activé après confirmation du paiement.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <MailIcon />
            </span>

            <p className="mt-4 text-sm font-black text-[#071936]">
              Lien par e-mail
            </p>

            <p className="mt-1.5 text-xs font-medium leading-5 text-slate-600">
              Les informations d'accès prévues sont envoyées automatiquement.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <DocumentIcon />
            </span>

            <p className="mt-4 text-sm font-black text-[#071936]">
              PDF associé
            </p>

            <p className="mt-1.5 text-xs font-medium leading-5 text-slate-600">
              Le document associé à la formation accompagne votre achat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * SECTION FINALE PREMIUM
 * ============================================================================
 */

function PremiumFinalOffer({
  course,
}: {
  course: PublicCourseDetail;
}) {
  const hasPromotion =
    publicCourseHasPromotion(course);

  const effectivePrice =
    getPublicCourseEffectivePrice(course);

  const discountPercentage =
    getPublicCourseDiscountPercentage(course);

  const shortDescription =
    course.shortDescription?.trim() || null;

  return (
    <div
      className="relative isolate overflow-hidden rounded-[1.8rem] shadow-[0_28px_70px_rgba(7,25,54,0.24)] ring-1 ring-inset ring-white/10 sm:rounded-[2rem]"
      style={{
        backgroundColor: DARK_CARD_COLORS.background,
        color: DARK_CARD_COLORS.white,
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-28 -z-10 h-72 w-72 rounded-full bg-[#1685F8]/20 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 right-0 -z-10 h-80 w-80 rounded-full bg-[#F5AA00]/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#1685F8] via-[#0875EC] to-[#F5AA00]"
      />

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(270px,auto)] lg:items-center lg:gap-12 lg:p-10">
        <div className="min-w-0">
          <div
            className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-sm"
            style={{
              color: DARK_CARD_COLORS.white,
            }}
          >
            <SparkIcon />

            <span
              style={{
                color: DARK_CARD_COLORS.white,
              }}
            >
              Formation sélectionnée
            </span>
          </div>

          <h2
            className="mt-5 max-w-3xl text-[1.8rem] font-black leading-[1.05] tracking-[-0.045em] sm:text-[2.25rem] lg:text-[2.55rem]"
            style={darkTitleStyle}
          >
            {course.title}
          </h2>

          {shortDescription ? (
            <p
              className="mt-4 max-w-2xl text-[15px] font-semibold leading-7 sm:text-base"
              style={darkDescriptionStyle}
            >
              {shortDescription}
            </p>
          ) : null}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-7 sm:gap-y-3">
            <div
              className="inline-flex items-center gap-2.5 text-sm font-bold"
              style={{
                color: DARK_CARD_COLORS.white,
              }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-400/20"
                style={darkSuccessStyle}
              >
                <CheckIcon />
              </span>

              <span
                style={{
                  color: DARK_CARD_COLORS.white,
                }}
              >
                Formation numérique
              </span>
            </div>

            <div
              className="inline-flex items-center gap-2.5 text-sm font-bold"
              style={{
                color: DARK_CARD_COLORS.white,
              }}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-300/25 bg-emerald-400/20"
                style={darkSuccessStyle}
              >
                <CheckIcon />
              </span>

              <span
                style={{
                  color: DARK_CARD_COLORS.white,
                }}
              >
                Accès sécurisé
              </span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/20 pt-7 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
          <p
            className="text-[10px] font-black uppercase tracking-[0.22em]"
            style={darkLabelStyle}
          >
            Prix de la formation
          </p>

          {hasPromotion ? (
            <p
              className="mt-3 text-sm font-bold line-through"
              style={{
                ...darkOldPriceStyle,
                textDecorationColor:
                  DARK_CARD_COLORS.oldPrice,
              }}
            >
              {formatCoursePrice(
                course.price,
                course.currency,
              )}
            </p>
          ) : null}

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p
              className="text-3xl font-black leading-none tracking-[-0.045em] sm:text-4xl"
              style={{
                color: DARK_CARD_COLORS.white,
                fontWeight: 900,
              }}
            >
              {formatCoursePrice(
                effectivePrice,
                course.currency,
              )}
            </p>

            {hasPromotion &&
            discountPercentage !== null ? (
              <span
                className="rounded-full border border-emerald-300/30 bg-emerald-400/20 px-3 py-1.5 text-xs font-black"
                style={darkSuccessStyle}
              >
                -{discountPercentage}%
              </span>
            ) : null}
          </div>

          <div
            className="mt-5 flex items-center gap-2.5 border-t border-white/15 pt-4 text-xs font-bold"
            style={{
              color:
                DARK_CARD_COLORS.secondaryText,
            }}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10"
              style={darkLabelStyle}
            >
              <ShieldIcon />
            </span>

            <span
              style={{
                color:
                  DARK_CARD_COLORS.secondaryText,
              }}
            >
              Accès après paiement confirmé
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * PAGE
 * ============================================================================
 */

export default function FormationSalesPage({
  course,
  checkoutHref,
}: FormationSalesPageProps) {
  const shortDescription =
    course.shortDescription?.trim() || null;

  return (
    <>
      <main className="min-h-screen bg-white pb-44 md:pb-28">
        {/*
         * ==================================================================
         * HERO COMMERCIAL
         * ==================================================================
         */}

        <section className="relative isolate overflow-hidden border-b border-slate-200/80 bg-[linear-gradient(180deg,#f6faff_0%,#ffffff_92%)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-180px] -z-10 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-blue-100/70 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[-180px] top-24 -z-10 h-80 w-80 rounded-full bg-amber-100/60 blur-3xl"
          />

          <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-11 lg:px-8 lg:py-16">
            <div className="grid items-center gap-9 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-12 xl:gap-16">
              {/*
               * ============================================================
               * IMAGE PRINCIPALE
               * ============================================================
               */}

              <div className="min-w-0">
                <div className="relative">
                  <div
                    aria-hidden="true"
                    className="absolute -inset-3 -z-10 rounded-[2.2rem] bg-gradient-to-br from-blue-200/60 via-transparent to-amber-200/50 blur-xl"
                  />

                  <div className="overflow-hidden rounded-[1.7rem] border border-white bg-white p-1.5 shadow-[0_28px_80px_rgba(15,23,42,0.16)] sm:rounded-[2rem] sm:p-2">
                    <div className="overflow-hidden rounded-[1.4rem] bg-slate-100 sm:rounded-[1.6rem]">
                      <FormationPrimaryImage
                        course={course}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/*
               * ============================================================
               * INFORMATIONS PRINCIPALES
               * ============================================================
               */}

              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-[9px] font-black uppercase tracking-[0.21em] text-blue-700 shadow-sm sm:text-[10px]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-50" />

                    <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
                  </span>

                  Formation AfriSkill AI
                </div>

                {/*
                 * ==========================================================
                 * TITRE PRINCIPAL
                 * ==========================================================
                 */}

                <div className="mt-4 max-w-3xl sm:mt-5">
                  <h1
                    className="break-words text-[2.15rem] font-black leading-[0.98] tracking-[-0.055em] sm:text-[2.85rem] sm:leading-[0.98] lg:text-[3.45rem] xl:text-[3.8rem]"
                    style={heroTitleStyle}
                  >
                    {course.title}
                  </h1>

                  <div
                    aria-hidden="true"
                    className="mt-4 flex items-center gap-2"
                  >
                    <span className="h-1.5 w-14 rounded-full bg-[#0759D9]" />

                    <span className="h-1.5 w-5 rounded-full bg-[#F5AA00]" />
                  </div>
                </div>

                {shortDescription ? (
                  <p className="mt-5 max-w-2xl text-[15px] font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
                    {shortDescription}
                  </p>
                ) : null}

                <div className="mt-7">
                  <PremiumPricingCard
                    course={course}
                  />
                </div>

                <div className="mt-5 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-600">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                    <CheckIcon />
                  </span>

                  <span>
                    Votre accès est activé après validation du paiement.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/*
         * ==================================================================
         * PRÉSENTATION
         * ==================================================================
         */}

        <section className="relative bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="mb-8 sm:mb-10">
              <div className="flex items-center gap-3">
                <span className="h-1 w-10 rounded-full bg-blue-600" />

                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                  Présentation
                </p>
              </div>

              <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] text-[#071936] sm:text-3xl">
                À propos de cette formation
              </h2>
            </div>

            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_370px] xl:gap-16">
              {/*
               * ============================================================
               * DESCRIPTION ENRICHIE
               * ============================================================
               */}

              <article className="min-w-0">
                <div className="overflow-hidden rounded-[1.8rem] border border-slate-200/80 bg-white shadow-[0_18px_55px_rgba(15,23,42,0.06)]">
                  <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-transparent" />

                  <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
                    <FormationDescriptionRenderer
                      course={course}
                    />
                  </div>
                </div>
              </article>

              {/*
               * ============================================================
               * SIDEBAR
               * ============================================================
               */}

              <aside className="min-w-0 space-y-6 lg:sticky lg:top-24">
                <AccessCard />

                <FormationSecondaryImage
                  course={course}
                />

                <div className="relative overflow-hidden rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 sm:p-6">
                  <div
                    aria-hidden="true"
                    className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-amber-100/60 blur-2xl"
                  />

                  <div className="relative">
                    <p className="text-[9px] font-black uppercase tracking-[0.22em] text-blue-700">
                      AfriSkill AI
                    </p>

                    <p className="mt-2 text-lg font-black leading-6 tracking-[-0.025em] text-[#071936]">
                      Apprendre. Créer. Lancer. Monétiser.
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Votre formation et votre accès sont centralisés
                      sur la plateforme AfriSkill AI.
                    </p>
                  </div>
                </div>
              </aside>
            </div>

            {/*
             * ==============================================================
             * LIVRAISON AUTOMATIQUE
             * ==============================================================
             */}

            <div className="mt-10 sm:mt-12 lg:mt-14">
              <AutomaticDeliverySection />
            </div>
          </div>
        </section>

        {/*
         * ==================================================================
         * FAQ
         * ==================================================================
         *
         * Le composant FAQ reste séparé de la page serveur.
         * Toute l'interactivité de l'accordéon est contenue dans
         * FormationFaq.tsx.
         * ==================================================================
         */}

        <section className="relative overflow-hidden border-t border-slate-200/80 bg-[linear-gradient(180deg,#f8fbff_0%,#ffffff_100%)]">
          <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
            <FormationFaq />
          </div>
        </section>

        {/*
         * ==================================================================
         * CONVERSION FINALE PREMIUM
         * ==================================================================
         */}

        <section className="border-t border-slate-200/80 bg-[linear-gradient(180deg,#f8fafc_0%,#eef5ff_100%)]">
          <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
            <PremiumFinalOffer
              course={course}
            />
          </div>
        </section>
      </main>

      {/*
       * ====================================================================
       * BARRE DE COMMANDE FIXE
       * ====================================================================
       */}

      <FormationOrderBar
        course={course}
        checkoutHref={checkoutHref}
      />
    </>
  );
}