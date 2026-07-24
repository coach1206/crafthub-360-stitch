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
