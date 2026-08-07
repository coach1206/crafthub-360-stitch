/**
 * Package 1 — entry drafts, versioning, blend components, submission
 * (Steps 8/9). Once submitted+locked, the official version row is never
 * mutated — a new version can only be created before lock.
 */
import { getDb } from '../../db/connection.js'
import { logActivity } from './activityLogService.js'
import { transitionEntry } from './lifecycleService.js'
import { recordGoldenBoxEvent } from './goldenBoxEventService.js'
import { evaluateEligibility } from './eligibilityService.js'

export class EntryError extends Error {
  constructor(code) { super(code); this.code = code }
}

const UNIQUE_VIOLATION = '23505'
// Versions the submission-completeness rule (validateSubmission's
// requiredTypes list) — bump this if that rule ever changes, matching
// the versioned-rule pattern established across every other SmokeCraft
// scoring system in this operation.
const SUBMISSION_RULE_VERSION = 1

export async function createEntry(competitionId, identity, actorId) {
  if (!identity.guestReference) throw new EntryError('guest_reference_required')
  const db = getDb()
  const { rows: existing } = await db.query(
    `SELECT * FROM golden_box_entries WHERE competition_id = $1 AND guest_reference = $2`,
    [competitionId, identity.guestReference]
  )
  if (existing[0]) return existing[0]

  // UI Handoff Closure gate: eligibilityService.evaluateEligibility()
  // already existed as a real, rule-driven check (required_sessions,
  // min_xp, required_badge, etc.) — but it was only ever wired to a
  // separate, informational "check eligibility" endpoint the UI calls to
  // decide whether to SHOW the entry button. createEntry itself never
  // called it, so a direct API call could create a real competition
  // entry regardless of eligibility, bypassing the whole point of
  // configuring rules (e.g. "must complete Session 27 first"). Confirmed
  // live: a completely fresh guest (0 sessions) received HTTP 201.
  // Fixed by enforcing the same evaluation here, at the one place an
  // entry actually gets created — competitions with zero configured
  // rules remain eligible-by-design (unchanged, documented behavior;
  // this is what every existing fixture, including the fresh-player
  // suite's own competition, already relies on), so no passing test's
  // fixture needed to change.
  const eligibility = await evaluateEligibility(competitionId, identity)
  if (!eligibility.eligible) {
    const err = new EntryError('not_eligible')
    err.eligibility = eligibility
    throw err
  }

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
    await recordGoldenBoxEvent({
      guestReference: identity.guestReference, sourceScreen: 'GoldenBox', sourceRoute: '/smokecraft/golden-box',
      eventType: 'golden_box_draft_created', entryId: entry.entry_id, versionId: 1, ruleVersion: SUBMISSION_RULE_VERSION,
      idempotencyKey: `golden-box-draft-created-${entry.entry_id}`,
    })
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
 *
 * expectedVersion (optional but recommended): the version_number the
 * client last loaded/saved. If supplied and it no longer matches the
 * entry's real current_version (a real optimistic-concurrency
 * conflict — someone else, or another tab/device, saved a newer
 * version first), the write is rejected with `stale_version` rather
 * than silently overwriting the newer edit. Without it, saveDraft
 * behaves as before (last-write-wins) — existing callers are not
 * broken by this addition.
 *
 * idempotencyKey (optional but recommended): a rapid double-click
 * retry with the same key returns the already-created version instead
 * of creating a second, near-duplicate one.
 */
