# SmokeCraft MVP2 — Final Closeout (Phase 12)

Status as of commit `85e70fb7` → Phase 12 (this document's commit). This is the
honest, final status report for SmokeCraft as NOVEE's first CraftHub vertical
proof-of-concept. It is written to be read by a founder or engineer who needs
to know exactly what is real, what is demo, and what is not yet built —
without marketing language.

## Executive summary

SmokeCraft is a complete, working **prototype** of a guided cigar-lounge
session: route flow, scorecard, winner categories, event challenge,
leaderboard, POS3 purchase handoff, and E.A.T. operational handoff are all
built, wired, and tested end-to-end against a real (if currently
in-memory-only) backend. Every honesty constraint NOVEE requires — no fake
purchases, no fake inventory, no fake shared leaderboard, no fake backend
success — has been verified by direct endpoint testing, not just code review.

**It is not production-ready.** The backend route layer exists and responds
correctly, but it has no Postgres connection in any environment tested so
far, no auth/role enforcement, and no demo-mode write blocking. Those are
deliberate, documented gaps — not oversights — because closing them requires
real infrastructure/deployment decisions (a live `DATABASE_URL`, a decision
about how guest sessions authenticate) that this phase was not authorized to
make silently.

## What SmokeCraft MVP2 now does

A guest can: enroll, pick a format, learn origins/leaves, run the three-third
tasting flow, submit a scorecard, see honest winner-category progress (no
category is ever marked "earned" without real scoring data), create a
purchase intent, see that intent sit in `unverified` until POS3 staff
manually mark it verified or rejected, see the result in the Event Challenge
page, and see themselves on a real-session leaderboard card that is kept
visually and structurally separate from the demo community board.

## Routes completed

All `/smokecraft/*` routes audited in Phase 11 are live: `/smokecraft`,
`scorecard`, `event-challenge`, `leaderboard`, `format`, `seed-soil`,
`origins`, `leaves`, `first-third`, `second-third`, `final-third`,
`golden-box` (+ `golden-box/status`), `humidor-match`, `request-purchase`,
`cut-toast-light`, `session-complete`, plus 19 additional supporting routes
(enroll, art, mentor-selection, curation, leaf-challenge*, cultivation,
blend, flavor-dna, pairing, available, assistant, terroir,
pairing-mastery, vitola, identity, passport-stamp, connections,
management-sync). No dead routes, no dead CTAs as of Phase 11's fixes.

## Core components completed

- `Scorecard.jsx` / `AdvancedScorecardPanel.jsx` — rating capture and
  computed final score.
- `WinnerCriteriaPanel.jsx` / `WinnerCategoryCard.jsx` — honest
  pending/eligible/locked/earned category state, never auto-earned.
- `EventChallenge.jsx` — reads real session state, shows backend/storage
  status, drives purchase-intent creation.
- `Leaderboard.jsx` — real-session card (separate, honestly labeled) +
  **"Demo Lounge Ranking"** community board with a visible DEMO badge
  (relabeled in Phase 11 from the ambiguous "Tonight's Ranking").
- `SmokeBackendReadinessPanel.jsx` — shows live route/storage status,
  never claims `venue_shared` unless `storageMode === 'postgres'`.

## Services completed

- `smokeWinnerService.js`, `smokeLeaderboardService.js` — scoring/ranking
  logic, no fake winner assignment.
- `smokePOSHandoffService.js` — purchase intent → POS3 verify/reject →
  reward-eligibility gate. Reward eligibility is set **only** by the
  `verified` status path, never client-side.
- `smokeSharedStorageService.js` — local-fallback-first adapter; fires
  background remote sync attempts; logs `*_SUCCEEDED` events only on real
  `ok:true` responses (Phase 10B); logs
  `SMOKECRAFT_BACKEND_MEMORY_FALLBACK_ACTIVE` whenever a successful
  response reveals in-memory storage.
- `smokeBackendApiClient.js` — thin fetch wrapper, propagates
  `{ ok, status, storageMode, data, error }` verbatim from the server.

## Server routes completed

`server/routes/smokecraftRoutes.js` and `server/routes/smokecraftEatRoutes.js`
implement sessions, session events, purchase intents, POS3 verify/reject,
E.A.T. handoffs, leaderboard, inventory-impact preview (always
`applied: false`), and audit events. The pre-existing pairing-order route
(`server/routes/smokecraftOrders.js`) is untouched and still works
(verified by direct curl test in Phase 11 and again in Phase 12 — see
Backend/API status below).

## Database schema/migration status

`server/db/migrations/011_smokecraft_schema.sql` exists and defines the
`smoke_*` tables, **but this repo has no migration runner** — the file is
not auto-applied to any database. It must be run manually against a real
Postgres instance before Postgres mode can ever engage. As of this closeout,
it has not been applied in any environment this work was done in.

## Local fallback vs memory_fallback vs persistent backend

Three distinct states exist and are never confused in the code or UI:

1. **Local fallback** — the browser's own `localStorage`. Always available,
   always the baseline. Survives backend or network failure.
2. **memory_fallback** — the *server* is reachable and the SmokeCraft routes
   respond with `ok: true`, but the server has no `DATABASE_URL` (or the
   `smoke_*` tables aren't present), so it is holding data in a JS object in
   server process memory. This data is lost on server restart and is not
   shared across server instances. This is the state of every environment
   this project has been tested in so far.
3. **postgres / venue_shared** — the server has a working `DATABASE_URL` and
   the migration has been applied, so `storageMode` comes back `"postgres"`.
   **This has never been observed in this project.** No code path reports
   `venue_shared` unless this is independently confirmed by the server.

## What is real

- The route shell, scorecard math, winner-category state machine, POS3
  verify/reject gate, and E.A.T. visibility are all real, working logic
  against a real (if in-memory) server.
- The honesty chain (`storageMode` → `getSmokeSharedStorageMode()` →
  readiness panel labels) is real and was verified by direct testing, not
  just inspection.

## What is demo

- The "Demo Lounge Ranking" community leaderboard board (mock names/XP,
  clearly labeled, never presented as live shared data).

## What is local-only

- Every guest's own session snapshot, purchase intents, and leaderboard
  entry until/unless a real Postgres-backed deployment exists. Currently
  this is **all** of it.

## What is memory-fallback

- Every backend write/read this project has ever produced, in every
  environment tested, because no environment has had `DATABASE_URL` set.

## What is still pending

- Auth/role middleware on all SmokeCraft/E.A.T. routes (none of them check
  who is calling).
- Demo-mode backend write blocking (demo sessions can currently write real
  backend records).
- Founder/admin-only protection on `GET /api/smokecraft/audit-events`.
- Postgres deployment (migration has never been applied anywhere).
- Real inventory deduction (preview endpoint always returns
  `applied: false` by design).
- Real payment/POS provider integration (purchase intents are
  staff-attested, not payment-processed).

## Known security/auth gaps

Identical to the Phase 10B audit, still true: any caller can hit
`/verify`, `/reject`, and `/audit-events` with no authentication. The UI
gates these behind page-level access (POS3 terminal, admin dashboard) but
the API does not enforce it. **Not closed this phase** — closing it
requires deciding how an anonymous guest session authenticates against the
existing `novee_auth` cookie scheme, which is a real design decision, not a
default-safe change to make without sign-off.

## Known image asset gaps

None found in the Phase 11 audit. Every background and cigar-format image
referenced by SmokeCraft pages exists on disk under
`public/assets/smokecraft/cropped/` and `public/assets/smokecraft/cigars/`.
No placeholder/broken/missing image paths are in use.

## Known inventory/payment gaps

- Inventory: preview-only, `applied: false` always, no real inventory
  service connected.
- Payment: no payment/POS provider is integrated anywhere in SmokeCraft.
  "Purchase verification" means a POS3 staff member manually attests a
  purchase happened — it is not a payment transaction of any kind.

## What must not be claimed as live yet

- "Shared venue storage" / "shared leaderboard" / "real-time multi-device
  sync" — none of these are true in any tested environment.
- "Secure" / "authenticated" purchase verification — it is not auth-gated.
- "Live inventory" or "automatic inventory deduction" — does not exist.
- "Payment processing" or "POS integration" in the payment-provider sense —
  does not exist.

## Final MVP2 acceptance checklist

- [x] Route shell complete, no dead tiles/CTAs (Phase 11)
- [x] Scorecard + winner-category logic honest, no fake winners
- [x] Event Challenge reads real session, shows honest storage status
- [x] Leaderboard separates real session from clearly-labeled demo board
- [x] POS3 purchase queue + verify/reject gate reward eligibility correctly
- [x] E.A.T. handoff shows honest local/memory/backend status
- [x] Backend routes respond correctly with honest `storageMode`
- [x] Existing pairing-order route unaffected
- [x] No raw icon-text leakage
- [x] Mobile 430px verified for all SmokeCraft guest-facing pages
- [x] `npm run build` passes
- [ ] Postgres applied and verified (**not done** — deploy-time task)
- [ ] Auth/role middleware (**not done** — design decision pending)
- [ ] Demo-mode backend write blocking (**not done**)
- [ ] Real inventory service (**not done** — explicitly out of scope)
- [ ] Real payment/POS provider (**not done** — explicitly out of scope)
