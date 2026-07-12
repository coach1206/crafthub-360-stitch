/**
 * SmokeCraft Runtime Contract Validator (R9)
 *
 * Converts advisory data contracts into runtime validation.
 * Validates on input, before persistence, on API request, and on API response.
 *
 * Rejects malformed records with a structured error.
 * Never silently coerces dangerous or incompatible data.
 * Contract schemas are versioned.
 */

// ── Schema version ────────────────────────────────────────────────────────────
export const CONTRACT_SCHEMA_VERSION = '1.0.0'

// ── Validation error ──────────────────────────────────────────────────────────

export class ContractValidationError extends Error {
  constructor(contract, field, message, received) {
    super(`[ContractValidation:${contract}] ${field}: ${message}${received !== undefined ? ` (got: ${JSON.stringify(received)})` : ''}`)
    this.name = 'ContractValidationError'
    this.contract = contract
    this.field = field
    this.received = received
  }
}

// ── Primitive validators ──────────────────────────────────────────────────────

function requireString(contract, field, value, { optional = false, minLen = 0 } = {}) {
  if (value == null) {
    if (optional) return
    throw new ContractValidationError(contract, field, 'required string is missing', value)
  }
  if (typeof value !== 'string')
    throw new ContractValidationError(contract, field, 'must be a string', value)
  if (value.length < minLen)
    throw new ContractValidationError(contract, field, `must be at least ${minLen} chars`, value)
}

function requireOneOf(contract, field, value, allowed, { optional = false } = {}) {
  if (value == null && optional) return
  if (!allowed.includes(value))
    throw new ContractValidationError(contract, field, `must be one of [${allowed.join(', ')}]`, value)
}

function requireBoolean(contract, field, value, { optional = false } = {}) {
  if (value == null && optional) return
  if (typeof value !== 'boolean')
    throw new ContractValidationError(contract, field, 'must be a boolean', value)
}

function requireNumber(contract, field, value, { optional = false, min, max } = {}) {
  if (value == null && optional) return
  if (typeof value !== 'number' || isNaN(value))
    throw new ContractValidationError(contract, field, 'must be a number', value)
  if (min !== undefined && value < min)
    throw new ContractValidationError(contract, field, `must be >= ${min}`, value)
  if (max !== undefined && value > max)
    throw new ContractValidationError(contract, field, `must be <= ${max}`, value)
}

function requireArray(contract, field, value, { optional = false } = {}) {
  if (value == null && optional) return
  if (!Array.isArray(value))
    throw new ContractValidationError(contract, field, 'must be an array', value)
}

// ── Contract validators ───────────────────────────────────────────────────────

/**
 * Guest profile submitted at enroll step.
 */
export function validateGuestProfile(data) {
  const c = 'GuestProfile'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'experienceLevel', data.experienceLevel, { optional: true })
  if (data.experienceLevel != null)
    requireOneOf(c, 'experienceLevel', data.experienceLevel, ['first-timer', 'occasional', 'regular', 'unknown'])
  requireArray(c, 'flavorPreferences', data.flavorPreferences, { optional: true })
  requireBoolean(c, 'consentGiven', data.consentGiven)
}

/**
 * Session identity record (created at start of journey).
 */
export function validateSessionIdentity(data) {
  const c = 'SessionIdentity'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'createdAt', data.createdAt, { minLen: 1 })
  requireBoolean(c, 'demo', data.demo, { optional: true })
}

/**
 * Golden Box acknowledgement.
 */
export function validateGoldenBoxData(data) {
  const c = 'GoldenBoxData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireBoolean(c, 'acknowledged', data.acknowledged)
  if (!data.acknowledged)
    throw new ContractValidationError(c, 'acknowledged', 'must be true before proceeding', data.acknowledged)
}

/**
 * Mentor selection.
 */
export function validateMentorSelection(data) {
  const c = 'MentorSelection'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireArray(c, 'selectedMentors', data.selectedMentors)
  if (data.selectedMentors.length < 1 || data.selectedMentors.length > 2)
    throw new ContractValidationError(c, 'selectedMentors', 'must have 1–2 mentors', data.selectedMentors)
}

/**
 * Format (cigar shape/size) selection.
 */
