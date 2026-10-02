import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paiements",
  description:
    "Suivi des paiements AfriSkill AI.",
};

type PaymentStatus =
  | "paid"
  | "pending"
  | "failed"
  | "refunded";

type PaymentListItem = {
  id: string;
  reference: string | null;

  orderId: string;
  orderReference: string;

  customerName: string;
  customerEmail: string;

  provider: string | null;

  amount: number;
  currency: string;

  status: PaymentStatus;

  createdAt: Date;
  paidAt: Date | null;
};

export default async function AdminPaiementsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  /*
   * À remplacer par la requête Prisma.
   * Aucun paiement fictif.
   */
  const payments: PaymentListItem[] = [];

  const paidPayments = payments.filter(
    (payment) =>
      payment.status === "paid",
  );

  const pendingPayments = payments.filter(
    (payment) =>
      payment.status === "pending",
  );

  const failedPayments = payments.filter(
    (payment) =>
      payment.status === "failed",
  );

  const confirmedRevenue =
    paidPayments.reduce(
      (sum, payment) =>
        sum + Math.max(0, payment.amount),
      0,
    );

  return (
    <AdminShell adminEmail={session.email}>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl"
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <PaymentIcon />
              Transactions AfriSkill AI
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Paiements
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
              Suivez les transactions liées aux
              commandes, leurs statuts et les montants
              réellement confirmés par le système de
              paiement.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PaymentStat
            label="Revenus confirmés"
            value={formatCurrency(
              confirmedRevenue,
              "XOF",
            )}
            description="Paiements validés"
          />

          <PaymentStat
            label="Paiements réussis"
            value={formatNumber(
              paidPayments.length,
            )}
            description="Transactions confirmées"
          />

          <PaymentStat
            label="En attente"
            value={formatNumber(
              pendingPayments.length,
            )}
            description="Transactions non finalisées"
          />

          <PaymentStat
            label="Échoués"
            value={formatNumber(
              failedPayments.length,
            )}
            description="Transactions non validées"
          />
        </section>

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-950">
                  Historique des paiements
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {payments.length} transaction
                  {payments.length > 1
                    ? "s"
                    : ""}{" "}
                  enregistrée
                  {payments.length > 1
                    ? "s"
                    : ""}
                  .
                </p>
              </div>

              <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <ShieldIcon />
                Validation serveur
              </div>
            </div>
          </div>

          {payments.length === 0 ? (
            <EmptyPayments />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[1100px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                      <TableHeader>
                        Transaction
                      </TableHeader>

                      <TableHeader>
                        Client
                      </TableHeader>

                      <TableHeader>
                        Commande
                      </TableHeader>

                      <TableHeader>
                        Fournisseur
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
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {payments.map(
                      (payment) => (
                        <PaymentRow
                          key={payment.id}
                          payment={payment}
                        />
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-100 lg:hidden">
                {payments.map(
                  (payment) => (
                    <PaymentCard
                      key={payment.id}
                      payment={payment}
                    />
                  ),
                )}
              </div>
            </>
          )}
        </section>

        <section className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
              <SecurityIcon />
            </div>

            <div>
              <h2 className="text-sm font-bold text-amber-950">
                Règle importante de paiement
              </h2>

              <p className="mt-1 max-w-4xl text-xs leading-6 text-amber-800/80 sm:text-sm">
                Une formation ne doit jamais être
                débloquée uniquement parce que le
                navigateur du client indique un paiement
                réussi. La confirmation définitive devra
                être réalisée côté serveur à partir de la
                transaction vérifiée et, lorsque le
                prestataire le permet, de son webhook
                authentifié.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function PaymentRow({
  payment,
}: {
  payment: PaymentListItem;
}) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-6 py-4">
        <p className="max-w-[190px] truncate text-sm font-bold text-slate-900">
          {payment.reference ?? "—"}
        </p>

        <p className="mt-1 max-w-[190px] truncate text-[11px] text-slate-400">
          {payment.id}
        </p>
      </td>

      <td className="px-6 py-4">
        <p className="max-w-[190px] truncate text-sm font-semibold text-slate-800">
          {payment.customerName}
        </p>

        <p className="mt-1 max-w-[190px] truncate text-xs text-slate-400">
          {payment.customerEmail}
        </p>
      </td>

      <td className="px-6 py-4">
        <Link
          href={`/admin/commandes/${encodeURIComponent(
            payment.orderId,
          )}`}
          className="text-sm font-semibold text-blue-600 transition hover:text-blue-700"
        >
          {payment.orderReference}
        </Link>
      </td>

      <td className="px-6 py-4 text-sm text-slate-500">
        {payment.provider ?? "—"}
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-900">
        {formatCurrency(
          payment.amount,
          payment.currency,
        )}
      </td>

      <td className="px-6 py-4">
        <PaymentStatusBadge
          status={payment.status}
        />
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
        {formatDateTime(
          payment.paidAt ??
            payment.createdAt,
        )}
      </td>
    </tr>
  );
}

function PaymentCard({
  payment,
}: {
  payment: PaymentListItem;
}) {
  return (
    <Link
      href={`/admin/commandes/${encodeURIComponent(
        payment.orderId,
      )}`}
      className="block p-5 transition hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {payment.reference ??
              payment.orderReference}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {payment.customerName}
          </p>
        </div>

        <PaymentStatusBadge
          status={payment.status}
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[10px] text-slate-400">
            Montant
          </p>

          <p className="mt-1 font-bold text-slate-900">
            {formatCurrency(
              payment.amount,
              payment.currency,
            )}
          </p>
        </div>

        <div className="text-right">
          <p className="text-[10px] text-slate-400">
            Commande
          </p>

          <p className="mt-1 text-xs font-semibold text-blue-600">
            {payment.orderReference}
          </p>
        </div>
      </div>
    </Link>
  );
}

function PaymentStatusBadge({
  status,
}: {
  status: PaymentStatus;
}) {
  const config: Record<
    PaymentStatus,
    {
      label: string;
      style: string;
      dot: string;
    }
  > = {
    paid: {
      label: "Confirmé",
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
      label: "Échoué",
      style:
        "border-red-100 bg-red-50 text-red-700",
      dot: "bg-red-500",
    },

    refunded: {
      label: "Remboursé",
      style:
        "border-violet-100 bg-violet-50 text-violet-700",
      dot: "bg-violet-500",
    },
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${current.style}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${current.dot}`}
      />

      {current.label}
    </span>
  );
}

function PaymentStat({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </article>
  );
}

function EmptyPayments() {
  return (
    <div className="flex min-h-[350px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <PaymentLargeIcon />
        </div>

        <h3 className="mt-5 font-bold text-slate-900">
          Aucun paiement
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Les transactions réelles apparaîtront ici
          après la connexion de la base de données et
          du système de paiement.
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

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(
    Number.isFinite(value)
      ? Math.max(0, value)
      : 0,
  );
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
    return `${formatNumber(
      safeAmount,
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

function PaymentIcon() {
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
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />
      <path d="M3 10h18" />
    </svg>
  );
}

function PaymentLargeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />
      <path d="M3 10h18" />
      <path d="M7 15h3" />
    </svg>
  );
}

function ShieldIcon() {
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
      <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6Z" />
      <path d="m9.5 12 1.5 1.5 3.5-4" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6Z" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}