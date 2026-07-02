/**
 * stationQueuePersistenceService — dual-mode station queue.
 *
 * Routes order items to kitchen/bar/humidor/retail/staff queues
 * in pos3_station_queue table with in-memory fallback.
 */

import { isDbAvailable, query } from '../db/connection.js'

const memQueue = new Map() // queue_id → entry

function makeQueueId() { return `q_${Date.now()}_${Math.random().toString(36).slice(2,6)}` }

// ── enqueueItems ──────────────────────────────────────────────
export async function enqueueItems(orderId, venueId, items, tableNumber) {
  const entries = []

  for (const item of items) {
    if (item.status === 'voided' || item.status === 'comped') continue
    const station = item.destination_station || 'staff'

    if (isDbAvailable()) {
      try {
        const { rows } = await query(
          `INSERT INTO pos3_station_queue
             (venue_id, order_id, order_item_id, station, status, item_name, table_number, notes)
           VALUES ($1,$2,$3,$4,'queued',$5,$6,$7)
           RETURNING *`,
          [venueId, orderId, item.order_item_id || null, station, item.name, tableNumber || null, item.notes || null]
        )
        entries.push(rows[0])
      } catch (err) {
        console.error('[stationQueue] enqueue error:', err.message)
        // Fall through to memory
        const mem = createMemEntry(venueId, orderId, item, station, tableNumber)
        entries.push(mem)
        memQueue.set(mem.queue_id, mem)
      }
    } else {
      const mem = createMemEntry(venueId, orderId, item, station, tableNumber)
      entries.push(mem)
      memQueue.set(mem.queue_id, mem)
    }
  }

  return { ok: true, entries, storageMode: isDbAvailable() ? 'postgres' : 'memory_fallback' }
}

// ── getQueue ──────────────────────────────────────────────────
export async function getStationQueue(venueId, station) {
  if (isDbAvailable()) {
    try {
      const conditions = ["venue_id = $1", "status NOT IN ('completed','cancelled')"]
      const params = [venueId]
      if (station) { conditions.push(`station = $2`); params.push(station) }

      const { rows } = await query(
        `SELECT * FROM pos3_station_queue WHERE ${conditions.join(' AND ')} ORDER BY priority DESC, created_at ASC`,
        params
      )
      return { ok: true, entries: rows, storageMode: 'postgres' }
    } catch (err) {
      console.error('[stationQueue] getQueue error:', err.message)
    }
  }

  let entries = [...memQueue.values()].filter(e => e.venue_id === venueId && !['completed','cancelled'].includes(e.status))
  if (station) entries = entries.filter(e => e.station === station)
  entries.sort((a, b) => (b.priority - a.priority) || (new Date(a.created_at) - new Date(b.created_at)))

  return { ok: true, entries, storageMode: 'memory_fallback', localPreview: true }
}

// ── updateQueueItemStatus ─────────────────────────────────────
export async function updateQueueItemStatus(queueId, status) {
  const VALID = ['queued','started','ready','completed','cancelled']
  if (!VALID.includes(status)) return { ok: false, error: `Invalid status: ${status}` }

  const tsField = status === 'started' ? ', started_at = NOW()' : status === 'ready' ? ', ready_at = NOW()' : status === 'completed' ? ', completed_at = NOW()' : ''

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `UPDATE pos3_station_queue SET status = $1${tsField} WHERE queue_id = $2 RETURNING *`,
        [status, queueId]
      )
      if (!rows[0]) return { ok: false, error: 'Queue entry not found' }
      return { ok: true, entry: rows[0], storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  const entry = memQueue.get(queueId)
  if (!entry) return { ok: false, error: 'Queue entry not found', localPreview: true }
  entry.status = status
  return { ok: true, entry, storageMode: 'memory_fallback', localPreview: true }
}

// ── getQueueStats ─────────────────────────────────────────────
export async function getQueueStats(venueId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT station, status, COUNT(*) as count
         FROM pos3_station_queue
         WHERE venue_id = $1 AND status NOT IN ('completed','cancelled')
         GROUP BY station, status`,
        [venueId]
      )
      const stats = {}
      for (const row of rows) {
        if (!stats[row.station]) stats[row.station] = {}
        stats[row.station][row.status] = parseInt(row.count)
      }
      return { ok: true, stats, storageMode: 'postgres' }
    } catch {}
  }
  return { ok: true, stats: {}, storageMode: 'memory_fallback', localPreview: true }
}

// ── Helpers ───────────────────────────────────────────────────
function createMemEntry(venueId, orderId, item, station, tableNumber) {
  return {
    queue_id:      makeQueueId(),
    venue_id:      venueId,
    order_id:      orderId,
    order_item_id: item.order_item_id || null,
    station,
    status:        'queued',
    priority:      5,
    item_name:     item.name,
    table_number:  tableNumber || null,
    notes:         item.notes || null,
    created_at:    new Date().toISOString(),
    started_at:    null,
    ready_at:      null,
    completed_at:  null,
  }
}
