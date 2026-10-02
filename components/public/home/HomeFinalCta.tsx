import Link from "next/link";

import { publicRoutes } from "@/lib/public-navigation";

/**
 * ============================================================================
 * AFRISKILL AI — HOME FINAL CTA
 * ============================================================================
 *
 * Dernière section d'action de la page d'accueil.
 *
 * Objectifs :
 * - terminer la page avec un message commercial clair ;
 * - orienter naturellement l'utilisateur vers le catalogue ;
 * - rappeler les principaux bénéfices sans inventer de statistiques ;
 * - conserver une excellente lisibilité sur mobile ;
 * - rester cohérent avec le Hero et le reste du design public.
 * ============================================================================
 */

type Benefit = Readonly<{
  id: string;
  label: string;
}>;

const BENEFITS = [
  {
    id: "practical",
    label: "Formations pratiques",
  },
  {
    id: "online",
    label: "Accès en ligne",
  },
  {
    id: "applicable",
    label: "Compétences applicables",
  },
] as const satisfies readonly Benefit[];

/**
 * ============================================================================
 * ICÔNES
 * ============================================================================
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

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="14"
      height="14"
      className="h-3.5 w-3.5 shrink-0"
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

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="18"
      height="18"
      className="h-[18px] w-[18px] shrink-0"
    >
      <path
        d="M12 3.5 13.7 8.3 18.5 10l-4.8 1.7L12 16.5l-1.7-4.8L5.5 10l4.8-1.7L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="m18.5 15 .75 2.25L21.5 18l-2.25.75L18.5 21l-.75-2.25L15.5 18l2.25-.75L18.5 15Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * ============================================================================
 * BÉNÉFICE
 * ============================================================================
 */

function BenefitItem({
  benefit,
}: Readonly<{
  benefit: Benefit;
}>) {
  return (
    <div
      className={[
        "inline-flex",
        "min-h-9",
        "items-center",
        "gap-2",

        "rounded-full",

        "border",
        "border-white/[0.08]",

        "bg-white/[0.045]",

        "px-3",
        "py-2",

        "text-[11px]",
        "font-semibold",
        "leading-4",

        "text-slate-200",

        "sm:px-4",
        "sm:text-xs",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "flex",
          "h-[20px]",
          "w-[20px]",
          "shrink-0",
          "items-center",
          "justify-center",

          "rounded-full",

          "bg-[var(--afriskill-cyan)]/[0.10]",

          "text-[var(--afriskill-cyan-light)]",
        ].join(" ")}
      >
        <CheckIcon />
      </span>

      <span>{benefit.label}</span>
    </div>
  );
}

/**
 * ============================================================================
 * COMPOSANT PRINCIPAL
 * ============================================================================
 */

