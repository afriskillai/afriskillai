export const AFRISKILL_APP_NAME = "AfriSkill AI";

export const PWA_INSTALL_EVENT = "afriskill:pwa-install-available";

export type PwaPlatform =
  | "ios"
  | "android"
  | "desktop"
  | "unknown";

export type PwaEnvironment = {
  platform: PwaPlatform;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  isStandalone: boolean;
  canUseInstallPrompt: boolean;
};

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function hasNavigator(): boolean {
  return typeof navigator !== "undefined";
}

export function isStandaloneMode(): boolean {
  if (!hasWindow()) {
    return false;
  }

  const displayModeStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;

  const navigatorWithStandalone = navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    displayModeStandalone ||
    navigatorWithStandalone.standalone === true
  );
}

export function isIOSDevice(): boolean {
  if (!hasNavigator()) {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();

  const classicIOS =
    /iphone|ipad|ipod/.test(userAgent);

  const modernIPad =
    navigator.platform === "MacIntel" &&
    navigator.maxTouchPoints > 1;

  return classicIOS || modernIPad;
}

export function isAndroidDevice(): boolean {
  if (!hasNavigator()) {
    return false;
  }

  return /android/i.test(navigator.userAgent);
}

export function getPwaPlatform(): PwaPlatform {
  if (!hasNavigator()) {
    return "unknown";
  }

  if (isIOSDevice()) {
    return "ios";
  }

  if (isAndroidDevice()) {
    return "android";
  }

  return "desktop";
}

export function getPwaEnvironment(): PwaEnvironment {
  const platform = getPwaPlatform();

  return {
    platform,
    isIOS: platform === "ios",
    isAndroid: platform === "android",
    isDesktop: platform === "desktop",
    isStandalone: isStandaloneMode(),
    canUseInstallPrompt: false,
  };
}

export function isServiceWorkerSupported(): boolean {
  return (
    hasNavigator() &&
    "serviceWorker" in navigator
  );
}

export async function registerAfriSkillServiceWorker(): Promise<
  ServiceWorkerRegistration | null
> {
  if (!isServiceWorkerSupported()) {
    return null;
  }

  if (
    hasWindow() &&
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost"
  ) {
    return null;
  }

  try {
    const registration =
      await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

    return registration;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Impossible d'enregistrer le service worker AfriSkill AI.",
        error,
      );
    }

    return null;
  }
}

export function getIOSInstallInstructions(): readonly string[] {
  return [
    "Ouvrez AfriSkill AI dans Safari.",
    "Touchez le bouton Partager.",
    "Choisissez « Sur l’écran d’accueil ».",
    "Confirmez avec « Ajouter ».",
  ] as const;
}