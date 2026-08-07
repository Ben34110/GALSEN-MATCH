// Service worker minimal — cache le shell applicatif pour un premier écran
// utilisable hors-ligne. Stratégie : network-first pour les pages (toujours
// essayer le réseau, retomber sur le cache si hors-ligne), cache-first pour
// les assets statiques (JS/CSS/icônes) versionnés par Next.js.
const CACHE_NAME = "galsen-match-v2";
const OFFLINE_URL = "/actu";

const PRECACHE_URLS = ["/actu", "/upcoming", "/fantasy", "/chat", "/profil", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const isNavigation = request.mode === "navigate";
  const isStaticAsset = request.url.includes("/_next/static/") || request.destination === "image";

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    );
    return;
  }

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            return response;
          })
      )
    );
  }
});

// Push payload shape sent by the poller (see app/api/cron/poll/route.ts):
// { title, body, url, icon? } — url is where notificationclick below
// navigates to (a match detail page, e.g. "/live/match/12345"). News
// notifications (api/cron/fetch-news/route.ts) additionally send `image` —
// the article's cover photo, shown in the expanded/"big picture"
// notification below the title/body, distinct from `icon`'s small avatar-
// style image. Android/desktop Chrome only — iOS Safari's push
// implementation doesn't honor `image` at all regardless of what's sent
// here (confirmed: https://github.com/mdn/browser-compat-data/issues/19318).
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon || "/icon.svg",
      badge: "/icon.svg",
      image: payload.image || undefined,
      data: { url: payload.url || "/fantasy" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : "/fantasy";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url);
        if (clientUrl.pathname === targetUrl && "focus" in client) return client.focus();
      }
      if (clients.length > 0 && "navigate" in clients[0]) {
        return clients[0].focus().then(() => clients[0].navigate(targetUrl));
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
