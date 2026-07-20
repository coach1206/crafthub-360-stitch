/**
 * Package 3 — SmokeCraft educational content service. Reads/writes
 * golden_box_component_catalog (extended, migration 079) and its
 * supporting tables. Public/learner reads expose only `visibility =
 * 'published'` rows — draft content never leaks (Step 15).
 */
import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'

export class ContentError extends Error {
  constructor(code) { super(code); this.code = code }
}

const PUBLIC_COLUMNS = `
  id, component_type, component_key, display_name, description, category, subcategory,
  origin, why_it_matters, quality_impact, flavor_impact, strength_impact, aroma_impact,
  burn_impact, construction_impact, performance_impact, decision_guidance, compatibility_notes,
  common_mistakes, mentor_guidance, related_session_id, media_asset_key, future_github_asset_path,
  alt_text, selectable_in_blend, source_status, version
`

export async function listComponents({ category, selectableOnly } = {}) {
  const db = getDb()
  const clauses = [`visibility = 'published'`]
  const values = []
  if (category) { values.push(category); clauses.push(`component_type = $${values.length}`) }
  if (selectableOnly) clauses.push(`selectable_in_blend = true`)
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM golden_box_component_catalog WHERE ${clauses.join(' AND ')} ORDER BY component_type, display_name`,
    values
  )
  return rows
}

export async function getComponent(id) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM golden_box_component_catalog WHERE id = $1 AND visibility = 'published'`,
    [id]
  )
  return rows[0] || null
}

export async function getComponentByKey(componentType, componentKey) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM golden_box_component_catalog WHERE component_type = $1 AND component_key = $2 AND visibility = 'published'`,
    [componentType, componentKey]
  )
  return rows[0] || null
}

export async function listFlavorNotes({ group } = {}) {
  const db = getDb()
  const clauses = [`visibility = 'published'`]
  const values = []
  if (group) { values.push(group); clauses.push(`flavor_group = $${values.length}`) }
  const { rows } = await db.query(
    `SELECT id, slug, name, flavor_group, parent_id, definition, common_descriptors,
            typical_tobacco_associations, strength_perception, aroma_relationship,
            compatibility_notes, pairing_considerations, common_learner_confusion,
            media_asset_key, future_github_asset_path
     FROM smokecraft_flavor_notes WHERE ${clauses.join(' AND ')} ORDER BY flavor_group`,
    values
  )
  return rows
}

export async function getCompatibility(componentId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT c.*, s.display_name AS source_name, t.display_name AS target_name
     FROM smokecraft_component_compatibility c
     JOIN golden_box_component_catalog s ON s.id = c.source_component_id
     JOIN golden_box_component_catalog t ON t.id = c.target_component_id
     WHERE c.source_component_id = $1 OR c.target_component_id = $1`,
    [componentId]
  )
  return rows
}

export async function listQuizForComponent(componentId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT id, question, answer_choices, difficulty, xp_award_rule_key, attempt_rules
     FROM smokecraft_quiz_questions WHERE related_component_id = $1 AND review_status = 'reviewed'`,
    [componentId]
  )
  return rows // correct_answer/explanation intentionally excluded from the public read
}

// ── Admin (authorized) writes ────────────────────────────────────────
export async function createDraftComponent(fields, actorId) {
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO golden_box_component_catalog
       (component_type, component_key, display_name, description, category, why_it_matters,
        quality_impact, flavor_impact, selectable_in_blend, visibility, review_status, created_by)
     VALUES ($1,$2,$3,$4,$1,$5,$6,$7,$8,'draft','draft',$9) RETURNING *`,
    [fields.componentType, fields.componentKey, fields.displayName, fields.description || null,
     fields.whyItMatters || null, fields.qualityImpact || null, fields.flavorImpact || null,
     fields.selectableInBlend !== false, actorId]
  )
  await logActivity({ actorId, action: 'content_draft_created', metadata: { componentType: fields.componentType, componentKey: fields.componentKey } })
  return rows[0]
}

export async function updateDraftComponent(id, fields, actorId) {
  const db = getDb()
  const { rows: current } = await db.query(`SELECT * FROM golden_box_component_catalog WHERE id = $1`, [id])
  if (!current[0]) throw new ContentError('component_not_found')
  if (current[0].visibility === 'published') throw new ContentError('cannot_edit_published_directly_use_new_version')

  const allowed = ['display_name', 'description', 'why_it_matters', 'quality_impact', 'flavor_impact',
    'strength_impact', 'aroma_impact', 'burn_impact', 'construction_impact', 'performance_impact',
    'decision_guidance', 'compatibility_notes', 'common_mistakes', 'mentor_guidance']
  const updates = {}
  for (const key of allowed) {
    const camel = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    if (fields[camel] !== undefined) updates[key] = fields[camel]
  }
  if (Object.keys(updates).length === 0) throw new ContentError('no_fields_provided')

  const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 2}`).join(', ')
  const { rows } = await db.query(
    `UPDATE golden_box_component_catalog SET ${setClauses}, version = version + 1, updated_at = now()
     WHERE id = $1 RETURNING *`,
    [id, ...Object.values(updates)]
  )
  await db.query(
    `INSERT INTO smokecraft_content_versions (component_id, version_number, payload, edited_by) VALUES ($1,$2,$3,$4)`,
    [id, rows[0].version, JSON.stringify(rows[0]), actorId]
  )
  await logActivity({ actorId, action: 'content_draft_updated', metadata: { id } })
  return rows[0]
}

export async function publishComponent(id, actorId) {
  const db = getDb()
  const { rows } = await db.query(
    `UPDATE golden_box_component_catalog SET visibility = 'published', review_status = 'reviewed', updated_at = now()
     WHERE id = $1 AND visibility != 'published' RETURNING *`,
    [id]
  )
  if (!rows[0]) throw new ContentError('publish_failed_already_published_or_not_found')
  await logActivity({ actorId, action: 'content_published', metadata: { id } })
  return rows[0]
}

export async function archiveComponent(id, actorId) {
  const db = getDb()
  const { rows } = await db.query(
    `UPDATE golden_box_component_catalog SET visibility = 'archived', updated_at = now() WHERE id = $1 RETURNING *`,
    [id]
  )
  if (!rows[0]) throw new ContentError('component_not_found')
  await logActivity({ actorId, action: 'content_archived', metadata: { id } })
  return rows[0]
}
