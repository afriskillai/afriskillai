import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import FormationContentManager, {
  type FormationContentData,
} from "@/components/admin/formations/FormationContentManager";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contenu de la formation",
};

type PageProps = Readonly<{
  params: Promise<{
    formationId: string;
  }>;
}>;

type FormationContentPageData = {
  id: string;
  title: string;
  content: FormationContentData;
};

export default async function FormationContentPage({
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

  const formation = await getFormationContent(
    normalizedFormationId,
  );

  return (
    <AdminShell adminEmail={session.email}>
      {!formation ? (
        <UnavailableContent
          formationId={normalizedFormationId}
        />
      ) : (
        <div className="space-y-6">
          <div>
            <Link
              href={`/admin/formations/${encodeURIComponent(
                formation.id,
              )}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              <BackIcon />
              Retour à la formation
            </Link>

            <div className="mt-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                <ContentIcon />
                Contenu pédagogique
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {formation.title}
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Organisez les modules, les leçons, les vidéos,
                les PDF et les ressources accessibles aux
                apprenants ayant acheté cette formation.
              </p>
            </div>
          </div>

          <FormationContentManager
            formationId={formation.id}
            initialData={formation.content}
          />
        </div>
      )}
    </AdminShell>
  );
}

async function getFormationContent(
  formationId: string,
): Promise<FormationContentPageData | null> {
  /*
   * Cette fonction sera connectée à Prisma.
   *
   * formationId est déjà décodé, normalisé et validé
   * avant d'arriver dans cette fonction.
   *
   * Pour le moment, aucune donnée fictive, aucun faux
   * module et aucune fausse leçon ne sont retournés.
   */
  void formationId;

  return null;
}

function UnavailableContent({
  formationId,
}: Readonly<{
  formationId: string;
}>) {
  return (
    <div className="space-y-6">
      <Link
        href="/admin/formations"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <BackIcon />
        Retour aux formations
      </Link>

      <section className="flex min-h-[480px] items-center justify-center rounded-[26px] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="max-w-lg text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <ContentIconLarge />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Contenu non disponible
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            La formation doit être récupérée depuis la base de
            données avant de pouvoir gérer ses modules et ses
            leçons.
          </p>

          <p className="mt-3 break-all text-xs text-slate-400">
            Référence : {formationId}
          </p>

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

function safeDecodeURIComponent(
  value: string,
): string {
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

function ContentIcon() {
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

function ContentIconLarge() {
  return (
    <svg
      width="26"
      height="26"
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