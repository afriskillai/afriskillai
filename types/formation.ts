import type {
  BaseListFilters,
  EntityId,
  SupportedCurrency,
  TimestampFields,
} from "./admin";

/**
 * ============================================================================
 * AFRISKILL AI — TYPES FORMATION
 * ============================================================================
 *
 * Contrats fonctionnels des formations :
 *
 * Formation
 *   ├── maximum 2 images
 *   ├── modules
 *   │    └── leçons
 *   └── publication
 *
 * Les fichiers uploadés eux-mêmes ne sont pas stockés dans ces types
 * persistants : la base conserve les références/URL du stockage.
 * ============================================================================
 */

/**
 * ============================================================================
 * STATUT FORMATION
 * ============================================================================
 */

export type FormationStatus =
  | "draft"
  | "published"
  | "archived";

/**
 * ============================================================================
 * TYPE DE LEÇON
 * ============================================================================
 */

export type LessonType =
  | "video"
  | "pdf"
  | "link"
  | "text";

/**
 * ============================================================================
 * IMAGE
 * ============================================================================
 */

export type FormationImageType =
  | "primary"
  | "secondary";

export type FormationImage =
  TimestampFields & {
    id: EntityId;
    formationId: EntityId;

    type: FormationImageType;

    url: string;

    altText?: string | null;

    position: number;
  };

/**
 * ============================================================================
 * LEÇON
 * ============================================================================
 */

export type FormationLesson =
  TimestampFields & {
    id: EntityId;

    moduleId: EntityId;

    title: string;

    type: LessonType;

    position: number;

    /**
     * Durée indicative.
     * Principalement utilisée pour les vidéos.
     */
    durationMinutes?: number | null;

    /**
     * URL privée/publique selon la stratégie
     * de stockage utilisée.
     *
     * Exemple :
     * - vidéo
     * - PDF
     * - ressource externe
     */
    resourceUrl?: string | null;

    /**
     * Contenu utilisé notamment pour
     * une leçon de type "text".
     */
    content?: string | null;

    isPublished: boolean;
  };

/**
 * ============================================================================
 * MODULE
 * ============================================================================
 */

export type FormationModule =
  TimestampFields & {
    id: EntityId;

    formationId: EntityId;

    title: string;

    description?: string | null;

    position: number;

    lessons: FormationLesson[];
  };

/**
 * ============================================================================
 * FORMATION
 * ============================================================================
 */

export type Formation =
  TimestampFields & {
    id: EntityId;

    title: string;

    shortDescription: string | null;

    description: string;

    price: number;

    promotionalPrice: number | null;

    currency: SupportedCurrency;

    status: FormationStatus;

    images: FormationImage[];

    modules?: FormationModule[];
  };

/**
 * ============================================================================
 * FORMATION — LISTE ADMIN
 * ============================================================================
 */

export type FormationListItem = {
  id: EntityId;

  title: string;

  shortDescription: string | null;

  price: number;

  promotionalPrice: number | null;

  currency: SupportedCurrency;

  status: FormationStatus;

  primaryImage: string | null;

  salesCount: number;

  createdAt: string | Date;
  updatedAt: string | Date;
};

/**
 * ============================================================================
 * FORMATION — DÉTAIL ADMIN
 * ============================================================================
 */

export type FormationDetail =
  Formation & {
    salesCount: number;

    studentsCount: number;

    modulesCount: number;

    lessonsCount: number;
  };

/**
 * ============================================================================
 * CRÉATION FORMATION
 * ============================================================================
 */

export type CreateFormationInput = {
  title: string;

  shortDescription: string;

  description: string;

  price: number;

  promotionalPrice?: number | null;

  currency: SupportedCurrency;

  status: Extract<
    FormationStatus,
    "draft" | "published"
  >;
};

/**
 * ============================================================================
 * MODIFICATION FORMATION
 * ============================================================================
 */

export type UpdateFormationInput = {
  title?: string;

  shortDescription?: string;

  description?: string;

  price?: number;

  promotionalPrice?: number | null;

  currency?: SupportedCurrency;

  status?: FormationStatus;
};

