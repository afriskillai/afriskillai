"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";

type AdminHeaderProps = Readonly<{
  adminEmail: string;
  onOpenMenu: () => void;
}>;

type PageInformation = {
  title: string;
  description: string;
};

function getPageInformation(
  pathname: string,
): PageInformation {
  if (pathname === "/admin/dashboard") {
    return {
      title: "Tableau de bord",
      description:
        "Vue d’ensemble de votre activité AfriSkill AI.",
    };
  }

  if (
    pathname === "/admin/formations/nouvelle"
  ) {
    return {
      title: "Nouvelle formation",
      description:
        "Créez et préparez une nouvelle formation.",
    };
  }

  if (
    pathname.startsWith("/admin/formations")
  ) {
    return {
      title: "Formations",
      description:
        "Gérez votre catalogue et vos contenus pédagogiques.",
    };
  }

  if (
    pathname.startsWith("/admin/commandes")
  ) {
    return {
      title: "Commandes",
      description:
        "Consultez et suivez les commandes de la plateforme.",
    };
  }

  if (
    pathname.startsWith("/admin/clients")
  ) {
    return {
      title: "Clients",
      description:
        "Gérez les apprenants et leurs accès.",
    };
  }

  if (
    pathname.startsWith("/admin/contenus")
  ) {
    return {
      title: "Contenus",
      description:
        "Organisez les vidéos, PDF et ressources pédagogiques.",
    };
  }

  if (
    pathname.startsWith("/admin/paiements")
  ) {
    return {
      title: "Paiements",
      description:
        "Suivez les transactions et les encaissements.",
    };
  }

  if (
    pathname.startsWith(
      "/admin/accompagnements",
    )
  ) {
    return {
      title: "Accompagnements",
      description:
        "Suivez les demandes et accompagnements des apprenants.",
    };
  }

  if (
    pathname.startsWith(
      "/admin/statistiques",
    )
  ) {
    return {
      title: "Statistiques",
      description:
        "Analysez les performances de votre plateforme.",
    };
  }

  if (
    pathname.startsWith("/admin/parametres")
  ) {
    return {
      title: "Paramètres",
      description:
        "Configurez l’administration AfriSkill AI.",
    };
  }

  return {
    title: "Administration",
    description:
      "Centre de gestion AfriSkill AI.",
  };
}