export function validateFormatSelection(data) {
  const c = 'FormatSelection'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'selectedFormat', data.selectedFormat, { optional: true })
}

/**
 * Wrapper and strength selection.
 */
export function validateWrapperStrength(data) {
  const c = 'WrapperStrength'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'wrapperColor', data.wrapperColor, { optional: true })
  requireString(c, 'strengthProfile', data.strengthProfile, { optional: true })
}

/**
 * Seed & Soil pairing intelligence result.
 */
export function validateSeedSoilData(data) {
  const c = 'SeedSoilData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
}

/**
 * Pairing Lab data.
 */
export function validatePairingLabData(data) {
  const c = 'PairingLabData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
}

/**
 * Humidor match result.
 */
export function validateHumidorData(data) {
  const c = 'HumidorData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'source', data.source, { optional: true })
}

/**
 * Purchase request (sent to floor staff).
 */
export function validatePurchaseRequest(data) {
  const c = 'PurchaseRequest'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'requestedAt', data.requestedAt, { minLen: 1 })
}

/**
 * Cut/toast/light preparation choices.
 */
export function validatePreparationSteps(data) {
  const c = 'PreparationSteps'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'cutMethod', data.cutMethod, { optional: true })
  requireString(c, 'toastMethod', data.toastMethod, { optional: true })
  requireString(c, 'lightMethod', data.lightMethod, { optional: true })
}

/**
 * First Third tasting data.
 */
export function validateFirstThirdData(data) {
  const c = 'FirstThirdData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'status', data.status, { minLen: 1 })
  requireString(c, 'source', data.source, { minLen: 1 })
  requireString(c, 'tasteProfileSource', data.tasteProfileSource, { optional: true })
  requireArray(c, 'notesSelected', data.notesSelected, { optional: true })
  requireString(c, 'safeClaim', data.safeClaim, { minLen: 1 })
  requireBoolean(c, 'hasDrawRating', data.hasDrawRating, { optional: true })
}

/**
 * Second Third tasting data.
 */
export function validateSecondThirdData(data) {
  const c = 'SecondThirdData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'status', data.status, { minLen: 1 })
  requireString(c, 'source', data.source, { minLen: 1 })
  requireArray(c, 'notesSelected', data.notesSelected, { optional: true })
  requireString(c, 'safeClaim', data.safeClaim, { minLen: 1 })
}

/**
 * Flavor Memory lock-in.
 */
export function validateFlavorMemoryData(data) {
  const c = 'FlavorMemoryData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireArray(c, 'flavors', data.flavors, { optional: true })
}

/**
 * Final Third tasting data.
 */
export function validateFinalThirdData(data) {
  const c = 'FinalThirdData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'status', data.status, { minLen: 1 })
  requireString(c, 'source', data.source, { minLen: 1 })
  requireArray(c, 'notesSelected', data.notesSelected, { optional: true })
}

/**
 * Scorecard submission.
 */
export function validateScorecard(data) {
  const c = 'Scorecard'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireNumber(c, 'overallScore', data.overallScore, { optional: true, min: 0, max: 100 })
  requireString(c, 'submittedAt', data.submittedAt, { optional: true })
}

/**
 * Final Review data.
 */
export function validateFinalReviewData(data) {
  const c = 'FinalReviewData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
}

/**
 * Passport stamp claim.
 */
export function validatePassportClaim(data) {
  const c = 'PassportClaim'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'claimedAt', data.claimedAt, { minLen: 1 })
  requireBoolean(c, 'saved', data.saved, { optional: true })
}

/**
 * Connections data.
 */
export function validateConnectionsData(data) {
  const c = 'ConnectionsData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
}

/**
 * Management sync payload.
 */
export function validateManagementSyncData(data) {
  const c = 'ManagementSyncData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'syncedAt', data.syncedAt, { optional: true })
}

/**
 * Session completion record.
 */
export function validateSessionCompletion(data) {
  const c = 'SessionCompletion'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'completedAt', data.completedAt, { minLen: 1 })
}

/**
 * POS360 handoff payload.
 */
export function validatePos360Handoff(data) {
  const c = 'Pos360Handoff'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'requestedAt', data.requestedAt, { minLen: 1 })
}

