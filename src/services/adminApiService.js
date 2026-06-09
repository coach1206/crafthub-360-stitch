/**
 * Admin API Service — frontend client for /api/admin/* endpoints.
 * Uses the named exports from apiClient.js (Phase 7 pattern).
 * Fails safely if the backend is unavailable.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiClient.js'

const BASE = '/api/admin'

/** GET /api/admin/my-permissions — works for any role. */
export const getMyPermissions = () => apiGet(`${BASE}/my-permissions`)

/** GET /api/admin/me — requires admin+. */
export const getCurrentAdminUser = () => apiGet(`${BASE}/me`)

/** GET /api/admin/roles — requires admin+. */
export const getRoles = () => apiGet(`${BASE}/roles`)

/** GET /api/admin/permissions — full permission matrix, admin+. */
export const getPermissions = () => apiGet(`${BASE}/permissions`)

/** GET /api/admin/users — list system users, admin+. */
export const getAdminUsers = () => apiGet(`${BASE}/users`)

/** POST /api/admin/users — create a system user, admin+. */
export const createAdminUser = (data) => apiPost(`${BASE}/users`, data)

/** PUT /api/admin/users/:userId — update a system user, admin+. */
export const updateAdminUser = (userId, data) => apiPut(`${BASE}/users/${userId}`, data)

/** GET /api/admin/security-events — recent security log, admin+. */
export const getSecurityEvents = (params = {}) => {
  const qs = new URLSearchParams(params).toString()
  return apiGet(`${BASE}/security-events${qs ? `?${qs}` : ''}`)
}

/** GET /api/admin/staff — staff list, admin+. */
export const listStaff = () => apiGet(`${BASE}/staff`)

/** POST /api/admin/users/:userId/reset-pin — manager+ resets a user's PIN. */
export const resetUserPin = (userId, newPin, confirmPin) =>
  apiPost(`${BASE}/users/${userId}/reset-pin`, { newPin, confirmPin })

/** GET /api/pos3/sync/status — manager+ POS sync status. */
export const getPOS3SyncStatus = () => apiGet('/api/pos3/sync/status')

/** POST /api/pos3/sync/run — admin+ trigger manual sync. */
export const runPOS3SyncNow = (providerKey = 'prototype') =>
  apiPost('/api/pos3/sync/run', { providerKey })

// ── Data reset endpoints (admin+) ─────────────────────────────────────────────

/** DELETE /api/ranking/admin/reset-xp — restore all members' XP to seed values. */
export const resetRankingXp = () => apiDelete('/api/ranking/admin/reset-xp')

/** DELETE /api/ranking/admin/reset-activity — clear runtime activity log. */
export const resetRankingActivity = () => apiDelete('/api/ranking/admin/reset-activity')

/** DELETE /api/ranking/admin/reset-members — restore member roster to seed. */
export const resetRankingMembers = () => apiDelete('/api/ranking/admin/reset-members')

/** DELETE /api/travel/admin/concierge — clear all concierge requests. */
export const resetTravelConcierge = () => apiDelete('/api/travel/admin/concierge')

/** DELETE /api/travel/admin/stamps — clear all travel stamps. */
export const resetTravelStamps = () => apiDelete('/api/travel/admin/stamps')

/** DELETE /api/ticker/admin/reset — clear runtime ticker additions (seed data restored). */
export const resetTickerFeed = () => apiDelete('/api/ticker/admin/reset')

/** DELETE /api/badges/admin/reset — clear all badge progress and unlock log. */
export const resetBadges = () => apiDelete('/api/badges/admin/reset')
