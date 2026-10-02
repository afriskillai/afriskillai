import Image from "next/image";
import Link from "next/link";

import { publicRoutes } from "@/lib/public-navigation";

/**
 * ============================================================================
 * AFRISKILL AI — PUBLIC FOOTER
 * ============================================================================
 *
 * Pied de page principal de l'espace public.
 *
 * Objectifs :
 * - renforcer l'identité AfriSkill AI ;
 * - conserver une navigation simple ;
 * - rester lisible sur les petits téléphones ;
 * - offrir une composition équilibrée sur desktop ;
 * - respecter la navigation mobile fixe ;
 * - éviter les informations ou statistiques non vérifiées.
 *
 * Le footer utilise le même conteneur que :
 * - PublicHeader ;
 * - les futures sections de l'accueil ;
 * - le catalogue des formations.
 *
 * Cela garantit un alignement horizontal cohérent.
 * ============================================================================
 */

const CURRENT_YEAR = new Date().getFullYear();

const FOOTER_LINKS = {
  navigation: [
    {
      label: "Accueil",
      href: publicRoutes.home,
    },
    {
      label: "Formations",
      href: publicRoutes.formations,
    },
    {
      label: "Panier",
      href: publicRoutes.cart,
    },
    {
      label: "Mon compte",
      href: publicRoutes.account,
    },
  ],

  discover: [
    {
      label: "Comment ça marche",
      href: publicRoutes.howItWorks,
    },
    {
      label: "À propos",
      href: publicRoutes.about,
    },
  ],
} as const;

/**
 * Flèche légère utilisée sur les liens du footer.
 */
function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      width="14"
      height="14"
      className={[
        "h-3.5",
        "w-3.5",
        "shrink-0",
      ].join(" ")}
    >
      <path
        d="M7 4.5 12.5 10 7 15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Élément décoratif représentant l'approche AfriSkill AI.
 */
