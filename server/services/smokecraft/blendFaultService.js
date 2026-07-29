/**
 * Blend Fault Identification Backend Scoring (migration 089). Real
 * server-authoritative scoring — the answer key never leaves this file
 * before submission. Reuses smokecraft_progression_events (the same
 * shared event log every prior pass writes to) and awardXp() (never a
 * second XP path).
 */
import { getDb } from '../../db/connection.js'
import { recordEvent } from './progressionEventService.js'
import { recordChallengeEvent } from './challengeEventService.js'

const CHALLENGE_ID = 'blend-fault-identification'

export class BlendFaultError extends Error {
  constructor(code) { super(code); this.code = code }
}

const ASSESSMENT_KEY = 'blend-fault-identification'
const ASSESSMENT_VERSION = 1
const PASS_THRESHOLD_PERCENT = 67 // 2 of 3 correct — disclosed, no prior threshold existed.
const POINTS_PER_QUESTION = 1

export async function getActiveQuestions() {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT question_key, prompt, scenario_description, fault_category, asset_reference, answer_options, display_order
     FROM smokecraft_blend_fault_questions WHERE active = true AND version = $1 ORDER BY display_order`,
    [ASSESSMENT_VERSION]
  )
  return rows
}

async function getActiveAttempt(db, guestReference) {
  const { rows } = await db.query(
    `SELECT * FROM smokecraft_blend_fault_attempts
     WHERE guest_reference = $1 AND assessment_key = $2 AND status = 'in_progress'
     ORDER BY attempt_number DESC LIMIT 1`,
    [guestReference, ASSESSMENT_KEY]
  )
  return rows[0] || null
}

async function getAttempts(db, guestReference) {
  const { rows } = await db.query(
    `SELECT * FROM smokecraft_blend_fault_attempts WHERE guest_reference = $1 AND assessment_key = $2 ORDER BY attempt_number DESC`,
    [guestReference, ASSESSMENT_KEY]
  )
  return rows
}

export async function getAssessment(guestReference) {
  const db = getDb()
  const questions = await getActiveQuestions()
  const attempts = await getAttempts(db, guestReference)
  const activeAttempt = attempts.find(a => a.status === 'in_progress') || null
  // Most recent attempt regardless of status — lets the frontend
  // re-display a scored result after a refresh instead of losing it.
  const mostRecentAttempt = attempts[0] || null
  const hasPassed = attempts.some(a => a.status === 'passed')

  return {
    assessmentKey: ASSESSMENT_KEY,
    title: 'Blend Fault Identification',
    educationalPurpose: 'A trained eye catches construction faults before they reach the humidor.',
    questionCount: questions.length,
    questions: questions.map(q => ({
      questionKey: q.question_key, prompt: q.prompt, scenarioDescription: q.scenario_description,
      faultCategory: q.fault_category, assetReference: q.asset_reference, answerOptions: q.answer_options,
      displayOrder: q.display_order,
    })),
    passThresholdPercent: PASS_THRESHOLD_PERCENT,
    scoringRules: { pointsPerQuestion: POINTS_PER_QUESTION, totalPossible: questions.length * POINTS_PER_QUESTION },
    activeAttempt: activeAttempt ? serializeAttempt(activeAttempt) : null,
    mostRecentAttempt: mostRecentAttempt ? serializeAttempt(mostRecentAttempt) : null,
    retryEligible: !activeAttempt,
    hasPassed,
    attemptCount: attempts.length,
  }
}

function serializeAttempt(a) {
  return {
    attemptId: a.attempt_id, attemptNumber: a.attempt_number, assessmentVersion: a.assessment_version,
    status: a.status, startedAt: a.started_at, submittedAt: a.submitted_at,
    scoreEarned: a.score_earned, scorePossible: a.score_possible, percentage: a.percentage ? Number(a.percentage) : null,
    passFail: a.pass_fail,
  }
}

// Idempotent — a repeated start call while an attempt is already
// in_progress returns that same attempt rather than creating a new one.
export async function startAttempt(guestReference) {
  const db = getDb()
  const existing = await getActiveAttempt(db, guestReference)
  if (existing) return { attempt: existing, created: false }

  const { rows: numRows } = await db.query(
    `SELECT COALESCE(MAX(attempt_number), 0) + 1 AS next FROM smokecraft_blend_fault_attempts WHERE guest_reference = $1 AND assessment_key = $2`,
    [guestReference, ASSESSMENT_KEY]
  )
  const attemptNumber = numRows[0].next
  const idempotencyKey = `blend-fault-attempt-start-${guestReference}-${attemptNumber}`

  const { rows } = await db.query(
    `INSERT INTO smokecraft_blend_fault_attempts
       (guest_reference, assessment_key, attempt_number, assessment_version, status, idempotency_key)
     VALUES ($1,$2,$3,$4,'in_progress',$5)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING *`,
    [guestReference, ASSESSMENT_KEY, attemptNumber, ASSESSMENT_VERSION, idempotencyKey]
  )
  const attempt = rows[0] || (await db.query(`SELECT * FROM smokecraft_blend_fault_attempts WHERE idempotency_key = $1`, [idempotencyKey])).rows[0]

  await recordEvent({
    guestReference, sourceScreen: 'BlendFaultChallenge', sourceRoute: '/smokecraft/challenges/blend-fault-identification',
    eventType: 'blend_fault_attempt_started',
    payload: { assessmentKey: ASSESSMENT_KEY, attemptId: attempt.attempt_id, attemptNumber },
    idempotencyKey: `blend-fault-attempt-started-event-${attempt.attempt_id}`,
  })
  await recordChallengeEvent({
    guestReference, sourceScreen: 'BlendFaultChallenge', sourceRoute: '/smokecraft/challenges/blend-fault-identification',
    eventType: 'challenge_started', challengeId: CHALLENGE_ID, attemptId: attempt.attempt_id,
    ruleId: ASSESSMENT_KEY, ruleVersion: ASSESSMENT_VERSION,
    idempotencyKey: `challenge-started-canonical-${attempt.attempt_id}`,
  })

  return { attempt, created: true }
}

export async function getAttempt(guestReference, attemptId) {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM smokecraft_blend_fault_attempts WHERE attempt_id = $1`, [attemptId])
  const attempt = rows[0]
  if (!attempt) throw new BlendFaultError('attempt_not_found')
  if (attempt.guest_reference !== guestReference) throw new BlendFaultError('attempt_not_owned')

  let answers = []
  if (attempt.status !== 'in_progress') {
    const { rows: answerRows } = await db.query(
      `SELECT a.question_key, a.submitted_answer, a.is_correct, a.points_earned, q.correct_answer, q.explanation, q.educational_takeaway
       FROM smokecraft_blend_fault_answers a
       JOIN smokecraft_blend_fault_questions q ON q.question_key = a.question_key
       WHERE a.attempt_id = $1 ORDER BY a.answered_at`,
      [attemptId]
    )
    answers = answerRows.map(r => ({
      questionKey: r.question_key, submittedAnswer: r.submitted_answer, isCorrect: r.is_correct,
      pointsEarned: r.points_earned, correctAnswer: r.correct_answer, explanation: r.explanation, educationalTakeaway: r.educational_takeaway,
    }))
  }

  return { attempt: serializeAttempt(attempt), answers, retryEligible: attempt.status !== 'in_progress' }
}

