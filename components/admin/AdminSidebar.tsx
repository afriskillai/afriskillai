"use client";

import Image from "next/image";
import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import {
  type ReactNode,
  useState,
} from "react";

type AdminSidebarProps = Readonly<{
  adminEmail?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}>;

type NavigationChild = {
  label: string;
  href: string;
};

type NavigationItem = {
  label: string;
  href: string;
  icon: ReactNode;
  children?: NavigationChild[];
};

const navigation: NavigationItem[] = [
  {
    label: "Tableau de bord",
    href: "/admin/dashboard",
    icon: <DashboardIcon />,
  },
  {
    label: "Formations",
    href: "/admin/formations",
    icon: <CoursesIcon />,
    children: [
      {
        label: "Toutes les formations",
        href: "/admin/formations",
      },
      {
        label: "Ajouter une formation",
        href: "/admin/formations/nouvelle",
      },
    ],
  },
  {
    label: "Commandes",
    href: "/admin/commandes",
    icon: <OrdersIcon />,
  },
  {
    label: "Clients",
    href: "/admin/clients",
    icon: <UsersIcon />,
  },
  {
    label: "Contenus",
    href: "/admin/contenus",
    icon: <ContentIcon />,
  },
  {
    label: "Paiements",
    href: "/admin/paiements",
    icon: <PaymentIcon />,
  },
  {
    label: "Accompagnements",
    href: "/admin/accompagnements",
    icon: <SupportIcon />,
  },
  {
    label: "Statistiques",
    href: "/admin/statistiques",
    icon: <StatsIcon />,
  },
  {
    label: "Paramètres",
    href: "/admin/parametres",
    icon: <SettingsIcon />,
  },
];

