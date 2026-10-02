"use strict";

const CACHE_VERSION = "afriskill-ai-static-v1";

const STATIC_ASSETS = [
  "/logo/logo.png",
  "/icon/icon.png",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-192x192.png",
  "/icons/icon-maskable-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {
        return self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith("afriskill-ai-") &&
                cacheName !== CACHE_VERSION,
            )
            .map((cacheName) =>
              caches.delete(cacheName),
            ),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function isSensitivePath(pathname) {
  return (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/compte") ||
    pathname.startsWith("/panier")
  );
}

function isStaticAssetRequest(request, url) {
  if (request.method !== "GET") {
    return false;
  }

  if (url.origin !== self.location.origin) {
    return false;
  }

  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/logo/") ||
    url.pathname.startsWith("/icon/") ||
    url.pathname.startsWith("/icons/")
  );
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (isSensitivePath(url.pathname)) {
    return;
  }

  if (!isStaticAssetRequest(request, url)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((networkResponse) => {
        if (
          !networkResponse ||
          !networkResponse.ok ||
          networkResponse.type !== "basic"
        ) {
          return networkResponse;
        }

        const responseToCache =
          networkResponse.clone();

        void caches
          .open(CACHE_VERSION)
          .then((cache) =>
            cache.put(request, responseToCache),
          );

        return networkResponse;
      });
    }),
  );
});