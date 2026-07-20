/**
 * Package 1 — entry drafts, versioning, blend components, submission
 * (Steps 8/9). Once submitted+locked, the official version row is never
 * mutated — a new version can only be created before lock.
 */
import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'
import { transitionEntry } from './lifecycleService.js'

export class EntryError extends Error {
  constructor(code) { super(code); this.code = code }
}

export async function createEntry(competitionId, identity, actorId) {
  if (!identity.guestReference) throw new EntryError('guest_reference_required')
  const db = getDb()
  const { rows: existing } = await db.query(
    `SELECT * FROM golden_box_entries WHERE competition_id = $1 AND guest_reference = $2`,
    [competitionId, identity.guestReference]
  )
  if (existing[0]) return existing[0]

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows } = await client.query(
      `INSERT INTO golden_box_entries (competition_id, user_id, guest_reference)
       VALUES ($1,$2,$3) RETURNING *`,
      [competitionId, identity.userId || null, identity.guestReference]
    )
    const entry = rows[0]
    await client.query(
      `INSERT INTO golden_box_entry_versions (entry_id, version_number, created_by) VALUES ($1, 1, $2)`,
      [entry.entry_id, actorId]
    )
    await client.query('COMMIT')
    await logActivity({ entryId: entry.entry_id, competitionId, actorId, action: 'entry_created' })
    return entry
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function getEntry(entryId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM golden_box_entries WHERE entry_id = $1`, [entryId])
  return rows[0] || null
}

export async function getCurrentVersion(entryId) {
  const db = getDb()
  const entry = await getEntry(entryId)
  if (!entry) return null
  const { rows } = await db.query(
    `SELECT * FROM golden_box_entry_versions WHERE entry_id = $1 AND version_number = $2`,
    [entryId, entry.current_version]
  )
  return rows[0] || null
}

/**
 * Saves a draft edit. Before lock: creates a NEW version row (never
 * mutates a prior one) and advances entries.current_version. After
 * lock/submission: rejected outright — "must not silently mutate."
 */
export async function saveDraft(entryId, { presentationPayload, pairingSelection, pairingDefense, predictedProfile, components, cigarName }, actorId) {
  const db = getDb()
  const entry = await getEntry(entryId)
  if (!entry) throw new EntryError('entry_not_found')
  if (['locked', 'submitted', 'under_review', 'finalist', 'winner', 'not_selected', 'disqualified'].includes(entry.status)) {
    throw new EntryError('entry_locked_cannot_edit')
  }
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const nextVersion = entry.current_version + 1
    const { rows: versionRows } = await client.query(
      `INSERT INTO golden_box_entry_versions
         (entry_id, version_number, presentation_payload, pairing_selection, pairing_defense, predicted_profile, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [entryId, nextVersion, JSON.stringify(presentationPayload || {}), pairingSelection ? JSON.stringify(pairingSelection) : null,
       pairingDefense || null, predictedProfile ? JSON.stringify(predictedProfile) : null, actorId]
    )
    const version = versionRows[0]
    for (const [i, c] of (components || []).entries()) {
      await client.query(
        `INSERT INTO golden_box_blend_components (entry_version_id, component_type, component_key, component_value, display_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [version.id, c.componentType, c.componentKey, JSON.stringify(c.componentValue || {}), i]
      )
    }
    await client.query(
      `UPDATE golden_box_entries SET current_version = $2, cigar_name = COALESCE($3, cigar_name), updated_at = now() WHERE entry_id = $1`,
      [entryId, nextVersion, cigarName || null]
    )
    await client.query('COMMIT')
    await logActivity({ entryId, competitionId: entry.competition_id, actorId, action: 'draft_saved', metadata: { version: nextVersion } })
    return version
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function getBlendComponents(entryVersionId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM golden_box_blend_components WHERE entry_version_id = $1 ORDER BY display_order`,
    [entryVersionId]
  )
  return rows
}

function validateSubmission(version, components) {
  const errors = []
  if (!version.presentation_payload || Object.keys(version.presentation_payload).length === 0) {
    errors.push('presentation_missing')
  }
  const requiredTypes = ['wrapper', 'binder', 'filler', 'vitola']
  const present = new Set(components.map(c => c.component_type))
  for (const t of requiredTypes) if (!present.has(t)) errors.push(`missing_component:${t}`)
  return errors
}

export async function submitEntry(entryId, actorId, competition) {
  const db = getDb()
  const entry = await getEntry(entryId)
  if (!entry) throw new EntryError('entry_not_found')
  if (entry.status === 'submitted' || entry.status === 'locked') throw new EntryError('duplicate_submission')
  if (competition.submission_closes_at && new Date() > new Date(competition.submission_closes_at)) {
    throw new EntryError('submission_closed')
  }
  const version = await getCurrentVersion(entryId)
  const components = await getBlendComponents(version.id)
  const errors = validateSubmission(version, components)

  const { rows } = await db.query(
    `INSERT INTO golden_box_submissions (entry_id, entry_version_id, validation_passed, validation_errors)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [entryId, version.id, errors.length === 0, errors.length ? JSON.stringify(errors) : null]
  )
  if (errors.length > 0) throw new EntryError(`validation_failed:${errors.join(',')}`)

  await transitionEntry(entryId, 'submitted', actorId, { submitted_at: new Date() })
  await logActivity({ entryId, competitionId: entry.competition_id, actorId, action: 'entry_submitted' })
  return rows[0]
}

export async function lockEntry(entryId, actorId) {
  await transitionEntry(entryId, 'locked', actorId, { locked_at: new Date() })
  await logActivity({ entryId, actorId, action: 'entry_locked' })
}

export async function withdrawEntry(entryId, actorId) {
  const entry = await getEntry(entryId)
  if (!entry) throw new EntryError('entry_not_found')
  if (['locked', 'winner', 'not_selected', 'disqualified'].includes(entry.status)) {
    throw new EntryError('withdrawal_not_allowed_in_current_status')
  }
  await transitionEntry(entryId, 'withdrawn', actorId)
  await logActivity({ entryId, actorId, action: 'entry_withdrawn' })
}
