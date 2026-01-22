// Service Worker for PugDB Website
// Implements efficient caching strategies for GitHub Pages

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `pugdb-static-${CACHE_VERSION}`;
const IMAGE_CACHE = `pugdb-images-${CACHE_VERSION}`;

// Assets that should be cached with long TTL (1 year)
const STATIC_ASSETS = [
  // CSS files
  /\/_astro\/.*\.css$/,
  // JS files
  /\/_astro\/.*\.js$/,
  // Fonts
  /\.(woff|woff2|ttf|otf|eot)$/,
  // SVG icons
  /\/favicon\.png$/,
];

// Images that should be cached with long TTL (1 year)
const IMAGE_PATTERNS = [
  /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
];

// HTML pages - use shorter cache (1 day) and network-first
const HTML_PATTERN = /\.html?$/;

// Cache duration is managed by cache versioning
// Update CACHE_VERSION to invalidate all caches

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('pugdb-') && name !== STATIC_CACHE && name !== IMAGE_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  return self.clients.claim();
});

// Check if URL matches pattern
function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url.pathname));
}

// Note: Cache validity is managed by cache versioning
// When CACHE_VERSION changes, old caches are automatically cleared

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests (except same-origin)
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Handle HTML pages - Network first, then cache
  if (HTML_PATTERN.test(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response before caching
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          // If network fails, try cache
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle static assets (CSS, JS, fonts) - Cache first
  if (matchesPattern(url, STATIC_ASSETS)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Fetch from network
        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Handle images - Cache first
  if (matchesPattern(url, IMAGE_PATTERNS)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Fetch from network
        return fetch(event.request).then((response) => {
          // Only cache successful responses
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // For other requests, use network-first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
