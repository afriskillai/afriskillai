import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Détail de la commande",
};

type PageProps = {
  params: Promise<{
    commandeId: string;
  }>;
};

type OrderStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded"
  | "cancelled";

type PaymentStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded";

type OrderDetail = {
  id: string;
  reference: string;

  status: OrderStatus;

  amount: number;
  currency: string;

  createdAt: Date;
  updatedAt: Date;

  customer: {
    id: string;
    name: string;
    email: string;
  };

  items: Array<{
    id: string;
    formationId: string;
    title: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }>;

  payment: {
    id: string;
    reference: string | null;
    provider: string | null;
    status: PaymentStatus;
    amount: number;
    currency: string;
    paidAt: Date | null;
  } | null;
};

export default async function CommandeDetailPage({
  params,
}: PageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  const { commandeId } = await params;

  const normalizedCommandeId =
    safeDecodeURIComponent(commandeId).trim();

  if (!normalizedCommandeId) {
    redirect("/admin/commandes");
  }

  const order = await getOrderById(
    normalizedCommandeId,
  );

  return (
    <AdminShell adminEmail={session.email}>
      {order ? (
        <OrderDetailView order={order} />
      ) : (
        <OrderUnavailable
          commandeId={normalizedCommandeId}
        />
      )}
    </AdminShell>
  );
}

async function getOrderById(
  commandeId: string,
): Promise<OrderDetail | null> {
  /*
   * Cette fonction sera connectée à Prisma.
   *
   * L'identifiant est déjà validé et normalisé
   * avant d'arriver ici.
   *
   * Pour le moment, aucune commande fictive
   * n'est retournée.
   */
  void commandeId;

  return null;
}

