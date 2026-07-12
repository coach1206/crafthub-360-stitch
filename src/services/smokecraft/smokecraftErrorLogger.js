/**
 * SmokeCraft Structured Error Logger (R19)
 *
 * Captures frontend exceptions, React error-boundary events, API errors,
 * rejected contract validations, unauthorized access attempts, rate-limit
 * events, and provider failures.
 *
 * Privacy constraints:
 *   - Never log PII (names, emails, phone numbers, payment card data)
 *   - Never log passport member IDs in plain form — hash before logging
 *   - Never log session tokens, JWT payloads, or auth credentials
 *   - Log only structural context: route, role, contract name, error code
 *
 * Log levels: debug | info | warn | error | critical
 *
 * In production, ships entries to POST /api/smokecraft/error-log.
 * In development, writes to console only.
 */

// ── Constants ────────────────────────────────────────────────────────────────

export const LOG_LEVEL = Object.freeze({
  DEBUG:    'debug',
  INFO:     'info',
  WARN:     'warn',
  ERROR:    'error',
  CRITICAL: 'critical',
})

export const LOG_CATEGORY = Object.freeze({
  FRONTEND_EXCEPTION:  'frontend_exception',
  ERROR_BOUNDARY:      'error_boundary',
  API_ERROR:           'api_error',
  CONTRACT_REJECTED:   'contract_rejected',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  RATE_LIMIT:          'rate_limit',
  PROVIDER_FAILURE:    'provider_failure',
  NAVIGATION:          'navigation',
  FEATURE_FLAG:        'feature_flag',
})

const IS_PROD = typeof process !== 'undefined'
  ? process.env.NODE_ENV === 'production'
  : false

const ENDPOINT = '/api/smokecraft/error-log'

// ── PII scrubber ─────────────────────────────────────────────────────────────

const PII_KEYS = new Set([
  'name', 'email', 'phone', 'password', 'token', 'jwt',
  'authorization', 'card', 'cvv', 'ssn', 'dob', 'address',
  'passportMemberId', 'userId', 'memberId',
])

function scrubPii(obj, depth = 0) {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(v => scrubPii(v, depth + 1))
  const clean = {}
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase()
    if (PII_KEYS.has(lower) || [...PII_KEYS].some(p => lower.includes(p))) {
      clean[k] = '[REDACTED]'
    } else {
      clean[k] = scrubPii(v, depth + 1)
    }
  }
  return clean
}

// ── Entry builder ────────────────────────────────────────────────────────────

let _sequenceId = 0

function buildEntry({
  level,
  category,
  message,
  route = null,
  role = null,
  contractName = null,
  errorCode = null,
  provider = null,
  context = null,
  originalError = null,
}) {
  _sequenceId += 1
  return {
    id:          `sc-log-${Date.now()}-${_sequenceId}`,
    timestamp:   new Date().toISOString(),
    level,
    category,
    message:     String(message || '').slice(0, 500),
    route:       route || (typeof window !== 'undefined' ? window.location?.pathname : null),
    role:        role || null,
    contractName: contractName || null,
    errorCode:   errorCode || null,
    provider:    provider || null,
    context:     context ? scrubPii(context) : null,
    stack:       originalError?.stack?.split('\n').slice(0, 8).join('\n') || null,
  }
}

// ── Transport ────────────────────────────────────────────────────────────────

const _buffer = []
let _flushTimer = null

function consoleWrite(entry) {
  const prefix = `[SmokeCraft ${entry.level.toUpperCase()}][${entry.category}]`
  if (entry.level === LOG_LEVEL.CRITICAL || entry.level === LOG_LEVEL.ERROR) {
    console.error(prefix, entry.message, entry)
  } else if (entry.level === LOG_LEVEL.WARN) {
    console.warn(prefix, entry.message, entry)
  } else {
    console.log(prefix, entry.message, entry)
  }
}

async function flushToServer() {
  if (_buffer.length === 0) return
  const batch = _buffer.splice(0, _buffer.length)
  try {
    await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries: batch }),
    })
  } catch {
    // swallow — logging must never crash the app
  }
}

function scheduleFlush() {
  if (_flushTimer) return
  _flushTimer = setTimeout(() => {
    _flushTimer = null
    flushToServer()
  }, 2000)
}

