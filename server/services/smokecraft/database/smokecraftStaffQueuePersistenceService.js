/**
 * SmokeCraft Staff Queue Persistence Service
 */

import { isDbAvailable, query } from '../../../db/connection.js'
import { randomUUID } from 'node:crypto'

const _memQueue = new Map()
let _idCounter  = 1

function newQueueId() { return `sc-queue-${Date.now()}-${_idCounter++}` }

export function getPersistenceMode() { return isDbAvailable() ? 'database_config_detected' : 'memory_fallback' }

export async function enqueueStaffItem(data) {
  const queueId = data.queueId ?? newQueueId()
  const now     = new Date().toISOString()
  const record  = {
    queueId, venueId: data.venueId ?? null, orderId: data.orderId ?? null,
    staffId: data.staffId ?? null, queueType: data.queueType ?? 'general',
    status: 'queued', priority: data.priority ?? 0, payload: data.payload ?? {},
    persistenceMode: getPersistenceMode(), createdAt: now, updatedAt: now,
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO smokecraft_staff_queue (queue_id, venue_id, order_id, staff_id, queue_type, status, priority, payload, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [queueId, record.venueId, record.orderId, record.staffId, record.queueType,
         record.status, record.priority, JSON.stringify(record.payload), now, now]
      )
    } catch { /* fall through to memory */ }
  }
  _memQueue.set(queueId, record)
  return record
}

export async function getQueueItems(venueId) {
  if (isDbAvailable()) {
    try {
      const res = await query(
        `SELECT * FROM smokecraft_staff_queue WHERE venue_id=$1 AND status='queued' ORDER BY priority DESC, created_at ASC`,
        [venueId]
      )
      if (res.rows.length) return res.rows
    } catch { /* fall through */ }
  }
  return [..._memQueue.values()].filter(r => r.venueId === venueId && r.status === 'queued')
}

export function getStaffQueuePersistenceStatus() {
  return {
    areaId: 'staff_queue', displayName: 'Staff Queue',
    currentPersistenceMode: getPersistenceMode(),
    databaseReady: true, databaseVerified: false,
    productionReady: false, usesMemoryFallback: !isDbAvailable(),
    tableSchema: 'smokecraft_staff_queue (migration 029)',
    warnings: isDbAvailable()
      ? ['DATABASE_URL detected — ensure migration 029 has been applied']
      : ['memory_fallback active — staff queue will not survive server restart'],
  }
}
