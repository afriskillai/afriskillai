import type { ReactNode } from "react";

import AdminStatCard from "@/components/admin/AdminStatCard";

export type DashboardStatsData = {
  revenue: number;
  orders: number;
  customers: number;
  publishedCourses: number;

  revenueTrend?: number | null;
  ordersTrend?: number | null;
  customersTrend?: number | null;
  coursesTrend?: number | null;
};

type DashboardStatsProps = {
  data?: Partial<DashboardStatsData>;
  currency?: string;
  locale?: string;
};

const defaultStats: DashboardStatsData = {
  revenue: 0,
  orders: 0,
  customers: 0,
  publishedCourses: 0,

  revenueTrend: null,
  ordersTrend: null,
  customersTrend: null,
  coursesTrend: null,
};

export default function DashboardStats({
  data,
  currency = "XOF",
  locale = "fr-FR",
}: DashboardStatsProps) {
  const stats: DashboardStatsData = {
    ...defaultStats,
    ...data,
  };

  const revenue = formatCurrency(
    stats.revenue,
    currency,
    locale,
  );

  const orders = formatNumber(stats.orders, locale);
  const customers = formatNumber(stats.customers, locale);
  const courses = formatNumber(
    stats.publishedCourses,
    locale,
  );

  return (
    <section aria-labelledby="dashboard-stats-title">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2
            id="dashboard-stats-title"
            className="text-lg font-bold text-slate-950"
          >
            Vue d&apos;ensemble
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Indicateurs principaux de la plateforme.
          </p>
        </div>

        <span className="hidden text-xs font-medium text-slate-400 sm:block">
          Activité AfriSkill AI
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          title="Chiffre d’affaires"
          value={revenue}
          description="Revenus encaissés"
          icon={<RevenueIcon />}
          accent="gold"
          trend={createTrend(
            stats.revenueTrend,
            "par rapport à la période précédente",
          )}
        />

        <AdminStatCard
          title="Commandes"
          value={orders}
          description="Commandes enregistrées"
          icon={<OrdersIcon />}
          accent="blue"
          trend={createTrend(
            stats.ordersTrend,
            "par rapport à la période précédente",
          )}
        />

        <AdminStatCard
          title="Clients"
          value={customers}
          description="Apprenants enregistrés"
          icon={<CustomersIcon />}
          accent="cyan"
          trend={createTrend(
            stats.customersTrend,
            "par rapport à la période précédente",
          )}
        />

        <AdminStatCard
          title="Formations"
          value={courses}
          description="Formations actuellement publiées"
          icon={<CoursesIcon />}
          accent="violet"
          trend={createTrend(
            stats.coursesTrend,
            "par rapport à la période précédente",
          )}
        />
      </div>
    </section>
  );
}

function createTrend(
  value: number | null | undefined,
  label: string,
) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return undefined;
  }

  const direction: "up" | "down" | "neutral" =
    value > 0
      ? "up"
      : value < 0
        ? "down"
        : "neutral";

  const absoluteValue = Math.abs(value);

  const formattedValue = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 1,
  }).format(absoluteValue);

  return {
    direction,
    value: `${direction === "up" ? "+" : direction === "down" ? "-" : ""}${formattedValue} %`,
    label,
  };
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
    return `${formatNumber(safeAmount, locale)} ${currency}`;
  }
}

function formatNumber(value: number, locale: string) {
  const safeValue =
    Number.isFinite(value) && value >= 0 ? value : 0;

  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(safeValue);
}

function BaseIcon({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function RevenueIcon() {
  return (
    <BaseIcon>
      <circle cx="12" cy="12" r="9" />

      <path d="M15.5 8.5H10a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8.5" />

      <path d="M12 6.5v11" />
    </BaseIcon>
  );
}

function OrdersIcon() {
  return (
    <BaseIcon>
      <path d="M6 3h12l2 4v14H4V7Z" />
      <path d="M4 7h16" />
      <path d="M9 11a3 3 0 0 0 6 0" />
    </BaseIcon>
  );
}

function CustomersIcon() {
  return (
    <BaseIcon>
      <circle cx="9" cy="8" r="3" />

      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />

      <path d="M16 5.5a3 3 0 0 1 0 5.5" />

      <path d="M17 14.5a5 5 0 0 1 3.5 5" />
    </BaseIcon>
  );
}

function CoursesIcon() {
  return (
    <BaseIcon>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />

      <path d="M4 5.5v16" />

      <path d="M8 7h8" />

      <path d="M8 11h6" />
    </BaseIcon>
  );
}