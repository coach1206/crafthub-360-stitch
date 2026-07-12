/**
 * SmokeCraft Error Log Routes (R19)
 *
 * POST /api/smokecraft/error-log  — receive structured log batch from frontend
 * GET  /api/smokecraft/error-log  — retrieve log entries (admin/founder only)
 *
 * Privacy: entries are scrubbed of PII before storage.
 * Rate limit: inherits global 300 req/15 min; auth endpoint limit does not apply here.
 */

import express from 'express'

const router = express.Router()

// In-process ring buffer: last 500 entries (ephemeral — for demo/dev purposes)
const LOG_RING_BUFFER_SIZE = 500
const _logEntries = []

function appendEntry(entry) {
  _logEntries.unshift(entry)
  if (_logEntries.length > LOG_RING_BUFFER_SIZE) {
    _logEntries.length = LOG_RING_BUFFER_SIZE
  }
}

// ── PII scrubber (server-side second pass) ────────────────────────────────────

const PII_KEYS = new Set([
  'name', 'email', 'phone', 'password', 'token', 'jwt',
  'authorization', 'card', 'cvv', 'ssn', 'dob', 'address',
  'passportmemberid', 'userid', 'memberid',
])

function scrubPii(obj, depth = 0) {
  if (depth > 4 || obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(v => scrubPii(v, depth + 1))
  const clean = {}
  for (const [k, v] of Object.entries(obj)) {
    if (PII_KEYS.has(k.toLowerCase())) {
      clean[k] = '[REDACTED]'
    } else {
      clean[k] = scrubPii(v, depth + 1)
    }
  }
  return clean
}

const VALID_LEVELS    = new Set(['debug', 'info', 'warn', 'error', 'critical'])
const VALID_CATEGORIES = new Set([
  'frontend_exception', 'error_boundary', 'api_error', 'contract_rejected',
  'unauthorized_access', 'rate_limit', 'provider_failure', 'navigation', 'feature_flag',
])

function sanitizeEntry(raw) {
  return {
    id:           String(raw.id || `srv-${Date.now()}`).slice(0, 64),
    timestamp:    raw.timestamp || new Date().toISOString(),
    level:        VALID_LEVELS.has(raw.level) ? raw.level : 'info',
    category:     VALID_CATEGORIES.has(raw.category) ? raw.category : 'frontend_exception',
    message:      String(raw.message || '').slice(0, 500),
    route:        raw.route ? String(raw.route).slice(0, 200) : null,
    role:         raw.role ? String(raw.role).slice(0, 40) : null,
    contractName: raw.contractName ? String(raw.contractName).slice(0, 100) : null,
    errorCode:    raw.errorCode ? String(raw.errorCode).slice(0, 20) : null,
    provider:     raw.provider ? String(raw.provider).slice(0, 100) : null,
    context:      raw.context ? scrubPii(raw.context) : null,
    stack:        raw.stack ? String(raw.stack).slice(0, 2000) : null,
    receivedAt:   new Date().toISOString(),
  }
}

// ── POST /api/smokecraft/error-log ────────────────────────────────────────────

router.post('/', (req, res) => {
  const { entries } = req.body || {}
  if (!Array.isArray(entries) || entries.length === 0) {
    return res.status(400).json({ error: 'entries array required' })
  }
  if (entries.length > 50) {
    return res.status(400).json({ error: 'batch exceeds 50 entries' })
  }

  const accepted = []
  for (const raw of entries) {
    try {
      accepted.push(sanitizeEntry(raw))
    } catch {
      // skip malformed entries silently
    }
  }
  accepted.forEach(appendEntry)

  return res.json({ accepted: accepted.length })
})

// ── GET /api/smokecraft/error-log ─────────────────────────────────────────────

router.get('/', (req, res) => {
  // Minimal role check via header (server-side auth middleware enforces this in real deployment)
  const role = req.headers['x-novee-role'] || ''
  if (!['admin', 'founder_level_0'].includes(role)) {
    return res.status(403).json({ error: 'Admin or founder role required' })
  }

  const { level, category, limit = '50' } = req.query
  let results = [..._logEntries]

  if (level)    results = results.filter(e => e.level === level)
  if (category) results = results.filter(e => e.category === category)

  const maxLimit = Math.min(parseInt(limit, 10) || 50, 200)
  return res.json({
    total: results.length,
    entries: results.slice(0, maxLimit),
  })
})

export default router
