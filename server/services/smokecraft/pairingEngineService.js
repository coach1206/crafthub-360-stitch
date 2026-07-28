/**
 * Holistic Fix 5B-1 — server-authoritative pairing engine (migration 098).
 *
 * Never trusts a client-submitted score. Reuses the exact same
 * STRENGTH_SCORE / TYPE_STRENGTH / HARMONY / GOAL_DESC / ADJUSTMENT_MAP /
 * SERVING_STYLE data already approved and live in
 * src/utils/pairingEngine.js (dual-imported here, same pattern as
 * src/data/cultivationStages.js / leafChallengeRounds.js) — this pass
 * does not invent new pairing facts, it makes the existing real logic
 * server-authoritative, versioned, explainable, and persisted.
 */
import { getDb } from '../../db/connection.js'
import { recordEvent } from './progressionEventService.js'
import {
  STRENGTH_SCORE, TYPE_STRENGTH, HARMONY, GOAL_DESC, ADJUSTMENT_MAP,
  SERVING_STYLE, PAIRING_CATEGORIES,
} from '../../../src/utils/pairingEngine.js'

export class PairingEngineError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'

let cachedRules = null
let cachedRulesAt = 0
const RULES_CACHE_MS = 30_000

export async function getActiveRules(db) {
  const now = Date.now()
  if (cachedRules && (now - cachedRulesAt) < RULES_CACHE_MS) return cachedRules
  const { rows } = await db.query(`SELECT * FROM smokecraft_pairing_rules WHERE active = true ORDER BY id`)
  cachedRules = rows
  cachedRulesAt = now
  return rows
}

function ruleByKey(rules, key) {
  return rules.find(r => r.rule_key === key)
}

/**
 * Deterministic, explainable, versioned computation. Given identical
 * input and an unchanged active rule set, always returns an identical
 * result (rule-version stability / deterministic-repeat requirement).
 */
export function computeRecommendation(input, rules) {
  const { cigarShape, wrapper, origin, strength, pairingType, flavorNotes = [], pairingGoal } = input
  if (!pairingType) throw new PairingEngineError('pairing_type_required')

  const harmony = HARMONY[pairingType] || { notes: [], clashes: [] }
  const matchedFlavorNotes = flavorNotes.filter(n => harmony.notes.includes(n))
  const conflictingFlavorNotes = flavorNotes.filter(n => harmony.clashes.includes(n))

  const strScore = STRENGTH_SCORE[strength] || 2
  const typScore = TYPE_STRENGTH[pairingType] || 2
  const matchDiff = Math.abs(strScore - typScore)

  const ruleSetVersion = rules.length ? Math.max(...rules.map(r => r.version)) : 1
  const balanceRule = ruleByKey(rules, 'strength-intensity-balance')
  const harmonyRule = ruleByKey(rules, 'flavor-note-harmony')
  const clashRule = ruleByKey(rules, 'flavor-note-clash')
  const originRule = ruleByKey(rules, 'origin-strength-hold')

  const base = 100
  const balancePenalty = matchDiff * (balanceRule?.conflict_effect ?? 12)
  const harmonyBonus = matchedFlavorNotes.length * (harmonyRule?.positive_effect ?? 6)
  const clashPenalty = conflictingFlavorNotes.length * (clashRule?.conflict_effect ?? 10)
  const originBonus = (origin && strScore >= 3) ? (originRule?.positive_effect ?? 4) : 0

  const compatScore = Math.max(30, Math.min(100, Math.round(base - balancePenalty + harmonyBonus - clashPenalty + originBonus)))
  const balanceScore = Math.max(0, Math.min(100, Math.round(100 - matchDiff * 25)))
  const contrastScore = Math.max(0, Math.min(100, conflictingFlavorNotes.length * 20 + matchDiff * 15))
  const intensityMatch = matchDiff === 0 ? 'even' : matchDiff === 1 ? 'close' : 'mismatched'
  const confidence = Math.max(0.2, Math.min(1, 0.4 + matchedFlavorNotes.length * 0.15 + (origin ? 0.1 : 0) + (strength ? 0.1 : 0)))

  const conflicts = []
  if (conflictingFlavorNotes.length > 0) {
    conflicts.push(`Watch for tension between ${conflictingFlavorNotes.join(' and ')} notes and ${pairingType}'s base character.`)
  }
  if (matchDiff >= 2) {
    conflicts.push(`${pairingType}'s intensity and the cigar's ${strength || 'unspecified'} strength are noticeably mismatched.`)
  }

  const explanationParts = [
    matchedFlavorNotes.length > 0
      ? `${matchedFlavorNotes.join(' and ')} notes create direct harmony with ${pairingType}'s profile.`
      : `${pairingType} provides a clean complement to the selected strength.`,
    strength && pairingGoal ? `Goal: ${pairingGoal} — ${GOAL_DESC[pairingGoal] || ''}` : null,
    origin ? `${origin} leaf character ${strScore >= 3 ? 'holds up well' : 'shines cleanly'} against this pairing.` : null,
  ].filter(Boolean)

  const servingSequence = [
    ADJUSTMENT_MAP[strength] || 'Take deliberate, unhurried draws.',
    SERVING_STYLE[pairingType] || 'Serve at a temperature that complements a slow-paced smoke.',
  ].join(' ')

  return {
    ruleSetVersion,
    compatScore, balanceScore, contrastScore, intensityMatch, confidence: Math.round(confidence * 100) / 100,
    matchedFlavorNotes, conflicts, explanation: explanationParts.join(' '), servingSequence,
    cigarShape, wrapper, origin, strength, pairingType, flavorNotes, pairingGoal,
  }
}

