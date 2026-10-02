import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Accompagnements",
  description:
    "Gestion des demandes d’accompagnement AfriSkill AI.",
};

type SupportStatus =
  | "pending"
  | "in_progress"
  | "resolved"
  | "closed";

type SupportPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

type SupportRequest = {
  id: string;
  subject: string;
  message: string | null;

  status: SupportStatus;
  priority: SupportPriority;

  customer: {
    id: string;
    name: string;
    email: string;
  };

  formation: {
    id: string;
    title: string;
  } | null;

  createdAt: Date;
  updatedAt: Date;
};

export default async function AccompagnementsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  /*
   * À remplacer par une requête Prisma lorsque
   * la base de données sera connectée.
   *
   * Aucune demande fictive n'est affichée.
   */
  const requests: SupportRequest[] = [];

  const pendingCount = requests.filter(
    (request) => request.status === "pending",
  ).length;

  const inProgressCount = requests.filter(
    (request) =>
      request.status === "in_progress",
  ).length;

  const resolvedCount = requests.filter(
    (request) =>
      request.status === "resolved",
  ).length;

  return (
    <AdminShell adminEmail={session.email}>
      <div className="space-y-6">
        {/* Hero */}
        <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 left-1/3 h-52 w-52 rounded-full bg-cyan-100/50 blur-3xl"
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <SupportIcon />
              Suivi des apprenants
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Accompagnements
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
              Centralisez les demandes d’aide des
              apprenants et suivez leur traitement
              depuis l’espace administrateur
              AfriSkill AI.
            </p>
          </div>
        </section>

        {/* Statistiques */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SupportStat
            label="Demandes"
            value={requests.length}
            description="Total enregistré"
            icon={<InboxIcon />}
          />

          <SupportStat
            label="En attente"
            value={pendingCount}
            description="À prendre en charge"
            icon={<ClockIcon />}
          />

          <SupportStat
            label="En cours"
            value={inProgressCount}
            description="Traitement en cours"
            icon={<ProgressIcon />}
          />

          <SupportStat
            label="Résolues"
            value={resolvedCount}
            description="Demandes traitées"
            icon={<CheckIcon />}
          />
        </section>

        {/* Liste */}
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:p-6">
            <div>
              <h2 className="font-bold text-slate-950">
                Demandes d’accompagnement
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Suivi des demandes envoyées par les
                apprenants.
              </p>
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">
              <InboxIcon />
              {formatNumber(requests.length)} demande
              {requests.length > 1 ? "s" : ""}
            </span>
          </div>

          {requests.length === 0 ? (
            <EmptySupport />
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map((request) => (
                <SupportRow
                  key={request.id}
                  request={request}
                />
              ))}
            </div>
          )}
        </section>

        {/* Fonctionnement */}
        <section className="grid gap-4 lg:grid-cols-3">
          <WorkflowCard
            number="01"
            title="Réception"
            description="L’apprenant transmet une demande depuis son espace personnel ou depuis une formation."
          />

          <WorkflowCard
            number="02"
            title="Prise en charge"
            description="L’administration identifie la demande, sa priorité et la formation concernée."
          />

          <WorkflowCard
            number="03"
            title="Résolution"
            description="La demande est traitée puis marquée comme résolue lorsque l’accompagnement est terminé."
          />
        </section>

        <section className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <ShieldIcon />
            </div>

            <div>
              <h2 className="text-sm font-bold text-blue-950">
                Accompagnement sécurisé
              </h2>

              <p className="mt-1 max-w-4xl text-xs leading-6 text-blue-800/70 sm:text-sm">
                Les échanges d’accompagnement peuvent
                contenir des informations liées au compte
                et aux formations achetées. Leur accès
                doit rester limité aux utilisateurs et
                administrateurs autorisés.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function SupportRow({
  request,
}: {
  request: SupportRequest;
}) {
  return (
    <article className="p-5 transition hover:bg-slate-50/70 sm:p-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <SupportStatusBadge
              status={request.status}
            />

            <PriorityBadge
              priority={request.priority}
            />
          </div>

          <h3 className="mt-3 font-bold text-slate-900">
            {request.subject}
          </h3>

          {request.message ? (
            <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-500">
              {request.message}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
            <Link
              href={`/admin/clients/${encodeURIComponent(
                request.customer.id,
              )}`}
              className="font-semibold text-blue-600 transition hover:text-blue-700"
            >
              {request.customer.name}
            </Link>

            <span>{request.customer.email}</span>

            {request.formation ? (
              <Link
                href={`/admin/formations/${encodeURIComponent(
                  request.formation.id,
                )}`}
                className="font-semibold text-slate-600 transition hover:text-blue-600"
              >
                {request.formation.title}
              </Link>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 text-left lg:text-right">
          <p className="text-xs font-medium text-slate-500">
            {formatDateTime(request.createdAt)}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Mise à jour{" "}
            {formatDateTime(request.updatedAt)}
          </p>
        </div>
      </div>
    </article>
  );
}

function SupportStat({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {formatNumber(value)}
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

function WorkflowCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <span className="text-xs font-bold text-blue-600">
        {number}
      </span>

      <h2 className="mt-2 font-bold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </article>
  );
}

function SupportStatusBadge({
  status,
}: {
  status: SupportStatus;
}) {
  const config: Record<
    SupportStatus,
    { label: string; style: string }
  > = {
    pending: {
      label: "En attente",
      style:
        "border-amber-100 bg-amber-50 text-amber-700",
    },

    in_progress: {
      label: "En cours",
      style:
        "border-blue-100 bg-blue-50 text-blue-700",
    },

    resolved: {
      label: "Résolue",
      style:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
    },

    closed: {
      label: "Fermée",
      style:
        "border-slate-200 bg-slate-100 text-slate-600",
    },
  };

  const current = config[status];

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${current.style}`}
    >
      {current.label}
    </span>
  );
}

function PriorityBadge({
  priority,
}: {
  priority: SupportPriority;
}) {
  const config: Record<
    SupportPriority,
    { label: string; style: string }
  > = {
    low: {
      label: "Faible",
      style: "bg-slate-100 text-slate-500",
    },

    normal: {
      label: "Normale",
      style: "bg-blue-50 text-blue-600",
    },

    high: {
      label: "Élevée",
      style: "bg-orange-50 text-orange-600",
    },

    urgent: {
      label: "Urgente",
      style: "bg-red-50 text-red-600",
    },
  };

  const current = config[priority];

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${current.style}`}
    >
      {current.label}
    </span>
  );
}

function EmptySupport() {
  return (
    <div className="flex min-h-[350px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
          <SupportLargeIcon />
        </div>

        <h3 className="mt-5 font-bold text-slate-900">
          Aucune demande d’accompagnement
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Les demandes envoyées par les apprenants
          apparaîtront ici dès que le système sera
          connecté à la base de données.
        </p>
      </div>
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

function formatDateTime(value: Date) {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

function SupportIcon() {
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
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
    </svg>
  );
}

function SupportLargeIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      <path d="M8 9h8" />
      <path d="M8 13h5" />
    </svg>
  );
}

function InboxIcon() {
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
      <path d="M4 4h16v16H4Z" />
      <path d="M4 14h4l2 3h4l2-3h4" />
    </svg>
  );
}

function ClockIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function ProgressIcon() {
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
      <path d="M12 3a9 9 0 1 0 9 9" />
      <path d="M12 3v9h9" />
    </svg>
  );
}

function CheckIcon() {
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
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12 2.5 2.5L16 9" />
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