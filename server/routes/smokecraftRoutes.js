/**
 * SmokeCraft 360 — real route foundation (Phase 10).
 *
 * Implements the Phase 9 API contract (docs/smokecraft-api-contract.md) against
 * the Phase 9 migration (server/db/migrations/011_smokecraft_schema.sql).
 *
 * No migration runner exists in this repo — migrations are applied externally
 * at deploy time. So even when DATABASE_URL is set, the smoke_* tables may not
 * exist yet. Every DB branch below falls back to in-memory storage on query
 * failure (including "relation does not exist") rather than crashing or lying
 * about persistence.
 *
 * This module is mounted separately from server/routes/smokecraftOrders.js
 * (the pre-existing /api/smokecraft pairing-order feature) and must not
 * conflict with its routes.
 */
import { Router } from 'express'
import { isDbAvailable, query } from '../db/connection.js'

const router = Router()

// ── In-memory fallback store (mirrors smoke_* tables) ──────────────────────
const mem = {
  sessions: new Map(),       // sessionId -> session row
  events: [],                // session events
  intents: new Map(),        // intentId -> intent row
  verifications: [],
  leaderboard: [],
  handoffs: new Map(),       // handoffId -> handoff row
  inventoryPreviews: [],
  auditLogs: [],
}

function storageModeFor(usedDb) {
  return usedDb ? 'postgres' : 'memory_fallback'
}

function respond(res, { ok, status, storageMode, data = null, error = null }, httpStatus = 200) {
  res.status(httpStatus).json({ ok, status, storageMode, data, error })
}

/** Runs `dbFn` against Postgres when available; falls back to `memFn` on any
 * failure (including missing tables, since migrations aren't auto-applied). */
async function withDbFallback(dbFn, memFn) {
  if (isDbAvailable()) {
    try {
      const data = await dbFn()
      return { data, usedDb: true }
    } catch (err) {
      console.warn('[smokecraft] DB query failed, falling back to memory:', err.message)
    }
  }
  return { data: await memFn(), usedDb: false }
}

