import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

type PageProps = Readonly<{
  params: Promise<{
    formationId: string;
  }>;
}>;

type FormationDetail = {
  id: string;

  title: string;
  shortDescription: string | null;
  description: string;

  price: number;
  promotionalPrice: number | null;
  currency: string;

  status: "draft" | "published" | "archived";

  primaryImage: string | null;
  secondaryImage: string | null;

  salesCount: number;
  modulesCount: number;
  lessonsCount: number;

  createdAt: Date;
  updatedAt: Date;
};

export default async function FormationDetailPage({
  params,
}: PageProps) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  const { formationId } = await params;

  const normalizedFormationId =
    safeDecodeURIComponent(formationId).trim();

  if (!normalizedFormationId) {
    redirect("/admin/formations");
  }

  /*
   * Cette fonction sera remplacée par la requête Prisma
   * lorsque la lecture réelle des formations sera branchée.
   */
  const formation = await getFormation(
    normalizedFormationId,
  );

  return (
    <AdminShell adminEmail={session.email}>
      {!formation ? (
        <UnavailableFormation
          formationId={normalizedFormationId}
        />
      ) : (
        <FormationDetailView
          formation={formation}
        />
      )}
    </AdminShell>
  );
}

async function getFormation(
  formationId: string,
): Promise<FormationDetail | null> {
  /*
   * Aucun faux contenu n'est injecté.
   *
   * L'identifiant reçu ici est déjà décodé,
   * normalisé et validé.
   *
   * La lecture réelle sera branchée ici avec Prisma.
   */
  void formationId;

  return null;
}

function FormationDetailView({
  formation,
}: Readonly<{
  formation: FormationDetail;
}>) {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/formations"
          className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <BackIcon />
          Retour aux formations
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
          <div className="min-w-0">
            <StatusBadge
              status={formation.status}
            />

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {formation.title}
            </h1>

            {formation.shortDescription ? (
              <p className="mt-3 max-w-3xl leading-7 text-slate-500">
                {formation.shortDescription}
              </p>
            ) : null}

            <p className="mt-3 break-all text-xs text-slate-400">
              ID : {formation.id}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Link
              href={`/admin/formations/${encodeURIComponent(
                formation.id,
              )}/contenu`}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Gérer le contenu
            </Link>

            <Link
              href={`/admin/formations/${encodeURIComponent(
                formation.id,
              )}/modifier`}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Modifier
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          label="Prix actuel"
          value={formatCurrency(
            formation.promotionalPrice ??
              formation.price,
            formation.currency,
          )}
        />

        <InfoCard
          label="Ventes"
          value={formatNumber(
            formation.salesCount,
          )}
        />

        <InfoCard
          label="Modules"
          value={formatNumber(
            formation.modulesCount,
          )}
        />

        <InfoCard
          label="Leçons"
          value={formatNumber(
            formation.lessonsCount,
          )}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.7fr)]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-950">
            Description
          </h2>

          <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-600">
            {formation.description}
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-950">
            Informations
          </h2>

          <dl className="mt-5 divide-y divide-slate-100">
            <DetailRow
              label="Prix normal"
              value={formatCurrency(
                formation.price,
                formation.currency,
              )}
            />

            <DetailRow
              label="Prix promotionnel"
              value={
                formation.promotionalPrice !== null
                  ? formatCurrency(
                      formation.promotionalPrice,
                      formation.currency,
                    )
                  : "Aucun"
              }
            />

            <DetailRow
              label="Devise"
              value={formation.currency}
            />

            <DetailRow
              label="Créée le"
              value={formatDate(
                formation.createdAt,
              )}
            />

            <DetailRow
              label="Dernière modification"
              value={formatDate(
                formation.updatedAt,
              )}
            />
          </dl>
        </section>
      </div>

      {(formation.primaryImage ||
        formation.secondaryImage) && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-950">
            Images de la formation
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Les références des images enregistrées sont
            disponibles pour cette formation.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {formation.primaryImage ? (
              <ImageReference
                label="Image principale"
                value={formation.primaryImage}
              />
            ) : null}

            {formation.secondaryImage ? (
              <ImageReference
                label="Image secondaire"
                value={formation.secondaryImage}
              />
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

function UnavailableFormation({
  formationId,
}: Readonly<{
  formationId: string;
}>) {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/formations"
        className="inline-flex items-center gap-2 rounded-lg text-sm font-semibold text-slate-500 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <BackIcon />
        Retour aux formations
      </Link>

      <section className="flex min-h-[480px] items-center justify-center rounded-[26px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <CourseIcon />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Formation non disponible
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            La lecture des formations sera activée lorsque
            la base de données AfriSkill AI sera connectée.
            Aucune donnée fictive n&apos;est affichée.
          </p>

          {formationId ? (
            <p className="mt-3 break-all text-xs text-slate-400">
              Référence demandée : {formationId}
            </p>
          ) : null}

          <Link
            href="/admin/formations"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Revenir aux formations
          </Link>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-950">
        {value}
      </p>
    </article>
  );
}

function DetailRow({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <dt className="text-sm text-slate-500">
        {label}
      </dt>

      <dd className="text-right text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function ImageReference({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-all text-xs leading-5 text-slate-500">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: Readonly<{
  status: FormationDetail["status"];
}>) {
  const config = {
    published: {
      label: "Publiée",
      className:
        "border-emerald-100 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
    },

    draft: {
      label: "Brouillon",
      className:
        "border-amber-100 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
    },

    archived: {
      label: "Archivée",
      className:
        "border-slate-200 bg-slate-100 text-slate-600",
      dot: "bg-slate-400",
    },
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${config.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
        aria-hidden="true"
      />

      {config.label}
    </span>
  );
}

function formatCurrency(
  amount: number,
  currency: string,
) {
  const normalizedCurrency =
    currency.trim().toUpperCase();

  if (!normalizedCurrency) {
    return formatNumber(amount);
  }

  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: normalizedCurrency,
      maximumFractionDigits:
        normalizedCurrency === "XOF" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${formatNumber(
      amount,
    )} ${normalizedCurrency}`;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fr-FR").format(
    Math.max(0, value),
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
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

function BackIcon() {
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
      aria-hidden="true"
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

function CourseIcon() {
  return (
    <svg
      width="25"
      height="25"
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
      <path d="M8 11h6" />
    </svg>
  );
}