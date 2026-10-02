import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import FormationTable, {
  type FormationListItem,
} from "@/components/admin/formations/FormationTable";

import { getAdminSession } from "@/lib/admin-session";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = {
  title: "Formations",
};

export default async function AdminFormationsPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  const formations = await getFormations();

  const publishedCount = formations.filter(
    (formation) => formation.status === "published",
  ).length;

  const draftCount = formations.filter(
    (formation) => formation.status === "draft",
  ).length;

  return (
    <AdminShell adminEmail={session.email}>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                <CourseIcon />
                Catalogue AfriSkill AI
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Gestion des formations
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-slate-500">
                Créez, préparez et publiez les formations proposées
                aux apprenants sur AfriSkill AI.
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

        <section className="grid gap-4 sm:grid-cols-3">
          <MiniStat
            title="Total"
            value={formations.length}
            description="Formations enregistrées"
          />

          <MiniStat
            title="Publiées"
            value={publishedCount}
            description="Visibles dans le catalogue"
          />

          <MiniStat
            title="Brouillons"
            value={draftCount}
            description="En préparation"
          />
        </section>

        <FormationTable formations={formations} />
      </div>
    </AdminShell>
  );
}

/**
 * Récupération des formations réelles depuis PostgreSQL.
 *
 * Cette page n'utilise aucune donnée fictive.
 * Les données sont lues directement avec Prisma à chaque rendu.
 */
async function getFormations(): Promise<FormationListItem[]> {
  const courses = await db.course.findMany({
    orderBy: {
      createdAt: "desc",
    },

    select: {
      id: true,
      title: true,
      shortDescription: true,

      price: true,
      promotionalPrice: true,
      currency: true,

      status: true,

      createdAt: true,
      updatedAt: true,

      images: {
        where: {
          type: "PRIMARY",
        },

        select: {
          url: true,
        },

        orderBy: {
          position: "asc",
        },

        take: 1,
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
    },
  });

  return courses.map((course) => {
    const salesCount = course.orderItems.reduce(
      (total, item) =>
        total + Math.max(0, item.quantity),
      0,
    );

    return {
      id: course.id,

      title: course.title,

      shortDescription:
        course.shortDescription,

      price: course.price,

      promotionalPrice:
        course.promotionalPrice,

      currency: course.currency,

      status: mapCourseStatus(
        course.status,
      ),

      primaryImage:
        course.images[0]?.url ?? null,

      salesCount,

      createdAt:
        course.createdAt.toISOString(),

      updatedAt:
        course.updatedAt.toISOString(),
    };
  });
}

function mapCourseStatus(
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "ARCHIVED",
): FormationListItem["status"] {
  switch (status) {
    case "PUBLISHED":
      return "published";

    case "ARCHIVED":
      return "archived";

    case "DRAFT":
    default:
      return "draft";
  }
}

function MiniStat({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>
    </article>
  );
}

function CourseIcon() {
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
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />
      <path d="M4 5.5v16" />
      <path d="M8 7h8" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      width="18"
      height="18"
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