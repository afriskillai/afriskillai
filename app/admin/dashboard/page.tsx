import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

type DashboardStat = {
  title: string;
  value: string;
  description: string;
  icon: ReactNode;
  accent: "blue" | "gold" | "cyan" | "violet";
};

const dashboardStats: DashboardStat[] = [
  {
    title: "Chiffre d’affaires",
    value: "0 FCFA",
    description: "Revenus encaissés",
    icon: <RevenueIcon />,
    accent: "gold",
  },
  {
    title: "Commandes",
    value: "0",
    description: "Commandes enregistrées",
    icon: <OrderIcon />,
    accent: "blue",
  },
  {
    title: "Clients",
    value: "0",
    description: "Apprenants inscrits",
    icon: <UsersIcon />,
    accent: "cyan",
  },
  {
    title: "Formations",
    value: "0",
    description: "Formations publiées",
    icon: <CourseIcon />,
    accent: "violet",
  },
];

export default async function AdminDashboardPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  return (
    <AdminShell adminEmail={session.email}>
      <div className="space-y-7">
        {/* En-tête du contenu */}
        <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl"
            aria-hidden="true"
          />

          <div
            className="pointer-events-none absolute -bottom-32 right-40 h-64 w-64 rounded-full bg-amber-100/60 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Centre de gestion
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Bienvenue dans AfriSkill AI
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-500">
                Pilotez vos formations, vos ventes, vos clients et les
                contenus pédagogiques depuis votre espace administrateur.
              </p>
            </div>

            <Link
              href="/admin/formations/nouvelle"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#075ee8] px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#064fca]"
            >
              <PlusIcon />
              Ajouter une formation
            </Link>
          </div>
        </section>

        {/* Statistiques */}
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">
                Vue d&apos;ensemble
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Indicateurs principaux de la plateforme.
              </p>
            </div>

            <span className="hidden text-xs font-medium text-slate-400 sm:block">
              Données en temps réel après connexion de la base
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardStats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </div>
        </section>

        {/* Zone principale */}
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
          {/* Activité / graphique */}
          <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-950">
                  Évolution du chiffre d&apos;affaires
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Suivi des revenus de la plateforme.
                </p>
              </div>

              <div className="inline-flex w-fit rounded-xl bg-slate-100 p-1">
                <span className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                  30 jours
                </span>
              </div>
            </div>

            <div className="flex min-h-[330px] items-center justify-center p-6">
              <EmptyChart />
            </div>
          </section>

          {/* Actions rapides */}
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="font-bold text-slate-950">
                Actions rapides
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Accédez rapidement aux principales fonctions.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              <QuickAction
                href="/admin/formations/nouvelle"
                title="Nouvelle formation"
                description="Créer une formation"
                icon={<PlusIcon />}
                variant="blue"
              />

              <QuickAction
                href="/admin/formations"
                title="Gérer les formations"
                description="Catalogue et contenus"
                icon={<CourseIcon />}
                variant="gold"
              />

              <QuickAction
                href="/admin/commandes"
                title="Voir les commandes"
                description="Suivre les ventes"
                icon={<OrderIcon />}
                variant="cyan"
              />

              <QuickAction
                href="/admin/clients"
                title="Consulter les clients"
                description="Gérer les apprenants"
                icon={<UsersIcon />}
                variant="violet"
              />
            </div>
          </section>
        </div>

        {/* Commandes récentes */}
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-bold text-slate-950">
                Commandes récentes
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Derniers achats effectués sur AfriSkill AI.
              </p>
            </div>

            <Link
              href="/admin/commandes"
              className="shrink-0 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
            >
              Tout afficher
            </Link>
          </div>

          {/* Desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-left">
                  <TableHeader>Commande</TableHeader>
                  <TableHeader>Client</TableHeader>
                  <TableHeader>Formation</TableHeader>
                  <TableHeader>Montant</TableHeader>
                  <TableHeader>Statut</TableHeader>
                  <TableHeader>Date</TableHeader>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td colSpan={6}>
                    <EmptyOrders />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden">
            <EmptyOrders />
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
}: DashboardStat) {
  const styles = {
    blue: {
      icon: "bg-blue-50 text-blue-600",
      line: "from-blue-500 to-cyan-400",
    },
    gold: {
      icon: "bg-amber-50 text-amber-600",
      line: "from-amber-400 to-orange-500",
    },
    cyan: {
      icon: "bg-cyan-50 text-cyan-600",
      line: "from-cyan-400 to-blue-500",
    },
    violet: {
      icon: "bg-violet-50 text-violet-600",
      line: "from-violet-500 to-fuchsia-400",
    },
  }[accent];

  return (
    <article className="group relative overflow-hidden rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${styles.line}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1.5 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon}`}
        >
          {icon}
        </div>
      </div>
    </article>
  );
}

function QuickAction({
  href,
  title,
  description,
  icon,
  variant,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
  variant: "blue" | "gold" | "cyan" | "violet";
}) {
  const iconStyle = {
    blue: "bg-blue-50 text-blue-600",
    gold: "bg-amber-50 text-amber-600",
    cyan: "bg-cyan-50 text-cyan-600",
    violet: "bg-violet-50 text-violet-600",
  }[variant];

  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-2xl border border-slate-100 p-3 transition hover:border-slate-200 hover:bg-slate-50"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-800">
          {title}
        </p>

        <p className="mt-0.5 truncate text-xs text-slate-400">
          {description}
        </p>
      </div>

      <ArrowIcon />
    </Link>
  );
}

function EmptyChart() {
  return (
    <div className="w-full">
      <div className="relative h-[190px] overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
            backgroundSize: "64px 48px",
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative max-w-sm px-5 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <ChartIcon />
            </div>

            <p className="mt-4 text-sm font-bold text-slate-700">
              Aucune donnée de vente
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-400">
              Le graphique sera alimenté automatiquement dès les premières
              commandes payées.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between text-[11px] font-medium text-slate-400">
        <span>Début</span>
        <span>Aujourd&apos;hui</span>
      </div>
    </div>
  );
}

function EmptyOrders() {
  return (
    <div className="flex min-h-[220px] items-center justify-center px-6 py-10">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
          <OrderIcon />
        </div>

        <p className="mt-4 text-sm font-bold text-slate-800">
          Aucune commande pour le moment
        </p>

        <p className="mt-1.5 text-xs leading-5 text-slate-400">
          Les nouvelles commandes apparaîtront automatiquement ici après
          l&apos;ouverture des ventes.
        </p>
      </div>
    </div>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-400">
      {children}
    </th>
  );
}

function BaseIcon({
  children,
  size = 20,
}: {
  children: ReactNode;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
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

function OrderIcon() {
  return (
    <BaseIcon>
      <path d="M6 3h12l2 4v14H4V7Z" />
      <path d="M4 7h16" />
      <path d="M9 11a3 3 0 0 0 6 0" />
    </BaseIcon>
  );
}

function UsersIcon() {
  return (
    <BaseIcon>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.5a3 3 0 0 1 0 5.5" />
      <path d="M17 14.5a5 5 0 0 1 3.5 5" />
    </BaseIcon>
  );
}

function CourseIcon() {
  return (
    <BaseIcon>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M4 5.5v16" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </BaseIcon>
  );
}

function ChartIcon() {
  return (
    <BaseIcon size={22}>
      <path d="M4 20V10" />
      <path d="M10 20V4" />
      <path d="M16 20v-7" />
      <path d="M22 20H2" />
    </BaseIcon>
  );
}

function PlusIcon() {
  return (
    <BaseIcon size={18}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </BaseIcon>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}