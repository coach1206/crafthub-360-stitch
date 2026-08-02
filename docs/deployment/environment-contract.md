# SmokeCraft 360 — Environment Variable Contract (Production Package 4)

Canonical inventory. Redacted example values only — never commit real secrets.
Enforced by `server/config/envValidator.js` (fails closed in production) and
`server/services/venueManagement/objectStorageAdapter.js::assertProductionStorageSafe()`.

| Variable | Purpose | Required in | Secret? | Validation rule | Example | Default policy | Rotation | Failure behavior |
|---|---|---|---|---|---|---|---|---|
| NODE_ENV | Runtime mode | all | no | one of development/test/production | production | none | n/a | wrong value changes which checks below fire |
| APP_PUBLIC_URL | Canonical public URL of this deployment | staging, production | no | https:// URL | https://smokecraft.example.com | none | n/a | prod refuses to start if missing/http |
| PORT | HTTP listen port | all | no | integer | 3000 | 3000 | n/a | falls back to default |
| DATABASE_URL | Postgres connection string | staging, production | yes | valid postgres:// URI, TLS in prod | postgres://user:pass@host:5432/db | none (prototype mode in dev) | on suspected exposure | prod refuses to start if missing |
| JWT_SECRET | Session/auth token signing | staging, production | yes | ≥32 chars, not a known placeholder | (openssl rand -hex 32) | none | every 90 days or on exposure | prod refuses to start |
| FOUNDER_CHALLENGE_SECRET | Founder-tier login challenge | staging, production | yes | ≥32 chars, not placeholder | (openssl rand -hex 32) | none | every 90 days or on exposure | prod refuses to start |
| SESSION_SECRET | Legacy session signing (Phase 7) | optional | yes | ≥32 chars if set, ≠ JWT_SECRET | (openssl rand -hex 32) | none | on exposure | prod refuses to start if unsafe |
| CORS_ORIGIN | Allowed frontend origin(s) | staging, production | no | https:// URL, never `*`/`true` | https://smokecraft.example.com | none | n/a | prod refuses to start if wildcard/missing |
| AUTH_COOKIE_SECURE | Force Secure cookie flag | production | no | must be `true` | true | true (hard-forced in prod code) | n/a | warns if not true |
| STRIPE_SECRET_KEY | Stripe server key | staging, production (if payments enabled) | yes | starts sk_live_/sk_test_, ≥32 chars | sk_live_xxx | unset = payments honestly "unavailable" | on exposure, immediately | prod refuses test key unless ALLOW_STRIPE_TEST_IN_PRODUCTION=true |
| STRIPE_WEBHOOK_SECRET | Stripe webhook signature verification | with STRIPE_SECRET_KEY | yes | starts whsec_, ≥32 chars | whsec_xxx | unset = webhook route rejects all events | on exposure | prod refuses to start if set-but-weak |
| VITE_STRIPE_PUBLISHABLE_KEY | Stripe client key | staging, production | no (publishable) | starts pk_ | pk_live_xxx | none | n/a | client payment UI disabled if unset |
| ALLOW_STRIPE_TEST_IN_PRODUCTION | Explicit override for test-mode Stripe key in prod | optional | no | boolean | false | false | n/a | n/a |
| STORAGE_PROVIDER | Object storage backend | staging, production | no | `r2`\|`s3`, never `local` in prod | r2 | `local` (dev only) | n/a | prod refuses to start on `local` |
| STORAGE_BUCKET | Bucket name | staging, production | no | non-empty string | smokecraft-prod-media | none | n/a | prod refuses to start if unset |
| STORAGE_REGION | Bucket region | staging, production | no | string | auto | auto | n/a | n/a |
| STORAGE_ENDPOINT | S3-compatible endpoint (R2) | staging, production (r2) | no | https:// URL | https://<acct>.r2.cloudflarestorage.com | none | n/a | n/a |
| STORAGE_ACCESS_KEY_ID | Storage credential | staging, production | yes | non-empty | AKIA... | none | every 180 days or on exposure | prod refuses to start if unset |
| STORAGE_SECRET_ACCESS_KEY | Storage credential | staging, production | yes | non-empty | (redacted) | none | every 180 days or on exposure | prod refuses to start if unset |
| STORAGE_CDN_URL | Public CDN domain in front of bucket | recommended production | no | https:// URL | https://media.smokecraft.example.com | falls back to app-proxied URL | n/a | n/a |
| STORAGE_KEY_PREFIX | Env namespace for object keys | staging, production | no | string, e.g. `staging`/`production` | production | derived from NODE_ENV | n/a | n/a |
| ELEVENLABS_API_KEY | Mentor voice synthesis | optional | yes | non-empty | (redacted) | unset = Web Speech fallback | on exposure | none — feature degrades honestly |
| DEPLOY_HEALTH_URL | Target for deploy scripts' post-deploy health check | deploy-time only | no | https:// URL | https://staging.smokecraft.example.com | unset = check skipped | n/a | n/a |
| RAILWAY_GIT_COMMIT_SHA / VERCEL_GIT_COMMIT_SHA / GIT_COMMIT_SHA | Build identity | build-time | no | git sha | (auto-set by platform) | falls back to local git | n/a | prod build refuses if none resolvable |

No real secret values exist in this repository at any commit — `.env` is gitignored, `.env.example` ships only blank/placeholder fields.
