export function redactSecret(value) {
  if (!value || typeof value !== 'string') return null
  if (value.length <= 8) return '***'
  return value.slice(0, 4) + '***' + value.slice(-2)
}

export function redactDatabaseUrl(url) {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.password) u.password = '***'
    return u.toString()
  } catch { return '[invalid_url]' }
}

export function redactCredential(key, value) {
  if (!value) return { key, status: 'missing', value: null }
  return { key, status: 'redacted', value: redactSecret(value) }
}

export function hasCredential(envKey) {
  return !!process.env[envKey]
}

export function validateCredentialShape(envKey, pattern) {
  const val = process.env[envKey]
  if (!val) return { valid: false, status: 'missing' }
  if (pattern && !pattern.test(val)) return { valid: false, status: 'invalid_shape' }
  return { valid: true, status: 'present' }
}

export function buildCredentialReadinessSummary(credentialKeys) {
  const results = {}
  for (const key of credentialKeys) {
    results[key] = hasCredential(key) ? 'present' : 'missing'
  }
  const missingCount = Object.values(results).filter(v => v === 'missing').length
  return {
    credentials: results,
    missingCount,
    allPresent: missingCount === 0,
    credentialsRequired: missingCount > 0,
  }
}

export function assertNoSecretLeak(obj) {
  const str = JSON.stringify(obj)
  const patterns = ['sk_live_', 'sk_test_', 'whsec_', 'rk_live_', 'rk_test_']
  for (const p of patterns) {
    if (str.includes(p)) throw new Error(`Secret leak detected: ${p} found in response object`)
  }
}
