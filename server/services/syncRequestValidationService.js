/**
 * Sync Request Validation Service — Phase 6H
 * Pure, side-effect-free validation/sanitization for every Phase 6B–6G
 * sync/reconciliation/replay/audit request body and query string. No DB
 * access, no network calls — every function here is synchronous and
 * testable in isolation (see server/scripts/runPhase6HSecurityChecks.js).
 *
 * Every validate* function returns { valid, errors, sanitized }.
 * Callers (controllers) are responsible for turning a failed validation
 * into a 400 response — this service never knows about req/res.
 */

const MAX_EVENT_ID_LENGTH = 128
const MAX_FINGERPRINT_LENGTH = 256
const MAX_NOTE_LENGTH = 4000
const MAX_REASON_LENGTH = 4000
const MAX_LIMIT = 500
const DEFAULT_LIMIT = 100

// Fields a client must never be able to set directly — these always
// represent backend-confirmed truth, never a client claim.
export const FORBIDDEN_CLIENT_FIELDS = [
  'success',
  'degraded',
  'mode',
  'backendConfirmationId',
  'replayConfirmedAt',
  'reconciliationResolvedAt',
  'reconciliationResolvedBy',
  'processedAt',
  'confirmedAt',
  'staffRole',
  'actorRole',
  'isAdmin',
  'isStaff',
  'permissions',
  'auth',
  'token',
]

