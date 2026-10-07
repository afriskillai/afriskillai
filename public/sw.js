"use strict";

const CACHE_VERSION = "afriskill-ai-static-v2";
const STATIC_ASSETS = [
  "/logo/logo.png",
  "/icon/icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-192x192.png",
  "/icons/icon-maskable-512x512.png",
];

function isCacheableImage(response) {
  return response.ok &&
    response.type === "basic" &&
    (response.headers.get("content-type") || "").toLowerCase().startsWith("image/");
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_VERSION);
      await Promise.all(STATIC_ASSETS.map(async (asset) => {
        const response = await fetch(asset, { cache: "reload" });
        if (isCacheableImage(response)) await cache.put(asset, response);
      }));
    } catch {
      // Une panne réseau ne doit pas empêcher le remplacement de l’ancien worker.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter(name => name.startsWith("afriskill-ai-") && name !== CACHE_VERSION)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Next.js gère lui-même le cache HTTP de ses CSS et scripts versionnés.
  // Ne pas intercepter ces fichiers, les pages, les API ou les ressources privées.
  if (url.origin !== self.location.origin || !STATIC_ASSETS.includes(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request);
    if (cached && isCacheableImage(cached)) return cached;

    const response = await fetch(request);
    if (isCacheableImage(response)) {
      try {
        await cache.put(request, response.clone());
      } catch {
        // Le site reste utilisable si le stockage du navigateur est indisponible.
      }
    }
    return response;
  })());
});
