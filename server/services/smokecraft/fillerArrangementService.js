/**
 * Filler Arrangement standalone lesson backend — same real pattern as
 * seedSoilService.js (migration 080): user-scoped notes, per-zone
 * progress, quiz attempts (idempotent — one XP award per question per
 * guest), and a lesson-completion record (idempotent — one XP award per
 * guest, ever). Migration 085.
 */
import { getDb } from '../../db/connection.js'
import { awardXp } from '../goldenBox/xpService.js'
import { recordEvent } from './progressionEventService.js'

export class FillerArrangementError extends Error {
  constructor(code) { super(code); this.code = code }
}

const VALID_ZONES = new Set([
  'ligero', 'viso', 'seco', 'volado', 'airflow', 'density',
  'strength', 'flavor', 'combustion', 'draw', 'faults',
])

export async function getNote(guestReference) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT note_text, updated_at FROM smokecraft_filler_arrangement_notes WHERE guest_reference = $1`,
    [guestReference]
  )
  return rows[0] || null
}

export async function saveNote(guestReference, noteText) {
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO smokecraft_filler_arrangement_notes (guest_reference, note_text)
     VALUES ($1,$2)
     ON CONFLICT (guest_reference) DO UPDATE SET note_text = $2, updated_at = now()
     RETURNING *`,
    [guestReference, noteText]
  )
  return rows[0]
}

export async function recordZoneViewed(guestReference, zoneKey) {
  if (!VALID_ZONES.has(zoneKey)) throw new FillerArrangementError(`invalid_zone:${zoneKey}`)
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO smokecraft_filler_arrangement_progress (guest_reference, zone_key)
     VALUES ($1,$2) ON CONFLICT (guest_reference, zone_key) DO UPDATE SET viewed_at = now()
     RETURNING *`,
    [guestReference, zoneKey]
  )
  return rows[0]
}

export async function getProgress(guestReference) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT zone_key, viewed_at FROM smokecraft_filler_arrangement_progress WHERE guest_reference = $1`,
    [guestReference]
  )
  return rows
}

export async function submitQuizAnswer(guestReference, questionKey, isCorrect) {
  const db = getDb()
  const { rows: existing } = await db.query(
    `SELECT * FROM smokecraft_filler_arrangement_quiz_attempts WHERE guest_reference = $1 AND question_key = $2`,
    [guestReference, questionKey]
  )
  if (existing[0]) return { attempt: existing[0], xpAwarded: false, alreadyAttempted: true }

  const { rows } = await db.query(
    `INSERT INTO smokecraft_filler_arrangement_quiz_attempts (guest_reference, question_key, is_correct)
     VALUES ($1,$2,$3) RETURNING *`,
    [guestReference, questionKey, isCorrect]
  )
  let xpAwarded = false
  if (isCorrect) {
    await awardXp({
      guestReference, amount: 15, sourceType: 'quiz', sourceId: questionKey,
      reason: 'Filler Arrangement knowledge check answered correctly',
      awardRuleKey: 'filler_arrangement_quiz_correct',
      idempotencyKey: `filler-arrangement-quiz-${guestReference}-${questionKey}`,
    })
    await db.query(`UPDATE smokecraft_filler_arrangement_quiz_attempts SET xp_awarded = true WHERE id = $1`, [rows[0].id])
    xpAwarded = true
  }
  await recordEvent({
    guestReference, sourceScreen: 'FillerArrangement', sourceRoute: '/smokecraft/filler-arrangement',
    eventType: isCorrect ? 'knowledge_check_passed' : 'knowledge_check_submitted',
    payload: { questionKey, isCorrect },
    idempotencyKey: `filler-arrangement-kc-event-${guestReference}-${questionKey}`,
  })
  return { attempt: rows[0], xpAwarded, alreadyAttempted: false }
}

export async function completeLesson(guestReference) {
  const db = getDb()
  const { rows: existing } = await db.query(
    `SELECT * FROM smokecraft_filler_arrangement_completion WHERE guest_reference = $1`,
    [guestReference]
  )
  if (existing[0]) return { completion: existing[0], xpAwarded: false, alreadyCompleted: true }

  const { rows } = await db.query(
    `INSERT INTO smokecraft_filler_arrangement_completion (guest_reference) VALUES ($1) RETURNING *`,
    [guestReference]
  )
  await awardXp({
    guestReference, amount: 10, sourceType: 'session_completion', sourceId: 'filler-arrangement',
    reason: 'Filler Arrangement standalone lesson completed',
    awardRuleKey: 'filler_arrangement_lesson_complete',
    idempotencyKey: `filler-arrangement-lesson-complete-${guestReference}`,
  })
  await db.query(`UPDATE smokecraft_filler_arrangement_completion SET xp_awarded = true WHERE id = $1`, [rows[0].id])
  await recordEvent({
    guestReference, sourceScreen: 'FillerArrangement', sourceRoute: '/smokecraft/filler-arrangement',
    eventType: 'lesson_completed', payload: {},
    idempotencyKey: `filler-arrangement-lesson-complete-event-${guestReference}`,
  })
  return { completion: rows[0], xpAwarded: true, alreadyCompleted: false }
}
