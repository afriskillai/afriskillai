"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getIOSInstallInstructions,
  isStandaloneMode,
  registerAfriSkillServiceWorker,
} from "@/lib/pwa";

/**
 * ============================================================================
 * AFRISKILL AI — INSTALL APP PROMPT
 * ============================================================================
 *
 * Responsabilités :
 * - enregistrer le Service Worker uniquement en production ;
 * - empêcher le cache PWA d'interférer avec Next.js en développement ;
 * - nettoyer les anciens Service Workers AfriSkill sur localhost ;
 * - afficher les instructions d'installation iOS ;
 * - préserver le fonctionnement normal de la PWA en production.
 *
 * IMPORTANT :
 *
 * En développement, Next.js doit toujours charger les derniers bundles.
 * Un ancien Service Worker peut conserver une ancienne version du JavaScript
 * et provoquer des erreurs d'hydratation après un redémarrage de `npm run dev`.
 *
 * Le Service Worker est donc :
 *
 * - ACTIVÉ en production ;
 * - DÉSACTIVÉ en développement ;
 * - nettoyé en développement s'il avait déjà été enregistré auparavant.
 * ============================================================================
 */

const AFRISKILL_SERVICE_WORKER_PATH =
  "/sw.js";

/**
 * ============================================================================
 * ENVIRONNEMENT
 * ============================================================================
 */

