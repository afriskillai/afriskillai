import { normalizeCourseVideo } from "@/lib/course-video";
import "server-only";

import { db } from "@/lib/db";

import {
  toPublicCourseCardData,
  type PublicCourse,
  type PublicCourseCardData,
  type PublicCourseDescriptionDocument,
  type PublicCourseDescriptionMark,
  type PublicCourseDescriptionMarkType,
  type PublicCourseDescriptionNode,
  type PublicCourseDescriptionNodeAttributes,
  type PublicCourseDescriptionNodeType,
  type PublicCourseDetail,
  type PublicCourseImage,
} from "@/types/public-course";

/**
 * ============================================================================
 * AFRISKILL AI — PUBLIC COURSES DATA ACCESS
 * ============================================================================
 *
 * Couche serveur responsable de la récupération et de la normalisation
 * des formations visibles dans l'espace PUBLIC.
 *
 * Ce fichier :
 * - ne retourne que les formations publiées ;
 * - récupère les images publiques des formations ;
 * - sélectionne correctement l'image principale ;
 * - normalise les prix Prisma / Decimal ;
 * - sécurise les promotions ;
 * - normalise les devises ;
 * - prépare les données utilisées par l'accueil et les cartes publiques ;
 * - récupère les données complètes d'une formation publique ;
 * - normalise la description enrichie enregistrée en JSON ;
 * - récupère les images intégrées dans la description.
 *
 * IMPORTANT :
 * Ce fichier ne contient aucune logique d'administration.
 * ============================================================================
 */

const DEFAULT_HOME_COURSE_LIMIT = 8;
const MAX_HOME_COURSE_LIMIT = 12;

/**
 * Limites de sécurité utilisées lors de la lecture du document enrichi.
 *
 * Elles empêchent qu'une structure JSON anormalement profonde ou volumineuse
 * soit transmise telle quelle au rendu public.
 */
const MAX_DESCRIPTION_DEPTH = 20;
const MAX_DESCRIPTION_NODES = 5000;
const MAX_DESCRIPTION_TEXT_LENGTH = 50_000;

/**
 * Valeur compatible avec Prisma Decimal
 * ou toute structure exposant `toNumber()`.
 */
type NumberLike = {
  toNumber: () => number;
};

/**
 * Image de formation telle qu'elle est normalisée dans cette couche.
 */
type NormalizedCourseImage = {
  type: string;
  position: number;
  url: string;
};

/**
 * Types de nœuds acceptés dans la description publique.
 *
 * Cette liste correspond volontairement aux éléments autorisés
 * par l'éditeur et validés côté administration.
 */
const ALLOWED_DESCRIPTION_NODE_TYPES =
  new Set<PublicCourseDescriptionNodeType>([
    "doc",
    "paragraph",
    "text",
    "heading",
    "bulletList",
    "orderedList",
    "listItem",
    "blockquote",
    "hardBreak",
    "horizontalRule",
    "image",
    "video",
  ]);

/**
 * Marques autorisées dans la description publique.
 */
const ALLOWED_DESCRIPTION_MARK_TYPES =
  new Set<PublicCourseDescriptionMarkType>([
    "bold",
    "italic",
    "strike",
    "code",
    "link",
  ]);

/**
 * ============================================================================
 * HELPERS GÉNÉRAUX
 * ============================================================================
 */

/**
 * Normalise le nombre de formations récupérées.
 *
 * Cela empêche :
 * - les valeurs négatives ;
 * - les valeurs décimales ;
 * - Infinity / NaN ;
 * - une récupération excessive de données.
 */
function normalizeLimit(limit: number): number {
  if (!Number.isFinite(limit)) {
    return DEFAULT_HOME_COURSE_LIMIT;
  }

  return Math.min(
    MAX_HOME_COURSE_LIMIT,
    Math.max(1, Math.floor(limit)),
  );
}

/**
 * Vérifie qu'une valeur possède une méthode `toNumber`.
 *
 * Prisma Decimal expose notamment cette méthode.
 */
function hasToNumber(
  value: unknown,
): value is NumberLike {
  return (
    typeof value === "object" &&
    value !== null &&
    "toNumber" in value &&
    typeof (value as NumberLike).toNumber ===
      "function"
  );
}

/**
 * Convertit proprement différentes représentations
 * numériques vers un `number`.
 *
 * Compatible avec :
 * - number ;
 * - Prisma Decimal ;
 * - string numérique.
 *
 * Une valeur inexploitable devient 0.
 */
