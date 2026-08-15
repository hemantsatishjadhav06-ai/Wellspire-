// Minimal, SPA-safe service worker for the Wellspire portal.
// Strategy: network-first for navigations and /api requests (fall back to the
// cached app shell when offline), cache-first for other same-origin GET assets.
// Everything is wrapped defensively so a failure in the offline logic can never
// break the running app.

const CACHE = 'wellspire-v1';
const APP_SHELL = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE);
        await cache.addAll(APP_SHELL);
      } catch (err) {
        // Precache is best-effort; never fail the install over it.
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      } catch (err) {
        // Ignore cleanup errors.
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever intervene on GET; let the browser handle everything else natively.
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (err) {
    return;
  }

  // Only handle same-origin requests; cross-origin goes straight to the network.
  if (url.origin !== self.location.origin) return;

  const isNavigation =
    request.mode === 'navigate' || request.destination === 'document';
  const isApi = url.pathname.startsWith('/api');

  if (isNavigation || isApi) {
    event.respondWith(networkFirst(request, isNavigation));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

// Network-first: try the network, fall back to cache. For navigations, fall
// back to the cached app shell so the SPA still boots offline.
async function networkFirst(request, isNavigation) {
  try {
    const response = await fetch(request);
    if (isNavigation && response && response.ok) {
      try {
        const cache = await caches.open(CACHE);
        cache.put('/', response.clone());
      } catch (err) {
        // Ignore cache write failures.
      }
    }
    return response;
  } catch (err) {
    try {
      const cache = await caches.open(CACHE);
      if (isNavigation) {
        const shell = (await cache.match('/')) || (await cache.match('/index.html'));
        if (shell) return shell;
      }
      const cached = await cache.match(request);
      if (cached) return cached;
    } catch (cacheErr) {
      // Fall through to a generic offline response.
    }
    return new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

// Cache-first: serve from cache when present, otherwise fetch and cache.
async function cacheFirst(request) {
  try {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response && response.ok) {
      try {
        cache.put(request, response.clone());
      } catch (err) {
        // Ignore cache write failures.
      }
    }
    return response;
  } catch (err) {
    try {
      return await fetch(request);
    } catch (fetchErr) {
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    }
  }
}
