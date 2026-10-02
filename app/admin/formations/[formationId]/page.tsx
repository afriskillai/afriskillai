import type { Metadata } from "next";

import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import DeleteFormationButton from "@/components/admin/formations/DeleteFormationButton";
import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Détail de la formation",
};

type PageProps = {
  params: Promise<{
    formationId: string;
  }>;
};

type FormationStatus =
  | "draft"
  | "published"
  | "archived";

type FormationDetail = {
  id: string;
  title: string;
  shortDescription: string | null;
  description: string;

  price: number;
  promotionalPrice: number | null;
  currency: string;

  status: FormationStatus;
  publishedAt: Date | null;

  primaryImage: string | null;
  secondaryImage: string | null;

  hasPrivatePdf: boolean;
  privatePdfName: string | null;
  privatePdfSize: number | null;
  hasPrivateAccessUrl: boolean;

  salesCount: number;
  studentsCount: number;
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

  const formation = await getFormationById(
    normalizedFormationId,
  );

  return (
    <AdminShell adminEmail={session.email}>
      {formation ? (
        <FormationDetailView
          formation={formation}
        />
      ) : (
        <FormationUnavailable
          formationId={normalizedFormationId}
        />
      )}
    </AdminShell>
  );
}

/**
 * Charge la formation directement depuis PostgreSQL via Prisma.
 *
 * Les contenus privés ne sont jamais exposés ici :
 * - le chemin Supabase du PDF n'est pas retourné ;
 * - le lien privé n'est pas retourné ;
 * - seule leur présence est affichée à l'administrateur.
 */
async function getFormationById(
  formationId: string,
): Promise<FormationDetail | null> {
  const course = await db.course.findUnique({
    where: {
      id: formationId,
    },

    select: {
      id: true,
      title: true,
      shortDescription: true,
      description: true,

      price: true,
      promotionalPrice: true,
      currency: true,

      status: true,
      publishedAt: true,

      privatePdfPath: true,
      privatePdfName: true,
      privatePdfSize: true,
      privateAccessUrl: true,

      createdAt: true,
      updatedAt: true,

      images: {
        select: {
          type: true,
          url: true,
          position: true,
        },

        orderBy: {
          position: "asc",
        },
      },

      modules: {
        select: {
          id: true,

          lessons: {
            select: {
              id: true,
            },
          },
        },

        orderBy: {
          position: "asc",
        },
      },

      orderItems: {
        where: {
          order: {
            status: "PAID",
          },
        },

        select: {
          quantity: true,
        },
      },

      enrollments: {
        where: {
          status: {
            in: ["ACTIVE", "COMPLETED"],
          },
        },

        select: {
          id: true,
        },
      },
    },
  });

  if (!course) {
    return null;
  }

  const primaryImage =
    course.images.find(
      (image) => image.type === "PRIMARY",
    )?.url ?? null;

  const secondaryImage =
    course.images.find(
      (image) => image.type === "SECONDARY",
    )?.url ?? null;

  const salesCount = course.orderItems.reduce(
    (total, item) =>
      total + Math.max(0, item.quantity),
    0,
  );

  const lessonsCount = course.modules.reduce(
    (total, module) =>
      total + module.lessons.length,
    0,
  );

  return {
    id: course.id,
    title: course.title,
    shortDescription:
      course.shortDescription,
    description: course.description,

    price: course.price,
    promotionalPrice:
      course.promotionalPrice,
    currency: course.currency,

    status: mapCourseStatus(course.status),
    publishedAt: course.publishedAt,

    primaryImage,
    secondaryImage,

    hasPrivatePdf: Boolean(
      course.privatePdfPath,
    ),
    privatePdfName: course.privatePdfName,
    privatePdfSize: course.privatePdfSize,
    hasPrivateAccessUrl: Boolean(
      course.privateAccessUrl,
    ),

    salesCount,
    studentsCount:
      course.enrollments.length,
    modulesCount: course.modules.length,
    lessonsCount,

    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
  };
}

