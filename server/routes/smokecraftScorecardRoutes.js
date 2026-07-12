/**
 * SmokeCraft Scorecard Routes
 * Mounted at /api/smokecraft/scorecard
 *
 * Accepts scorecard submissions and returns the stored record.
 * No live scoring engine — values come from guest's interactive input.
 * Never computes 87/100 or "Excellent Smoke" without real category scores.
 */
import { Router } from 'express'
import { safeValidate } from '../lib/smokecraftRuntimeContractValidator.js'

const router = Router()
const store = new Map()   // in-memory; survives session, resets on server restart
let counter = 1

const SCORE_LABELS = [
  { min: 90, label: 'Exceptional Smoke',  desc: 'A truly memorable cigar. Recommend without reservation.' },
  { min: 80, label: 'Outstanding Smoke',  desc: 'Well above average. Noticeable quality throughout.' },
  { min: 70, label: 'Very Good Smoke',    desc: 'Clear strengths with minor weaknesses.' },
  { min: 60, label: 'Good Smoke',         desc: 'Enjoyable overall. Noticeably average in some areas.' },
  { min: 50, label: 'Average Smoke',      desc: 'Smokes but lacks distinction.' },
  { min: 0,  label: 'Below Average',      desc: 'Significant faults present.' },
]

function getLabel(overall) {
  for (const { min, label, desc } of SCORE_LABELS) {
    if (overall >= min) return { label, desc }
  }
  return { label: 'Below Average', desc: 'Significant faults present.' }
}

function calcOverall(cats) {
  // Weights: flavor 30%, draw 20%, burn 15%, construction 15%, appearance 10%, pairing 10%
  const weights = { flavor: 0.30, draw: 0.20, burn: 0.15, construction: 0.15, appearance: 0.10, pairing: 0.10 }
  let total = 0, totalWeight = 0
  for (const [key, weight] of Object.entries(weights)) {
    const val = cats[key]
    if (val != null && val > 0) {
      total += val * weight
      totalWeight += weight
    }
  }
  if (totalWeight === 0) return null
  return Math.round((total / totalWeight) * 100) / 100
}

// POST /api/smokecraft/scorecard/submit
router.post('/submit', (req, res) => {
  const { sessionId, guestId, categories, cigarDetails, pairingDetails, tastingData, sessionMeta, notes } = req.body || {}

  if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' })

  // Contract validation (R9) — reject malformed scorecard before persistence
  const validation = safeValidate('scorecard_submission', { sessionId, guestId, categories })
  if (!validation.valid) {
    return res.status(422).json({ ok: false, error: 'Contract validation failed', detail: validation.error })
  }

  const cats = categories || {}
  const overall = calcOverall(cats)
  const scorecardId = `SC-${Date.now()}-${counter++}`
  const label = overall != null ? getLabel(overall) : null

  const record = {
    scorecardId,
    sessionId,
    guestId: guestId || 'guest',
    categories: cats,
    overall,
    scoreLabel: label?.label || null,
    scoreDescription: label?.desc || null,
    cigarDetails: cigarDetails || null,
    pairingDetails: pairingDetails || null,
    tastingData: tastingData || null,
    sessionMeta: sessionMeta || null,
    notes: notes || '',
    submittedAt: new Date().toISOString(),
    persistenceMode: 'memory_fallback',
  }

  store.set(scorecardId, record)

  res.json({ ok: true, scorecard: record })
})

// GET /api/smokecraft/scorecard/:scorecardId
router.get('/:scorecardId', (req, res) => {
  const record = store.get(req.params.scorecardId)
  record
    ? res.json({ ok: true, scorecard: record })
    : res.status(404).json({ ok: false, error: 'Scorecard not found' })
})

// GET /api/smokecraft/scorecard/labels/all — for client reference
router.get('/labels/all', (_req, res) => {
  res.json({ ok: true, labels: SCORE_LABELS, weights: { flavor: 0.30, draw: 0.20, burn: 0.15, construction: 0.15, appearance: 0.10, pairing: 0.10 } })
})

export default router
