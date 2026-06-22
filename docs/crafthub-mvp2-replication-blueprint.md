# CraftHub MVP2 Replication Blueprint

This is the master template for building any future CraftHub vertical
(WineCraft, BeerCraft, PourCraft, CoffeeCraft, FoodCraft, etc.) to the same
MVP2 standard SmokeCraft was built to. **This document does not start any of
those builds.** It exists so that when one is authorized, the build order,
file patterns, and honesty rules are already settled instead of re-derived.

Every phase below references the actual SmokeCraft files to copy the
*pattern* from — never the cigar-specific content itself.

---

## Phase A — Route and tile audit

**Copy the pattern from:** `src/App.jsx` SmokeCraft route block (`/smokecraft/*`).

- Rename: route prefix (`/smokecraft` → `/winecraft`, etc.), page component
  names, file directory (`src/pages/winecraft/`).
- Stay generic: the route-registration pattern itself, the "no dead tile"
  rule, the back/continue CTA wiring pattern.
- Must remain honest/local fallback: nothing yet — this phase is just route
  wiring.
- Cannot be faked: a route must render a real page before it ships, even a
  minimal one. No route should exist that 404s or renders nothing.
- Required screenshots: every new route, desktop + mobile 430px.
- Required build checks: `npm run build` passes, no broken `navigate()` calls.
- Required final report fields: routes found, routes missing, dead CTAs found/fixed.

## Phase B — Session state model

**Copy the pattern from:** `src/context/GuestSessionContext.jsx`'s
`smokeCraft` sub-object shape (`xp`, `rank`, `completedSteps`,
`finalScore`, `challengeStatus`, `eventLog`, `sharedStorage`,
`backendStatus`, `syncStatus`).

- Rename: the sub-object key (`smokeCraft` → `wineCraft`, etc.) and any
  vertical-specific fields.
- Stay generic: the `update()` callback pattern, the event-log shape
  (`{ type, timestamp, payload }`), the `sharedStorage`/`backendStatus`
  fields' shape (mode/backendConnected/localFallback/reason) — these are
  vertical-agnostic and should be copied verbatim.
- Must remain honest/local fallback: session state always persists to
  `localStorage` first; never assume a backend exists.
- Cannot be faked: completed steps, XP, and rank must derive from real
  user actions, never pre-populated.
- Required screenshots: n/a (state-only phase).
- Required build checks: existing `GuestSessionContext` tests/usages still
  pass; no regression to other verticals sharing the same context.
- Required final report fields: confirm `update()` export unchanged,
  confirm no key collisions with existing session shape.

## Phase C — Protocol/experience flow

**Copy the pattern from:** SmokeCraft's step sequence (Format → SeedSoil →
Origins → Leaves → FirstThird → SecondThird → FinalThird → Scorecard).

- Rename: every step name and its file.
- Stay generic: the step-completion ↔ `completeStep()` ↔ XP-award pattern.
- Must remain honest/local fallback: each step's data must come from real
  user input captured on that step, never seeded.
- Cannot be faked: no step should auto-complete without the user
  interacting with it.
- Required screenshots: each step page, desktop + mobile.
- Required build checks: full click-through from first step to scorecard
  with no dead-end.
- Required final report fields: full step list, any missing/broken
  transitions.

## Phase D — Scorecard/computed values

**Copy the pattern from:** `src/pages/smokecraft/Scorecard.jsx` +
`AdvancedScorecardPanel.jsx` (rating capture → computed final score).

- Rename: rating categories specific to the vertical (e.g., body/finish for
  wine instead of draw/burn for cigars).
- Stay generic: the score-computation pipeline, the "no fake winner"
  computation pattern (derive from real inputs only).
- Must remain honest/local fallback: score must be computed from what the
  user actually entered this session.
- Cannot be faked: never hardcode or randomize a score.
- Required screenshots: scorecard page, desktop + mobile.
- Required build checks: score math has no NaN/undefined edge cases on
  empty/partial input.
