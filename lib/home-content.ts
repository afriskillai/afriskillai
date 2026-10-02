/**
 * ============================================================================
 * AFRISKILL AI — CONTENU DE LA PAGE D'ACCUEIL
 * ============================================================================
 *
 * Source centrale des contenus éditoriaux utilisés sur la page d'accueil.
 *
 * Objectifs :
 * - éviter les textes dispersés dans les composants React ;
 * - conserver une communication cohérente sur desktop et mobile ;
 * - faciliter les futures modifications éditoriales ;
 * - garder les composants visuels simples et maintenables.
 *
 * IMPORTANT :
 * - aucune logique serveur ;
 * - aucune logique Prisma ;
 * - aucune logique d'administration ;
 * - aucune donnée dynamique de formation.
 *
 * Les formations réelles restent récupérées depuis `lib/public-courses.ts`.
 * ============================================================================
 */

/**
 * Action disponible depuis une section de l'accueil.
 */
export type HomeAction = Readonly<{
  label: string;
  href: string;
}>;

/**
 * Image éditoriale utilisée sur l'accueil.
 */
export type HomeImage = Readonly<{
  src: string;
  alt: string;
}>;

/**
 * Contenu de la section Hero.
 */
export type HomeHeroContent = Readonly<{
  eyebrow: string;
  title: string;
  highlightedTitle: string;
  description: string;
  image: HomeImage;
  primaryAction: HomeAction;
  secondaryAction: HomeAction;
}>;

/**
 * Identifiants autorisés pour les éléments
 * de confiance affichés sous le Hero.
 *
 * Ils peuvent également être utilisés par l'interface
 * pour sélectionner une icône adaptée.
 */
export type HomeTrustItemId =
  | "students"
  | "practice"
  | "results";

/**
 * Élément de confiance / bénéfice.
 */
export type HomeTrustItem = Readonly<{
  id: HomeTrustItemId;
  title: string;
  description: string;
}>;

/**
 * Structure éditoriale principale de l'accueil.
 */
export type HomeContent = Readonly<{
  hero: HomeHeroContent;
  trust: readonly HomeTrustItem[];
}>;

/**
 * ============================================================================
 * CONTENU PUBLIC
 * ============================================================================
 */

export const HOME_CONTENT = {
  hero: {
    eyebrow:
      "FORMATIONS PRATIQUES EN INTELLIGENCE ARTIFICIELLE",

    title:
      "Maîtrisez l’IA et transformez",

    highlightedTitle:
      "vos idées en compétences concrètes.",

    description:
      "Des formations pratiques pour apprendre à utiliser l’intelligence artificielle, créer plus efficacement et développer vos projets numériques.",

    image: {
      src: "/images/accueil.png",

      alt:
        "Apprentissage pratique de l’intelligence artificielle avec AfriSkill AI",
    },

    primaryAction: {
      label: "Voir les formations",
      href: "/formations",
    },

    secondaryAction: {
      label: "Comment ça marche ?",
      href: "/#comment-ca-marche",
    },
  },

  trust: [
    {
      id: "students",

      title: "Apprenez à votre rythme",

      description:
        "Progressez étape par étape avec des formations accessibles en ligne.",
    },

    {
      id: "practice",

      title: "Passez rapidement à la pratique",

      description:
        "Apprenez à utiliser concrètement les outils d’IA dans vos projets et activités.",
    },

    {
      id: "results",

      title: "Développez des compétences utiles",

      description:
        "Transformez vos apprentissages en compétences applicables à vos projets numériques.",
    },
  ],
} as const satisfies HomeContent;