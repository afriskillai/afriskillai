import Link from "next/link";

import HomeCourseCard from "@/components/public/home/HomeCourseCard";
import { getHomeCourses } from "@/lib/public-courses";
import { publicRoutes } from "@/lib/public-navigation";

/**
 * ============================================================================
 * AFRISKILL AI — HOME FEATURED COURSES
 * ============================================================================
 *
 * Section principale de découverte des formations sur l'accueil.
 *
 * Objectifs :
 * - afficher les formations réellement publiées ;
 * - valoriser les images et les prix ;
 * - afficher 2 formations par ligne sur mobile ;
 * - conserver une grille progressive et stable ;
 * - diriger facilement vers le catalogue complet ;
 * - gérer proprement l'absence de formations.
 *
 * Grille :
 * - mobile : 2 colonnes ;
 * - tablette : 2 colonnes ;
 * - desktop : 3 colonnes ;
 * - grand desktop : 4 colonnes.
 *
 * Les données sont récupérées par getHomeCourses().
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

function CoursesIcon() {
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
    </svg>
  );
}

/**
 * ============================================================================
 * CTA CATALOGUE
 * ============================================================================
 */

function AllCoursesLink({
  mobile = false,
}: Readonly<{
  mobile?: boolean;
}>) {
  return (
    <Link
      href={publicRoutes.formations}
      className={[
        "group",

        "items-center",
        "justify-center",
        "gap-2",

        "rounded-xl",

        "border",
        "border-[var(--afriskill-navy)]",

        "bg-[var(--afriskill-navy)]",

        "px-5",
        "py-3",

        "text-center",
        "text-sm",
        "font-bold",
        "leading-5",

        "!text-white",

        "shadow-[0_8px_22px_rgba(6,26,64,0.14)]",

        "transition-[background-color,border-color,box-shadow,transform,color]",
        "duration-200",

        "hover:border-[var(--afriskill-blue)]",
        "hover:bg-[var(--afriskill-blue)]",
        "hover:!text-white",
        "hover:shadow-[0_12px_28px_rgba(6,26,64,0.18)]",

        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-[var(--afriskill-cyan)]",
        "focus-visible:ring-offset-2",

        "active:translate-y-px",

        mobile
          ? [
              "flex",
              "min-h-12",
              "w-full",
              "sm:hidden",
            ].join(" ")
          : [
              "hidden",
              "min-h-12",
              "shrink-0",
              "sm:inline-flex",
            ].join(" "),
      ].join(" ")}
    >
      <span className="!text-white">
        Toutes les formations
      </span>

      <span
        aria-hidden="true"
        className={[
          "shrink-0",
          "!text-white",

          "transition-transform",
          "duration-200",

          "group-hover:translate-x-0.5",
        ].join(" ")}
      >
        <ArrowIcon />
      </span>
    </Link>
  );
}

/**
 * ============================================================================
 * ÉTAT VIDE
 * ============================================================================
 */

function EmptyCoursesState() {
  return (
    <div
      className={[
        "mt-8",

        "overflow-hidden",

        "rounded-[22px]",

        "border",
        "border-[var(--border)]",

        "bg-white",

        "px-5",
        "py-10",

        "text-center",

        "shadow-[var(--shadow-card)]",

        "sm:mt-10",
        "sm:px-8",
        "sm:py-12",

        "lg:py-14",
      ].join(" ")}
    >
      <div
        className={[
          "mx-auto",

          "flex",
          "h-14",
          "w-14",
          "items-center",
          "justify-center",

          "rounded-2xl",

          "bg-[var(--afriskill-navy)]",

          "text-[var(--afriskill-gold)]",

          "shadow-[0_10px_28px_rgba(6,26,64,0.14)]",
        ].join(" ")}
      >
        <CoursesIcon />
      </div>

      <h3
        className={[
          "mt-5",

          "text-lg",
          "font-black",
          "leading-tight",
          "tracking-[-0.025em]",

          "text-[var(--text-primary)]",

          "sm:text-xl",
        ].join(" ")}
      >
        Les formations arrivent bientôt
      </h3>

      <p
        className={[
          "mx-auto",
          "mt-2.5",
          "max-w-lg",

          "text-[13px]",
          "leading-6",

          "text-[var(--text-muted)]",

          "sm:text-sm",
          "sm:leading-7",
        ].join(" ")}
      >
        Les formations publiées seront affichées
        automatiquement dans cet espace.
      </p>
    </div>
  );
}