function FormationDetailView({
  formation,
}: {
  formation: FormationDetail;
}) {
  const currentPrice =
    formation.promotionalPrice !== null &&
    formation.promotionalPrice >= 0 &&
    formation.promotionalPrice <
      formation.price
      ? formation.promotionalPrice
      : formation.price;

  return (
    <div className="space-y-6">
      {/* =========================================================
          FIL D'ARIANE
          ========================================================= */}

      <nav
        aria-label="Fil d’Ariane"
        className="flex flex-wrap items-center gap-2 text-sm"
      >
        <Link
          href="/admin/formations"
          className="font-medium text-slate-500 transition hover:text-blue-600"
        >
          Formations
        </Link>

        <ChevronRightIcon />

        <span
          aria-current="page"
          className="max-w-[320px] truncate font-semibold text-slate-900"
        >
          {formation.title}
        </span>
      </nav>

      {/* =========================================================
          EN-TÊTE
          ========================================================= */}

      <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl"
        />

        <div className="relative">
          <Link
            href="/admin/formations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <BackIcon />
            Retour aux formations
          </Link>

          <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div className="min-w-0 max-w-4xl">
              <StatusBadge
                status={formation.status}
              />

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl lg:text-[34px]">
                {formation.title}
              </h1>

              {formation.shortDescription ? (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
                  {formation.shortDescription}
                </p>
              ) : (
                <p className="mt-3 text-sm italic text-slate-400">
                  Aucune courte description.
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                <span>
                  Créée le{" "}
                  {formatDate(
                    formation.createdAt,
                  )}
                </span>

                <span>
                  Mise à jour le{" "}
                  {formatDate(
                    formation.updatedAt,
                  )}
                </span>

                <span className="break-all">
                  ID : {formation.id}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href={`/admin/formations/${encodeURIComponent(
                  formation.id,
                )}/contenu`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
              >
                <ContentIcon />
                Gérer le contenu
              </Link>

              <Link
                href={`/admin/formations/${encodeURIComponent(
                  formation.id,
                )}/modifier`}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-900/10 transition hover:bg-slate-800"
              >
                <EditIcon />
                Modifier
              </Link>

              <DeleteFormationButton
                formationId={formation.id}
                formationTitle={formation.title}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================
          STATISTIQUES
          ========================================================= */}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Prix actuel"
          value={formatCurrency(
            currentPrice,
            formation.currency,
          )}
          description={
            formation.promotionalPrice !==
              null &&
            currentPrice ===
              formation.promotionalPrice
              ? "Tarif promotionnel actif"
              : "Tarif normal"
          }
        />

        <StatCard
          label="Ventes"
          value={formatNumber(
            formation.salesCount,
          )}
          description="Unités issues de commandes payées"
        />

        <StatCard
          label="Apprenants"
          value={formatNumber(
            formation.studentsCount,
          )}
          description="Accès actifs ou terminés"
        />

        <StatCard
          label="Programme"
          value={`${formatNumber(
            formation.modulesCount,
          )} module${
            formation.modulesCount > 1
              ? "s"
              : ""
          }`}
          description={`${formatNumber(
            formation.lessonsCount,
          )} leçon${
            formation.lessonsCount > 1
              ? "s"
              : ""
          }`}
        />
      </section>

      {/* =========================================================
          CONTENU PRINCIPAL
          ========================================================= */}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.75fr)]">
        <div className="space-y-6">
          {/* IMAGES */}

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="border-b border-slate-100 pb-5">
              <h2 className="text-base font-bold text-slate-950">
                Images de présentation
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Images réellement enregistrées
                pour cette formation.
              </p>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <FormationImage
                label="Image principale"
                url={
                  formation.primaryImage
                }
              />

              <FormationImage
                label="Image secondaire"
                url={
                  formation.secondaryImage
                }
              />
            </div>
          </section>

          {/* DESCRIPTION */}

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="border-b border-slate-100 pb-5">
              <h2 className="text-base font-bold text-slate-950">
                Description complète
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Présentation commerciale de la
                formation.
              </p>
            </div>

            <div className="mt-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-600">
              {formation.description ||
                "Aucune description complète."}
            </div>
          </section>

          {/* PROGRAMME */}

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-950">
                  Contenu pédagogique
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Modules et leçons enregistrés
                  dans la base.
                </p>
              </div>

              <Link
                href={`/admin/formations/${encodeURIComponent(
                  formation.id,
                )}/contenu`}
                className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-50 px-4 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
              >
                Gérer le contenu
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ProgramStat
                value={
                  formation.modulesCount
                }
                label="Modules"
              />

              <ProgramStat
                value={
                  formation.lessonsCount
                }
                label="Leçons"
              />
            </div>

            {formation.modulesCount ===
            0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-sm font-bold text-slate-800">
                  Aucun module ajouté
                </p>

                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-400">
                  Le PDF privé et le lien
                  privé de livraison sont
                  indépendants des modules
                  pédagogiques.
                </p>
              </div>
            ) : null}
          </section>
        </div>

        {/* =======================================================
            COLONNE DROITE
            ======================================================= */}

        <div className="space-y-6">
          {/* TARIFICATION */}

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-950">
              Tarification
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
                label="Promotion"
                value={
                  formation.promotionalPrice !==
                  null
                    ? formatCurrency(
                        formation.promotionalPrice,
                        formation.currency,
                      )
                    : "Aucune"
                }
              />

              <DetailRow
                label="Devise"
                value={
                  formation.currency
                }
              />
            </dl>
          </section>

          {/* LIVRAISON PRIVÉE */}

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-950">
              Livraison privée
            </h2>

            <div className="mt-5 space-y-3">
              <DeliveryState
                label="PDF privé"
                available={
                  formation.hasPrivatePdf
                }
                detail={
                  formation.privatePdfName ??
                  "Aucun PDF enregistré"
                }
              />

              <DeliveryState
                label="Lien privé"
                available={
                  formation.hasPrivateAccessUrl
                }
                detail={
                  formation.hasPrivateAccessUrl
                    ? "Lien privé configuré"
                    : "Aucun lien configuré"
                }
              />
            </div>

            {formation.hasPrivatePdf &&
            formation.privatePdfSize !==
              null ? (
              <p className="mt-4 text-xs text-slate-400">
                Taille du PDF :{" "}
                {formatFileSize(
                  formation.privatePdfSize,
                )}
              </p>
            ) : null}

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Le chemin du PDF et le lien
              privé ne sont pas affichés sur
              cette page. Ils restent protégés
              et sont destinés à la livraison
              après paiement confirmé.
            </p>
          </section>

          {/* PUBLICATION */}

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-slate-950">
              Publication
            </h2>

            <div className="mt-5">
              <StatusBadge
                status={formation.status}
              />
            </div>

            <p className="mt-4 text-xs leading-6 text-slate-500">
              {getStatusDescription(
                formation.status,
              )}
            </p>

            {formation.publishedAt ? (
              <p className="mt-3 text-xs font-medium text-slate-400">
                Publication :{" "}
                {formatDate(
                  formation.publishedAt,
                )}
              </p>
            ) : null}
          </section>

          {/* SÉCURITÉ */}

          <section className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                <ShieldIcon />
              </div>

              <div>
                <h2 className="text-sm font-bold text-blue-950">
                  Accès protégé
                </h2>

                <p className="mt-1 text-xs leading-5 text-blue-800/70">
                  Les contenus privés ne
                  doivent être délivrés
                  qu&apos;après confirmation
                  serveur du paiement et
                  création de l&apos;accès
                  client.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function FormationImage({
  label,
  url,
}: {
  label: string;
  url: string | null;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
        {url ? (
          <Image
            src={url}
            alt={label}
            fill
            unoptimized
            sizes="(max-width: 768px) 100vw, 520px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-sm font-medium text-slate-400">
            Aucune image enregistrée
          </div>
        )}
      </div>
    </div>
  );
}

function DeliveryState({
  label,
  available,
  detail,
}: {
  label: string;
  available: boolean;
  detail: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-700">
          {label}
        </p>

        <p className="mt-1 truncate text-xs text-slate-400">
          {detail}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
          available
            ? "bg-emerald-100 text-emerald-700"
            : "bg-slate-200 text-slate-500"
        }`}
      >
        {available
          ? "Configuré"
          : "Absent"}
      </span>
    </div>
  );
}

function FormationUnavailable({
  formationId,
}: {
  formationId: string;
}) {
  return (
    <div className="space-y-6">
      <nav
        aria-label="Fil d’Ariane"
        className="flex items-center gap-2 text-sm"
      >
        <Link
          href="/admin/formations"
          className="font-medium text-slate-500 transition hover:text-blue-600"
        >
          Formations
        </Link>

        <ChevronRightIcon />

        <span className="font-semibold text-slate-900">
          Détail
        </span>
      </nav>

      <section className="flex min-h-[500px] items-center justify-center rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="max-w-lg text-center">
          <h1 className="text-xl font-bold text-slate-950 sm:text-2xl">
            Formation introuvable
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            Aucune formation correspondant à
            cette référence n&apos;existe dans
            la base de données.
          </p>

          <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
              Référence demandée
            </p>

            <p className="mt-1 break-all text-xs font-semibold text-slate-600">
              {formationId}
            </p>
          </div>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/admin/formations"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Toutes les formations
            </Link>

            <Link
              href="/admin/formations/nouvelle"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Nouvelle formation
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
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
      <p className="text-xs font-medium text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </article>
  );
}

function ProgramStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-2xl font-bold text-slate-950">
        {formatNumber(value)}
      </p>

      <p className="mt-1 text-xs font-medium text-slate-500">
        {label}
      </p>
    </div>
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

function StatusBadge({
  status,
}: {
  status: FormationStatus;
}) {
  const config: Record<
    FormationStatus,
    {
      label: string;
      className: string;
      dot: string;
    }
  > = {
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
  };

  const current = config[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${current.className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${current.dot}`}
      />

      {current.label}
    </span>
  );
}

