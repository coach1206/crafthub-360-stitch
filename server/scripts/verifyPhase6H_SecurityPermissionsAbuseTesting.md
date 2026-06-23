# Phase 6H — Security, Permissions & Abuse Testing Manual Verification

No jest/vitest exists in this repo (confirmed again this phase). Pure
validation/sanitizer logic is covered by the runnable
`server/scripts/runPhase6HSecurityChecks.js` (26/26 passing, no DB
required). Auth/route/replay-abuse checks below require a live, migrated
Postgres database and a running backend, mirroring Phase 6B–6G's
precedent — they are manual/curl checks, not automated.

## Category 1 — Auth and permission

1. `curl /api/sync/audit/summary` with no cookie/Authorization header —
   confirm 401 `{success:false, message:'Authentication required'}`
   (`authMiddleware.requireAuth`, unchanged).
2. `curl /api/sync/reconciliation/summary` / `/api/sync/conflicts` /
   `/api/sync/audit/logs` with a guest-role session — confirm 403 via
   `requireStaff` (`roleMiddleware.requireRole('staff')`, unchanged).
3. `curl` with a deliberately malformed/expired JWT — confirm 401, not a 500
   or a silent guest fallback (production path of `requireAuth` only allows
   cookie/Bearer JWT or 401 — dev-only headers/guest fallback are hard-blocked
   in production).
4. `curl` with a valid staff JWT — confirm 200 on all 19 inventoried routes.

## Category 2 — Payload abuse

5. `POST /api/sync/reconciliation/:eventId/note` with no `note` — confirm
   400 `"note is required and must be a non-empty string"` via
   `validateReconciliationNotePayload`.
6. Same route with a 5000-character `note` — confirm 400 "note exceeds
   maximum length of 4000 characters".
7. `GET /api/sync/events/:eventId` with a 200-character `:eventId` — confirm
   400 via `validateEventId` (wired into `getSyncEventById`).
8. `POST /api/sync/reconciliation/:eventId/resolve` with body
   `{backendConfirmationId: "fake-id"}` and no `staffReason` — confirm the
   request is rejected (no staffReason present after `backendConfirmationId`
   is stripped by `validateReconciliationResolvePayload`, so the "staffReason
   or backendConfirmationId required" check fails — server logs and operator
   should note this is the intended outcome: a client cannot resolve
   reconciliation by self-supplying a confirmation id).
9. `POST /api/sync/conflicts/decision` with body including
   `{success: true, degraded: false, isStaff: true}` — confirm these are
   silently stripped before reaching `recordConflictDecision` (verify via
   the `sync_audit_logs`/`sync_conflict_decisions` row: no trace of a client
   `success`/`degraded` claim influencing the stored decision).
10. `POST /api/sync/replay` with an empty body `{}` — confirm 400 "either
    eventId or event is required" via `validateReplayRequestPayload`.

## Category 3 — Replay abuse

11. `POST /api/sync/replay` for an `eventId` that does not exist in
    `sync_events` — confirm `{status: 'missing_event'}`, never a fabricated
    `replayed_confirmed`.
12. Replay an event whose `eventId` already exists — confirm
    `conflictType: 'duplicate_event_id'` → `already_processed_no_action`,
    never re-applied.
13. Replay an event whose `businessActionFingerprint` matches an existing
    row under a different `eventId`, for a sensitive `eventType` (Order/
    Checkout/Payment/Stamp/Passport/Ticket/Humidor) — confirm
    `manual_review_required`, not an automatic block or silent allow
    (`isSensitiveEvent()` in `syncConflictResolutionServerService.js`, unchanged).
14. Same fingerprint collision for a non-sensitive `eventType` — confirm
    `server_rejected_duplicate` (auto-blocked, no manual review needed —
    correct per existing Phase 6F logic).
15. `POST /api/sync/replay/preview` — confirm no `sync_events` row is
    mutated (compare `replay_status`/`reconciliation_status` before/after;
    only `sync_audit_logs`/`sync_event_lifecycle` rows are written via
    `auditReplayPreview`).
16. Successful replay — confirm `backendConfirmationId` on the resulting
    `sync_events` row equals the real `event.event_id` returned by
    `recordEvent()`, never a client-supplied value (no request body field is
    ever read into `markReplayConfirmed`'s `confirmationId` argument).

## Category 4 — Audit/security

17. Submit a conflict decision or reconciliation note with a `metadata`
    object containing `authorization`, `cookie`, `password`, `apiKey`,
    `resetToken` keys (if the call site ever forwards arbitrary metadata) —
    confirm `sanitizeAuditMetadata` strips all five before the row is written
    (covered by `runPhase6HSecurityChecks.js`, run with `node
    server/scripts/runPhase6HSecurityChecks.js`).
18. Same with a deeply nested object value — confirm it's dropped entirely,
    not flattened or partially stored.
19. Same with a 3000-character string value — confirm it's truncated to
    2000 characters with a `…[truncated]` suffix, not stored in full.
20. `curl` all 5 `/api/sync/audit/*` routes without auth — confirm 401 on
    every one (no audit route was missed by the `requireStaff` chain).
21. Stop the backend / unset `DATABASE_URL` — confirm `/api/sync/audit/summary`
    returns `{dbAvailable:false, degraded:true, message}`, never a fake
    empty success — unchanged Phase 6G contract, re-verified this phase.

## Category 5 — Frontend

22. `grep -rl "SyncStatusPanel\|SyncConflictReviewPanel\|SyncAuditTimelinePanel" src/`
    — confirm only the component files and `EATCommandHub.jsx` match; no
    guest/SmokeCraft route imports any staff sync panel.
23. With the backend stopped, open the Audit panel and click "Refresh Audit
    Logs" — confirm the health pill shows "Backend Unavailable" (network/DB
    failure) as distinct from "Sign-In Required" (401) or "Staff Access
    Required" (403) — the three states are now visually distinguishable
    (`syncAuditClientService.js`'s `unavailable()` helper, Phase 6H).
24. Confirm no raw JSON appears as the panel's primary view — only behind
    each entry's "Show technical details" toggle (unchanged from Phase 6G,
    re-verified).
25. `grep -n "Fixed\|Recovered\|Fully resolved\|Fully synced\|Fully processed"
    src/components/staff/SyncAuditTimelinePanel.jsx src/components/staff/SyncConflictReviewPanel.jsx
    src/components/staff/SyncStatusPanel.jsx` — confirm no match outside of
    header-comment "what NOT to claim" context.
26. `npm run build` — must pass cleanly.

## Manual checks chosen over automation, and why

Categories 1–4 require a live Express server + Postgres instance bound to
real HTTP sockets and a real JWT issuance flow — running these inside a
Node module-import script (as `runPhase6HSecurityChecks.js` does for pure
validators) would require spinning up the full app, a test database, and
mocking `fetch`/cookies, none of which exist as infrastructure in this repo
today. Per the task's own guidance ("if a runnable script would be brittle
because of module format or environment, document manual checks instead"),
these remain curl/browser-driven manual checks, consistent with every prior
phase's verification approach (6B–6G).
