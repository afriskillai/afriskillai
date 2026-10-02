"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useId,
  useRef,
} from "react";

import InstallAppButton from "@/components/public/InstallAppButton";
import {
  isNavigationItemActive,
  publicRoutes,
  secondaryNavigation,
} from "@/lib/public-navigation";

/**
 * ============================================================================
 * AFRISKILL AI — MOBILE MENU
 * ============================================================================
 *
 * Menu latéral principal pour mobile et tablette.
 *
 * Fonctionnalités :
 * - panneau latéral responsive ;
 * - overlay de fermeture ;
 * - fermeture avec la touche Escape ;
 * - verrouillage du scroll de la page ;
 * - focus automatique sur le bouton de fermeture ;
 * - restauration du focus à la fermeture ;
 * - navigation avec état actif ;
 * - accès au compte ;
 * - installation PWA ;
 * - prise en charge des safe areas mobiles.
 *
 * Le menu disparaît automatiquement en mode desktop via PublicHeader.
 * ============================================================================
 */

type MobileMenuProps = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

/**
 * Icône de fermeture.
 */
function CloseIcon() {
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
        d="M6 6l12 12M18 6 6 18"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Flèche des liens de navigation.
 */
function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="16"
      height="16"
      className="h-4 w-4 shrink-0"
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Icône du compte utilisateur.
 */
function AccountIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      width="18"
      height="18"
      className="h-[18px] w-[18px] shrink-0"
    >
      <path
        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />

      <path
        d="M4.5 20c.8-3.5 3.4-5.5 7.5-5.5s6.7 2 7.5 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function MobileMenu({
  open,
  onClose,
}: MobileMenuProps) {
  const pathname = usePathname();
  const titleId = useId();

  const closeButtonRef =
    useRef<HTMLButtonElement>(null);

  const previouslyFocusedElementRef =
    useRef<HTMLElement | null>(null);

  /**
   * Gestion du comportement modal.
   *
   * Lorsque le menu s'ouvre :
   * - mémorise l'élément actuellement actif ;
   * - bloque le scroll du document ;
   * - place le focus sur le bouton de fermeture ;
   * - permet la fermeture avec Escape.
   *
   * Lorsque le menu se ferme :
   * - restaure le scroll ;
   * - restitue le focus à l'élément précédent lorsque possible.
   */
  useEffect(() => {
    if (!open) {
      return;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousBodyOverflow =
      document.body.style.overflow;

    const previousHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow =
      "hidden";

    const focusFrame =
      window.requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });

    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      window.cancelAnimationFrame(
        focusFrame,
      );

      document.body.style.overflow =
        previousBodyOverflow;

      document.documentElement.style.overflow =
        previousHtmlOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );

      const elementToRestore =
        previouslyFocusedElementRef.current;

      if (
        elementToRestore &&
        document.contains(elementToRestore)
      ) {
        window.requestAnimationFrame(() => {
          elementToRestore.focus();
        });
      }

      previouslyFocusedElementRef.current =
        null;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const accountIsActive =
    isNavigationItemActive(
      pathname,
      publicRoutes.account,
    );

  return (
    <div
      className={[
        "fixed",
        "inset-0",
        "z-[70]",
        "lg:hidden",
      ].join(" ")}
    >
      {/* ================================================================
          OVERLAY
          ================================================================ */}

      <button
        type="button"
        aria-label="Fermer le menu"
        onClick={onClose}
        tabIndex={-1}
        className={[
          "absolute",
          "inset-0",
          "h-full",
          "w-full",
          "cursor-default",
          "bg-[#020817]/70",
          "backdrop-blur-[3px]",
        ].join(" ")}
      />

      {/* ================================================================
          PANNEAU
          ================================================================ */}

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={[
          "absolute",
          "right-0",
          "top-0",
          "flex",
          "h-dvh",
          "w-[min(90vw,390px)]",
          "max-w-full",
          "flex-col",
          "overflow-hidden",

          "border-l",
          "border-[var(--border)]",

          "bg-white",
          "text-[var(--text-primary)]",

          "shadow-[-24px_0_80px_rgba(2,8,23,0.28)]",

          "min-[420px]:w-[390px]",
        ].join(" ")}
      >
        {/* ==============================================================
            EN-TÊTE
            ============================================================== */}

        <div
          className={[
            "flex",
            "min-h-[var(--mobile-header-height)]",
            "shrink-0",
            "items-center",
            "justify-between",
            "gap-3",

            "border-b",
            "border-[var(--border)]",

            "px-4",
            "sm:px-5",
          ].join(" ")}
        >
          <div className="min-w-0 flex-1">
            <Image
              src="/logo/logo.png"
              alt="AfriSkill AI"
              width={520}
              height={150}
              sizes="150px"
              className={[
                "h-auto",
                "w-[145px]",
                "max-w-full",
                "object-contain",
                "object-left",
                "sm:w-[150px]",
              ].join(" ")}
            />

            <p
              id={titleId}
              className="afr-sr-only"
            >
              Menu principal AfriSkill AI
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu principal"
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

              "transition-[background-color,border-color,color,transform]",
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
            <CloseIcon />
          </button>
        </div>

        {/* ==============================================================
            CONTENU SCROLLABLE
            ============================================================== */}

        <div
          className={[
            "min-h-0",
            "flex-1",
            "overflow-y-auto",
            "overscroll-contain",
            "px-4",
            "py-5",
            "sm:px-5",
            "sm:py-6",
          ].join(" ")}
        >
          {/* ============================================================
              NAVIGATION
              ============================================================ */}

          <p
            className={[
              "mb-3",
              "text-[11px]",
              "font-bold",
              "uppercase",
              "tracking-[0.16em]",
              "text-[var(--afriskill-blue)]",
            ].join(" ")}
          >
            Navigation
          </p>

          <nav
            aria-label="Navigation mobile"
            className="space-y-2"
          >
            {secondaryNavigation.map(
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
                    onClick={onClose}
                    aria-current={
                      isActive
                        ? "page"
                        : undefined
                    }
                    className={[
                      "group",
                      "relative",
                      "flex",
                      "min-h-[54px]",
                      "w-full",
                      "items-center",
                      "justify-between",
                      "gap-3",
                      "overflow-hidden",

                      "rounded-xl",
                      "border",

                      "px-4",
                      "py-3",

                      "transition-[background-color,border-color,color,box-shadow]",
                      "duration-200",

                      "focus-visible:outline-none",
                      "focus-visible:ring-2",
                      "focus-visible:ring-[var(--afriskill-cyan)]",
                      "focus-visible:ring-offset-2",
                      "focus-visible:ring-offset-white",

                      isActive
                        ? [
                            "border-[var(--afriskill-cyan)]/30",
                            "bg-[#EAF8FF]",
                            "text-[var(--afriskill-blue)]",
                            "shadow-[var(--shadow-xs)]",
                          ].join(" ")
                        : [
                            "border-[var(--border)]",
                            "bg-white",
                            "text-[var(--text-secondary)]",
                            "hover:border-[var(--afriskill-cyan)]/30",
                            "hover:bg-[var(--surface-soft)]",
                            "hover:text-[var(--text-primary)]",
                          ].join(" "),
                    ].join(" ")}
                  >
                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className={[
                          "absolute",
                          "bottom-0",
                          "left-4",
                          "right-4",
                          "h-0.5",
                          "rounded-full",
                          "bg-[var(--afriskill-gold)]",
                        ].join(" ")}
                      />
                    ) : null}

                    <span className="min-w-0 flex-1">
                      <span
                        className={[
                          "block",
                          "truncate",
                          "text-sm",
                          "font-bold",
                          "leading-5",
                        ].join(" ")}
                      >
                        {item.label}
                      </span>

                      {item.description ? (
                        <span
                          className={[
                            "mt-0.5",
                            "block",
                            "line-clamp-2",
                            "text-[11px]",
                            "font-medium",
                            "leading-4",
                            isActive
                              ? "text-[var(--afriskill-blue)]/70"
                              : "text-[var(--text-muted)]",
                          ].join(" ")}
                        >
                          {item.description}
                        </span>
                      ) : null}
                    </span>

                    <span
                      aria-hidden="true"
                      className={[
                        "shrink-0",
                        "transition-transform",
                        "duration-200",
                        "group-hover:translate-x-0.5",
                        isActive
                          ? "text-[var(--afriskill-blue)]"
                          : "text-[var(--text-subtle)]",
                      ].join(" ")}
                    >
                      <ArrowIcon />
                    </span>
                  </Link>
                );
              },
            )}
          </nav>

          {/* ============================================================
              COMPTE
              ============================================================ */}

          <div
            aria-hidden="true"
            className={[
              "my-5",
              "h-px",
              "bg-[var(--border)]",
              "sm:my-6",
            ].join(" ")}
          />

          <Link
            href={publicRoutes.account}
            onClick={onClose}
            aria-current={
              accountIsActive
                ? "page"
                : undefined
            }
            className={[
              "flex",
              "min-h-[50px]",
              "w-full",
              "items-center",
              "justify-center",
              "gap-2",

              "rounded-xl",
              "border",
              "border-[var(--afriskill-navy)]",

              "bg-[var(--afriskill-navy)]",

              "px-4",
              "py-3",

              "text-sm",
              "font-bold",
              "text-white",

              "shadow-[var(--shadow-soft)]",

              "transition-[background-color,border-color,box-shadow,transform]",
              "duration-200",

              "hover:border-[var(--afriskill-blue)]",
              "hover:bg-[var(--afriskill-blue)]",
              "hover:shadow-[var(--shadow-card)]",

              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-[var(--afriskill-cyan)]",
              "focus-visible:ring-offset-2",
              "focus-visible:ring-offset-white",

              "active:translate-y-px",
            ].join(" ")}
          >
            <AccountIcon />

            <span>Mon compte</span>
          </Link>

          {/* ============================================================
              INSTALLATION PWA
              ============================================================ */}

          <section
            aria-label="Installer AfriSkill AI"
            className={[
              "mt-5",
              "overflow-hidden",

              "rounded-2xl",
              "border",
              "border-[var(--afriskill-gold)]/25",

              "bg-[#FFF9E8]",

              "p-4",
              "sm:mt-6",
            ].join(" ")}
          >
            <div
              className={[
                "mb-3",
                "flex",
                "h-10",
                "w-10",
                "items-center",
                "justify-center",
                "overflow-hidden",

                "rounded-xl",
                "border",
                "border-[var(--afriskill-gold)]/25",

                "bg-white",
              ].join(" ")}
            >
              <Image
                src="/icon/icon.png"
                alt=""
                width={40}
                height={40}
                sizes="40px"
                className="h-10 w-10 object-cover"
              />
            </div>

            <p
              className={[
                "text-sm",
                "font-bold",
                "leading-5",
                "text-[var(--text-primary)]",
              ].join(" ")}
            >
              AfriSkill AI sur votre appareil
            </p>

            <p
              className={[
                "mt-1.5",
                "text-xs",
                "leading-5",
                "text-[var(--text-muted)]",
              ].join(" ")}
            >
              Installez AfriSkill AI pour
              accéder plus rapidement à vos
              formations et à votre espace
              personnel.
            </p>

            <InstallAppButton className="mt-4 w-full" />
          </section>
        </div>

        {/* ==============================================================
            BAS DU PANNEAU
            ============================================================== */}

        <div
          className={[
            "shrink-0",
            "border-t",
            "border-[var(--border)]",
            "bg-[var(--surface-soft)]/90",

            "px-4",
            "pt-3",
            "sm:px-5",
            "sm:pt-4",

            "pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]",
            "sm:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
          ].join(" ")}
        >
          <p
            className={[
              "text-center",
              "text-[11px]",
              "font-medium",
              "leading-4",
              "text-[var(--text-subtle)]",
            ].join(" ")}
          >
            © {new Date().getFullYear()}{" "}
            AfriSkill AI
          </p>
        </div>
      </aside>
    </div>
  );
}