import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import ClientsTable, {
  type AdminClient,
} from "@/components/admin/clients/ClientsTable";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Clients",
  description:
    "Gestion des clients AfriSkill AI.",
};

export default async function AdminClientsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  /*
   * Sera remplacé par une requête Prisma.
   * Aucune donnée fictive.
   */
  const clients: AdminClient[] = [];

  const activeClients = clients.filter(
    (client) => client.status === "active",
  ).length;

  const totalOrders = clients.reduce(
    (sum, client) =>
      sum + Math.max(0, client.ordersCount),
    0,
  );

  const totalSpent = clients.reduce(
    (sum, client) =>
      sum + Math.max(0, client.totalSpent),
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
              <ClientsIcon />
              Communauté AfriSkill AI
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Gestion des clients
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
              Consultez les comptes clients, leurs
              commandes, leurs formations achetées et
              leur activité sur la plateforme.
            </p>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ClientStat
            label="Clients"
            value={formatNumber(
              clients.length,
            )}
            description="Comptes enregistrés"
          />

          <ClientStat
            label="Actifs"
            value={formatNumber(
              activeClients,
            )}
            description="Comptes actifs"
          />

          <ClientStat
            label="Commandes"
            value={formatNumber(
              totalOrders,
            )}
            description="Achats cumulés"
          />

          <ClientStat
            label="Valeur clients"
            value={formatCurrency(
              totalSpent,
              "XOF",
            )}
            description="Montant cumulé"
          />
        </section>

        <ClientsTable clients={clients} />
      </div>
    </AdminShell>
  );
}

function ClientStat({
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

function ClientsIcon() {
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
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}