/**
 * ============================================================================
 * COMPOSANT PRINCIPAL
 * ============================================================================
 */

export default async function HomeFeaturedCourses() {
  const courses = await getHomeCourses(8);

  const hasCourses =
    courses.length > 0;

  return (
    <section
      aria-labelledby="home-featured-courses-title"
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
          "-right-40",
          "-top-40",

          "h-96",
          "w-96",

          "rounded-full",

          "bg-[var(--afriskill-cyan)]/[0.045]",

          "blur-3xl",
        ].join(" ")}
      />

      <div
        aria-hidden="true"
        className={[
          "pointer-events-none",
          "absolute",
          "-bottom-48",
          "-left-40",

          "h-96",
          "w-96",

          "rounded-full",

          "bg-[var(--afriskill-blue)]/[0.035]",

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
            "flex",
            "items-end",
            "justify-between",
            "gap-8",
          ].join(" ")}
        >
          <div
            className={[
              "min-w-0",
              "max-w-[760px]",
            ].join(" ")}
          >
            {/* EYEBROW */}

            <div
              className={[
                "flex",
                "items-center",
                "gap-2.5",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className={[
                  "h-1",
                  "w-8",
                  "shrink-0",
                  "rounded-full",
                  "bg-[var(--afriskill-gold)]",
                ].join(" ")}
              />

              <p
                className={[
                  "text-[10px]",
                  "font-bold",
                  "uppercase",
                  "tracking-[0.15em]",

                  "text-[var(--afriskill-blue)]",

                  "sm:text-[11px]",
                  "lg:text-xs",
                ].join(" ")}
              >
                Formations AfriSkill AI
              </p>
            </div>

            {/* TITRE */}

            <h2
              id="home-featured-courses-title"
              className={[
                "mt-3",

                "max-w-[760px]",

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
              Développez des compétences utiles avec{" "}
              <span className="text-[var(--afriskill-blue)]">
                l&apos;IA.
              </span>
            </h2>

            {/* DESCRIPTION */}

            <p
              className={[
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
              Découvrez nos formations pratiques et
              choisissez les compétences adaptées à vos
              projets numériques.
            </p>
          </div>

          {/* CTA DESKTOP / TABLETTE */}

          {hasCourses ? (
            <AllCoursesLink />
          ) : null}
        </div>

        {/* ==============================================================
            FORMATIONS
            ============================================================== */}

        {hasCourses ? (
          <>
            <div
              className={[
                "mt-8",

                "grid",

                /**
                 * Deux cartes dès le mobile.
                 *
                 * HomeCourseCard possède maintenant son adaptation
                 * compacte pour conserver une bonne lisibilité même
                 * sur les petites largeurs.
                 */
                "grid-cols-2",

                "items-stretch",

                /**
                 * Espacement mobile volontairement plus compact afin
                 * de laisser suffisamment de largeur à chaque carte.
                 */
                "gap-3",

                "min-[420px]:gap-4",

                "sm:mt-10",
                "sm:gap-5",

                "md:gap-5",

                /**
                 * Desktop :
                 * 3 colonnes puis 4 sur les grands écrans.
                 */
                "lg:grid-cols-3",
                "lg:gap-6",

                "xl:grid-cols-4",
                "xl:gap-6",
              ].join(" ")}
            >
              {courses.map((course) => (
                <HomeCourseCard
                  key={course.id}
                  course={course}
                />
              ))}
            </div>

            {/* ==========================================================
                CTA MOBILE
                ========================================================== */}

            <div className="mt-8 sm:hidden">
              <AllCoursesLink mobile />
            </div>
          </>
        ) : (
          <EmptyCoursesState />
        )}
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
          "via-[var(--border)]",
          "to-transparent",
        ].join(" ")}
      />
    </section>
  );
}