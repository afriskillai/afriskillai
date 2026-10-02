/**
 * ============================================================================
 * AFRISKILL AI — HOME RESULTS
 * ============================================================================
 *
 * Section présentant les résultats concrets que l'apprentissage peut aider
 * à développer.
 *
 * IMPORTANT :
 * - aucune statistique non vérifiée ;
 * - aucune promesse de revenus ;
 * - aucun montant de gains inventé ;
 * - aucun témoignage fictif ;
 * - uniquement des bénéfices pédagogiques cohérents avec les formations.
 * ============================================================================
 */

type ResultIconName =
  | "skills"
  | "projects"
  | "productivity";

type ResultItem = Readonly<{
  id: string;
  title: string;
  description: string;
  icon: ResultIconName;
}>;

type ResultArea = Readonly<{
  id: string;
  label: string;
}>;

/**
 * ============================================================================
 * RÉSULTATS
 * ============================================================================
 */

const RESULTS = [
  {
    id: "skills",
    title: "Développez des compétences pratiques",
    description:
      "Apprenez à utiliser concrètement les outils d’intelligence artificielle dans vos projets et vos activités numériques.",
    icon: "skills",
  },
  {
    id: "projects",
    title: "Transformez vos idées en projets",
    description:
      "Utilisez vos nouvelles compétences pour structurer, créer et faire avancer des projets numériques plus efficacement.",
    icon: "projects",
  },
  {
    id: "productivity",
    title: "Travaillez plus efficacement",
    description:
      "Découvrez comment l’IA peut vous aider à accélérer certaines tâches, améliorer vos processus et gagner en efficacité.",
    icon: "productivity",
  },
] as const satisfies readonly ResultItem[];

/**
 * ============================================================================
 * DOMAINES D'APPLICATION
 * ============================================================================
 */

const RESULT_AREAS = [
  {
    id: "digital-projects",
    label: "Projets numériques",
  },
  {
    id: "content-creation",
    label: "Création de contenu",
  },
  {
    id: "automation",
    label: "Automatisation",
  },
  {
    id: "ai-tools",
    label: "Outils d’IA",
  },
] as const satisfies readonly ResultArea[];

/**
 * ============================================================================
 * ICÔNES
 * ============================================================================
 */

function SkillsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="27"
      height="27"
      className="h-[27px] w-[27px] shrink-0"
    >
      <path
        d="M12 3 14.3 7.65 19.5 8.4 15.75 12.05 16.65 17.2 12 14.75 7.35 17.2 8.25 12.05 4.5 8.4 9.7 7.65 12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 20h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ProjectsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="27"
      height="27"
      className="h-[27px] w-[27px] shrink-0"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M3 8h18"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M7 13h4M7 16h7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="m16 11 1.25 1.25L20 9.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProductivityIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="27"
      height="27"
      className="h-[27px] w-[27px] shrink-0"
    >
      <path
        d="M12 3a9 9 0 1 0 9 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M17 3h4v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="m21 3-5 5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
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
      width="13"
      height="13"
      className="h-[13px] w-[13px] shrink-0"
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

function ResultIcon({
  icon,
}: Readonly<{
  icon: ResultIconName;
}>) {
  switch (icon) {
    case "skills":
      return <SkillsIcon />;

    case "projects":
      return <ProjectsIcon />;

    case "productivity":
      return <ProductivityIcon />;
  }
}

/**
 * ============================================================================
 * CARTE RÉSULTAT
 * ============================================================================
 */

