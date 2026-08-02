# Cookie / localStorage Consent

## Real inventory (grepped from `src/`, live in this codebase)
- `localStorage['novee_admin_session']` — strictly necessary (admin session state)
- `localStorage['novee_guest_session']` — strictly necessary (guest identity/session)
- `localStorage['sc_journey_v1']` — preferences/gameplay-state (SmokeCraft journey progress; not marketing/analytics)
- `localStorage['smokecraft_progress']` — preferences/gameplay-state
- `novee_auth` — HttpOnly auth cookie (`AUTH_COOKIE_NAME`, `server/config/authConfig.js`), strictly necessary, not readable by client JS.

## Analytics/marketing cookies
No analytics or marketing cookie/pixel/script was found in the codebase (grepped for common analytics SDK identifiers — none present). This is stated honestly rather than assumed: **no analytics or marketing tracking currently exists in SmokeCraft 360**, so there is nothing to gate behind consent today, but the Consent Center is built to gate any future addition.

## Consent categories (real, server-backed)
`consent_records` (migration 117): `strictly_necessary` (always true, cannot be withdrawn — auth/session), `preferences`, `analytics`, `marketing` — each an explicit boolean, defaulting to `false` unless the caller affirmatively sets `true` (`server/controllers/complianceController.js: setConsent`). No pre-checked nonessential consent exists anywhere in this code path.

## Real code behavior (tested live, see regression-results.md)
- `POST /api/compliance/consent` records a versioned consent row.
- `POST /api/compliance/consent/withdraw` writes a new all-false row and closes out prior consent (`withdrawn_at`) — withdrawal is a real, working operation, not a UI-only toggle.
- `GET /api/compliance/consent` for a subject with no prior consent record returns `null` — i.e. **nonessential storage has no consent to point to until the subject acts**, which is the fail-safe default.

## Known limitation
Front-end enforcement — actually blocking `sc_journey_v1`/`smokecraft_progress` writes until `preferences` consent is granted, and a visible Consent Center UI — is not built in this pass. The server-side consent model and audit trail are real; wiring the client gameplay-state writer to check consent before writing is tracked in `known-limitations.md` and `counsel-review-items.md`.
