/**
 * Device Service — Phase 11
 * Manages venue device registration, config, and heartbeat logging.
 * Degrades gracefully when DB is unavailable (prototype mode).
 */

import { query, isDbAvailable } from '../db/connection.js'

const APP_VERSION = process.env.npm_package_version || '4.2.0'

// ── Helpers ───────────────────────────────────────────────────────────────────

function _rowToDevice(row) {
  return {
    deviceId:       row.device_id,
    venueId:        row.venue_id,
    deviceName:     row.device_name,
    deviceType:     row.device_type,
    kioskMode:      row.kiosk_mode,
    assignedModule: row.assigned_module,
    allowedRoutes:  row.allowed_routes || [],
    status:         row.status,
    lastSeenAt:     row.last_seen_at,
    appVersion:     row.app_version,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getDeviceConfig(deviceId) {
  if (!isDbAvailable() || !deviceId) return _prototypeConfig(deviceId)
  try {
    const res = await query(
      'SELECT * FROM venue_devices WHERE device_id = $1',
      [deviceId]
    )
    if (res.rows.length === 0) return null
    return _rowToDevice(res.rows[0])
  } catch (err) {
    console.error('[DeviceService] getDeviceConfig error:', err.message)
    return _prototypeConfig(deviceId)
  }
}

export async function listDevices(venueId = null) {
  if (!isDbAvailable()) return []
  try {
    const res = venueId
      ? await query('SELECT * FROM venue_devices WHERE venue_id = $1 ORDER BY created_at DESC', [venueId])
      : await query('SELECT * FROM venue_devices ORDER BY created_at DESC')
    return res.rows.map(_rowToDevice)
  } catch (err) {
    console.error('[DeviceService] listDevices error:', err.message)
    return []
  }
}

export async function registerDevice(payload) {
  const {
    deviceId, venueId = 'novee-grand-lounge', deviceName = 'NOVEE Device',
    deviceType = 'tablet', kioskMode = false, assignedModule = null,
    allowedRoutes = [], appVersion = APP_VERSION,
  } = payload

  if (!deviceId) throw new Error('deviceId is required')

  if (!isDbAvailable()) return _prototypeConfig(deviceId)

  try {
    const res = await query(
      `INSERT INTO venue_devices
         (device_id, venue_id, device_name, device_type, kiosk_mode, assigned_module,
          allowed_routes, app_version, last_seen_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       ON CONFLICT (device_id) DO UPDATE SET
         venue_id        = EXCLUDED.venue_id,
         device_name     = EXCLUDED.device_name,
         device_type     = EXCLUDED.device_type,
         kiosk_mode      = EXCLUDED.kiosk_mode,
         assigned_module = EXCLUDED.assigned_module,
         allowed_routes  = EXCLUDED.allowed_routes,
         app_version     = EXCLUDED.app_version,
         last_seen_at    = NOW(),
         updated_at      = NOW()
       RETURNING *`,
      [deviceId, venueId, deviceName, deviceType, kioskMode,
       assignedModule, JSON.stringify(allowedRoutes), appVersion]
    )
    return _rowToDevice(res.rows[0])
  } catch (err) {
    console.error('[DeviceService] registerDevice error:', err.message)
    throw err
  }
}

export async function updateDevice(deviceId, updates) {
  if (!isDbAvailable()) return _prototypeConfig(deviceId)
  const allowed = ['device_name','device_type','kiosk_mode','assigned_module',
                   'allowed_routes','status','app_version','venue_id']
  const fields = [], values = [], idx = []
  let i = 1
  for (const [k, v] of Object.entries(updates)) {
    const col = k.replace(/([A-Z])/g, '_$1').toLowerCase()
    if (!allowed.includes(col)) continue
    fields.push(col)
    values.push(typeof v === 'object' ? JSON.stringify(v) : v)
    idx.push(`${col} = $${i++}`)
  }
  if (fields.length === 0) throw new Error('No valid fields to update')
  values.push(deviceId)
  try {
    const res = await query(
      `UPDATE venue_devices SET ${idx.join(', ')}, updated_at = NOW()
       WHERE device_id = $${i} RETURNING *`,
      values
    )
    if (res.rows.length === 0) throw new Error(`Device ${deviceId} not found`)
    return _rowToDevice(res.rows[0])
  } catch (err) {
    console.error('[DeviceService] updateDevice error:', err.message)
    throw err
  }
}

export async function recordHeartbeat(deviceId, routePath = null, payload = {}) {
  if (!isDbAvailable() || !deviceId) return { ok: true, prototype: true }
  try {
    await query(
      `UPDATE venue_devices SET last_seen_at = NOW(), updated_at = NOW()
       WHERE device_id = $1`,
      [deviceId]
    )
    await query(
      `INSERT INTO device_events (device_id, venue_id, event_type, route_path, payload)
       SELECT $1, venue_id, 'heartbeat', $2, $3 FROM venue_devices WHERE device_id = $1`,
      [deviceId, routePath, JSON.stringify(payload)]
    )
    return { ok: true }
  } catch (err) {
    console.error('[DeviceService] heartbeat error:', err.message)
    return { ok: true, warn: err.message }
  }
}

// ── Prototype fallback ────────────────────────────────────────────────────────

function _prototypeConfig(deviceId) {
  return {
    deviceId:       deviceId || 'device-prototype-001',
    venueId:        'novee-grand-lounge',
    deviceName:     'Prototype Device',
    deviceType:     'demo_browser',
    kioskMode:      false,
    assignedModule: null,
    allowedRoutes:  [],
    status:         'active',
    lastSeenAt:     new Date().toISOString(),
    appVersion:     APP_VERSION,
    prototype:      true,
  }
}
