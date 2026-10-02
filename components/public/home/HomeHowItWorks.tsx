/**
 * ============================================================================
 * AFRISKILL AI — HOME HOW IT WORKS
 * ============================================================================
 *
 * Section expliquant le parcours d'achat d'une formation.
 *
 * Parcours :
 * 01 — Choisir une formation
 * 02 — Finaliser l'achat
 * 03 — Accéder au contenu
 *
 * IMPORTANT :
 * - l'id "comment-ca-marche" est utilisé par la navigation publique ;
 * - cette section ne dépend d'aucune donnée admin ;
 * - aucune logique de paiement n'est exécutée ici ;
 * - la section décrit uniquement le parcours utilisateur.
 * ============================================================================
 */

type StepIconName =
  | "course"
  | "payment"
  | "access";

type Step = Readonly<{
  number: string;
  title: string;
  description: string;
  icon: StepIconName;
}>;

/**
 * ============================================================================
 * ÉTAPES
 * ============================================================================
 */

const STEPS = [
  {
    number: "01",
    title: "Choisissez votre formation",
    description:
      "Parcourez les formations AfriSkill AI et choisissez celle qui correspond à vos objectifs et à vos projets.",
    icon: "course",
  },
  {
    number: "02",
    title: "Achetez votre formation",
    description:
      "Finalisez votre commande grâce à notre parcours de paiement en ligne simple et sécurisé.",
    icon: "payment",
  },
  {
    number: "03",
    title: "Accédez à votre contenu",
    description:
      "Après confirmation du paiement, accédez aux contenus et ressources prévus pour votre formation.",
    icon: "access",
  },
] as const satisfies readonly Step[];

/**
 * ============================================================================
 * ICÔNES
 * ============================================================================
 */

function CourseIcon() {
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

      <path
        d="m15.5 14.25 1.25 1.25 2.5-3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaymentIcon() {
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
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M3 9h18"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M7 15h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="m16 13.5 1.25 1.25L19.5 12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AccessIcon() {
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
        height="13"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M9 21h6M12 17v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="m10.5 8 4 2.5-4 2.5V8Z"
        stroke="currentColor"
        strokeWidth="1.7"
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
      width="18"
      height="18"
      className="h-[18px] w-[18px] shrink-0"
    >
      <path
        d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6l-7-3Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />

      <path
        d="m9 12 2 2 4-4"
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
      width="14"
      height="14"
      className="h-3.5 w-3.5 shrink-0"
    >
      <path
        d="m8 5 7 7-7 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepIcon({
  icon,
}: Readonly<{
  icon: StepIconName;
}>) {
  switch (icon) {
    case "course":
      return <CourseIcon />;

    case "payment":
      return <PaymentIcon />;

    case "access":
      return <AccessIcon />;
  }
}

/**
 * ============================================================================
 * CARTE D'ÉTAPE
 * ============================================================================
 */

