import Link from "next/link";

function AccountIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-8 w-8"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M4.5 20c.8-3.5 3.4-5.5 7.5-5.5s6.7 2 7.5 5.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function ComptePage() {
  return (
    <div className="min-h-[calc(100dvh-76px)] bg-[#F7F9FC]">
      <section className="bg-[#061A40] text-white">
        <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F5B400]">
            Espace client
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Mon compte
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Votre espace personnel permettra de retrouver vos
            achats, vos formations et vos informations de compte.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#061A40] text-cyan-300">
            <AccountIcon />
          </div>

          <h2 className="mt-5 text-2xl font-black text-[#061A40]">
            Espace client AfriSkill AI
          </h2>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            L&apos;authentification client sécurisée sera mise en
            place avant d&apos;activer l&apos;accès aux achats et
            aux ressources privées.
          </p>

          <Link
            href="/formations"
            className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F5B400] px-6 py-3 text-sm font-black text-[#061A40] transition hover:bg-[#FFD45C]"
          >
            Découvrir les formations
          </Link>
        </div>
      </section>
    </div>
  );
}