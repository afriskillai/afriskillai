"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

type AdminShellProps = {
  children: ReactNode;
  adminEmail: string;
};

export default function AdminShell({
  children,
  adminEmail,
}: AdminShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const openMobileMenu = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
      <AdminSidebar
        adminEmail={adminEmail}
        mobileOpen={mobileMenuOpen}
        onMobileClose={closeMobileMenu}
      />

      <div className="min-h-screen lg:pl-[290px]">
        <AdminHeader
          adminEmail={adminEmail}
          onOpenMenu={openMobileMenu}
        />

        <main className="min-h-[calc(100vh-82px)]">
          <div className="mx-auto w-full max-w-[1700px] px-4 py-6 sm:px-6 sm:py-8 xl:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}