// The scoring engine. Runs in a single transaction. Never trusts any
// score/percentage/correctness/pass-fail value from the caller — only
// { questionKey, answer } pairs are accepted, validated against the
// real active question set, and compared to the server-side answer key.
export async function submitAttempt(guestReference, attemptId, submittedAnswers) {
  if (!Array.isArray(submittedAnswers) || submittedAnswers.length === 0) throw new BlendFaultError('invalid_submission')

  const db = getDb()
  const client = await db.connect()
  try {
    await client.query('BEGIN')

    const { rows: attemptRows } = await client.query(`SELECT * FROM smokecraft_blend_fault_attempts WHERE attempt_id = $1 FOR UPDATE`, [attemptId])
    const attempt = attemptRows[0]
    if (!attempt) throw new BlendFaultError('attempt_not_found')
    if (attempt.guest_reference !== guestReference) throw new BlendFaultError('attempt_not_owned')
    if (attempt.status !== 'in_progress') {
      // Already scored — preserve the immutable prior result, do not rescore.
      await client.query('ROLLBACK')
      return { attempt: serializeAttempt(attempt), alreadyScored: true }
    }

    const { rows: questionRows } = await client.query(
      `SELECT question_key, correct_answer FROM smokecraft_blend_fault_questions WHERE active = true AND version = $1`,
      [attempt.assessment_version]
    )
    const answerKey = new Map(questionRows.map(q => [q.question_key, q.correct_answer]))

    const seenKeys = new Set()
    const scoredAnswers = []
    for (const submitted of submittedAnswers) {
      const questionKey = submitted?.questionKey
      const answer = submitted?.answer
      if (typeof questionKey !== 'string' || typeof answer !== 'string') throw new BlendFaultError('invalid_answer_payload')
      if (!answerKey.has(questionKey)) throw new BlendFaultError('unknown_question_key')
      if (seenKeys.has(questionKey)) throw new BlendFaultError('duplicate_question_key')
      seenKeys.add(questionKey)
      const isCorrect = answerKey.get(questionKey) === answer
      scoredAnswers.push({ questionKey, answer, isCorrect, points: isCorrect ? POINTS_PER_QUESTION : 0 })
    }
    if (seenKeys.size !== answerKey.size) throw new BlendFaultError('incomplete_submission')

    for (const a of scoredAnswers) {
      await client.query(
        `INSERT INTO smokecraft_blend_fault_answers (attempt_id, question_key, submitted_answer, is_correct, points_earned)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (attempt_id, question_key) DO NOTHING`,
        [attemptId, a.questionKey, a.answer, a.isCorrect, a.points]
      )
    }

    const scoreEarned = scoredAnswers.reduce((s, a) => s + a.points, 0)
    const scorePossible = answerKey.size * POINTS_PER_QUESTION
    const percentage = Math.round((scoreEarned / scorePossible) * 10000) / 100
    const passFail = percentage >= PASS_THRESHOLD_PERCENT ? 'passed' : 'failed'

    const { rows: updated } = await client.query(
      `UPDATE smokecraft_blend_fault_attempts
       SET status = $1, submitted_at = now(), score_earned = $2, score_possible = $3, percentage = $4,
           pass_fail = $1, completion_source = 'server_scoring', updated_at = now()
       WHERE attempt_id = $5 RETURNING *`,
      [passFail, scoreEarned, scorePossible, percentage, attemptId]
    )
    const finalAttempt = updated[0]

    await client.query('COMMIT')

    // Progression event + reward — outside the DB transaction (matches
    // the existing recordEvent()/awardXp() pattern used by every prior
    // pass, both of which manage their own idempotent writes).
    await recordEvent({
      guestReference, sourceScreen: 'BlendFaultChallenge', sourceRoute: '/smokecraft/challenges/blend-fault-identification',
      eventType: 'blend_fault_attempt_submitted',
      payload: { assessmentKey: ASSESSMENT_KEY, attemptId, scoreEarned, scorePossible, percentage, passFail },
      idempotencyKey: `blend-fault-attempt-submitted-event-${attemptId}`,
    })
    await recordEvent({
      guestReference, sourceScreen: 'BlendFaultChallenge', sourceRoute: '/smokecraft/challenges/blend-fault-identification',
      eventType: passFail === 'passed' ? 'blend_fault_assessment_passed' : 'blend_fault_assessment_failed',
      payload: { assessmentKey: ASSESSMENT_KEY, attemptId, scoreEarned, scorePossible, percentage },
      idempotencyKey: `blend-fault-assessment-${passFail}-event-${attemptId}`,
    })

    // No approved XP reward exists for Blend Fault Identification
    // (the pre-existing shell explicitly disclosed "XP... not yet
    // backend-connected"). Deliberate, disclosed zero-XP design —
    // no awardXp() call is made here.

    const scoreResult = { scoreEarned, scorePossible, percentage, passFail }
    const rewardResult = { xpAwarded: 0, granted: false }
    await recordChallengeEvent({
      guestReference, sourceScreen: 'BlendFaultChallenge', sourceRoute: '/smokecraft/challenges/blend-fault-identification',
      eventType: 'challenge_submitted', challengeId: CHALLENGE_ID, attemptId,
      evidenceReference: attemptId, ruleId: ASSESSMENT_KEY, ruleVersion: attempt.assessment_version,
      idempotencyKey: `challenge-submitted-canonical-${attemptId}`,
    })
    await recordChallengeEvent({
      guestReference, sourceScreen: 'BlendFaultChallenge', sourceRoute: '/smokecraft/challenges/blend-fault-identification',
      eventType: 'challenge_scored', challengeId: CHALLENGE_ID, attemptId,
      evidenceReference: attemptId, ruleId: ASSESSMENT_KEY, ruleVersion: attempt.assessment_version,
      scoreResult,
      idempotencyKey: `challenge-scored-canonical-${attemptId}`,
    })
    await recordChallengeEvent({
      guestReference, sourceScreen: 'BlendFaultChallenge', sourceRoute: '/smokecraft/challenges/blend-fault-identification',
      eventType: 'challenge_completed', challengeId: CHALLENGE_ID, attemptId,
      evidenceReference: attemptId, ruleId: ASSESSMENT_KEY, ruleVersion: attempt.assessment_version,
      scoreResult, rewardResult,
      idempotencyKey: `challenge-completed-canonical-${attemptId}`,
    })

    return { attempt: serializeAttempt(finalAttempt), alreadyScored: false, answers: scoredAnswers }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
