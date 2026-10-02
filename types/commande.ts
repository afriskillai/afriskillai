import type {
  BaseListFilters,
  EntityId,
  SupportedCurrency,
  TimestampFields,
} from "./admin";

/**
 * ============================================================================
 * AFRISKILL AI — TYPES COMMANDE
 * ============================================================================
 */

export type CommandeStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type CommandeItem = {
  id: EntityId;
  commandeId: EntityId;
  formationId: EntityId;

  formationTitle: string;

  unitPrice: number;
  quantity: number;
  total: number;

  currency: SupportedCurrency;
};

export type CommandeClientSummary = {
  id: EntityId;
  name: string;
  email: string;
};

export type Commande =
  TimestampFields & {
    id: EntityId;
    reference: string;

    clientId: EntityId;
    client: CommandeClientSummary;

    status: CommandeStatus;

    subtotal: number;
    discountAmount: number;
    totalAmount: number;

    currency: SupportedCurrency;

    items: CommandeItem[];
  };

export type CommandeListItem = {
  id: EntityId;
  reference: string;

  customer: CommandeClientSummary;

  /**
   * Compatibilité avec le tableau actuel.
   * Pour plusieurs formations, l'interface pourra
   * afficher la première + le nombre d'autres articles.
   */
  course: {
    id?: EntityId;
    title: string;
  };

  itemsCount: number;

  amount: number;
  currency: SupportedCurrency;

  status: CommandeStatus;

  paymentReference?: string | null;

  createdAt: string | Date;
};

export type CommandeDetail =
  Commande & {
    payment: {
      id: EntityId;
      reference: string | null;
      provider: string | null;

      status:
        | "pending"
        | "paid"
        | "failed"
        | "refunded"
        | "cancelled";

      amount: number;
      currency: SupportedCurrency;

      paidAt: string | Date | null;
    } | null;
  };

export type CreateCommandeItemInput = {
  formationId: EntityId;
  quantity: number;
};

export type CreateCommandeInput = {
  items: CreateCommandeItemInput[];
};

export type UpdateCommandeStatusInput = {
  status: CommandeStatus;
};

export type CommandeListFilters =
  BaseListFilters & {
    status?: CommandeStatus | "all";

    currency?: SupportedCurrency | "all";

    dateFrom?: string;
    dateTo?: string;

    sortBy?:
      | "createdAt"
      | "updatedAt"
      | "totalAmount";

    sortDirection?: "asc" | "desc";
  };

export type CommandeStatistics = {
  total: number;

  pending: number;
  paid: number;
  failed: number;
  cancelled: number;
  refunded: number;

  revenue: number;
  currency: SupportedCurrency;
};

export type CommandeCreateResult = {
  id: EntityId;
  reference: string;
  status: CommandeStatus;

  totalAmount: number;
  currency: SupportedCurrency;
};