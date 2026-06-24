/**
 * Founder Admin Env Override — client-side fallback login path.
 *
 * WHY THIS EXISTS:
 * Static-hosting previews (e.g. a Vercel deployment built only from
 * `vercel.json`'s `buildCommand`/`outputDirectory`) ship the Vite-built
 * `dist/` folder only. The real Express backend in `server/` (and its
 * three-factor `/api/auth/founder-login` route) is never deployed there,
 * so every `/api/*` request is caught by the SPA rewrite and returns
 * `index.html` instead of JSON — founder login then always fails, even
 * with the correct email/PIN, on any host that doesn't also run `server/`.
 *
 * This module lets a founder authenticate without a live backend, by
 * comparing submitted email/PIN against two build-time environment
 * variables. It is consumed by AuthContext.loginAdmin() as a path that
 * is tried before the real backend call.
 *
 * REQUIRED ENV VARS (must be set in the hosting provider's dashboard,
 * never committed to source):
 *   VITE_FOUNDER_ADMIN_EMAIL
 *   VITE_FOUNDER_ADMIN_PIN
 *
 * HONEST SECURITY NOTE — read before relying on this in real production:
 * Any `VITE_`-prefixed variable is inlined into the built JS bundle by
 * Vite at build time (that's how client code can read it at all). That
 * means the configured PIN value, once built, is a static string inside
 * the shipped bundle and can be recovered by anyone who downloads it —
 * this is materially weaker than the backend's bcrypt-hashed,
 * rate-limited, three-factor founder login. It is documented here, not
 * hidden, per this project's honest-defaults rule: this file never
 * claims to be a production-grade secret store. Use it only as a
 * stopgap for static previews; once the real backend is deployed
 * alongside the frontend, the backend founder-login path (email + PIN +
 * founder challenge) is the one that should be relied on.
 *
 * No PIN value is ever hardcoded in this file — both values come
 * exclusively from `import.meta.env` at build time.
 */

function readEnv(key, env) {
  const value = env?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * `env` defaults to Vite's `import.meta.env` in real client builds. The
 * parameter exists so Node-side verification scripts (which have no
 * `import.meta.env`) can inject a plain object instead — production
 * call sites never pass it explicitly.
 */
const DEFAULT_ENV = import.meta.env

/** True only if both required env vars are set to non-empty values. */
export function isFounderOverrideConfigured(env = DEFAULT_ENV) {
  return Boolean(readEnv('VITE_FOUNDER_ADMIN_EMAIL', env) && readEnv('VITE_FOUNDER_ADMIN_PIN', env))
}

/**
 * Returns true only if both email and PIN are non-empty AND match the
 * configured env vars exactly (email case-insensitive, PIN exact).
 * Never returns true if either env var is unset — absence of
 * configuration is never treated as a match.
 */
export function verifyFounderOverride(email, pin, env = DEFAULT_ENV) {
  if (!isFounderOverrideConfigured(env)) return false
  const submittedEmail = String(email || '').trim().toLowerCase()
  const submittedPin   = String(pin || '').trim()
  if (!submittedEmail || !submittedPin) return false

  const configuredEmail = readEnv('VITE_FOUNDER_ADMIN_EMAIL', env).toLowerCase()
  const configuredPin   = readEnv('VITE_FOUNDER_ADMIN_PIN', env)

  return submittedEmail === configuredEmail && submittedPin === configuredPin
}

export default { isFounderOverrideConfigured, verifyFounderOverride }