function OrderDetailView({
  order,
}: {
  order: OrderDetail;
}) {
  return (
    <div className="space-y-6">
      <nav
        aria-label="Fil d’Ariane"
        className="flex flex-wrap items-center gap-2 text-sm"
      >
        <Link
          href="/admin/commandes"
          className="font-medium text-slate-500 transition hover:text-blue-600"
        >
          Commandes
        </Link>

        <ChevronRightIcon />

        <span
          aria-current="page"
          className="font-semibold text-slate-900"
        >
          {order.reference}
        </span>
      </nav>

      <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl"
        />

        <div className="relative">
          <Link
            href="/admin/commandes"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <BackIcon />
            Retour aux commandes
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Commande {order.reference}
                </h1>

                <OrderStatusBadge
                  status={order.status}
                />
              </div>

              <p className="mt-3 text-sm text-slate-500">
                Créée le{" "}
                {formatDateTime(order.createdAt)}
              </p>

              <p className="mt-1 break-all text-xs text-slate-400">
                ID : {order.id}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
              <p className="text-xs font-medium text-slate-400">
                Montant total
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {formatCurrency(
                  order.amount,
                  order.currency,
                )}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <h2 className="font-bold text-slate-950">
                Formations achetées
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Contenu de cette commande.
              </p>
            </div>

            {order.items.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">
                Aucun élément enregistré.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/formations/${encodeURIComponent(
                          item.formationId,
                        )}`}
                        className="font-semibold text-slate-900 transition hover:text-blue-600"
                      >
                        {item.title}
                      </Link>

                      <p className="mt-1 text-xs text-slate-400">
                        Quantité : {item.quantity}
                      </p>
                    </div>

                    <div className="shrink-0 text-left sm:text-right">
                      <p className="font-bold text-slate-900">
                        {formatCurrency(
                          item.total,
                          order.currency,
                        )}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatCurrency(
                          item.unitPrice,
                          order.currency,
                        )}{" "}
                        / unité
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-950">
              Paiement
            </h2>

            {order.payment ? (
              <dl className="mt-5 divide-y divide-slate-100">
                <DetailRow
                  label="Statut"
                  value={
                    <PaymentStatusBadge
                      status={
                        order.payment.status
                      }
                    />
                  }
                />

                <DetailRow
                  label="Montant"
                  value={formatCurrency(
                    order.payment.amount,
                    order.payment.currency,
                  )}
                />

                <DetailRow
                  label="Fournisseur"
                  value={
                    order.payment.provider ??
                    "—"
                  }
                />

                <DetailRow
                  label="Référence paiement"
                  value={
                    order.payment.reference ??
                    "—"
                  }
                />

                <DetailRow
                  label="Date de paiement"
                  value={
                    order.payment.paidAt
                      ? formatDateTime(
                          order.payment.paidAt,
                        )
                      : "—"
                  }
                />
              </dl>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                Aucun paiement associé à cette
                commande.
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-950">
              Client
            </h2>

            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                {getInitials(
                  order.customer.name,
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-900">
                  {order.customer.name}
                </p>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {order.customer.email}
                </p>
              </div>
            </div>

            <Link
              href={`/admin/clients/${encodeURIComponent(
                order.customer.id,
              )}`}
              className="mt-5 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-blue-50 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
            >
              Voir le client
              <ArrowIcon />
            </Link>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-950">
              Informations
            </h2>

            <dl className="mt-4 divide-y divide-slate-100">
              <DetailRow
                label="Commande"
                value={order.reference}
              />

              <DetailRow
                label="Création"
                value={formatDateTime(
                  order.createdAt,
                )}
              />

              <DetailRow
                label="Dernière mise à jour"
                value={formatDateTime(
                  order.updatedAt,
                )}
              />
            </dl>
          </section>
        </div>
      </div>
    </div>
  );
}

function OrderUnavailable({
  commandeId,
}: {
  commandeId: string;
}) {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/commandes"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
      >
        <BackIcon />
        Retour aux commandes
      </Link>

      <section className="flex min-h-[500px] items-center justify-center rounded-[26px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <OrderIcon />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Commande non disponible
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            Cette commande ne peut pas encore être
            récupérée. La page utilisera les données
            réelles dès que la couche Prisma sera
            connectée.
          </p>

          <p className="mt-3 break-all text-xs text-slate-400">
            Référence : {commandeId}
          </p>

          <Link
            href="/admin/commandes"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Toutes les commandes
          </Link>
        </div>
      </section>
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-5 py-3.5">
      <dt className="text-sm text-slate-500">
        {label}
      </dt>

      <dd className="max-w-[65%] break-words text-right text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function OrderStatusBadge({
  status,
}: {
  status: OrderStatus;
}) {
  const config: Record<
    OrderStatus,
    { label: string; style: string }
  > = {
    paid: {
      label: "Payée",
      style:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
    },
    pending: {
      label: "En attente",
      style:
        "border-amber-100 bg-amber-50 text-amber-700",
    },
    failed: {
      label: "Échouée",
      style:
        "border-red-100 bg-red-50 text-red-700",
    },
    refunded: {
      label: "Remboursée",
      style:
        "border-violet-100 bg-violet-50 text-violet-700",
    },
    cancelled: {
      label: "Annulée",
      style:
        "border-slate-200 bg-slate-100 text-slate-600",
    },
  };

  const current = config[status];

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${current.style}`}
    >
      {current.label}
    </span>
  );
}

function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  const config: Record<
    PaymentStatus,
    { label: string; style: string }
  > = {
    paid: {
      label: "Confirmé",
      style:
        "bg-emerald-50 text-emerald-700",
    },
    pending: {
      label: "En attente",
      style: "bg-amber-50 text-amber-700",
    },
    failed: {
      label: "Échoué",
      style: "bg-red-50 text-red-700",
    },
    refunded: {
      label: "Remboursé",
      style:
        "bg-violet-50 text-violet-700",
    },
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${current.style}`}
    >
      {current.label}
    </span>
  );
}

function safeDecodeURIComponent(
  value: string,
) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "CL";

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
}

function formatCurrency(
  amount: number,
  currency: string,
) {
  const safeAmount =
    Number.isFinite(amount) && amount >= 0
      ? amount
      : 0;

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits:
        currency === "XOF" ? 0 : 2,
    }).format(safeAmount);
  } catch {
    return `${safeAmount.toLocaleString(
      "fr-FR",
    )} ${currency}`;
  }
}

function formatDateTime(value: Date) {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function BackIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M6 3h12l2 4v14H4V7Z" />
      <path d="M4 7h16" />
      <path d="M9 11a3 3 0 0 0 6 0" />
    </svg>
  );
}