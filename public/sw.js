// Service Worker de ParkingControl (PWA Offline-First)
const CACHE_NAME = "parkingcontrol-v1";

const PRECACHE_URLS = [
  "/",
  "/entradas",
  "/salidas",
  "/historial",
  "/configuracion",
  "/manifest.webmanifest",
  "/icons/parking.svg",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // UsaraddAll con tolerancia individual para no fallar la instalación si una ruta falla
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn(`[SW] No se pudo pre-cachear: ${url}`, err);
          })
        )
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. No interceptar llamadas a la API ni peticiones no GET
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Recursos estáticos de Next.js (_next/static, iconos, fuentes) -> Cache First
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached || new Response("", { status: 408 }));
      })
    );
    return;
  }

  // 3. Páginas de navegación (HTML) -> Network First con fallback a Cache
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          const rootFallback = await caches.match("/", { ignoreSearch: true });
          return rootFallback || new Response("Sin conexión", { status: 503, statusText: "Offline" });
        })
    );
    return;
  }

  // 4. Otras peticiones GET
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => {
      return (
        cached ||
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
          .catch(() => cached)
      );
    })
  );
});
