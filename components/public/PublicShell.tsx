"use client";

import type { ReactNode } from "react";

import { CartProvider } from "@/components/cart/CartProvider";
import InstallAppPrompt from "@/components/public/InstallAppPrompt";
import MobileBottomNavigation from "@/components/public/MobileBottomNavigation";
import PublicHeader from "@/components/public/PublicHeader";

/**
 * ============================================================================
 * AFRISKILL AI — PUBLIC SHELL
 * ============================================================================
 *
 * Structure principale de tout l'espace public.
 *
 * Responsabilités :
 * - fournir le contexte du panier ;
 * - afficher le header public ;
 * - réserver correctement l'espace du header fixe ;
 * - réserver l'espace de la navigation mobile ;
 * - afficher la navigation mobile ;
 * - conserver le prompt d'installation de l'application ;
 * - garantir une structure cohérente desktop / mobile.
 *
 * IMPORTANT :
 * Ce composant ne doit contenir aucun style spécifique :
 * - au Hero ;
 * - aux cartes de formation ;
 * - au catalogue ;
 * - aux sections marketing.
 *
 * Ces responsabilités appartiennent aux composants concernés.
 * ============================================================================
 */

type PublicShellProps = Readonly<{
  children: ReactNode;
}>;

export default function PublicShell({
  children,
}: PublicShellProps) {
  return (
    <CartProvider>
      <div
        className={[
          "relative",
          "isolate",
          "min-h-dvh",
          "w-full",
          "overflow-x-clip",
          "bg-[var(--background)]",
          "text-[var(--foreground)]",
        ].join(" ")}
      >
        {/* ================================================================
            HEADER PUBLIC
            ================================================================ */}

        <PublicHeader />

        {/* ================================================================
            CONTENU PRINCIPAL
            ================================================================

            Mobile :
            - réserve exactement la hauteur du header mobile ;
            - réserve la hauteur de la navigation inférieure ;
            - prend en compte la safe area de l'appareil.

            Desktop :
            - utilise la hauteur exacte du header desktop ;
            - supprime l'espace réservé à la navigation mobile.
            ================================================================ */}

        <main
          id="public-content"
          className={[
            "relative",
            "z-0",
            "w-full",
            "min-h-[calc(100dvh-var(--mobile-header-height))]",
            "pt-[var(--mobile-header-height)]",
            "pb-[calc(var(--mobile-navigation-height)+env(safe-area-inset-bottom,0px))]",
            "lg:min-h-[calc(100dvh-var(--desktop-header-height))]",
            "lg:pt-[var(--desktop-header-height)]",
            "lg:pb-0",
          ].join(" ")}
        >
          {children}
        </main>

        {/* ================================================================
            NAVIGATION MOBILE
            ================================================================ */}

        <MobileBottomNavigation />

        {/* ================================================================
            INSTALLATION PWA
            ================================================================ */}

        <InstallAppPrompt />
      </div>
    </CartProvider>
  );
}