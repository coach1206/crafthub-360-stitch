/**
 * SmokeCraft Structured Logger — Production Package 5 (Monitoring/Recovery/Support)
 *
 * Extends server/utils/safeEnvironmentLogger.js (secret-pattern redaction for
 * env dumps) with a general-purpose structured event logger used for
 * operational logging: startup/shutdown, auth/authz failures, venue-isolation
 * failures, inventory mutations, order/payment transitions, webhook
 * processing, media processing, Passport/Golden Box lifecycle events,
 * background jobs, deployment version, unhandled exceptions, DB/storage
 * failures, rate-limit events.
 *
 * Every log line is a single-line JSON object (safe for log aggregators)
 * with: timestamp, environment, severity, service, event_type, and
 * whatever context fields are relevant (route, correlation_id, actor_id,
 * venue_id, order_id, payment_session_id, outcome, duration_ms).
 *
 * NEVER logs: passwords, full card numbers, Stripe secret/webhook keys,
 * session/JWT secrets, auth tokens, full DB connection strings, private
 * rights documents, or customer PII beyond operational necessity
 * (name/email are allowed as actor identifiers; nothing more).
 */

import crypto from 'crypto'

// ── Secret scrubbing ──────────────────────────────────────────

// Patterns for values that must NEVER appear in a log line, even nested
// inside arbitrary object fields or free-text messages.
const SECRET_VALUE_PATTERNS = [
  { name: 'stripe_secret_key',    re: /sk_(live|test)_[a-zA-Z0-9]{10,}/g },
  { name: 'stripe_restricted_key',re: /rk_(live|test)_[a-zA-Z0-9]{10,}/g },
  { name: 'stripe_webhook_secret',re: /whsec_[a-zA-Z0-9]{10,}/g },
  { name: 'stripe_publishable',   re: /pk_(live|test)_[a-zA-Z0-9]{10,}/g },
  { name: 'jwt',                  re: /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g },
  { name: 'bearer_token',         re: /Bearer\s+[a-zA-Z0-9._-]{10,}/gi },
  { name: 'postgres_url_creds',   re: /postgres(?:ql)?:\/\/[^:\s]+:[^@\s]+@/gi },
  { name: 'card_pan',             re: /\b(?:\d[ -]*?){13,19}\b/g },
  { name: 'hex_secret_32plus',    re: /\b[a-f0-9]{32,}\b/gi },
]

// Field-name based scrubbing — anything whose key matches is fully redacted
// regardless of value shape, so unusual secret formats still get caught.
const SECRET_KEY_PATTERN = /(password|passwd|secret|token|api[_-]?key|private[_-]?key|auth(?:orization)?|session[_-]?secret|webhook[_-]?secret|card[_-]?number|cvv|cvc|ssn|db[_-]?url|database[_-]?url|connection[_-]?string)/i

// Keys that are allowed to carry partial customer info for support/ops
// purposes but must never carry more than an identifier.
const ALLOWLISTED_ID_KEYS = new Set([
  'actor_id', 'actorId', 'venue_id', 'venueId', 'order_id', 'orderId',
  'payment_session_id', 'paymentSessionId', 'correlation_id', 'correlationId',
  'customer_id', 'customerId', 'card_last4', 'email',
])

export function scrubString(value) {
  if (typeof value !== 'string') return value
  let out = value
  for (const { re } of SECRET_VALUE_PATTERNS) {
    out = out.replace(re, '[redacted]')
  }
  return out
}

export function scrubValue(key, value, depth = 0) {
  if (depth > 6) return '[max_depth]'
  if (value == null) return value

  if (key && SECRET_KEY_PATTERN.test(key) && !ALLOWLISTED_ID_KEYS.has(key)) {
    return '[redacted]'
  }

  if (typeof value === 'string') return scrubString(value)
  if (Array.isArray(value)) return value.map((v) => scrubValue(key, v, depth + 1))
  if (typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) {
      out[k] = scrubValue(k, v, depth + 1)
    }
    return out
  }
  return value
}

/** Deep-scrubs an arbitrary object, returning a new object safe to log. */
export function scrubObject(obj) {
  if (!obj || typeof obj !== 'object') return obj
  return scrubValue('$root', obj)
}

// ── Correlation IDs ───────────────────────────────────────────

export function newCorrelationId() {
  return `corr_${crypto.randomBytes(12).toString('hex')}`
}

// ── Core logger ────────────────────────────────────────────────

export const SEVERITY = Object.freeze({
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'critical',
})

export const EVENT_TYPE = Object.freeze({
  STARTUP: 'startup',
  SHUTDOWN: 'shutdown',
  AUTH_FAILURE: 'auth_failure',
  AUTHZ_FAILURE: 'authz_failure',
  VENUE_ISOLATION_FAILURE: 'venue_isolation_failure',
  INVENTORY_MUTATION: 'inventory_mutation',
  ORDER_TRANSITION: 'order_transition',
  PAYMENT_TRANSITION: 'payment_transition',
  WEBHOOK_PROCESSING: 'webhook_processing',
  REFUND: 'refund',
  DISPUTE: 'dispute',
  MEDIA_UPLOAD: 'media_upload',
  MEDIA_PROCESSING: 'media_processing',
  PASSPORT_CLAIM: 'passport_claim',
  GOLDEN_BOX_LIFECYCLE: 'golden_box_lifecycle',
  BACKGROUND_JOB: 'background_job',
  DEPLOYMENT: 'deployment',
  UNHANDLED_EXCEPTION: 'unhandled_exception',
  DB_FAILURE: 'db_failure',
  STORAGE_FAILURE: 'storage_failure',
  RATE_LIMIT: 'rate_limit',
  BACKUP: 'backup',
  RESTORE: 'restore',
  SUPPORT_ACTION: 'support_action',
})

function buildLine(severity, eventType, fields) {
  const scrubbed = scrubObject(fields || {})
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    service: 'smokecraft-360',
    severity,
    event_type: eventType,
    ...scrubbed,
  }
}

/**
 * Emits one structured JSON log line to stdout (or stderr for
 * error/critical). Returns the emitted object for tests/callers that want
 * to inspect what was logged (e.g. to also forward to an error tracker).
 */
export function logEvent(severity, eventType, fields = {}) {
  const line = buildLine(severity, eventType, fields)
  const json = JSON.stringify(line)
  if (severity === SEVERITY.ERROR || severity === SEVERITY.CRITICAL) {
    console.error(json)
  } else if (severity === SEVERITY.WARN) {
    console.warn(json)
  } else {
    console.log(json)
  }
  return line
}

export const logInfo = (eventType, fields) => logEvent(SEVERITY.INFO, eventType, fields)
export const logWarn = (eventType, fields) => logEvent(SEVERITY.WARN, eventType, fields)
export const logError = (eventType, fields) => logEvent(SEVERITY.ERROR, eventType, fields)
export const logCritical = (eventType, fields) => logEvent(SEVERITY.CRITICAL, eventType, fields)

export default {
  scrubString,
  scrubObject,
  newCorrelationId,
  logEvent,
  logInfo,
  logWarn,
  logError,
  logCritical,
  SEVERITY,
  EVENT_TYPE,
}