function StepCard({
  step,
}: Readonly<{
  step: Step;
}>) {
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
        "border-white/10",

        "bg-white/[0.055]",

        "p-5",

        "shadow-[0_16px_42px_rgba(0,0,0,0.12)]",

        "backdrop-blur-sm",

        "transition-[background-color,border-color,box-shadow,transform]",
        "duration-300",

        "hover:-translate-y-1",
        "hover:border-[var(--afriskill-cyan)]/30",
        "hover:bg-white/[0.075]",
        "hover:shadow-[0_20px_50px_rgba(0,0,0,0.16)]",

        "sm:p-6",

        "lg:min-h-[280px]",
        "lg:p-7",
      ].join(" ")}
    >
      {/* ==============================================================
          GRAND NUMÉRO DÉCORATIF
          ============================================================== */}

      <span
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "-right-1",
          "-top-2",

          "select-none",

          "text-[72px]",
          "font-black",
          "leading-none",
          "tracking-[-0.08em]",

          "text-white/[0.035]",

          "sm:text-[82px]",

          "lg:text-[92px]",
        ].join(" ")}
      >
        {step.number}
      </span>

      {/* ==============================================================
          EN-TÊTE DE LA CARTE
          ============================================================== */}

      <div
        className={[
          "relative",
          "z-10",

          "flex",
          "items-center",
          "justify-between",
          "gap-4",
        ].join(" ")}
      >
        <div
          aria-hidden="true"
          className={[
            "flex",
            "h-14",
            "w-14",
            "shrink-0",
            "items-center",
            "justify-center",

            "rounded-2xl",

            "border",
            "border-[var(--afriskill-gold)]/30",

            "bg-[var(--afriskill-gold)]/10",

            "text-[var(--afriskill-gold)]",

            "shadow-[0_10px_30px_rgba(245,180,0,0.08)]",

            "transition-[background-color,border-color,transform]",
            "duration-300",

            "group-hover:scale-[1.04]",
            "group-hover:border-[var(--afriskill-gold)]/50",
            "group-hover:bg-[var(--afriskill-gold)]/15",

            "sm:h-16",
            "sm:w-16",
            "sm:rounded-[18px]",
          ].join(" ")}
        >
          <StepIcon icon={step.icon} />
        </div>

        <span
          className={[
            "inline-flex",
            "min-h-7",
            "items-center",

            "rounded-full",

            "border",
            "border-[var(--afriskill-cyan)]/20",

            "bg-[var(--afriskill-cyan)]/[0.07]",

            "px-2.5",

            "text-[10px]",
            "font-bold",
            "uppercase",
            "tracking-[0.14em]",

            "text-[var(--afriskill-cyan-light)]",

            "sm:text-[11px]",
          ].join(" ")}
        >
          Étape {step.number}
        </span>
      </div>

      {/* ==============================================================
          CONTENU
          ============================================================== */}

      <div
        className={[
          "relative",
          "z-10",

          "mt-5",

          "flex",
          "flex-1",
          "flex-col",
        ].join(" ")}
      >
        <h3
          className={[
            "text-[18px]",
            "font-black",
            "leading-[1.25]",
            "tracking-[-0.025em]",

            "text-white",

            "sm:text-[19px]",

            "lg:text-[20px]",
          ].join(" ")}
        >
          {step.title}
        </h3>

        <p
          className={[
            "mt-2.5",

            "max-w-[360px]",

            "text-[13px]",
            "leading-[1.7]",

            "text-slate-300",

            "sm:text-sm",
            "sm:leading-6",
          ].join(" ")}
        >
          {step.description}
        </p>

        {/* ============================================================
            ACCENT BAS
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

              "rounded-full",

              "bg-[var(--afriskill-gold)]",
            ].join(" ")}
          />

          <span
            className={[
              "h-px",
              "w-8",

              "bg-white/20",

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
 * CONNECTEUR DESKTOP
 * ============================================================================
 */

function DesktopConnector() {
  return (
    <div
      aria-hidden="true"
      className={[
        "relative",
        "hidden",

        "h-full",
        "min-h-[100px]",

        "items-center",
        "justify-center",

        "lg:flex",
      ].join(" ")}
    >
      <div
        className={[
          "absolute",
          "left-0",
          "right-0",
          "top-1/2",

          "h-px",

          "-translate-y-1/2",

          "bg-gradient-to-r",
          "from-[var(--afriskill-gold)]/25",
          "via-[var(--afriskill-cyan)]/65",
          "to-[var(--afriskill-gold)]/25",
        ].join(" ")}
      />

      <div
        className={[
          "relative",
          "z-10",

          "flex",
          "h-7",
          "w-7",
          "items-center",
          "justify-center",

          "rounded-full",

          "border",
          "border-[var(--afriskill-cyan)]/30",

          "bg-[var(--afriskill-navy-dark)]",

          "text-[var(--afriskill-cyan-light)]",

          "shadow-[0_6px_18px_rgba(0,0,0,0.16)]",
        ].join(" ")}
      >
        <ArrowIcon />
      </div>
    </div>
  );
}

/**
 * ============================================================================
 * CONNECTEUR MOBILE
 * ============================================================================
 */

function MobileConnector() {
  return (
    <div
      aria-hidden="true"
      className={[
        "relative",

        "flex",
        "h-9",
        "items-center",
        "justify-center",

        "lg:hidden",
      ].join(" ")}
    >
      <span
        className={[
          "absolute",
          "bottom-0",
          "top-0",

          "w-px",

          "bg-gradient-to-b",
          "from-[var(--afriskill-gold)]/35",
          "via-[var(--afriskill-cyan)]/55",
          "to-[var(--afriskill-gold)]/20",
        ].join(" ")}
      />

      <span
        className={[
          "relative",
          "z-10",

          "h-2",
          "w-2",

          "rounded-full",

          "border",
          "border-[var(--afriskill-cyan)]/40",

          "bg-[var(--afriskill-navy-dark)]",
        ].join(" ")}
      />
    </div>
  );
}

/**
 * ============================================================================
 * COMPOSANT PRINCIPAL
 * ============================================================================
 */

export default function HomeHowItWorks() {
  return (
    <section
      id="comment-ca-marche"
      aria-labelledby="home-how-it-works-title"
      className={[
        "relative",
        "isolate",

        "scroll-mt-[calc(var(--mobile-header-height)+16px)]",

        "overflow-hidden",

        "bg-[var(--afriskill-navy-dark)]",

        "text-white",

        "lg:scroll-mt-[calc(var(--desktop-header-height)+20px)]",
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
          "-top-48",

          "h-[440px]",
          "w-[90%]",
          "max-w-[900px]",

          "-translate-x-1/2",

          "rounded-full",

          "bg-[var(--afriskill-blue)]/20",

          "blur-3xl",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "-bottom-36",
          "-right-28",

          "h-80",
          "w-80",

          "rounded-full",

          "bg-[var(--afriskill-cyan)]/[0.065]",

          "blur-3xl",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "-left-36",
          "top-1/2",

          "h-72",
          "w-72",

          "-translate-y-1/2",

          "rounded-full",

          "bg-[var(--afriskill-gold)]/[0.035]",

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
              "tracking-[0.18em]",

              "text-[var(--afriskill-cyan-light)]",

              "sm:text-[11px]",

              "lg:text-xs",
            ].join(" ")}
          >
            Comment ça marche ?
          </p>

          <h2
            id="home-how-it-works-title"
            className={[
              "mt-3",

              "text-[26px]",
              "font-black",
              "leading-[1.12]",
              "tracking-[-0.035em]",

              "text-white",

              "sm:text-[32px]",

              "lg:text-[38px]",
              "lg:leading-[1.08]",

              "xl:text-[40px]",
            ].join(" ")}
          >
            Commencez votre formation en{" "}

            <span className="text-[var(--afriskill-gold)]">
              trois étapes.
            </span>
          </h2>

          <p
            className={[
              "mx-auto",
              "mt-3.5",
              "max-w-[650px]",

              "text-[13px]",
              "leading-6",

              "text-slate-300",

              "sm:mt-4",
              "sm:text-sm",
              "sm:leading-7",

              "lg:text-[15px]",
            ].join(" ")}
          >
            Un parcours simple pour choisir votre formation,
            finaliser votre achat et accéder au contenu prévu
            pour votre apprentissage.
          </p>
        </div>

        {/* ==============================================================
            MOBILE / TABLETTE
            ============================================================== */}

        <div
          className={[
            "mx-auto",
            "mt-9",
            "max-w-[680px]",

            "lg:hidden",
          ].join(" ")}
        >
          {STEPS.map((step, index) => (
            <div key={step.number}>
              <StepCard step={step} />

              {index < STEPS.length - 1 ? (
                <MobileConnector />
              ) : null}
            </div>
          ))}
        </div>

        {/* ==============================================================
            DESKTOP
            ============================================================== */}

        <div
          className={[
            "mt-12",
            "hidden",

            "grid-cols-[minmax(0,1fr)_64px_minmax(0,1fr)_64px_minmax(0,1fr)]",

            "items-stretch",

            "lg:grid",

            "xl:grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)_88px_minmax(0,1fr)]",
          ].join(" ")}
        >
          <StepCard step={STEPS[0]} />

          <DesktopConnector />

          <StepCard step={STEPS[1]} />

          <DesktopConnector />

          <StepCard step={STEPS[2]} />
        </div>

        {/* ==============================================================
            RÉASSURANCE
            ============================================================== */}

        <div
          className={[
            "mx-auto",
            "mt-8",
            "max-w-[760px]",

            "rounded-2xl",

            "border",
            "border-white/[0.08]",

            "bg-white/[0.035]",

            "px-4",
            "py-3.5",

            "sm:mt-10",
            "sm:px-5",
            "sm:py-4",
          ].join(" ")}
        >
          <div
            className={[
              "flex",
              "items-start",
              "justify-center",
              "gap-2.5",

              "text-left",

              "sm:items-center",
              "sm:text-center",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "mt-0.5",

                "flex",
                "h-7",
                "w-7",
                "shrink-0",
                "items-center",
                "justify-center",

                "rounded-full",

                "bg-[var(--afriskill-cyan)]/[0.08]",

                "text-[var(--afriskill-cyan-light)]",

                "sm:mt-0",
              ].join(" ")}
            >
              <ShieldIcon />
            </span>

            <p
              className={[
                "text-[11px]",
                "leading-5",

                "text-slate-300",

                "sm:text-xs",
                "sm:leading-6",
              ].join(" ")}
            >
              Votre accès est activé après confirmation du
              paiement conformément au parcours d&apos;achat
              AfriSkill AI.
            </p>
          </div>
        </div>
      </div>

      {/* ================================================================
          SÉPARATION VERS LA SECTION RÉSULTATS
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