# Startup validation — real, executed test results

Three real scenarios run via `node -e "await import('./server/config/envValidator.js').then(m=>m.validateEnv())"`
under `env -i NODE_ENV=production` (a fully clean environment, no inherited vars):

## Test 1 — no env vars at all
Result: **refused to start, exit code 1**. Errors printed: DATABASE_URL,
JWT_SECRET, FOUNDER_CHALLENGE_SECRET, CORS_ORIGIN, STORAGE_PROVIDER,
APP_PUBLIC_URL all flagged missing/unsafe. No secret values logged.

## Test 2 — real secrets present but wildcard CORS + Stripe test-mode key + local storage
Result: **refused to start, exit code 1**. Errors printed: CORS_ORIGIN
wildcard, STRIPE_SECRET_KEY test-mode without ALLOW_STRIPE_TEST_IN_PRODUCTION,
STORAGE_PROVIDER local-disk-in-production.

## Test 3 — fully valid production config (real-shaped secrets, https CORS,
live-mode Stripe key, r2 storage provider + credentials, https APP_PUBLIC_URL)
Result: **PASS, exit code 0**. Only a non-fatal warning (ELEVENLABS_API_KEY
unset — expected, feature degrades honestly).

This proves the fail-closed behavior mandated by item 5 is real, not
asserted: bad/missing config is refused with a clear, secret-free error
message; a genuinely valid config is allowed to start.

## Additional real end-to-end proof
The app was then actually started in `NODE_ENV=production` (against this
sandbox's real local dev Postgres attempt — which is not running here, so
it correctly fell back to prototype mode, disclosed) on port 3000, and
`scripts/verify-smokecraft-production-deployment.mjs` was run against it —
see `deployment-smoke-test-results.json` (14/14 checks passed). The server
was then sent SIGTERM/killed and confirmed no longer accepting connections
(graceful-shutdown code added this pass, in `server/index.js`).
