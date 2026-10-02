import Image from "next/image";
import Link from "next/link";

import { HOME_CONTENT } from "@/lib/home-content";

/**
 * ============================================================================
 * AFRISKILL AI — HOME HERO
 * ============================================================================
 *
 * Section principale de la page d'accueil.
 *
 * Objectifs :
 * - expliquer immédiatement la proposition de valeur ;
 * - mettre les formations au premier plan ;
 * - présenter une hiérarchie visuelle forte ;
 * - conserver une image immersive sans réduire la lisibilité ;
 * - proposer des CTA visibles sur mobile et desktop ;
 * - garantir un contraste élevé sur tous les écrans ;
 * - rester cohérent avec le design system global.
 *
 * Mobile :
 * - contenu éditorial en premier ;
 * - CTA pleine largeur ;
 * - image séparée et lisible.
 *
 * Desktop :
 * - image immersive en arrière-plan ;
 * - contenu positionné à gauche ;
 * - protection renforcée derrière le texte ;
 * - conservation de l'image visible sur la partie droite.
 * ============================================================================
 */

/**
 * Icône de validation utilisée dans les bénéfices.
 */
function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="15"
      height="15"
      className="h-[15px] w-[15px] shrink-0"
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
 * Flèche du CTA principal.
 */
function ArrowIcon() {
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
        d="M5 12h13M13 7l5 5-5 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Icône du CTA secondaire.
 */
function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="17"
      height="17"
      className="h-[17px] w-[17px] shrink-0"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m10 8.75 5 3.25-5 3.25v-6.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Petit point décoratif du badge supérieur.
 */
function EyebrowDot() {
  return (
    <span
      aria-hidden="true"
      className={[
        "relative",
        "flex",
        "h-2",
        "w-2",
        "shrink-0",
        "items-center",
        "justify-center",
      ].join(" ")}
    >
      <span
        className={[
          "absolute",
          "h-2",
          "w-2",
          "rounded-full",
          "bg-[var(--afriskill-cyan)]",
        ].join(" ")}
      />

      <span
        className={[
          "absolute",
          "h-4",
          "w-4",
          "rounded-full",
          "border",
          "border-[var(--afriskill-cyan)]/30",
        ].join(" ")}
      />
    </span>
  );
}

/**
 * ============================================================================
 * BÉNÉFICES
 * ============================================================================
 *
 * Aucun chiffre de preuve sociale non vérifié.
 */

function HeroBenefits() {
  const benefits = [
    "Formations pratiques",
    "Accès en ligne",
    "Apprentissage à votre rythme",
  ] as const;

  return (
    <div
      aria-label="Avantages des formations AfriSkill AI"
      className={[
        "flex",
        "flex-wrap",
        "items-center",

        "gap-x-4",
        "gap-y-2.5",

        "sm:gap-x-5",
        "lg:gap-x-6",
      ].join(" ")}
    >
      {benefits.map((benefit) => (
        <div
          key={benefit}
          className={[
            "inline-flex",
            "items-center",
            "gap-2",

            "text-[11px]",
            "font-semibold",
            "leading-5",

            /**
             * Blanc volontairement renforcé.
             * Les bénéfices restent parfaitement lisibles sur le fond sombre.
             */
            "text-white/95",

            "sm:text-xs",
            "lg:text-[13px]",
          ].join(" ")}
        >
          <span
            className={[
              "flex",
              "h-5",
              "w-5",
              "shrink-0",
              "items-center",
              "justify-center",

              "rounded-full",

              "border",
              "border-[var(--afriskill-cyan)]/30",

              "bg-[var(--afriskill-cyan)]/15",

              "text-[var(--afriskill-cyan-light)]",
            ].join(" ")}
          >
            <CheckIcon />
          </span>

          <span>{benefit}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * ============================================================================
 * ACTIONS
 * ============================================================================
 */

function HeroActions() {
  const { hero } = HOME_CONTENT;

  return (
    <div
      className={[
        "flex",
        "w-full",
        "flex-col",
        "gap-3",

        "sm:w-auto",
        "sm:flex-row",
        "sm:flex-wrap",
      ].join(" ")}
    >
      {/* CTA PRINCIPAL */}

      <Link
        href={hero.primaryAction.href}
        className={[
          "group",

          "inline-flex",
          "min-h-[50px]",
          "w-full",
          "items-center",
          "justify-center",
          "gap-2.5",

          "rounded-xl",

          "border",
          "border-[var(--afriskill-gold)]",

          "bg-[var(--afriskill-gold)]",

          "px-5",
          "py-3",

          "text-center",
          "text-sm",
          "font-bold",
          "leading-5",

          "!text-[var(--afriskill-navy-dark)]",

          "shadow-[0_12px_30px_rgba(245,180,0,0.20)]",

          "transition-[background-color,border-color,box-shadow,transform,color]",
          "duration-200",

          "hover:border-[var(--afriskill-gold-light)]",
          "hover:bg-[var(--afriskill-gold-light)]",
          "hover:!text-[var(--afriskill-navy-dark)]",
          "hover:shadow-[0_16px_36px_rgba(245,180,0,0.24)]",

          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[var(--afriskill-gold)]",
          "focus-visible:ring-offset-2",
          "focus-visible:ring-offset-[var(--afriskill-navy-dark)]",

          "active:translate-y-px",

          "sm:w-auto",
          "sm:min-w-[180px]",
          "sm:px-6",
        ].join(" ")}
      >
        <span className="!text-[var(--afriskill-navy-dark)]">
          {hero.primaryAction.label}
        </span>

        <span
          aria-hidden="true"
          className={[
            "!text-[var(--afriskill-navy-dark)]",

            "transition-transform",
            "duration-200",

            "group-hover:translate-x-0.5",
          ].join(" ")}
        >
          <ArrowIcon />
        </span>
      </Link>

      {/* CTA SECONDAIRE */}

      <Link
        href={hero.secondaryAction.href}
        className={[
          "group/secondary",

          "inline-flex",
          "min-h-[50px]",
          "w-full",
          "items-center",
          "justify-center",
          "gap-2.5",

          "rounded-xl",

          "border",
          "border-white/25",

          "bg-white/[0.08]",

          "px-5",
          "py-3",

          "text-center",
          "text-sm",
          "font-bold",
          "leading-5",

          "!text-white",

          "shadow-[0_8px_24px_rgba(0,0,0,0.10)]",

          "backdrop-blur-sm",

          "transition-[background-color,border-color,color,transform]",
          "duration-200",

          "hover:border-[var(--afriskill-cyan)]/55",
          "hover:bg-white/[0.12]",
          "hover:!text-[var(--afriskill-cyan-light)]",

          "focus-visible:outline-none",
          "focus-visible:ring-2",
          "focus-visible:ring-[var(--afriskill-cyan)]",
          "focus-visible:ring-offset-2",
          "focus-visible:ring-offset-[var(--afriskill-navy-dark)]",

          "active:translate-y-px",

          "sm:w-auto",
          "sm:min-w-[180px]",
          "sm:px-6",
        ].join(" ")}
      >
        <span
          aria-hidden="true"
          className="shrink-0 text-current"
        >
          <PlayIcon />
        </span>

        <span className="text-current">
          {hero.secondaryAction.label}
        </span>
      </Link>
    </div>
  );
}

/**
 * ============================================================================
 * TEXTE PRINCIPAL
 * ============================================================================
 *
 * Utilisé à la fois sur mobile et desktop afin de conserver
 * exactement le même message.
 */

function HeroText() {
  const { hero } = HOME_CONTENT;

  return (
    <div className="w-full">
      {/* EYEBROW */}

      <div
        className={[
          "inline-flex",
          "max-w-full",
          "items-center",
          "gap-2.5",

          "rounded-full",

          "border",
          "border-[var(--afriskill-cyan)]/35",

          "bg-[var(--afriskill-navy-dark)]/35",

          "px-3",
          "py-2",

          "text-[9px]",
          "font-bold",
          "uppercase",
          "leading-4",
          "tracking-[0.11em]",

          "text-[var(--afriskill-cyan-light)]",

          "shadow-[0_6px_20px_rgba(0,0,0,0.10)]",

          "backdrop-blur-sm",

          "sm:px-4",
          "sm:text-[10px]",

          "lg:text-[11px]",
        ].join(" ")}
      >
        <EyebrowDot />

        <span className="min-w-0">
          {hero.eyebrow}
        </span>
      </div>

      {/* TITRE */}

      <h1
        id="home-hero-title"
        className={[
          "mt-5",

          "max-w-[680px]",

          "text-[34px]",
          "font-black",
          "leading-[1.04]",
          "tracking-[-0.045em]",

          /**
           * Blanc explicite pour empêcher tout style global
           * de réduire le contraste du titre.
           */
          "!text-white",

          /**
           * Ombre très légère : elle protège les contours des lettres
           * sans donner un effet artificiel au titre.
           */
          "[text-shadow:0_2px_18px_rgba(0,0,0,0.28)]",

          "min-[380px]:text-[37px]",

          "sm:text-[44px]",
          "sm:leading-[1.03]",

          "lg:mt-6",
          "lg:text-[50px]",

          "xl:text-[58px]",
          "xl:leading-[1.02]",
        ].join(" ")}
      >
        {hero.title}{" "}

        <span
          className={[
            "!text-[var(--afriskill-gold)]",
            "[text-shadow:0_2px_18px_rgba(0,0,0,0.22)]",
          ].join(" ")}
        >
          {hero.highlightedTitle}
        </span>
      </h1>

      {/* DESCRIPTION */}

      <p
        className={[
          "mt-5",

          "max-w-[620px]",

          "text-sm",
          "font-medium",
          "leading-6",

          /**
           * Presque blanc pour conserver la hiérarchie avec le titre
           * tout en garantissant une excellente lisibilité.
           */
          "!text-white/90",

          "[text-shadow:0_1px_12px_rgba(0,0,0,0.20)]",

          "sm:text-[15px]",
          "sm:leading-7",

          "lg:mt-6",
          "lg:text-base",
          "lg:leading-7",
        ].join(" ")}
      >
        {hero.description}
      </p>

      {/* BÉNÉFICES */}

      <div
        className={[
          "mt-5",

          "sm:mt-6",

          "lg:mt-7",
        ].join(" ")}
      >
        <HeroBenefits />
      </div>

      {/* ACTIONS */}

      <div
        className={[
          "mt-7",

          "sm:mt-8",

          "lg:mt-9",
        ].join(" ")}
      >
        <HeroActions />
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * HERO MOBILE / TABLETTE
 * ============================================================================
 *
 * Sur mobile, l'image est séparée du texte.
 *
 * Cette architecture évite :
 * - le texte illisible sur une image complexe ;
 * - les mauvaises zones de crop ;
 * - les CTA écrasés ;
 * - les hauteurs excessives.
 */

function MobileHero() {
  const { hero } = HOME_CONTENT;

  return (
    <div className="lg:hidden">
      <div
        className={[
          "relative",
          "overflow-hidden",

          "bg-[var(--afriskill-navy-dark)]",
        ].join(" ")}
      >
        {/* LUMIÈRE GAUCHE */}

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none",
            "absolute",
            "-left-28",
            "-top-20",

            "h-72",
            "w-72",

            "rounded-full",

            "bg-[var(--afriskill-blue)]/30",

            "blur-3xl",
          ].join(" ")}
        />

        {/* LUMIÈRE DROITE */}

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none",
            "absolute",
            "-right-28",
            "top-36",

            "h-64",
            "w-64",

            "rounded-full",

            "bg-[var(--afriskill-cyan)]/[0.08]",

            "blur-3xl",
          ].join(" ")}
        />

        {/* ==============================================================
            TEXTE
            ============================================================== */}

        <div
          className={[
            "afr-page-container",
            "relative",
            "z-10",

            "pb-8",
            "pt-8",

            "sm:pb-10",
            "sm:pt-11",
          ].join(" ")}
        >
          <HeroText />
        </div>

        {/* ==============================================================
            IMAGE
            ============================================================== */}

        <div
          className={[
            "afr-page-container",
            "relative",
            "z-10",

            "pb-5",

            "sm:pb-8",
          ].join(" ")}
        >
          <div
            className={[
              "relative",

              "aspect-[16/10]",
              "w-full",

              "overflow-hidden",

              "rounded-[22px]",

              "border",
              "border-white/[0.12]",

              "bg-[#031027]",

              "shadow-[0_20px_50px_rgba(0,0,0,0.28)]",

              "sm:aspect-[16/9]",
              "sm:rounded-[26px]",
            ].join(" ")}
          >
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              priority
              sizes={[
                "(max-width: 639px) calc(100vw - 32px)",
                "(max-width: 1023px) calc(100vw - 48px)",
                "768px",
              ].join(", ")}
              className={[
                "object-cover",
                "object-center",
              ].join(" ")}
            />

            {/* Protection visuelle inférieure */}

            <div
              aria-hidden="true"
              className={[
                "pointer-events-none",
                "absolute",
                "inset-0",

                "bg-gradient-to-t",

                "from-[var(--afriskill-navy-dark)]/25",
                "via-transparent",
                "to-transparent",
              ].join(" ")}
            />

            {/* Fine lumière intérieure */}

            <div
              aria-hidden="true"
              className={[
                "pointer-events-none",
                "absolute",
                "inset-0",

                "ring-1",
                "ring-inset",
                "ring-white/[0.05]",
              ].join(" ")}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * HERO DESKTOP
 * ============================================================================
 *
 * Sur desktop, l'image devient immersive.
 *
 * Le côté gauche reçoit une protection sombre renforcée.
 * L'image reste volontairement plus visible à droite.
 */

function DesktopHero() {
  const { hero } = HOME_CONTENT;

  return (
    <div
      className={[
        "relative",
        "hidden",

        "lg:block",
      ].join(" ")}
    >
      <div
        className={[
          "relative",

          "min-h-[590px]",

          "overflow-hidden",

          "bg-[var(--afriskill-navy-dark)]",

          "xl:min-h-[640px]",
        ].join(" ")}
      >
        {/* ==============================================================
            IMAGE PRINCIPALE
            ============================================================== */}

        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          priority
          sizes="100vw"
          className={[
            "object-cover",
            "object-center",
          ].join(" ")}
        />

        {/* ==============================================================
            PROTECTION HORIZONTALE DU TEXTE
            ============================================================== */}

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none",
            "absolute",
            "inset-0",

            /**
             * Zone gauche volontairement très sombre.
             *
             * Le texte occupe environ 58 % de la largeur du container.
             * Le dégradé reste donc suffisamment opaque jusqu'au centre,
             * puis s'efface progressivement afin de révéler l'image.
             */
            "bg-gradient-to-r",

            "from-[#010611]",
            "from-[0%]",

            "via-[#02112a]",
            "via-[48%]",

            "to-[#031027]/35",
            "to-[76%]",
          ].join(" ")}
        />

        {/* ==============================================================
            PROTECTION VERTICALE
            ============================================================== */}

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none",
            "absolute",
            "inset-0",

            "bg-gradient-to-t",

            "from-[var(--afriskill-navy-dark)]/65",
            "via-transparent",
            "to-[var(--afriskill-navy-dark)]/20",
          ].join(" ")}
        />

        {/* ==============================================================
            RENFORT LOCAL DERRIÈRE LE CONTENU
            ============================================================== */}

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none",
            "absolute",

            "inset-y-0",
            "left-0",

            "w-[62%]",

            "bg-gradient-to-r",

            "from-[#010611]/55",
            "via-[#010b20]/20",
            "to-transparent",
          ].join(" ")}
        />

        {/* ==============================================================
            LUMIÈRE BLEUE
            ============================================================== */}

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none",
            "absolute",
            "-left-40",
            "-top-40",

            "h-[540px]",
            "w-[540px]",

            "rounded-full",

            /**
             * Lumière conservée mais légèrement réduite afin qu'elle
             * n'affaiblisse pas le contraste du texte blanc.
             */
            "bg-[var(--afriskill-blue)]/15",

            "blur-3xl",
          ].join(" ")}
        />

        {/* ==============================================================
            CONTENU
            ============================================================== */}

        <div
          className={[
            "afr-page-container",
            "relative",
            "z-10",

            "flex",
            "min-h-[590px]",
            "items-center",

            "py-16",

            "xl:min-h-[640px]",
            "xl:py-20",
          ].join(" ")}
        >
          <div
            className={[
              "w-[58%]",
              "max-w-[700px]",
            ].join(" ")}
          >
            <HeroText />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * COMPOSANT PRINCIPAL
 * ============================================================================
 */

export default function HomeHero() {
  return (
    <section
      aria-labelledby="home-hero-title"
      className={[
        "relative",
        "isolate",
        "overflow-hidden",

        "bg-[var(--afriskill-navy-dark)]",
      ].join(" ")}
    >
      <MobileHero />

      <DesktopHero />

      {/* ================================================================
          LIGNE DE TRANSITION
          ================================================================ */}

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "inset-x-0",
          "bottom-0",
          "z-20",

          "h-px",

          "bg-gradient-to-r",
          "from-transparent",
          "via-[var(--afriskill-cyan)]/40",
          "to-transparent",
        ].join(" ")}
      />
    </section>
  );
}