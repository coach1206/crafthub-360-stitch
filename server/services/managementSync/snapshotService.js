/**
 * SmokeCraft Management Sync — versioned snapshot service.
 * Server controls payload_hash, snapshot_version, created_at — never
 * accepted from the client (enforced additionally at the validation layer).
 */
import crypto from 'crypto'
import { getDb } from '../../db/connection.js'

function canonicalize(obj) {
  // Stable key order so the same logical content always hashes the same,
  // regardless of client field ordering.
  return JSON.stringify(obj, Object.keys(obj || {}).sort())
}

export async function createSnapshot(journeyId, payload) {
  const db = getDb()
  if (!db) throw Object.assign(new Error('database_unavailable'), { code: 'database_unavailable' })

  const {
    cigarSelection = null, pairingSelection = null, flavorNotes = null,
    mentorSelections = null, scorecard = null, rating = null,
    preferences = null, feedbackText = null, returnIntent = null,
    connectionsSaved = 0, completionState, passportState = null,
    staffHandoffRequested = false,
  } = payload

  const hashInput = canonicalize({
    cigarSelection, pairingSelection, flavorNotes, mentorSelections,
    scorecard, rating, preferences, feedbackText, returnIntent,
    connectionsSaved, completionState, passportState, staffHandoffRequested,
  })
  const payloadHash = crypto.createHash('sha256').update(hashInput).digest('hex')

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    // Lock the parent journey row (not an aggregate query — Postgres
    // rejects FOR UPDATE combined with MAX()) so concurrent snapshot
    // creation for the same journey serializes on this lock.
    const journeyLock = await client.query(
      `SELECT journey_id FROM smokecraft_management_sync_journeys WHERE journey_id = $1 FOR UPDATE`,
      [journeyId]
    )
    if (journeyLock.rows.length === 0) {
      await client.query('ROLLBACK')
      return { ok: false, error: 'journey_not_found' }
    }

    // Duplicate-content short-circuit: if an identical payload was
    // already stored for this journey, return the existing snapshot
    // rather than erroring — a client resubmitting unchanged state is a
    // legitimate no-op, not a failure.
    const existingByHash = await client.query(
      `SELECT * FROM smokecraft_management_sync_snapshots WHERE journey_id = $1 AND payload_hash = $2`,
      [journeyId, payloadHash]
    )
    if (existingByHash.rows.length > 0) {
      await client.query('ROLLBACK')
      return { ok: true, snapshot: existingByHash.rows[0], duplicate: true }
    }

    const versionResult = await client.query(
      `SELECT COALESCE(MAX(snapshot_version), 0) + 1 AS next_version
         FROM smokecraft_management_sync_snapshots WHERE journey_id = $1`,
      [journeyId]
    )
    const nextVersion = versionResult.rows[0].next_version

    const inserted = await client.query(
      `INSERT INTO smokecraft_management_sync_snapshots
         (journey_id, snapshot_version, cigar_selection, pairing_selection, flavor_notes,
          mentor_selections, scorecard, rating, preferences, feedback_text, return_intent,
          connections_saved, completion_state, passport_state, staff_handoff_requested, payload_hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        journeyId, nextVersion,
        cigarSelection ? JSON.stringify(cigarSelection) : null,
        pairingSelection ? JSON.stringify(pairingSelection) : null,
        flavorNotes ? JSON.stringify(flavorNotes) : null,
        mentorSelections ? JSON.stringify(mentorSelections) : null,
        scorecard ? JSON.stringify(scorecard) : null,
        rating, preferences ? JSON.stringify(preferences) : null,
        feedbackText, returnIntent, connectionsSaved,
        completionState, passportState ? JSON.stringify(passportState) : null,
        staffHandoffRequested, payloadHash,
      ]
    )
    await client.query('COMMIT')
    return { ok: true, snapshot: inserted.rows[0], duplicate: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

export async function getLatestSnapshot(journeyId) {
  const db = getDb()
  if (!db) return null
  const result = await db.query(
    `SELECT * FROM smokecraft_management_sync_snapshots
      WHERE journey_id = $1 ORDER BY snapshot_version DESC LIMIT 1`,
    [journeyId]
  )
  return result.rows[0] || null
}
