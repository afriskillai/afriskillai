import { HOME_CONTENT } from "@/lib/home-content";

/**
 * ============================================================================
 * AFRISKILL AI — HOME TRUST BAR
 * ============================================================================
 *
 * Section de réassurance placée après le Hero.
 *
 * Objectifs :
 * - expliquer rapidement l'approche AfriSkill AI ;
 * - présenter trois bénéfices simples ;
 * - créer une transition propre entre le Hero et les formations ;
 * - conserver une excellente lisibilité mobile ;
 * - rester sobre et professionnel sur desktop.
 *
 * Les contenus viennent exclusivement de HOME_CONTENT.trust.
 * ============================================================================
 */

type TrustIconProps = Readonly<{
  id: string;
}>;

/**
 * ============================================================================
 * ICÔNES
 * ============================================================================
 */

function StudentsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="26"
      height="26"
      className="h-[26px] w-[26px] shrink-0"
    >
      <path
        d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M3.5 20v-1.5A4.5 4.5 0 0 1 8 14h2a4.5 4.5 0 0 1 4.5 4.5V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M15.5 5.25a3.5 3.5 0 0 1 0 6.5M17 14.5a4.5 4.5 0 0 1 3.5 4.35V20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PracticeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="26"
      height="26"
      className="h-[26px] w-[26px] shrink-0"
    >
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M9 7.5h6M9 11h5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ResultsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="26"
      height="26"
      className="h-[26px] w-[26px] shrink-0"
    >
      <path
        d="M4 20V11M10 20V7M16 20v-6M22 20H2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="m4 9 5-4 5 4 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16.5 3H20v3.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DefaultIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="26"
      height="26"
      className="h-[26px] w-[26px] shrink-0"
    >
      <path
        d="m12 3 2.1 4.25 4.7.68-3.4 3.32.8 4.68L12 13.72l-4.2 2.21.8-4.68-3.4-3.32 4.7-.68L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustIcon({
  id,
}: TrustIconProps) {
  switch (id) {
    case "students":
      return <StudentsIcon />;

    case "practice":
      return <PracticeIcon />;

    case "results":
      return <ResultsIcon />;

    default:
      return <DefaultIcon />;
  }
}

/**
 * ============================================================================
 * TRUST ITEM
 * ============================================================================
 */

function TrustItem({
  id,
  title,
  description,
  index,
}: Readonly<{
  id: string;
  title: string;
  description: string;
  index: number;
}>) {
  const number = String(index + 1).padStart(
    2,
    "0",
  );

  return (
    <article
      className={[
        "group",
        "relative",
        "min-w-0",
      ].join(" ")}
    >
      <div
        className={[
          "relative",
          "flex",
          "h-full",
          "min-w-0",
          "items-start",

          "gap-4",

          "rounded-2xl",

          "border",
          "border-white/10",

          "bg-white/[0.045]",

          "p-4",

          "shadow-[0_12px_35px_rgba(0,0,0,0.10)]",

          "transition-[background-color,border-color,transform,box-shadow]",
          "duration-300",

          "hover:-translate-y-0.5",
          "hover:border-[var(--afriskill-cyan)]/25",
          "hover:bg-white/[0.065]",
          "hover:shadow-[0_18px_45px_rgba(0,0,0,0.14)]",

          "sm:p-5",

          "lg:min-h-[178px]",
          "lg:flex-col",
          "lg:gap-5",
          "lg:p-6",
        ].join(" ")}
      >
        {/* ==============================================================
            HAUT / ICÔNE
            ============================================================== */}

        <div
          className={[
            "flex",
            "shrink-0",
            "items-center",
            "gap-3",

            "lg:w-full",
            "lg:justify-between",
          ].join(" ")}
        >
          <div
            aria-hidden="true"
            className={[
              "flex",
              "h-12",
              "w-12",
              "shrink-0",
              "items-center",
              "justify-center",

              "rounded-[14px]",

              "border",
              "border-[var(--afriskill-gold)]/25",

              "bg-[var(--afriskill-gold)]/10",

              "text-[var(--afriskill-gold-light)]",

              "shadow-[0_8px_24px_rgba(245,180,0,0.06)]",

              "transition-transform",
              "duration-300",

              "group-hover:scale-[1.03]",

              "sm:h-13",
              "sm:w-13",
            ].join(" ")}
          >
            <TrustIcon id={id} />
          </div>

          <span
            aria-hidden="true"
            className={[
              "hidden",

              "text-[11px]",
              "font-bold",
              "tracking-[0.12em]",
              "text-white/25",

              "lg:block",
            ].join(" ")}
          >
            {number}
          </span>
        </div>

        {/* ==============================================================
            TEXTE
            ============================================================== */}

        <div
          className={[
            "min-w-0",
            "flex-1",
          ].join(" ")}
        >
          <h3
            className={[
              "text-[15px]",
              "font-bold",
              "leading-[1.35]",
              "tracking-[-0.015em]",
              "text-white",

              "sm:text-base",

              "lg:text-[17px]",
            ].join(" ")}
          >
            {title}
          </h3>

          <p
            className={[
              "mt-1.5",

              "text-xs",
              "leading-5",
              "text-slate-300",

              "sm:mt-2",
              "sm:text-[13px]",
              "sm:leading-[1.65]",
            ].join(" ")}
          >
            {description}
          </p>
        </div>

        {/* ==============================================================
            ACCENT INFÉRIEUR
            ============================================================== */}

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none",
            "absolute",
            "bottom-0",
            "left-5",

            "h-px",
            "w-10",

            "bg-[var(--afriskill-gold)]/60",

            "transition-[width,background-color]",
            "duration-300",

            "group-hover:w-16",
            "group-hover:bg-[var(--afriskill-gold)]",

            "lg:left-6",
          ].join(" ")}
        />
      </div>
    </article>
  );
}

