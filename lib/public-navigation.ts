/**
 * ============================================================================
 * AFRISKILL AI — NAVIGATION PUBLIQUE
 * ============================================================================
 *
 * Source centrale des routes et éléments de navigation de l'espace public.
 *
 * Ce fichier est utilisé par :
 * - le header desktop ;
 * - la navigation desktop ;
 * - le header mobile ;
 * - le menu mobile ;
 * - la navigation inférieure mobile ;
 * - les liens internes de l'espace public.
 *
 * IMPORTANT :
 * - aucune route administrateur ;
 * - aucune logique d'authentification ;
 * - aucune dépendance React / Next.js ;
 * - aucune logique serveur.
 *
 * Les composants d'interface doivent réutiliser ces constantes plutôt
 * que dupliquer manuellement les URLs.
 * ============================================================================
 */

/**
 * Route publique simple.
 */
export type PublicNavigationItem = Readonly<{
  label: string;
  href: string;
  description?: string;
}>;

/**
 * Icônes autorisées dans la navigation mobile.
 *
 * Le composant MobileBottomNavigation pourra ensuite
 * associer chaque identifiant à son icône visuelle.
 */
export type MobileNavigationIcon =
  | "home"
  | "formations"
  | "cart"
  | "account";

/**
 * Élément utilisé dans la navigation mobile principale.
 */
export type MobileNavigationItem =
  PublicNavigationItem &
    Readonly<{
      icon: MobileNavigationIcon;
    }>;

/**
 * ============================================================================
 * ROUTES PUBLIQUES
 * ============================================================================
 *
 * Une seule source de vérité pour éviter d'écrire les mêmes URLs
 * dans plusieurs composants.
 */

export const publicRoutes = {
  home: "/",
  formations: "/formations",
  cart: "/panier",
  account: "/compte",

  howItWorks: "/#comment-ca-marche",
  about: "/#a-propos",
} as const;

/**
 * ============================================================================
 * NAVIGATION DESKTOP
 * ============================================================================
 *
 * Navigation principale affichée dans le header sur les grands écrans.
 */

export const desktopNavigation = [
  {
    label: "Accueil",
    href: publicRoutes.home,
  },

  {
    label: "Formations",
    href: publicRoutes.formations,
  },

  {
    label: "Comment ça marche",
    href: publicRoutes.howItWorks,
  },

  {
    label: "À propos",
    href: publicRoutes.about,
  },
] as const satisfies readonly PublicNavigationItem[];

/**
 * ============================================================================
 * NAVIGATION MOBILE
 * ============================================================================
 *
 * Navigation principale destinée à la barre inférieure mobile.
 *
 * On conserve volontairement quatre destinations prioritaires :
 *
 * - Accueil
 * - Formations
 * - Panier
 * - Compte
 *
 * Les liens secondaires comme "À propos" et "Comment ça marche"
 * pourront rester dans le menu mobile afin de ne pas surcharger
 * la navigation inférieure.
 */

export const mobileNavigation = [
  {
    label: "Accueil",
    href: publicRoutes.home,
    icon: "home",
  },

  {
    label: "Formations",
    href: publicRoutes.formations,
    icon: "formations",
  },

  {
    label: "Panier",
    href: publicRoutes.cart,
    icon: "cart",
  },

  {
    label: "Compte",
    href: publicRoutes.account,
    icon: "account",
  },
] as const satisfies readonly MobileNavigationItem[];

/**
 * ============================================================================
 * NAVIGATION SECONDAIRE
 * ============================================================================
 *
 * Utilisée notamment dans :
 * - le menu mobile ;
 * - certaines zones secondaires du site ;
 * - éventuellement le footer.
 */

export const secondaryNavigation = [
  {
    label: "Comment ça marche",
    href: publicRoutes.howItWorks,

    description:
      "Découvrez comment choisir et suivre une formation sur AfriSkill AI.",
  },

  {
    label: "À propos",
    href: publicRoutes.about,

    description:
      "Découvrez la vision et l'approche d'AfriSkill AI.",
  },
] as const satisfies readonly PublicNavigationItem[];

/**
 * ============================================================================
 * HELPERS
 * ============================================================================
 */

/**
 * Nettoie un pathname avant comparaison.
 *
 * Exemples :
 *
 * "/"                  -> "/"
 * "/formations/"       -> "/formations"
 * "/formations/123/"   -> "/formations/123"
 *
 * Cela évite qu'un simple slash final empêche
 * la détection correcte de la navigation active.
 */
function normalizePathname(
  pathname: string,
): string {
  const cleanPathname =
    pathname
      .trim()
      .split("?")[0]
      ?.split("#")[0] ?? "";

  if (!cleanPathname) {
    return "/";
  }

  if (cleanPathname === "/") {
    return "/";
  }

  return cleanPathname.replace(
    /\/+$/,
    "",
  );
}

/**
 * Extrait uniquement le pathname d'un href.
 *
 * Exemple :
 *
 * "/#comment-ca-marche"
 *
 * devient :
 *
 * "/"
 */
function getNavigationPathname(
  href: string,
): string {
  const cleanHref =
    href
      .trim()
      .split("?")[0]
      ?.split("#")[0] ?? "";

  return normalizePathname(
    cleanHref || "/",
  );
}

/**
 * Détermine si un élément de navigation correspond
 * à la page actuellement visitée.
 *
 * Exemples :
 *
 * pathname = "/"
 * href     = "/"
 * => true
 *
 * pathname = "/formations"
 * href     = "/formations"
 * => true
 *
 * pathname = "/formations/abc123"
 * href     = "/formations"
 * => true
 *
 * pathname = "/panier"
 * href     = "/formations"
 * => false
 *
 * Les ancres de la page d'accueil ne sont pas considérées
 * comme des pages indépendantes :
 *
 * "/#a-propos"
 * "/#comment-ca-marche"
 *
 * correspondent donc au pathname "/".
 */
export function isNavigationItemActive(
  pathname: string,
  href: string,
): boolean {
  if (
    typeof pathname !== "string" ||
    typeof href !== "string" ||
    !pathname.trim() ||
    !href.trim()
  ) {
    return false;
  }

  const currentPathname =
    normalizePathname(pathname);

  const navigationPathname =
    getNavigationPathname(href);

  /**
   * La racine doit uniquement être active
   * lorsque l'utilisateur est réellement
   * sur la page d'accueil.
   *
   * Cela empêche "Accueil" d'être actif
   * sur toutes les routes.
   */
  if (navigationPathname === "/") {
    return currentPathname === "/";
  }

  /**
   * Correspondance exacte.
   */
  if (
    currentPathname ===
    navigationPathname
  ) {
    return true;
  }

  /**
   * Correspondance avec une sous-route.
   *
   * Exemple :
   *
   * /formations/123
   *
   * conserve "Formations" comme élément actif.
   */
  return currentPathname.startsWith(
    `${navigationPathname}/`,
  );
}