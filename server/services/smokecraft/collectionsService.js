/**
 * Collections Ownership and Persistence — server-side award evaluator
 * (migration 087). Never trusts client-submitted ownership; every award
 * is calculated from the same real backend evidence tables the Skill
 * Tree rule engine uses (some checks are intentionally identical —
 * Filler Arrangement completion, Seed & Soil engagement, rolling
 * progress, progression-event breadth — plus one check that reuses
 * Skill Tree's own learner-state table directly, a genuine cross-system
 * connection, not a duplicate).
 */
import { getDb } from '../../db/connection.js'
import { recordEvent } from './progressionEventService.js'

export class CollectionsError extends Error {
  constructor(code) { super(code); this.code = code }
}

const EVIDENCE_CHECKS = {
  smokecraft_filler_arrangement_completion: async (db, ref) => {
    const { rows } = await db.query(`SELECT completed_at FROM smokecraft_filler_arrangement_completion WHERE guest_reference = $1`, [ref])
    return { met: !!rows[0], detail: rows[0] ? `Filler Arrangement completed ${rows[0].completed_at.toISOString()}` : 'Filler Arrangement not yet completed', sourceRecordId: rows[0]?.id ? String(rows[0].id) : null }
  },
  smokecraft_seed_soil_progress: async (db, ref) => {
    const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_seed_soil_progress WHERE guest_reference = $1`, [ref])
    return { met: rows[0].c > 0, detail: `${rows[0].c} Seed & Soil component(s) explored`, sourceRecordId: null }
  },
  smokecraft_rolling_progress: async (db, ref) => {
    const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_rolling_progress WHERE guest_reference = $1 AND status = 'completed'`, [ref])
    return { met: rows[0].c > 0, detail: `${rows[0].c} rolling-process step(s) completed`, sourceRecordId: null }
  },
  smokecraft_skill_tree_learner_state: async (db, ref) => {
    const { rows } = await db.query(`SELECT completed_at FROM smokecraft_skill_tree_learner_state WHERE guest_reference = $1 AND node_key = 'foundation' AND state = 'completed'`, [ref])
    return { met: !!rows[0], detail: rows[0] ? `Skill Tree Foundation node completed ${rows[0].completed_at.toISOString()}` : 'Skill Tree Foundation node not yet completed', sourceRecordId: null }
  },
  smokecraft_progression_events: async (db, ref) => {
    const { rows } = await db.query(`SELECT COUNT(DISTINCT event_type)::int AS c FROM smokecraft_progression_events WHERE guest_reference = $1`, [ref])
    return { met: rows[0].c >= 2, detail: `${rows[0].c} distinct progression event type(s) recorded`, sourceRecordId: null }
  },
}

export async function getCatalog() {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM smokecraft_collection_items WHERE active = true ORDER BY display_order`)
  return rows
}

/**
 * Holistic Fix 5A-3F: reversed collection items (staff-authorized, via
 * the existing POST /api/smokecraft/player-state/corrections endpoint,
 * correctionType='collection') — the ORIGINAL smokecraft_collection_ownership
 * row is never deleted or edited; this reads the append-only
 * smokecraft_reward_corrections ledger to find which items have an
 * active reversal, so recalculate() can honestly report a 'corrected'
 * state without touching the historical earn record.
 */
async function getReversedItemKeys(db, guestReference) {
  const { rows } = await db.query(
    `SELECT DISTINCT target_award_key FROM smokecraft_reward_corrections
     WHERE guest_reference = $1 AND correction_type = 'collection' AND reversed = true`,
    [guestReference]
  )
  return new Set(rows.map(r => r.target_award_key))
}

// Deterministic, explainable evaluation — every item's evidence is
// checked fresh, never trusted from the client. Awarding is idempotent
// via the (guest_reference, collection_item_key) unique constraint and
// a stable idempotency_key.
export async function recalculate(guestReference) {
  const db = getDb()
  const items = await getCatalog()
  const { rows: ownedRows } = await db.query(
    `SELECT collection_item_key, earned_at FROM smokecraft_collection_ownership WHERE guest_reference = $1`,
    [guestReference]
  )
  const ownedByKey = Object.fromEntries(ownedRows.map(r => [r.collection_item_key, r]))
  const reversedKeys = await getReversedItemKeys(db, guestReference)

  const newlyEarned = []
  const alreadyOwned = []
  const stillLocked = []

  for (const item of items) {
    if (ownedByKey[item.item_key]) {
      // Never deletes/edits the original earn row — a staff-authorized
      // reversal is reported as its own honest state alongside the
      // preserved history, not a silent re-lock.
      alreadyOwned.push({ item, ownedAt: ownedByKey[item.item_key].earned_at, reversed: reversedKeys.has(item.item_key) })
      continue
    }
    const evidenceCheck = EVIDENCE_CHECKS[item.source_record_type]
    if (!evidenceCheck) throw new CollectionsError(`unknown_source_record_type:${item.source_record_type}`)
    const evidence = await evidenceCheck(db, guestReference)

    if (!evidence.met) {
      stillLocked.push({ item, reason: evidence.detail })
      continue
    }

    const idempotencyKey = `collection-award-${guestReference}-${item.item_key}`
    const { event } = await recordEvent({
      guestReference, sourceScreen: 'CollectionsCenter', sourceRoute: '/smokecraft/collections',
      eventType: 'collection_item_earned',
      payload: { itemKey: item.item_key, sourceModule: item.source_module },
      idempotencyKey: `collection-award-event-${guestReference}-${item.item_key}`,
    })

    const { rows } = await db.query(
      `INSERT INTO smokecraft_collection_ownership
         (guest_reference, collection_item_key, earn_source, source_progression_event_id, source_record_id, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (guest_reference, collection_item_key) DO NOTHING
       RETURNING *`,
      [guestReference, item.item_key, item.source_module, event.id, evidence.sourceRecordId, idempotencyKey]
    )
    if (rows[0]) {
      newlyEarned.push({ item, ownedAt: rows[0].earned_at, evidence: evidence.detail })
    } else {
      // Lost a race / already existed by the time of insert — idempotent,
      // treat as already owned rather than a failure.
      const { rows: existing } = await db.query(
        `SELECT earned_at FROM smokecraft_collection_ownership WHERE guest_reference = $1 AND collection_item_key = $2`,
        [guestReference, item.item_key]
      )
      alreadyOwned.push({ item, ownedAt: existing[0]?.earned_at })
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  await recordEvent({
    guestReference, sourceScreen: 'CollectionsCenter', sourceRoute: '/smokecraft/collections',
    eventType: 'collection_recalculated',
    payload: { newlyEarnedCount: newlyEarned.length, ownedCount: alreadyOwned.length + newlyEarned.length },
    idempotencyKey: `collection-recalc-${guestReference}-${today}`,
  })

  return { newlyEarned, alreadyOwned, stillLocked, totalActive: items.length }
}

export async function getItemDetail(guestReference, itemKey) {
  const result = await recalculate(guestReference)
  const owned = [...result.newlyEarned, ...result.alreadyOwned].find(r => r.item.item_key === itemKey)
  if (owned) return { item: owned.item, owned: true, ownedAt: owned.ownedAt, evidence: owned.evidence || null, reversed: !!owned.reversed }
  const locked = result.stillLocked.find(r => r.item.item_key === itemKey)
  if (locked) return { item: locked.item, owned: false, reason: locked.reason }
  throw new CollectionsError('item_not_found')
}
