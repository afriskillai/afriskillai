import type { Metadata } from "next";

import HomeFeaturedCourses from "@/components/public/home/HomeFeaturedCourses";
import HomeFinalCta from "@/components/public/home/HomeFinalCta";
import HomeHero from "@/components/public/home/HomeHero";
import HomeHowItWorks from "@/components/public/home/HomeHowItWorks";
import HomeResults from "@/components/public/home/HomeResults";
import HomeSkills from "@/components/public/home/HomeSkills";
import HomeTrustBar from "@/components/public/home/HomeTrustBar";

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
  return (
    <div
      className={[
        "relative",
        "w-full",
        "min-w-0",

        "bg-[var(--background)]",
        "text-[var(--foreground)]",
      ].join(" ")}
    >
      {/* ==================================================================
          01 — HERO

          Proposition de valeur principale.
          ================================================================== */}

      <HomeHero />

      {/* ==================================================================
          02 — POURQUOI AFRISKILL AI

          Réassurance et approche pédagogique.
          ================================================================== */}

      <HomeTrustBar />

      {/* ==================================================================
          03 — FORMATIONS

          Formations publiées récupérées côté serveur.
          ================================================================== */}

      <HomeFeaturedCourses />

      {/* ==================================================================
          04 — COMPÉTENCES

          Présentation des principales familles de compétences.
          ================================================================== */}

      <HomeSkills />

      {/* ==================================================================
          05 — COMMENT ÇA MARCHE

          Parcours :
          formation → achat → accès au contenu.

          L'id "comment-ca-marche" est défini directement dans
          HomeHowItWorks afin de supporter les liens d'ancrage.
          ================================================================== */}

      <HomeHowItWorks />

      {/* ==================================================================
          06 — MISE EN PRATIQUE

          Présentation des bénéfices pédagogiques et des domaines
          d'application sans statistiques ni promesses non vérifiées.
          ================================================================== */}

      <HomeResults />

      {/* ==================================================================
          07 — CTA FINAL

          Dernière orientation vers le catalogue.
          ================================================================== */}

      <HomeFinalCta />
    </div>
  );
}