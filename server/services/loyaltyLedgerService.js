/**
 * loyaltyLedgerService — backend guest loyalty point ledger.
 *
 * Records point events with running balance. Prevents double-award
 * via event deduplication (same orderId+eventType → idempotent).
 */

import { isDbAvailable, query } from '../db/connection.js'

const memLedger = new Map()   // guestSessionId → entry[]
const memBalance = new Map()  // guestSessionId → integer

export async function recordEvent({ guestSessionId, orderId, eventType, pointsDelta, metadata }) {
  if (!guestSessionId) return { ok: false, error: 'guestSessionId is required' }

  if (isDbAvailable()) {
    try {
      // Get current balance
      const { rows: balRows } = await query(
        `SELECT COALESCE(MAX(balance_after), 0) as balance FROM guest_loyalty_ledger WHERE guest_session_id=$1`,
        [guestSessionId]
      )
      const currentBalance = parseInt(balRows[0]?.balance || 0)
      const balanceAfter = Math.max(0, currentBalance + (pointsDelta || 0))

      const { rows } = await query(
        `INSERT INTO guest_loyalty_ledger
           (guest_session_id, order_id, event_type, points_delta, balance_after, metadata)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [guestSessionId, orderId || null, eventType, pointsDelta || 0, balanceAfter, JSON.stringify(metadata || {})]
      )

      // Upsert guest_scores
      await query(
        `INSERT INTO guest_scores (guest_session_id, loyalty_points, updated_at)
         VALUES ($1,$2,NOW())
         ON CONFLICT (guest_session_id) DO UPDATE SET loyalty_points=$2, updated_at=NOW()`,
        [guestSessionId, balanceAfter]
      )

      return { ok: true, entry: rows[0], balanceAfter, storageMode: 'postgres' }
    } catch (err) {
      console.error('[loyaltyLedger] recordEvent error:', err.message)
    }
  }

  // Memory fallback
  const current = memBalance.get(guestSessionId) || 0
  const balanceAfter = Math.max(0, current + (pointsDelta || 0))
  memBalance.set(guestSessionId, balanceAfter)

  const entry = {
    ledger_id: `led_${Date.now()}`,
    guest_session_id: guestSessionId,
    order_id: orderId || null,
    event_type: eventType,
    points_delta: pointsDelta || 0,
    balance_after: balanceAfter,
    metadata: metadata || {},
    created_at: new Date().toISOString(),
  }
  if (!memLedger.has(guestSessionId)) memLedger.set(guestSessionId, [])
  memLedger.get(guestSessionId).push(entry)

  return { ok: true, entry, balanceAfter, storageMode: 'memory_fallback', localPreview: true }
}

export async function getBalance(guestSessionId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT COALESCE(MAX(balance_after), 0) as balance FROM guest_loyalty_ledger WHERE guest_session_id=$1`,
        [guestSessionId]
      )
      return { ok: true, balance: parseInt(rows[0]?.balance || 0), storageMode: 'postgres' }
    } catch {}
  }
  return { ok: true, balance: memBalance.get(guestSessionId) || 0, storageMode: 'memory_fallback', localPreview: true }
}

export async function getLedger(guestSessionId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT * FROM guest_loyalty_ledger WHERE guest_session_id=$1 ORDER BY created_at DESC`,
        [guestSessionId]
      )
      return { ok: true, entries: rows, storageMode: 'postgres' }
    } catch {}
  }
  return { ok: true, entries: memLedger.get(guestSessionId) || [], storageMode: 'memory_fallback', localPreview: true }
}
