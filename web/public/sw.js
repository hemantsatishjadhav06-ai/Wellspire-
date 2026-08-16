// Minimal, SPA-safe service worker for the Wellspire portal.
//
// Strategy:
//   • Navigations  → network-first, falling back to the cached app shell when
//     offline. We only ever (re)cache the shell under the stable '/' key when
//     the request is genuinely for the shell — never under an arbitrary route,
//     so a visit to /students can't overwrite '/' with the wrong document.
//   • Hashed build assets (/assets/*) → cache-first. Vite fingerprints these,
//     so a given URL is immutable and safe to serve from cache forever.
//   • Everything else (/api/*, /website/*, unhashed files) → passed straight
//     to the network. These change without a URL change, so caching them risks
//     serving stale content; we simply don't intercept them.
//
// Bump CACHE whenever the shell/precache logic changes so old caches are purged.

const CACHE = 'wellspire-v2';
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

  if (isNavigation) {
    // Never cache the marketing site's HTML as the SPA shell.
    if (url.pathname.startsWith('/website')) return;
    event.respondWith(navigate(request, url));
    return;
  }

  // Immutable, content-hashed build assets: safe to cache-first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Everything else (/api, /website assets, unhashed files) → network as-is.
});

// Network-first for navigations. On success, refresh the cached shell ONLY when
// the request is for the shell itself, so '/' is never clobbered by a deep link.
// On failure, serve the cached shell so the SPA still boots offline.
async function navigate(request, url) {
  const isShellPath = url.pathname === '/' || url.pathname === '/index.html';
  try {
    const response = await fetch(request);
    if (isShellPath && response && response.ok) {
      try {
        const cache = await caches.open(CACHE);
        await cache.put('/', response.clone());
      } catch (err) {
        // Ignore cache write failures.
      }
    }
    return response;
  } catch (err) {
    try {
      const cache = await caches.open(CACHE);
      const shell = (await cache.match('/')) || (await cache.match('/index.html'));
      if (shell) return shell;
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