function ValueItem({
  number,
  label,
}: Readonly<{
  number: string;
  label: string;
}>) {
  return (
    <div
      className={[
        "flex",
        "min-w-0",
        "items-center",
        "gap-3",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "flex",
          "h-8",
          "w-8",
          "shrink-0",
          "items-center",
          "justify-center",

          "rounded-lg",

          "border",
          "border-[var(--afriskill-cyan)]/20",

          "bg-[var(--afriskill-cyan)]/10",

          "text-[11px]",
          "font-black",
          "text-[var(--afriskill-cyan-light)]",
        ].join(" ")}
      >
        {number}
      </span>

      <span
        className={[
          "min-w-0",
          "text-xs",
          "font-semibold",
          "leading-5",
          "text-slate-300",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );
}

export default function PublicFooter() {
  return (
    <footer
      className={[
        "relative",
        "overflow-hidden",
        "bg-[var(--afriskill-navy-dark)]",
        "text-white",
      ].join(" ")}
    >
      {/* ================================================================
          ACCENTS VISUELS
          ================================================================ */}

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "inset-x-0",
          "top-0",
          "h-px",
          "bg-gradient-to-r",
          "from-transparent",
          "via-[var(--afriskill-cyan)]/40",
          "to-transparent",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "-right-32",
          "-top-32",
          "h-80",
          "w-80",
          "rounded-full",
          "bg-[var(--afriskill-blue)]/10",
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
          "bg-[var(--afriskill-cyan)]/[0.04]",
          "blur-3xl",
        ].join(" ")}
      />

      {/* ================================================================
          CONTENU PRINCIPAL
          ================================================================ */}

      <div
        className={[
          "afr-page-container",
          "relative",
          "z-10",

          "pb-8",
          "pt-12",

          "sm:pb-10",
          "sm:pt-14",

          "lg:py-16",
        ].join(" ")}
      >
        <div
          className={[
            "grid",
            "gap-10",

            "border-b",
            "border-white/10",

            "pb-10",

            "sm:grid-cols-2",
            "sm:gap-x-10",
            "sm:gap-y-12",

            "lg:grid-cols-[minmax(0,1.5fr)_minmax(160px,0.65fr)_minmax(220px,0.85fr)]",
            "lg:gap-12",
            "lg:pb-12",

            "xl:gap-16",
          ].join(" ")}
        >
          {/* ============================================================
              IDENTITÉ
              ============================================================ */}

          <div
            className={[
              "min-w-0",
              "sm:col-span-2",
              "lg:col-span-1",
            ].join(" ")}
          >
            <Link
              href={publicRoutes.home}
              aria-label="AfriSkill AI - Accueil"
              className={[
                "inline-flex",
                "max-w-full",
                "rounded-lg",

                "transition-opacity",
                "duration-200",

                "hover:opacity-90",

                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-[var(--afriskill-cyan)]",
                "focus-visible:ring-offset-2",
                "focus-visible:ring-offset-[var(--afriskill-navy-dark)]",
              ].join(" ")}
            >
              <Image
                src="/logo/logo.png"
                alt="AfriSkill AI"
                width={520}
                height={150}
                sizes="(max-width: 639px) 180px, 210px"
                className={[
                  "h-auto",
                  "w-[180px]",
                  "max-w-full",
                  "object-contain",
                  "object-left",
                  "sm:w-[210px]",
                ].join(" ")}
              />
            </Link>

            <p
              className={[
                "mt-5",
                "max-w-xl",
                "text-sm",
                "leading-7",
                "text-slate-300",
              ].join(" ")}
            >
              Des formations pratiques pour apprendre
              à utiliser l&apos;intelligence
              artificielle, développer vos compétences
              numériques et transformer vos idées en
              projets concrets.
            </p>

            {/* ==========================================================
                POSITIONNEMENT
                ========================================================== */}

            <div
              className={[
                "mt-6",
                "grid",
                "max-w-xl",
                "gap-3",

                "min-[420px]:grid-cols-2",
              ].join(" ")}
            >
              <ValueItem
                number="01"
                label="Apprendre à votre rythme"
              />

              <ValueItem
                number="02"
                label="Passer rapidement à la pratique"
              />

              <ValueItem
                number="03"
                label="Développer des compétences utiles"
              />
            </div>

            <p
              className={[
                "mt-6",
                "text-[11px]",
                "font-bold",
                "uppercase",
                "tracking-[0.14em]",
                "text-[var(--afriskill-gold)]",
                "sm:text-xs",
              ].join(" ")}
            >
              Apprendre · Créer · Lancer · Monétiser
            </p>
          </div>

          {/* ============================================================
              NAVIGATION
              ============================================================ */}

          <div className="min-w-0">
            <h2
              className={[
                "text-sm",
                "font-bold",
                "text-white",
              ].join(" ")}
            >
              Navigation
            </h2>

            <nav
              aria-label="Navigation du pied de page"
              className={[
                "mt-5",
                "flex",
                "flex-col",
                "items-start",
                "gap-1",
              ].join(" ")}
            >
              {FOOTER_LINKS.navigation.map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "group",
                      "inline-flex",
                      "min-h-10",
                      "max-w-full",
                      "items-center",
                      "gap-1.5",

                      "rounded-lg",

                      "px-2",
                      "-ml-2",

                      "text-sm",
                      "font-medium",
                      "text-slate-300",

                      "transition-[background-color,color]",
                      "duration-200",

                      "hover:bg-white/[0.05]",
                      "hover:text-[var(--afriskill-cyan-light)]",

                      "focus-visible:outline-none",
                      "focus-visible:ring-2",
                      "focus-visible:ring-[var(--afriskill-cyan)]",
                    ].join(" ")}
                  >
                    <span className="truncate">
                      {item.label}
                    </span>

                    <span
                      aria-hidden="true"
                      className={[
                        "text-slate-500",
                        "transition-[color,transform]",
                        "duration-200",

                        "group-hover:translate-x-0.5",
                        "group-hover:text-[var(--afriskill-cyan-light)]",
                      ].join(" ")}
                    >
                      <ArrowIcon />
                    </span>
                  </Link>
                ),
              )}
            </nav>
          </div>

          {/* ============================================================
              AFRISKILL AI
              ============================================================ */}

          <div className="min-w-0">
            <h2
              className={[
                "text-sm",
                "font-bold",
                "text-white",
              ].join(" ")}
            >
              AfriSkill AI
            </h2>

            <nav
              aria-label="Informations AfriSkill AI"
              className={[
                "mt-5",
                "flex",
                "flex-col",
                "items-start",
                "gap-1",
              ].join(" ")}
            >
              {FOOTER_LINKS.discover.map(
                (item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "group",
                      "inline-flex",
                      "min-h-10",
                      "max-w-full",
                      "items-center",
                      "gap-1.5",

                      "rounded-lg",

                      "px-2",
                      "-ml-2",

                      "text-sm",
                      "font-medium",
                      "text-slate-300",

                      "transition-[background-color,color]",
                      "duration-200",

                      "hover:bg-white/[0.05]",
                      "hover:text-[var(--afriskill-cyan-light)]",

                      "focus-visible:outline-none",
                      "focus-visible:ring-2",
                      "focus-visible:ring-[var(--afriskill-cyan)]",
                    ].join(" ")}
                  >
                    <span className="truncate">
                      {item.label}
                    </span>

                    <span
                      aria-hidden="true"
                      className={[
                        "text-slate-500",
                        "transition-[color,transform]",
                        "duration-200",

                        "group-hover:translate-x-0.5",
                        "group-hover:text-[var(--afriskill-cyan-light)]",
                      ].join(" ")}
                    >
                      <ArrowIcon />
                    </span>
                  </Link>
                ),
              )}
            </nav>

            {/* ==========================================================
                ENCADRÉ DE POSITIONNEMENT
                ========================================================== */}

            <div
              className={[
                "mt-6",
                "rounded-2xl",
                "border",
                "border-white/10",
                "bg-white/[0.04]",
                "p-4",
              ].join(" ")}
            >
              <p
                className={[
                  "text-xs",
                  "font-bold",
                  "uppercase",
                  "tracking-[0.1em]",
                  "text-[var(--afriskill-gold-light)]",
                ].join(" ")}
              >
                Formation pratique
              </p>

              <p
                className={[
                  "mt-2",
                  "text-xs",
                  "leading-5",
                  "text-slate-400",
                ].join(" ")}
              >
                Apprenez des compétences numériques
                applicables à vos projets et à vos
                activités.
              </p>

              <Link
                href={publicRoutes.formations}
                className={[
                  "mt-4",
                  "inline-flex",
                  "min-h-10",
                  "items-center",
                  "justify-center",
                  "gap-1.5",

                  "rounded-lg",

                  "border",
                  "border-white/10",

                  "bg-white/[0.06]",

                  "px-3",
                  "py-2",

                  "text-xs",
                  "font-bold",
                  "text-white",

                  "transition-[background-color,border-color,color]",
                  "duration-200",

                  "hover:border-[var(--afriskill-cyan)]/30",
                  "hover:bg-[var(--afriskill-cyan)]/10",
                  "hover:text-[var(--afriskill-cyan-light)]",

                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-[var(--afriskill-cyan)]",
                ].join(" ")}
              >
                Voir les formations

                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>

        {/* ================================================================
            BAS DU FOOTER
            ================================================================ */}

        <div
          className={[
            "flex",
            "flex-col",
            "gap-3",

            "pt-6",

            "text-[11px]",
            "font-medium",
            "leading-5",
            "text-slate-500",

            "sm:flex-row",
            "sm:items-center",
            "sm:justify-between",
            "sm:gap-6",

            "lg:pt-7",
          ].join(" ")}
        >
          <p>
            © {CURRENT_YEAR} AfriSkill AI. Tous droits
            réservés.
          </p>

          <p className="sm:text-right">
            Apprendre. Créer. Lancer. Monétiser.
          </p>
        </div>
      </div>
    </footer>
  );
}