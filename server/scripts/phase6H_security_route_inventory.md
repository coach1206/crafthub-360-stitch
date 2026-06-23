# Phase 6H — Security Route Inventory

Every sync-related backend route created/touched across Phases 6B–6G,
audited for auth, payload risk, sensitive-data exposure, and degraded-mode
honesty. All middleware chains shown are exactly as already mounted —
none were weakened to produce this inventory.

---

## 1. `POST /api/sync/events`
- **Controller:** `postEvents` (`syncController.js`)
- **Auth:** `optionalAuth` (never blocks)
- **Staff/admin required:** No at the route layer — per-event authorization
  inside `authorizeEvent(evt, user)`: events from `STAFF_SOURCE_SYSTEMS`
  require `meetsMinRole(user.role, 'staff')`; events from
  `GUEST_SOURCE_SYSTEMS` (e.g. SMOKECRAFT/PASSPORT) are allowed without auth
  because they're scoped by passportId/sessionId already in the payload.
- **Allowed roles:** staff+ for staff-source events; guest for guest-source events.
- **Guest allowed:** Yes, for guest-source-system events only.
- **Payload accepted:** array/single sync event object(s) — `eventId`,
  `eventType`, `sourceSystem`, `businessActionFingerprint`, arbitrary `payload`.
- **Sensitive fields returned:** No (write endpoint; echoes acceptance status only).
- **Degraded-mode behavior:** Existing Phase 6B DB-unavailable handling (unchanged).
- **Abuse risks:** Unauthenticated client claiming a staff-only `sourceSystem`;
  oversized/malformed `eventId`/`businessActionFingerprint`; client setting
  forbidden truth fields (`success`, `degraded`, etc.) inside `payload`.
- **Mitigation:** Per-event `authorizeEvent` already blocks staff-source
  spoofing (pre-existing, unchanged). Phase 6H adds `validateEventId`/
  `validateFingerprint`/`assertNoForbiddenClientFields` available for this
  controller; wiring into `syncController.js` deferred — see report Section C.

## 2. `POST /api/sync/retry`
- **Controller:** `postRetry`
- **Auth:** `optionalAuth`
- **Staff/admin required:** No (mirrors `/events` trust model).
- **Guest allowed:** Yes, for guest-source events.
- **Payload accepted:** retry request keyed by `eventId`.
- **Sensitive fields returned:** No.
- **Degraded-mode behavior:** Existing Phase 6B handling.
- **Abuse risks:** Oversized/missing `eventId`; retry-storm/replay flooding.
- **Mitigation:** `validateEventId` available; rate-limiting not implemented
  this phase (no existing rate-limit infra in repo — flagged as a gap, not fabricated).

## 3. `GET /api/sync/events`
- **Controller:** `getEvents`
- **Auth:** `requireAuth, requireStaff`
- **Staff/admin required:** Yes (staff minimum).
- **Guest allowed:** No.
- **Payload accepted:** none (query-only).
- **Sensitive fields returned:** Possibly (raw event payloads may include
  guest contact/payment-adjacent fields depending on `sourceSystem`).
- **Degraded-mode behavior:** Existing Phase 6B handling.
- **Abuse risks:** Bulk dump of all events to over-broad staff role; no field redaction.
- **Mitigation:** Route already staff-gated. Field redaction not previously
  implemented — flagged for `syncSecurityResponseService.redactSensitiveFields`.

## 4. `GET /api/sync/events/since/:timestamp`
Same auth/risk profile as #3 (`requireAuth, requireStaff`).

## 5. `GET /api/sync/status`
- **Controller:** `getStatus`
- **Auth:** `requireAuth, requireStaff`
- **Guest allowed:** No.
- **Sensitive fields returned:** No (aggregate counts only).
- **Abuse risks:** Low (no payload, aggregate-only).
- **Mitigation:** Already staff-gated; no change needed.