export default function AdminHeader({
  adminEmail,
  onOpenMenu,
}: AdminHeaderProps) {
  const pathname = usePathname();

  const [profileOpen, setProfileOpen] =
    useState(false);

  const profileRef =
    useRef<HTMLDivElement>(null);

  const page = getPageInformation(pathname);

  /*
   * Gestion du clic extérieur et de la touche Échap.
   *
   * Les mises à jour d'état ont lieu uniquement
   * dans les callbacks des événements du navigateur.
   * Cela évite l'erreur ESLint
   * react-hooks/set-state-in-effect.
   */
  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      const profileElement =
        profileRef.current;

      if (
        profileElement &&
        !profileElement.contains(
          event.target as Node,
        )
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );

      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-30",
        "border-b border-slate-200/80",
        "bg-white/90",
        "backdrop-blur-xl",
      ].join(" ")}
    >
      <div
        className={[
          "flex min-h-[82px]",
          "items-center justify-between",
          "gap-4",
          "px-4 sm:px-6 xl:px-8",
        ].join(" ")}
      >
        {/* =========================================================
            GAUCHE
            ========================================================= */}

        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Ouvrir le menu d’administration"
            className={[
              "flex h-11 w-11 shrink-0",
              "items-center justify-center",
              "rounded-xl",
              "border border-slate-200",
              "bg-white",
              "text-slate-600",
              "shadow-sm",
              "transition duration-200",
              "hover:border-blue-200",
              "hover:bg-blue-50",
              "hover:text-blue-700",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-blue-500",
              "focus-visible:ring-offset-2",
              "lg:hidden",
            ].join(" ")}
          >
            <MenuIcon />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1
                className={[
                  "truncate",
                  "text-lg font-bold",
                  "tracking-tight",
                  "text-slate-950",
                  "sm:text-xl",
                ].join(" ")}
              >
                {page.title}
              </h1>

              <span
                aria-hidden="true"
                className={[
                  "hidden h-1.5 w-1.5",
                  "rounded-full",
                  "bg-amber-400",
                  "sm:block",
                ].join(" ")}
              />
            </div>

            <p
              className={[
                "mt-0.5 hidden truncate",
                "text-sm text-slate-500",
                "sm:block",
              ].join(" ")}
            >
              {page.description}
            </p>
          </div>
        </div>

        {/* =========================================================
            DROITE
            ========================================================= */}

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {/* ÉTAT SYSTÈME */}

          <div
            className={[
              "hidden items-center gap-2",
              "rounded-xl",
              "border border-emerald-100",
              "bg-emerald-50",
              "px-3 py-2",
              "text-xs font-semibold",
              "text-emerald-700",
              "md:flex",
            ].join(" ")}
          >
            <span
              aria-hidden="true"
              className={[
                "h-2 w-2",
                "rounded-full",
                "bg-emerald-500",
              ].join(" ")}
            />

            Système opérationnel
          </div>

          <div
            aria-hidden="true"
            className="hidden h-8 w-px bg-slate-200 sm:block"
          />

          {/* =======================================================
              PROFIL ADMINISTRATEUR
              ======================================================= */}

          <div
            ref={profileRef}
            className="relative"
          >
            <button
              type="button"
              onClick={() => {
                setProfileOpen(
                  (current) => !current,
                );
              }}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-label="Ouvrir le menu administrateur"
              className={[
                "flex items-center gap-3",
                "rounded-2xl",
                "border border-transparent",
                "p-1.5",
                "transition duration-200",
                "hover:border-slate-200",
                "hover:bg-slate-50",
                "focus-visible:outline-none",
                "focus-visible:ring-2",
                "focus-visible:ring-blue-500",
                "focus-visible:ring-offset-2",
              ].join(" ")}
            >
              <div
                className={[
                  "relative h-10 w-10",
                  "shrink-0 overflow-hidden",
                  "rounded-xl",
                  "border border-amber-200",
                  "bg-[#07142d]",
                  "shadow-sm",
                ].join(" ")}
              >
                <Image
                  src="/icon/icon.png"
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>

              <div className="hidden min-w-0 text-left md:block">
                <p
                  className={[
                    "max-w-[180px] truncate",
                    "text-sm font-semibold",
                    "text-slate-900",
                  ].join(" ")}
                >
                  Administrateur
                </p>

                <p
                  className={[
                    "max-w-[180px] truncate",
                    "text-xs text-slate-500",
                  ].join(" ")}
                >
                  {adminEmail}
                </p>
              </div>

              <span className="hidden text-slate-400 md:block">
                <ChevronIcon
                  open={profileOpen}
                />
              </span>
            </button>

            {/* =====================================================
                MENU PROFIL
                ===================================================== */}

            {profileOpen ? (
              <div
                role="menu"
                aria-label="Menu administrateur"
                className={[
                  "absolute right-0",
                  "top-[calc(100%+10px)]",
                  "w-[280px]",
                  "overflow-hidden",
                  "rounded-2xl",
                  "border border-slate-200",
                  "bg-white",
                  "p-2",
                  "shadow-2xl",
                  "shadow-slate-900/10",
                ].join(" ")}
              >
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={[
                        "relative h-11 w-11",
                        "shrink-0 overflow-hidden",
                        "rounded-xl",
                        "bg-[#07142d]",
                      ].join(" ")}
                    >
                      <Image
                        src="/icon/icon.png"
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        Administrateur
                      </p>

                      <p className="truncate text-xs text-slate-500">
                        {adminEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={[
                    "mt-2 flex",
                    "items-center gap-2",
                    "rounded-xl",
                    "px-3 py-2.5",
                    "text-xs",
                    "text-slate-500",
                  ].join(" ")}
                >
                  <ShieldIcon />

                  <span>
                    Session administrateur
                    sécurisée
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function Icon({
  children,
  size = 20,
}: Readonly<{
  children: ReactNode;
  size?: number;
}>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function MenuIcon() {
  return (
    <Icon>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Icon>
  );
}

function ShieldIcon() {
  return (
    <Icon size={16}>
      <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6Z" />

      <path d="m9.5 12 1.5 1.5 3.5-4" />
    </Icon>
  );
}

function ChevronIcon({
  open,
}: Readonly<{
  open: boolean;
}>) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[
        "transition-transform duration-200",
        open ? "rotate-180" : "",
      ].join(" ")}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}