- Required final report fields: scoring formula confirmed honest, no
  hardcoded values found.

## Phase E — Winner/category logic

**Copy the pattern from:** `WinnerCriteriaPanel.jsx` +
`WinnerCategoryCard.jsx` + `smokeWinnerService.js` (pending → eligible →
locked → earned state machine).

- Rename: category names specific to the vertical.
- Stay generic: the 4-state model and the rule that "earned" only follows
  from real scoring data, never assigned speculatively.
- Must remain honest/local fallback: category state always computed
  client-side from session data until a backend exists.
- Cannot be faked: no category may show "earned" without a completed,
  real scorecard behind it.
- Required screenshots: winner-category panel in at least 2 states
  (pending and earned/eligible if reachable).
- Required build checks: state machine has no path to "earned" without
  passing through "eligible" with real data.
- Required final report fields: category list, state-machine description,
  confirmation no auto-earn path exists.

## Phase F — Event Challenge

**Copy the pattern from:** `src/pages/smokecraft/EventChallenge.jsx` —
reads real session, shows backend/storage status block, drives purchase-intent
creation.

- Rename: page name, any vertical-specific challenge framing text.
- Stay generic: the backend/storage status block render logic
  (`getSmokeSharedStorageMode()` equivalent), the purchase-intent creation
  call site.
- Must remain honest/local fallback: storage status block must reflect the
  real adapter state, never hardcoded "connected."
- Cannot be faked: challenge status must come from real session,
  never simulated.
- Required screenshots: desktop + mobile.
- Required build checks: page does not crash with no active session.
- Required final report fields: storage status block confirmed honest.

## Phase G — Leaderboard real-session card

**Copy the pattern from:** `src/pages/smokecraft/Leaderboard.jsx` — real
session card kept structurally separate from the "Demo Lounge Ranking"
mock community board with a visible DEMO badge.

- Rename: page/board names.
- Stay generic: the separation pattern itself — a real card must never be
  visually merged into a demo board.
- Must remain honest/local fallback: real card always reflects actual
  session data; demo board always carries a visible "DEMO" badge.
- Cannot be faked: never present mock users as real venue members.
- Required screenshots: desktop + mobile, both cards visible.
- Required build checks: demo badge renders, real card never shows mock
  data.
- Required final report fields: confirm demo labeling present and visible.

## Phase H — POS3 purchase/reward handoff

**Copy the pattern from:** `smokePOSHandoffService.js` + POS3's SmokeCraft
Purchase Queue card in `src/pages/pos3/POS3Home.jsx`.

- Rename: product/reward naming specific to the vertical.
- Stay generic: the intent → pending → verify/reject → reward-eligible
  pipeline; the rule that only a staff "Mark Verified" action sets
  eligibility.
- Must remain honest/local fallback: queue must show real pending intents
  only, with honest local/memory/backend status.
- Cannot be faked: no client-side path may set `verified` directly; no
  fake payment or fake inventory deduction.
- Required screenshots: POS3 queue card showing the new vertical's intents,
  desktop + mobile (handheld) if reachable.
- Required build checks: verify/reject buttons call the real service, no
  optimistic fake-success UI.
- Required final report fields: confirm reward eligibility only follows
  verified status.

## Phase I — E.A.T. operational handoff

**Copy the pattern from:** `SmokeCraftOperationalHandoff.jsx` in
`src/pages/eat/...` — shows local/memory/backend status, purchase
verification visibility, inventory impact preview (always non-applying).

- Rename: component/page name.
- Stay generic: the status-pill pattern, the "data scope: local-only"
  disclosure pattern.
- Must remain honest/local fallback: never claim real inventory sync.
- Cannot be faked: inventory preview must stay preview-only
  (`applied: false`) until a real inventory service is connected.
- Required screenshots: desktop + mobile if reachable.
- Required build checks: page renders with zero active handoffs without
  crashing.
- Required final report fields: confirm inventory/sync labeled pending.

## Phase J — Shared storage adapter

