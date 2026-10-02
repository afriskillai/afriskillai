import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin-session";

export const metadata = {
  title: "Contenus | AfriSkill AI",
  description:
    "Gestion des contenus pédagogiques des formations AfriSkill AI.",
};

export default async function AdminContenusPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  return (
    <AdminShell adminEmail={session.email}>
      <main className="min-w-0">
        {/* En-tête */}
        <div className="mb-6">
          <p className="text-sm font-semibold text-blue-600">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Contenus
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
            Gérez les contenus pédagogiques associés aux formations
            AfriSkill AI.
          </p>
        </div>

        {/* Contenu principal */}
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ContentIcon />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Gestion des contenus pédagogiques
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Les contenus privés restent associés à leurs
                  formations et sont accessibles uniquement selon
                  les droits prévus par la plateforme.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <InfoIcon />
                </div>

                <div>
                  <p className="text-sm font-bold text-blue-950">
                    Contenus des formations
                  </p>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-blue-800/70">
                    Pour ajouter ou modifier le contenu d&apos;une
                    formation, ouvrez la formation concernée depuis
                    l&apos;espace Formations. Cette page servira de
                    point central pour la gestion globale des
                    contenus.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AdminShell>
  );
}

function ContentIcon() {
  return (
    <svg
      width="21"
      height="21"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      <path d="M8 7h8" />
      <path d="M8 11h6" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}