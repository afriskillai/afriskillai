import type {
  BaseListFilters,
  EntityId,
  SupportedCurrency,
  TimestampFields,
} from "./admin";

/**
 * ============================================================================
 * AFRISKILL AI — TYPES PAIEMENT
 * ============================================================================
 *
 * RÈGLE :
 * le navigateur ne décide jamais qu'un paiement est réussi.
 *
 * La confirmation définitive devra provenir du serveur
 * après vérification auprès du prestataire / webhook.
 * ============================================================================
 */

export type PaiementStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

export type PaiementProvider =
  | "moneroo"
  | "manual"
  | "other";

export type Paiement = TimestampFields & {
  id: EntityId;

  commandeId: EntityId;

  reference: string | null;

  provider: PaiementProvider;

  providerPaymentId: string | null;

  amount: number;
  currency: SupportedCurrency;

  status: PaiementStatus;

  paidAt: string | Date | null;

  failedAt: string | Date | null;
  cancelledAt: string | Date | null;
  refundedAt: string | Date | null;
};

export type PaiementListItem = {
  id: EntityId;

  reference: string | null;

  orderId: EntityId;
  orderReference: string;

  customerName: string;
  customerEmail: string;

  provider: PaiementProvider;

  amount: number;
  currency: SupportedCurrency;

  status: PaiementStatus;

  createdAt: string | Date;
  paidAt: string | Date | null;
};

export type PaiementListFilters =
  BaseListFilters & {
    status?: PaiementStatus | "all";

    provider?: PaiementProvider | "all";

    currency?: SupportedCurrency | "all";

    dateFrom?: string;
    dateTo?: string;

    sortBy?:
      | "createdAt"
      | "updatedAt"
      | "amount"
      | "paidAt";

    sortDirection?: "asc" | "desc";
  };

export type CreatePaiementInput = {
  commandeId: EntityId;

  provider: PaiementProvider;
};

export type PaiementInitializationResult = {
  paiementId: EntityId;

  reference: string | null;

  provider: PaiementProvider;

  status: PaiementStatus;

  checkoutUrl?: string | null;
};

export type PaiementVerificationResult = {
  paiementId: EntityId;

  commandeId: EntityId;

  verified: boolean;

  status: PaiementStatus;

  amount: number;
  currency: SupportedCurrency;

  paidAt: string | Date | null;
};

export type PaiementStatistics = {
  total: number;

  pending: number;
  processing: number;
  paid: number;
  failed: number;
  cancelled: number;
  refunded: number;

  confirmedRevenue: number;

  currency: SupportedCurrency;
};