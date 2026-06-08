/**
 * Admin API Service — frontend client for /api/admin/* endpoints.
 * Uses the named exports from apiClient.js (Phase 7 pattern).
 * Fails safely if the backend is unavailable.
 */

import { apiGet, apiPost, apiPut } from './apiClient.js'

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
