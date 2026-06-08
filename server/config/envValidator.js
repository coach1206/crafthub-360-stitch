/**
 * Environment Validator — Phase 11
 * Runs on server startup. Logs warnings in development, exits on fatal
 * issues in production. Never exposes secret values in log output.
 */

const isDev  = process.env.NODE_ENV !== 'production'
const isProd = !isDev

export function validateEnv() {
  const warnings = []
  const errors   = []

  // ── Required in production ───────────────────────────────────────────────
  if (isProd) {
    if (!process.env.DATABASE_URL)
      errors.push('DATABASE_URL is not set in production')

    const jwt = process.env.JWT_SECRET || ''
    if (!jwt || jwt === 'dev-jwt-secret-INSECURE-DO-NOT-USE-IN-PRODUCTION')
      errors.push('JWT_SECRET is missing or uses the insecure development default in production')

    if (!process.env.FOUNDER_CHALLENGE_SECRET)
      errors.push('FOUNDER_CHALLENGE_SECRET is not set in production')
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
