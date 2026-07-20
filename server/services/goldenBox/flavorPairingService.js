/**
 * Package 6 — flavor-progression stage observations and pairing-builder
 * practice drafts. Reuses xpService for idempotent XP (same pattern as
 * seedSoilService/leafConstructionService).
 */
import { getDb } from '../../db/connection.js'
import { awardXp } from './xpService.js'

export class FlavorPairingError extends Error {
  constructor(code) { super(code); this.code = code }
}

export const FLAVOR_STAGES = ['cold_aroma', 'cold_draw', 'first_third', 'second_third', 'final_third', 'finish']

export async function getFlavorStages(guestReference) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM smokecraft_flavor_stage_observations WHERE guest_reference = $1`, [guestReference])
  return rows
}

export async function saveFlavorStage(guestReference, stage, fields) {
  if (!FLAVOR_STAGES.includes(stage)) throw new FlavorPairingError('invalid_stage')
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO smokecraft_flavor_stage_observations
       (guest_reference, stage, flavor_notes, intensity, strength_perception, body, balance, complexity, burn, draw, temperature, personal_notes, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,now())
     ON CONFLICT (guest_reference, stage) DO UPDATE SET
       flavor_notes = $3, intensity = $4, strength_perception = $5, body = $6, balance = $7,
       complexity = $8, burn = $9, draw = $10, temperature = $11, personal_notes = $12, updated_at = now()
     RETURNING *`,
    [guestReference, stage, JSON.stringify(fields.flavorNotes || []), fields.intensity || null, fields.strengthPerception || null,
     fields.body || null, fields.balance || null, fields.complexity || null, fields.burn || null, fields.draw || null,
     fields.temperature || null, fields.personalNotes || null]
  )
  return rows[0]
}

export async function listPairingDrafts(guestReference) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM smokecraft_pairing_drafts WHERE guest_reference = $1 ORDER BY updated_at DESC`, [guestReference])
  return rows
}

export async function getPairingDraft(guestReference, id) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM smokecraft_pairing_drafts WHERE id = $1 AND guest_reference = $2`, [id, guestReference])
  if (!rows[0]) throw new FlavorPairingError('draft_not_found')
  return rows[0]
}

const DRAFT_FIELDS = ['cigar_reference', 'pairing_category', 'pairing_item', 'intensity', 'sweetness', 'acidity', 'bitterness', 'texture', 'temperature', 'strategy', 'reasoning']

export async function savePairingDraft(guestReference, payload) {
  const db = getDb()
  const values = DRAFT_FIELDS.map(f => payload[toCamel(f)] ?? null)

  if (payload.id) {
    const { rows: existing } = await db.query(`SELECT id FROM smokecraft_pairing_drafts WHERE id = $1 AND guest_reference = $2`, [payload.id, guestReference])
    if (!existing[0]) throw new FlavorPairingError('draft_not_found')
    const setClauses = DRAFT_FIELDS.map((f, i) => `${f} = $${i + 3}`).join(', ')
    const { rows } = await db.query(
      `UPDATE smokecraft_pairing_drafts SET ${setClauses}, status = 'saved', updated_at = now() WHERE id = $1 AND guest_reference = $2 RETURNING *`,
      [payload.id, guestReference, ...values]
    )
    return { draft: rows[0], firstSave: false }
  }

  const cols = ['guest_reference', ...DRAFT_FIELDS, 'status']
  const placeholders = cols.map((_, i) => `$${i + 1}`).join(',')
  const { rows } = await db.query(
    `INSERT INTO smokecraft_pairing_drafts (${cols.join(',')}) VALUES (${placeholders}) RETURNING *`,
    [guestReference, ...values, 'saved']
  )
  // Snapshot revision 1 immediately, so revision history is complete from
  // the very first save — without this, only revisions 2+ (from explicit
  // "revise" calls) would be recoverable, and the original creation state
  // would be lost once a later revision overwrote the live row.
  await db.query(
    `INSERT INTO smokecraft_pairing_draft_revisions (draft_id, revision_number, snapshot) VALUES ($1,1,$2)`,
    [rows[0].id, JSON.stringify(rows[0])]
  )

  const result = await awardXp({
    guestReference, amount: 15, sourceType: 'session_completion', sourceId: 'pairing-draft-first-save',
    reason: 'Saved a complete pairing practice draft',
    awardRuleKey: 'pairing_draft_saved',
    idempotencyKey: `pairing-draft-first-save:${guestReference}`,
  })

  return { draft: rows[0], firstSave: !result.deduplicated }
}

