/**
 * Service Worker Registration — Phase 11
 * Registers /sw.js in production (and optionally in development with VITE_SW=true).
 * Never crashes the app if registration fails.
 */

export function registerServiceWorker() {
  const shouldRegister =
    'serviceWorker' in navigator &&
    (import.meta.env.PROD || import.meta.env.VITE_SW === 'true')

  if (!shouldRegister) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        if (import.meta.env.DEV) console.log('[SW] Registered:', reg.scope)

        // Check for updates and apply on next navigation
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing
          if (!worker) return
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              if (import.meta.env.DEV) console.log('[SW] Update available — will apply on next load')
            }
          })
        })
      })
      .catch(err => {
        if (import.meta.env.DEV) console.warn('[SW] Registration failed:', err)
        // Silent in production — never crash the app
      })
  })
}

export function unregisterServiceWorker() {
  if (!('serviceWorker' in navigator)) return
  navigator.serviceWorker.ready
    .then(reg => reg.unregister())
    .catch(() => { /* ignore */ })
}
