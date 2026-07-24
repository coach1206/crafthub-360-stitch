import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider }         from './context/AuthContext.jsx'
import { SecurityProvider }     from './context/SecurityContext.jsx'
import { GuestSessionProvider } from './context/GuestSessionContext.jsx'
import { KioskProvider }        from './context/KioskContext.jsx'
import { flushOfflineQueue }    from './services/syncService.js'
import { initSyncQueueRetryTriggers } from './services/syncQueueService.js'
import './fonts.css'
import './styles.css'

// Deployment identity — check in browser console: window.__SMOKECRAFT_BUILD__
window.__SMOKECRAFT_BUILD__ = {
  commit:  __BUILD_COMMIT__,
  branch:  __BUILD_BRANCH__,
  builtAt: __BUILD_TIME__,
  app:     'SmokeCraft360',
}

// Flush any sync items queued during a previous offline session
flushOfflineQueue().catch(() => {})

// Phase 6C: flush the durable IndexedDB sync-queue outbox on load + reconnect
initSyncQueueRetryTriggers()

// Permanent safety net (Production Build Identity pass) — no service worker
// is registered or maintained by this app (PWA scaffold files exist on disk
// but nothing in src/ registers one); this proactively removes any stray
// registration from an earlier build so it can never pin a stale frontend
// bundle. Strictly protective — can only remove staleness, never create it.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister())
  })
}

// Single Build & Live Runtime pass — unregistering a service worker does NOT
// delete the Cache Storage buckets it created. `public/sw.js` (the retired
// NOVEE OS Phase 11 worker, now a self-destructing kill switch) used a
// stale-while-revalidate strategy under the cache name `novee-os-v2`, which
// could return a previous build's hashed JS chunk ahead of the network. Any
// browser that ever registered it can still be holding that bucket. This
// deletes only caches this app owns by name prefix — it never touches
// localStorage/IndexedDB, so novee_guest_session, sc_journey_v1, Passport
// identity and archived journey history are all untouched. Strictly
// protective: it can only remove staleness, never create it.
const RETIRED_CACHE_PREFIXES = ['novee-os', 'smokecraft', 'workbox', 'crafthub']
if (typeof caches !== 'undefined' && caches?.keys) {
  caches.keys().then((keys) => {
    keys
      .filter((k) => RETIRED_CACHE_PREFIXES.some((p) => k.toLowerCase().startsWith(p)))
      .forEach((k) => caches.delete(k))
  }).catch(() => { /* never break the real user journey */ })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SecurityProvider>
        <GuestSessionProvider>
          <KioskProvider>
            <App />
          </KioskProvider>
        </GuestSessionProvider>
      </SecurityProvider>
    </AuthProvider>
  </React.StrictMode>
)
