/**
 * SmokeCraft E.A.T. handoffs — mounted at /api/eat/smokecraft (Phase 10).
 * Separate from server/routes/eatRoutes.js (general E.A.T. dashboard) so
 * existing /api/eat/* behavior is untouched.
 */
import { Router } from 'express'
import { isDbAvailable, query } from '../db/connection.js'

const router = Router()
const memHandoffs = new Map()

function storageModeFor(usedDb) {
  return usedDb ? 'postgres' : 'memory_fallback'
}

function respond(res, { ok, status, storageMode, data = null, error = null }, httpStatus = 200) {
  res.status(httpStatus).json({ ok, status, storageMode, data, error })
}

async function withDbFallback(dbFn, memFn) {
  if (isDbAvailable()) {
    try {
      const data = await dbFn()
      return { data, usedDb: true }
    } catch (err) {
      console.warn('[smokecraft-eat] DB query failed, falling back to memory:', err.message)
    }
  }
  return { data: await memFn(), usedDb: false }
}

router.get('/handoffs', async (_req, res) => {
  const { data: handoffs, usedDb } = await withDbFallback(
    async () => (await query('SELECT * FROM smoke_eat_handoffs ORDER BY id DESC')).rows,
    async () => Array.from(memHandoffs.values())
  )
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { handoffs } })
})

router.patch('/handoffs/:handoffId', async (req, res) => {
  const { handoffId } = req.params
  const { acknowledgedByUserId, status } = req.body || {}

  const { data: handoff, usedDb } = await withDbFallback(
    async () => {
      const sets = []
      const values = []
      if (acknowledgedByUserId !== undefined) { values.push(acknowledgedByUserId); sets.push(`acknowledged_by_user_id = $${values.length}`) }
      if (status !== undefined) { values.push(status); sets.push(`status = $${values.length}`) }
      if (!sets.length) return (await query('SELECT * FROM smoke_eat_handoffs WHERE handoff_id = $1', [handoffId])).rows[0] || null
      values.push(handoffId)
      const result = await query(`UPDATE smoke_eat_handoffs SET ${sets.join(', ')} WHERE handoff_id = $${values.length} RETURNING *`, values)
      return result.rows[0] || null
    },
    async () => {
      const existing = memHandoffs.get(handoffId)
      if (!existing) return null
      const updated = { ...existing, ...(acknowledgedByUserId !== undefined ? { acknowledgedByUserId } : {}), ...(status !== undefined ? { status } : {}) }
      memHandoffs.set(handoffId, updated)
      return updated
    }
  )
  if (!handoff) return respond(res, { ok: false, status: 'failed', storageMode: storageModeFor(usedDb), error: 'not_found' }, 404)
  respond(res, { ok: true, status: 'backend_connected', storageMode: storageModeFor(usedDb), data: { handoff } })
})

export default router
