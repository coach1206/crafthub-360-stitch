# Production Lockdown — Phase 6H: Security Lockdown, Permissions Validation & Abuse Testing Report

## A. Phase Summary

This phase hardens the Phase 6B–6G sync/reconciliation/replay/audit stack
against unauthorized access, route abuse, bad payloads, fake client truth
claims, unsafe replay requests, metadata leakage, and degraded-mode
confusion — without adding new features or weakening any existing
staff/admin route protection. A pure, side-effect-free request validation
service (`syncRequestValidationService.js`) and a centralized security
response/sanitization service (`syncSecurityResponseService.js`) were
added and wired into the existing reconciliation/audit controllers. The
audit metadata sanitizer was extended to strip auth headers, cookies,
passwords, reset tokens, and API keys in addition to the Phase 6G payment/
PII field list, and to cap oversized metadata values instead of storing
them in full. The single highest-priority finding — `postReconciliationResolve`
forwarding a client-supplied `backendConfirmationId` straight into the
store — was closed: the controller now only ever forwards a staff-authored
`staffReason`, never an echoed client value. Phase 6F's replay/conflict
services were audited against all 10 listed abuse protections and found to
already satisfy them without modification (see Section F).

`npm run build` passed cleanly (1770 modules transformed, 0 errors, only
the pre-existing chunk-size warning). 26/26 pure-function security checks
pass via `node server/scripts/runPhase6HSecurityChecks.js`.

## B. Files Added

- `server/scripts/phase6H_security_route_inventory.md`
- `server/services/syncRequestValidationService.js`
- `server/services/syncSecurityResponseService.js`
- `server/scripts/runPhase6HSecurityChecks.js`
- `server/scripts/verifyPhase6H_SecurityPermissionsAbuseTesting.md`
- `PRODUCTION_LOCKDOWN_PHASE_6H_SECURITY_PERMISSIONS_ABUSE_REPORT.md`

## C. Files Modified (additive only)

- `server/controllers/syncReconciliationController.js` — every handler now
  validates its eventId/fingerprint/payload via
  `syncRequestValidationService.js` before touching the store/service layer,
  returning 400 on validation failure. `postReconciliationResolve` no longer
  forwards `req.body.backendConfirmationId` to `resolveReconciliation()` —
  only the validated `staffReason` is passed through. `previewReplayRoute`
  now maps `DbUnavailableError` to a 503 degraded response (previously fell
  through to a generic 500 — closed gap from the route inventory). All
  existing success-path response shapes, status codes for success cases,
  and exported function signatures are unchanged.
- `server/controllers/syncAuditController.js` — `getAuditLogsRoute`,
  `getEventTimeline`, `getBusinessActionTimelineRoute`, `getActorAuditLogs`
  now validate query params / path params via
  `syncRequestValidationService.js` before querying the store, returning
  400 on invalid `actionCategory`/oversized `eventId`/`fingerprint`/`actorId`/
  out-of-range `limit`. All existing response shapes unchanged.
- `server/services/syncAuditStore.js` — `sanitizeMetadata()` now delegates to
  `syncSecurityResponseService.sanitizeAuditMetadata()` instead of its own
  inline 6-key list, extending coverage to auth/cookie/password/reset-token/
  API-key fields and adding oversized-value truncation. `recordAuditLog`/
  `recordLifecycleStage` callers and the `assertDb()`/`DbUnavailableError`
  contract are unchanged.

## D. Route Inventory + Staff Boundary

`server/scripts/phase6H_security_route_inventory.md` documents all 19
sync-related routes across Phases 6B/6F/6G (method, controller, auth
requirement, guest-allowed, payload, sensitive-field exposure,
degraded-mode behavior, abuse risk, mitigation). Every route outside
`POST /api/sync/events` and `POST /api/sync/retry` (which use the
pre-existing per-event `authorizeEvent()` trust model, unchanged) requires
`requireAuth, requireStaff` — confirmed unchanged by grep against
`syncReconciliationRoutes.js` and `syncAuditRoutes.js` this phase. No route
was downgraded; only validation was added in front of existing handlers.

## E. Request Validation Rules

`syncRequestValidationService.js` (pure, no DB/network calls — verified
independently testable via `runPhase6HSecurityChecks.js`) enforces:
length caps on `eventId` (128) and `businessActionFingerprint` (256);
non-empty/length-capped reconciliation notes (4000) and staff reasons
(4000); required-field checks for conflict decisions, replay
preview/request payloads, and reconciliation resolution; an
`actionCategory` allow-list and pagination cap (500, default 100) for
audit queries. `assertNoForbiddenClientFields()` strips
`success, degraded, mode, backendConfirmationId, replayConfirmedAt,
reconciliationResolvedAt, reconciliationResolvedBy, processedAt,
confirmedAt, staffRole, actorRole, isAdmin, isStaff, permissions, auth,
token` from every reconciliation/conflict/replay payload before it reaches
a controller — these fields are never treated as the request's fault (no
400); they are silently dropped and reported as non-fatal warnings, since a
client round-tripping a value it previously received is not malicious, but
the backend must never re-trust it as truth.

## F. Replay Abuse Protections

