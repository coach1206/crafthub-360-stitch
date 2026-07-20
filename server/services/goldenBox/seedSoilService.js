/**
 * Package 4 — Seed and Soil live educational journey backend. Reuses the
 * Package 3 catalog (seed_genetics/soil/terroir/plant_anatomy/country/
 * region rows) and quiz tables; adds only user-scoped notes, progress,
 * and quiz-attempt tracking (migration 080).
 */
import { getDb } from '../../db/connection.js'
import { awardXp } from './xpService.js'

export class SeedSoilError extends Error {
  constructor(code) { super(code); this.code = code }
}

export async function getNotes(guestReference) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT id, component_id, note_text, created_at, updated_at
     FROM smokecraft_seed_soil_notes WHERE guest_reference = $1 ORDER BY updated_at DESC`,
    [guestReference]
  )
  return rows
}

export async function saveNote(guestReference, { componentId, noteText, noteId }) {
  const db = getDb()
  if (noteId) {
    const { rows } = await db.query(
      `UPDATE smokecraft_seed_soil_notes SET note_text = $1, updated_at = now()
       WHERE id = $2 AND guest_reference = $3 RETURNING *`,
      [noteText, noteId, guestReference]
    )
    if (!rows[0]) throw new SeedSoilError('note_not_found')
    return rows[0]
  }
  const { rows } = await db.query(
    `INSERT INTO smokecraft_seed_soil_notes (guest_reference, component_id, note_text)
     VALUES ($1,$2,$3) RETURNING *`,
    [guestReference, componentId || null, noteText]
  )
  return rows[0]
}

export async function recordProgress(guestReference, componentId) {
  const db = getDb()
  const { rows } = await db.query(
    `INSERT INTO smokecraft_seed_soil_progress (guest_reference, component_id)
     VALUES ($1,$2) ON CONFLICT (guest_reference, component_id) DO UPDATE SET viewed_at = now()
     RETURNING *`,
    [guestReference, componentId]
  )
  return rows[0]
}

export async function getProgress(guestReference) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT component_id, viewed_at FROM smokecraft_seed_soil_progress WHERE guest_reference = $1`,
    [guestReference]
  )
  return rows
}

export async function submitQuizAnswer(guestReference, questionId, selectedAnswer) {
  const db = getDb()
  const { rows: qRows } = await db.query(
    `SELECT id, correct_answer, explanation, xp_award_rule_key FROM smokecraft_quiz_questions WHERE id = $1`,
    [questionId]
  )
  const question = qRows[0]
  if (!question) throw new SeedSoilError('question_not_found')
  const isCorrect = String(question.correct_answer) === String(selectedAnswer)

  const { rows: existing } = await db.query(
    `SELECT * FROM smokecraft_seed_soil_quiz_attempts WHERE guest_reference = $1 AND question_id = $2`,
    [guestReference, questionId]
  )

  let xpAwarded = existing[0]?.xp_awarded || false
  if (isCorrect && !existing[0]) {
    await db.query(
      `INSERT INTO smokecraft_seed_soil_quiz_attempts (guest_reference, question_id, is_correct, xp_awarded)
       VALUES ($1,$2,true,true)`,
      [guestReference, questionId]
    )
    await awardXp({
      guestReference,
      amount: 15,
      sourceType: 'quiz',
      sourceId: String(questionId),
      reason: 'Seed and Soil knowledge check answered correctly',
      awardRuleKey: 'seed_soil_quiz_correct',
      idempotencyKey: `seed-soil-quiz:${guestReference}:${questionId}`,
    })
    xpAwarded = true
  } else if (!existing[0]) {
    await db.query(
      `INSERT INTO smokecraft_seed_soil_quiz_attempts (guest_reference, question_id, is_correct, xp_awarded)
       VALUES ($1,$2,$3,false)`,
      [guestReference, questionId, isCorrect]
    )
  }

  return { isCorrect, explanation: question.explanation, xpAwarded, alreadyAttempted: !!existing[0] }
}
