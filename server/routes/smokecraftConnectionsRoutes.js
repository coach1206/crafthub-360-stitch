/**
 * SmokeCraft Connections Routes
 * Mounted at /api/smokecraft/connections
 *
 * Handles all connection actions: share passport, exchange contact,
 * follow venue, save mentor, join cigar circle, join leaderboard, QR connect.
 * All are idempotent — duplicate actions return the existing record.
 * No fake profiles, names, or statuses are generated.
 */
import { Router } from 'express'

const router = Router()

// ── In-memory stores ──────────────────────────────────────────────────────────
const actionStore = new Map()   // `${sessionId}:${action}` → record
const statusStore = new Map()   // sessionId → { actions: [], updatedAt }

// ── Action keys ───────────────────────────────────────────────────────────────
const VALID_ACTIONS = [
  'share-passport',
  'exchange-contact',
  'follow-venue',
  'save-mentor',
  'join-cigar-circle',
  'join-leaderboard',
  'qr-connect',
]

function storeKey(sessionId, action) { return `${sessionId}:${action}` }

function getSessionStatus(sessionId) {
  const existing = statusStore.get(sessionId)
  if (existing) return existing
  return { sessionId, actions: [], updatedAt: null }
}

// ── GET /api/smokecraft/connections/status/:sessionId ────────────────────────
router.get('/status/:sessionId', (req, res) => {
  const status = getSessionStatus(req.params.sessionId)
  res.json({ ok: true, ...status })
})

// ── POST /api/smokecraft/connections/action ───────────────────────────────────
// Body: { sessionId, action, guestId, payload }
router.post('/action', (req, res) => {
  const { sessionId, action, guestId, payload } = req.body || {}

  if (!sessionId) return res.status(400).json({ ok: false, error: 'sessionId required' })
  if (!action || !VALID_ACTIONS.includes(action)) {
    return res.status(400).json({ ok: false, error: `Invalid action. Valid: ${VALID_ACTIONS.join(', ')}` })
  }

  const key = storeKey(sessionId, action)

  // Duplicate prevention
  if (actionStore.has(key)) {
    const existing = actionStore.get(key)
    return res.status(409).json({
      ok: false, duplicate: true,
      error: `Action '${action}' already recorded for this session`,
      record: existing,
    })
  }

  // Validate privacy-sensitive actions
  if (action === 'exchange-contact') {
    if (!payload?.consentGiven) {
      return res.status(403).json({
        ok: false,
        permissionRequired: true,
        error: 'Contact card exchange requires explicit user consent.',
        required: 'consentGiven',
      })
    }
  }
  if (action === 'share-passport') {
    if (!payload?.stampId) {
      return res.status(422).json({ ok: false, error: 'stampId required to share passport stamp' })
    }
  }
  if (action === 'save-mentor') {
    if (!payload?.mentorId) {
      return res.status(422).json({ ok: false, error: 'mentorId required to save mentor recommendation' })
    }
  }

  const record = {
    action,
    sessionId,
    guestId:     guestId || 'guest',
    completedAt: new Date().toISOString(),
    payload:     payload || {},
    passport360: { recordType: `smokecraft_connection_${action}`, source: 'connections-screen' },
  }

  actionStore.set(key, record)

  // Update session status
  const status = getSessionStatus(sessionId)
  const actions = [...status.actions.filter(a => a !== action), action]
  const newStatus = { sessionId, actions, updatedAt: record.completedAt }
  statusStore.set(sessionId, newStatus)

  res.json({ ok: true, recorded: true, record })
})

// ── DELETE /api/smokecraft/connections/action ─────────────────────────────────
// Undo/deselect an action
router.delete('/action', (req, res) => {
  const { sessionId, action } = req.body || {}
  if (!sessionId || !action) return res.status(400).json({ ok: false, error: 'sessionId and action required' })

  const key = storeKey(sessionId, action)
  const existed = actionStore.delete(key)

  if (existed) {
    const status = getSessionStatus(sessionId)
    const actions = status.actions.filter(a => a !== action)
    statusStore.set(sessionId, { ...status, actions, updatedAt: new Date().toISOString() })
  }

  res.json({ ok: true, removed: existed })
})

// ── GET /api/smokecraft/connections/actions ───────────────────────────────────
router.get('/actions', (_req, res) => {
  res.json({ ok: true, validActions: VALID_ACTIONS })
})

export default router
