/**
 * KioskContext — Phase 11
 *
 * Provides kiosk mode state throughout the app.
 * Config is read from localStorage (set by KioskSetup) and optionally
 * synced with the backend device config endpoint.
 *
 * Consumers: KioskShell, route guards, DeviceStatus page.
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'novee_kiosk_config'

const DEFAULT_CONFIG = {
  kioskMode:      false,
  deviceId:       null,
  venueId:        'novee-grand-lounge',
  deviceName:     'NOVEE Device',
  deviceType:     'demo_browser',
  assignedModule: null,
  allowedRoutes:  [],
}

// Route allowlists per device type (kiosk mode only)
export const KIOSK_ALLOWED_ROUTES = {
  kiosk: [
    '/', '/boot', '/crafthub', '/craft-hub', '/craft-modules',
    '/smokecraft', '/passport', '/leaderboard',
  ],
  staff_terminal: [
    '/staff-login', '/pos', '/device-status',
  ],
  manager_terminal: [
    '/admin-login', '/eat', '/pos', '/device-status',
  ],
  founder_terminal: [
    '/founder-login', '/founder', '/admin', '/device-status',
  ],
  tablet:         null, // no restriction
  demo_browser:   null, // no restriction
}

export const KioskContext = createContext(null)

export function KioskProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG
    } catch { return DEFAULT_CONFIG }
  })

  const save = useCallback((partial) => {
    setConfig(prev => {
      const next = { ...prev, ...partial }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  // Sync with backend on mount (non-blocking)
  useEffect(() => {
    const id = config.deviceId
    if (!id) return
    fetch(`/api/device/config?deviceId=${encodeURIComponent(id)}`, { credentials: 'include' })
      .then(r => r.json())
      .then(d => {
        if (d?.data) {
          save({
            kioskMode:      d.data.kioskMode,
            venueId:        d.data.venueId,
            deviceName:     d.data.deviceName,
            deviceType:     d.data.deviceType,
            assignedModule: d.data.assignedModule,
            allowedRoutes:  d.data.allowedRoutes || [],
          })
        }
      })
      .catch(() => { /* offline — use localStorage */ })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.deviceId])

  // Heartbeat every 60 seconds
  useEffect(() => {
    if (!config.deviceId) return
    const interval = setInterval(() => {
      fetch(`/api/device/${config.deviceId}/heartbeat`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ routePath: window.location.pathname }),
      }).catch(() => {})
    }, 60_000)
    return () => clearInterval(interval)
  }, [config.deviceId])

  const enableKiosk  = useCallback((opts = {}) => save({ ...opts, kioskMode: true }),  [save])
  const disableKiosk = useCallback(() => save({ kioskMode: false }), [save])

  /** Returns true if the given pathname is allowed in current kiosk mode. */
  const isRouteAllowed = useCallback((pathname) => {
    if (!config.kioskMode) return true
    const map = KIOSK_ALLOWED_ROUTES[config.deviceType]
    if (!map) return true // no restriction for this device type
    return map.some(r => pathname === r || pathname.startsWith(r + '/'))
  }, [config.kioskMode, config.deviceType])

  const value = { config, save, enableKiosk, disableKiosk, isRouteAllowed }
  return <KioskContext.Provider value={value}>{children}</KioskContext.Provider>
}

export function useKiosk() {
  const ctx = useContext(KioskContext)
  if (!ctx) throw new Error('useKiosk must be used inside <KioskProvider>')
  return ctx
}