function mapCourseStatus(
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "ARCHIVED",
): FormationStatus {
  if (status === "PUBLISHED") {
    return "published";
  }

  if (status === "ARCHIVED") {
    return "archived";
  }

  return "draft";
}

function getStatusDescription(
  status: FormationStatus,
) {
  if (status === "published") {
    return "Cette formation est publiée et peut être présentée dans le catalogue public selon les règles de visibilité de la plateforme.";
  }

  if (status === "archived") {
    return "Cette formation est archivée et ne doit plus être proposée comme une formation active.";
  }

  return "Cette formation est enregistrée en brouillon et reste en préparation avant sa publication.";
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

function formatNumber(value: number) {
  return new Intl.NumberFormat(
    "fr-FR",
  ).format(
    Number.isFinite(value)
      ? Math.max(0, value)
      : 0,
  );
}

function formatDate(value: Date) {
  if (
    !(value instanceof Date) ||
    Number.isNaN(value.getTime())
  ) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(value);
}

function formatFileSize(bytes: number) {
  if (
    !Number.isFinite(bytes) ||
    bytes <= 0
  ) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} octets`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(
      1,
    )} Ko`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} Mo`;
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

function ChevronRightIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-slate-300"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function ContentIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
      />

      <path d="m10 9 5 3-5 3Z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />

      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
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
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6Z" />

      <path d="m9.5 12 1.5 1.5 3.5-4" />
    </svg>
  );
}