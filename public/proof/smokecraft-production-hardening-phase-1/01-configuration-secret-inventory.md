# Configuration and Secret Inventory

No real secret values appear anywhere in this document or any other
proof artifact in this directory — only variable names, purpose, and
classification.

| Variable | Purpose | Required in | Current fallback | Risk if misused | Recommended production behavior | Rotation required | Startup must fail if missing/unsafe |
|---|---|---|---|---|---|---|---|
| `DATABASE_URL` | Postgres connection | prod (required), dev (optional — prototype mode) | none in prod | High — no DB, or wrong DB | Must be set to the real production connection string | Yes, if ever exposed | ✅ Yes (already enforced) |
| `JWT_SECRET` | Signs/verifies auth JWTs | prod (required), dev (insecure default with warning) | `dev-jwt-secret-INSECURE-DO-NOT-USE-IN-PRODUCTION` | Critical — token forgery | 32+ random chars, never the dev default | Yes, before every production deploy | ✅ Yes (strengthened this pass: also rejects short/known-unsafe values) |
| `FOUNDER_CHALLENGE_SECRET` | Founder-tier login challenge | prod (required), dev (feature disabled if unset) | none (feature honestly disabled) | High — founder-tier bypass if weak | 32+ random chars | Yes | ✅ Yes (strengthened this pass) |
| `SESSION_SECRET` | Legacy/Phase 7 session signing | optional | none | Medium if used and weak | 32+ random chars if used at all | Yes, if used | ✅ Yes if set (new this pass — was previously unchecked) |
| `CORS_ORIGIN` | Allowed frontend origin | prod (required), dev (falls back to allow-all with warning) | `true` (dev only) | High — CSRF/data exposure if wildcard in prod | Real `https://` production origin, never `*`/`true` | No | ✅ Yes (strengthened this pass: also rejects malformed URLs) |
| `AUTH_COOKIE_SECURE` | Cookie `Secure` flag | prod (hard-forced true regardless of this var by `authConfig.js`) | `true` unless explicitly `false` | High if cookies sent over plaintext HTTP | `true` | No | ✅ Yes (new this pass: explicit `"false"` now also a startup error, defense-in-depth on top of the hard-coded force) |
| `AUTH_COOKIE_SAMESITE` | Cookie SameSite policy | all | `lax` | Medium (CSRF surface) | `lax` (current default is appropriate for this app's same-site-ish usage) | No | No (config choice, not a secret) |
| `ELEVENLABS_API_KEY` | Real mentor-voice synthesis | optional | unset — honest Web Speech API fallback | Low (feature-availability only) | Set only if real synthesis is desired | Yes, if ever exposed | No — intentionally optional, fails closed to an honest fallback |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | Payment provider (not used by Venue Humidor's own checkout boundary) | optional — only if a Stripe integration is being enabled | unset — honest "not ready" status, never a fake success | Critical if a real, weak/leaked key were set | 32+ chars if set; real Stripe-issued key | Yes, immediately if ever exposed | ✅ Yes if set and unsafe (new this pass) — but startup does NOT require these to be present at all, matching the "disabled integration fails closed, does not force startup failure" requirement |
| `ALLOW_DEV_FOUNDER` | Dev-only founder bypass | dev only | `false` | Critical if honored in prod | Must remain unset/false | No | N/A — already unconditionally hard-blocked in production code regardless of this env var's value |
| `VITE_FOUNDER_ADMIN_EMAIL` / `VITE_FOUNDER_ADMIN_PIN` | Client-bundled fallback founder login for static-only deploys | optional | unset | Documented, intentional tradeoff — bundled into client JS, recoverable by anyone with the build | Only set for static-preview convenience; the real bcrypt-verified server path remains the secure one | Yes, if ever exposed | No (already explicitly documented as non-production-grade in the existing `.env.example`) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Client-safe Stripe publishable key | optional | unset | None (publishable keys are safe to expose by design) | Set only if Stripe UI is enabled | No | No |
| `POS3_PROVIDER_MODE` / `EAT_PROVIDER_MODE` | Integration provider selection | optional | `prototype` | Low — selects a demo/stub provider | Set to the real provider only when actually integrating | No | No (feature flag, not a secret) |
| `VITE_STAFF_DEMO_MODE` | Staff Handoff demo bypass | dev/demo only | `false` | Medium if left true in prod (bypasses real POS3/E.A.T. auth) | Must be `false` in production | No | Not currently enforced by envValidator — see Known Limitations |

## Findings from this pass's discovery sweep

- **No hardcoded secrets found** in `server/` or `src/` (grepped for
  string-literal API keys, JWT secrets, and database credentials —
  only the one documented, disclosed dev-mode JWT fallback string
  exists, and it is already blocked from reaching production by both
  `authConfig.js` and, now, `envValidator.js`).
- **No `.env` file is committed** — confirmed present in `.gitignore`;
  only `.env.example` (placeholders only) is tracked.
- **No secret value is printed in server startup logs** — confirmed by
  this pass's security test suite (§14, reading the live server log).
- **`paymentProviderConfig.js`** already implements a real, honest
  fail-closed readiness pattern for Stripe — not modified this pass,
  only referenced as the existing precedent this pass's env validation
  strengthening is consistent with.
