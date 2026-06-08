/**
 * Device Config Service — Phase 11 (Frontend)
 * Thin wrapper around the /api/device/* endpoints.
 * All calls degrade gracefully when the backend is unavailable.
 */

import { apiGet, apiPost, apiPut } from './apiClient.js'

const DEVICE_ID_KEY = 'novee_device_id'

/** Returns the device ID stored in localStorage, or generates a new one. */
export function getLocalDeviceId() {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY)
    if (!id) {
      id = `device-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    return id
  } catch { return 'device-unknown' }
}

/** Fetches device config from the backend. Returns null on failure. */
export async function fetchDeviceConfig(deviceId) {
  try {
    const data = await apiGet(`/api/device/config?deviceId=${encodeURIComponent(deviceId)}`)
    return data?.data ?? null
  } catch { return null }
}

/** Registers or updates a device. */
export async function registerDevice(payload) {
  return apiPost('/api/device/register', payload)
}

/** Updates a device's config. */
export async function updateDevice(deviceId, updates) {
  return apiPut(`/api/device/${deviceId}`, updates)
}

/** Sends a heartbeat. Fire-and-forget. */
export function sendHeartbeat(deviceId, routePath) {
  if (!deviceId) return
  fetch(`/api/device/${deviceId}/heartbeat`, {
    method:      'POST',
    headers:     { 'Content-Type': 'application/json' },
    credentials: 'include',
    body:        JSON.stringify({ routePath }),
  }).catch(() => {})
}
