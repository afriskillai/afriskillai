import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    default: "Administration | AfriSkill AI",
    template: "%s | AfriSkill AI Admin",
  },
  description:
    "Espace d’administration sécurisé de la plateforme AfriSkill AI.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return children;
}