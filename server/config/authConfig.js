/**
 * Auth Configuration — Phase 10 (Auth v2)
 *
 * All sensitive values must come from environment variables.
 * In development, safe defaults are used with clear warnings.
 * In production, missing JWT_SECRET causes a hard failure.
 *
 * SECURITY: ALLOW_DEV_FOUNDER is unconditionally false in production
 * regardless of what the .env file says.
 */

const isProd = process.env.NODE_ENV === 'production'
const isDev  = !isProd

if (!process.env.JWT_SECRET) {
  if (isProd) {
    console.error('[FATAL] JWT_SECRET is not set. Server cannot start in production without a real JWT secret.')
    process.exit(1)
  } else {
    console.warn('[auth] ⚠  JWT_SECRET not set — using insecure dev default. Set JWT_SECRET in .env for real testing.')
  }
}

// Hard-block ALLOW_DEV_FOUNDER in production — env var is ignored
const allowDevFounder = isProd ? false : (process.env.ALLOW_DEV_FOUNDER === 'true')

if (isProd && process.env.ALLOW_DEV_FOUNDER === 'true') {
  console.error(
    '[SECURITY] ALLOW_DEV_FOUNDER=true is set but NODE_ENV=production. ' +
    'This flag is unconditionally blocked in production. Remove it from your production .env.'
  )
}

export const authConfig = Object.freeze({
  // ── JWT ──────────────────────────────────────────────────
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-INSECURE-DO-NOT-USE-IN-PRODUCTION',

  // JWT expiry strings (jsonwebtoken format)
  STAFF_JWT_EXPIRES_IN:           process.env.STAFF_JWT_EXPIRES_IN           || '4h',
  ADMIN_JWT_EXPIRES_IN:           process.env.ADMIN_JWT_EXPIRES_IN           || '8h',
  FOUNDER_JWT_EXPIRES_IN:         process.env.FOUNDER_JWT_EXPIRES_IN         || '2h',
  HUMAN_MENTOR_JWT_EXPIRES_IN:    process.env.HUMAN_MENTOR_JWT_EXPIRES_IN    || '6h',
  DEVELOPER_JWT_EXPIRES_IN:       process.env.DEVELOPER_JWT_EXPIRES_IN       || '1h',
  PASSPORT_MEMBER_JWT_EXPIRES_IN: process.env.PASSPORT_MEMBER_JWT_EXPIRES_IN || '14d',

  // JWT expiry ms (cookie maxAge — matches JWT lifetime per role)
  STAFF_JWT_EXPIRES_IN_MS:           4  * 60 * 60 * 1000,
  ADMIN_JWT_EXPIRES_IN_MS:           8  * 60 * 60 * 1000,
  FOUNDER_JWT_EXPIRES_IN_MS:         2  * 60 * 60 * 1000,
  HUMAN_MENTOR_JWT_EXPIRES_IN_MS:    6  * 60 * 60 * 1000,
  DEVELOPER_JWT_EXPIRES_IN_MS:       1  * 60 * 60 * 1000,
  PASSPORT_MEMBER_JWT_EXPIRES_IN_MS: 14 * 24 * 60 * 60 * 1000,

  // Passport Member refresh token (rotation)
  PASSPORT_MEMBER_REFRESH_EXPIRES_IN_MS: 90 * 24 * 60 * 60 * 1000, // 90 days

  // ── Cookie ────────────────────────────────────────────────
  AUTH_COOKIE_NAME:     process.env.AUTH_COOKIE_NAME     || 'novee_auth',
  // In production, Secure must be true. Default to true; only false if explicitly set false in dev.
  AUTH_COOKIE_SECURE:   isProd ? true : (process.env.AUTH_COOKIE_SECURE !== 'false'),
  AUTH_COOKIE_SAMESITE: process.env.AUTH_COOKIE_SAMESITE || 'lax',
  AUTH_COOKIE_PATH:     '/api',

  REFRESH_COOKIE_NAME:  'novee_refresh',

  // ── Lockout ───────────────────────────────────────────────
  MAX_FAILED_ATTEMPTS: parseInt(process.env.MAX_FAILED_ATTEMPTS || '5', 10),
  LOCKOUT_MINUTES:     parseInt(process.env.LOCKOUT_MINUTES     || '15', 10),

  // ── Founder challenge ─────────────────────────────────────
  FOUNDER_CHALLENGE_REQUIRED: true,
  FOUNDER_CHALLENGE_SECRET:   process.env.FOUNDER_CHALLENGE_SECRET || null,

  // ── Dev founder spoof guard ───────────────────────────────
  // UNCONDITIONALLY false in production — env var is ignored in prod.
  ALLOW_DEV_FOUNDER: allowDevFounder,

  // ── Environment ───────────────────────────────────────────
  IS_PRODUCTION: isProd,
  IS_DEV:        isDev,
})