## 6. `GET /api/sync/events/:eventId`
- **Controller:** `getSyncEventById` (`syncReconciliationController.js`)
- **Auth:** `requireAuth, requireStaff`
- **Guest allowed:** No.
- **Payload accepted:** none; `:eventId` path param.
- **Sensitive fields returned:** Possibly (full event row).
- **Degraded-mode behavior:** `DbUnavailableError` → 503 `{degraded:true}` — honest.
- **Abuse risks:** Oversized/malformed `eventId` path param (no length cap
  before reaching the DB layer).
- **Mitigation:** `validateEventId` available for wiring (Section C of report).

## 7. `GET /api/sync/events/fingerprint/:fingerprint`
Same pattern as #6, keyed by `businessActionFingerprint`. `validateFingerprint` available.

## 8. `GET /api/sync/conflicts`
- **Controller:** `getSyncConflicts`
- **Auth:** `requireAuth, requireStaff`
- **Guest allowed:** No.
- **Payload accepted:** query `requiresManualReview` (boolean-ish string).
- **Sensitive fields returned:** Possibly (conflict event detail).
- **Degraded-mode behavior:** 503 `{degraded:true, data:[]}` — honest, never fakes empty success.
- **Abuse risks:** Unvalidated boolean string parsing (loose `=== 'true'` check).
- **Mitigation:** `normalizeClientBoolean` available to replace ad hoc check.

## 9. `POST /api/sync/conflicts/decision`
- **Controller:** `postConflictDecision`
- **Auth:** `requireAuth, requireStaff`
- **Guest allowed:** No.
- **Payload accepted:** `{event, conflictType, decision, reason, requiresManualReview, safeToAutoResolve}`.
- **Sensitive fields returned:** No.
- **Degraded-mode behavior:** 503 honest.
- **Abuse risks:** Missing `event.eventId` only partially checked (`!event.eventId`,
  no length cap); `reason` unbounded length; staff client could pass
  `requiresManualReview:false`/`safeToAutoResolve:true` to attempt to bypass
  manual review — currently `Boolean()`-coerced and trusted as staff override input.
- **Mitigation:** `validateConflictDecisionPayload` covers eventId + reason
  length; manual-review bypass is an explicit staff decision path (by design,
  since `decision` is an authenticated staff override, not a guest claim) —
  documented, not changed, per "DO NOT redo Phase 6F".

## 10. `POST /api/sync/replay/preview`
- **Controller:** `previewReplayRoute`
- **Auth:** `requireAuth, requireStaff`
- **Guest allowed:** No.
- **Payload accepted:** `{event}`.
- **Sensitive fields returned:** Possibly (event payload echoed in preview).
- **Degraded-mode behavior:** Falls through to generic `serverError` (500) —
  not yet special-cased for `DbUnavailableError` like sibling routes. **Gap.**
- **Abuse risks:** No payload validation; preview must never mutate state
  (confirmed unchanged in `syncReplayServerService.js`, Phase 6F behavior).
- **Mitigation:** `validateReplayPreviewPayload` available; 503-on-degraded
  gap flagged for fix in Section C.

## 11. `POST /api/sync/replay`
- **Controller:** `postReplay`
- **Auth:** `requireAuth, requireStaff`
- **Guest allowed:** No.
- **Payload accepted:** `{eventId}` or `{event, sourceDeviceId}`.
- **Sensitive fields returned:** Possibly.
- **Degraded-mode behavior:** Returns `degraded: result.status === 'backend_unavailable'`
  — derived from service result, not client input. Honest.
- **Abuse risks:** Malformed/missing both `eventId` and `event`; no
  `assertNoForbiddenClientFields` applied to body (client could include
  `backendConfirmationId` etc. — currently ignored because the service only
  reads `eventId`/`event`/`sourceDeviceId` off `req.body`, but not explicitly stripped).
- **Mitigation:** `validateReplayRequestPayload` available; explicit field
  allow-listing recommended (Section C).