export default function HomeFinalCta() {
  return (
    <section
      aria-labelledby="home-final-cta-title"
      className={[
        "relative",
        "isolate",
        "overflow-hidden",

        "bg-[var(--afriskill-navy-dark)]",

        "text-white",
      ].join(" ")}
    >
      {/* ================================================================
          DÉCORATIONS DE FOND
          ================================================================ */}

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "left-1/2",
          "-top-56",

          "h-[500px]",
          "w-[90%]",
          "max-w-[900px]",

          "-translate-x-1/2",

          "rounded-full",

          "bg-[var(--afriskill-blue)]/25",

          "blur-3xl",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "-bottom-32",
          "-left-24",

          "h-72",
          "w-72",

          "rounded-full",

          "bg-[var(--afriskill-cyan)]/[0.07]",

          "blur-3xl",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "-right-24",
          "-top-24",

          "h-72",
          "w-72",

          "rounded-full",

          "bg-[var(--afriskill-gold)]/[0.055]",

          "blur-3xl",
        ].join(" ")}
      />

      {/* ================================================================
          LIGNES DÉCORATIVES
          ================================================================ */}

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "bottom-0",
          "left-[8%]",
          "top-0",

          "hidden",
          "w-px",

          "bg-gradient-to-b",
          "from-transparent",
          "via-[var(--afriskill-cyan)]/[0.07]",
          "to-transparent",

          "lg:block",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "bottom-0",
          "right-[8%]",
          "top-0",

          "hidden",
          "w-px",

          "bg-gradient-to-b",
          "from-transparent",
          "via-[var(--afriskill-gold)]/[0.07]",
          "to-transparent",

          "lg:block",
        ].join(" ")}
      />

      {/* ================================================================
          CONTENU
          ================================================================ */}

      <div
        className={[
          "afr-page-container",
          "relative",
          "z-10",

          "py-12",

          "sm:py-16",

          "lg:py-20",

          "xl:py-24",
        ].join(" ")}
      >
        <div
          className={[
            "relative",

            "mx-auto",

            "max-w-[980px]",

            "overflow-hidden",

            "rounded-[24px]",

            "border",
            "border-white/[0.10]",

            "bg-white/[0.045]",

            "px-5",
            "py-9",

            "text-center",

            "shadow-[0_24px_70px_rgba(0,0,0,0.20)]",

            "backdrop-blur-sm",

            "sm:px-8",
            "sm:py-11",

            "lg:rounded-[28px]",
            "lg:px-12",
            "lg:py-14",

            "xl:px-16",
            "xl:py-16",
          ].join(" ")}
        >
          {/* ============================================================
              ACCENT SUPÉRIEUR
              ============================================================ */}

          <div
            aria-hidden="true"
            className={[
              "absolute",
              "inset-x-0",
              "top-0",

              "mx-auto",

              "h-[3px]",
              "w-[170px]",

              "bg-gradient-to-r",
              "from-transparent",
              "via-[var(--afriskill-gold)]",
              "to-transparent",

              "sm:w-[260px]",
            ].join(" ")}
          />

          {/* ============================================================
              LUMIÈRE INTERNE
              ============================================================ */}

          <div
            aria-hidden="true"
            className={[
              "pointer-events-none",
              "absolute",
              "left-1/2",
              "-top-32",

              "h-72",
              "w-72",

              "-translate-x-1/2",

              "rounded-full",

              "bg-[var(--afriskill-cyan)]/[0.075]",

              "blur-3xl",
            ].join(" ")}
          />

          <div
            aria-hidden="true"
            className={[
              "pointer-events-none",
              "absolute",
              "bottom-[-160px]",
              "left-1/2",

              "h-64",
              "w-[70%]",

              "-translate-x-1/2",

              "rounded-full",

              "bg-[var(--afriskill-blue)]/[0.08]",

              "blur-3xl",
            ].join(" ")}
          />

          {/* ============================================================
              TEXTE
              ============================================================ */}

          <div className="relative z-10">
            {/* EYEBROW */}

            <div
              className={[
                "flex",
                "items-center",
                "justify-center",
                "gap-2",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "text-[var(--afriskill-gold)]",
                ].join(" ")}
              >
                <SparkIcon />
              </span>

              <p
                className={[
                  "text-[10px]",
                  "font-bold",
                  "uppercase",
                  "tracking-[0.18em]",

                  "text-[var(--afriskill-cyan-light)]",

                  "sm:text-[11px]",

                  "lg:text-xs",
                ].join(" ")}
              >
                Passez à l&apos;action
              </p>
            </div>

            {/* TITRE */}

            <h2
              id="home-final-cta-title"
              className={[
                "mx-auto",
                "mt-4",

                "max-w-[780px]",

                "text-[28px]",
                "font-black",
                "leading-[1.08]",
                "tracking-[-0.04em]",

                "text-white",

                "sm:text-[36px]",

                "lg:text-[44px]",

                "xl:text-[48px]",
              ].join(" ")}
            >
              Prêt à développer vos compétences{" "}

              <span className="text-[var(--afriskill-gold)]">
                en IA ?
              </span>
            </h2>

            {/* DESCRIPTION */}

            <p
              className={[
                "mx-auto",
                "mt-4",

                "max-w-[660px]",

                "text-[13px]",
                "leading-6",

                "text-slate-300",

                "sm:text-sm",
                "sm:leading-7",

                "lg:text-[15px]",
              ].join(" ")}
            >
              Découvrez les formations AfriSkill AI,
              choisissez les compétences que vous souhaitez
              développer et commencez à les mettre en pratique
              dans vos projets.
            </p>

            {/* ==========================================================
                BÉNÉFICES
                ========================================================== */}

            <div
              className={[
                "mx-auto",
                "mt-6",

                "flex",
                "max-w-[720px]",
                "flex-wrap",
                "items-center",
                "justify-center",

                "gap-2",

                "sm:gap-3",
              ].join(" ")}
            >
              {BENEFITS.map((benefit) => (
                <BenefitItem
                  key={benefit.id}
                  benefit={benefit}
                />
              ))}
            </div>

            {/* ==========================================================
                CTA
                ========================================================== */}

            <div
              className={[
                "mt-7",

                "sm:mt-8",
              ].join(" ")}
            >
              <Link
                href={publicRoutes.formations}
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

                  "px-6",
                  "py-3.5",

                  "text-center",
                  "text-[13px]",
                  "font-black",
                  "leading-5",

                  "text-[var(--afriskill-navy-dark)]",

                  "shadow-[0_12px_32px_rgba(245,180,0,0.20)]",

                  "transition-[background-color,border-color,box-shadow,transform]",
                  "duration-200",

                  "hover:-translate-y-0.5",
                  "hover:border-[var(--afriskill-gold-light)]",
                  "hover:bg-[var(--afriskill-gold-light)]",
                  "hover:shadow-[0_16px_40px_rgba(245,180,0,0.26)]",

                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-[var(--afriskill-gold)]",
                  "focus-visible:ring-offset-2",
                  "focus-visible:ring-offset-[var(--afriskill-navy-dark)]",

                  "active:translate-y-0",

                  "sm:w-auto",
                  "sm:min-w-[250px]",
                  "sm:text-sm",
                ].join(" ")}
              >
                <span>
                  Voir toutes les formations
                </span>

                <span
                  aria-hidden="true"
                  className={[
                    "transition-transform",
                    "duration-200",

                    "group-hover:translate-x-1",
                  ].join(" ")}
                >
                  <ArrowIcon />
                </span>
              </Link>
            </div>

            {/* ==========================================================
                MICRO-TEXTE
                ========================================================== */}

            <p
              className={[
                "mx-auto",
                "mt-4",

                "max-w-[520px]",

                "text-[10px]",
                "leading-5",

                "text-slate-400",

                "sm:text-[11px]",
              ].join(" ")}
            >
              Parcourez le catalogue et choisissez la
              formation adaptée à vos objectifs.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================
          LIGNE DE FIN
          ================================================================ */}

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "inset-x-0",
          "bottom-0",

          "h-px",

          "bg-gradient-to-r",
          "from-transparent",
          "via-[var(--afriskill-cyan)]/30",
          "to-transparent",
        ].join(" ")}
      />
    </section>
  );
}