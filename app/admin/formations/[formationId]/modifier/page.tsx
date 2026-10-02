import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import FormationForm, {
  type FormationFormValues,
} from "@/components/admin/formations/FormationForm";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Modifier une formation",
};

type PageProps = Readonly<{
  params: Promise<{
    formationId: string;
  }>;
}>;

type EditableFormation = {
  id: string;
  title: string;
  shortDescription: string;
  description: string;
  price: number;
  promotionalPrice: number | null;
  currency: string;
  status: "draft" | "published";
  primaryImage: string | null;
  secondaryImage: string | null;
};

export default async function ModifierFormationPage({
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

  const formation = await getFormationForEdit(
    normalizedFormationId,
  );

  return (
    <AdminShell adminEmail={session.email}>
      {!formation ? (
        <FormationUnavailable
          formationId={normalizedFormationId}
        />
      ) : (
        <EditFormationContent
          formation={formation}
        />
      )}
    </AdminShell>
  );
}

async function getFormationForEdit(
  formationId: string,
): Promise<EditableFormation | null> {
  /*
   * Cette fonction sera connectée à Prisma.
   *
   * formationId est déjà décodé, normalisé et validé
   * avant d'arriver dans cette fonction.
   *
   * Pour le moment, aucune donnée fictive n'est
   * injectée dans la page de modification.
   */
  void formationId;

  return null;
}

function EditFormationContent({
  formation,
}: Readonly<{
  formation: EditableFormation;
}>) {
  const initialValues: Partial<FormationFormValues> = {
    title: formation.title,

    shortDescription:
      formation.shortDescription,

    description: formation.description,

    price: String(formation.price),

    promotionalPrice:
      formation.promotionalPrice !== null
        ? String(
            formation.promotionalPrice,
          )
        : "",

    currency: formation.currency,

    status: formation.status,

    images: {
      primary: null,
      secondary: null,
    },
  };

  return (
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
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Modifier la formation
            </h1>

            <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
              Modification
            </span>
          </div>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Modifiez les informations commerciales
            et la présentation de «{" "}
            {formation.title} ».
          </p>
        </div>
      </div>

      <FormationForm
        mode="edit"
        formationId={formation.id}
        initialValues={initialValues}
      />

      {(formation.primaryImage ||
        formation.secondaryImage) && (
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-950">
            Images actuellement enregistrées
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Les images existantes seront reliées
            au système d&apos;upload lors de la
            connexion du stockage.
          </p>
        </section>
      )}
    </div>
  );
}

function FormationUnavailable({
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <EditIcon />
          </div>

          <h1 className="mt-5 text-xl font-bold text-slate-950">
            Modification indisponible
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            La formation ne peut pas encore être
            chargée tant que la base de données
            n&apos;est pas connectée. Aucune
            information fictive n&apos;est
            utilisée.
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

function EditIcon() {
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
      <path d="M12 20h9" />

      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
    </svg>
  );
}