// ── Sessions ─────────────────────────────────────────────────────────────
router.post('/sessions', async (req, res) => {
  const { sessionId, venueId = null, xp = 0, rank = null, completedSteps = null, finalScore = null, challengeStatus = null } = req.body || {}
  if (!sessionId) return respond(res, { ok: false, status: 'failed', storageMode: 'none', error: 'sessionId is required' }, 400)

  const { data: session, usedDb } = await withDbFallback(
    async () => {
      const existing = await query('SELECT id FROM smoke_sessions WHERE session_id = $1', [sessionId])
      if (existing.rows.length) throw Object.assign(new Error('duplicate'), { duplicate: true })
      const result = await query(
        `INSERT INTO smoke_sessions (session_id, venue_id, xp, rank, completed_steps, final_score, challenge_status)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [sessionId, venueId, xp, rank, completedSteps, finalScore, challengeStatus]
      )
      return result.rows[0]
    },
    async () => {
      if (mem.sessions.has(sessionId)) throw Object.assign(new Error('duplicate'), { duplicate: true })
      const row = { sessionId, venueId, xp, rank, completedSteps, finalScore, challengeStatus, createdAt: new Date().toISOString() }
      mem.sessions.set(sessionId, row)
      return row
    }
  ).catch((err) => {
    if (err.duplicate) return { data: null, usedDb: false, duplicate: true }
    throw err
  })

  if (!session) return respond(res, { ok: false, status: 'failed', storageMode: storageModeFor(usedDb), error: 'sessionId already exists' }, 409)
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { session } })
})

router.get('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params
  const { data: session, usedDb } = await withDbFallback(
    async () => {
      const result = await query('SELECT * FROM smoke_sessions WHERE session_id = $1', [sessionId])
      return result.rows[0] || null
    },
    async () => mem.sessions.get(sessionId) || null
  )
  if (!session) return respond(res, { ok: false, status: 'failed', storageMode: storageModeFor(usedDb), error: 'not_found' }, 404)
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { session } })
})

router.patch('/sessions/:sessionId', async (req, res) => {
  const { sessionId } = req.params
  const patch = req.body || {}
  const { data: session, usedDb } = await withDbFallback(
    async () => {
      const fields = ['xp', 'rank', 'completed_steps', 'final_score', 'challenge_status']
      const keyMap = { xp: 'xp', rank: 'rank', completedSteps: 'completed_steps', finalScore: 'final_score', challengeStatus: 'challenge_status' }
      const sets = []
      const values = []
      for (const [k, col] of Object.entries(keyMap)) {
        if (k in patch) { values.push(patch[k]); sets.push(`${col} = $${values.length}`) }
      }
      if (!sets.length) {
        const existing = await query('SELECT * FROM smoke_sessions WHERE session_id = $1', [sessionId])
        return existing.rows[0] || null
      }
      values.push(sessionId)
      const result = await query(`UPDATE smoke_sessions SET ${sets.join(', ')} WHERE session_id = $${values.length} RETURNING *`, values)
      return result.rows[0] || null
    },
    async () => {
      const existing = mem.sessions.get(sessionId)
      if (!existing) return null
      const updated = { ...existing, ...patch }
      mem.sessions.set(sessionId, updated)
      return updated
    }
  )
  if (!session) return respond(res, { ok: false, status: 'failed', storageMode: storageModeFor(usedDb), error: 'not_found' }, 404)
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { session } })
})

// ── Session Events ───────────────────────────────────────────────────────
router.post('/sessions/:sessionId/events', async (req, res) => {
  const { sessionId } = req.params
  const { type, timestamp = Date.now(), payload = null } = req.body || {}
  if (!type) return respond(res, { ok: false, status: 'failed', storageMode: 'none', error: 'type is required' }, 400)

  const { data: event, usedDb } = await withDbFallback(
    async () => {
      const session = await query('SELECT id FROM smoke_sessions WHERE session_id = $1', [sessionId])
      if (!session.rows[0]) throw new Error('session_not_found')
      const result = await query(
        `INSERT INTO smoke_session_events (smoke_session_id, event_type, payload) VALUES ($1,$2,$3) RETURNING *`,
        [session.rows[0].id, type, JSON.stringify(payload || {})]
      )
      return result.rows[0]
    },
    async () => {
      const event = { sessionId, type, timestamp, payload }
      mem.events.push(event)
      return event
    }
  )
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { event } })
})

router.get('/sessions/:sessionId/events', async (req, res) => {
  const { sessionId } = req.params
  const { data: events, usedDb } = await withDbFallback(
    async () => {
      const result = await query(
        `SELECT e.* FROM smoke_session_events e
         JOIN smoke_sessions s ON s.id = e.smoke_session_id
         WHERE s.session_id = $1 ORDER BY e.created_at DESC`,
        [sessionId]
      )
      return result.rows
    },
    async () => mem.events.filter((e) => e.sessionId === sessionId)
  )
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { events } })
})

// ── Purchase Intents ──────────────────────────────────────────────────────
router.post('/purchase-intents', async (req, res) => {
  const { intentId, sessionId, venueId = null, product = null } = req.body || {}
  if (!intentId || !sessionId) return respond(res, { ok: false, status: 'failed', storageMode: 'none', error: 'intentId and sessionId are required' }, 400)

  const result = await withDbFallback(
    async () => {
      const existing = await query('SELECT id FROM smoke_purchase_intents WHERE intent_id = $1', [intentId])
      if (existing.rows.length) throw Object.assign(new Error('duplicate'), { duplicate: true })
      const session = await query('SELECT id FROM smoke_sessions WHERE session_id = $1', [sessionId])
      if (!session.rows[0]) throw new Error('session_not_found')
      const inserted = await query(
        `INSERT INTO smoke_purchase_intents (intent_id, smoke_session_id, venue_id, product, status, verification_status)
         VALUES ($1,$2,$3,$4,'intent_created','unverified') RETURNING *`,
        [intentId, session.rows[0].id, venueId, product]
      )
      return inserted.rows[0]
    },
    async () => {
      if (mem.intents.has(intentId)) throw Object.assign(new Error('duplicate'), { duplicate: true })
      const row = { intentId, sessionId, venueId, product, status: 'intent_created', verificationStatus: 'unverified', createdAt: new Date().toISOString() }
      mem.intents.set(intentId, row)
      return row
    }
  ).catch((err) => {
    if (err.duplicate) return { data: null, usedDb: false, duplicate: true }
    throw err
  })

  if (!result.data) return respond(res, { ok: false, status: 'failed', storageMode: storageModeFor(result.usedDb), error: 'intentId already exists' }, 409)
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(result.usedDb), data: { intent: result.data } })
})

router.get('/purchase-intents', async (_req, res) => {
  const { data: intents, usedDb } = await withDbFallback(
    async () => (await query('SELECT * FROM smoke_purchase_intents ORDER BY id DESC')).rows,
    async () => Array.from(mem.intents.values())
  )
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { intents } })
})

router.get('/purchase-intents/:intentId', async (req, res) => {
  const { intentId } = req.params
  const { data: intent, usedDb } = await withDbFallback(
    async () => (await query('SELECT * FROM smoke_purchase_intents WHERE intent_id = $1', [intentId])).rows[0] || null,
    async () => mem.intents.get(intentId) || null
  )
  if (!intent) return respond(res, { ok: false, status: 'failed', storageMode: storageModeFor(usedDb), error: 'not_found' }, 404)
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { intent } })
})

router.patch('/purchase-intents/:intentId', async (req, res) => {
  const { intentId } = req.params
  const { product, status } = req.body || {}
  if (status === 'verified' || status === 'rejected') {
    return respond(res, { ok: false, status: 'failed', storageMode: 'none', error: 'use /verify or /reject to change verification status' }, 403)
  }
  const { data: intent, usedDb } = await withDbFallback(
    async () => {
      const sets = []
      const values = []
      if (product !== undefined) { values.push(product); sets.push(`product = $${values.length}`) }
      if (status !== undefined) { values.push(status); sets.push(`status = $${values.length}`) }
      if (!sets.length) return (await query('SELECT * FROM smoke_purchase_intents WHERE intent_id = $1', [intentId])).rows[0] || null
      values.push(intentId)
      const result = await query(`UPDATE smoke_purchase_intents SET ${sets.join(', ')} WHERE intent_id = $${values.length} RETURNING *`, values)
      return result.rows[0] || null
    },
    async () => {
      const existing = mem.intents.get(intentId)
      if (!existing) return null
      const updated = { ...existing, ...(product !== undefined ? { product } : {}), ...(status !== undefined ? { status } : {}) }
      mem.intents.set(intentId, updated)
      return updated
    }
  )
  if (!intent) return respond(res, { ok: false, status: 'failed', storageMode: storageModeFor(usedDb), error: 'not_found' }, 404)
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { intent } })
})

// ── POS3 Verification ─────────────────────────────────────────────────────
async function applyVerification(req, res, action) {
  const { intentId } = req.params
  const { staffId = null } = req.body || {}
  const verificationStatus = action === 'verified' ? 'verified' : 'rejected'

  const { data, usedDb } = await withDbFallback(
    async () => {
      const existing = await query('SELECT * FROM smoke_purchase_intents WHERE intent_id = $1', [intentId])
      if (!existing.rows[0]) return null
      if (existing.rows[0].verification_status === 'verified' || existing.rows[0].verification_status === 'rejected') {
        throw Object.assign(new Error('already_decided'), { alreadyDecided: true })
      }
      const updated = await query(
        `UPDATE smoke_purchase_intents SET status = $1, verification_status = $1 WHERE intent_id = $2 RETURNING *`,
        [verificationStatus, intentId]
      )
      const verification = await query(
        `INSERT INTO smoke_purchase_verifications (purchase_intent_id, action, staff_id) VALUES ($1,$2,$3) RETURNING *`,
        [existing.rows[0].id, action, staffId]
      )
      return { intent: updated.rows[0], verification: verification.rows[0] }
    },
    async () => {
      const existing = mem.intents.get(intentId)
      if (!existing) return null
      if (existing.verificationStatus === 'verified' || existing.verificationStatus === 'rejected') {
        throw Object.assign(new Error('already_decided'), { alreadyDecided: true })
      }
      const updated = { ...existing, status: verificationStatus, verificationStatus }
      mem.intents.set(intentId, updated)
      const verification = { intentId, action, staffId, source: 'pos3_manual', createdAt: new Date().toISOString() }
      mem.verifications.push(verification)
      return { intent: updated, verification }
    }
  ).catch((err) => {
    if (err.alreadyDecided) return { data: 'already_decided', usedDb: false }
    throw err
  })

  if (data === 'already_decided') return respond(res, { ok: false, status: 'failed', storageMode: storageModeFor(usedDb), error: 'already_decided' }, 409)
  if (!data) return respond(res, { ok: false, status: 'failed', storageMode: storageModeFor(usedDb), error: 'not_found' }, 404)
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data })
}

router.post('/purchase-intents/:intentId/verify', (req, res) => applyVerification(req, res, 'verified'))
router.post('/purchase-intents/:intentId/reject', (req, res) => applyVerification(req, res, 'rejected'))

// ── Leaderboard ───────────────────────────────────────────────────────────
router.post('/leaderboard', async (req, res) => {
  const { sessionId, venueId = null, xp = 0, rank = null, finalScore = null, completedSteps = null } = req.body || {}
  if (!sessionId) return respond(res, { ok: false, status: 'failed', storageMode: 'none', error: 'sessionId is required' }, 400)

  const visibility = 'local_only'
  const { data: entry, usedDb } = await withDbFallback(
    async () => {
      const session = await query('SELECT id FROM smoke_sessions WHERE session_id = $1', [sessionId])
      if (!session.rows[0]) throw new Error('session_not_found')
      const result = await query(
        `INSERT INTO smoke_leaderboard_entries (smoke_session_id, venue_id, xp, rank, final_score, completed_steps, visibility)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [session.rows[0].id, venueId, xp, rank, finalScore, completedSteps, visibility]
      )
      return result.rows[0]
    },
    async () => {
      const entry = { sessionId, venueId, xp, rank, finalScore, completedSteps, visibility, createdAt: new Date().toISOString() }
      mem.leaderboard.push(entry)
      return entry
    }
  )
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { entry, visibility } })
})

