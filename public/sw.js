// Set Architect Progressive Web App Service Worker
const CACHE_NAME = 'set-architect-v5-clean';
const STATIC_ASSETS = [
  '/manifest.json',
  '/logo.svg'
];

// Installation: Immediately activate
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activation: Purge ALL previous caches to wipe stale demo track bundles
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Always pass through to network for fresh code
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => {
      return caches.match(event.request);
    })
  );
});

