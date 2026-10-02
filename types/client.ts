import type {
  BaseListFilters,
  EntityId,
  SupportedCurrency,
  TimestampFields,
} from "./admin";

import type {
  CommandeStatus,
} from "./commande";

/**
 * ============================================================================
 * AFRISKILL AI — TYPES CLIENT
 * ============================================================================
 *
 * Aucun mot de passe ni hash de mot de passe ne doit
 * être envoyé vers les composants client.
 * ============================================================================
 */

export type ClientStatus =
  | "active"
  | "inactive"
  | "suspended";

export type Client = TimestampFields & {
  id: EntityId;

  firstName: string | null;
  lastName: string | null;

  name: string;

  email: string;

  status: ClientStatus;

  lastActivityAt: string | Date | null;
};

export type ClientListItem = {
  id: EntityId;

  name: string;
  email: string;

  status: ClientStatus;

  ordersCount: number;
  formationsCount: number;

  totalSpent: number;
  currency: SupportedCurrency;

  createdAt: string | Date;

  lastActivityAt?: string | Date | null;
};

export type ClientOrderSummary = {
  id: EntityId;
  reference: string;

  amount: number;
  currency: SupportedCurrency;

  status: CommandeStatus;

  createdAt: string | Date;
};

export type ClientEnrollmentSummary = {
  id: EntityId;

  formationId: EntityId;
  formationTitle: string;

  enrolledAt: string | Date;
};

export type ClientDetail = Client & {
  ordersCount: number;
  formationsCount: number;

  totalSpent: number;
  currency: SupportedCurrency;

  orders: ClientOrderSummary[];

  enrollments: ClientEnrollmentSummary[];
};

export type ClientListFilters =
  BaseListFilters & {
    status?: ClientStatus | "all";

    sortBy?:
      | "createdAt"
      | "updatedAt"
      | "name"
      | "lastActivityAt";

    sortDirection?: "asc" | "desc";
  };

export type UpdateClientStatusInput = {
  status: ClientStatus;
};

export type ClientStatistics = {
  total: number;

  active: number;
  inactive: number;
  suspended: number;

  customersWithPurchases: number;
};