function toCamel(snake) {
  return snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

// ── Pairing draft revisions (closure pass) ─────────────────────────────
// The "live" row in smokecraft_pairing_drafts always reflects the latest
// revision; every save also writes an immutable snapshot so earlier
// revisions are never lost, per the mandate's explicit "do not overwrite
// prior immutable revisions" requirement.
export async function reviseDraft(guestReference, draftId, payload) {
  const db = getDb()
  const { rows: existing } = await db.query(`SELECT * FROM smokecraft_pairing_drafts WHERE id = $1 AND guest_reference = $2`, [draftId, guestReference])
  if (!existing[0]) throw new FlavorPairingError('draft_not_found')

  const nextRevision = existing[0].current_revision + 1
  const values = DRAFT_FIELDS.map(f => payload[toCamel(f)] ?? existing[0][f])
  const setClauses = DRAFT_FIELDS.map((f, i) => `${f} = $${i + 3}`).join(', ')

  const { rows } = await db.query(
    `UPDATE smokecraft_pairing_drafts SET ${setClauses}, current_revision = $${DRAFT_FIELDS.length + 3}, status = 'saved', updated_at = now()
     WHERE id = $1 AND guest_reference = $2 RETURNING *`,
    [draftId, guestReference, ...values, nextRevision]
  )
  await db.query(
    `INSERT INTO smokecraft_pairing_draft_revisions (draft_id, revision_number, snapshot) VALUES ($1,$2,$3)`,
    [draftId, nextRevision, JSON.stringify(rows[0])]
  )
  return rows[0]
}

export async function getDraftRevisions(guestReference, draftId) {
  const db = getDb()
  const { rows: owned } = await db.query(`SELECT id FROM smokecraft_pairing_drafts WHERE id = $1 AND guest_reference = $2`, [draftId, guestReference])
  if (!owned[0]) throw new FlavorPairingError('draft_not_found')
  const { rows } = await db.query(`SELECT * FROM smokecraft_pairing_draft_revisions WHERE draft_id = $1 ORDER BY revision_number ASC`, [draftId])
  return rows
}

// ── Smoking-technique cadence session ──────────────────────────────────
export async function getCadenceSession(guestReference) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM smokecraft_cadence_sessions WHERE guest_reference = $1`, [guestReference])
  return rows[0] || null
}

export async function startCadence(guestReference) {
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO smokecraft_cadence_sessions (guest_reference, status, started_at, updated_at)
     VALUES ($1,'in_progress',now(),now())
     ON CONFLICT (guest_reference) DO UPDATE SET status = 'in_progress', started_at = now(), stopped_at = NULL, puff_count = 0, ash_checks = 0, overheating_warnings = 0, updated_at = now()
     RETURNING *`,
    [guestReference]
  )
  return rows[0]
}

export async function recordCadenceEvent(guestReference, eventType) {
  const db = getDb()
  const column = { puff: 'puff_count', ash_check: 'ash_checks', overheating_warning: 'overheating_warnings' }[eventType]
  if (!column) throw new FlavorPairingError('invalid_event')
  const { rows } = await db.query(
    `UPDATE smokecraft_cadence_sessions SET ${column} = ${column} + 1, updated_at = now()
     WHERE guest_reference = $1 AND status = 'in_progress' RETURNING *`,
    [guestReference]
  )
  if (!rows[0]) throw new FlavorPairingError('session_not_active')
  return rows[0]
}

export async function stopCadence(guestReference) {
  const db = getDb()
  const { rows } = await db.query(
    `UPDATE smokecraft_cadence_sessions SET status = 'completed', stopped_at = now(), updated_at = now()
     WHERE guest_reference = $1 RETURNING *`,
    [guestReference]
  )
  if (!rows[0]) throw new FlavorPairingError('session_not_found')

  const result = await awardXp({
    guestReference, amount: 20, sourceType: 'session_completion', sourceId: 'smoking-technique-cadence',
    reason: 'Completed the Smoking Technique cadence exercise',
    awardRuleKey: 'smoking_technique_complete',
    idempotencyKey: `smoking-technique-complete:${guestReference}`,
  })
  return { session: rows[0], xpAwarded: !result.deduplicated }
}

