"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import CartButton from "@/components/cart/CartButton";
import {
  desktopNavigation,
  isNavigationItemActive,
  publicRoutes,
} from "@/lib/public-navigation";

/**
 * ============================================================================
 * AFRISKILL AI — DESKTOP NAVIGATION
 * ============================================================================
 *
 * Navigation principale du header desktop.
 *
 * Objectifs :
 * - rendu SSR/client déterministe ;
 * - aucune dépendance à window/document pendant le rendu ;
 * - navigation active calculée uniquement depuis usePathname() ;
 * - structure DOM stable pendant l'hydratation ;
 * - conservation du design AfriSkill AI ;
 * - accessibilité clavier ;
 * - responsive desktop >= 1024px.
 * ============================================================================
 */

type DesktopNavigationProps = Readonly<{
  className?: string;
}>;

/**
 * ============================================================================
 * ICÔNE DU COMPTE
 * ============================================================================
 *
 * SVG entièrement statique.
 *
 * Il ne dépend :
 * - ni du navigateur ;
 * - ni de la taille de l'écran ;
 * - ni d'un état React ;
 * - ni d'une valeur aléatoire ;
 * - ni d'une date.
 *
 * Le serveur et le client génèrent donc exactement le même SVG.
 * ============================================================================
 */

function AccountIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      width={18}
      height={18}
      className="h-[18px] w-[18px] shrink-0"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth={1.8}
      />

      <path
        d="M4.5 20c.8-3.5 3.4-5.5 7.5-5.5s6.7 2 7.5 5.5"
        stroke="currentColor"
        strokeWidth={1.8}
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

export default function DesktopNavigation({
  className = "",
}: DesktopNavigationProps) {
  const pathname =
    usePathname();

  const accountIsActive =
    isNavigationItemActive(
      pathname,
      publicRoutes.account,
    );

  return (
    <div
      className={[
        "hidden",
        "min-w-0",
        "flex-1",
        "items-center",
        "justify-end",
        "gap-3",

        "lg:flex",

        "xl:gap-4",

        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ================================================================
          NAVIGATION PRINCIPALE
          ================================================================ */}

      <nav
        aria-label="Navigation principale"
        className={[
          "flex",
          "min-w-0",
          "items-center",
          "justify-end",
          "gap-0.5",

          "xl:gap-1",
        ].join(" ")}
      >
        {desktopNavigation.map(
          (item) => {
            const isActive =
              isNavigationItemActive(
                pathname,
                item.href,
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={
                  isActive
                    ? "page"
                    : undefined
                }
                className={[
                  "relative",

                  "inline-flex",
                  "min-h-10",
                  "shrink-0",
                  "items-center",
                  "justify-center",

                  "whitespace-nowrap",

                  "rounded-lg",

                  "px-2.5",
                  "py-2",

                  "text-[13px]",
                  "font-semibold",
                  "leading-none",

                  "transition-colors",
                  "duration-200",

                  "xl:px-3.5",
                  "xl:text-sm",

                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-[var(--afriskill-cyan)]",
                  "focus-visible:ring-offset-2",
                  "focus-visible:ring-offset-white",

                  isActive
                    ? [
                        "bg-[#EAF8FF]",
                        "text-[var(--afriskill-blue)]",
                      ].join(" ")
                    : [
                        "text-[var(--text-secondary)]",
                        "hover:bg-[var(--surface-muted)]",
                        "hover:text-[var(--text-primary)]",
                      ].join(" "),
                ].join(" ")}
              >
                <span className="relative z-10">
                  {item.label}
                </span>

                {isActive ? (
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute",
                      "bottom-1",
                      "left-1/2",

                      "h-0.5",
                      "w-5",

                      "-translate-x-1/2",

                      "rounded-full",

                      "bg-[var(--afriskill-gold)]",
                    ].join(" ")}
                  />
                ) : null}
              </Link>
            );
          },
        )}
      </nav>

      {/* ================================================================
          SÉPARATEUR
          ================================================================ */}

      <div
        aria-hidden="true"
        className={[
          "h-7",
          "w-px",
          "shrink-0",
          "bg-[var(--border)]",
        ].join(" ")}
      />

      {/* ================================================================
          ACTIONS
          ================================================================ */}

      <div
        className={[
          "flex",
          "shrink-0",
          "items-center",
          "gap-2",
        ].join(" ")}
      >
        {/* ==============================================================
            PANIER
            ============================================================== */}

        <CartButton />

        {/* ==============================================================
            COMPTE
            ============================================================== */}

        <Link
          href={publicRoutes.account}
          aria-current={
            accountIsActive
              ? "page"
              : undefined
          }
          className={[
            "inline-flex",
            "min-h-10",
            "shrink-0",
            "items-center",
            "justify-center",
            "gap-2",

            "whitespace-nowrap",

            "rounded-xl",
            "border",

            "px-3",
            "py-2",

            "text-[13px]",
            "font-bold",
            "leading-none",

            /**
             * Important :
             *
             * le bouton possède toujours un fond sombre/bleu.
             * La couleur du texte et du SVG est explicitement blanche.
             */
            "!text-white",

            "transition-[background-color,border-color,box-shadow,transform,color]",
            "duration-200",

            "xl:min-h-11",
            "xl:px-4",
            "xl:text-sm",

            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-[var(--afriskill-cyan)]",
            "focus-visible:ring-offset-2",
            "focus-visible:ring-offset-white",

            accountIsActive
              ? [
                  "border-[var(--afriskill-blue)]",
                  "bg-[var(--afriskill-blue)]",
                  "shadow-[var(--shadow-soft)]",
                ].join(" ")
              : [
                  "border-[var(--afriskill-navy)]",
                  "bg-[var(--afriskill-navy)]",
                  "shadow-[var(--shadow-soft)]",

                  "hover:border-[var(--afriskill-blue)]",
                  "hover:bg-[var(--afriskill-blue)]",
                  "hover:!text-white",
                  "hover:shadow-[var(--shadow-card)]",
                ].join(" "),

            "active:translate-y-px",
          ].join(" ")}
        >
          <span
            aria-hidden="true"
            className="inline-flex shrink-0 !text-white"
          >
            <AccountIcon />
          </span>

          <span className="!text-white">
            Mon compte
          </span>
        </Link>
      </div>
    </div>
  );
}