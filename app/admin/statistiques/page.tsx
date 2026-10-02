import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import RevenueChart, {
  type RevenueChartPoint,
} from "@/components/admin/dashboard/RevenueChart";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Statistiques",
  description:
    "Statistiques commerciales AfriSkill AI.",
};

type FormationPerformance = {
  id: string;
  title: string;
  sales: number;
  revenue: number;
  currency: string;
};

type StatisticsData = {
  revenue: number;
  currency: string;

  orders: number;
  customers: number;
  enrollments: number;

  paidOrders: number;
  pendingOrders: number;

  averageOrderValue: number;

  revenueChart: RevenueChartPoint[];

  topFormations: FormationPerformance[];
};

export default async function StatistiquesPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  const statistics =
    await getStatistics();

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
              <ChartIcon />
              Performance AfriSkill AI
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Statistiques
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
              Analysez les revenus, les commandes, les
              clients et les performances commerciales
              de vos formations à partir des données
              réellement enregistrées.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatisticCard
            label="Chiffre d’affaires"
            value={formatCurrency(
              statistics.revenue,
              statistics.currency,
            )}
            description="Paiements confirmés"
            icon={<MoneyIcon />}
          />

          <StatisticCard
            label="Commandes"
            value={formatNumber(
              statistics.orders,
            )}
            description={`${formatNumber(
              statistics.paidOrders,
            )} payée(s)`}
            icon={<OrdersIcon />}
          />

          <StatisticCard
            label="Clients"
            value={formatNumber(
              statistics.customers,
            )}
            description="Comptes enregistrés"
            icon={<ClientsIcon />}
          />

          <StatisticCard
            label="Inscriptions"
            value={formatNumber(
              statistics.enrollments,
            )}
            description="Accès aux formations"
            icon={<GraduationIcon />}
          />
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.65fr)]">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6">
              <h2 className="font-bold text-slate-950">
                Évolution du chiffre d’affaires
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Revenus issus des paiements confirmés.
              </p>
            </div>

            <RevenueChart
              data={statistics.revenueChart}
            />
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-950">
              Indicateurs commerciaux
            </h2>

            <dl className="mt-5 divide-y divide-slate-100">
              <IndicatorRow
                label="Panier moyen"
                value={formatCurrency(
                  statistics.averageOrderValue,
                  statistics.currency,
                )}
              />

              <IndicatorRow
                label="Commandes payées"
                value={formatNumber(
                  statistics.paidOrders,
                )}
              />

              <IndicatorRow
                label="Commandes en attente"
                value={formatNumber(
                  statistics.pendingOrders,
                )}
              />

              <IndicatorRow
                label="Formations vendues"
                value={formatNumber(
                  statistics.enrollments,
                )}
              />
            </dl>
          </section>
        </div>

        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <h2 className="font-bold text-slate-950">
              Performance des formations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Formations classées selon les données de
              ventes disponibles.
            </p>
          </div>

          {statistics.topFormations.length ===
          0 ? (
            <div className="flex min-h-[280px] items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <ChartLargeIcon />
                </div>

                <h3 className="mt-5 font-bold text-slate-900">
                  Pas encore de données
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Les performances apparaîtront
                  automatiquement après les premières
                  ventes confirmées.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {statistics.topFormations.map(
                (formation, index) => (
                  <div
                    key={formation.id}
                    className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600">
                        {index + 1}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {formation.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatNumber(
                            formation.sales,
                          )}{" "}
                          vente
                          {formation.sales > 1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    </div>

                    <p className="shrink-0 font-bold text-slate-950">
                      {formatCurrency(
                        formation.revenue,
                        formation.currency,
                      )}
                    </p>
                  </div>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </AdminShell>
  );
}

async function getStatistics(): Promise<StatisticsData> {
  /*
   * À remplacer par les agrégations Prisma.
   *
   * Ces valeurs à zéro représentent un état vide,
   * pas de fausses statistiques commerciales.
   */
  return {
    revenue: 0,
    currency: "XOF",

    orders: 0,
    customers: 0,
    enrollments: 0,

    paidOrders: 0,
    pendingOrders: 0,

    averageOrderValue: 0,

    revenueChart: [],
    topFormations: [],
  };
}

function StatisticCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>
      </div>
    </article>
  );
}

function IndicatorRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <dt className="text-sm text-slate-500">
        {label}
      </dt>

      <dd className="text-right text-sm font-bold text-slate-900">
        {value}
      </dd>
    </div>
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
  value: number,
  currency: string,
) {
  const amount =
    Number.isFinite(value) && value >= 0
      ? value
      : 0;

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits:
        currency === "XOF" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${formatNumber(
      amount,
    )} ${currency}`;
  }
}

function ChartIcon() {
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
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19V3" />
    </svg>
  );
}

function ChartLargeIcon() {
  return (
    <svg
      width="23"
      height="23"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M4 19V9" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M22 19V3" />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M6 3h12l2 4v14H4V7Z" />
      <path d="M4 7h16" />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M17 11a4 4 0 0 1 5 4v6" />
    </svg>
  );
}

function GraduationIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="m3 10 9-5 9 5-9 5Z" />
      <path d="M7 12v5c3 2 7 2 10 0v-5" />
    </svg>
  );
}