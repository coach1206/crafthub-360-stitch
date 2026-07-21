/**
 * Skill Tree Persistence — server-side rule evaluator (migration 086).
 * Never trusts client-submitted completion; every node's state is
 * calculated from real backend evidence tables that already exist:
 *   foundation        → smokecraft_seed_soil_progress (Package 4)
 *   leaf-process       → smokecraft_filler_arrangement_completion (this session)
 *   construction        → smokecraft_rolling_progress (Package 5)
 *   flavor-experience  → smokecraft_flavor_stage_observations (Package 6)
 *   pairing-pairings   → smokecraft_pairing_drafts (Package 6)
 *   mastery-blending   → golden_box_entries (Package 1)
 *   community-legacy   → smokecraft_progression_events breadth (migration 085)
 */
import { getDb } from '../../db/connection.js'
import { recordEvent } from './progressionEventService.js'

export class SkillTreeError extends Error {
  constructor(code) { super(code); this.code = code }
}

// Evidence checks — each returns { met: boolean, detail: string }.
const EVIDENCE_CHECKS = {
  seed_soil_engagement: async (db, ref) => {
    const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_seed_soil_progress WHERE guest_reference = $1`, [ref])
    return { met: rows[0].c > 0, detail: `${rows[0].c} Seed & Soil component(s) explored` }
  },
  filler_arrangement_completion: async (db, ref) => {
    const { rows } = await db.query(`SELECT completed_at FROM smokecraft_filler_arrangement_completion WHERE guest_reference = $1`, [ref])
    return { met: !!rows[0], detail: rows[0] ? `Filler Arrangement completed ${rows[0].completed_at.toISOString()}` : 'Filler Arrangement not yet completed' }
  },
  rolling_progress_engagement: async (db, ref) => {
    const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_rolling_progress WHERE guest_reference = $1 AND status = 'completed'`, [ref])
    return { met: rows[0].c > 0, detail: `${rows[0].c} rolling-process step(s) completed` }
  },
  flavor_stage_engagement: async (db, ref) => {
    const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_flavor_stage_observations WHERE guest_reference = $1`, [ref])
    return { met: rows[0].c > 0, detail: `${rows[0].c} flavor-stage observation(s) recorded` }
  },
  pairing_draft_engagement: async (db, ref) => {
    const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM smokecraft_pairing_drafts WHERE guest_reference = $1`, [ref])
    return { met: rows[0].c > 0, detail: `${rows[0].c} pairing draft(s) built` }
  },
  golden_box_entry_exists: async (db, ref) => {
    const { rows } = await db.query(`SELECT COUNT(*)::int AS c FROM golden_box_entries WHERE guest_reference = $1`, [ref])
    return { met: rows[0].c > 0, detail: `${rows[0].c} Golden Box entry(ies) started` }
  },
  progression_event_breadth: async (db, ref) => {
    const { rows } = await db.query(`SELECT COUNT(DISTINCT event_type)::int AS c FROM smokecraft_progression_events WHERE guest_reference = $1`, [ref])
    return { met: rows[0].c >= 2, detail: `${rows[0].c} distinct progression event type(s) recorded` }
  },
}

export async function getNodeDefinitions() {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM smokecraft_skill_tree_nodes WHERE active = true ORDER BY display_order`
  )
  return rows
}

// Deterministic, explainable evaluation — walks nodes in display order so
// each node's prerequisite states are already known by the time it's
// evaluated (sequential chain, matches the seeded prerequisite_node_keys).
export async function recalculate(guestReference) {
  const db = getDb()
  const nodes = await getNodeDefinitions()
  const results = []
  const stateByKey = {}

  for (const node of nodes) {
    const prereqsMet = node.prerequisite_node_keys.every(k => stateByKey[k] === 'completed')
    const evidenceCheck = EVIDENCE_CHECKS[node.completion_rule]
    if (!evidenceCheck) throw new SkillTreeError(`unknown_completion_rule:${node.completion_rule}`)

    let state, unlockSource, completionSource, reason, missingRequirements = []

    if (!prereqsMet) {
      state = 'locked'
      unlockSource = null
      completionSource = null
      const missingNode = node.prerequisite_node_keys.find(k => stateByKey[k] !== 'completed')
      reason = `Locked — complete "${missingNode}" first.`
      missingRequirements = node.prerequisite_node_keys.filter(k => stateByKey[k] !== 'completed')
    } else {
      const evidence = await evidenceCheck(db, guestReference)
      unlockSource = node.unlock_rule
      if (evidence.met) {
        state = 'completed'
        completionSource = node.completion_rule
        reason = evidence.detail
      } else {
        state = 'available'
        completionSource = null
        reason = evidence.detail
        missingRequirements = [node.completion_rule]
      }
    }

    stateByKey[node.node_key] = state

    const { rows } = await db.query(
      `INSERT INTO smokecraft_skill_tree_learner_state
         (guest_reference, node_key, state, unlock_source, completion_source, completed_at, last_calculated_at, updated_at)
       VALUES ($1,$2,$3,$4,$5, CASE WHEN $3 = 'completed' THEN now() ELSE NULL END, now(), now())
       ON CONFLICT (guest_reference, node_key) DO UPDATE SET
         state = EXCLUDED.state,
         unlock_source = EXCLUDED.unlock_source,
         completion_source = EXCLUDED.completion_source,
         completed_at = CASE
           WHEN EXCLUDED.state = 'completed' AND smokecraft_skill_tree_learner_state.completed_at IS NOT NULL
             THEN smokecraft_skill_tree_learner_state.completed_at
           WHEN EXCLUDED.state = 'completed' THEN now()
           ELSE NULL
         END,
         last_calculated_at = now(),
         updated_at = now()
       RETURNING *`,
      [guestReference, node.node_key, state, unlockSource, completionSource]
    )

    results.push({
      node,
      learnerState: rows[0],
      reason,
      missingRequirements,
    })
  }

  // Real progression event for the recalculation itself — idempotent per
  // guest per day (not per call — recalculation is meant to be re-run
  // freely without spamming the event log).
  const today = new Date().toISOString().slice(0, 10)
  await recordEvent({
    guestReference, sourceScreen: 'SkillTree', sourceRoute: '/smokecraft/skill-tree',
    eventType: 'skill_tree_recalculated', payload: { completedCount: results.filter(r => r.learnerState.state === 'completed').length },
    idempotencyKey: `skill-tree-recalc-${guestReference}-${today}`,
  })

  return results
}

export async function getNodeDetail(guestReference, nodeKey) {
  const results = await recalculate(guestReference)
  const found = results.find(r => r.node.node_key === nodeKey)
  if (!found) throw new SkillTreeError('node_not_found')
  return found
}
