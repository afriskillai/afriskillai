/**
 * ============================================================================
 * AFRISKILL AI — HOME SKILLS
 * ============================================================================
 *
 * Section présentant les grandes familles de compétences développées
 * dans les formations AfriSkill AI.
 *
 * Objectifs :
 * - expliquer clairement ce que l'utilisateur peut apprendre ;
 * - conserver une lecture rapide sur mobile ;
 * - proposer une grille équilibrée sur tablette et desktop ;
 * - utiliser une hiérarchie visuelle cohérente avec le reste de l'accueil ;
 * - ne dépendre d'aucune donnée dynamique ;
 * - ne modifier aucune logique admin.
 * ============================================================================
 */

type SkillIconName =
  | "ai"
  | "content"
  | "code"
  | "automation";

type Skill = Readonly<{
  id: string;
  title: string;
  description: string;
  icon: SkillIconName;
}>;

/**
 * ============================================================================
 * DONNÉES
 * ============================================================================
 */

const SKILLS = [
  {
    id: "ai-chatgpt",
    title: "IA & ChatGPT",
    description:
      "Apprenez à utiliser l’intelligence artificielle et ChatGPT efficacement dans vos projets.",
    icon: "ai",
  },
  {
    id: "creation-contenu",
    title: "Création de contenu",
    description:
      "Créez plus efficacement des textes, visuels, vidéos et contenus numériques avec l’IA.",
    icon: "content",
  },
  {
    id: "sites-applications",
    title: "Sites web et applications",
    description:
      "Utilisez l’IA pour accélérer la création de sites web, d’applications et de projets numériques.",
    icon: "code",
  },
  {
    id: "automatisation",
    title: "Automatisation",
    description:
      "Automatisez certaines tâches et construisez des processus plus rapides avec les outils d’IA.",
    icon: "automation",
  },
] as const satisfies readonly Skill[];

/**
 * ============================================================================
 * ICÔNES
 * ============================================================================
 */

function AiIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="26"
      height="26"
      className="h-[26px] w-[26px] shrink-0"
    >
      <rect
        x="5"
        y="5"
        width="14"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M9 9h6v6H9V9Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="M9 2.75V5M15 2.75V5M9 19v2.25M15 19v2.25M2.75 9H5M2.75 15H5M19 9h2.25M19 15h2.25"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ContentIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="26"
      height="26"
      className="h-[26px] w-[26px] shrink-0"
    >
      <rect
        x="3.5"
        y="4"
        width="17"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <circle
        cx="9"
        cy="9"
        r="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="m5.5 17 4.25-4 2.8 2.4 2.5-2.25L18.5 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16.75 6.75v3.5M15 8.5h3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="26"
      height="26"
      className="h-[26px] w-[26px] shrink-0"
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

      <circle
        cx="6"
        cy="6"
        r=".75"
        fill="currentColor"
      />

      <circle
        cx="8.5"
        cy="6"
        r=".75"
        fill="currentColor"
      />

      <path
        d="m9.5 11-2.5 2 2.5 2M14.5 11l2.5 2-2.5 2M13 10.5 11 15.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AutomationIcon() {
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
        d="M19.25 8.5A8 8 0 0 0 5.5 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M5.5 3v3h3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M4.75 15.5A8 8 0 0 0 18.5 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M18.5 21v-3h-3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="m13.25 8-4 5h3l-1 4 4-5h-3l1-4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SkillIcon({
  icon,
}: Readonly<{
  icon: SkillIconName;
}>) {
  switch (icon) {
    case "ai":
      return <AiIcon />;

    case "content":
      return <ContentIcon />;

    case "code":
      return <CodeIcon />;

    case "automation":
      return <AutomationIcon />;
  }
}

/**
 * ============================================================================
 * CARTE
 * ============================================================================
 */

