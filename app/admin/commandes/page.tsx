import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import CommandesTable, {
  type AdminOrder,
} from "@/components/admin/commandes/CommandesTable";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Commandes",
};

export default async function AdminCommandesPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  /*
   * Sera remplacé par une requête Prisma.
   */
  const orders: AdminOrder[] = [];

  const paidOrders = orders.filter(
    (order) => order.status === "paid",
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "pending",
  );

  const revenue = paidOrders.reduce(
    (sum, order) => sum + order.amount,
    0,
  );

  return (
    <AdminShell adminEmail={session.email}>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <OrdersIcon />
              Ventes AfriSkill AI
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Gestion des commandes
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-slate-500">
              Consultez les achats, les paiements et les
              commandes effectuées par vos apprenants.
            </p>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <OrderStat
            label="Commandes"
            value={formatNumber(orders.length)}
            description="Total enregistré"
          />

          <OrderStat
            label="Payées"
            value={formatNumber(
              paidOrders.length,
            )}
            description="Paiements confirmés"
          />

          <OrderStat
            label="En attente"
            value={formatNumber(
              pendingOrders.length,
            )}
            description="À confirmer"
          />

          <OrderStat
            label="Chiffre d’affaires"
            value={formatCurrency(
              revenue,
              "XOF",
            )}
            description="Commandes payées"
          />
        </div>

        <CommandesTable orders={orders} />
      </div>
    </AdminShell>
  );
}

function OrderStat({
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

function formatNumber(value: number) {
  return new Intl.NumberFormat(
    "fr-FR",
  ).format(value);
}

function formatCurrency(
  value: number,
  currency: string,
) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits:
        currency === "XOF" ? 0 : 2,
    }).format(value);
  } catch {
    return `${formatNumber(value)} ${currency}`;
  }
}

function OrdersIcon() {
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
      <path d="M6 3h12l2 4v14H4V7Z" />
      <path d="M4 7h16" />
    </svg>
  );
}