// ── Personalized pairing recommendations (rule-based, explainable) ────
// Real, disclosed logic — no fabricated inventory, no claim of AI
// tasting anything. Reads only real saved data (flavor-stage
// observations); returns an honest not_enough_data state when none
// exists.
const FLAVOR_PAIRING_RULES = {
  cocoa:   { category: 'coffee', item: 'Dark roast espresso', strategy: 'complement', why: 'Cocoa and dark-roast coffee share deep, roasted, slightly bitter notes that reinforce each other.' },
  coffee:  { category: 'coffee', item: 'Medium roast coffee', strategy: 'complement', why: 'A direct flavor echo — matching roast intensity avoids either overpowering the other.' },
  spice:   { category: 'spirit', item: 'Aged rum', strategy: 'complement', why: 'Aged rum\'s own spice and caramel notes tend to reinforce a peppery, spicy cigar profile.' },
  pepper:  { category: 'spirit', item: 'Rye whiskey', strategy: 'contrast', why: 'Rye\'s own spice can either reinforce or compete with cigar pepper notes — a deliberate contrast worth tasting carefully.' },
  sweet:   { category: 'dessert', item: 'Dark chocolate', strategy: 'complement', why: 'Natural tobacco sweetness pairs directly with dessert sweetness rather than needing contrast.' },
  fruit:   { category: 'non_alcoholic', item: 'Black tea', strategy: 'contrast', why: 'Tea\'s tannins can contrast pleasantly against fruit-forward tobacco notes, cleansing the palate between puffs.' },
  wood:    { category: 'spirit', item: 'Bourbon', strategy: 'complement', why: 'Bourbon\'s own oak-aging character often echoes woody tobacco notes.' },
  earth:   { category: 'coffee', item: 'Dark roast espresso', strategy: 'complement', why: 'Earthy tobacco and dark roast coffee share a grounded, mineral depth.' },
  leather: { category: 'spirit', item: 'Aged rum', strategy: 'complement', why: 'Leather notes in tobacco often pair with the rich, aged character of dark spirits.' },
  citrus:  { category: 'non_alcoholic', item: 'Sparkling water with citrus', strategy: 'contrast', why: 'A bright, acidic contrast can reset the palate against a citrus-forward cigar.' },
}

export async function getRecommendations(guestReference) {
  const stages = await getFlavorStages(guestReference)
  const allNotes = stages.flatMap(s => Array.isArray(s.flavor_notes) ? s.flavor_notes : [])
  if (allNotes.length === 0) {
    return { state: 'not_enough_data', recommendations: [], dataUsed: { stagesRecorded: 0, flavorNotes: [] } }
  }

  const counts = {}
  for (const note of allNotes) counts[note] = (counts[note] || 0) + 1
  const rankedNotes = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([note]) => note)

  const recommendations = []
  const seenCategories = new Set()
  for (const note of rankedNotes) {
    const rule = FLAVOR_PAIRING_RULES[note]
    if (!rule || seenCategories.has(rule.category)) continue
    seenCategories.add(rule.category)
    recommendations.push({
      title: `${rule.item} (${rule.strategy})`,
      pairingCategory: rule.category,
      pairingItem: rule.item,
      strategy: rule.strategy,
      why: rule.why,
      complements: rule.strategy === 'complement' ? [note] : [],
      contrasts: rule.strategy === 'contrast' ? [note] : [],
      basedOnFlavorNote: note,
      confidence: counts[note] >= 2 ? 'moderate' : 'low',
      limitation: 'Based only on your own saved flavor notes across smoking stages — not a guaranteed match, and not informed by mentor or AI review.',
      source: 'rule_based',
      dataUsed: { flavorNote: note, timesObserved: counts[note], totalStagesRecorded: stages.length },
    })
    if (recommendations.length >= 3) break
  }

  if (recommendations.length === 0) {
    return { state: 'not_enough_data', recommendations: [], dataUsed: { stagesRecorded: stages.length, flavorNotes: rankedNotes } }
  }

  return { state: 'ready', recommendations, dataUsed: { stagesRecorded: stages.length, flavorNotes: rankedNotes } }
}