function SkillCard({
  skill,
  index,
}: Readonly<{
  skill: Skill;
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

        "rounded-2xl",

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

        "lg:min-h-[245px]",
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
            "h-12",
            "w-12",
            "shrink-0",
            "items-center",
            "justify-center",

            "rounded-[14px]",

            "border",
            "border-[var(--afriskill-gold)]/20",

            "bg-[var(--afriskill-navy)]",

            "text-[var(--afriskill-gold)]",

            "shadow-[0_8px_22px_rgba(6,26,64,0.14)]",

            "transition-[background-color,transform]",
            "duration-300",

            "group-hover:scale-[1.04]",
            "group-hover:bg-[var(--afriskill-blue)]",

            "sm:h-14",
            "sm:w-14",
            "sm:rounded-2xl",
          ].join(" ")}
        >
          <SkillIcon icon={skill.icon} />
        </div>

        <span
          aria-hidden="true"
          className={[
            "text-[11px]",
            "font-bold",
            "tracking-[0.12em]",

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
            "text-[17px]",
            "font-bold",
            "leading-[1.3]",
            "tracking-[-0.025em]",

            "text-[var(--text-primary)]",

            "sm:text-[18px]",
          ].join(" ")}
        >
          {skill.title}
        </h3>

        <p
          className={[
            "mt-2.5",

            "text-[13px]",
            "leading-[1.65]",

            "text-[var(--text-muted)]",

            "sm:text-sm",
            "sm:leading-6",
          ].join(" ")}
        >
          {skill.description}
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

              "group-hover:w-12",
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
 * COMPOSANT PRINCIPAL
 * ============================================================================
 */

export default function HomeSkills() {
  return (
    <section
      aria-labelledby="home-skills-title"
      className={[
        "relative",
        "isolate",
        "overflow-hidden",

        "bg-white",
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
          "-right-32",
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

          "bg-[var(--afriskill-blue)]/[0.04]",

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
            "max-w-[760px]",
            "text-center",
          ].join(" ")}
        >
          {/* ACCENT */}

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

          {/* EYEBROW */}

          <p
            className={[
              "text-[10px]",
              "font-bold",
              "uppercase",
              "tracking-[0.16em]",

              "text-[var(--afriskill-blue)]",

              "sm:text-[11px]",

              "lg:text-xs",
            ].join(" ")}
          >
            Des compétences pour passer à l&apos;action
          </p>

          {/* TITRE */}

          <h2
            id="home-skills-title"
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
            Apprenez des compétences{" "}

            <span className="text-[var(--afriskill-blue)]">
              directement applicables.
            </span>
          </h2>

          {/* DESCRIPTION */}

          <p
            className={[
              "mx-auto",
              "mt-3.5",
              "max-w-[650px]",

              "text-[13px]",
              "leading-6",

              "text-[var(--text-muted)]",

              "sm:mt-4",
              "sm:text-sm",
              "sm:leading-7",

              "lg:text-[15px]",
            ].join(" ")}
          >
            Nos formations sont conçues pour vous aider à
            utiliser concrètement l&apos;intelligence
            artificielle dans vos projets et vos activités.
          </p>
        </div>

        {/* ==============================================================
            GRILLE DES COMPÉTENCES

            < 560 px    : 1 colonne
            >= 560 px   : 2 colonnes
            >= 1024 px  : 4 colonnes
            ============================================================== */}

        <div
          className={[
            "mt-8",

            "grid",
            "grid-cols-1",
            "items-stretch",

            "gap-4",

            "min-[560px]:grid-cols-2",

            "sm:mt-10",
            "sm:gap-5",

            "lg:grid-cols-4",
            "lg:gap-5",

            "xl:gap-6",
          ].join(" ")}
        >
          {SKILLS.map(
            (skill, index) => (
              <SkillCard
                key={skill.id}
                skill={skill}
                index={index}
              />
            ),
          )}
        </div>
      </div>

      {/* ================================================================
          TRANSITION VERS COMMENT ÇA MARCHE
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