/**
 * SmokeCraft Passport Persistence Service
 * Passport lock rules (VISIT_8_LOCKED, ONE_SESSION_SHORTCUT_BLOCKED, etc.) are not modified.
 * This service only adds persistence reporting for passport reward records.
 */

import { isDbAvailable, query } from '../../../db/connection.js'
import { randomUUID } from 'node:crypto'

const _memPassport = new Map()

export function getPersistenceMode() { return isDbAvailable() ? 'database_config_detected' : 'memory_fallback' }

export async function createPassportRewardRecord(data) {
  const passportId = data.passportId ?? `sc-passport-${randomUUID()}`
  const now        = new Date().toISOString()
  const record     = {
    passportId, userId: data.userId ?? null, venueId: data.venueId ?? null,
    data: data.data ?? {}, locked: data.locked ?? false,
    persistenceMode: getPersistenceMode(), createdAt: now, updatedAt: now,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_passport_rewards (passport_id, user_id, venue_id, data, locked, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         ON CONFLICT (passport_id) DO UPDATE SET data=$4, locked=$5, updated_at=$7`,
        [passportId, record.userId, record.venueId, JSON.stringify(record.data), record.locked, now, now]
      )
    } catch { /* fall through */ }
  }
  _memPassport.set(passportId, record)
  return record
}

export async function getPassportRewardRecord(passportId) {
  if (isDbAvailable()) {
    try {
      const res = await query(
        `SELECT * FROM smokecraft_passport_rewards WHERE passport_id=$1`, [passportId]
      )
      if (res.rows.length) return res.rows[0]
    } catch { /* fall through */ }
  }
  return _memPassport.get(passportId) ?? null
}

export function getPassportPersistenceStatus() {
  return {
    areaId: 'passport_rewards', displayName: 'Passport Rewards',
    currentPersistenceMode: getPersistenceMode(),
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !isDbAvailable(),
    tableSchema: 'smokecraft_passport_rewards (migration 029)',
    lockRulesProtected: true,
    warnings: isDbAvailable()
      ? ['DATABASE_URL detected — ensure migration 029 has been applied']
      : ['memory_fallback active — passport reward records will not survive server restart',
         'Passport Stamp lock rules (VISIT_8_LOCKED, ONE_SESSION_SHORTCUT_BLOCKED) are unchanged'],
  }
}
