import Link from "next/link";
import type { ReactNode } from "react";

export type RecentOrderStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded"
  | "cancelled";

export type RecentOrder = {
  id: string;
  reference: string;

  customer: {
    name: string;
    email?: string | null;
  };

  course: {
    title: string;
  };

  amount: number;
  currency?: string;

  status: RecentOrderStatus;

  createdAt: string | Date;
};

type RecentOrdersProps = {
  orders?: RecentOrder[];
  locale?: string;
  defaultCurrency?: string;
  maxItems?: number;
};

const statusConfiguration: Record<
  RecentOrderStatus,
  {
    label: string;
    className: string;
    dot: string;
  }
> = {
  paid: {
    label: "Payée",
    className:
      "border-emerald-100 bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
  },

  pending: {
    label: "En attente",
    className:
      "border-amber-100 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },

  failed: {
    label: "Échouée",
    className:
      "border-red-100 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },

  refunded: {
    label: "Remboursée",
    className:
      "border-violet-100 bg-violet-50 text-violet-700",
    dot: "bg-violet-500",
  },

  cancelled: {
    label: "Annulée",
    className:
      "border-slate-200 bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
  },
};

export default function RecentOrders({
  orders = [],
  locale = "fr-FR",
  defaultCurrency = "XOF",
  maxItems = 5,
}: RecentOrdersProps) {
  const safeMaxItems =
    Number.isInteger(maxItems) && maxItems > 0
      ? maxItems
      : 5;

  const visibleOrders = orders.slice(0, safeMaxItems);

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
      aria-labelledby="recent-orders-title"
    >
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
        <div>
          <h2
            id="recent-orders-title"
            className="font-bold text-slate-950"
          >
            Commandes récentes
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Derniers achats effectués sur AfriSkill AI.
          </p>
        </div>

        <Link
          href="/admin/commandes"
          className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
        >
          Tout afficher
          <ArrowIcon />
        </Link>
      </div>

      {visibleOrders.length === 0 ? (
        <EmptyOrders />
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <TableHeader>Commande</TableHeader>
                  <TableHeader>Client</TableHeader>
                  <TableHeader>Formation</TableHeader>
                  <TableHeader>Montant</TableHeader>
                  <TableHeader>Statut</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>
                    <span className="sr-only">Action</span>
                  </TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {visibleOrders.map((order) => (
                  <DesktopOrderRow
                    key={order.id}
                    order={order}
                    locale={locale}
                    defaultCurrency={defaultCurrency}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="divide-y divide-slate-100 md:hidden">
            {visibleOrders.map((order) => (
              <MobileOrderCard
                key={order.id}
                order={order}
                locale={locale}
                defaultCurrency={defaultCurrency}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function DesktopOrderRow({
  order,
  locale,
  defaultCurrency,
}: {
  order: RecentOrder;
  locale: string;
  defaultCurrency: string;
}) {
  const customerName =
    order.customer.name.trim() || "Client";

  return (
    <tr className="group transition hover:bg-slate-50/70">
      <td className="whitespace-nowrap px-6 py-4">
        <Link
          href={`/admin/commandes/${encodeURIComponent(
            order.id,
          )}`}
          className="font-semibold text-slate-900 transition hover:text-blue-600"
        >
          {order.reference}
        </Link>
      </td>

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <CustomerAvatar name={customerName} />

          <div className="min-w-0">
            <p className="max-w-[190px] truncate text-sm font-semibold text-slate-800">
              {customerName}
            </p>

            {order.customer.email ? (
              <p className="mt-0.5 max-w-[190px] truncate text-xs text-slate-400">
                {order.customer.email}
              </p>
            ) : null}
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <p className="max-w-[230px] truncate text-sm text-slate-600">
          {order.course.title}
        </p>
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-900">
        {formatCurrency(
          order.amount,
          order.currency ?? defaultCurrency,
          locale,
        )}
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <OrderStatusBadge status={order.status} />
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
        {formatDate(order.createdAt, locale)}
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-right">
        <Link
          href={`/admin/commandes/${encodeURIComponent(
            order.id,
          )}`}
          aria-label={`Voir la commande ${order.reference}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
        >
          <ChevronRightIcon />
        </Link>
      </td>
    </tr>
  );
}

function MobileOrderCard({
  order,
  locale,
  defaultCurrency,
}: {
  order: RecentOrder;
  locale: string;
  defaultCurrency: string;
}) {
  const customerName =
    order.customer.name.trim() || "Client";

  return (
    <Link
      href={`/admin/commandes/${encodeURIComponent(order.id)}`}
      className="block p-5 transition hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <CustomerAvatar name={customerName} />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {customerName}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-400">
              {order.reference}
            </p>
          </div>
        </div>

        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 p-3">
        <p className="truncate text-xs text-slate-500">
          {order.course.title}
        </p>

        <div className="mt-2 flex items-end justify-between gap-3">
          <p className="font-bold text-slate-900">
            {formatCurrency(
              order.amount,
              order.currency ?? defaultCurrency,
              locale,
            )}
          </p>

          <p className="text-xs text-slate-400">
            {formatDate(order.createdAt, locale)}
          </p>
        </div>
      </div>
    </Link>
  );
}

function OrderStatusBadge({
  status,
}: {
  status: RecentOrderStatus;
}) {
  const config = statusConfiguration[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${config.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
      />

      {config.label}
    </span>
  );
}

function CustomerAvatar({ name }: { name: string }) {
  const initials = getInitials(name);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 text-xs font-bold uppercase text-blue-700">
      {initials}
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="flex min-h-[250px] items-center justify-center px-6 py-10">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
          <OrdersIcon />
        </div>

        <p className="mt-4 text-sm font-bold text-slate-800">
          Aucune commande pour le moment
        </p>

        <p className="mt-1.5 text-xs leading-5 text-slate-400">
          Les nouvelles commandes apparaîtront automatiquement ici
          après les premiers achats effectués sur AfriSkill AI.
        </p>
      </div>
    </div>
  );
}

function TableHeader({
  children,
}: {
  children: ReactNode;
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
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ""}${
    parts[parts.length - 1][0] ?? ""
  }`.toUpperCase();
}

function formatCurrency(
  amount: number,
  currency: string,
  locale: string,
) {
  const safeAmount =
    Number.isFinite(amount) && amount >= 0 ? amount : 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "XOF" ? 0 : 2,
    }).format(safeAmount);
  } catch {
    return `${safeAmount.toLocaleString(locale)} ${currency}`;
  }
}

function formatDate(
  value: string | Date,
  locale: string,
) {
  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function OrdersIcon() {
  return (
    <svg
      width="21"
      height="21"
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

function ArrowIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}