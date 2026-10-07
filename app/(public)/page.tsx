import type { Metadata } from "next";

import HomeLanding from "@/components/public/home/HomeLanding";

/**
 * ============================================================================
 * AFRISKILL AI — PAGE D'ACCUEIL PUBLIQUE
 * ============================================================================
 *
 * Cette page assemble uniquement les différentes sections publiques
 * de la page d'accueil.
 *
 * Architecture :
 *
 * 01. Hero
 * 02. Réassurance / Pourquoi AfriSkill AI
 * 03. Formations mises en avant
 * 04. Compétences développées
 * 05. Comment ça marche
 * 06. Mise en pratique / résultats pédagogiques
 * 07. CTA final
 *
 * IMPORTANT :
 * - aucune logique admin ici ;
 * - aucune requête directe à Prisma ici ;
 * - les formations sont récupérées dans HomeFeaturedCourses ;
 * - la navigation globale est gérée par PublicShell ;
 * - le footer est également géré au niveau du layout/shell public
 *   lorsqu'il est prévu dans l'architecture globale.
 * ============================================================================
 */

/**
 * ============================================================================
 * SEO
 * ============================================================================
 */

const PAGE_TITLE =
  "AfriSkill AI | Formations pratiques en intelligence artificielle";

const PAGE_DESCRIPTION =
  "Développez des compétences pratiques en intelligence artificielle avec AfriSkill AI : ChatGPT, création de contenu, développement web, applications et automatisation.";

const SOCIAL_DESCRIPTION =
  "Apprenez à utiliser concrètement l’intelligence artificielle et développez des compétences applicables à vos projets numériques.";

const SOCIAL_IMAGE = "/images/accueil.png";

/**
 * Métadonnées spécifiques à la page d'accueil.
 *
 * Les URL relatives restent compatibles avec le metadataBase défini
 * au niveau du layout racine lorsque celui-ci est configuré.
 */
export const metadata: Metadata = {
  title: PAGE_TITLE,

  description: PAGE_DESCRIPTION,

  keywords: [
    "AfriSkill AI",
    "formation intelligence artificielle",
    "formation IA",
    "formation ChatGPT",
    "ChatGPT",
    "création de contenu IA",
    "développement web IA",
    "applications avec IA",
    "automatisation IA",
    "compétences numériques",
    "formation IA Afrique",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",

    locale: "fr_FR",

    url: "/",

    siteName: "AfriSkill AI",

    title: PAGE_TITLE,

    description: SOCIAL_DESCRIPTION,

    images: [
      {
        url: SOCIAL_IMAGE,
        alt:
          "AfriSkill AI - Formations pratiques en intelligence artificielle",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: PAGE_TITLE,

    description: SOCIAL_DESCRIPTION,

    images: [
      SOCIAL_IMAGE,
    ],
  },

  robots: {
    index: true,
    follow: true,
  },
};

/**
 * ============================================================================
 * PAGE
 * ============================================================================
 */

export default function HomePage() {
  return <HomeLanding />;
}
