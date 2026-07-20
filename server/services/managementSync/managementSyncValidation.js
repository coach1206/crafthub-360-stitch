/**
 * SmokeCraft Management Sync — request validation.
 * No validation library exists in this repository (confirmed in the
 * backend architecture audit) — manual checks, matching the existing
 * inline-validation convention used by ticketTapperPromotionController.js.
 */

const VALID_PHASES = new Set(['in_progress', 'completed', 'abandoned'])
const VALID_DESTINATIONS = new Set(['venue_insights', 'eat_360', 'pos_360', 'novee_os', 'inventory', 'staff_handoff'])
// Package B only supports internal venue_insights sync — every other
// destination is schema-permitted but not yet a real integration
// (SMOKECRAFT_MANAGEMENT_SYNC_DESTINATION_AUDIT.md). Reject them here so
// the API never claims to have synced somewhere it hasn't.
const SUPPORTED_DESTINATIONS = new Set(['venue_insights'])
const VALID_RETURN_INTENT = new Set(['yes', 'no', 'maybe'])
const VALID_ACTION_TYPES = new Set([
  'analytics_viewed', 'staff_feedback_submitted', 'inventory_handoff_requested',
  'sync_requested', 'sync_completed', 'sync_failed',
])
const MAX_PAYLOAD_BYTES = 32 * 1024 // 32KB — generous for a journey snapshot, rejects abuse
const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

function rejectPrototypePollution(obj, depth = 0) {
  if (depth > 6 || obj === null || typeof obj !== 'object') return true
  for (const key of Object.keys(obj)) {
    if (DANGEROUS_KEYS.has(key)) return false
    if (!rejectPrototypePollution(obj[key], depth + 1)) return false
  }
  return true
}

function isPlainObjectOrNull(v) {
  return v === undefined || v === null || (typeof v === 'object' && !Array.isArray(v))
}

export function validateCreateJourneyBody(body) {
  const errors = []
  if (!body?.tenantId || typeof body.tenantId !== 'string') errors.push('tenantId required')
  if (!body?.sessionNumber || !Number.isInteger(body.sessionNumber) || body.sessionNumber < 1 || body.sessionNumber > 27) {
    errors.push('sessionNumber must be an integer 1-27')
  }
  if (!body?.phase || typeof body.phase !== 'string') errors.push('phase required')
  if (!body?.sourceVersion || typeof body.sourceVersion !== 'string') errors.push('sourceVersion required')
  // Server-controlled fields the client must never set:
  for (const forbidden of ['journeyId', 'userId', 'guestReference', 'createdAt', 'updatedAt', 'status']) {
    if (body?.[forbidden] !== undefined) errors.push(`${forbidden} is server-controlled and must not be supplied`)
  }
  return errors
}

export function validateSnapshotBody(body) {
  const errors = []
  if (!isPlainObjectOrNull(body?.cigarSelection)) errors.push('cigarSelection must be an object')
  if (!isPlainObjectOrNull(body?.pairingSelection)) errors.push('pairingSelection must be an object')
  if (!isPlainObjectOrNull(body?.flavorNotes)) errors.push('flavorNotes must be an object')
  if (!isPlainObjectOrNull(body?.scorecard)) errors.push('scorecard must be an object')
  if (body?.rating !== undefined && body.rating !== null) {
    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) errors.push('rating must be an integer 1-5')
  }
  if (body?.returnIntent !== undefined && body.returnIntent !== null && !VALID_RETURN_INTENT.has(body.returnIntent)) {
    errors.push('returnIntent must be yes, no, or maybe')
  }
  if (typeof body?.feedbackText === 'string' && /<script|<iframe|javascript:/i.test(body.feedbackText)) {
    errors.push('feedbackText contains unsafe content')
  }
  for (const forbidden of ['snapshotId', 'snapshotVersion', 'payloadHash', 'createdAt']) {
    if (body?.[forbidden] !== undefined) errors.push(`${forbidden} is server-controlled and must not be supplied`)
  }
  const size = Buffer.byteLength(JSON.stringify(body || {}), 'utf8')
  if (size > MAX_PAYLOAD_BYTES) errors.push(`payload exceeds ${MAX_PAYLOAD_BYTES} bytes`)
  if (!rejectPrototypePollution(body)) errors.push('payload contains a disallowed key')
  return errors
}

export function validateSyncRequestBody(body) {
  const errors = []
  if (!body?.destination || !VALID_DESTINATIONS.has(body.destination)) {
    errors.push('destination must be one of the approved values')
  } else if (!SUPPORTED_DESTINATIONS.has(body.destination)) {
    errors.push(`destination '${body.destination}' is not yet a supported integration (NOT CONNECTED)`)
  }
  for (const forbidden of ['payloadVersion', 'status', 'retryCount', 'eventId', 'idempotencyKey']) {
    if (body?.[forbidden] !== undefined) errors.push(`${forbidden} is server-controlled and must not be supplied`)
  }
  return errors
}

export function validateActionBody(body) {
  const errors = []
  if (!body?.actionType || !VALID_ACTION_TYPES.has(body.actionType)) {
    errors.push('actionType must be one of the approved values')
  }
  if (!isPlainObjectOrNull(body?.metadata)) errors.push('metadata must be an object')
  else if (body?.metadata && !rejectPrototypePollution(body.metadata)) errors.push('metadata contains a disallowed key')
  for (const forbidden of ['actorUserId', 'actionStatus', 'createdAt']) {
    if (body?.[forbidden] !== undefined) errors.push(`${forbidden} is server-controlled and must not be supplied`)
  }
  return errors
}

export function jsonValidationErrorResponse(res, errors) {
  return res.status(400).json({ success: false, error: 'validation_failed', details: errors })
}