function ResultCard({
  result,
  index,
}: Readonly<{
  result: ResultItem;
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

        "flex",
        "h-full",
        "min-w-0",
        "flex-col",

        "overflow-hidden",

        "rounded-[20px]",

        "border",
        "border-[var(--border)]",

        "bg-white",

        "p-5",

        "shadow-[var(--shadow-card)]",

        "transition-[border-color,box-shadow,transform]",
        "duration-300",

        "hover:-translate-y-1",
        "hover:border-[var(--afriskill-cyan)]/40",
        "hover:shadow-[var(--shadow-card-hover)]",

        "sm:p-6",

        "lg:min-h-[280px]",
        "lg:p-7",
      ].join(" ")}
    >
      {/* ==============================================================
          ACCENT SUPÉRIEUR
          ============================================================== */}

      <div
        aria-hidden="true"
        className={[
          "absolute",
          "inset-x-0",
          "top-0",

          "h-[3px]",

          "origin-left",
          "scale-x-0",

          "bg-gradient-to-r",
          "from-[var(--afriskill-gold)]",
          "via-[var(--afriskill-cyan)]",
          "to-[var(--afriskill-blue)]",

          "transition-transform",
          "duration-300",

          "group-hover:scale-x-100",
        ].join(" ")}
      />

      {/* ==============================================================
          ICÔNE + NUMÉRO
          ============================================================== */}

      <div
        className={[
          "flex",
          "items-start",
          "justify-between",
          "gap-4",
        ].join(" ")}
      >
        <div
          aria-hidden="true"
          className={[
            "flex",
            "h-13",
            "w-13",
            "shrink-0",
            "items-center",
            "justify-center",

            "rounded-2xl",

            "border",
            "border-[var(--afriskill-gold)]/20",

            "bg-[var(--afriskill-navy)]",

            "text-[var(--afriskill-gold)]",

            "shadow-[0_9px_25px_rgba(6,26,64,0.14)]",

            "transition-[background-color,transform]",
            "duration-300",

            "group-hover:scale-[1.04]",
            "group-hover:bg-[var(--afriskill-blue)]",

            "sm:h-14",
            "sm:w-14",
          ].join(" ")}
        >
          <ResultIcon icon={result.icon} />
        </div>

        <span
          aria-hidden="true"
          className={[
            "text-[11px]",
            "font-bold",
            "tracking-[0.14em]",

            "text-[var(--text-subtle)]",
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
          "mt-5",
          "flex",
          "flex-1",
          "flex-col",
        ].join(" ")}
      >
        <h3
          className={[
            "max-w-[300px]",

            "text-[18px]",
            "font-black",
            "leading-[1.3]",
            "tracking-[-0.025em]",

            "text-[var(--text-primary)]",

            "sm:text-[19px]",

            "lg:text-[20px]",
          ].join(" ")}
        >
          {result.title}
        </h3>

        <p
          className={[
            "mt-3",

            "max-w-[360px]",

            "text-[13px]",
            "leading-[1.7]",

            "text-[var(--text-muted)]",

            "sm:text-sm",
            "sm:leading-6",
          ].join(" ")}
        >
          {result.description}
        </p>

        {/* ============================================================
            ACCENT INFÉRIEUR
            ============================================================ */}

        <div
          aria-hidden="true"
          className={[
            "mt-auto",
            "flex",
            "items-center",
            "gap-2",

            "pt-5",
          ].join(" ")}
        >
          <span
            className={[
              "h-2",
              "w-2",
              "shrink-0",

              "rounded-full",

              "bg-[var(--afriskill-gold)]",
            ].join(" ")}
          />

          <span
            className={[
              "h-px",
              "w-8",

              "bg-[var(--border-strong)]",

              "transition-[width,background-color]",
              "duration-300",

              "group-hover:w-14",
              "group-hover:bg-[var(--afriskill-cyan)]",
            ].join(" ")}
          />
        </div>
      </div>
    </article>
  );
}

/**
 * ============================================================================
 * DOMAINES D'APPLICATION
 * ============================================================================
 */