**Copy the pattern from:** `smokeSharedStorageService.js` in full —
`LOCAL_KEYS`, `attemptRemoteSync()`, `registerSmokeEventLogSink()`,
`getSmokeSharedStorageMode()`, `buildSmokeStorageStatusFields()`.

- Rename: `LOCAL_KEYS` prefixes, function names (`smoke*` → vertical
  prefix), event-type string prefixes.
- Stay generic: the entire local-fallback-first, background-sync,
  `ok:true`-gated event-logging architecture — copy verbatim.
- Must remain honest/local fallback: this *is* the honesty layer; do not
  weaken any of its conditionals.
- Cannot be faked: never log a `*_SUCCEEDED` event except inside a real
  resolved promise with `ok === true`.
- Required screenshots: n/a (service-only phase).
- Required build checks: no render-loop spam from event logging (mount
  effects/action handlers only).
- Required final report fields: confirm event-logging follows the
  ok:true-only rule.

## Phase K — Backend schema/API contract

**Copy the pattern from:** `docs/smokecraft-backend-schema.md` +
`docs/smokecraft-api-contract.md` structure.

- Rename: table/route names.
- Stay generic: the `{ ok, status, storageMode, data, error }` response
  envelope — copy verbatim across all verticals.
- Must remain honest/local fallback: docs must state plainly when
  something is pending, not implemented, or memory-fallback-only.
- Cannot be faked: do not document storageMode "postgres" as default —
  document memory_fallback as the default until proven otherwise.
- Required screenshots: n/a.
- Required build checks: n/a.
- Required final report fields: schema doc created, contract doc created,
  both reviewed for overselling language.

## Phase L — Server routes

**Copy the pattern from:** `server/routes/smokecraftRoutes.js` +
`server/routes/smokecraftEatRoutes.js` — Postgres-if-available,
memory-fallback-otherwise pattern; mount in `server/index.js` alongside
(never replacing) existing routes.

- Rename: route paths, table names, in-memory store variable names.
- Stay generic: the storageMode-detection logic, the response envelope.
- Must remain honest/local fallback: must never report `storageMode:
  "postgres"` unless an actual Postgres write/read round-tripped
  successfully.
- Cannot be faked: no endpoint should fabricate success without a real
  state change (in-memory or Postgres).
- Required screenshots: n/a.
- Required build checks: endpoint curl tests for every route, confirming
  response shape and storageMode.
- Required final report fields: endpoint test results, confirmation
  existing routes (pairing-order and any other vertical's routes) still
  work unaffected.

## Phase M — Full QA/visual cleanup

**Copy the pattern from:** Phase 11 of this project (dead-tile audit, image
audit, icon-text grep, mobile 430px pass, demo-label honesty pass).

- Rename: n/a — this is a process, not a file.
- Stay generic: the full audit checklist itself.
- Must remain honest/local fallback: re-verify nothing introduced a fake
  success path during the build.
- Cannot be faked: re-run the no-fake-data checklist from scratch; don't
  assume earlier phases stayed honest.
- Required screenshots: every guest-facing route, desktop + mobile 430px.
- Required build checks: `npm run build` passes.
- Required final report fields: identical structure to Phase 11's report
  for SmokeCraft.

## Phase N — Final closeout

**Copy the pattern from:** Phase 12 of this project — this exact set of
four documents (closeout, blueprint, coming-soon policy, founder handoff
checklist) plus an optional status config.

- Rename: vertical name throughout.
- Stay generic: the document structure and section headings.
- Must remain honest/local fallback: closeout doc must state plainly what
  is real vs demo vs pending, with no overselling.
- Cannot be faked: do not mark a vertical "production-ready" unless
  Postgres, auth, and inventory/payment integrations are independently
  verified — not just "built."
- Required screenshots: final confirmation set, same routes as Phase M.
- Required build checks: final `npm run build` + endpoint spot-check.
- Required final report fields: full final report matching this project's
  Phase 12 report structure.
