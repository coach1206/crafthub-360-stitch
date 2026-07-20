/**
 * Package 5 closure — filler-arrangement practice, step-tracked rolling
 * process, and quality-control checklist decisions. Reuses xpService's
 * awardXp for idempotent XP (same pattern as seedSoilService).
 */
import { getDb } from '../../db/connection.js'
import { awardXp } from './xpService.js'

export class LeafConstructionError extends Error {
  constructor(code) { super(code); this.code = code }
}

// ── Filler arrangement (one active practice arrangement per guest) ────
export async function getArrangement(guestReference) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM smokecraft_filler_arrangements WHERE guest_reference = $1`, [guestReference])
  return rows[0] || null
}

export async function saveArrangement(guestReference, arrangement) {
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO smokecraft_filler_arrangements (guest_reference, arrangement, updated_at)
     VALUES ($1,$2,now())
     ON CONFLICT (guest_reference) DO UPDATE SET arrangement = $2, updated_at = now()
     RETURNING *`,
    [guestReference, JSON.stringify(arrangement)]
  )
  return rows[0]
}

// ── Rolling process (10 ordered steps, server-enforced order) ─────────
export const ROLLING_STEPS = [
  'prepare-leaves', 'arrange-filler', 'select-bunching-method', 'apply-binder',
  'mold-or-press', 'apply-wrapper', 'construct-cap', 'finish-foot',
  'inspect-and-draw-test', 'rest-and-box-age',
]

export async function getRollingProgress(guestReference) {
  const db = getDb()
  const { rows } = await db.query(`SELECT step_key, status, updated_at FROM smokecraft_rolling_progress WHERE guest_reference = $1`, [guestReference])
  const byStep = {}
  for (const row of rows) byStep[row.step_key] = row.status
  return ROLLING_STEPS.map(key => ({ stepKey: key, status: byStep[key] || 'not_started' }))
}

export async function advanceRollingStep(guestReference, stepKey) {
  const idx = ROLLING_STEPS.indexOf(stepKey)
  if (idx === -1) throw new LeafConstructionError('invalid_step')
  const db = getDb()

  if (idx > 0) {
    const prevKey = ROLLING_STEPS[idx - 1]
    const { rows: prev } = await db.query(
      `SELECT status FROM smokecraft_rolling_progress WHERE guest_reference = $1 AND step_key = $2`,
      [guestReference, prevKey]
    )
    if (prev[0]?.status !== 'completed') throw new LeafConstructionError('previous_step_not_completed')
  }

  const { rows } = await db.query(
    `INSERT INTO smokecraft_rolling_progress (guest_reference, step_key, status, updated_at)
     VALUES ($1,$2,'completed',now())
     ON CONFLICT (guest_reference, step_key) DO UPDATE SET status = 'completed', updated_at = now()
     RETURNING *`,
    [guestReference, stepKey]
  )

  let xpAwarded = false
  if (idx === ROLLING_STEPS.length - 1) {
    const result = await awardXp({
      guestReference, amount: 20, sourceType: 'session_completion', sourceId: 'rolling-process',
      reason: 'Completed the full leaf-to-cigar rolling process sequence',
      awardRuleKey: 'rolling_process_complete',
      idempotencyKey: `rolling-process-complete:${guestReference}`,
    })
    xpAwarded = !result.deduplicated
  }

  return { progress: rows[0], xpAwarded }
}

// ── Quality control checklist ──────────────────────────────────────────
export const QC_ITEMS = [
  'draw-test', 'weight-check', 'ring-gauge-check', 'length-check',
  'wrapper-inspection', 'cap-inspection', 'foot-inspection',
  'density', 'soft-spots', 'hard-spots', 'moisture',
]

export async function getQualityControlDecisions(guestReference) {
  const db = getDb()
  const { rows } = await db.query(`SELECT item_key, decision, notes, updated_at FROM smokecraft_quality_control_decisions WHERE guest_reference = $1`, [guestReference])
  return rows
}

export async function saveQualityControlDecision(guestReference, itemKey, decision, notes) {
  if (!QC_ITEMS.includes(itemKey)) throw new LeafConstructionError('invalid_item')
  if (!['accept', 'rework', 'reject'].includes(decision)) throw new LeafConstructionError('invalid_decision')
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO smokecraft_quality_control_decisions (guest_reference, item_key, decision, notes, updated_at)
     VALUES ($1,$2,$3,$4,now())
     ON CONFLICT (guest_reference, item_key) DO UPDATE SET decision = $3, notes = $4, updated_at = now()
     RETURNING *`,
    [guestReference, itemKey, decision, notes || null]
  )
  return rows[0]
}
