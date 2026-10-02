/**
 * ============================================================================
 * AFRISKILL AI — TYPES PUBLICS DES FORMATIONS
 * ============================================================================
 *
 * Ce fichier centralise les types et helpers utilisés par l'espace public
 * pour afficher les formations.
 *
 * Il ne contient aucune logique :
 * - Prisma
 * - base de données
 * - administration
 * - authentification
 * - React / Next.js
 *
 * Il peut être utilisé par :
 * - la page d'accueil
 * - le catalogue des formations
 * - les cartes de formation
 * - la page publique de détail d'une formation
 * - le rendu de la description enrichie
 * - la barre de commande
 * ============================================================================
 */

export type PublicCourseCurrency = string;

/**
 * Image publique d'une formation.
 */
export type PublicCourseImage = {
  url: string;
  alt: string;
};

/**
 * Informations tarifaires communes à une formation.
 */
export type PublicCoursePricing = {
  price: number;
  promotionalPrice: number | null;
};

/**
 * ============================================================================
 * DESCRIPTION ENRICHIE
 * ============================================================================
 *
 * La description enrichie provient de l'éditeur TipTap utilisé dans
 * l'administration.
 *
 * Le format public reste volontairement indépendant de Prisma et de TipTap.
 * Les composants publics peuvent donc le lire sans importer une dépendance
 * d'administration.
 * ============================================================================
 */

/**
 * Marques autorisées dans un morceau de texte.
 */
export type PublicCourseDescriptionMarkType =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "link";

/**
 * Types de nœuds actuellement supportés dans la description publique.
 */
export type PublicCourseDescriptionNodeType =
  | "doc"
  | "paragraph"
  | "text"
  | "heading"
  | "bulletList"
  | "orderedList"
  | "listItem"
  | "blockquote"
  | "hardBreak"
  | "horizontalRule"
  | "image";

/**
 * Attributs d'un lien présent dans une description.
 */
export type PublicCourseDescriptionLinkAttributes = {
  href?: string | null;
  target?: string | null;
  rel?: string | null;
};

/**
 * Attributs d'une marque TipTap.
 */
export type PublicCourseDescriptionMark = {
  type: PublicCourseDescriptionMarkType;
  attrs?: PublicCourseDescriptionLinkAttributes | null;
};

/**
 * Attributs pouvant être présents sur un nœud de description.
 *
 * Certains attributs ne concernent qu'un type de nœud :
 * - level : heading
 * - src / imageId / alt / title : image
 */
export type PublicCourseDescriptionNodeAttributes = {
  level?: number | null;

  src?: string | null;
  imageId?: string | null;
  alt?: string | null;
  title?: string | null;
};

/**
 * Nœud générique de la description enrichie.
 *
 * Cette structure correspond au JSON sérialisé par l'éditeur.
 */
export type PublicCourseDescriptionNode = {
  type: PublicCourseDescriptionNodeType;
  attrs?: PublicCourseDescriptionNodeAttributes | null;
  content?: PublicCourseDescriptionNode[] | null;
  marks?: PublicCourseDescriptionMark[] | null;
  text?: string;
};

/**
 * Document racine d'une description enrichie.
 */
export type PublicCourseDescriptionDocument = {
  type: "doc";
  content?: PublicCourseDescriptionNode[] | null;
};

/**
 * Image appartenant à une description de formation.
 *
 * Ces informations correspondent aux images enregistrées séparément
 * pour une formation et peuvent notamment servir à vérifier ou enrichir
 * le rendu public.
 */
export type PublicCourseDescriptionImage = {
  id: string;
  url: string;
  alt: string;
  caption: string | null;
  position: number;
};

/**
 * ============================================================================
 * FORMATION PUBLIQUE COMMUNE
 * ============================================================================
 */

/**
 * Formation publique commune.
 *
 * Cette structure représente les données déjà nécessaires aux espaces
 * publics généraux comme :
 * - l'accueil
 * - le catalogue
 * - les cartes
 *
 * Les champs lourds de la page de détail restent dans PublicCourseDetail.
 */
