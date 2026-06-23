/**
 * Phase 6H — Runnable Security/Validation Checks
 * Pure-function tests only (no DB, no network, no Express). Exercises
 * syncRequestValidationService.js and syncSecurityResponseService.js
 * directly. Run with: node server/scripts/runPhase6HSecurityChecks.js
 */

import {
  validateEventId, validateFingerprint, assertNoForbiddenClientFields,
  validateReconciliationNotePayload, validateReconciliationResolvePayload,
  validatePagination,
} from '../services/syncRequestValidationService.js'
import {
  sanitizeAuditMetadata, redactSensitiveFields,
} from '../services/syncSecurityResponseService.js'

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) {
    passed += 1
    console.log(`PASS — ${label}`)
  } else {
    failed += 1
    console.error(`FAIL — ${label}`)
  }
}

// 1. validateEventId
check('validateEventId rejects missing eventId', !validateEventId(undefined).valid)
check('validateEventId rejects non-string eventId', !validateEventId(12345).valid)
check('validateEventId rejects oversized eventId', !validateEventId('x'.repeat(200)).valid)
check('validateEventId accepts a normal eventId', validateEventId('evt_12345').valid)

// 2. validateFingerprint
check('validateFingerprint rejects missing fingerprint', !validateFingerprint(null).valid)
check('validateFingerprint rejects oversized fingerprint', !validateFingerprint('x'.repeat(300)).valid)
check('validateFingerprint accepts a normal fingerprint', validateFingerprint('fp_abcdef').valid)

// 3. assertNoForbiddenClientFields
const forbiddenPayload = { eventId: 'evt_1', success: true, degraded: false, backendConfirmationId: 'fake-id', token: 'abc' }
const forbiddenResult = assertNoForbiddenClientFields(forbiddenPayload)
check('assertNoForbiddenClientFields strips success/degraded/backendConfirmationId/token',
  !('success' in forbiddenResult.sanitized) &&
  !('degraded' in forbiddenResult.sanitized) &&
  !('backendConfirmationId' in forbiddenResult.sanitized) &&
  !('token' in forbiddenResult.sanitized))
check('assertNoForbiddenClientFields keeps eventId', forbiddenResult.sanitized.eventId === 'evt_1')
check('assertNoForbiddenClientFields reports warnings for each forbidden field', forbiddenResult.errors.length === 4)

// 4. reconciliation note/resolve payload validation
check('validateReconciliationNotePayload rejects empty note', !validateReconciliationNotePayload({ note: '' }).valid)
check('validateReconciliationNotePayload rejects oversized note', !validateReconciliationNotePayload({ note: 'x'.repeat(5000) }).valid)
check('validateReconciliationNotePayload accepts a normal note', validateReconciliationNotePayload({ note: 'Looks resolved after manual check.' }).valid)

const resolveResult = validateReconciliationResolvePayload({ staffReason: 'Confirmed via POS receipt #4471', backendConfirmationId: 'client-supplied-fake' })
check('validateReconciliationResolvePayload strips client-supplied backendConfirmationId',
  resolveResult.valid && !('backendConfirmationId' in resolveResult.sanitized))
check('validateReconciliationResolvePayload rejects payload with neither staffReason nor backendConfirmationId',
  !validateReconciliationResolvePayload({}).valid)

// 5. pagination
check('validatePagination rejects negative limit', !validatePagination({ limit: '-5' }).valid)
check('validatePagination caps limit at MAX_LIMIT (500)', validatePagination({ limit: '99999' }).sanitized.limit === 500)
check('validatePagination defaults to 100 when unset', validatePagination({}).sanitized.limit === 100)

// 6. sanitizeAuditMetadata — must strip auth/cookie/password/token/API key fields
const dirtyMetadata = {
  station: 'bar-3',
  authorization: 'Bearer secret-token',
  cookie: 'session=abc123',
  password: 'hunter2',
  apiKey: 'sk_live_xxx',
  resetToken: 'reset-xyz',
  nested: { cardNumber: '4111111111111111' },
  longValue: 'x'.repeat(3000),
}
const sanitizedMetadata = sanitizeAuditMetadata(dirtyMetadata)
check('sanitizeAuditMetadata strips authorization/cookie/password/apiKey/resetToken',
  !('authorization' in sanitizedMetadata.sanitized) &&
  !('cookie' in sanitizedMetadata.sanitized) &&
  !('password' in sanitizedMetadata.sanitized) &&
  !('apiKey' in sanitizedMetadata.sanitized) &&
  !('resetToken' in sanitizedMetadata.sanitized))
check('sanitizeAuditMetadata drops nested objects entirely', !('nested' in sanitizedMetadata.sanitized))
check('sanitizeAuditMetadata truncates oversized string values', sanitizedMetadata.sanitized.longValue.includes('[truncated]'))
check('sanitizeAuditMetadata keeps safe fields', sanitizedMetadata.sanitized.station === 'bar-3')
check('sanitizeAuditMetadata reports wasSanitized:true when fields were dropped', sanitizedMetadata.wasSanitized === true)

// 7. redactSensitiveFields — general-purpose recursive redactor
const dirtyObj = { guestEmail: 'a@b.com', notes: 'ok', card: { cardNumber: '4111' } }
const redacted = redactSensitiveFields(dirtyObj)
check('redactSensitiveFields strips guestEmail', !('guestEmail' in redacted.sanitized))
check('redactSensitiveFields recurses into nested objects', !('cardNumber' in redacted.sanitized.card))
check('redactSensitiveFields keeps non-sensitive fields', redacted.sanitized.notes === 'ok')

console.log(`\n${passed} passed, ${failed} failed`)
if (failed > 0) process.exit(1)