function bestAlternative(input, rules, primaryType) {
  let best = null
  for (const category of PAIRING_CATEGORIES) {
    if (category === primaryType) continue
    const r = computeRecommendation({ ...input, pairingType: category }, rules)
    if (!best || r.compatScore > best.compatScore) best = { type: category, score: r.compatScore }
  }
  return best
}

/** Computes + logs pairing_requested/pairing_recommended events. Never persists a save. */
export async function recommend({ guestReference, sourceRoute, input }) {
  const db = getDb()
  const rules = await getActiveRules(db)

  await recordEvent({
    guestReference, sourceScreen: 'Pairing', sourceRoute: sourceRoute || '/smokecraft/pairing',
    eventType: 'pairing_requested', payload: { pairingType: input.pairingType, strength: input.strength },
    idempotencyKey: `pairing-req-${guestReference}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  })

  const result = computeRecommendation(input, rules)
  const alt = bestAlternative(input, rules, input.pairingType)

  await recordEvent({
    guestReference, sourceScreen: 'Pairing', sourceRoute: sourceRoute || '/smokecraft/pairing',
    eventType: 'pairing_recommended', payload: { pairingType: input.pairingType, compatScore: result.compatScore, ruleSetVersion: result.ruleSetVersion },
    idempotencyKey: `pairing-rec-${guestReference}-${input.pairingType}-${result.compatScore}-${Date.now()}`,
  })

  return { ...result, alternative: alt }
}

/** Ranks every real pairing category for the given cigar context — used by Personalized Pairing Recommendations (S22). */
export async function rank({ guestReference, sourceRoute, input }) {
  const db = getDb()
  const rules = await getActiveRules(db)
  const results = PAIRING_CATEGORIES
    .map(category => computeRecommendation({ ...input, pairingType: category }, rules))
    .sort((a, b) => b.compatScore - a.compatScore)

  await recordEvent({
    guestReference, sourceScreen: 'PairingRecommendations', sourceRoute: sourceRoute || '/smokecraft/pairing',
    eventType: 'pairing_requested', payload: { mode: 'rank-all' },
    idempotencyKey: `pairing-rank-${guestReference}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  })
  if (results[0]) {
    await recordEvent({
      guestReference, sourceScreen: 'PairingRecommendations', sourceRoute: sourceRoute || '/smokecraft/pairing',
      eventType: 'pairing_recommended', payload: { pairingType: results[0].pairingType, compatScore: results[0].compatScore, ruleSetVersion: results[0].ruleSetVersion },
      idempotencyKey: `pairing-rank-top-${guestReference}-${results[0].pairingType}-${results[0].compatScore}-${Date.now()}`,
    })
  }
  return results
}

/**
 * Saves a pairing. The server ALWAYS recomputes the score itself from
 * the submitted raw selection inputs — a client-submitted compatScore/
 * explanation/etc. is never accepted or trusted, even on save.
 */
