"use client";

import { useMemo, useState } from "react";

export type RevenueChartPoint = {
  label: string;
  value: number;
};

type RevenueChartProps = {
  data?: RevenueChartPoint[];
  currency?: string;
  locale?: string;
  title?: string;
  description?: string;
};

const VIEWBOX_WIDTH = 900;
const VIEWBOX_HEIGHT = 260;

const PADDING_LEFT = 16;
const PADDING_RIGHT = 16;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 32;

export default function RevenueChart({
  data = [],
  currency = "XOF",
  locale = "fr-FR",
  title = "Évolution du chiffre d’affaires",
  description = "Suivi des revenus encaissés sur la plateforme.",
}: RevenueChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(
    null,
  );

  const safeData = useMemo(
    () =>
      data
        .filter(
          (point) =>
            point &&
            typeof point.label === "string" &&
            Number.isFinite(point.value),
        )
        .map((point) => ({
          label: point.label,
          value: Math.max(0, point.value),
        })),
    [data],
  );

  const total = useMemo(
    () =>
      safeData.reduce(
        (sum, point) => sum + point.value,
        0,
      ),
    [safeData],
  );

  const chart = useMemo(() => {
    if (safeData.length === 0) {
      return null;
    }

    const values = safeData.map((point) => point.value);

    const maxValue = Math.max(...values, 1);

    const drawableWidth =
      VIEWBOX_WIDTH - PADDING_LEFT - PADDING_RIGHT;

    const drawableHeight =
      VIEWBOX_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const points = safeData.map((point, index) => {
      const x =
        safeData.length === 1
          ? VIEWBOX_WIDTH / 2
          : PADDING_LEFT +
            (index / (safeData.length - 1)) *
              drawableWidth;

      const y =
        PADDING_TOP +
        drawableHeight -
        (point.value / maxValue) * drawableHeight;

      return {
        ...point,
        x,
        y,
      };
    });

    const linePath = points
      .map(
        (point, index) =>
          `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
      )
      .join(" ");

    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    const bottomY =
      VIEWBOX_HEIGHT - PADDING_BOTTOM;

    const areaPath = [
      `M ${firstPoint.x} ${bottomY}`,
      `L ${firstPoint.x} ${firstPoint.y}`,
      ...points
        .slice(1)
        .map((point) => `L ${point.x} ${point.y}`),
      `L ${lastPoint.x} ${bottomY}`,
      "Z",
    ].join(" ");

    return {
      points,
      linePath,
      areaPath,
      bottomY,
    };
  }, [safeData]);

  return (
    <section
      className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm"
      aria-labelledby="revenue-chart-title"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
        <div>
          <h2
            id="revenue-chart-title"
            className="font-bold text-slate-950"
          >
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>

        <div className="shrink-0">
          <p className="text-xs font-medium text-slate-400">
            Total affiché
          </p>

          <p className="mt-1 text-right text-lg font-bold text-slate-950">
            {formatCurrency(total, currency, locale)}
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {!chart ? (
          <EmptyRevenueChart />
        ) : (
          <>
            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
                className="h-auto min-h-[240px] w-full"
                role="img"
                aria-label="Graphique du chiffre d'affaires"
              >
                <defs>
                  <linearGradient
                    id="afriskillRevenueArea"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="currentColor"
                      stopOpacity="0.18"
                    />

                    <stop
                      offset="100%"
                      stopColor="currentColor"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                {/* Grille horizontale */}
                {[0, 1, 2, 3, 4].map((line) => {
                  const y =
                    PADDING_TOP +
                    ((VIEWBOX_HEIGHT -
                      PADDING_TOP -
                      PADDING_BOTTOM) /
                      4) *
                      line;

                  return (
                    <line
                      key={line}
                      x1={PADDING_LEFT}
                      y1={y}
                      x2={VIEWBOX_WIDTH - PADDING_RIGHT}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeWidth="1"
                      strokeDasharray="4 6"
                    />
                  );
                })}

                <path
                  d={chart.areaPath}
                  fill="url(#afriskillRevenueArea)"
                  className="text-blue-600"
                />

                <path
                  d={chart.linePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {chart.points.map((point, index) => {
                  const active = activeIndex === index;

                  return (
                    <g key={`${point.label}-${index}`}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r={active ? 8 : 5}
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth={active ? 4 : 3}
                      />

                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="18"
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() =>
                          setActiveIndex(index)
                        }
                        onMouseLeave={() =>
                          setActiveIndex(null)
                        }
                        onFocus={() =>
                          setActiveIndex(index)
                        }
                        onBlur={() =>
                          setActiveIndex(null)
                        }
                        tabIndex={0}
                        role="button"
                        aria-label={`${point.label} : ${formatCurrency(
                          point.value,
                          currency,
                          locale,
                        )}`}
                      />
                    </g>
                  );
                })}
              </svg>

              {activeIndex !== null &&
              chart.points[activeIndex] ? (
                <ChartTooltip
                  point={chart.points[activeIndex]}
                  currency={currency}
                  locale={locale}
                />
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
              <span className="text-xs font-medium text-slate-400">
                {safeData[0]?.label}
              </span>

              <span className="text-xs font-medium text-slate-400">
                {safeData[safeData.length - 1]?.label}
              </span>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function ChartTooltip({
  point,
  currency,
  locale,
}: {
  point: {
    label: string;
    value: number;
    x: number;
    y: number;
  };
  currency: string;
  locale: string;
}) {
  const horizontalPosition =
    (point.x / VIEWBOX_WIDTH) * 100;

  const verticalPosition =
    (point.y / VIEWBOX_HEIGHT) * 100;

  return (
    <div
      className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-[115%] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-xl"
      style={{
        left: `${Math.min(
          88,
          Math.max(12, horizontalPosition),
        )}%`,
        top: `${Math.max(15, verticalPosition)}%`,
      }}
    >
      <p className="whitespace-nowrap text-[11px] font-medium text-slate-400">
        {point.label}
      </p>

      <p className="mt-0.5 whitespace-nowrap text-xs font-bold text-slate-900">
        {formatCurrency(point.value, currency, locale)}
      </p>
    </div>
  );
}

function EmptyRevenueChart() {
  return (
    <div className="relative flex min-h-[290px] items-center justify-center overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
          backgroundSize: "64px 52px",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-sm px-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-500 shadow-sm">
          <ChartIcon />
        </div>

        <p className="mt-4 text-sm font-bold text-slate-800">
          Aucune donnée de vente
        </p>

        <p className="mt-1.5 text-xs leading-5 text-slate-400">
          Les revenus apparaîtront automatiquement ici dès
          l&apos;enregistrement des premières commandes payées.
        </p>
      </div>
    </div>
  );
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

function ChartIcon() {
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
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </svg>
  );
}