router.get('/leaderboard', async (_req, res) => {
  const { data: entries, usedDb } = await withDbFallback(
    async () => (await query('SELECT * FROM smoke_leaderboard_entries ORDER BY id DESC')).rows,
    async () => mem.leaderboard
  )
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { entries } })
})

// ── Inventory Impact Preview (always non-applied — never deducts real inventory) ──
router.post('/inventory-impact-preview', async (req, res) => {
  const { sessionId, product, previewedQuantity } = req.body || {}
  if (!sessionId || !product) return respond(res, { ok: false, status: 'failed', storageMode: 'none', error: 'sessionId and product are required' }, 400)

  const { data: preview, usedDb } = await withDbFallback(
    async () => {
      const session = await query('SELECT id FROM smoke_sessions WHERE session_id = $1', [sessionId])
      if (!session.rows[0]) throw new Error('session_not_found')
      const result = await query(
        `INSERT INTO smoke_inventory_impact_previews (smoke_session_id, product, previewed_quantity, applied) VALUES ($1,$2,$3,false) RETURNING *`,
        [session.rows[0].id, product, previewedQuantity ?? 0]
      )
      return result.rows[0]
    },
    async () => {
      const preview = { sessionId, product, previewedQuantity: previewedQuantity ?? null, applied: false, createdAt: new Date().toISOString() }
      mem.inventoryPreviews.push(preview)
      return preview
    }
  )
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { preview, applied: false, inventorySync: 'pending' } })
})

