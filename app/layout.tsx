import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),

  applicationName: "AfriSkill AI",

  title: {
    default: "AfriSkill AI",
    template: "%s | AfriSkill AI",
  },

  description:
    "AfriSkill AI propose des formations pratiques pour apprendre à utiliser l'intelligence artificielle dans des projets professionnels, créatifs et entrepreneuriaux.",

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/icon.png",
        type: "image/png",
        sizes: "512x512",
      },
      {
        url: "/icons/icon-192x192.png",
        type: "image/png",
        sizes: "192x192",
      },
      {
        url: "/icons/icon-512x512.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],

    apple: [
      {
        url: "/apple-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },

  appleWebApp: {
    capable: true,
    title: "AfriSkill AI",
    statusBarStyle: "black-translucent",
  },

  formatDetection: {
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "AfriSkill AI",
    title: "AfriSkill AI",
    description:
      "Des formations pratiques pour apprendre à utiliser l'intelligence artificielle dans des projets professionnels, créatifs et entrepreneuriaux.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#061A40",
  colorScheme: "light",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white font-sans text-slate-950">
        {children}
      </body>
    </html>
  );
}