export async function savePairing({ guestReference, sourceRoute, input, idempotencyKey, learnerRating, learnerNotes }) {
  const db = getDb()

  // True idempotent no-op: an exact retry of the same idempotency key
  // must never bump save_version or append a revision — it's the same
  // logical request being safely retried, not a new edit.
  const existingByKey = await db.query(`SELECT * FROM smokecraft_pairing_saves WHERE idempotency_key = $1 AND guest_reference = $2`, [idempotencyKey, guestReference])
  if (existingByKey.rows[0]) return { ok: true, save: existingByKey.rows[0], alreadySaved: true }

  const rules = await getActiveRules(db)
  const computed = computeRecommendation(input, rules)
  const alt = bestAlternative(input, rules, input.pairingType)

  try {
    const { rows } = await db.query(
      `INSERT INTO smokecraft_pairing_saves
         (guest_reference, idempotency_key, cigar_shape, wrapper, origin, strength, pairing_type, flavor_notes, pairing_goal,
          compat_score, balance_score, contrast_score, intensity_match, confidence, explanation, matched_flavor_notes, conflicts,
          serving_sequence, alternative_type, alternative_score, rule_set_version, learner_rating, learner_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       ON CONFLICT (guest_reference, cigar_shape, wrapper, origin, strength, pairing_type) DO UPDATE SET
         flavor_notes = EXCLUDED.flavor_notes, pairing_goal = EXCLUDED.pairing_goal,
         compat_score = EXCLUDED.compat_score, balance_score = EXCLUDED.balance_score, contrast_score = EXCLUDED.contrast_score,
         intensity_match = EXCLUDED.intensity_match, confidence = EXCLUDED.confidence, explanation = EXCLUDED.explanation,
         matched_flavor_notes = EXCLUDED.matched_flavor_notes, conflicts = EXCLUDED.conflicts, serving_sequence = EXCLUDED.serving_sequence,
         alternative_type = EXCLUDED.alternative_type, alternative_score = EXCLUDED.alternative_score, rule_set_version = EXCLUDED.rule_set_version,
         learner_rating = COALESCE($22, smokecraft_pairing_saves.learner_rating),
         learner_notes = COALESCE($23, smokecraft_pairing_saves.learner_notes),
         save_version = smokecraft_pairing_saves.save_version + 1,
         updated_at = now()
       RETURNING *, (xmax = 0) AS inserted`,
      [guestReference, idempotencyKey, input.cigarShape || null, input.wrapper || null, input.origin || null, input.strength || null,
       input.pairingType, JSON.stringify(input.flavorNotes || []), input.pairingGoal || null,
       computed.compatScore, computed.balanceScore, computed.contrastScore, computed.intensityMatch, computed.confidence, computed.explanation,
       JSON.stringify(computed.matchedFlavorNotes), JSON.stringify(computed.conflicts), computed.servingSequence,
       alt?.type || null, alt?.score ?? null, computed.ruleSetVersion, learnerRating ?? null, learnerNotes ?? null]
    )
    const saved = rows[0]
    await db.query(
      `INSERT INTO smokecraft_pairing_save_revisions (save_id, snapshot) VALUES ($1, $2)`,
      [saved.id, JSON.stringify(saved)]
    )
    await recordEvent({
      guestReference, sourceScreen: 'Pairing', sourceRoute: sourceRoute || '/smokecraft/pairing',
      eventType: saved.inserted ? 'pairing_saved' : 'pairing_rated',
      payload: { saveId: saved.id, compatScore: saved.compat_score },
      idempotencyKey: `pairing-save-event-${idempotencyKey}`,
    })
    return { ok: true, save: saved, alreadySaved: !saved.inserted }
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      const { rows } = await db.query(`SELECT * FROM smokecraft_pairing_saves WHERE idempotency_key = $1`, [idempotencyKey])
      if (rows[0]) return { ok: true, save: rows[0], alreadySaved: true }
    }
    throw err
  }
}

export async function getSavedPairings(guestReference) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM smokecraft_pairing_saves WHERE guest_reference = $1 ORDER BY updated_at DESC`,
    [guestReference]
  )
  return rows
}

export async function getSavedPairing(guestReference, id) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM smokecraft_pairing_saves WHERE id = $1 AND guest_reference = $2`,
    [id, guestReference]
  )
  if (!rows[0]) throw new PairingEngineError('not_found')
  const revisions = await db.query(
    `SELECT * FROM smokecraft_pairing_save_revisions WHERE save_id = $1 ORDER BY revised_at ASC`,
    [id]
  )
  return { ...rows[0], revisions: revisions.rows }
}