Audited `syncReplayServerService.js` and
`syncConflictResolutionServerService.js` against all 10 required
protections — all were already satisfied by the existing Phase 6F
implementation, with no code changes needed:
- Missing eventId → `conflictType: 'local_missing'` → `manual_review_required`, never silently replayed.
- Duplicate eventId → `already_processed_no_action`, never re-applied.
- Duplicate business action for sensitive event types (Order/Checkout/
  Payment/Stamp/Passport/Ticket/Humidor) → `manual_review_required`;
  non-sensitive → `server_rejected_duplicate` (auto-blocked).
- `backendConfirmationId` is only ever set from `recordEvent()`'s real
  return value (`event.event_id`) inside `markReplayConfirmed()` — no
  request body field is read into it anywhere in the replay path.
- `previewReplay()`/`validateReplaySafety()` only call
  `classifyConflict`/`resolveConflict` (read-only classification) — no
  `sync_events` write occurs on the preview path.
- `replayEventPayload()` only marks `replayed_confirmed` after
  `recordEvent()` (the same idempotent Phase 6B write path) actually runs
  and returns a non-duplicate result.
- Manual-review-required and replay-blocked decisions are never bypassed —
  `replayEventPayload()` returns early for both before reaching the write path.

## G. Audit Metadata Sanitization

`syncSecurityResponseService.sanitizeAuditMetadata()` (consumed by
`syncAuditStore.js`'s `sanitizeMetadata()`) now strips, by key-pattern match
(case-insensitive): `cardNumber/cvv/cvc/paymentToken/ssn` (carried over from
Phase 6G), plus new this phase — `password/passwordHash, resetToken,
apiKey, secret, authorization/auth, cookie, sessionToken, token, jwt,
guestEmail, guestPhone`. Any nested object value is dropped entirely
(never partially flattened). String values over 2000 characters are
truncated with a `…[truncated]` suffix rather than stored in full. A
`wasSanitized: true` flag is returned whenever any field was redacted or
truncated, without ever throwing or blocking the underlying audit write —
confirmed by 6 dedicated checks in `runPhase6HSecurityChecks.js` (all passing).

## H. Frontend Safe Failure Behavior

`syncAuditClientService.js`'s `unavailable()` helper now distinguishes three
failure modes using the `{data:null, status}` marker `apiClient.js` already
attaches to 401/403 responses: a 401 surfaces as `authRequired: true` /
"Sign-in required to view audit logs.", a 403 surfaces as `forbidden: true`
/ "Staff access required to view audit logs.", and any other failure
(network/timeout/5xx) remains the existing honest `degraded: true` /
"Audit backend unavailable" shape. `SyncAuditTimelinePanel.jsx`'s health
pill now renders "Sign-In Required" / "Staff Access Required" /
"Degraded" / "Backend Reachable" / "Backend Unavailable" as five visually
distinct states instead of collapsing 401/403/network-down into one
generic "Backend Unavailable" label. `SyncConflictReviewPanel.jsx` and
`SyncStatusPanel.jsx` were reviewed and already report degraded/
backend-unavailable honestly from Phase 6F/earlier work — no changes
needed there.

## I. Abuse Testing Performed

`server/scripts/verifyPhase6H_SecurityPermissionsAbuseTesting.md`
documents 26 checks across five categories (auth/permission, payload
abuse, replay abuse, audit/security, frontend). 26/26 pure-function checks
(validation + sanitization logic) are additionally automated in
`runPhase6HSecurityChecks.js` and pass with no DB required; route-level/
auth/replay-integration checks remain manual curl/browser checks (same
precedent as every prior phase) since this repo has no test harness for
spinning up a live Express+Postgres instance.

## J. Build Result

`npm run build`: **passed cleanly** — 1770 modules transformed, 0 errors,
only the pre-existing chunk-size warning (unrelated to this phase).
`node server/scripts/runPhase6HSecurityChecks.js`: **26/26 passed**.

Grep checks performed and passing:
- `SyncStatusPanel`/`SyncConflictReviewPanel`/`SyncAuditTimelinePanel` are
  imported only by their own component files and `EATCommandHub.jsx`
  (`POSSyncStatusPanel` is a distinct, unrelated POS3 component — confirmed
  by direct inspection, not a false staff-panel leak).
- `requireAuth, requireStaff` present on all 14 reconciliation/audit routes
  (unchanged from Phase 6F/6G).
- No "Fixed"/"Recovered"/"Fully resolved"/"Fully synced"/"Fully processed"
  labels in any staff sync panel outside header-comment "what NOT to claim" context.
- `opsSet`/`opsGet`/`emit(` call counts unchanged (5 each) in
  `kitchenQueueService.js`/`barQueueService.js`/`humidorQueueService.js` —
  Phase 6H touches none of them.

## K. Recommended Next Phase

**Phase 6I — Final Offline/Online Venue-Grade Production Readiness Test
Pass.** Phases 6B–6H have built and progressively hardened the full sync,
reconciliation, replay, audit, and security-validation stack. Phase 6I
should be the final end-to-end readiness pass before this stack is
considered production-grade: a full offline→online transition test across
every POS3 module (kitchen/bar/humidor queues) and the E.A.T. command hub,
confirming no event is lost or duplicated across a real network drop/
reconnect cycle; a multi-device concurrent-write stress pass against the
now-hardened conflict/replay/reconciliation pipeline; a final audit of every
degraded-mode message shown to staff across all six phases for consistency
and honesty; and a signed-off go/no-go checklist covering data integrity,
staff accountability, and security posture as a single venue-grade
production readiness statement.
