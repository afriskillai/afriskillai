"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
  success?: boolean;
  message?: string;
};

export default function AdminConnexionPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setError("");

    const normalizedEmail = email
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      setError(
        "Veuillez renseigner votre adresse e-mail et votre mot de passe.",
      );

      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        "/api/admin/connexion",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "same-origin",

          cache: "no-store",

          body: JSON.stringify({
            email: normalizedEmail,
            password,
          }),
        },
      );

      let data: LoginResponse = {};

      try {
        data =
          (await response.json()) as LoginResponse;
      } catch {
        data = {};
      }

      if (!response.ok || !data.success) {
        setError(
          data.message ??
            "Connexion impossible. Vérifiez vos identifiants puis réessayez.",
        );

        return;
      }

      router.replace("/admin/dashboard");
      router.refresh();
    } catch {
      setError(
        "Une erreur est survenue pendant la connexion. Veuillez réessayer.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#050d20] text-white">
      <div className="relative flex min-h-screen overflow-hidden">
        {/* ============================================================
            DÉCORATION DE FOND
            ============================================================ */}

        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-blue-600/20 blur-[120px]" />

          <div className="absolute -bottom-52 right-0 h-[620px] w-[620px] rounded-full bg-cyan-500/10 blur-[140px]" />

          <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400/5 blur-[120px]" />

          <div
            className="absolute inset-0 opacity-[0.035]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.7) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
        </div>

        {/* ============================================================
            PARTIE GAUCHE — DESKTOP
            ============================================================ */}

        <section className="relative hidden w-[52%] flex-col justify-between border-r border-white/5 p-12 lg:flex xl:p-16">
          <div>
            <div className="relative h-[90px] w-[360px]">
              <Image
                src="/logo/logo.png"
                alt="AfriSkill AI"
                fill
                priority
                sizes="360px"
                className="object-contain object-left"
              />
            </div>
          </div>

          <div className="max-w-xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
              <span className="h-2 w-2 rounded-full bg-amber-300" />

              Administration sécurisée
            </div>

            <h1 className="text-4xl font-bold leading-tight tracking-tight xl:text-5xl">
              Pilotez AfriSkill AI

              <span className="block bg-gradient-to-r from-cyan-300 via-blue-400 to-amber-300 bg-clip-text text-transparent">
                depuis un seul espace.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-slate-400">
              Gérez les formations, les contenus
              pédagogiques, les commandes, les clients,
              les paiements et les performances de la
              plateforme.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-4">
              <Feature
                title="Formations"
                text="Catalogue et contenus"
              />

              <Feature
                title="Commandes"
                text="Suivi des ventes"
              />

              <Feature
                title="Clients"
                text="Gestion des apprenants"
              />

              <Feature
                title="Statistiques"
                text="Pilotage de l'activité"
              />
            </div>
          </div>

          <p className="text-sm text-slate-600">
            © {new Date().getFullYear()} AfriSkill AI.
            Espace réservé à l&apos;administration.
          </p>
        </section>

        {/* ============================================================
            PARTIE CONNEXION
            ============================================================ */}

        <section className="relative flex w-full items-center justify-center px-5 py-10 sm:px-8 lg:w-[48%]">
          <div className="w-full max-w-[460px]">
            {/* Logo mobile */}

            <div className="mb-10 flex justify-center lg:hidden">
              <div className="relative h-[78px] w-[300px]">
                <Image
                  src="/logo/logo.png"
                  alt="AfriSkill AI"
                  fill
                  priority
                  sizes="300px"
                  className="object-contain"
                />
              </div>
            </div>

            {/* Carte connexion */}

            <div className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-9">
              <div className="mb-8">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
                  <LockIcon />
                </div>

                <p className="text-sm font-semibold text-amber-300">
                  AfriSkill AI Admin
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white">
                  Connexion
                </h2>

                <p className="mt-3 leading-7 text-slate-400">
                  Connectez-vous pour accéder à votre
                  espace d&apos;administration.
                </p>
              </div>

              {/* ======================================================
                  FORMULAIRE
                  ====================================================== */}

              <form
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
              >
                {/* EMAIL */}

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Adresse e-mail
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                      <MailIcon />
                    </span>

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      inputMode="email"
                      spellCheck={false}
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="admin@afriskill.ai"
                      disabled={isSubmitting}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-[#071229]/80 pl-12 pr-4 text-[15px] text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* MOT DE PASSE */}

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-200"
                  >
                    Mot de passe
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
                      <PasswordIcon />
                    </span>

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);

                        if (error) {
                          setError("");
                        }
                      }}
                      placeholder="Votre mot de passe"
                      disabled={isSubmitting}
                      className="h-14 w-full rounded-2xl border border-white/10 bg-[#071229]/80 pl-12 pr-14 text-[15px] text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60 focus:ring-4 focus:ring-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current,
                        )
                      }
                      disabled={isSubmitting}
                      aria-label={
                        showPassword
                          ? "Masquer le mot de passe"
                          : "Afficher le mot de passe"
                      }
                      className="absolute inset-y-0 right-0 flex w-14 items-center justify-center text-slate-500 transition hover:text-white disabled:cursor-not-allowed"
                    >
                      {showPassword ? (
                        <EyeOffIcon />
                      ) : (
                        <EyeIcon />
                      )}
                    </button>
                  </div>
                </div>

                {/* ERREUR */}

                {error ? (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="flex gap-3 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3.5 text-sm leading-6 text-red-200"
                  >
                    <ErrorIcon />

                    <span>{error}</span>
                  </div>
                ) : null}

                {/* BOUTON CONNEXION */}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group relative flex h-14 w-full items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-r from-[#075ee8] via-[#087ee9] to-[#00b8e6] px-6 font-bold text-white shadow-lg shadow-blue-950/30 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-950/40 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-3 h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                      Connexion...
                    </>
                  ) : (
                    <>
                      Se connecter

                      <ArrowIcon />
                    </>
                  )}
                </button>
              </form>

              {/* ======================================================
                  SÉCURITÉ
                  ====================================================== */}

              <div className="mt-7 flex items-center justify-center gap-2 border-t border-white/10 pt-6 text-xs text-slate-500">
                <ShieldIcon />

                Connexion réservée aux administrateurs
                autorisés
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Feature({
  title,
  text,
}: Readonly<{
  title: string;
  text: string;
}>) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
      <div className="mb-3 h-1 w-8 rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />

      <p className="font-semibold text-slate-100">
        {title}
      </p>

      <p className="mt-1 text-sm text-slate-500">
        {text}
      </p>
    </div>
  );
}

function MailIcon() {
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
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />

      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function PasswordIcon() {
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
      <rect
        x="4"
        y="10"
        width="16"
        height="10"
        rx="2"
      />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="text-amber-300"
      aria-hidden="true"
    >
      <rect
        x="4"
        y="10"
        width="16"
        height="10"
        rx="2"
      />

      <path d="M8 10V7a4 4 0 0 1 8 0v3" />

      <path d="M12 14v2" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6l-7-3Z" />

      <path d="m9.5 12 1.5 1.5 3.5-4" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="mt-0.5 shrink-0"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M12 8v5" />

      <path d="M12 16.5h.01" />
    </svg>
  );
}

function EyeIcon() {
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
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />

      <circle
        cx="12"
        cy="12"
        r="2.5"
      />
    </svg>
  );
}

function EyeOffIcon() {
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
      <path d="m3 3 18 18" />

      <path d="M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.8" />

      <path d="M6.1 6.1C3.7 7.8 2.5 12 2.5 12s3.5 6 9.5 6a9.9 9.9 0 0 0 4-.8" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="ml-2 transition-transform group-hover:translate-x-1"
      aria-hidden="true"
    >
      <path d="M5 12h14" />

      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}