/**
 * E.A.T. sync payload.
 */
export function validateEatSyncData(data) {
  const c = 'EatSyncData'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
}

/**
 * Feature flag record.
 */
export function validateFeatureFlags(data) {
  const c = 'FeatureFlags'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'moduleId', data.moduleId, { minLen: 1 })
  if (!data.flags || typeof data.flags !== 'object')
    throw new ContractValidationError(c, 'flags', 'must be an object', data.flags)
  requireBoolean(c, 'canFakeIntegrationConnection', data.canFakeIntegrationConnection)
  if (data.canFakeIntegrationConnection === true)
    throw new ContractValidationError(c, 'canFakeIntegrationConnection', 'must never be true', true)
}

/**
 * Demo reset payload.
 */
export function validateDemoReset(data) {
  const c = 'DemoReset'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'actorRole', data.actorRole, { minLen: 1 })
  requireBoolean(c, 'isDemoMode', data.isDemoMode, { optional: true })
  requireString(c, 'resetAt', data.resetAt, { minLen: 1 })
  // Demo reset must never include production data targets
  if (data.targetsProductionDb === true)
    throw new ContractValidationError(c, 'targetsProductionDb', 'demo reset must never target production database', true)
}

/**
 * Smoke session record — server API layer shape.
 */
export function validateSmokeSessionRecord(data) {
  const c = 'SmokeSessionRecord'
  if (!data || typeof data !== 'object') throw new ContractValidationError(c, 'root', 'must be an object', data)
  requireString(c, 'sessionId', data.sessionId, { minLen: 1 })
  requireString(c, 'venueId', data.venueId, { optional: true })
  requireNumber(c, 'xp', data.xp, { optional: true, min: 0 })
  // completedSteps may be an array of keys or a numeric count
  if (data.completedSteps !== undefined && data.completedSteps !== null &&
      typeof data.completedSteps !== 'number' && !Array.isArray(data.completedSteps)) {
    throw new ContractValidationError(c, 'completedSteps', 'must be an array or number', data.completedSteps)
  }
}

// ── Safe validate helper (returns error instead of throwing) ─────────────────

/**
 * Wraps a validator function or contract name string.
 * Returns { valid, error } instead of throwing.
 */
export function safeValidate(validatorOrName, data) {
  try {
    if (typeof validatorOrName === 'function') {
      validatorOrName(data)
    } else {
      validateContract(validatorOrName, data)
    }
    return { valid: true, error: null }
  } catch (err) {
    return { valid: false, error: err.message || String(err) }
  }
}

// ── Contract registry ─────────────────────────────────────────────────────────

export const CONTRACT_VALIDATORS = {
  'guest-profile':        validateGuestProfile,
  'session-identity':     validateSessionIdentity,
  'golden-box':           validateGoldenBoxData,
  'mentor-selection':     validateMentorSelection,
  'format':               validateFormatSelection,
  'wrapper-strength':     validateWrapperStrength,
  'seed-soil':            validateSeedSoilData,
  'pairing-lab':          validatePairingLabData,
  'humidor-data':         validateHumidorData,
  'purchase-request':     validatePurchaseRequest,
  'preparation-steps':    validatePreparationSteps,
  'first-third':          validateFirstThirdData,
  'second-third':         validateSecondThirdData,
  'flavor-memory':        validateFlavorMemoryData,
  'final-third':          validateFinalThirdData,
  'scorecard':            validateScorecard,
  'final-review':         validateFinalReviewData,
  'passport-claim':       validatePassportClaim,
  'connections':          validateConnectionsData,
  'management-sync':      validateManagementSyncData,
  'session-completion':   validateSessionCompletion,
  'pos360-handoff':       validatePos360Handoff,
  'eat-sync':             validateEatSyncData,
  'feature-flags':        validateFeatureFlags,
  'demo-reset':           validateDemoReset,
  // Server-layer aliases used by API routes
  'smoke_session':        validateSmokeSessionRecord,
  'scorecard_submission': validateScorecard,
}

export function validateContract(contractName, data) {
  const validator = CONTRACT_VALIDATORS[contractName]
  if (!validator) throw new ContractValidationError(contractName, 'root', 'no validator registered for this contract', contractName)
  validator(data)
}