## 12. `POST /api/sync/reconciliation/:eventId/note`
- **Controller:** `postReconciliationNote`
- **Auth:** `requireAuth, requireStaff`
- **Guest allowed:** No.
- **Payload accepted:** `{note}`.
- **Sensitive fields returned:** No.
- **Degraded-mode behavior:** 503 honest.
- **Abuse risks:** `note` truthiness-only checked (`!note`), no length cap —
  oversized note could bloat DB row.
- **Mitigation:** `validateReconciliationNotePayload` covers both gaps.

## 13. `POST /api/sync/reconciliation/:eventId/resolve`
- **Controller:** `postReconciliationResolve`
- **Auth:** `requireAuth, requireStaff`
- **Guest allowed:** No.
- **Payload accepted:** `{staffReason, backendConfirmationId}`.
- **Sensitive fields returned:** No.
- **Degraded-mode behavior:** 503 honest.
- **Abuse risks:** `backendConfirmationId` accepted directly from `req.body`
  and passed into `resolveReconciliation()` — this is the single clearest
  "client claims backend truth" risk in the whole stack identified this phase.
- **Mitigation:** `validateReconciliationResolvePayload` strips
  `backendConfirmationId` from its `sanitized` output; controller must stop
  forwarding the raw `req.body.backendConfirmationId` to the store (Section C fix).

## 14. `GET /api/sync/reconciliation/summary`
- **Controller:** `getReconciliationSummaryRoute`
- **Auth:** `requireAuth, requireStaff`
- **Guest allowed:** No.
- **Sensitive fields returned:** No (aggregate).
- **Degraded-mode behavior:** `degraded: summary.degraded` — derived, honest.
- **Abuse risks:** Low.

## 15. `GET /api/sync/audit/logs`
- **Controller:** `getAuditLogsRoute`
- **Auth:** `requireAuth, requireStaff`
- **Guest allowed:** No.
- **Payload accepted:** query `{actionCategory, actionType, limit}`.
- **Sensitive fields returned:** Possibly — `metadata` JSONB on each log row
  (mitigated upstream by Phase 6G's `sanitizeMetadata()`, extended this phase — see report Section G).
- **Degraded-mode behavior:** 503 `{degraded:true, data:[]}` honest.
- **Abuse risks:** Unvalidated `actionCategory` (no allow-list check before
  hitting the store); unbounded `limit`.
- **Mitigation:** `validateAuditLogQuery` covers both.

## 16. `GET /api/sync/audit/events/:eventId/timeline`
Same staff-only/degraded pattern. `validateEventId` + `validateTimelineQuery` available.

## 17. `GET /api/sync/audit/fingerprints/:fingerprint/timeline`
Same pattern, keyed by fingerprint. `validateFingerprint` available.

## 18. `GET /api/sync/audit/actors/:actorId/logs`
- **Auth:** `requireAuth, requireStaff`
- **Abuse risks:** Unbounded `limit`; no length cap on `:actorId`.
- **Mitigation:** `validatePagination` covers limit.

## 19. `GET /api/sync/audit/summary`
- **Auth:** `requireAuth, requireStaff`
- **Sensitive fields returned:** No (aggregate counts only).
- **Degraded-mode behavior:** `degraded: Boolean(summary.degraded)` — honest.

---

## Cross-cutting findings carried into Section C of this phase's report

1. **`backendConfirmationId` client-trust gap** (route 13) — highest-priority fix.
2. **`/api/sync/replay/preview` missing `DbUnavailableError` → 503 mapping** (route 10).
3. No request body field allow-listing on `/api/sync/replay` (route 11).
4. No length caps on `eventId`/`fingerprint` path params before DB calls (routes 6, 7, 16, 17).
5. No `actionCategory` allow-list enforcement before the audit store query (route 15).

All five are addressed additively in this phase without altering any
existing route's auth middleware, response shape, or success-path behavior.