export async function saveDraft(entryId, { presentationPayload, pairingSelection, pairingDefense, predictedProfile, components, cigarName, expectedVersion, idempotencyKey }, actorId) {
  const db = getDb()
  const entry = await getEntry(entryId)
  if (!entry) throw new EntryError('entry_not_found')

  // Fast-path idempotency check (pre-lock): a true retry of an
  // already-succeeded save can return immediately without taking a
  // row lock at all. The authoritative check happens again below,
  // inside the lock, to close the real race a pre-lock-only check
  // would still allow: two concurrent first-time saves for the same
  // edit could otherwise both pass this check (neither found existing
  // yet) and both attempt to proceed.
  if (idempotencyKey) {
    const { rows: existing } = await db.query(
      `SELECT * FROM golden_box_entry_versions WHERE idempotency_key = $1`, [idempotencyKey]
    )
    if (existing[0]) return existing[0]
  }

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    // Row-locked read of the real current entry state — closes the
    // two-tab/rapid-double-click race the pre-lock checks above could
    // not: two concurrent saveDraft calls for the same entry now
    // genuinely serialize here, so the second one always sees the
    // FIRST one's committed current_version, not a stale snapshot.
    const { rows: lockedRows } = await client.query(`SELECT * FROM golden_box_entries WHERE entry_id = $1 FOR UPDATE`, [entryId])
    const lockedEntry = lockedRows[0]
    if (!lockedEntry) throw new EntryError('entry_not_found')
    if (['locked', 'submitted', 'under_review', 'finalist', 'winner', 'not_selected', 'disqualified'].includes(lockedEntry.status)) {
      throw new EntryError('entry_locked_cannot_edit')
    }
    if (idempotencyKey) {
      const { rows: existingLocked } = await client.query(`SELECT * FROM golden_box_entry_versions WHERE idempotency_key = $1`, [idempotencyKey])
      if (existingLocked[0]) { await client.query('ROLLBACK'); return existingLocked[0] }
    }
    if (typeof expectedVersion === 'number' && expectedVersion !== lockedEntry.current_version) {
      await client.query('ROLLBACK')
      const err = new EntryError('stale_version')
      err.currentVersion = lockedEntry.current_version
      throw err
    }

    const nextVersion = lockedEntry.current_version + 1
    let versionRows
    try {
      ;({ rows: versionRows } = await client.query(
        `INSERT INTO golden_box_entry_versions
           (entry_id, version_number, presentation_payload, pairing_selection, pairing_defense, predicted_profile, created_by, idempotency_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [entryId, nextVersion, JSON.stringify(presentationPayload || {}), pairingSelection ? JSON.stringify(pairingSelection) : null,
         pairingDefense || null, predictedProfile ? JSON.stringify(predictedProfile) : null, actorId, idempotencyKey || null]
      ))
    } catch (err) {
      if (err.code === UNIQUE_VIOLATION && idempotencyKey) {
        await client.query('ROLLBACK')
        const { rows: dup } = await db.query(`SELECT * FROM golden_box_entry_versions WHERE idempotency_key = $1`, [idempotencyKey])
        return dup[0]
      }
      throw err
    }
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
    await recordGoldenBoxEvent({
      guestReference: entry.guest_reference, sourceScreen: 'GoldenBox', sourceRoute: '/smokecraft/golden-box',
      eventType: 'golden_box_draft_updated', entryId, versionId: version.id, ruleVersion: SUBMISSION_RULE_VERSION,
      idempotencyKey: idempotencyKey ? `golden-box-draft-updated-canonical-${idempotencyKey}` : `golden-box-draft-updated-canonical-${entryId}-${nextVersion}`,
    })
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

export async function submitEntry(entryId, actorId, competition, idempotencyKey) {
  const db = getDb()
  const entry = await getEntry(entryId)
  if (!entry) throw new EntryError('entry_not_found')

  if (idempotencyKey) {
    const { rows: dup } = await db.query(`SELECT * FROM golden_box_submissions WHERE idempotency_key = $1`, [idempotencyKey])
    if (dup[0]) return dup[0]
  }
  if (entry.status === 'submitted' || entry.status === 'locked') {
    // Real duplicate — the entry-level UNIQUE(entry_id) guard would
    // also catch this, but returning the existing record here avoids
    // an unnecessary 500 in the common (non-race) repeat-click case.
    const { rows: existing } = await db.query(`SELECT * FROM golden_box_submissions WHERE entry_id = $1`, [entryId])
    if (existing[0]) return existing[0]
    throw new EntryError('duplicate_submission')
  }
  if (competition.submission_closes_at && new Date() > new Date(competition.submission_closes_at)) {
    throw new EntryError('submission_closed')
  }
  const version = await getCurrentVersion(entryId)
  const components = await getBlendComponents(version.id)
  const errors = validateSubmission(version, components)

  await recordGoldenBoxEvent({
    guestReference: entry.guest_reference, sourceScreen: 'GoldenBox', sourceRoute: '/smokecraft/golden-box',
    eventType: 'golden_box_submission_requested', entryId, versionId: version.id, ruleVersion: SUBMISSION_RULE_VERSION,
    result: { errors },
    idempotencyKey: idempotencyKey ? `golden-box-submission-requested-canonical-${idempotencyKey}` : `golden-box-submission-requested-canonical-${entryId}-${version.id}`,
  })

  let rows
  try {
    ;({ rows } = await db.query(
      `INSERT INTO golden_box_submissions (entry_id, entry_version_id, validation_passed, validation_errors, idempotency_key)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [entryId, version.id, errors.length === 0, errors.length ? JSON.stringify(errors) : null, idempotencyKey || null]
    ))
  } catch (err) {
    if (err.code === UNIQUE_VIOLATION) {
      // Two-tab / rapid-double-click race — a concurrent request won,
      // the real database UNIQUE(entry_id) constraint caught this one.
      // Return the winner's real submission, never a fabricated one.
      const { rows: winner } = await db.query(`SELECT * FROM golden_box_submissions WHERE entry_id = $1`, [entryId])
      return winner[0]
    }
    throw err
  }
  if (errors.length > 0) throw new EntryError(`validation_failed:${errors.join(',')}`)

  await transitionEntry(entryId, 'submitted', actorId, { submitted_at: new Date() })
  await logActivity({ entryId, competitionId: entry.competition_id, actorId, action: 'entry_submitted' })
  await recordGoldenBoxEvent({
    guestReference: entry.guest_reference, sourceScreen: 'GoldenBox', sourceRoute: '/smokecraft/golden-box',
    eventType: 'golden_box_submitted', entryId, versionId: version.id, ruleVersion: SUBMISSION_RULE_VERSION,
    result: { validationPassed: true },
    idempotencyKey: idempotencyKey ? `golden-box-submitted-canonical-${idempotencyKey}` : `golden-box-submitted-canonical-${entryId}`,
  })
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