function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? value
      : 0;
  }

  if (hasToNumber(value)) {
    const convertedValue =
      value.toNumber();

    return Number.isFinite(convertedValue)
      ? convertedValue
      : 0;
  }

  if (typeof value === "string") {
    const normalizedValue =
      value.trim();

    if (!normalizedValue) {
      return 0;
    }

    const parsedValue =
      Number(normalizedValue);

    return Number.isFinite(parsedValue)
      ? parsedValue
      : 0;
  }

  return 0;
}

/**
 * Convertit un montant en valeur publique valide.
 *
 * Les prix négatifs ou invalides sont ramenés à 0.
 */
function normalizeAmount(
  value: unknown,
): number {
  return Math.max(
    0,
    toNumber(value),
  );
}

/**
 * Nettoie un texte optionnel.
 *
 * Une chaîne vide devient `null`.
 */
function normalizeText(
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
 * Nettoie le titre d'une formation.
 *
 * Le titre provenant de la base reste la source
 * de vérité. On retire uniquement les espaces inutiles.
 */
function normalizeTitle(
  value: string,
): string {
  return value.trim();
}

/**
 * Normalise une devise.
 *
 * XOF reste le fallback actuel du projet lorsque
 * la devise enregistrée est absente ou invalide.
 */
function normalizeCurrency(
  value: string | null | undefined,
): string {
  if (typeof value !== "string") {
    return "XOF";
  }

  const normalizedValue =
    value.trim().toUpperCase();

  return normalizedValue || "XOF";
}

/**
 * Vérifie et normalise une URL d'image publique.
 *
 * Formats actuellement acceptés :
 * - https://...
 * - http://...
 * - /chemin-local
 *
 * Une valeur vide ou non reconnue n'est pas envoyée
 * vers l'interface publique.
 */
function normalizeImageUrl(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue =
    value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (
    normalizedValue.startsWith("https://") ||
    normalizedValue.startsWith("http://") ||
    normalizedValue.startsWith("/")
  ) {
    return normalizedValue;
  }

  return null;
}

/**
 * Construit un texte alternatif cohérent pour
 * l'image d'une formation.
 */
function createCourseImageAlt(
  title: string,
): string {
  const normalizedTitle =
    normalizeTitle(title);

  return normalizedTitle
    ? `Formation ${normalizedTitle}`
    : "Formation AfriSkill AI";
}

/**
 * Normalise le prix normal et le prix promotionnel.
 *
 * Une promotion n'est exposée publiquement que si
 * elle est strictement inférieure au prix normal.
 */
function normalizePricing(
  priceValue: unknown,
  promotionalPriceValue: unknown,
): {
  price: number;
  promotionalPrice: number | null;
} {
  const price =
    normalizeAmount(priceValue);

  const rawPromotionalPrice =
    promotionalPriceValue === null ||
    promotionalPriceValue === undefined
      ? null
      : normalizeAmount(
          promotionalPriceValue,
        );

  const promotionalPrice =
    rawPromotionalPrice !== null &&
    rawPromotionalPrice < price
      ? rawPromotionalPrice
      : null;

  return {
    price,
    promotionalPrice,
  };
}

/**
 * Normalise la liste des images classiques d'une formation.
 */
function normalizeCourseImages(
  images: Array<{
    url: string;
    type: unknown;
    position: number;
  }>,
): NormalizedCourseImage[] {
  return images
    .map((image) => {
      const url =
        normalizeImageUrl(image.url);

      if (!url) {
        return null;
      }

      return {
        type: String(image.type),
        position:
          Number.isFinite(image.position)
            ? image.position
            : 0,
        url,
      };
    })
    .filter(
      (
        image,
      ): image is NormalizedCourseImage =>
        image !== null,
    );
}

/**
 * Sélectionne l'image principale.
 *
 * Priorité :
 * 1. PRIMARY ;
 * 2. première image valide ;
 * 3. aucune image.
 */
function getPrimaryCourseImage(
  images: NormalizedCourseImage[],
  title: string,
): PublicCourseImage | null {
  const image =
    images.find(
      (item) =>
        item.type === "PRIMARY",
    ) ??
    images[0] ??
    null;

  if (!image) {
    return null;
  }

  return {
    url: image.url,
    alt: createCourseImageAlt(title),
  };
}

/**
 * Sélectionne l'image secondaire.
 *
 * Priorité :
 * 1. SECONDARY ;
 * 2. première image valide différente de l'image principale ;
 * 3. aucune image.
 */
function getSecondaryCourseImage(
  images: NormalizedCourseImage[],
  primaryImage: PublicCourseImage | null,
  title: string,
): PublicCourseImage | null {
  const explicitSecondary =
    images.find(
      (item) =>
        item.type === "SECONDARY",
    );

  const fallbackSecondary =
    images.find(
      (item) =>
        item.url !== primaryImage?.url,
    );

  const image =
    explicitSecondary ??
    fallbackSecondary ??
    null;

  if (!image) {
    return null;
  }

  return {
    url: image.url,
    alt: `Illustration de la formation ${
      normalizeTitle(title) ||
      "AfriSkill AI"
    }`,
  };
}

/**
 * ============================================================================
 * DESCRIPTION ENRICHIE
 * ============================================================================
 */

/**
 * Vérifie qu'une valeur est un objet JSON simple.
 */
function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

/**
 * Normalise une marque de texte.
 *
 * Toute marque inconnue ou invalide est ignorée.
 */
function normalizeDescriptionMark(
  value: unknown,
): PublicCourseDescriptionMark | null {
  if (!isRecord(value)) {
    return null;
  }

  const type = value.type;

  if (
    typeof type !== "string" ||
    !ALLOWED_DESCRIPTION_MARK_TYPES.has(
      type as PublicCourseDescriptionMarkType,
    )
  ) {
    return null;
  }

  const normalizedType =
    type as PublicCourseDescriptionMarkType;

  if (normalizedType !== "link") {
    return {
      type: normalizedType,
    };
  }

  const attrs =
    isRecord(value.attrs)
      ? value.attrs
      : null;

  const href =
    typeof attrs?.href === "string"
      ? attrs.href.trim()
      : "";

  /**
   * Les liens de la description publique doivent être
   * des liens HTTP(S).
   */
  if (
    !href.startsWith("https://") &&
    !href.startsWith("http://")
  ) {
    return null;
  }

  return {
    type: "link",
    attrs: {
      href,
      target: "_blank",
      rel: "noopener noreferrer",
    },
  };
}

/**
 * Normalise les attributs d'un nœud de description.
 */
function normalizeDescriptionNodeAttributes(
  type: PublicCourseDescriptionNodeType,
  value: unknown,
): PublicCourseDescriptionNodeAttributes | undefined {
  const attrs =
    isRecord(value)
      ? value
      : {};

  if (type === "heading") {
    const rawLevel =
      typeof attrs.level === "number"
        ? attrs.level
        : Number(attrs.level);

    const level =
      Number.isFinite(rawLevel)
        ? Math.max(
            1,
            Math.min(
              6,
              Math.floor(rawLevel),
            ),
          )
        : 2;

    return {
      level,
    };
  }

  if (type === "video") {
    const video = normalizeCourseVideo(attrs);
    if (!video) return undefined;
    return {
      provider: video.provider,
      videoId: video.videoId,
      videoUrl: video.videoUrl,
      videoTitle: typeof attrs.videoTitle === "string" ? attrs.videoTitle.trim().slice(0, 300) : null,
    };
  }
  if (type === "image") {
    const src =
      normalizeImageUrl(
        typeof attrs.src === "string"
          ? attrs.src
          : null,
      );

    if (!src) {
      return undefined;
    }

    return {
      src,
      imageId:
        normalizeText(
          typeof attrs.imageId === "string"
            ? attrs.imageId
            : null,
        ),
      alt:
        normalizeText(
          typeof attrs.alt === "string"
            ? attrs.alt
            : null,
        ),
      title:
        normalizeText(
          typeof attrs.title === "string"
            ? attrs.title
            : null,
        ),
    };
  }

  return undefined;
}

/**
 * État interne utilisé pour empêcher la lecture d'un
 * document anormalement volumineux.
 */
type DescriptionNormalizationState = {
  nodeCount: number;
  textLength: number;
};

/**
 * Normalise récursivement un nœud de description.
 *
 * Le JSON venant de Prisma est traité comme une donnée
 * non fiable jusqu'à sa validation.
 */
function normalizeDescriptionNode(
  value: unknown,
  depth: number,
  state: DescriptionNormalizationState,
): PublicCourseDescriptionNode | null {
  if (
    depth > MAX_DESCRIPTION_DEPTH ||
    state.nodeCount >=
      MAX_DESCRIPTION_NODES ||
    !isRecord(value)
  ) {
    return null;
  }

  const rawType = value.type;

  if (
    typeof rawType !== "string" ||
    !ALLOWED_DESCRIPTION_NODE_TYPES.has(
      rawType as PublicCourseDescriptionNodeType,
    )
  ) {
    return null;
  }

  const type =
    rawType as PublicCourseDescriptionNodeType;

  /**
   * "doc" n'est autorisé qu'à la racine.
   */
  if (type === "doc" && depth !== 0) {
    return null;
  }

  state.nodeCount += 1;

  if (type === "text") {
    if (typeof value.text !== "string") {
      return null;
    }

    const remainingLength =
      MAX_DESCRIPTION_TEXT_LENGTH -
      state.textLength;

    if (remainingLength <= 0) {
      return null;
    }

    const text =
      value.text.slice(
        0,
        remainingLength,
      );

    state.textLength += text.length;

    const marks =
      Array.isArray(value.marks)
        ? value.marks
            .map(
              normalizeDescriptionMark,
            )
            .filter(
              (
                mark,
              ): mark is PublicCourseDescriptionMark =>
                mark !== null,
            )
        : [];

    return {
      type: "text",
      text,
      ...(marks.length > 0
        ? { marks }
        : {}),
    };
  }

  if (type === "image") {
    const attrs =
      normalizeDescriptionNodeAttributes(
        type,
        value.attrs,
      );

    /**
     * Une image sans URL publique valide n'est jamais
     * transmise au renderer.
     */
    if (!attrs?.src) {
      return null;
    }

    return {
      type: "image",
      attrs,
    };
  }

  if (type === "video") {
    const attrs = normalizeDescriptionNodeAttributes(type, value.attrs);
    return attrs?.provider && attrs.videoId ? { type: "video", attrs } : null;
  }
  const attrs =
    normalizeDescriptionNodeAttributes(
      type,
      value.attrs,
    );

  const content =
    Array.isArray(value.content)
      ? value.content
          .map((child) =>
            normalizeDescriptionNode(
              child,
              depth + 1,
              state,
            ),
          )
          .filter(
            (
              child,
            ): child is PublicCourseDescriptionNode =>
              child !== null,
          )
      : [];

  return {
    type,
    ...(attrs
      ? { attrs }
      : {}),
    ...(content.length > 0
      ? { content }
      : {}),
  };
}

/**
 * Transforme la valeur JSON Prisma en document public sûr.
 *
 * Si le document n'est pas exploitable, `null` est retourné.
 * Le renderer pourra alors utiliser `description` comme fallback.
 */
function normalizeDescriptionContent(
  value: unknown,
): PublicCourseDescriptionDocument | null {
  if (!isRecord(value)) {
    return null;
  }

  if (value.type !== "doc") {
    return null;
  }

  const state: DescriptionNormalizationState = {
    nodeCount: 0,
    textLength: 0,
  };

  const normalized =
    normalizeDescriptionNode(
      value,
      0,
      state,
    );

  if (
    !normalized ||
    normalized.type !== "doc"
  ) {
    return null;
  }

  return {
    type: "doc",
    content:
      normalized.content ?? [],
  };
}

/**
 * ============================================================================
 * LISTE DES FORMATIONS PUBLIÉES
 * ============================================================================
 */

/**
 * Récupère les formations actuellement publiées.
 *
 * Cette fonction constitue la source de données
 * commune pour l'espace public.
 *
 * Seules les formations avec :
 *
 * status = PUBLISHED
 *
 * peuvent être retournées.
 */
export async function getPublishedCourses(
  limit = DEFAULT_HOME_COURSE_LIMIT,
): Promise<PublicCourse[]> {
  const normalizedLimit =
    normalizeLimit(limit);

  const courses =
    await db.course.findMany({
      where: {
        status: "PUBLISHED",
      },

      orderBy: {
        createdAt: "desc",
      },

      take: normalizedLimit,

      select: {
        id: true,
        title: true,
        shortDescription: true,

        price: true,
        promotionalPrice: true,
        currency: true,

        createdAt: true,
        updatedAt: true,

        images: {
          orderBy: [
            {
              position: "asc",
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            url: true,
            type: true,
            position: true,
          },
        },
      },
    });

  return courses.map(
    (course): PublicCourse => {
      const title =
        normalizeTitle(course.title);

      const validImages =
        normalizeCourseImages(
          course.images,
        );

      const primaryImage =
        getPrimaryCourseImage(
          validImages,
          title,
        );

      const {
        price,
        promotionalPrice,
      } = normalizePricing(
        course.price,
        course.promotionalPrice,
      );

      return {
        id: course.id,

        title,

        shortDescription:
          normalizeText(
            course.shortDescription,
          ),

        price,

        promotionalPrice,

        currency:
          normalizeCurrency(
            course.currency,
          ),

        primaryImage,

        createdAt:
          course.createdAt,

        updatedAt:
          course.updatedAt,
      };
    },
  );
}

/**
 * ============================================================================
 * DÉTAIL D'UNE FORMATION PUBLIQUE
 * ============================================================================
 */

/**
 * Récupère une formation publique complète par son identifiant.
 *
 * RÈGLES :
 * - la formation doit exister ;
 * - elle doit être PUBLISHED ;
 * - aucune donnée privée de livraison n'est exposée ;
 * - privateAccessUrl n'est jamais sélectionné ;
 * - privatePdfName n'est jamais sélectionné ;
 * - les informations d'administration ne sont pas sélectionnées ;
 * - descriptionContent est normalisé avant d'être envoyé au renderer ;
 * - les images de description sont limitées aux images appartenant
 *   réellement à cette formation.
 *
 * Retourne `null` lorsque la formation n'existe pas ou n'est pas publiée.
 */
export async function getPublishedCourseById(
  courseId: string,
): Promise<PublicCourseDetail | null> {
  const normalizedCourseId =
    courseId.trim();

  if (!normalizedCourseId) {
    return null;
  }

  const course =
    await db.course.findFirst({
      where: {
        id: normalizedCourseId,
        status: "PUBLISHED",
      },

      select: {
        id: true,
        title: true,
        shortDescription: true,
        description: true,
        descriptionContent: true,

        price: true,
        promotionalPrice: true,
        currency: true,

        createdAt: true,
        updatedAt: true,

        images: {
          orderBy: [
            {
              position: "asc",
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            url: true,
            type: true,
            position: true,
          },
        },

        descriptionImages: {
          orderBy: [
            {
              position: "asc",
            },
            {
              createdAt: "asc",
            },
          ],

          select: {
            id: true,
            url: true,
            altText: true,
            caption: true,
            position: true,
          },
        },
      },
    });

  if (!course) {
    return null;
  }

  const title =
    normalizeTitle(course.title);

  const validImages =
    normalizeCourseImages(
      course.images,
    );

  const primaryImage =
    getPrimaryCourseImage(
      validImages,
      title,
    );

  const secondaryImage =
    getSecondaryCourseImage(
      validImages,
      primaryImage,
      title,
    );

  const {
    price,
    promotionalPrice,
  } = normalizePricing(
    course.price,
    course.promotionalPrice,
  );

  const description =
    normalizeText(
      course.description,
    ) ?? "";

  const descriptionContent =
    normalizeDescriptionContent(
      course.descriptionContent,
    );

  const descriptionImages =
    course.descriptionImages
      .map((image) => {
        const url =
          normalizeImageUrl(
            image.url,
          );

        if (!url) {
          return null;
        }

        return {
          id: image.id,
          url,
          alt:
            normalizeText(
              image.altText,
            ) ??
            `Illustration de la formation ${title || "AfriSkill AI"}`,
          caption:
            normalizeText(
              image.caption,
            ),
          position:
            Number.isFinite(
              image.position,
            )
              ? image.position
              : 0,
        };
      })
      .filter(
        (
          image,
        ): image is PublicCourseDetail["descriptionImages"][number] =>
          image !== null,
      );

  return {
    id: course.id,

    title,

    shortDescription:
      normalizeText(
        course.shortDescription,
      ),

    description,

    descriptionContent,

    price,

    promotionalPrice,

    currency:
      normalizeCurrency(
        course.currency,
      ),

    primaryImage,

    secondaryImage,

    descriptionImages,

    createdAt:
      course.createdAt,

    updatedAt:
      course.updatedAt,
  };
}

/**
 * Alias public explicite.
 *
 * Il permet aux pages publiques d'utiliser un nom plus naturel
 * sans dupliquer la requête ou les règles de sécurité.
 */
export async function getPublicCourseById(
  courseId: string,
): Promise<PublicCourseDetail | null> {
  return getPublishedCourseById(
    courseId,
  );
}

/**
 * ============================================================================
 * ACCUEIL
 * ============================================================================
 */

/**
 * Récupère les formations destinées à l'accueil.
 *
 * Cette fonction réutilise volontairement
 * `getPublishedCourses()` afin que :
 *
 * - l'accueil ;
 * - le catalogue ;
 * - les cartes ;
 *
 * utilisent exactement les mêmes règles concernant
 * les prix, promotions, devises et images.
 */
export async function getHomeCourses(
  limit = DEFAULT_HOME_COURSE_LIMIT,
): Promise<PublicCourseCardData[]> {
  const courses =
    await getPublishedCourses(limit);

  return courses.map(
    toPublicCourseCardData,
  );
}