function emit(entry) {
  if (!IS_PROD) {
    consoleWrite(entry)
    return
  }
  // Production: buffer + batch flush
  _buffer.push(entry)
  scheduleFlush()
  // Critical events flush immediately
  if (entry.level === LOG_LEVEL.CRITICAL) {
    clearTimeout(_flushTimer)
    _flushTimer = null
    flushToServer()
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Log a frontend JavaScript exception (window.onerror, try/catch, etc.)
 */
export function logFrontendException(error, { route, role, context } = {}) {
  emit(buildEntry({
    level:    LOG_LEVEL.ERROR,
    category: LOG_CATEGORY.FRONTEND_EXCEPTION,
    message:  error?.message || String(error),
    route, role, context,
    originalError: error instanceof Error ? error : null,
  }))
}

/**
 * Log a React error boundary event (componentDidCatch).
 */
export function logErrorBoundary(error, errorInfo, { route, role } = {}) {
  emit(buildEntry({
    level:    LOG_LEVEL.CRITICAL,
    category: LOG_CATEGORY.ERROR_BOUNDARY,
    message:  error?.message || 'React error boundary triggered',
    route, role,
    context:  { componentStack: String(errorInfo?.componentStack || '').slice(0, 500) },
    originalError: error instanceof Error ? error : null,
  }))
}

/**
 * Log an API response error.
 */
export function logApiError(endpoint, status, message, { role, provider, context } = {}) {
  emit(buildEntry({
    level:     status >= 500 ? LOG_LEVEL.ERROR : LOG_LEVEL.WARN,
    category:  LOG_CATEGORY.API_ERROR,
    message:   `API ${status} on ${endpoint}: ${message}`,
    errorCode: String(status),
    provider, role, context,
  }))
}

/**
 * Log a contract validation rejection.
 */
export function logContractRejected(contractName, field, received, { role, route } = {}) {
  emit(buildEntry({
    level:        LOG_LEVEL.WARN,
    category:     LOG_CATEGORY.CONTRACT_REJECTED,
    message:      `Contract "${contractName}" rejected — field "${field}"`,
    contractName, role, route,
    context:      { field, receivedType: typeof received },
  }))
}

/**
 * Log an unauthorized access attempt.
 */
export function logUnauthorizedAccess(route, requiredRole, actualRole) {
  emit(buildEntry({
    level:    LOG_LEVEL.WARN,
    category: LOG_CATEGORY.UNAUTHORIZED_ACCESS,
    message:  `Unauthorized: ${actualRole || 'none'} tried to access ${route} (requires ${requiredRole})`,
    route,
    role:     actualRole,
    context:  { requiredRole, actualRole },
  }))
}

/**
 * Log a rate-limit event.
 */
export function logRateLimit(endpoint, { role, context } = {}) {
  emit(buildEntry({
    level:     LOG_LEVEL.WARN,
    category:  LOG_CATEGORY.RATE_LIMIT,
    message:   `Rate limit hit on ${endpoint}`,
    errorCode: '429',
    role, context,
  }))
}

/**
 * Log an external provider failure (POS360, E.A.T., humidor, payment, etc.)
 */
export function logProviderFailure(provider, operation, error, { role, context } = {}) {
  emit(buildEntry({
    level:    LOG_LEVEL.ERROR,
    category: LOG_CATEGORY.PROVIDER_FAILURE,
    message:  `Provider "${provider}" failed on "${operation}": ${error?.message || error}`,
    provider, role, context,
    originalError: error instanceof Error ? error : null,
  }))
}

/**
 * Log a feature flag change for audit trail.
 */
export function logFeatureFlagChange(flagKey, oldValue, newValue, { role, reason } = {}) {
  emit(buildEntry({
    level:    LOG_LEVEL.INFO,
    category: LOG_CATEGORY.FEATURE_FLAG,
    message:  `Feature flag "${flagKey}" changed: ${oldValue} → ${newValue}`,
    role,
    context:  { flagKey, oldValue, newValue, reason },
  }))
}

/**
 * Generic structured log entry — use when no specific helper applies.
 */
export function log(level, category, message, extras = {}) {
  emit(buildEntry({ level, category, message, ...extras }))
}

/**
 * Install a global window.onerror handler that routes to logFrontendException.
 * Call once at app startup. Safe to call multiple times (idempotent).
 */
let _globalHandlerInstalled = false
export function installGlobalErrorHandler({ role } = {}) {
  if (_globalHandlerInstalled || typeof window === 'undefined') return
  _globalHandlerInstalled = true

  window.addEventListener('error', (event) => {
    logFrontendException(event.error || new Error(event.message), {
      route: window.location?.pathname,
      role,
      context: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    const err = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    logFrontendException(err, {
      route: window.location?.pathname,
      role,
      context: { type: 'unhandledrejection' },
    })
  })
}
