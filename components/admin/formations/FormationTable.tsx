"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

export type FormationStatus =
  | "draft"
  | "published"
  | "archived";

export type FormationListItem = {
  id: string;
  title: string;
  shortDescription?: string | null;

  price: number;
  promotionalPrice?: number | null;
  currency: string;

  status: FormationStatus;

  primaryImage?: string | null;

  salesCount?: number;

  createdAt: string | Date;
  updatedAt?: string | Date;
};

type FormationTableProps = {
  formations: FormationListItem[];
};

export default function FormationTable({
  formations,
}: FormationTableProps) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<
    "all" | FormationStatus
  >("all");

  const filteredFormations = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("fr");

    return formations.filter((formation) => {
      const matchesSearch =
        !normalizedSearch ||
        formation.title
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch) ||
        (formation.shortDescription ?? "")
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch);

      const matchesStatus =
        status === "all" || formation.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [formations, search, status]);

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-bold text-slate-950">
            Toutes les formations
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {formations.length} formation
            {formations.length > 1 ? "s" : ""} enregistrée
            {formations.length > 1 ? "s" : ""}.
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
                setSearch(event.target.value)
              }
              placeholder="Rechercher..."
              aria-label="Rechercher une formation"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:w-[240px]"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as
                  | "all"
                  | FormationStatus,
              )
            }
            aria-label="Filtrer par statut"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="all">Tous les statuts</option>
            <option value="published">Publiées</option>
            <option value="draft">Brouillons</option>
            <option value="archived">Archivées</option>
          </select>
        </div>
      </div>

      {formations.length === 0 ? (
        <EmptyFormations />
      ) : filteredFormations.length === 0 ? (
        <NoResults />
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1000px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <TableHeader>Formation</TableHeader>
                  <TableHeader>Prix</TableHeader>
                  <TableHeader>Statut</TableHeader>
                  <TableHeader>Ventes</TableHeader>
                  <TableHeader>Création</TableHeader>
                  <TableHeader>
                    <span className="sr-only">Actions</span>
                  </TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredFormations.map((formation) => (
                  <FormationRow
                    key={formation.id}
                    formation={formation}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {filteredFormations.map((formation) => (
              <FormationMobileCard
                key={formation.id}
                formation={formation}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function FormationRow({
  formation,
}: {
  formation: FormationListItem;
}) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <FormationThumbnail formation={formation} />

          <div className="min-w-0">
            <Link
              href={`/admin/formations/${encodeURIComponent(
                formation.id,
              )}`}
              className="block max-w-[300px] truncate text-sm font-bold text-slate-900 transition hover:text-blue-600"
            >
              {formation.title}
            </Link>

            {formation.shortDescription ? (
              <p className="mt-1 max-w-[300px] truncate text-xs text-slate-400">
                {formation.shortDescription}
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400">
                Aucune courte description
              </p>
            )}
          </div>
        </div>
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <PriceDisplay formation={formation} />
      </td>

      <td className="whitespace-nowrap px-6 py-4">
        <StatusBadge status={formation.status} />
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-slate-700">
        {formatNumber(formation.salesCount ?? 0)}
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
        {formatDate(formation.createdAt)}
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <Link
            href={`/admin/formations/${encodeURIComponent(
              formation.id,
            )}`}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
          >
            Voir
          </Link>

          <Link
            href={`/admin/formations/${encodeURIComponent(
              formation.id,
            )}/modifier`}
            className="inline-flex h-9 items-center justify-center rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Modifier
          </Link>
        </div>
      </td>
    </tr>
  );
}

function FormationMobileCard({
  formation,
}: {
  formation: FormationListItem;
}) {
  return (
    <article className="p-5">
      <div className="flex items-start gap-3">
        <FormationThumbnail formation={formation} />

        <div className="min-w-0 flex-1">
          <Link
            href={`/admin/formations/${encodeURIComponent(
              formation.id,
            )}`}
            className="block truncate text-sm font-bold text-slate-900"
          >
            {formation.title}
          </Link>

          <div className="mt-2">
            <StatusBadge status={formation.status} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3">
        <div>
          <p className="text-[11px] text-slate-400">
            Prix
          </p>

          <div className="mt-1">
            <PriceDisplay formation={formation} />
          </div>
        </div>

        <div>
          <p className="text-[11px] text-slate-400">
            Ventes
          </p>

          <p className="mt-1 text-sm font-bold text-slate-800">
            {formatNumber(formation.salesCount ?? 0)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Link
          href={`/admin/formations/${encodeURIComponent(
            formation.id,
          )}`}
          className="flex h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
        >
          Voir
        </Link>

        <Link
          href={`/admin/formations/${encodeURIComponent(
            formation.id,
          )}/modifier`}
          className="flex h-10 flex-1 items-center justify-center rounded-xl bg-slate-900 text-xs font-semibold text-white"
        >
          Modifier
        </Link>
      </div>
    </article>
  );
}

function FormationThumbnail({
  formation,
}: {
  formation: FormationListItem;
}) {
  return (
    <div className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      {formation.primaryImage ? (
        <Image
          src={formation.primaryImage}
          alt=""
          fill
          sizes="80px"
          className="object-cover"
        />
      ) : (
        <CourseIcon />
      )}
    </div>
  );
}

function PriceDisplay({
  formation,
}: {
  formation: FormationListItem;
}) {
  const hasPromotion =
    formation.promotionalPrice !== null &&
    formation.promotionalPrice !== undefined &&
    formation.promotionalPrice >= 0 &&
    formation.promotionalPrice < formation.price;

  return (
    <div>
      {hasPromotion ? (
        <>
          <p className="text-sm font-bold text-slate-900">
            {formatCurrency(
              formation.promotionalPrice!,
              formation.currency,
            )}
          </p>

          <p className="mt-0.5 text-xs text-slate-400 line-through">
            {formatCurrency(
              formation.price,
              formation.currency,
            )}
          </p>
        </>
      ) : (
        <p className="text-sm font-bold text-slate-900">
          {formatCurrency(
            formation.price,
            formation.currency,
          )}
        </p>
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: FormationStatus;
}) {
  const config = {
    published: {
      label: "Publiée",
      style:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },
    draft: {
      label: "Brouillon",
      style:
        "border-amber-100 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    },
    archived: {
      label: "Archivée",
      style:
        "border-slate-200 bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${config.style}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
      />

      {config.label}
    </span>
  );
}

function EmptyFormations() {
  return (
    <div className="flex min-h-[360px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <CourseIcon />
        </div>

        <h3 className="mt-5 text-base font-bold text-slate-900">
          Aucune formation
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Commencez par créer votre première formation
          AfriSkill AI. Elle pourra rester en brouillon jusqu&apos;à
          ce que son contenu soit prêt.
        </p>

        <Link
          href="/admin/formations/nouvelle"
          className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          <PlusIcon />
          Créer une formation
        </Link>
      </div>
    </div>
  );
}

function NoResults() {
  return (
    <div className="flex min-h-[260px] items-center justify-center p-8 text-center">
      <div>
        <p className="font-bold text-slate-800">
          Aucun résultat
        </p>

        <p className="mt-2 text-sm text-slate-400">
          Modifiez votre recherche ou votre filtre.
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

function formatCurrency(
  amount: number,
  currency: string,
) {
  const safeAmount =
    Number.isFinite(amount) && amount >= 0 ? amount : 0;

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency,
      maximumFractionDigits: currency === "XOF" ? 0 : 2,
    }).format(safeAmount);
  } catch {
    return `${formatNumber(safeAmount)} ${currency}`;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(
    Number.isFinite(value) ? Math.max(0, value) : 0,
  );
}

function formatDate(value: string | Date) {
  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

function CourseIcon() {
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
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M4 5.5v16" />
      <path d="M8 7h8" />
    </svg>
  );
}

function PlusIcon() {
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
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}