/**
 * Admin Service — manages system users and admin-level operations.
 * Dual-mode: PostgreSQL when available, in-memory fallback.
 */

import { isDbAvailable, query } from '../db/connection.js'
import { recordRoleChange } from './securityEventService.js'
import { ROLE_LEVELS } from '../config/roleMap.js'

const memUsers = new Map()
function now() { return new Date().toISOString() }

function genUserId() {
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`
}

function sanitizeUser(data) {
  const validRoles   = Object.keys(ROLE_LEVELS)
  const validStatuses = ['active', 'inactive', 'suspended']
  return {
    user_id:      data.userId      || data.user_id      || genUserId(),
    email:        data.email                            || null,
    display_name: data.displayName || data.display_name || null,
    role:         validRoles.includes(data.role) ? data.role : 'staff',
    status:       validStatuses.includes(data.status)   ? data.status : 'active',
  }
}

export async function getAdminUsers(limit = 50) {
  if (isDbAvailable()) {
    try {
      const result = await query(
        'SELECT * FROM system_users ORDER BY role DESC, created_at ASC LIMIT $1',
        [limit]
      )
      return result.rows
    } catch (err) {
      console.warn('[adminService] DB read failed:', err.message)
    }
  }
  return [...memUsers.values()].slice(0, limit)
}

export async function getUserById(userId) {
  if (isDbAvailable()) {
    try {
      const result = await query('SELECT * FROM system_users WHERE user_id=$1', [userId])
      return result.rows[0] || null
    } catch (err) {
      console.warn('[adminService] getUserById failed:', err.message)
    }
  }
  return memUsers.get(userId) || null
}

export async function createAdminUser(data, actorId) {
  const u = sanitizeUser(data)
  if (isDbAvailable()) {
    try {
      const result = await query(
        `INSERT INTO system_users (user_id, email, display_name, role, status)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id) DO UPDATE SET
           email=EXCLUDED.email, display_name=EXCLUDED.display_name,
           role=EXCLUDED.role, status=EXCLUDED.status, updated_at=NOW()
         RETURNING *`,
        [u.user_id, u.email, u.display_name, u.role, u.status]
      )
      return result.rows[0]
    } catch (err) {
      console.warn('[adminService] createAdminUser failed:', err.message)
    }
  }
  const record = { id: memUsers.size + 1, created_at: now(), updated_at: now(), ...u }
  memUsers.set(u.user_id, record)
  return record
}

export async function updateAdminUser(userId, updates, actorId, actorRole) {
  const existing = await getUserById(userId)
  if (!existing) return null

  const prevRole = existing.role
  const newRole  = updates.role || prevRole

  if (isDbAvailable()) {
    try {
      const result = await query(
        `UPDATE system_users SET
           display_name = COALESCE($2, display_name),
           role         = COALESCE($3, role),
           status       = COALESCE($4, status),
           updated_at   = NOW()
         WHERE user_id=$1
         RETURNING *`,
        [userId, updates.displayName || updates.display_name, updates.role, updates.status]
      )
      if (prevRole !== newRole) {
        await recordRoleChange(actorId, actorRole, userId, prevRole, newRole)
      }
      return result.rows[0]
    } catch (err) {
      console.warn('[adminService] updateAdminUser failed:', err.message)
    }
  }

  const updated = { ...existing, ...updates, updated_at: now() }
  memUsers.set(userId, updated)
  if (prevRole !== newRole) {
    await recordRoleChange(actorId, actorRole, userId, prevRole, newRole)
  }
  return updated
}
