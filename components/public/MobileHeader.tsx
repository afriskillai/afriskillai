"use client";

import Image from "next/image";
import Link from "next/link";

import CartButton from "@/components/cart/CartButton";
import { publicRoutes } from "@/lib/public-navigation";

/**
 * ============================================================================
 * AFRISKILL AI — MOBILE HEADER
 * ============================================================================
 *
 * Header destiné aux écrans mobile et tablette.
 *
 * Structure :
 * - logo AfriSkill AI à gauche ;
 * - panier à droite ;
 * - bouton d'ouverture du menu.
 *
 * La hauteur est contrôlée par :
 *
 * --mobile-header-height
 *
 * défini dans app/globals.css.
 *
 * Le composant parent PublicHeader fournit déjà :
 * - le conteneur horizontal ;
 * - la hauteur globale ;
 * - le fond ;
 * - la bordure ;
 * - l'ombre ;
 * - le positionnement fixe.
 *
 * Ce composant reste donc concentré sur son contenu.
 * ============================================================================
 */

type MobileHeaderProps = Readonly<{
  onOpenMenu: () => void;
}>;

/**
 * Icône du menu principal.
 */
function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="22"
      height="22"
      className="h-[22px] w-[22px] shrink-0"
    >
      <path
        d="M4 7H20M4 12H20M4 17H20"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MobileHeader({
  onOpenMenu,
}: MobileHeaderProps) {
  return (
    <div
      className={[
        "flex",
        "h-full",
        "w-full",
        "min-w-0",
        "items-center",
        "justify-between",
        "gap-2",
      ].join(" ")}
    >
      {/* ================================================================
          LOGO AFRISKILL AI
          ================================================================ */}

      <Link
        href={publicRoutes.home}
        aria-label="AfriSkill AI - Accueil"
        className={[
          "flex",
          "min-w-0",
          "flex-1",
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
          sizes="(max-width: 359px) 132px, (max-width: 639px) 150px, 160px"
          className={[
            "h-auto",
            "w-[132px]",
            "max-w-full",
            "shrink-0",
            "object-contain",
            "object-left",

            "min-[360px]:w-[145px]",
            "sm:w-[160px]",
          ].join(" ")}
        />
      </Link>

      {/* ================================================================
          ACTIONS
          ================================================================ */}

      <div
        className={[
          "flex",
          "shrink-0",
          "items-center",
          "justify-end",
          "gap-1.5",
          "sm:gap-2",
        ].join(" ")}
      >
        {/* --------------------------------------------------------------
            PANIER
            -------------------------------------------------------------- */}

        <CartButton compact />

        {/* --------------------------------------------------------------
            MENU
            -------------------------------------------------------------- */}

        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Ouvrir le menu principal"
          aria-haspopup="dialog"
          className={[
            "inline-flex",
            "h-10",
            "w-10",
            "shrink-0",
            "items-center",
            "justify-center",

            "rounded-xl",
            "border",
            "border-[var(--border)]",

            "bg-white",
            "text-[var(--text-primary)]",

            "shadow-[var(--shadow-xs)]",

            "transition-[background-color,border-color,color,box-shadow,transform]",
            "duration-200",

            "hover:border-[var(--afriskill-cyan)]/50",
            "hover:bg-[#F2FBFF]",
            "hover:text-[var(--afriskill-blue)]",

            "focus-visible:outline-none",
            "focus-visible:ring-2",
            "focus-visible:ring-[var(--afriskill-cyan)]",
            "focus-visible:ring-offset-2",
            "focus-visible:ring-offset-white",

            "active:scale-[0.97]",
          ].join(" ")}
        >
          <MenuIcon />
        </button>
      </div>
    </div>
  );
}