/**
 * Sync Security Response Service — Phase 6H
 * Centralized, additive helpers for shaping safe responses and sanitizing
 * data across the Phase 6B–6G sync/reconciliation/replay/audit stack.
 * Extends — does not replace — `server/utils/response.js` (ok/fail/
 * serverError) and the local `envelope()` pattern already used by
 * syncReconciliationController.js / syncAuditController.js.
 *
 * Nothing here talks to the DB or req/res directly except by accepting
 * `res` as a parameter — every function is otherwise pure.
 */

import { normalizeClientBoolean } from './syncRequestValidationService.js'

// Sensitive fields that must never reach a staff UI/API response, an audit
// log, or a server log line unless explicitly carved out by `allow`.
const SENSITIVE_FIELD_PATTERNS = [
  /^card[-_]?number$/i,
  /^cvv$/i,
  /^cvc$/i,
  /payment[-_]?token/i,
  /^ssn$/i,
  /^password$/i,
  /^pass(word)?hash$/i,
  /reset[-_]?token/i,
  /^api[-_]?key$/i,
  /^secret$/i,
  /^auth(orization)?$/i,
  /^cookie$/i,
  /^session[-_]?token$/i,
  /^token$/i,
  /^jwt$/i,
  /guest[-_]?email/i,
  /guest[-_]?phone/i,
]

const MAX_METADATA_VALUE_LENGTH = 2000

function isSensitiveKey(key) {
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => pattern.test(key))
}

export function createSafeSuccessResponse(data, options = {}) {
  const { mode = 'live', message = null } = options
  return { success: true, mode, degraded: false, message, data, error: null }
}

export function createSafeErrorResponse(error, options = {}) {
  const { status = 400, mode = 'error' } = options
  const message = typeof error === 'string' ? error : (error?.message || 'Request failed')
  return { status, body: { success: false, mode, degraded: false, message, data: null, error: null } }
}

export function createDegradedResponse(message, options = {}) {
  const { status = 503, data = null } = options
  return {
    status,
    body: { success: false, mode: 'degraded', degraded: true, message: message || 'Service is degraded.', data, error: null },
  }
}

export function createUnauthorizedResponse(message = 'Authentication required', options = {}) {
  return { status: 401, body: { success: false, mode: 'unauthorized', degraded: false, message, data: null, error: null } }
}

export function createForbiddenResponse(message = 'Access denied', options = {}) {
  return { status: 403, body: { success: false, mode: 'forbidden', degraded: false, message, data: null, error: null } }
}

/** Removes sensitive keys (recursively) from a request/response payload. Returns {sanitized, redactedKeys}. */
export function redactSensitiveFields(obj, options = {}) {
  const { maxDepth = 5 } = options
  const redactedKeys = []

  function walk(value, depth) {
    if (depth > maxDepth || value === null || typeof value !== 'object') return value
    if (Array.isArray(value)) return value.map((item) => walk(item, depth + 1))
    const out = {}
    for (const [key, val] of Object.entries(value)) {
      if (isSensitiveKey(key)) {
        redactedKeys.push(key)
        continue
      }
      out[key] = typeof val === 'object' && val !== null ? walk(val, depth + 1) : val
    }
    return out
  }

  return { sanitized: walk(obj, 0), redactedKeys }
}

/** Drops nested objects/oversized values; used by all client-facing sync payloads. */
export function sanitizeSyncPayload(payload, options = {}) {
  if (!payload || typeof payload !== 'object') return { sanitized: {}, redactedKeys: [], warnings: [] }
  const { sanitized, redactedKeys } = redactSensitiveFields(payload, options)
  const warnings = redactedKeys.map((key) => `field "${key}" was redacted from the payload`)
  return { sanitized, redactedKeys, warnings }
}

/** Audit-log-specific metadata sanitizer — stricter than the general redactor: rejects nested objects entirely, caps string length. */
export function sanitizeAuditMetadata(metadata, options = {}) {
  const { maxValueLength = MAX_METADATA_VALUE_LENGTH } = options
  if (!metadata || typeof metadata !== 'object') return { sanitized: {}, wasSanitized: false, redactedKeys: [] }

  const sanitized = {}
  const redactedKeys = []
  let wasSanitized = false

  for (const [key, value] of Object.entries(metadata)) {
    if (isSensitiveKey(key)) {
      redactedKeys.push(key)
      wasSanitized = true
      continue
    }
    if (value !== null && typeof value === 'object') {
      // Never nest raw payloads inside audit metadata — drop, don't fail the operation.
      redactedKeys.push(key)
      wasSanitized = true
      continue
    }
    if (typeof value === 'string' && value.length > maxValueLength) {
      sanitized[key] = `${value.slice(0, maxValueLength)}…[truncated]`
      wasSanitized = true
      continue
    }
    sanitized[key] = value
  }

  return { sanitized, wasSanitized, redactedKeys }
}

/** Confirms the request carries an authenticated staff-or-above user. Does not call res — caller maps the result to a response. */
export function validateStaffOnlyRequest(req, options = {}) {
  const { minRole = 'staff' } = options
  if (!req?.user) return { ok: false, reason: 'unauthorized' }
  if (typeof req.user.role !== 'string') return { ok: false, reason: 'forbidden' }
  // Role hierarchy check delegated to roleMiddleware in routes; this is a
  // defense-in-depth check for service-layer code paths that don't go
  // through Express middleware directly.
  const ROLE_LEVELS = ['guest', 'staff', 'manager', 'admin', 'founder_level_0']
  const userLevel = ROLE_LEVELS.indexOf(req.user.role)
  const minLevel = ROLE_LEVELS.indexOf(minRole)
  if (userLevel === -1 || userLevel < minLevel) return { ok: false, reason: 'forbidden' }
  return { ok: true, reason: null }
}

export { normalizeClientBoolean }