function result(valid, errors = [], sanitized = null) {
  return { valid, errors, sanitized }
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateEventId(eventId) {
  const errors = []
  if (eventId === undefined || eventId === null || eventId === '') {
    errors.push('eventId is required')
  } else if (typeof eventId !== 'string') {
    errors.push('eventId must be a string')
  } else if (eventId.length > MAX_EVENT_ID_LENGTH) {
    errors.push(`eventId exceeds maximum length of ${MAX_EVENT_ID_LENGTH} characters`)
  }
  return result(errors.length === 0, errors, errors.length === 0 ? String(eventId).trim() : null)
}

export function validateFingerprint(fingerprint) {
  const errors = []
  if (fingerprint === undefined || fingerprint === null || fingerprint === '') {
    errors.push('fingerprint is required')
  } else if (typeof fingerprint !== 'string') {
    errors.push('fingerprint must be a string')
  } else if (fingerprint.length > MAX_FINGERPRINT_LENGTH) {
    errors.push(`fingerprint exceeds maximum length of ${MAX_FINGERPRINT_LENGTH} characters`)
  }
  return result(errors.length === 0, errors, errors.length === 0 ? String(fingerprint).trim() : null)
}

/** Strips forbidden client-controlled fields; reports which ones were present. */
export function assertNoForbiddenClientFields(payload) {
  if (!payload || typeof payload !== 'object') return result(true, [], {})
  const present = FORBIDDEN_CLIENT_FIELDS.filter((key) => Object.prototype.hasOwnProperty.call(payload, key))
  const sanitized = { ...payload }
  for (const key of present) delete sanitized[key]
  return result(
    true, // never blocks the request — forbidden fields are dropped, not fatal
    present.map((key) => `forbidden field "${key}" was ignored`),
    sanitized
  )
}

export function validateConflictDecisionPayload(payload) {
  const errors = []
  if (!payload || typeof payload !== 'object') {
    return result(false, ['payload is required'], null)
  }
  const { event } = payload
  if (!event || typeof event !== 'object') {
    errors.push('event object is required')
  } else {
    const eventIdCheck = validateEventId(event.eventId)
    if (!eventIdCheck.valid) errors.push(...eventIdCheck.errors)
  }
  if (payload.reason !== undefined && payload.reason !== null) {
    if (typeof payload.reason !== 'string') errors.push('reason must be a string')
    else if (payload.reason.length > MAX_REASON_LENGTH) errors.push(`reason exceeds maximum length of ${MAX_REASON_LENGTH} characters`)
  }
  const { sanitized } = assertNoForbiddenClientFields(payload)
  return result(errors.length === 0, errors, errors.length === 0 ? sanitized : null)
}

export function validateReplayPreviewPayload(payload) {
  const errors = []
  if (!payload || typeof payload !== 'object' || !payload.event) {
    errors.push('event object is required')
  } else {
    const eventIdCheck = validateEventId(payload.event.eventId)
    if (!eventIdCheck.valid) errors.push(...eventIdCheck.errors)
  }
  const { sanitized } = assertNoForbiddenClientFields(payload || {})
  return result(errors.length === 0, errors, errors.length === 0 ? sanitized : null)
}

export function validateReplayRequestPayload(payload) {
  const errors = []
  if (!payload || typeof payload !== 'object') {
    return result(false, ['payload is required'], null)
  }
  const { eventId, event } = payload
  if (!eventId && !event) {
    errors.push('either eventId or event is required')
  }
  if (eventId) {
    const eventIdCheck = validateEventId(eventId)
    if (!eventIdCheck.valid) errors.push(...eventIdCheck.errors)
  }
  if (event && typeof event === 'object' && event.eventId) {
    const eventIdCheck = validateEventId(event.eventId)
    if (!eventIdCheck.valid) errors.push(...eventIdCheck.errors)
  }
  const { sanitized, errors: forbiddenWarnings } = assertNoForbiddenClientFields(payload)
  return result(errors.length === 0, [...errors, ...forbiddenWarnings], errors.length === 0 ? sanitized : null)
}

export function validateReconciliationNotePayload(payload) {
  const errors = []
  if (!payload || typeof payload !== 'object') {
    return result(false, ['payload is required'], null)
  }
  if (!isNonEmptyString(payload.note)) {
    errors.push('note is required and must be a non-empty string')
  } else if (payload.note.length > MAX_NOTE_LENGTH) {
    errors.push(`note exceeds maximum length of ${MAX_NOTE_LENGTH} characters`)
  }
  const { sanitized } = assertNoForbiddenClientFields(payload)
  return result(errors.length === 0, errors, errors.length === 0 ? sanitized : null)
}

export function validateReconciliationResolvePayload(payload) {
  const errors = []
  if (!payload || typeof payload !== 'object') {
    return result(false, ['payload is required'], null)
  }
  const { staffReason, backendConfirmationId } = payload
  if (!isNonEmptyString(staffReason) && !isNonEmptyString(backendConfirmationId)) {
    errors.push('staffReason or backendConfirmationId is required')
  }
  if (staffReason !== undefined && staffReason !== null) {
    if (typeof staffReason !== 'string') errors.push('staffReason must be a string')
    else if (staffReason.length > MAX_REASON_LENGTH) errors.push(`staffReason exceeds maximum length of ${MAX_REASON_LENGTH} characters`)
  }
  // backendConfirmationId is never trusted from the client even when present —
  // the route layer must always derive it from a real backend write, not echo this value.
  const { sanitized, errors: forbiddenWarnings } = assertNoForbiddenClientFields(payload)
  if (sanitized) delete sanitized.backendConfirmationId
  return result(errors.length === 0, [...errors, ...forbiddenWarnings], errors.length === 0 ? sanitized : null)
}

export function validatePagination(query) {
  const errors = []
  let limit = DEFAULT_LIMIT
  if (query?.limit !== undefined) {
    const parsed = Number(query.limit)
    if (!Number.isFinite(parsed) || parsed <= 0) {
      errors.push('limit must be a positive number')
    } else {
      limit = Math.min(Math.floor(parsed), MAX_LIMIT)
    }
  }
  return result(errors.length === 0, errors, errors.length === 0 ? { limit } : null)
}

export function validateAuditLogQuery(query) {
  const errors = []
  const paginationCheck = validatePagination(query)
  if (!paginationCheck.valid) errors.push(...paginationCheck.errors)

  const ALLOWED_CATEGORIES = ['sync', 'replay', 'conflict', 'reconciliation', 'staff_action', 'eat_catchup', 'security', 'system']
  if (query?.actionCategory && !ALLOWED_CATEGORIES.includes(query.actionCategory)) {
    errors.push(`actionCategory must be one of: ${ALLOWED_CATEGORIES.join(', ')}`)
  }
  if (query?.actionType !== undefined && typeof query.actionType !== 'string') {
    errors.push('actionType must be a string')
  }
  return result(errors.length === 0, errors, errors.length === 0
    ? { actionCategory: query?.actionCategory || null, actionType: query?.actionType || null, limit: paginationCheck.sanitized.limit }
    : null)
}

export function validateTimelineQuery(query) {
  // Timeline lookups are path-param driven (eventId/fingerprint); query
  // string only carries optional pagination-like hints today.
  return validatePagination(query)
}

export function normalizeClientBoolean(value) {
  if (value === true || value === 'true' || value === 1 || value === '1') return true
  if (value === false || value === 'false' || value === 0 || value === '0') return false
  return null
}
