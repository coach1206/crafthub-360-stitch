import * as svc from '../services/smokecraft/blendFaultService.js'
import { getDb } from '../db/connection.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = {
    identity_required: 400,
    invalid_submission: 400,
    invalid_answer_payload: 400,
    unknown_question_key: 400,
    duplicate_question_key: 400,
    incomplete_submission: 400,
    attempt_not_found: 404,
    attempt_not_owned: 403,
  }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}

function guestRef(req) {
  return req.goldenBoxGuestReference || null
}

export async function handleGetAssessment(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.getAssessment(ref)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleStartAttempt(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { attempt } = await svc.startAttempt(ref)
    res.json({ success: true, attempt: { attemptId: attempt.attempt_id, attemptNumber: attempt.attempt_number, status: attempt.status, startedAt: attempt.started_at } })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetAttempt(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.getAttempt(ref, req.params.attemptId)
    res.json({ success: true, ...result })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleSubmitAttempt(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const answers = Array.isArray(req.body?.answers) ? req.body.answers.map(a => ({ questionKey: a.questionKey, answer: a.answer })) : []
    const result = await svc.submitAttempt(ref, req.params.attemptId, answers)
    if (result.alreadyScored) {
      const detail = await svc.getAttempt(ref, req.params.attemptId)
      return res.json({ success: true, alreadyScored: true, ...detail })
    }
    const detail = await svc.getAttempt(ref, req.params.attemptId)
    res.json({ success: true, alreadyScored: false, ...detail })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetHistory(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const db = getDb()
    const { rows } = await db.query(
      `SELECT attempt_id, attempt_number, status, started_at, submitted_at, score_earned, score_possible, percentage, pass_fail
       FROM smokecraft_blend_fault_attempts WHERE guest_reference = $1 AND assessment_key = 'blend-fault-identification'
       ORDER BY attempt_number DESC`,
      [ref]
    )
    res.json({
      success: true,
      attempts: rows.map(a => ({
        attemptId: a.attempt_id, attemptNumber: a.attempt_number, status: a.status,
        startedAt: a.started_at, submittedAt: a.submitted_at, scoreEarned: a.score_earned,
        scorePossible: a.score_possible, percentage: a.percentage ? Number(a.percentage) : null, passFail: a.pass_fail,
      })),
    })
  } catch (err) { sendError(res, err, 500) }
}
