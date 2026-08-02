/**
 * Environment Validator — Phase 11, strengthened Production Hardening
 * Phase 1. Runs on server startup. Logs warnings in development, exits
 * on fatal issues in production. Never exposes secret values in log
 * output — only variable names and the reason validation failed.
 */

const isDev  = process.env.NODE_ENV !== 'production'
const isProd = !isDev

// Known-unsafe default/placeholder values that must never reach
// production, regardless of which variable they're assigned to.
const UNSAFE_DEFAULT_VALUES = new Set([
  'changeme', 'change-me', 'default', 'secret', 'password',
  'development', 'dev', 'test', 'test-secret', 'testsecret',
  'localhost', 'insecure', 'placeholder', 'example',
  'dev-jwt-secret-insecure-do-not-use-in-production',
])
const MIN_SECRET_LENGTH = 32

function isUnsafeSecretValue(value) {
  if (!value) return true
  const normalized = value.trim().toLowerCase()
  if (UNSAFE_DEFAULT_VALUES.has(normalized)) return true
  if (value.trim().length < MIN_SECRET_LENGTH) return true
  return false
}

function isValidHttpOrigin(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateEnv() {
  const warnings = []
  const errors   = []

  // ── Required in production — secrets ─────────────────────────────────────
  if (isProd) {
    if (!process.env.DATABASE_URL)
      errors.push('DATABASE_URL is not set in production')

    if (isUnsafeSecretValue(process.env.JWT_SECRET))
      errors.push(`JWT_SECRET is missing, uses a known-unsafe default, or is shorter than ${MIN_SECRET_LENGTH} characters`)

    if (isUnsafeSecretValue(process.env.FOUNDER_CHALLENGE_SECRET))
      errors.push(`FOUNDER_CHALLENGE_SECRET is missing, uses a known-unsafe default, or is shorter than ${MIN_SECRET_LENGTH} characters`)

    if (process.env.SESSION_SECRET && isUnsafeSecretValue(process.env.SESSION_SECRET))
      errors.push(`SESSION_SECRET is set but uses a known-unsafe default or is shorter than ${MIN_SECRET_LENGTH} characters`)

    // ── Production origin ────────────────────────────────────────────────
    const cors = process.env.CORS_ORIGIN
    if (!cors)
      errors.push('CORS_ORIGIN is not set in production')
    else if (cors !== 'true' && !isValidHttpOrigin(cors))
      errors.push('CORS_ORIGIN is set but is not a valid http(s) URL')
    if (cors === '*' || cors === 'true')
      errors.push('CORS_ORIGIN must not be a wildcard in production')

    // ── Cookie configuration ─────────────────────────────────────────────
    // authConfig.js already hard-forces AUTH_COOKIE_SECURE=true in
    // production regardless of this env var, so this is a defense-in-
    // depth check that the operator's own .env reflects reality, not a
    // second source of truth for the actual cookie flag.
    if (process.env.AUTH_COOKIE_SECURE === 'false')
      errors.push('AUTH_COOKIE_SECURE is explicitly set to "false" in production — cookies must be Secure')

    // ── Active external-provider credentials ─────────────────────────────
    // Only required when the corresponding integration is actually
    // enabled — an intentionally-disabled integration must not force a
    // production startup failure (see server/config/paymentProviderConfig.js
    // for the fail-closed, not fail-to-start, pattern this complements).
    if (process.env.STRIPE_SECRET_KEY && isUnsafeSecretValue(process.env.STRIPE_SECRET_KEY))
      errors.push('STRIPE_SECRET_KEY is set but uses a known-unsafe default or is shorter than the minimum safe length')
    if (process.env.STRIPE_WEBHOOK_SECRET && isUnsafeSecretValue(process.env.STRIPE_WEBHOOK_SECRET))
      errors.push('STRIPE_WEBHOOK_SECRET is set but uses a known-unsafe default or is shorter than the minimum safe length')

    // Stripe live-vs-test key mismatch guard — production must not run on
    // test-mode Stripe credentials without an explicit operator override.
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') &&
        process.env.ALLOW_STRIPE_TEST_IN_PRODUCTION !== 'true')
      errors.push('STRIPE_SECRET_KEY is a test-mode key (sk_test_...) in production — set ALLOW_STRIPE_TEST_IN_PRODUCTION=true if this is intentional (e.g. pre-launch staging-as-production), otherwise use a live key')

    // ── Production Package 4 — object storage / deployment-infra checks ──
    if (process.env.STORAGE_PROVIDER === 'local' || !process.env.STORAGE_PROVIDER)
      errors.push('STORAGE_PROVIDER is "local" (or unset) in production — production must use a real object-storage provider (r2/s3), not local-disk media persistence')
    if (process.env.STORAGE_PROVIDER && process.env.STORAGE_PROVIDER !== 'local') {
      if (!process.env.STORAGE_BUCKET) errors.push('STORAGE_BUCKET is not set in production')
      if (!process.env.STORAGE_ACCESS_KEY_ID) errors.push('STORAGE_ACCESS_KEY_ID is not set in production')
      if (!process.env.STORAGE_SECRET_ACCESS_KEY) errors.push('STORAGE_SECRET_ACCESS_KEY is not set in production')
    }

    const appUrl = process.env.APP_PUBLIC_URL
    if (!appUrl) errors.push('APP_PUBLIC_URL is not set in production')
    else if (!isValidHttpOrigin(appUrl) || !appUrl.startsWith('https://'))
      errors.push('APP_PUBLIC_URL must be a valid https:// URL in production')

    const supportedMajors = ['18', '20', '22']
    const nodeMajor = process.versions.node.split('.')[0]
    if (!supportedMajors.includes(nodeMajor))
      errors.push(`Unsupported Node runtime major version "${nodeMajor}" — production requires one of: ${supportedMajors.join(', ')}`)

    if (process.env.SESSION_SECRET && isUnsafeSecretValue(process.env.SESSION_SECRET) === false && process.env.SESSION_SECRET === process.env.JWT_SECRET)
      errors.push('SESSION_SECRET must not equal JWT_SECRET — use independently generated secrets')
  }

  // ── Warnings in all environments ─────────────────────────────────────────
  const cors = process.env.CORS_ORIGIN
  if (isProd && (!cors || cors === '*' || cors === 'true'))
    warnings.push('CORS_ORIGIN is wildcard in production — restrict to your domain for security')

  const cookieSecure = process.env.AUTH_COOKIE_SECURE
  if (isProd && cookieSecure !== 'true')
    warnings.push('AUTH_COOKIE_SECURE is not "true" — auth cookies will not be Secure in production')

  if (!process.env.ELEVENLABS_API_KEY)
    warnings.push('ELEVENLABS_API_KEY not set — mentor voice uses Web Speech API (prototype mode)')

  // ── Dev-only notices ─────────────────────────────────────────────────────
  if (isDev) {
    if (!process.env.JWT_SECRET)
      warnings.push('JWT_SECRET not set — using insecure dev default (never deploy without a real secret)')
    if (!process.env.FOUNDER_CHALLENGE_SECRET)
      warnings.push('FOUNDER_CHALLENGE_SECRET not set — founder login will be disabled')
  }

  // ── Output ───────────────────────────────────────────────────────────────
  if (warnings.length > 0) {
    for (const w of warnings) console.warn(`[EnvValidator] ⚠  ${w}`)
  }

  if (errors.length > 0) {
    for (const e of errors) console.error(`[EnvValidator] ✖  ${e}`)
    if (isProd) {
      console.error('[EnvValidator] Fatal: cannot start in production with the above errors.')
      process.exit(1)
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('[EnvValidator] ✓ Environment configuration OK')
  }
}

// Exported for the security test suite — never exposes secret values,
// only the boolean classification.
export const _internal = { isUnsafeSecretValue, isValidHttpOrigin, MIN_SECRET_LENGTH, UNSAFE_DEFAULT_VALUES }
