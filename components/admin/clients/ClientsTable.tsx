"use client";

import Link from "next/link";
import {
  useMemo,
  useState,
} from "react";

export type AdminClientStatus =
  | "active"
  | "inactive"
  | "suspended";

export type AdminClient = {
  id: string;
  name: string;
  email: string;

  status: AdminClientStatus;

  ordersCount: number;
  formationsCount: number;

  totalSpent: number;
  currency: string;

  createdAt: string | Date;
  lastActivityAt?: string | Date | null;
};

type ClientsTableProps = {
  clients: AdminClient[];
};

export default function ClientsTable({
  clients,
}: ClientsTableProps) {
  const [search, setSearch] = useState("");

  const [status, setStatus] = useState<
    "all" | AdminClientStatus
  >("all");

  const filteredClients = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLocaleLowerCase("fr");

    return clients.filter((client) => {
      const matchesStatus =
        status === "all" ||
        client.status === status;

      const matchesSearch =
        !normalizedSearch ||
        client.name
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch) ||
        client.email
          .toLocaleLowerCase("fr")
          .includes(normalizedSearch);

      return (
        matchesStatus && matchesSearch
      );
    });
  }, [clients, search, status]);

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-bold text-slate-950">
            Tous les clients
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {clients.length} client
            {clients.length > 1 ? "s" : ""}{" "}
            enregistré
            {clients.length > 1 ? "s" : ""}.
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
              placeholder="Nom ou e-mail..."
              aria-label="Rechercher un client"
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 sm:w-[260px]"
            />
          </div>

          <select
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value as
                  | "all"
                  | AdminClientStatus,
              )
            }
            aria-label="Filtrer les clients"
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10"
          >
            <option value="all">
              Tous les statuts
            </option>

            <option value="active">
              Actifs
            </option>

            <option value="inactive">
              Inactifs
            </option>

            <option value="suspended">
              Suspendus
            </option>
          </select>
        </div>
      </div>

      {clients.length === 0 ? (
        <EmptyClients />
      ) : filteredClients.length === 0 ? (
        <NoResults />
      ) : (
        <>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[1050px] border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <TableHeader>
                    Client
                  </TableHeader>

                  <TableHeader>
                    Statut
                  </TableHeader>

                  <TableHeader>
                    Commandes
                  </TableHeader>

                  <TableHeader>
                    Formations
                  </TableHeader>

                  <TableHeader>
                    Dépenses
                  </TableHeader>

                  <TableHeader>
                    Inscription
                  </TableHeader>

                  <TableHeader>
                    <span className="sr-only">
                      Action
                    </span>
                  </TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredClients.map(
                  (client) => (
                    <ClientRow
                      key={client.id}
                      client={client}
                    />
                  ),
                )}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-slate-100 lg:hidden">
            {filteredClients.map(
              (client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                />
              ),
            )}
          </div>
        </>
      )}
    </section>
  );
}

function ClientRow({
  client,
}: {
  client: AdminClient;
}) {
  return (
    <tr className="transition hover:bg-slate-50/70">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <ClientAvatar
            name={client.name}
          />

          <div className="min-w-0">
            <Link
              href={`/admin/clients/${encodeURIComponent(
                client.id,
              )}`}
              className="block max-w-[220px] truncate text-sm font-bold text-slate-900 transition hover:text-blue-600"
            >
              {client.name}
            </Link>

            <p className="mt-0.5 max-w-[220px] truncate text-xs text-slate-400">
              {client.email}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4">
        <ClientStatusBadge
          status={client.status}
        />
      </td>

      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
        {formatNumber(
          client.ordersCount,
        )}
      </td>

      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
        {formatNumber(
          client.formationsCount,
        )}
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-900">
        {formatCurrency(
          client.totalSpent,
          client.currency,
        )}
      </td>

      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
        {formatDate(client.createdAt)}
      </td>

      <td className="px-6 py-4 text-right">
        <Link
          href={`/admin/clients/${encodeURIComponent(
            client.id,
          )}`}
          aria-label={`Voir ${client.name}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
        >
          <ChevronIcon />
        </Link>
      </td>
    </tr>
  );
}

function ClientCard({
  client,
}: {
  client: AdminClient;
}) {
  return (
    <Link
      href={`/admin/clients/${encodeURIComponent(
        client.id,
      )}`}
      className="block p-5 transition hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ClientAvatar
            name={client.name}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {client.name}
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-400">
              {client.email}
            </p>
          </div>
        </div>

        <ClientStatusBadge
          status={client.status}
        />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <MobileStat
          label="Commandes"
          value={formatNumber(
            client.ordersCount,
          )}
        />

        <MobileStat
          label="Formations"
          value={formatNumber(
            client.formationsCount,
          )}
        />

        <MobileStat
          label="Dépenses"
          value={formatCompactCurrency(
            client.totalSpent,
            client.currency,
          )}
        />
      </div>
    </Link>
  );
}

function ClientAvatar({
  name,
}: {
  name: string;
}) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 text-xs font-bold uppercase text-blue-700">
      {getInitials(name)}
    </div>
  );
}

function ClientStatusBadge({
  status,
}: {
  status: AdminClientStatus;
}) {
  const config: Record<
    AdminClientStatus,
    {
      label: string;
      className: string;
      dot: string;
    }
  > = {
    active: {
      label: "Actif",
      className:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },

    inactive: {
      label: "Inactif",
      className:
        "border-slate-200 bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    },

    suspended: {
      label: "Suspendu",
      className:
        "border-red-100 bg-red-50 text-red-700",
      dot: "bg-red-500",
    },
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-bold ${current.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${current.dot}`}
      />

      {current.label}
    </span>
  );
}

function MobileStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3">
      <p className="truncate text-[10px] font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-xs font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function EmptyClients() {
  return (
    <div className="flex min-h-[350px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <ClientsIcon />
        </div>

        <h3 className="mt-5 font-bold text-slate-900">
          Aucun client
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Les utilisateurs inscrits à AfriSkill AI
          apparaîtront automatiquement ici.
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
          Aucun client trouvé
        </p>

        <p className="mt-2 text-sm text-slate-400">
          Modifiez la recherche ou le filtre.
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

function formatCompactCurrency(
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
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(safeAmount);
  } catch {
    return `${formatNumber(
      safeAmount,
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

function ChevronIcon() {
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
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ClientsIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}