import type { Metadata } from "next";
import { notFound } from "next/navigation";

import FormationSalesPage from "@/components/public/formations/FormationSalesPage";
import { getPublicCourseById } from "@/lib/public-courses";

/**
 * ============================================================================
 * AFRISKILL AI — PAGE PUBLIQUE D'UNE FORMATION
 * ============================================================================
 *
 * Route :
 *
 * /formations/[formationId]
 *
 * Responsabilités :
 * - récupérer uniquement une formation publiée ;
 * - retourner une vraie 404 si la formation n'existe pas ;
 * - générer les métadonnées SEO de la formation ;
 * - afficher la page commerciale complète ;
 * - ne jamais exposer les données privées de livraison ;
 * - ne jamais inventer une route de paiement.
 *
 * La récupération des données reste centralisée dans :
 *
 * lib/public-courses.ts
 *
 * La présentation reste centralisée dans :
 *
 * components/public/formations/FormationSalesPage.tsx
 * ============================================================================
 */

type FormationPageProps = {
  params: Promise<{
    formationId: string;
  }>;
};

/**
 * ============================================================================
 * HELPERS
 * ============================================================================
 */

/**
 * Nettoie l'identifiant reçu depuis l'URL.
 *
 * Une valeur vide est considérée comme invalide.
 */
function normalizeFormationId(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue =
    value.trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : null;
}

/**
 * Nettoie un texte destiné aux métadonnées.
 */
function normalizeMetadataText(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue =
    value
      .replace(/\s+/g, " ")
      .trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : null;
}

/**
 * Construit une description SEO raisonnablement courte.
 *
 * Priorité :
 * 1. shortDescription ;
 * 2. description texte ;
 * 3. fallback AfriSkill AI.
 */
function createMetadataDescription(
  shortDescription: string | null,
  description: string,
): string {
  const source =
    normalizeMetadataText(
      shortDescription,
    ) ??
    normalizeMetadataText(
      description,
    ) ??
    "Découvrez cette formation disponible sur AfriSkill AI.";

  /**
   * On évite une métadonnée excessivement longue.
   */
  if (source.length <= 160) {
    return source;
  }

  const shortened =
    source
      .slice(0, 157)
      .trimEnd();

  return `${shortened}...`;
}

/**
 * ============================================================================
 * MÉTADONNÉES
 * ============================================================================
 */

export async function generateMetadata({
  params,
}: FormationPageProps): Promise<Metadata> {
  const { formationId } =
    await params;

  const normalizedFormationId =
    normalizeFormationId(
      formationId,
    );

  if (!normalizedFormationId) {
    return {
      title: "Formation introuvable",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const course =
    await getPublicCourseById(
      normalizedFormationId,
    );

  if (!course) {
    return {
      title: "Formation introuvable",
      description:
        "Cette formation n'est pas disponible.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    normalizeMetadataText(
      course.title,
    ) ??
    "Formation";

  const description =
    createMetadataDescription(
      course.shortDescription,
      course.description,
    );

  const image =
    course.primaryImage;

  return {
    title,

    description,

    openGraph: {
      type: "website",
      title,
      description,

      ...(image
        ? {
            images: [
              {
                url: image.url,
                alt: image.alt,
              },
            ],
          }
        : {}),
    },

    twitter: {
      card: image
        ? "summary_large_image"
        : "summary",

      title,

      description,

      ...(image
        ? {
            images: [
              image.url,
            ],
          }
        : {}),
    },
  };
}

/**
 * ============================================================================
 * PAGE
 * ============================================================================
 */

export default async function FormationPage({
  params,
}: FormationPageProps) {
  const { formationId } =
    await params;

  const normalizedFormationId =
    normalizeFormationId(
      formationId,
    );

  if (!normalizedFormationId) {
    notFound();
  }

  /**
   * getPublicCourseById() applique déjà la règle essentielle :
   *
   * status = PUBLISHED
   *
   * Une formation :
   * - inexistante ;
   * - brouillon ;
   * - non publiée ;
   *
   * ne peut donc pas être affichée publiquement.
   */
  const course =
    await getPublicCourseById(
      normalizedFormationId,
    );

  if (!course) {
    notFound();
  }

  /**
   * Aucun checkoutHref n'est fourni pour le moment.
   *
   * C'est volontaire :
   * le système de paiement sera connecté séparément.
   *
   * Nous n'inventons donc pas :
   * - /checkout
   * - /commande
   * - /paiement
   * - ou toute autre route inexistante.
   *
   * FormationOrderBar affichera le CTA dans son état
   * prévu tant que le véritable parcours de paiement
   * n'aura pas été connecté.
   */
  return (
    <FormationSalesPage
      course={course}
    />
  );
}