/**
 * ============================================================================
 * COMPOSANT PRINCIPAL
 * ============================================================================
 */

export default function HomeTrustBar() {
  const trustItems = HOME_CONTENT.trust;

  return (
    <section
      aria-labelledby="home-trust-title"
      className={[
        "relative",
        "isolate",
        "overflow-hidden",

        "bg-[var(--afriskill-navy)]",

        "text-white",
      ].join(" ")}
    >
      {/* ================================================================
          DÉCORATION DE FOND
          ================================================================ */}

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "left-1/2",
          "top-[-100px]",

          "h-[260px]",
          "w-[85%]",
          "max-w-[900px]",

          "-translate-x-1/2",

          "rounded-full",

          "bg-[var(--afriskill-cyan)]/[0.055]",

          "blur-3xl",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "-bottom-36",
          "-left-32",

          "h-72",
          "w-72",

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
          "-right-32",
          "bottom-0",

          "h-64",
          "w-64",

          "rounded-full",

          "bg-[var(--afriskill-cyan)]/[0.035]",

          "blur-3xl",
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

          "py-10",

          "sm:py-12",

          "lg:py-14",
        ].join(" ")}
      >
        {/* ==============================================================
            INTRODUCTION
            ============================================================== */}

        <div
          className={[
            "mx-auto",
            "max-w-2xl",
            "text-center",
          ].join(" ")}
        >
          <div
            className={[
              "mx-auto",
              "mb-4",

              "h-1",
              "w-10",

              "rounded-full",

              "bg-[var(--afriskill-gold)]",
            ].join(" ")}
          />

          <p
            className={[
              "text-[11px]",
              "font-bold",
              "uppercase",
              "tracking-[0.16em]",

              "text-[var(--afriskill-cyan-light)]",

              "sm:text-xs",
            ].join(" ")}
          >
            Notre approche
          </p>

          <h2
            id="home-trust-title"
            className={[
              "mt-2",

              "text-[24px]",
              "font-black",
              "leading-[1.15]",
              "tracking-[-0.035em]",
              "text-white",

              "sm:text-[30px]",

              "lg:text-[34px]",
            ].join(" ")}
          >
            Pourquoi apprendre avec{" "}
            <span className="text-[var(--afriskill-gold)]">
              AfriSkill AI ?
            </span>
          </h2>

          <p
            className={[
              "mx-auto",
              "mt-3",
              "max-w-xl",

              "text-[13px]",
              "leading-6",
              "text-slate-300",

              "sm:mt-4",
              "sm:text-sm",
              "sm:leading-7",
            ].join(" ")}
          >
            Une approche pensée pour vous aider à
            apprendre progressivement, pratiquer et
            développer des compétences directement
            utiles à vos projets.
          </p>
        </div>

        {/* ==============================================================
            CARTES
            ============================================================== */}

        <div
          className={[
            "mt-7",
            "grid",
            "grid-cols-1",
            "gap-3",

            "sm:mt-9",
            "sm:gap-4",

            "md:grid-cols-3",

            "lg:mt-10",
            "lg:gap-5",
          ].join(" ")}
        >
          {trustItems.map(
            (item, index) => (
              <TrustItem
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                index={index}
              />
            ),
          )}
        </div>
      </div>

      {/* ================================================================
          TRANSITION VERS LA SECTION SUIVANTE
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
          "via-[var(--afriskill-cyan)]/25",
          "to-transparent",
        ].join(" ")}
      />
    </section>
  );
}