import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Détail du client",
};

type PageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

type ClientStatus =
  | "active"
  | "inactive"
  | "suspended";

type ClientDetail = {
  id: string;
  name: string;
  email: string;

  status: ClientStatus;

  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date | null;

  ordersCount: number;
  formationsCount: number;

  totalSpent: number;
  currency: string;

  orders: Array<{
    id: string;
    reference: string;
    amount: number;
    currency: string;
    status:
      | "paid"
      | "pending"
      | "failed"
      | "refunded"
      | "cancelled";
    createdAt: Date;
  }>;

  enrollments: Array<{
    id: string;
    formationId: string;
    formationTitle: string;
    enrolledAt: Date;
  }>;
};

export default async function ClientDetailPage({
  params,
}: PageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  const { clientId } = await params;

  const normalizedClientId =
    safeDecodeURIComponent(clientId).trim();

  if (!normalizedClientId) {
    redirect("/admin/clients");
  }

  const client = await getClientById(
    normalizedClientId,
  );

  return (
    <AdminShell adminEmail={session.email}>
      {client ? (
        <ClientDetailView client={client} />
      ) : (
        <ClientUnavailable
          clientId={normalizedClientId}
        />
      )}
    </AdminShell>
  );
}

async function getClientById(
  clientId: string,
): Promise<ClientDetail | null> {
  /*
   * Ce paramètre sera utilisé par la requête Prisma
   * réelle lorsque le chargement des clients sera
   * connecté à la base de données.
   *
   * Pour le moment, aucune donnée fictive n'est
   * retournée.
   */
  void clientId;

  return null;
}

function ClientDetailView({
  client,
}: {
  client: ClientDetail;
}) {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
      >
        <BackIcon />
        Retour aux clients
      </Link>

      <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl"
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-blue-50 to-cyan-50 text-lg font-bold text-blue-700">
              {getInitials(client.name)}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="truncate text-2xl font-bold text-slate-950 sm:text-3xl">
                  {client.name}
                </h1>

                <ClientStatusBadge
                  status={client.status}
                />
              </div>

              <p className="mt-2 truncate text-sm text-slate-500">
                {client.email}
              </p>

              <p className="mt-1 break-all text-xs text-slate-400">
                ID : {client.id}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4">
            <p className="text-xs text-slate-400">
              Client depuis
            </p>

            <p className="mt-1 font-bold text-slate-800">
              {formatDate(client.createdAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Commandes"
          value={formatNumber(
            client.ordersCount,
          )}
        />

        <StatCard
          label="Formations"
          value={formatNumber(
            client.formationsCount,
          )}
        />

        <StatCard
          label="Dépenses"
          value={formatCurrency(
            client.totalSpent,
            client.currency,
          )}
        />

        <StatCard
          label="Dernière activité"
          value={
            client.lastActivityAt
              ? formatDate(
                  client.lastActivityAt,
                )
              : "—"
          }
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.7fr)]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <h2 className="font-bold text-slate-950">
                Commandes récentes
              </h2>
            </div>

            {client.orders.length === 0 ? (
              <EmptySection message="Aucune commande enregistrée pour ce client." />
            ) : (
              <div className="divide-y divide-slate-100">
                {client.orders.map(
                  (order) => (
                    <Link
                      key={order.id}
                      href={`/admin/commandes/${encodeURIComponent(
                        order.id,
                      )}`}
                      className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50 sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {order.reference}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(
                            order.createdAt,
                          )}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-900">
                        {formatCurrency(
                          order.amount,
                          order.currency,
                        )}
                      </p>
                    </Link>
                  ),
                )}
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <h2 className="font-bold text-slate-950">
                Formations accessibles
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Formations associées aux
                inscriptions validées.
              </p>
            </div>

            {client.enrollments.length === 0 ? (
              <EmptySection message="Aucune formation accessible." />
            ) : (
              <div className="divide-y divide-slate-100">
                {client.enrollments.map(
                  (enrollment) => (
                    <Link
                      key={enrollment.id}
                      href={`/admin/formations/${encodeURIComponent(
                        enrollment.formationId,
                      )}`}
                      className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50 sm:px-6"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {
                            enrollment.formationTitle
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Accès depuis le{" "}
                          {formatDate(
                            enrollment.enrolledAt,
                          )}
                        </p>
                      </div>

                      <ArrowIcon />
                    </Link>
                  ),
                )}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-950">
              Informations du compte
            </h2>

            <dl className="mt-5 divide-y divide-slate-100">
              <DetailRow
                label="Nom"
                value={client.name}
              />

              <DetailRow
                label="E-mail"
                value={client.email}
              />

              <DetailRow
                label="Inscription"
                value={formatDateTime(
                  client.createdAt,
                )}
              />

              <DetailRow
                label="Mise à jour"
                value={formatDateTime(
                  client.updatedAt,
                )}
              />
            </dl>
          </section>

          <section className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <ShieldIcon />
              </div>

              <div>
                <h2 className="text-sm font-bold text-blue-950">
                  Données protégées
                </h2>

                <p className="mt-1 text-xs leading-5 text-blue-800/70">
                  Les informations du client doivent
                  rester accessibles uniquement aux
                  fonctions administratives autorisées.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ClientUnavailable({
  clientId,
}: {
  clientId: string;
}) {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
      >
        <BackIcon />
        Retour aux clients
      </Link>

      <section className="flex min-h-[500px] items-center justify-center rounded-[26px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ClientIcon />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Client non disponible
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            Le compte demandé ne peut pas encore être
            chargé. Les informations réelles seront
            récupérées depuis Prisma une fois la base
            connectée.
          </p>

          <p className="mt-3 break-all text-xs text-slate-400">
            Référence : {clientId}
          </p>

          <Link
            href="/admin/clients"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white"
          >
            Tous les clients
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 truncate text-xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 py-3.5">
      <dt className="text-sm text-slate-500">
        {label}
      </dt>

      <dd className="max-w-[65%] break-words text-right text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function EmptySection({
  message,
}: {
  message: string;
}) {
  return (
    <div className="p-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function ClientStatusBadge({
  status,
}: {
  status: ClientStatus;
}) {
  const config: Record<
    ClientStatus,
    {
      label: string;
      style: string;
    }
  > = {
    active: {
      label: "Actif",
      style:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
    },
    inactive: {
      label: "Inactif",
      style:
        "border-slate-200 bg-slate-100 text-slate-600",
    },
    suspended: {
      label: "Suspendu",
      style:
        "border-red-100 bg-red-50 text-red-700",
    },
  };

  const current = config[status];

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${current.style}`}
    >
      {current.label}
    </span>
  );
}

function safeDecodeURIComponent(
  value: string,
) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function BackIcon() {
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
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="shrink-0 text-slate-400"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ClientIcon() {
  return (
    <svg
      width="27"
      height="27"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function ShieldIcon() {
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
      <path d="m9.5 12 1.5 1.5 3.5-4" />
    </svg>
  );
}