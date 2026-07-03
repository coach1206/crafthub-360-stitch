/**
 * SmokeCraft Venue Admin Persistence Service
 */

import { isDbAvailable, query } from '../../../db/connection.js'
import { randomUUID } from 'node:crypto'

const _memAdmin = new Map()

export function getPersistenceMode() { return isDbAvailable() ? 'database_config_detected' : 'memory_fallback' }

export async function createAdminRecord(data) {
  const adminId = data.adminId ?? `sc-admin-${randomUUID()}`
  const now     = new Date().toISOString()
  const record  = {
    adminId, venueId: data.venueId ?? null, actorRole: data.actorRole ?? null,
    actorId: data.actorId ?? null, actionType: data.actionType ?? 'unknown',
    data: data.data ?? {}, persistenceMode: getPersistenceMode(), createdAt: now,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_venue_admin (admin_id, venue_id, actor_role, actor_id, action_type, data, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [adminId, record.venueId, record.actorRole, record.actorId, record.actionType, JSON.stringify(record.data), now]
      )
    } catch { /* fall through */ }
  }
  _memAdmin.set(adminId, record)
  return record
}

export function getVenueAdminPersistenceStatus() {
  return {
    areaId: 'venue_admin', displayName: 'Venue Admin',
    currentPersistenceMode: getPersistenceMode(),
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !isDbAvailable(),
    tableSchema: 'smokecraft_venue_admin (migration 029)',
    warnings: isDbAvailable()
      ? ['DATABASE_URL detected — ensure migration 029 has been applied']
      : ['memory_fallback active — venue admin records will not survive server restart'],
  }
}
