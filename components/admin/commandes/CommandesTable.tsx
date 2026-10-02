"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

export type AdminOrderStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded"
  | "cancelled";

export type AdminOrder = {
  id: string;
  reference: string;

  customer: {
    id?: string;
    name: string;
    email: string;
  };

  course: {
    id?: string;
    title: string;
  };

  amount: number;
  currency: string;

  status: AdminOrderStatus;

  paymentReference?: string | null;

  createdAt: string | Date;
};

type CommandesTableProps = {
  orders: AdminOrder[];
};

export default function CommandesTable({
  orders,
}: CommandesTableProps) {
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<
    "all" | AdminOrderStatus
  >("all");

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("fr");

    return orders.filter((order) => {
      const matchesStatus =
        status === "all" ||
        order.status === status;

      const matchesSearch =
        !normalizedSearch ||
        order.reference
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch) ||
        order.customer.name
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch) ||
        order.customer.email
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch) ||
        order.course.title
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch);

      return (
        matchesStatus && matchesSearch
      );
    });
  }, [orders, search, status]);

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-bold text-slate-950">
            Toutes les commandes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {orders.length} commande
            {orders.length > 1 ? "s" : ""} enregistrée
            {orders.length > 1 ? "s" : ""}.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <SearchIcon />
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
              placeholder="Commande, client..."
              aria-label="Rechercher une commande"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:w-[250px]"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as
                  | "all"
                  | AdminOrderStatus,
              )
            }
            aria-label="Filtrer par statut"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="all">
              Tous les statuts
            </option>

            <option value="paid">
              Payées
            </option>

            <option value="pending">
              En attente
            </option>

            <option value="failed">
              Échouées
            </option>

            <option value="refunded">
              Remboursées
            </option>

            <option value="cancelled">
              Annulées
            </option>
          </select>
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyOrders />
      ) : filteredOrders.length === 0 ? (
        <NoResults />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <TableHeader>
                    Commande
                  </TableHeader>

                  <TableHeader>
                    Client
                  </TableHeader>

                  <TableHeader>
                    Formation
                  </TableHeader>

                  <TableHeader>
                    Montant
                  </TableHeader>

                  <TableHeader>
                    Statut
                  </TableHeader>

                  <TableHeader>
                    Date
                  </TableHeader>

                  <TableHeader>
                    <span className="sr-only">
                      Action
                    </span>
                  </TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map(
                  (order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                    />
                  ),
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile/tablette */}
          <div className="divide-y divide-slate-100 lg:hidden">
            {filteredOrders.map(
              (order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                />
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}

function OrderRow({
  order,
}: {
  order: AdminOrder;
}) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="whitespace-nowrap px-6 py-4">
        <Link
          href={`/admin/commandes/${encodeURIComponent(
            order.id,
          )}`}
          className="text-sm font-bold text-slate-900 transition hover:text-blue-600"
        >
          {order.reference}
        </Link>

        {order.paymentReference ? (
          <p className="mt-1 max-w-[170px] truncate text-[11px] text-slate-400">
            {order.paymentReference}
          </p>
        ) : null}
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <CustomerAvatar
            name={order.customer.name}
          />

          <div className="min-w-0">
            <p className="max-w-[190px] truncate text-sm font-semibold text-slate-800">
              {order.customer.name}
            </p>

            <p className="mt-0.5 max-w-[190px] truncate text-xs text-slate-400">
              {order.customer.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <p className="max-w-[240px] truncate text-sm text-slate-600">
          {order.course.title}
        </p>
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-900">
        {formatCurrency(
          order.amount,
          order.currency,
        )}
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <StatusBadge
          status={order.status}
        />
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
        {formatDate(order.createdAt)}
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-right">
        <Link
          href={`/admin/commandes/${encodeURIComponent(
            order.id,
          )}`}
          aria-label={`Voir la commande ${order.reference}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
        >
          <ChevronIcon />
        </Link>
      </td>
    </tr>
  );
}

function OrderCard({
  order,
}: {
  order: AdminOrder;
}) {
  return (
    <Link
      href={`/admin/commandes/${encodeURIComponent(
        order.id,
      )}`}
      className="block p-5 transition hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CustomerAvatar
            name={order.customer.name}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {order.customer.name}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-400">
              {order.reference}
            </p>
          </div>
        </div>

        <StatusBadge
          status={order.status}
        />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="truncate text-xs text-slate-500">
          {order.course.title}
        </p>

        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="font-bold text-slate-900">
            {formatCurrency(
              order.amount,
              order.currency,
            )}
          </p>

          <p className="text-xs text-slate-400">
            {formatDate(
              order.createdAt,
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}

function StatusBadge({
  status,
}: {
  status: AdminOrderStatus;
}) {
  const config: Record<
    AdminOrderStatus,
    {
      label: string;
      style: string;
      dot: string;
    }
  > = {
    paid: {
      label: "Payée",
      style:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },

    pending: {
      label: "En attente",
      style:
        "border-amber-100 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    },

    failed: {
      label: "Échouée",
      style:
        "border-red-100 bg-red-50 text-red-700",
      dot: "bg-red-500",
    },

    refunded: {
      label: "Remboursée",
      style:
        "border-violet-100 bg-violet-50 text-violet-700",
      dot: "bg-violet-500",
    },

    cancelled: {
      label: "Annulée",
      style:
        "border-slate-200 bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    },
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${current.style}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${current.dot}`}
      />

      {current.label}
    </span>
  );
}

function CustomerAvatar({
  name,
}: {
  name: string;
}) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 text-xs font-bold uppercase text-blue-700">
      {getInitials(name)}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="flex min-h-[350px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <OrdersIcon />
        </div>

        <h3 className="mt-5 font-bold text-slate-900">
          Aucune commande
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Les achats réalisés par vos apprenants
          apparaîtront automatiquement ici après
          l&apos;activation du système de paiement.
        </p>
      </div>
    </div>
  );
}

function NoResults() {
  return (
    <div className="flex min-h-[260px] items-center justify-center p-8 text-center">
      <div>
        <p className="font-bold text-slate-800">
          Aucune commande trouvée
        </p>

        <p className="mt-2 text-sm text-slate-400">
          Modifiez votre recherche ou votre
          filtre.
        </p>
      </div>
    </div>
  );
}

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400"
    >
      {children}
    </th>
  );
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "CL";
  }

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
    Number.isFinite(amount) &&
    amount >= 0
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

function formatDate(
  value: string | Date,
) {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle
        cx="11"
        cy="11"
        r="7"
      />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 3h12l2 4v14H4V7Z" />
      <path d="M4 7h16" />
      <path d="M9 11a3 3 0 0 0 6 0" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}