function ResultAreas() {
  return (
    <div
      className={[
        "mx-auto",
        "mt-8",
        "max-w-[920px]",

        "rounded-[20px]",

        "border",
        "border-[var(--border)]",

        "bg-white",

        "px-4",
        "py-5",

        "shadow-[var(--shadow-xs)]",

        "sm:mt-10",
        "sm:px-6",
        "sm:py-6",
      ].join(" ")}
    >
      <p
        className={[
          "text-center",

          "text-[10px]",
          "font-bold",
          "uppercase",
          "tracking-[0.15em]",

          "text-[var(--text-muted)]",

          "sm:text-[11px]",
        ].join(" ")}
      >
        Des compétences applicables notamment à
      </p>

      <div
        className={[
          "mt-4",

          "flex",
          "flex-wrap",
          "items-center",
          "justify-center",

          "gap-2",

          "sm:gap-3",
        ].join(" ")}
      >
        {RESULT_AREAS.map((area) => (
          <div
            key={area.id}
            className={[
              "inline-flex",
              "min-h-9",
              "items-center",
              "gap-2",

              "rounded-full",

              "border",
              "border-[var(--afriskill-blue)]/10",

              "bg-[var(--surface-soft)]",

              "px-3",
              "py-2",

              "text-[11px]",
              "font-semibold",
              "leading-4",

              "text-[var(--text-primary)]",

              "sm:px-4",
              "sm:text-xs",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "flex",
                "h-[18px]",
                "w-[18px]",
                "shrink-0",
                "items-center",
                "justify-center",

                "rounded-full",

                "bg-[var(--afriskill-gold)]",

                "text-[var(--afriskill-navy)]",
              ].join(" ")}
            >
              <CheckIcon />
            </span>

            <span>{area.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * COMPOSANT PRINCIPAL
 * ============================================================================
 */

export default function HomeResults() {
  return (
    <section
      aria-labelledby="home-results-title"
      className={[
        "relative",
        "isolate",
        "overflow-hidden",

        "bg-[var(--surface-soft)]",
      ].join(" ")}
    >
      {/* ================================================================
          DÉCORATION
          ================================================================ */}

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "-right-36",
          "top-0",

          "h-80",
          "w-80",

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
          "-bottom-40",
          "-left-32",

          "h-80",
          "w-80",

          "rounded-full",

          "bg-[var(--afriskill-blue)]/[0.045]",

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

          "py-12",

          "sm:py-14",

          "lg:py-16",

          "xl:py-20",
        ].join(" ")}
      >
        {/* ==============================================================
            EN-TÊTE
            ============================================================== */}

        <div
          className={[
            "mx-auto",
            "max-w-[780px]",
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
              "text-[10px]",
              "font-bold",
              "uppercase",
              "tracking-[0.17em]",

              "text-[var(--afriskill-blue)]",

              "sm:text-[11px]",

              "lg:text-xs",
            ].join(" ")}
          >
            Passez de l&apos;apprentissage à la pratique
          </p>

          <h2
            id="home-results-title"
            className={[
              "mt-3",

              "text-[26px]",
              "font-black",
              "leading-[1.12]",
              "tracking-[-0.035em]",

              "text-[var(--text-primary)]",

              "sm:text-[32px]",

              "lg:text-[38px]",
              "lg:leading-[1.08]",

              "xl:text-[40px]",
            ].join(" ")}
          >
            Des compétences pour{" "}

            <span className="text-[var(--afriskill-blue)]">
              faire avancer vos projets.
            </span>
          </h2>

          <p
            className={[
              "mx-auto",
              "mt-3.5",
              "max-w-[680px]",

              "text-[13px]",
              "leading-6",

              "text-[var(--text-muted)]",

              "sm:mt-4",
              "sm:text-sm",
              "sm:leading-7",

              "lg:text-[15px]",
            ].join(" ")}
          >
            L&apos;objectif est de vous aider à transformer
            ce que vous apprenez en compétences concrètes,
            utilisables dans vos projets numériques et vos
            activités.
          </p>
        </div>

        {/* ==============================================================
            CARTES
            ============================================================== */}

        <div
          className={[
            "mt-8",

            "grid",
            "grid-cols-1",
            "items-stretch",

            "gap-4",

            "sm:mt-10",

            "md:grid-cols-3",
            "md:gap-5",

            "xl:gap-6",
          ].join(" ")}
        >
          {RESULTS.map((result, index) => (
            <ResultCard
              key={result.id}
              result={result}
              index={index}
            />
          ))}
        </div>

        {/* ==============================================================
            DOMAINES
            ============================================================== */}

        <ResultAreas />
      </div>

      {/* ================================================================
          TRANSITION VERS CTA FINAL
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
          "via-[var(--border)]",
          "to-transparent",
        ].join(" ")}
      />
    </section>
  );
}