export type PublicCourse = PublicCoursePricing & {
  id: string;
  title: string;
  shortDescription: string | null;
  currency: PublicCourseCurrency;
  primaryImage: PublicCourseImage | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Version légère d'une formation destinée aux cartes.
 *
 * Elle permet d'éviter de transmettre inutilement toutes les données
 * d'une formation lorsque l'interface n'a besoin que des informations
 * nécessaires à son affichage.
 */
export type PublicCourseCardData =
  PublicCoursePricing & {
    id: string;
    title: string;
    shortDescription: string | null;
    currency: PublicCourseCurrency;
    imageUrl: string | null;
    imageAlt: string;
  };

/**
 * ============================================================================
 * PAGE PUBLIQUE DE DÉTAIL / PAGE DE VENTE
 * ============================================================================
 */

/**
 * Données complètes nécessaires à la page publique d'une formation.
 *
 * Cette structure étend PublicCourse afin de préserver le contrat utilisé
 * par les cartes et l'accueil tout en ajoutant uniquement les données
 * nécessaires à la page de vente.
 */
export type PublicCourseDetail = PublicCourse & {
  /**
   * Description texte historique.
   *
   * Elle reste disponible :
   * - pour les anciennes formations ;
   * - comme fallback lorsque descriptionContent est absent ;
   * - pour les usages textuels qui n'ont pas besoin du document enrichi.
   */
  description: string;

  /**
   * Description structurée créée avec l'éditeur riche.
   *
   * Null pour une ancienne formation ou une formation qui ne possède
   * pas encore de description enrichie.
   */
  descriptionContent: PublicCourseDescriptionDocument | null;

  /**
   * Image secondaire éventuelle de la formation.
   */
  secondaryImage: PublicCourseImage | null;

  /**
   * Images enregistrées depuis l'éditeur de description.
   *
   * L'ordre visuel réel de la description reste déterminé par
   * descriptionContent. Ce tableau représente les images appartenant
   * officiellement à la formation.
   */
  descriptionImages: PublicCourseDescriptionImage[];
};

/**
 * Alias explicite pour les composants constituant la page de vente.
 */
export type PublicCourseSalesPageData = PublicCourseDetail;

/**
 * ============================================================================
 * HELPERS INTERNES
 * ============================================================================
 */

/**
 * Vérifie qu'un montant peut être utilisé dans l'interface publique.
 */
function isValidPublicCourseAmount(
  value: number,
): boolean {
  return (
    Number.isFinite(value) &&
    value >= 0
  );
}

/**
 * Nettoie une chaîne optionnelle.
 *
 * Une chaîne vide ou composée uniquement d'espaces
 * est considérée comme absente.
 */
function normalizeOptionalText(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0
    ? normalizedValue
    : null;
}

/**
 * Retourne un titre propre pouvant être utilisé dans
 * les textes alternatifs et autres fallbacks publics.
 */
function normalizeCourseTitle(
  title: string,
): string {
  return (
    normalizeOptionalText(title) ??
    "Formation"
  );
}

/**
 * ============================================================================
 * HELPERS TARIFAIRES
 * ============================================================================
 */

/**
 * Détermine si une formation possède réellement
 * une promotion valide.
 *
 * Une promotion est valide lorsque :
 * - le prix normal est valide ;
 * - le prix promotionnel existe ;
 * - le prix promotionnel est valide ;
 * - le prix promotionnel est inférieur au prix normal.
 */
export function publicCourseHasPromotion(
  course: PublicCoursePricing,
): boolean {
  const {
    price,
    promotionalPrice,
  } = course;

  if (!isValidPublicCourseAmount(price)) {
    return false;
  }

  if (promotionalPrice === null) {
    return false;
  }

  if (
    !isValidPublicCourseAmount(
      promotionalPrice,
    )
  ) {
    return false;
  }

  return promotionalPrice < price;
}

/**
 * Retourne le prix réellement applicable.
 *
 * Si une promotion valide existe, son prix est utilisé.
 * Sinon, le prix normal est retourné.
 */
export function getPublicCourseEffectivePrice(
  course: PublicCoursePricing,
): number {
  if (
    publicCourseHasPromotion(course) &&
    course.promotionalPrice !== null
  ) {
    return course.promotionalPrice;
  }

  return course.price;
}

/**
 * Retourne le montant économisé lorsqu'une promotion
 * valide est disponible.
 */
export function getPublicCourseDiscountAmount(
  course: PublicCoursePricing,
): number {
  if (
    !publicCourseHasPromotion(course) ||
    course.promotionalPrice === null
  ) {
    return 0;
  }

  return Math.max(
    0,
    course.price - course.promotionalPrice,
  );
}

/**
 * Retourne le pourcentage de réduction.
 *
 * Retourne null lorsqu'aucune promotion valide
 * n'est disponible.
 */
export function getPublicCourseDiscountPercentage(
  course: PublicCoursePricing,
): number | null {
  if (
    !publicCourseHasPromotion(course) ||
    course.promotionalPrice === null ||
    course.price <= 0
  ) {
    return null;
  }

  const discountAmount =
    course.price -
    course.promotionalPrice;

  const percentage =
    (discountAmount / course.price) * 100;

  if (!Number.isFinite(percentage)) {
    return null;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(percentage),
    ),
  );
}

