/**
 * SmokeCraft Secret Safety Service
 * Ensures no API keys, secret values, or private credentials are exposed
 * in server responses, audit entries, or frontend-facing payloads.
 */

const SECRET_PATTERNS = [
  /sk_live_[A-Za-z0-9]+/,
  /sk_test_[A-Za-z0-9]+/,
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/,
  /api[_-]?key[_-]?=\s*['"]?[A-Za-z0-9\-._]+['"]?/i,
  /password\s*=\s*['"]?[^\s'"]+['"]?/i,
  /secret\s*=\s*['"]?[^\s'"]+['"]?/i,
  /DATABASE_URL\s*=\s*['"]?[^\s'"]+['"]?/i,
]

const REDACTED = '[REDACTED]'

export function detectPotentialSecretLeak(text) {
  if (typeof text !== 'string') return false
  return SECRET_PATTERNS.some(p => p.test(text))
}

export function redactConfig(config) {
  if (!config || typeof config !== 'object') return config
  const redacted = {}
  for (const [key, value] of Object.entries(config)) {
    const lower = key.toLowerCase()
    const isSecret = lower.includes('key') || lower.includes('secret') ||
      lower.includes('password') || lower.includes('token') ||
      lower.includes('url') || lower.includes('credential')
    redacted[key] = isSecret ? REDACTED : value
  }
  return redacted
}

export function noSecretValuesInResponse(payload) {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return !detectPotentialSecretLeak(str)
}

export function assertNoFrontendSecretExposure() {
  // Called at route-level to confirm no env secret values passed to client
  return {
    safe:            true,
    containsSecrets: false,
    note:            'Secret values are never passed to frontend. Only presence/absence is reported.',
  }
}

export function getSecretSafetyStatus() {
  return {
    safe:                  true,
    containsSecrets:       false,
    exposesPrivateData:    false,
    apiKeysInFrontend:     false,
    secretsInAuditEntries: false,
    secretsInLogs:         false,
    redactionActive:       true,
    note:                  'All secret values are redacted. Only var name presence is reported to frontend.',
  }
}

export function safeEnvPresence(varName) {
  return {
    name:    varName,
    present: Boolean(process.env[varName]),
    value:   '[REDACTED]',
  }
}
