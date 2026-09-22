// Service worker for the English Connection PWA.
//
// Minimal offline support: page navigations are network-first with a cached
// fallback, so the installed (desktop) app still opens when the network is
// down. Everything else (Next.js content-hashed assets, API calls) passes
// through to the network untouched — we don't aggressively cache them here.
const CACHE = "ec-pwa-v1";

self.addEventListener("install", (event) => {
  // Activate this worker as soon as it's installed.
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add("/")));
});

self.addEventListener("activate", (event) => {
  // Drop caches from older worker versions, then take control of open pages.
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only handle top-level page navigations; let the browser deal with the rest.
  if (request.method !== "GET" || request.mode !== "navigate") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/"))),
  );
});