export default function AdminSidebar({
  adminEmail,
  mobileOpen = false,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [
    formationsManuallyOpen,
    setFormationsManuallyOpen,
  ] = useState(false);

  const [
    formationsManuallyClosed,
    setFormationsManuallyClosed,
  ] = useState(false);

  const [
    isLoggingOut,
    setIsLoggingOut,
  ] = useState(false);

  const formationsSectionActive =
    pathname.startsWith(
      "/admin/formations",
    );

  /*
   * Le sous-menu Formations s'ouvre automatiquement
   * lorsqu'une route /admin/formations est active.
   *
   * Aucun useEffect/setState n'est nécessaire.
   */
  const formationsOpen =
    formationsManuallyOpen ||
    (formationsSectionActive &&
      !formationsManuallyClosed);

  function toggleFormations() {
    if (formationsOpen) {
      setFormationsManuallyOpen(false);
      setFormationsManuallyClosed(true);

      return;
    }

    setFormationsManuallyClosed(false);
    setFormationsManuallyOpen(true);
  }

  function closeMobileNavigation() {
    onMobileClose?.();
  }

  function isExactRoute(
    href: string,
  ) {
    return pathname === href;
  }

  function isSectionActive(
    href: string,
  ) {
    if (href === "/admin/dashboard") {
      return pathname === href;
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    );
  }

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      const response = await fetch(
        "/api/admin/deconnexion",
        {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error(
          "La déconnexion a échoué.",
        );
      }

      router.replace("/admin/connexion");
      router.refresh();
    } catch (error) {
      console.error(
        "[AfriSkill AI] Erreur de déconnexion :",
        error,
      );

      setIsLoggingOut(false);
    }
  }

  const sidebar = (
    <aside
      className={[
        "flex h-full w-[290px]",
        "flex-col",
        "border-r border-white/[0.07]",
        "bg-[#050d20]",
        "text-white",
        "shadow-2xl shadow-black/20",
      ].join(" ")}
    >
      {/* =========================================================
          LOGO
          ========================================================= */}

      <div
        className={[
          "flex min-h-[106px]",
          "items-center",
          "border-b border-white/[0.07]",
          "px-6",
        ].join(" ")}
      >
        <Link
          href="/admin/dashboard"
          onClick={closeMobileNavigation}
          className="relative block h-[64px] w-full"
          aria-label="AfriSkill AI - Administration"
        >
          <Image
            src="/logo/logo.png"
            alt="AfriSkill AI"
            fill
            priority
            sizes="240px"
            className="object-contain object-left"
          />
        </Link>
      </div>

      {/* =========================================================
          IDENTITÉ ADMINISTRATION
          ========================================================= */}

      <div className="px-5 pb-3 pt-6">
        <div
          className={[
            "flex items-center gap-3",
            "rounded-2xl",
            "border border-amber-300/10",
            "bg-gradient-to-r",
            "from-amber-300/[0.08]",
            "to-transparent",
            "px-4 py-3",
          ].join(" ")}
        >
          <div
            className={[
              "flex h-9 w-9 shrink-0",
              "items-center justify-center",
              "rounded-xl",
              "bg-amber-300/10",
              "text-amber-300",
            ].join(" ")}
          >
            <ShieldIcon />
          </div>

          <div className="min-w-0">
            <p
              className={[
                "truncate",
                "text-xs font-bold uppercase",
                "tracking-[0.16em]",
                "text-amber-300",
              ].join(" ")}
            >
              Administration
            </p>

            <p className="mt-0.5 truncate text-xs text-slate-500">
              Centre de gestion
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          NAVIGATION
          ========================================================= */}

      <nav
        className="flex-1 overflow-y-auto px-4 pb-6 pt-2"
        aria-label="Navigation administration"
      >
        <p
          className={[
            "mb-3 px-3",
            "text-[10px] font-bold uppercase",
            "tracking-[0.2em]",
            "text-slate-600",
          ].join(" ")}
        >
          Menu principal
        </p>

        <div className="space-y-1.5">
          {navigation.map((item) => {
            const active =
              isSectionActive(item.href);

            if (item.children) {
              return (
                <div key={item.href}>
                  <button
                    type="button"
                    onClick={
                      toggleFormations
                    }
                    aria-expanded={
                      formationsOpen
                    }
                    aria-controls="admin-formations-submenu"
                    className={[
                      "group relative flex",
                      "w-full items-center gap-3",
                      "rounded-xl",
                      "px-3.5 py-3",
                      "text-left text-sm",
                      "font-medium",
                      "transition-all",
                      active
                        ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/[0.06] text-white"
                        : "text-slate-400 hover:bg-white/[0.045] hover:text-white",
                    ].join(" ")}
                  >
                    {active ? (
                      <span
                        aria-hidden="true"
                        className={[
                          "absolute bottom-2",
                          "left-0 top-2",
                          "w-[3px]",
                          "rounded-r-full",
                          "bg-gradient-to-b",
                          "from-cyan-300",
                          "to-blue-500",
                        ].join(" ")}
                      />
                    ) : null}

                    <span
                      className={[
                        "flex h-9 w-9 shrink-0",
                        "items-center justify-center",
                        "rounded-xl",
                        "transition",
                        active
                          ? "bg-blue-500/15 text-cyan-300"
                          : "bg-white/[0.035] text-slate-500 group-hover:text-slate-200",
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>

                    <span className="flex-1">
                      {item.label}
                    </span>

                    <ChevronIcon
                      open={
                        formationsOpen
                      }
                    />
                  </button>

                  <div
                    id="admin-formations-submenu"
                    className={[
                      "grid",
                      "transition-all",
                      "duration-200",
                      formationsOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0",
                    ].join(" ")}
                  >
                    <div className="overflow-hidden">
                      <div
                        className={[
                          "ml-[31px] mt-1",
                          "border-l",
                          "border-white/[0.08]",
                          "pb-1 pl-5",
                        ].join(" ")}
                      >
                        {item.children.map(
                          (child) => {
                            const childActive =
                              isExactRoute(
                                child.href,
                              );

                            return (
                              <Link
                                key={
                                  child.href
                                }
                                href={
                                  child.href
                                }
                                onClick={
                                  closeMobileNavigation
                                }
                                aria-current={
                                  childActive
                                    ? "page"
                                    : undefined
                                }
                                className={[
                                  "relative my-1",
                                  "flex min-h-10",
                                  "items-center",
                                  "rounded-lg",
                                  "px-3",
                                  "text-[13px]",
                                  "transition",
                                  childActive
                                    ? "bg-white/[0.055] font-semibold text-cyan-300"
                                    : "text-slate-500 hover:bg-white/[0.035] hover:text-slate-200",
                                ].join(
                                  " ",
                                )}
                              >
                                {childActive ? (
                                  <span
                                    aria-hidden="true"
                                    className={[
                                      "absolute",
                                      "-left-[23px]",
                                      "h-2 w-2",
                                      "rounded-full",
                                      "border-2",
                                      "border-[#050d20]",
                                      "bg-cyan-300",
                                    ].join(
                                      " ",
                                    )}
                                  />
                                ) : null}

                                {
                                  child.label
                                }
                              </Link>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={
                  closeMobileNavigation
                }
                aria-current={
                  active
                    ? "page"
                    : undefined
                }
                className={[
                  "group relative flex",
                  "items-center gap-3",
                  "rounded-xl",
                  "px-3.5 py-3",
                  "text-sm font-medium",
                  "transition-all",
                  active
                    ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/[0.06] text-white"
                    : "text-slate-400 hover:bg-white/[0.045] hover:text-white",
                ].join(" ")}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className={[
                      "absolute bottom-2",
                      "left-0 top-2",
                      "w-[3px]",
                      "rounded-r-full",
                      "bg-gradient-to-b",
                      "from-cyan-300",
                      "to-blue-500",
                    ].join(" ")}
                  />
                ) : null}

                <span
                  className={[
                    "flex h-9 w-9 shrink-0",
                    "items-center justify-center",
                    "rounded-xl",
                    "transition",
                    active
                      ? "bg-blue-500/15 text-cyan-300"
                      : "bg-white/[0.035] text-slate-500 group-hover:text-slate-200",
                  ].join(" ")}
                >
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* =========================================================
          PROFIL ADMINISTRATEUR
          ========================================================= */}

      <div className="border-t border-white/[0.07] p-4">
        <div
          className={[
            "rounded-2xl",
            "border border-white/[0.06]",
            "bg-white/[0.025]",
            "p-3",
          ].join(" ")}
        >
          <div className="flex items-center gap-3">
            <div
              className={[
                "relative flex",
                "h-11 w-11 shrink-0",
                "items-center justify-center",
                "overflow-hidden",
                "rounded-xl",
                "border border-amber-300/20",
                "bg-[#081735]",
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

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                Administrateur
              </p>

              <p
                className="mt-0.5 truncate text-[11px] text-slate-500"
                title={adminEmail}
              >
                {adminEmail ??
                  "AfriSkill AI"}
              </p>
            </div>

            <span
              className={[
                "h-2.5 w-2.5",
                "shrink-0",
                "rounded-full",
                "bg-emerald-400",
                "shadow-[0_0_10px_rgba(52,211,153,0.6)]",
              ].join(" ")}
              title="Session active"
              aria-label="Session active"
            />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={[
              "mt-3 flex h-10 w-full",
              "items-center justify-center",
              "gap-2 rounded-xl",
              "border border-white/[0.07]",
              "bg-white/[0.025]",
              "text-xs font-semibold",
              "text-slate-400",
              "transition",
              "hover:border-red-400/20",
              "hover:bg-red-400/[0.07]",
              "hover:text-red-300",
              "disabled:cursor-not-allowed",
              "disabled:opacity-50",
            ].join(" ")}
          >
            {isLoggingOut ? (
              <>
                <span
                  aria-hidden="true"
                  className={[
                    "h-4 w-4",
                    "animate-spin",
                    "rounded-full",
                    "border-2",
                    "border-slate-500",
                    "border-t-white",
                  ].join(" ")}
                />

                Déconnexion...
              </>
            ) : (
              <>
                <LogoutIcon />
                Se déconnecter
              </>
            )}
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] text-slate-700">
          AfriSkill AI • Administration
        </p>
      </div>
    </aside>
  );

  return (
    <>
      {/* =========================================================
          DESKTOP
          ========================================================= */}

      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        {sidebar}
      </div>

      {/* =========================================================
          MOBILE
          ========================================================= */}

      <div
        className={[
          "fixed inset-0 z-50 lg:hidden",
          mobileOpen
            ? "pointer-events-auto"
            : "pointer-events-none",
        ].join(" ")}
        aria-hidden={!mobileOpen}
      >
        {/* OVERLAY */}

        <button
          type="button"
          aria-label="Fermer le menu"
          onClick={onMobileClose}
          tabIndex={
            mobileOpen ? 0 : -1
          }
          className={[
            "absolute inset-0",
            "bg-black/70",
            "backdrop-blur-sm",
            "transition-opacity",
            "duration-300",
            mobileOpen
              ? "opacity-100"
              : "opacity-0",
          ].join(" ")}
        />

        {/* PANNEAU */}

        <div
          className={[
            "absolute inset-y-0 left-0",
            "transition-transform",
            "duration-300 ease-out",
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full",
          ].join(" ")}
        >
          {sidebar}

          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Fermer"
            tabIndex={
              mobileOpen ? 0 : -1
            }
            className={[
              "absolute right-3 top-3",
              "flex h-9 w-9",
              "items-center justify-center",
              "rounded-xl",
              "border border-white/10",
              "bg-[#071229]",
              "text-slate-400",
              "transition",
              "hover:text-white",
              "focus-visible:outline-none",
              "focus-visible:ring-2",
              "focus-visible:ring-cyan-400",
            ].join(" ")}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
    </>
  );
}

function DashboardIcon() {
  return (
    <Icon>
      <rect
        x="3"
        y="3"
        width="7"
        height="7"
        rx="1.5"
      />

      <rect
        x="14"
        y="3"
        width="7"
        height="7"
        rx="1.5"
      />

      <rect
        x="3"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      />

      <rect
        x="14"
        y="14"
        width="7"
        height="7"
        rx="1.5"
      />
    </Icon>
  );
}

function CoursesIcon() {
  return (
    <Icon>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5Z" />

      <path d="M4 5.5v16" />

      <path d="M8 7h8" />

      <path d="M8 11h6" />
    </Icon>
  );
}

function OrdersIcon() {
  return (
    <Icon>
      <path d="M6 3h12l2 4v14H4V7Z" />

      <path d="M4 7h16" />

      <path d="M9 11a3 3 0 0 0 6 0" />
    </Icon>
  );
}

function UsersIcon() {
  return (
    <Icon>
      <circle
        cx="9"
        cy="8"
        r="3"
      />

      <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />

      <path d="M16 5.5a3 3 0 0 1 0 5.5" />

      <path d="M17 14.5a5 5 0 0 1 3.5 5" />
    </Icon>
  );
}

function ContentIcon() {
  return (
    <Icon>
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
      />

      <path d="m10 9 5 3-5 3Z" />
    </Icon>
  );
}

function PaymentIcon() {
  return (
    <Icon>
      <rect
        x="2.5"
        y="5"
        width="19"
        height="14"
        rx="2"
      />

      <path d="M2.5 9h19" />

      <path d="M7 15h3" />
    </Icon>
  );
}

function SupportIcon() {
  return (
    <Icon>
      <circle
        cx="12"
        cy="12"
        r="9"
      />

      <path d="M8.5 15.5 7 17" />

      <path d="M15.5 15.5 17 17" />

      <path d="M8.5 8.5 7 7" />

      <path d="M15.5 8.5 17 7" />

      <circle
        cx="12"
        cy="12"
        r="3.5"
      />
    </Icon>
  );
}

function StatsIcon() {
  return (
    <Icon>
      <path d="M4 20V10" />

      <path d="M10 20V4" />

      <path d="M16 20v-7" />

      <path d="M22 20H2" />
    </Icon>
  );
}

function SettingsIcon() {
  return (
    <Icon>
      <circle
        cx="12"
        cy="12"
        r="3"
      />

      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
    </Icon>
  );
}

function ShieldIcon() {
  return (
    <Icon size={18}>
      <path d="M12 3 5 6v5c0 5 3 8.5 7 10 4-1.5 7-5 7-10V6Z" />

      <path d="m9.5 12 1.5 1.5 3.5-4" />
    </Icon>
  );
}

function LogoutIcon() {
  return (
    <Icon size={16}>
      <path d="M10 17l5-5-5-5" />

      <path d="M15 12H3" />

      <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
    </Icon>
  );
}

function CloseIcon() {
  return (
    <Icon size={18}>
      <path d="m6 6 12 12" />

      <path d="M18 6 6 18" />
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
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[
        "text-slate-600",
        "transition-transform",
        "duration-200",
        open
          ? "rotate-180"
          : "",
      ].join(" ")}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function Icon({
  children,
  size = 19,
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