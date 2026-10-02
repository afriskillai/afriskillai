"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import DesktopNavigation from "@/components/public/DesktopNavigation";
import MobileHeader from "@/components/public/MobileHeader";
import MobileMenu from "@/components/public/MobileMenu";
import { publicRoutes } from "@/lib/public-navigation";

/**
 * ============================================================================
 * AFRISKILL AI — PUBLIC HEADER
 * ============================================================================
 *
 * Header principal de l'espace public.
 *
 * Structure :
 *
 * MOBILE / TABLETTE
 * - MobileHeader
 * - ouverture du menu mobile
 *
 * DESKTOP
 * - logo AfriSkill AI
 * - DesktopNavigation
 *
 * Le header est fixe et utilise exactement les hauteurs définies dans :
 *
 * app/globals.css
 *
 * --mobile-header-height
 * --desktop-header-height
 *
 * PublicShell.tsx utilise les mêmes variables afin que le contenu commence
 * toujours exactement sous le header.
 * ============================================================================
 */

export default function PublicHeader() {
  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  /**
   * Ouvre le menu mobile.
   */
  const openMobileMenu =
    useCallback(() => {
      setMobileMenuOpen(true);
    }, []);

  /**
   * Ferme le menu mobile.
   */
  const closeMobileMenu =
    useCallback(() => {
      setMobileMenuOpen(false);
    }, []);

  /**
   * Si le menu mobile est ouvert et que l'utilisateur
   * agrandit ensuite l'écran jusqu'au breakpoint desktop,
   * on ferme automatiquement le menu.
   */
  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        "(min-width: 1024px)",
      );

    const handleDesktopChange = (
      event: MediaQueryListEvent,
    ) => {
      if (event.matches) {
        setMobileMenuOpen(false);
      }
    };

    mediaQuery.addEventListener(
      "change",
      handleDesktopChange,
    );

    return () => {
      mediaQuery.removeEventListener(
        "change",
        handleDesktopChange,
      );
    };
  }, []);

  return (
    <>
      <header
        className={[
          "fixed",
          "inset-x-0",
          "top-0",
          "z-50",
          "w-full",
          "border-b",
          "border-[var(--border)]/80",
          "bg-white/95",
          "text-[var(--text-primary)]",
          "shadow-[var(--shadow-header)]",
          "backdrop-blur-xl",
          "supports-[backdrop-filter]:bg-white/90",
        ].join(" ")}
      >
        {/* ================================================================
            MOBILE / TABLETTE
            ================================================================ */}

        <div
          className={[
            "lg:hidden",
            "h-[var(--mobile-header-height)]",
          ].join(" ")}
        >
          <div
            className={[
              "afr-page-container",
              "h-full",
            ].join(" ")}
          >
            <MobileHeader
              onOpenMenu={
                openMobileMenu
              }
            />
          </div>
        </div>

        {/* ================================================================
            DESKTOP
            ================================================================ */}

        <div
          className={[
            "hidden",
            "lg:block",
            "h-[var(--desktop-header-height)]",
          ].join(" ")}
        >
          <div
            className={[
              "afr-page-container",
              "h-full",
            ].join(" ")}
          >
            <div
              className={[
                "flex",
                "h-full",
                "min-w-0",
                "items-center",
                "gap-6",
                "xl:gap-8",
              ].join(" ")}
            >
              {/* ==========================================================
                  LOGO
                  ========================================================== */}

              <Link
                href={publicRoutes.home}
                aria-label="AfriSkill AI - Accueil"
                className={[
                  "group",
                  "flex",
                  "shrink-0",
                  "items-center",
                  "justify-start",
                  "rounded-lg",
                  "transition-opacity",
                  "duration-200",
                  "hover:opacity-90",
                  "focus-visible:outline-none",
                  "focus-visible:ring-2",
                  "focus-visible:ring-[var(--afriskill-cyan)]",
                  "focus-visible:ring-offset-2",
                  "focus-visible:ring-offset-white",
                ].join(" ")}
              >
                <Image
                  src="/logo/logo.png"
                  alt="AfriSkill AI"
                  width={520}
                  height={150}
                  priority
                  sizes="(min-width: 1280px) 220px, 200px"
                  className={[
                    "h-auto",
                    "w-[200px]",
                    "object-contain",
                    "object-left",
                    "xl:w-[220px]",
                  ].join(" ")}
                />
              </Link>

              {/* ==========================================================
                  NAVIGATION DESKTOP
                  ========================================================== */}

              <div
                className={[
                  "min-w-0",
                  "flex-1",
                ].join(" ")}
              >
                <DesktopNavigation />
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================
            ACCENT VISUEL INFÉRIEUR
            ================================================================ */}

        <div
          aria-hidden="true"
          className={[
            "pointer-events-none",
            "absolute",
            "inset-x-0",
            "bottom-0",
            "h-px",
            "bg-gradient-to-r",
            "from-transparent",
            "via-[var(--afriskill-cyan)]/20",
            "to-transparent",
          ].join(" ")}
        />
      </header>

      {/* ==================================================================
          MENU MOBILE
          ================================================================== */}

      <MobileMenu
        open={mobileMenuOpen}
        onClose={closeMobileMenu}
      />
    </>
  );
}