/**
 * NOVEE OS Service Worker — Phase 11
 *
 * Caches:  app shell, static assets, offline fallback page.
 * Never caches: auth, admin, founder, POS3, EAT, audit endpoints.
 * Graceful update: shows new version on next navigation.
 */

const CACHE_NAME    = 'novee-os-v1'
const OFFLINE_URL   = '/offline.html'

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
]

// Patterns that must NEVER be cached
const NEVER_CACHE = [
  /\/api\/auth\//,
  /\/api\/admin\//,
  /\/api\/founder\//,
  /\/api\/pos3\//,
  /\/api\/eat\//,
  /\/api\/audit\//,
  /\/api\/voice\/speak/,
  /\/api\/deployment\//,
]

function shouldSkipCache(url) {
  return NEVER_CACHE.some(re => re.test(url))
}

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = request.url

  // Always skip non-GET and never-cache patterns
  if (request.method !== 'GET' || shouldSkipCache(url)) return

  // Navigation requests: network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(OFFLINE_URL))
    )
    return
  }

  // API health + voice capability: network-only (no caching)
  if (url.includes('/api/')) return

  // Static assets: stale-while-revalidate
  event.respondWith(
    caches.match(request).then(cached => {
      const fetchPromise = fetch(request).then(response => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        }
        return response
      }).catch(() => cached)
      return cached || fetchPromise
    })
  )
})
