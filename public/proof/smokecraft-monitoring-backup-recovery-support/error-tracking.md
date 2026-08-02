# Error Tracking — Production Package 5

## What was built
`server/lib/structuredLogger.mjs`'s `logError`/`logCritical` functions are the integration point a real Sentry (or equivalent — Bugsnag, Rollbar) SDK would hook into: every call emits a scrubbed, structured object carrying `event_type`, `severity`, `correlation_id`, and environment — the exact shape a `Sentry.captureException(err, { tags, extra })` call needs. `server/middleware/errorHandler.js` (pre-existing) is the Express error-handling middleware; it now has a clear place to route through `logCritical(EVENT_TYPE.UNHANDLED_EXCEPTION, {...})` before responding.

## Environment separation / release tagging
`environment` field is `process.env.NODE_ENV`. `service: 'smokecraft-360'` distinguishes this app from other NOVEE OS modules in a shared Sentry project. Release/version tagging would use the same `commit`/`buildTimestamp` already exposed by `/api/version` (Package 4's build-manifest identity) — so error events and deployment identity are provably the same source of truth, not independently drifting fields.

## Source-map policy (documented, not yet applied — no live Sentry project to upload to)
Production builds (`vite build`) should upload source maps to Sentry release artifacts and then strip/exclude them from the publicly served `dist/` output (Vite's `build.sourcemap: 'hidden'` + `sentry-cli sourcemaps upload`). Not configured in `vite.config.js` this pass because there is no live Sentry project/auth token to upload to — documented so Package 6/7 (or whoever configures the live account) has the exact next step.

## PII / secret scrubbing
Same scrubbing pipeline as structured logging (`scrubObject`) — error context objects passed to `logError`/`logCritical` are scrubbed before serialization, so a caught exception that happens to include a raw DB URL or token in its `.message` is redacted before it would ever reach an error tracker's ingest endpoint.

## Sampling policy (documented target, not enforced without a live SDK)
- 100% of `error`/`critical` severity events.
- 10% sampling for `warn`-level events once volume justifies it (avoids Sentry free-tier exhaustion).

## Alert thresholds / issue grouping / deployment correlation
Issue grouping: Sentry's default fingerprinting by exception type + top stack frame is sufficient at this scale — no custom grouping rules needed yet. Deployment correlation: tie Sentry releases to the same commit SHA `/api/version` reports. Alert thresholds for elevated error rate are implemented and unit-tested independently of any Sentry account — see `server/lib/alertRules.mjs` (`elevated_5xx_rate`) and `alerts-inventory.md`.

## Honesty statement
No Sentry (or equivalent) account exists in this sandbox. No error was ever actually delivered to a live external error tracker. What is real: the structured event shape, the scrubbing pipeline (unit-tested), and the exact integration point in the codebase where a live SDK call would be added.