function isDevelopmentEnvironment(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * ============================================================================
 * NETTOYAGE SERVICE WORKER EN DÉVELOPPEMENT
 * ============================================================================
 *
 * Cette fonction ne s'exécute jamais en production.
 *
 * Elle supprime les anciennes registrations dont le script correspond
 * au Service Worker AfriSkill.
 *
 * Cela évite qu'un ancien /sw.js continue à contrôler localhost après
 * une modification ou un redémarrage du serveur Next.js.
 * ============================================================================
 */

async function cleanupDevelopmentServiceWorkers(): Promise<void> {
  if (
    typeof window === "undefined" ||
    typeof navigator === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  if (!isDevelopmentEnvironment()) {
    return;
  }

  try {
    const registrations =
      await navigator.serviceWorker.getRegistrations();

    await Promise.all(
      registrations.map(async (registration) => {
        const worker =
          registration.active ??
          registration.waiting ??
          registration.installing;

        const scriptURL =
          worker?.scriptURL ?? "";

        /**
         * On cible prioritairement le Service Worker AfriSkill.
         *
         * Sur localhost, si la registration ne fournit plus de worker actif,
         * on peut également supprimer la registration car aucune PWA ne doit
         * contrôler l'application pendant le développement.
         */
        const isAfriSkillWorker =
          scriptURL.includes(
            AFRISKILL_SERVICE_WORKER_PATH,
          );

        const isLocalDevelopmentHost =
          window.location.hostname === "localhost" ||
          window.location.hostname === "127.0.0.1" ||
          window.location.hostname === "[::1]";

        if (
          isAfriSkillWorker ||
          isLocalDevelopmentHost
        ) {
          await registration.unregister();
        }
      }),
    );
  } catch {
    /**
     * Le nettoyage du Service Worker ne doit jamais empêcher
     * l'application de démarrer.
     *
     * En cas d'échec, le navigateur continuera simplement son
     * fonctionnement normal.
     */
  }

  /**
   * Nettoyage du Cache Storage en développement.
   *
   * Un Service Worker supprimé peut avoir laissé des réponses en cache.
   * Ces caches ne sont pas utiles pendant `npm run dev`.
   */
  if (
    typeof window !== "undefined" &&
    "caches" in window
  ) {
    try {
      const cacheNames =
        await window.caches.keys();

      await Promise.all(
        cacheNames.map(
          async (cacheName) => {
            try {
              await window.caches.delete(
                cacheName,
              );
            } catch {
              /**
               * Un cache impossible à supprimer ne doit pas
               * bloquer le rendu de l'application.
               */
            }
          },
        ),
      );
    } catch {
      /**
       * Cache Storage peut être indisponible ou restreint
       * selon le navigateur.
       */
    }
  }
}

/**
 * ============================================================================
 * ICÔNES
 * ============================================================================
 */

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5"
    >
      <path
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-6 w-6"
    >
      <path
        d="M12 16V3m0 0L8 7m4-4 4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M6 10H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * ============================================================================
 * COMPOSANT
 * ============================================================================
 */

export default function InstallAppPrompt() {
  const [
    showIOSInstructions,
    setShowIOSInstructions,
  ] = useState(false);

  const closePrompt =
    useCallback(() => {
      setShowIOSInstructions(false);
    }, []);

  /**
   * ==========================================================================
   * SERVICE WORKER + ÉVÉNEMENTS
   * ==========================================================================
   */

  useEffect(() => {
    /**
     * Développement :
     *
     * - aucun enregistrement de Service Worker ;
     * - suppression d'une éventuelle ancienne registration ;
     * - suppression des caches laissés par la PWA.
     *
     * Production :
     *
     * - comportement PWA normal ;
     * - Service Worker enregistré si l'application n'est pas déjà
     *   exécutée en mode standalone.
     */
    if (
      isDevelopmentEnvironment()
    ) {
      void cleanupDevelopmentServiceWorkers();
    } else if (
      !isStandaloneMode()
    ) {
      void registerAfriSkillServiceWorker();
    }

    const handleShowIOSInstructions =
      () => {
        setShowIOSInstructions(true);
      };

    const handleKeyDown =
      (event: KeyboardEvent) => {
        if (
          event.key === "Escape"
        ) {
          setShowIOSInstructions(false);
        }
      };

    window.addEventListener(
      "afriskill:show-ios-install",
      handleShowIOSInstructions,
    );

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.removeEventListener(
        "afriskill:show-ios-install",
        handleShowIOSInstructions,
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  /**
   * ==========================================================================
   * VERROUILLAGE DU SCROLL
   * ==========================================================================
   */

  useEffect(() => {
    if (!showIOSInstructions) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previousOverflow;
    };
  }, [showIOSInstructions]);

  /**
   * ==========================================================================
   * AUCUNE MODALE
   * ==========================================================================
   */

  if (!showIOSInstructions) {
    return null;
  }

  const instructions =
    getIOSInstallInstructions();

  /**
   * ==========================================================================
   * MODALE IOS
   * ==========================================================================
   */

  return (
    <div
      className={[
        "fixed inset-0 z-[100]",
        "flex items-end justify-center",
        "bg-[#020817]/75",
        "p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]",
        "backdrop-blur-sm",
        "sm:items-center",
      ].join(" ")}
      role="dialog"
      aria-modal="true"
      aria-labelledby="afriskill-ios-install-title"
    >
      <button
        type="button"
        aria-label="Fermer les instructions d'installation"
        onClick={closePrompt}
        className="absolute inset-0"
      />

      <div
        className={[
          "relative z-10 w-full max-w-md",
          "overflow-hidden rounded-3xl",
          "border border-white/10",
          "bg-[#071A35]",
          "shadow-[0_30px_100px_rgba(0,0,0,0.5)]",
        ].join(" ")}
      >
        <div className="border-b border-white/10 bg-gradient-to-r from-cyan-400/10 to-[#F5B400]/10 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300">
                <ShareIcon />
              </span>

              <div>
                <h2
                  id="afriskill-ios-install-title"
                  className="text-lg font-black text-white"
                >
                  Installer AfriSkill AI
                </h2>

                <p className="mt-0.5 text-xs text-slate-400">
                  iPhone et iPad
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closePrompt}
              aria-label="Fermer"
              className={[
                "inline-flex h-10 w-10 shrink-0 items-center justify-center",
                "rounded-xl border border-white/10",
                "bg-white/[0.05] text-slate-300",
                "transition hover:bg-white/10 hover:text-white",
                "focus-visible:outline-none",
                "focus-visible:ring-2 focus-visible:ring-cyan-400",
              ].join(" ")}
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm leading-6 text-slate-300">
            Pour installer AfriSkill AI comme une application
            sur votre appareil :
          </p>

          <ol className="mt-5 space-y-3">
            {instructions.map(
              (
                instruction,
                index,
              ) => (
                <li
                  key={instruction}
                  className="flex gap-3"
                >
                  <span
                    className={[
                      "flex h-7 w-7 shrink-0 items-center justify-center",
                      "rounded-full bg-[#F5B400]",
                      "text-xs font-black text-[#061A40]",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>

                  <span className="pt-1 text-sm leading-5 text-slate-200">
                    {instruction}
                  </span>
                </li>
              ),
            )}
          </ol>

          <button
            type="button"
            onClick={closePrompt}
            className={[
              "mt-6 inline-flex min-h-12 w-full items-center justify-center",
              "rounded-xl bg-cyan-400",
              "px-5 py-3",
              "text-sm font-black text-[#04162f]",
              "transition hover:bg-cyan-300",
              "focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-cyan-300",
              "focus-visible:ring-offset-2",
              "focus-visible:ring-offset-[#071A35]",
            ].join(" ")}
          >
            J’ai compris
          </button>
        </div>
      </div>
    </div>
  );
}