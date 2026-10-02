import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import FormationForm from "@/components/admin/formations/FormationForm";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Nouvelle formation",
  description:
    "Créer une nouvelle formation dans l’administration AfriSkill AI.",
};

export default async function NouvelleFormationPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  return (
    <AdminShell adminEmail={session.email}>
      <div className="space-y-6">
        {/* Fil d'Ariane */}
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
            className="font-semibold text-slate-900"
          >
            Nouvelle formation
          </span>
        </nav>

        {/* En-tête */}
        <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-blue-100/70 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 left-1/3 h-52 w-52 rounded-full bg-cyan-100/50 blur-3xl"
          />

          <div className="relative">
            <Link
              href="/admin/formations"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-blue-600"
            >
              <BackIcon />
              Retour aux formations
            </Link>

            <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
                  <CourseIcon />
                  Catalogue AfriSkill AI
                </div>

                <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Ajouter une formation
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
                  Créez la fiche commerciale de votre nouvelle
                  formation. Vous pourrez ensuite organiser son
                  programme, ses modules, ses vidéos, ses PDF et
                  ses ressources pédagogiques.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <DraftIcon />
                </div>

                <div>
                  <p className="text-xs font-medium text-slate-400">
                    Conseil
                  </p>

                  <p className="mt-0.5 text-sm font-bold text-slate-700">
                    Commencez en brouillon
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Informations importantes */}
        <section className="grid gap-4 md:grid-cols-3">
          <InformationCard
            icon={<InformationIcon />}
            title="Informations"
            description="Titre, descriptions et présentation commerciale."
          />

          <InformationCard
            icon={<ImageIcon />}
            title="Visuels"
            description="Une image principale et une image secondaire maximum."
          />

          <InformationCard
            icon={<ContentIcon />}
            title="Contenu"
            description="Les modules et leçons seront gérés après la création."
          />
        </section>

        {/* Formulaire */}
        <FormationForm mode="create" />

        {/* Note de sécurité */}
        <section className="rounded-[22px] border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <ShieldIcon />
            </div>

            <div>
              <h2 className="text-sm font-bold text-blue-950">
                Contenu réservé aux apprenants
              </h2>

              <p className="mt-1 max-w-3xl text-xs leading-6 text-blue-800/70 sm:text-sm">
                La création de cette fiche ne donne pas
                automatiquement accès au contenu pédagogique.
                Les modules et leçons seront associés à la
                formation et leur accès sera contrôlé par les
                achats et inscriptions validés.
              </p>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function InformationCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </article>
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

function DraftIcon() {
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
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M8 13h8" />
      <path d="M8 17h5" />
    </svg>
  );
}

function InformationIcon() {
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

function ImageIcon() {
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-5-5L5 20" />
    </svg>
  );
}

function ContentIcon() {
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
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m10 9 5 3-5 3Z" />
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