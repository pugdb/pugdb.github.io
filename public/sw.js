// Cache hashed Astro assets only. HTML is always network — stale shells
// were a crawler/user risk when directory URLs missed the .html pattern.

const CACHE_VERSION = 'v2';
const STATIC_CACHE = `pugdb-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `pugdb-images-${CACHE_VERSION}`;

const HASHED_ASSETS = [/^\/_astro\/.+\.(css|js)$/];
const IMAGE_PATTERNS = [/^\/(logos|favicon)/, /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i];

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name.startsWith('pugdb-') && name !== STATIC_CACHE && name !== IMAGE_CACHE)
          .map((name) => caches.delete(name)),
      ),
    ).then(() => self.clients.claim()),
  );
});

function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url.pathname));
}

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  const dest = event.request.destination;
  const isDocument =
    event.request.mode === 'navigate' ||
    dest === 'document' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/') ||
    !url.pathname.includes('.');

  if (isDocument) {
    event.respondWith(fetch(event.request));
    return;
  }

  if (matchesPattern(url, HASHED_ASSETS)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      }),
    );
    return;
  }

  if (matchesPattern(url, IMAGE_PATTERNS)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => cache.put(event.request, copy));
          }
          return response;
        });
      }),
    );
  }
});
