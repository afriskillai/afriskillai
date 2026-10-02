"use client";

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";

import {
  getPwaPlatform,
  isStandaloneMode,
} from "@/lib/pwa";

type InstallAppButtonProps = Readonly<{
  className?: string;
}>;

type InstallState =
  | "checking"
  | "available"
  | "ios"
  | "unavailable"
  | "installed";

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="20"
      height="20"
      className="h-5 w-5 shrink-0"
    >
      <path
        d="M12 3v12m0 0 4-4m-4 4-4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Aucun abonnement n'est nécessaire ici.
 *
 * useSyncExternalStore est utilisé uniquement pour
 * distinguer proprement le rendu serveur du rendu
 * navigateur sans déclencher de setState dans un effet.
 */
function subscribeToClient(): () => void {
  return () => {};
}

function getClientSnapshot(): boolean {
  return true;
}

function getServerSnapshot(): boolean {
  return false;
}

function getInitialInstallState(): InstallState {
  if (typeof window === "undefined") {
    return "checking";
  }

  if (isStandaloneMode()) {
    return "installed";
  }

  const platform = getPwaPlatform();

  if (platform === "ios") {
    return "ios";
  }

  return "unavailable";
}

export default function InstallAppButton({
  className = "",
}: InstallAppButtonProps) {
  const isClient = useSyncExternalStore(
    subscribeToClient,
    getClientSnapshot,
    getServerSnapshot,
  );

  const [
    deferredPrompt,
    setDeferredPrompt,
  ] =
    useState<BeforeInstallPromptEvent | null>(
      null,
    );

  const [
    installState,
    setInstallState,
  ] = useState<InstallState>(() =>
    getInitialInstallState(),
  );

  /**
   * Écoute uniquement les événements PWA réels.
   *
   * Il n'y a plus de setState exécuté directement
   * pendant l'exécution du useEffect.
   */
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleBeforeInstallPrompt = (
      event: BeforeInstallPromptEvent,
    ) => {
      event.preventDefault();

      setDeferredPrompt(event);
      setInstallState("available");
    };

    const handleInstalled = () => {
      setDeferredPrompt(null);
      setInstallState("installed");
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );

    window.addEventListener(
      "appinstalled",
      handleInstalled,
    );

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );

      window.removeEventListener(
        "appinstalled",
        handleInstalled,
      );
    };
  }, []);

  /**
   * Pendant le SSR et la toute première phase
   * d'hydratation, on garde l'état "checking".
   *
   * Une fois côté navigateur, l'état calculé
   * depuis la plateforme devient utilisable.
   */
  const state: InstallState = isClient
    ? installState === "checking"
      ? getInitialInstallState()
      : installState
    : "checking";

  const handleInstall =
    useCallback(async () => {
      /**
       * iOS ne fournit pas beforeinstallprompt.
       * On conserve donc le mécanisme existant
       * qui demande à l'interface d'afficher
       * les instructions d'installation iOS.
       */
      if (state === "ios") {
        window.dispatchEvent(
          new CustomEvent(
            "afriskill:show-ios-install",
          ),
        );

        return;
      }

      if (!deferredPrompt) {
        return;
      }

      try {
        await deferredPrompt.prompt();

        const choice =
          await deferredPrompt.userChoice;

        setDeferredPrompt(null);

        if (
          choice.outcome === "accepted"
        ) {
          setInstallState("installed");

          return;
        }

        setInstallState("unavailable");
      } catch {
        setDeferredPrompt(null);
        setInstallState("unavailable");
      }
    }, [deferredPrompt, state]);

  /**
   * Aucun bouton n'est affiché :
   * - pendant la vérification ;
   * - si l'application est déjà installée ;
   * - si l'installation directe n'est pas disponible.
   */
  if (
    state === "checking" ||
    state === "installed" ||
    state === "unavailable"
  ) {
    return null;
  }

  const isIos = state === "ios";

  return (
    <button
      type="button"
      onClick={handleInstall}
      aria-label={
        isIos
          ? "Installer AfriSkill AI sur iPhone"
          : "Installer l’application AfriSkill AI"
      }
      className={[
        "inline-flex min-h-11",
        "items-center justify-center",
        "gap-2",
        "rounded-xl",
        "border border-cyan-400/30",
        "bg-cyan-400/10",
        "px-4 py-2.5",
        "text-sm font-black",
        "text-cyan-100",
        "transition duration-200",
        "hover:border-cyan-300/50",
        "hover:bg-cyan-400/15",
        "focus-visible:outline-none",
        "focus-visible:ring-2",
        "focus-visible:ring-cyan-400",
        "focus-visible:ring-offset-2",
        "focus-visible:ring-offset-[#061A40]",
        className,
      ].join(" ")}
    >
      <DownloadIcon />

      <span>
        {isIos
          ? "Installer sur iPhone"
          : "Installer l’application"}
      </span>
    </button>
  );
}