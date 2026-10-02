import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "AfriSkill AI",
    short_name: "AfriSkill AI",

    description:
      "AfriSkill AI — formations pratiques pour apprendre à utiliser l'intelligence artificielle dans des projets professionnels et entrepreneuriaux.",

    start_url: "/",
    scope: "/",

    display: "standalone",

    background_color: "#061A40",
    theme_color: "#061A40",

    orientation: "any",

    lang: "fr",

    categories: [
      "education",
      "business",
      "productivity",
    ],

    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}