/**
 * ============================================================================
 * CRÉATION IMAGE
 * ============================================================================
 */

export type CreateFormationImageInput = {
  type: FormationImageType;

  url: string;

  altText?: string | null;

  position: number;
};

/**
 * ============================================================================
 * CRÉATION MODULE
 * ============================================================================
 */

export type CreateFormationModuleInput = {
  title: string;

  description?: string | null;

  position?: number;
};

/**
 * ============================================================================
 * MODIFICATION MODULE
 * ============================================================================
 */

export type UpdateFormationModuleInput = {
  title?: string;

  description?: string | null;

  position?: number;
};

/**
 * ============================================================================
 * CRÉATION LEÇON
 * ============================================================================
 */

export type CreateFormationLessonInput = {
  title: string;

  type: LessonType;

  position?: number;

  durationMinutes?: number | null;

  resourceUrl?: string | null;

  content?: string | null;

  isPublished?: boolean;
};

/**
 * ============================================================================
 * MODIFICATION LEÇON
 * ============================================================================
 */

export type UpdateFormationLessonInput = {
  title?: string;

  type?: LessonType;

  position?: number;

  durationMinutes?: number | null;

  resourceUrl?: string | null;

  content?: string | null;

  isPublished?: boolean;
};

/**
 * ============================================================================
 * CONTENU PÉDAGOGIQUE
 * ============================================================================
 */

export type FormationContent = {
  formationId: EntityId;

  modules: FormationModule[];
};

/**
 * ============================================================================
 * RÉSUMÉ DU CONTENU
 * ============================================================================
 */

export type FormationContentSummary = {
  modulesCount: number;

  lessonsCount: number;

  publishedLessonsCount: number;

  videosCount: number;

  pdfsCount: number;

  linksCount: number;

  textLessonsCount: number;
};

/**
 * ============================================================================
 * FILTRES ADMIN
 * ============================================================================
 */

export type FormationListFilters =
  BaseListFilters & {
    status?: FormationStatus | "all";

    currency?: SupportedCurrency | "all";

    sortBy?:
      | "createdAt"
      | "updatedAt"
      | "title"
      | "price"
      | "sales";

    sortDirection?: "asc" | "desc";
  };

/**
 * ============================================================================
 * PRIX
 * ============================================================================
 */

export type FormationPricing = {
  price: number;

  promotionalPrice: number | null;

  currency: SupportedCurrency;

  hasPromotion: boolean;

  effectivePrice: number;
};

/**
 * ============================================================================
 * FORMULAIRE CLIENT
 * ============================================================================
 *
 * Type volontairement différent des données persistées :
 * les inputs HTML manipulent les prix sous forme de chaînes.
 */

export type FormationFormData = {
  title: string;

  shortDescription: string;

  description: string;

  price: string;

  promotionalPrice: string;

  currency: SupportedCurrency;

  status: Extract<
    FormationStatus,
    "draft" | "published"
  >;
};

/**
 * ============================================================================
 * VALIDATION
 * ============================================================================
 */

export type FormationValidationField =
  | "title"
  | "shortDescription"
  | "description"
  | "price"
  | "promotionalPrice"
  | "currency"
  | "status"
  | "primaryImage"
  | "secondaryImage";

export type FormationValidationErrors =
  Partial<
    Record<
      FormationValidationField,
      string
    >
  >;

/**
 * ============================================================================
 * STATISTIQUES FORMATION
 * ============================================================================
 */

export type FormationStatistics = {
  formationId: EntityId;

  salesCount: number;

  studentsCount: number;

  revenue: number;

  currency: SupportedCurrency;

  modulesCount: number;

  lessonsCount: number;

  publishedLessonsCount: number;
};

/**
 * ============================================================================
 * API
 * ============================================================================
 */

export type FormationCreateResult = {
  id: EntityId;

  title: string;

  status: FormationStatus;
};

export type FormationUpdateResult = {
  id: EntityId;

  updatedAt: string | Date;
};