/**
 * ============================================================================
 * HELPERS IMAGES
 * ============================================================================
 */

/**
 * Retourne l'URL exploitable de l'image principale.
 *
 * Compatible avec :
 * - PublicCourse
 * - PublicCourseDetail
 * - PublicCourseCardData
 *
 * Une URL vide est automatiquement transformée en null.
 */
export function getPublicCourseImageUrl(
  course:
    | Pick<
        PublicCourse,
        "primaryImage"
      >
    | Pick<
        PublicCourseCardData,
        "imageUrl"
      >,
): string | null {
  if ("imageUrl" in course) {
    return normalizeOptionalText(
      course.imageUrl,
    );
  }

  return normalizeOptionalText(
    course.primaryImage?.url,
  );
}

/**
 * Retourne un texte alternatif propre pour l'image
 * d'une formation.
 *
 * Priorité :
 * 1. texte alternatif enregistré ;
 * 2. "Formation + titre".
 */
export function getPublicCourseImageAlt(
  course:
    | Pick<
        PublicCourse,
        "title" | "primaryImage"
      >
    | Pick<
        PublicCourseCardData,
        "title" | "imageAlt"
      >,
): string {
  const title = normalizeCourseTitle(
    course.title,
  );

  if ("imageAlt" in course) {
    return (
      normalizeOptionalText(
        course.imageAlt,
      ) ??
      `Formation ${title}`
    );
  }

  return (
    normalizeOptionalText(
      course.primaryImage?.alt,
    ) ??
    `Formation ${title}`
  );
}

/**
 * ============================================================================
 * HELPERS DESCRIPTION
 * ============================================================================
 */

/**
 * Vérifie si une formation possède une description enrichie exploitable.
 */
export function publicCourseHasRichDescription(
  course: Pick<
    PublicCourseDetail,
    "descriptionContent"
  >,
): boolean {
  const content =
    course.descriptionContent?.content;

  return (
    Array.isArray(content) &&
    content.length > 0
  );
}

/**
 * Retourne la description texte de secours.
 *
 * Cette fonction est principalement destinée aux anciennes formations
 * qui ne possèdent pas encore descriptionContent.
 */
export function getPublicCourseDescriptionFallback(
  course: Pick<
    PublicCourseDetail,
    "description"
  >,
): string {
  return (
    normalizeOptionalText(
      course.description,
    ) ?? ""
  );
}

/**
 * Retourne le texte alternatif d'une image intégrée
 * dans la description.
 */
export function getPublicCourseDescriptionImageAlt(
  image:
    | Pick<
        PublicCourseDescriptionImage,
        "alt"
      >
    | null
    | undefined,
  courseTitle: string,
): string {
  return (
    normalizeOptionalText(
      image?.alt,
    ) ??
    `Illustration de la formation ${normalizeCourseTitle(
      courseTitle,
    )}`
  );
}

/**
 * ============================================================================
 * TRANSFORMATION POUR LES CARTES
 * ============================================================================
 */

/**
 * Transforme une formation publique complète
 * en données prêtes pour une carte.
 *
 * Cette fonction permet d'utiliser exactement le même
 * format de carte sur :
 * - l'accueil ;
 * - le catalogue ;
 * - les sections de recommandations.
 */
export function toPublicCourseCardData(
  course: PublicCourse,
): PublicCourseCardData {
  return {
    id: course.id,
    title: course.title,
    shortDescription:
      normalizeOptionalText(
        course.shortDescription,
      ),
    currency: course.currency,
    price: course.price,
    promotionalPrice:
      course.promotionalPrice,
    imageUrl:
      getPublicCourseImageUrl(course),
    imageAlt:
      getPublicCourseImageAlt(course),
  };
}