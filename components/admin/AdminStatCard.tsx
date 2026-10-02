import type { ReactNode } from "react";

export type AdminStatCardAccent =
  | "blue"
  | "gold"
  | "cyan"
  | "violet"
  | "green"
  | "red";

type AdminStatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon: ReactNode;
  accent?: AdminStatCardAccent;

  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
    label?: string;
  };
};

const accentStyles: Record<
  AdminStatCardAccent,
  {
    icon: string;
    line: string;
  }
> = {
  blue: {
    icon: "bg-blue-50 text-blue-600",
    line: "from-blue-600 via-blue-500 to-cyan-400",
  },

  gold: {
    icon: "bg-amber-50 text-amber-600",
    line: "from-amber-400 via-amber-500 to-orange-500",
  },

  cyan: {
    icon: "bg-cyan-50 text-cyan-600",
    line: "from-cyan-400 via-cyan-500 to-blue-500",
  },

  violet: {
    icon: "bg-violet-50 text-violet-600",
    line: "from-violet-500 via-purple-500 to-fuchsia-400",
  },

  green: {
    icon: "bg-emerald-50 text-emerald-600",
    line: "from-emerald-400 via-emerald-500 to-teal-500",
  },

  red: {
    icon: "bg-red-50 text-red-600",
    line: "from-red-400 via-red-500 to-orange-500",
  },
};

export default function AdminStatCard({
  title,
  value,
  description,
  icon,
  accent = "blue",
  trend,
}: AdminStatCardProps) {
  const styles = accentStyles[accent];

  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <div
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${styles.line}`}
        aria-hidden="true"
      />

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 break-words text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          {description ? (
            <p className="mt-1.5 text-xs leading-5 text-slate-400">
              {description}
            </p>
          ) : null}
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105 ${styles.icon}`}
        >
          {icon}
        </div>
      </div>

      {trend ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <TrendBadge
            direction={trend.direction}
            value={trend.value}
          />

          {trend.label ? (
            <span className="text-[11px] text-slate-400">
              {trend.label}
            </span>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function TrendBadge({
  direction,
  value,
}: {
  direction: "up" | "down" | "neutral";
  value: string;
}) {
  const style = {
    up: "bg-emerald-50 text-emerald-700",
    down: "bg-red-50 text-red-700",
    neutral: "bg-slate-100 text-slate-600",
  }[direction];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold ${style}`}
    >
      {direction === "up" ? <TrendUpIcon /> : null}

      {direction === "down" ? <TrendDownIcon /> : null}

      {direction === "neutral" ? <NeutralIcon /> : null}

      {value}
    </span>
  );
}

function TrendUpIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m7 17 10-10" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m7 7 10 10" />
      <path d="M17 7v10H7" />
    </svg>
  );
}

function NeutralIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
    </svg>
  );
}