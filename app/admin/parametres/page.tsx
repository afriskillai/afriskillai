import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paramètres",
  description:
    "Configuration de l’administration AfriSkill AI.",
};

type ConfigurationStatus =
  | "configured"
  | "missing"
  | "optional";

type ConfigurationItem = {
  label: string;
  description: string;
  status: ConfigurationStatus;
};

export default async function ParametresPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/connexion");
  }

  const configuration =
    getConfigurationStatus();

  return (
    <AdminShell adminEmail={session.email}>
      <div className="space-y-6">
        <section className="relative overflow-hidden rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl"
          />

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
              <SettingsIcon />
              Configuration
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Paramètres
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 sm:text-base">
              Consultez l’état de la configuration
              administrative et des services essentiels
              de la plateforme AfriSkill AI.
            </p>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(330px,0.55fr)]">
          <div className="space-y-6">
            {/* Identité */}
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                icon={<BrandIcon />}
                title="Identité de la plateforme"
                description="Informations principales utilisées par AfriSkill AI."
              />

              <dl className="mt-6 divide-y divide-slate-100">
                <SettingRow
                  label="Nom"
                  value="AfriSkill AI"
                />

                <SettingRow
                  label="Positionnement"
                  value="Formation pratique en intelligence artificielle"
                />

                <SettingRow
                  label="Devise principale"
                  value="XOF / FCFA"
                />

                <SettingRow
                  label="Administration"
                  value={session.email}
                />
              </dl>
            </section>

            {/* Configuration technique */}
            <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="p-5 sm:p-6">
                <SectionHeader
                  icon={<ServerIcon />}
                  title="Configuration technique"
                  description="État des variables nécessaires au fonctionnement de l’administration."
                />
              </div>

              <div className="divide-y divide-slate-100 border-t border-slate-100">
                {configuration.map((item) => (
                  <ConfigurationRow
                    key={item.label}
                    item={item}
                  />
                ))}
              </div>
            </section>

            {/* Paiements */}
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                icon={<PaymentIcon />}
                title="Paiements"
                description="Configuration du futur système d’encaissement."
              />

              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-bold text-slate-800">
                  Prestataire de paiement non configuré
                  dans cette page
                </p>

                <p className="mt-2 text-xs leading-6 text-slate-500">
                  Les clés privées, secrets webhook et
                  autres identifiants sensibles ne doivent
                  jamais être affichés ou enregistrés
                  directement dans l’interface
                  administrateur. Ils seront conservés
                  dans les variables d’environnement du
                  serveur.
                </p>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {/* Administrateur */}
            <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <SectionHeader
                icon={<AdminIcon />}
                title="Administrateur"
                description="Session administrative actuelle."
              />

              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                  AD
                </div>

                <div className="min-w-0">
                  <p className="font-bold text-slate-900">
                    Administrateur
                  </p>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {session.email}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                  <ShieldCheckIcon />
                  Session authentifiée
                </div>
              </div>
            </section>

            {/* Sécurité */}
            <section className="rounded-[24px] border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
              <div className="flex gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
                  <ShieldIcon />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-blue-950">
                    Secrets protégés
                  </h2>

                  <p className="mt-1 text-xs leading-6 text-blue-800/70">
                    Les mots de passe, secrets de
                    session, clés de paiement et accès à
                    la base de données ne doivent jamais
                    être exposés dans le navigateur.
                  </p>
                </div>
              </div>
            </section>

            {/* Production */}
            <section className="rounded-[24px] border border-amber-100 bg-amber-50/70 p-5 sm:p-6">
              <h2 className="text-sm font-bold text-amber-950">
                Avant la production
              </h2>

              <p className="mt-2 text-xs leading-6 text-amber-800/80">
                La configuration de production devra
                utiliser des secrets distincts du
                développement, une base de données
                sécurisée et des clés de paiement
                réservées à l’environnement de
                production.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function getConfigurationStatus(): ConfigurationItem[] {
  return [
    {
      label: "ADMIN_EMAIL",
      description:
        "Adresse autorisée à accéder à l’administration.",
      status: process.env.ADMIN_EMAIL
        ? "configured"
        : "missing",
    },

    {
      label: "ADMIN_PASSWORD_HASH",
      description:
        "Empreinte sécurisée du mot de passe administrateur.",
      status: process.env.ADMIN_PASSWORD_HASH
        ? "configured"
        : "missing",
    },

    {
      label: "ADMIN_SESSION_SECRET",
      description:
        "Secret utilisé pour signer les sessions administrateur.",
      status: process.env.ADMIN_SESSION_SECRET
        ? "configured"
        : "missing",
    },

    {
      label: "DATABASE_URL",
      description:
        "Connexion à la base de données principale.",
      status: process.env.DATABASE_URL
        ? "configured"
        : "missing",
    },
  ];
}

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        {icon}
      </div>

      <div>
        <h2 className="font-bold text-slate-950">
          {title}
        </h2>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function SettingRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center">
      <dt className="text-sm text-slate-500">
        {label}
      </dt>

      <dd className="break-words text-sm font-semibold text-slate-800 sm:max-w-[60%] sm:text-right">
        {value}
      </dd>
    </div>
  );
}

function ConfigurationRow({
  item,
}: {
  item: ConfigurationItem;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
      <div>
        <p className="text-sm font-bold text-slate-800">
          {item.label}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {item.description}
        </p>
      </div>

      <ConfigurationBadge
        status={item.status}
      />
    </div>
  );
}

function ConfigurationBadge({
  status,
}: {
  status: ConfigurationStatus;
}) {
  if (status === "configured") {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Configuré
      </span>
    );
  }

  if (status === "optional") {
    return (
      <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
        Optionnel
      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      À configurer
    </span>
  );
}

function SettingsIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </svg>
  );
}

function BrandIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 3 3 8l9 5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </svg>
  );
}

function ServerIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="6" rx="2" />
      <rect x="3" y="14" width="18" height="6" rx="2" />
      <path d="M7 7h.01" />
      <path d="M7 17h.01" />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
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
    </svg>
  );
}

function ShieldCheckIcon() {
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
      <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6Z" />
      <path d="m9.5 12 1.5 1.5 3.5-4" />
    </svg>
  );
}