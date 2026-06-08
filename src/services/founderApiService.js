/**
 * Founder API Service — frontend client for /api/founder/* endpoints.
 * Uses the named exports from apiClient.js (Phase 7 pattern).
 *
 * SECURITY: The backend requireFounderLevel0() gate is the real enforcement.
 * Never trust the frontend role alone for founder actions.
 */

import { apiGet, apiPost, apiPut } from './apiClient.js'

const BASE = '/api/founder'

/** GET /api/founder/status — system status summary. */
export const getFounderStatus = () => apiGet(`${BASE}/status`)

/** GET /api/founder/controls — all founder control key/values. */
export const getFounderControls = () => apiGet(`${BASE}/controls`)

/** PUT /api/founder/controls/:controlKey — update a control value. */
export const updateFounderControl = (controlKey, value) =>
  apiPut(`${BASE}/controls/${controlKey}`, value)

/** POST /api/founder/emergency-lock — trigger emergency lock. */
export const triggerEmergencyLock = (reason) =>
  apiPost(`${BASE}/emergency-lock`, { reason })

/** POST /api/founder/override — founder override of a session or rule. */
export const triggerFounderOverride = (targetSessionId, reason) =>
  apiPost(`${BASE}/override`, { targetSessionId, reason })

/** GET /api/founder/audit — full audit trail. */
export const getFounderAudit = (limit = 100) =>
  apiGet(`${BASE}/audit?limit=${limit}`)