router.get('/inventory-impact-preview/:sessionId', async (req, res) => {
  const { sessionId } = req.params
  const { data: previews, usedDb } = await withDbFallback(
    async () => (await query(
      `SELECT p.* FROM smoke_inventory_impact_previews p
       JOIN smoke_sessions s ON s.id = p.smoke_session_id
       WHERE s.session_id = $1 ORDER BY p.id DESC`,
      [sessionId]
    )).rows,
    async () => mem.inventoryPreviews.filter((p) => p.sessionId === sessionId)
  )
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { previews, inventorySync: 'pending' } })
})

// ── Audit ─────────────────────────────────────────────────────────────────
router.post('/audit-events', async (req, res) => {
  const { eventType, actorRole = null, payload = null } = req.body || {}
  if (!eventType) return respond(res, { ok: false, status: 'failed', storageMode: 'none', error: 'eventType is required' }, 400)

  const { data: event, usedDb } = await withDbFallback(
    async () => {
      const result = await query(
        `INSERT INTO smoke_audit_logs (event_type, actor_role, payload) VALUES ($1,$2,$3) RETURNING *`,
        [eventType, actorRole, payload ? JSON.stringify(payload) : null]
      )
      return result.rows[0]
    },
    async () => {
      const event = { eventType, actorRole, payload, createdAt: new Date().toISOString() }
      mem.auditLogs.push(event)
      return event
    }
  )
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { event } })
})

router.get('/audit-events', async (_req, res) => {
  const { data: events, usedDb } = await withDbFallback(
    async () => (await query('SELECT * FROM smoke_audit_logs ORDER BY id DESC')).rows,
    async () => mem.auditLogs
  )
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { events } })
})

// ── Backend route status — for SmokeBackendReadinessPanel ────────────────
router.get('/status', async (_req, res) => {
  const usedDb = isDbAvailable()
  respond(res, {
    ok: true,
    status: 'backend_connected',
    storageMode: storageModeFor(usedDb),
    data: { routesConnected: true, databaseMode: storageModeFor(usedDb) },
  })
})

export default router

export const memStore = mem
