import type { ReactNode } from "react";

import PublicShell from "@/components/public/PublicShell";

type PublicLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function PublicLayout({
  children,
}: PublicLayoutProps) {
  return (
    <PublicShell>
      {children}
    </PublicShell>
  );
}