/**
 * Auth Configuration — Phase 8.5
 *
 * All sensitive values must come from environment variables.
 * In development, safe defaults are used with clear warnings.
 * In production, missing JWT_SECRET causes a hard failure.
 */

const isDev = process.env.NODE_ENV !== 'production'

if (!process.env.JWT_SECRET) {
  if (!isDev) {
    console.error('[FATAL] JWT_SECRET is not set. Server cannot start in production without a real JWT secret.')
    process.exit(1)
  } else {
    console.warn('[auth] ⚠  JWT_SECRET not set — using insecure dev default. Set JWT_SECRET in .env for real testing.')
  }
}

export const authConfig = Object.freeze({
  // ── JWT ──────────────────────────────────────────────────
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-INSECURE-DO-NOT-USE-IN-PRODUCTION',
  STAFF_PIN_EXPIRES_IN:   process.env.STAFF_PIN_EXPIRES_IN   || '4h',
  ADMIN_SESSION_EXPIRES_IN: process.env.ADMIN_SESSION_EXPIRES_IN || '8h',
  FOUNDER_SESSION_EXPIRES_IN: process.env.FOUNDER_SESSION_EXPIRES_IN || '2h',

  // ── Numeric durations (ms) ────────────────────────────────
  STAFF_PIN_EXPIRES_IN_MS:    4  * 60 * 60 * 1000,
  ADMIN_SESSION_EXPIRES_IN_MS: 8  * 60 * 60 * 1000,
  FOUNDER_SESSION_EXPIRES_IN_MS: 2 * 60 * 60 * 1000,

  // ── Cookie ────────────────────────────────────────────────
  AUTH_COOKIE_NAME:     process.env.AUTH_COOKIE_NAME     || 'novee_auth',
  AUTH_COOKIE_SECURE:   process.env.AUTH_COOKIE_SECURE   === 'true',
  AUTH_COOKIE_SAMESITE: process.env.AUTH_COOKIE_SAMESITE || 'lax',
  AUTH_COOKIE_PATH:     '/api',

  // ── Lockout ───────────────────────────────────────────────
  MAX_FAILED_ATTEMPTS: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10),
  LOCKOUT_MINUTES:     parseInt(process.env.LOCKOUT_MINUTES     || '15', 10),

  // ── Founder challenge ─────────────────────────────────────
  FOUNDER_CHALLENGE_REQUIRED: true,
  FOUNDER_CHALLENGE_SECRET:   process.env.FOUNDER_CHALLENGE_SECRET || null,

  // ── Dev founder spoof guard ───────────────────────────────
  // Set ALLOW_DEV_FOUNDER=true in .env to allow x-novee-user-role: founder_level_0 in dev.
  ALLOW_DEV_FOUNDER: process.env.ALLOW_DEV_FOUNDER === 'true',
})