/** Optimistic-concurrency rating/notes update — 'stale_write' when expectedVersion doesn't match. */
export async function ratePairing({ guestReference, id, expectedVersion, learnerRating, learnerNotes }) {
  const db = getDb()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `SELECT * FROM smokecraft_pairing_saves WHERE id = $1 AND guest_reference = $2 FOR UPDATE`,
      [id, guestReference]
    )
    if (!rows[0]) { await client.query('ROLLBACK'); throw new PairingEngineError('not_found') }
    const current = rows[0]
    if (expectedVersion !== undefined && expectedVersion !== null && current.save_version !== expectedVersion) {
      await client.query('ROLLBACK')
      return { ok: false, conflict: true, current }
    }
    await client.query(
      `INSERT INTO smokecraft_pairing_save_revisions (save_id, snapshot) VALUES ($1, $2)`,
      [id, JSON.stringify(current)]
    )
    const { rows: updated } = await client.query(
      `UPDATE smokecraft_pairing_saves SET
         learner_rating = COALESCE($3, learner_rating),
         learner_notes = COALESCE($4, learner_notes),
         save_version = save_version + 1,
         updated_at = now()
       WHERE id = $1 AND guest_reference = $2
       RETURNING *`,
      [id, guestReference, learnerRating ?? null, learnerNotes ?? null]
    )
    await client.query('COMMIT')
    await recordEvent({
      guestReference, sourceScreen: 'Pairing', sourceRoute: '/smokecraft/pairing',
      eventType: 'pairing_rated', payload: { saveId: id, learnerRating: learnerRating ?? null },
      idempotencyKey: `pairing-rate-${id}-${updated[0].save_version}`,
    })
    return { ok: true, save: updated[0] }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

/** Copies saved pairings from a guest identity to an account identity on conversion. Never overwrites an existing account row. */
export async function transferSavedPairings(client, guestReference, userReference) {
  const { rows: guestSaves } = await client.query(`SELECT * FROM smokecraft_pairing_saves WHERE guest_reference = $1`, [guestReference])
  let transferred = 0, mergedDuplicate = 0
  for (const gs of guestSaves) {
    const existing = await client.query(
      `SELECT id FROM smokecraft_pairing_saves WHERE guest_reference = $1 AND cigar_shape IS NOT DISTINCT FROM $2 AND wrapper IS NOT DISTINCT FROM $3 AND origin IS NOT DISTINCT FROM $4 AND strength IS NOT DISTINCT FROM $5 AND pairing_type = $6`,
      [userReference, gs.cigar_shape, gs.wrapper, gs.origin, gs.strength, gs.pairing_type]
    )
    if (existing.rows.length > 0) { mergedDuplicate++; continue }
    const inserted = await client.query(
      `INSERT INTO smokecraft_pairing_saves
         (guest_reference, idempotency_key, cigar_shape, wrapper, origin, strength, pairing_type, flavor_notes, pairing_goal,
          compat_score, balance_score, contrast_score, intensity_match, confidence, explanation, matched_flavor_notes, conflicts,
          serving_sequence, alternative_type, alternative_score, rule_set_version, learner_rating, learner_notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING id`,
      [userReference, `converted:${gs.idempotency_key}`, gs.cigar_shape, gs.wrapper, gs.origin, gs.strength, gs.pairing_type, JSON.stringify(gs.flavor_notes), gs.pairing_goal,
       gs.compat_score, gs.balance_score, gs.contrast_score, gs.intensity_match, gs.confidence, gs.explanation, JSON.stringify(gs.matched_flavor_notes), JSON.stringify(gs.conflicts),
       gs.serving_sequence, gs.alternative_type, gs.alternative_score, gs.rule_set_version, gs.learner_rating, gs.learner_notes]
    )
    await client.query(
      `INSERT INTO smokecraft_pairing_save_revisions (save_id, snapshot) SELECT $1, to_jsonb(s) FROM smokecraft_pairing_saves s WHERE s.id = $1`,
      [inserted.rows[0].id]
    )
    transferred++
  }
  return { transferred, mergedDuplicate }
}
