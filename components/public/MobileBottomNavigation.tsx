"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useCart } from "@/components/cart/CartProvider";
import {
  isNavigationItemActive,
  mobileNavigation,
  type MobileNavigationIcon,
} from "@/lib/public-navigation";

/**
 * ============================================================================
 * AFRISKILL AI — MOBILE BOTTOM NAVIGATION
 * ============================================================================
 *
 * Navigation principale fixe affichée uniquement sur mobile et tablette.
 *
 * Structure :
 * - Accueil ;
 * - Formations ;
 * - Panier ;
 * - Compte.
 *
 * Fonctionnalités :
 * - état actif selon la route courante ;
 * - compteur du panier ;
 * - prise en charge de la safe area ;
 * - zones tactiles confortables ;
 * - affichage stable sur les petits écrans ;
 * - masquée à partir du breakpoint desktop.
 *
 * IMPORTANT :
 * La hauteur visuelle principale utilise :
 *
 * --mobile-navigation-height
 *
 * PublicShell réserve la même hauteur sous le contenu.
 * ============================================================================
 */

type NavigationIconProps = Readonly<{
  icon: MobileNavigationIcon;
}>;

/**
 * Icônes de la navigation mobile.
 *
 * Les dimensions restent définies localement afin d'éviter
 * toute modification globale des SVG.
 */
function NavigationIcon({
  icon,
}: NavigationIconProps) {
  if (icon === "home") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        width="21"
        height="21"
        className="h-[21px] w-[21px] shrink-0"
      >
        <path
          d="m3.5 10.5 8.5-7 8.5 7V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1v-9.5Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (icon === "formations") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        width="21"
        height="21"
        className="h-[21px] w-[21px] shrink-0"
      >
        <path
          d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />

        <path
          d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (icon === "cart") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        width="21"
        height="21"
        className="h-[21px] w-[21px] shrink-0"
      >
        <path
          d="M3 4h2l1.7 9.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 7H6"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M9 20h.01M18 20h.01"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  /**
   * Icône par défaut : compte utilisateur.
   *
   * MobileNavigationIcon est actuellement limité à :
   * home | formations | cart | account
   */
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="21"
      height="21"
      className="h-[21px] w-[21px] shrink-0"
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

export default function MobileBottomNavigation() {
  const pathname = usePathname();

  const {
    itemCount,
    isHydrated,
  } = useCart();

  return (
    <nav
      aria-label="Navigation principale mobile"
      className={[
        "fixed",
        "inset-x-0",
        "bottom-0",
        "z-40",

        "lg:hidden",

        "border-t",
        "border-white/10",

        "bg-[var(--afriskill-navy-dark)]/95",

        "text-white",

        "shadow-[0_-10px_35px_rgba(2,11,29,0.20)]",

        "backdrop-blur-xl",
        "supports-[backdrop-filter]:bg-[var(--afriskill-navy-dark)]/92",
      ].join(" ")}
    >
      {/* ================================================================
          NAVIGATION
          ================================================================ */}

      <div
        className={[
          "mx-auto",
          "grid",
          "h-[var(--mobile-navigation-height)]",
          "w-full",
          "max-w-lg",
          "grid-cols-4",
          "items-stretch",

          "px-1.5",
          "min-[360px]:px-2",
        ].join(" ")}
      >
        {mobileNavigation.map(
          (item) => {
            const isActive =
              isNavigationItemActive(
                pathname,
                item.href,
              );

            const isCart =
              item.icon === "cart";

            const visibleItemCount =
              itemCount > 99
                ? "99+"
                : itemCount;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  isActive
                    ? "page"
                    : undefined
                }
                aria-label={
                  isCart &&
                  isHydrated &&
                  itemCount > 0
                    ? `${item.label}, ${itemCount} article${
                        itemCount > 1
                          ? "s"
                          : ""
                      } dans le panier`
                    : item.label
                }
                className={[
                  "group",
                  "relative",

                  "flex",
                  "min-w-0",
                  "h-full",
                  "flex-col",

                  "items-center",
                  "justify-center",

                  "gap-0.5",

                  "rounded-xl",

                  "px-0.5",
                  "py-1.5",

                  "transition-[background-color,color,transform]",
                  "duration-200",

                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-inset",
                  "focus-visible:ring-[var(--afriskill-cyan)]",

                  "active:scale-[0.98]",

                  isActive
                    ? [
                        "text-[var(--afriskill-cyan-light)]",
                      ].join(" ")
                    : [
                        "text-slate-400",
                        "hover:bg-white/[0.04]",
                        "hover:text-white",
                      ].join(" "),
                ].join(" ")}
              >
                {/* ======================================================
                    INDICATEUR ACTIF
                    ====================================================== */}

                {isActive ? (
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute",
                      "left-1/2",
                      "top-0",
                      "h-[3px]",
                      "w-8",
                      "-translate-x-1/2",
                      "rounded-b-full",
                      "bg-[var(--afriskill-gold)]",
                    ].join(" ")}
                  />
                ) : null}

                {/* ======================================================
                    ICÔNE
                    ====================================================== */}

                <span
                  aria-hidden="true"
                  className={[
                    "relative",
                    "flex",
                    "h-8",
                    "w-9",
                    "shrink-0",
                    "items-center",
                    "justify-center",

                    "rounded-lg",

                    "transition-[background-color,color,transform]",
                    "duration-200",

                    "group-active:scale-[0.96]",

                    isActive
                      ? [
                          "bg-[var(--afriskill-cyan)]/10",
                          "text-[var(--afriskill-cyan-light)]",
                        ].join(" ")
                      : [
                          "bg-transparent",
                          "text-current",
                        ].join(" "),
                  ].join(" ")}
                >
                  <NavigationIcon
                    icon={item.icon}
                  />

                  {/* ====================================================
                      COMPTEUR DU PANIER
                      ==================================================== */}

                  {isCart &&
                  isHydrated &&
                  itemCount > 0 ? (
                    <span
                      className={[
                        "absolute",
                        "-right-1.5",
                        "-top-1",

                        "flex",
                        "h-[18px]",
                        "min-w-[18px]",
                        "items-center",
                        "justify-center",

                        "rounded-full",

                        "bg-[var(--afriskill-gold)]",

                        "px-1",

                        "text-[9px]",
                        "font-black",
                        "leading-none",
                        "text-[var(--afriskill-navy)]",

                        "shadow-[0_2px_6px_rgba(0,0,0,0.20)]",
                      ].join(" ")}
                    >
                      {visibleItemCount}
                    </span>
                  ) : null}
                </span>

                {/* ======================================================
                    LIBELLÉ
                    ====================================================== */}

                <span
                  className={[
                    "block",
                    "max-w-full",
                    "truncate",

                    "text-[10px]",
                    "font-semibold",
                    "leading-[1.15]",

                    "min-[380px]:text-[11px]",

                    isActive
                      ? "font-bold"
                      : "",
                  ].join(" ")}
                >
                  {item.label}
                </span>
              </Link>
            );
          },
        )}
      </div>

      {/* ================================================================
          SAFE AREA
          ================================================================ */}

      <div
        aria-hidden="true"
        className="h-[env(safe-area-inset-bottom,0px)]"
      />
    </nav>
  );
}