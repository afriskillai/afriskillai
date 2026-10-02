/**
 * ============================================================================
 * AFRISKILL AI — TYPES ADMINISTRATEUR
 * ============================================================================
 *
 * Types partagés utilisés par l'espace administrateur.
 *
 * Règles :
 * - aucune dépendance React ;
 * - aucune dépendance Prisma ;
 * - utilisable côté serveur et côté client ;
 * - aucun secret ou mot de passe dans les objets exposés.
 * ============================================================================
 */

export type AdminRole = "admin";

export type AdminIdentity = {
  email: string;
  role: AdminRole;
};

export type AdminSession = {
  email: string;
  role: AdminRole;

  issuedAt: number;
  expiresAt: number;
};

export type AdminLoginInput = {
  email: string;
  password: string;
};

export type AdminLoginSuccess = {
  success: true;
  message?: string;
  redirect?: string;
};

export type AdminLoginFailure = {
  success: false;
  message: string;
};

export type AdminLoginResponse =
  | AdminLoginSuccess
  | AdminLoginFailure;

/**
 * ============================================================================
 * API
 * ============================================================================
 */

export type ApiSuccessResponse<T = undefined> = {
  success: true;
  message?: string;
  data?: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;

  code?: string;

  fieldErrors?: Record<
    string,
    string | string[]
  >;
};

export type ApiResponse<T = undefined> =
  | ApiSuccessResponse<T>
  | ApiErrorResponse;

/**
 * ============================================================================
 * PAGINATION
 * ============================================================================
 */

export type PaginationMeta = {
  page: number;
  pageSize: number;

  totalItems: number;
  totalPages: number;

  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: PaginationMeta;
};

/**
 * ============================================================================
 * TRI
 * ============================================================================
 */

export type SortDirection = "asc" | "desc";

export type SortOption<T extends string> = {
  field: T;
  direction: SortDirection;
};

/**
 * ============================================================================
 * PÉRIODES STATISTIQUES
 * ============================================================================
 */

export type StatisticsPeriod =
  | "today"
  | "7_days"
  | "30_days"
  | "month"
  | "year"
  | "all";

/**
 * ============================================================================
 * DEVISES
 * ============================================================================
 */

export type SupportedCurrency =
  | "XOF"
  | "EUR"
  | "USD";

/**
 * ============================================================================
 * TABLEAU DE BORD
 * ============================================================================
 */

export type DashboardMetric = {
  value: number;
  previousValue?: number | null;
  changePercentage?: number | null;
};

export type DashboardSummary = {
  revenue: DashboardMetric;
  orders: DashboardMetric;
  customers: DashboardMetric;
  publishedCourses: DashboardMetric;

  currency: SupportedCurrency;
};

/**
 * ============================================================================
 * GRAPHIQUES
 * ============================================================================
 */

export type ChartDataPoint = {
  label: string;
  value: number;
};

export type RevenueChartData = {
  currency: SupportedCurrency;
  points: ChartDataPoint[];
};

/**
 * ============================================================================
 * NAVIGATION ADMIN
 * ============================================================================
 */

export type AdminNavigationItem = {
  label: string;
  href: string;

  exact?: boolean;

  children?: AdminNavigationItem[];
};

/**
 * ============================================================================
 * ÉTATS GÉNÉRIQUES
 * ============================================================================
 */

export type LoadingState =
  | "idle"
  | "loading"
  | "success"
  | "error";

export type EntityAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "publish"
  | "archive";

/**
 * ============================================================================
 * DATE / AUDIT
 * ============================================================================
 */

export type TimestampFields = {
  createdAt: string | Date;
  updatedAt: string | Date;
};

export type SoftDeleteFields = {
  deletedAt?: string | Date | null;
};

/**
 * ============================================================================
 * FILTRES COMMUNS
 * ============================================================================
 */

export type BaseListFilters = {
  search?: string;
  page?: number;
  pageSize?: number;
};

/**
 * ============================================================================
 * VALIDATION
 * ============================================================================
 */

export type ValidationErrors<
  T extends string = string,
> = Partial<Record<T, string>>;

/**
 * ============================================================================
 * ENVIRONNEMENT / CONFIGURATION
 * ============================================================================
 */

export type ConfigurationState =
  | "configured"
  | "missing"
  | "optional";

export type AdminConfigurationItem = {
  key: string;
  label: string;
  description: string;
  state: ConfigurationState;
};

/**
 * ============================================================================
 * UTILITAIRES
 * ============================================================================
 */

export type Nullable<T> = T | null;

export type OptionalNullable<T> =
  | T
  | null
  | undefined;

export type EntityId = string;