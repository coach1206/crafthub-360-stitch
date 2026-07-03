/**
 * EPRL — Safe Environment Logger
 * Redacts secrets before logging or returning environment summaries.
 */

const SECRET_PATTERNS = [
  /sk_live_[a-zA-Z0-9]+/g,
  /sk_test_[a-zA-Z0-9]+/g,
  /whsec_[a-zA-Z0-9]+/g,
  /rk_live_[a-zA-Z0-9]+/g,
  /rk_test_[a-zA-Z0-9]+/g,
]

export function redactSecret(value) {
  if (!value || typeof value !== 'string') return '[redacted]'
  let redacted = value
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, '[redacted]')
  }
  return redacted
}

export function redactDatabaseUrl(url) {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.password) parsed.password = '****'
    if (parsed.username) parsed.username = parsed.username
    return parsed.toString()
  } catch {
    return '[invalid_database_url]'
  }
}

export function redactEnvValue(key, value) {
  if (!value) return null
  const sensitiveKeys = [
    'DATABASE_URL','SECRET','KEY','TOKEN','PASSWORD','CREDENTIAL',
    'WEBHOOK','PRIVATE','API_KEY','AUTH',
  ]
  const upper = key.toUpperCase()
  if (sensitiveKeys.some(k => upper.includes(k))) {
    if (upper === 'DATABASE_URL') return redactDatabaseUrl(value)
    return '[redacted]'
  }
  return value
}

export function buildSafeEnvSummary() {
  const relevant = [
    'NODE_ENV','APP_ENV','PORT',
    'DATABASE_URL','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET',
    'RAILWAY_ENVIRONMENT','RENDER','VERCEL','FLY_APP_NAME',
  ]
  const summary = {}
  for (const key of relevant) {
    const raw = process.env[key]
    summary[key] = raw ? redactEnvValue(key, raw) : '[not_set]'
  }
  return summary
}

export function assertNoSecretLeak(obj) {
  const json = JSON.stringify(obj ?? '')
  const patterns = ['sk_live_','sk_test_','whsec_','rk_live_','rk_test_']
  for (const pattern of patterns) {
    if (json.includes(pattern)) {
      throw new Error(`Secret leak detected: value contains ${pattern} pattern`)
    }
  }
  return true
}
