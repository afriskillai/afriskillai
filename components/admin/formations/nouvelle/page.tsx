import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import FormationForm from "@/components/admin/formations/FormationForm";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nouvelle formation",
};

export default async function NouvelleFormationPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  return (
    <AdminShell adminEmail={session.email}>
      <div className="space-y-6">
        <div>
          <Link
            href="/admin/formations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
          >
            <BackIcon />
            Retour aux formations
          </Link>

          <div className="mt-4">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Ajouter une formation
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Renseignez les informations commerciales de la
              formation. Les modules, vidéos, PDF et ressources
              pédagogiques seront gérés séparément.
            </p>
          </div>
        </div>

        <FormationForm mode="create" />
      </div>
    </AdminShell>
  );
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