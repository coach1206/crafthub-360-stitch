# Structured Logging — Production Package 5

Module: `server/lib/structuredLogger.mjs`. Extends (does not duplicate) `server/utils/safeEnvironmentLogger.js` from earlier phases — that module still owns env-summary redaction for `/api/version`-adjacent debug output; this module is the general-purpose event logger used across request handlers/services.

## Format
Single-line JSON per event:
```json
{"timestamp":"2026-08-02T16:40:35.513Z","environment":"development","service":"smokecraft-360","severity":"info","event_type":"startup","route":"/x","correlation_id":"corr_1","venue_id":"v1"}
```
Fields: `timestamp`, `environment`, `severity` (debug/info/warn/error/critical), `service`, `event_type`, plus context (`route`, `correlation_id`, `actor_id`, `venue_id`, `order_id`, `payment_session_id`, `outcome`, `duration_ms`) as relevant to the event.

## Event types covered (`EVENT_TYPE` export)
startup, shutdown, auth_failure, authz_failure, venue_isolation_failure, inventory_mutation, order_transition, payment_transition, webhook_processing, refund, dispute, media_upload, media_processing, passport_claim, golden_box_lifecycle, background_job, deployment, unhandled_exception, db_failure, storage_failure, rate_limit, backup, restore, support_action.

## Never logged (enforced by `scrubValue`/`SECRET_KEY_PATTERN` + `SECRET_VALUE_PATTERNS`)
Passwords, full card numbers (13–19 digit PAN pattern), Stripe secret/restricted/webhook/publishable keys, JWTs/bearer tokens, Postgres connection-string credentials, any 32+ char hex string (covers most raw secrets/session tokens), any field whose key matches `password|secret|token|api_key|private_key|authorization|webhook_secret|card_number|cvv|cvc|ssn|db_url|database_url|connection_string`.

## Allowlisted operational identifiers
`actor_id`, `venue_id`, `order_id`, `payment_session_id`, `correlation_id`, `customer_id`, `card_last4`, `email` — required by the mandate to be present for support/reconciliation, deliberately exempted from the generic secret-key regex.

## Real verification (this pass)
`node scripts/test-smokecraft-monitoring-recovery-support.mjs` — 17/17 tests passed, including:
- Stripe secret key scrubbed
- Stripe webhook secret scrubbed
- JWT-shaped bearer token scrubbed
- password field scrubbed regardless of casing
- nested DB connection string with credentials scrubbed
- allowlisted operational IDs pass through unredacted
- correlation IDs unique per call
- `logEvent` emits all required structured fields
- `logEvent` scrubs secrets even inside a free-text error message

Full output: `unit-test-output.log` in this directory.
