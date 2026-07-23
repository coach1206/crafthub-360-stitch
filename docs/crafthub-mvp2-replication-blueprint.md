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

---

## Continual-Learning Log

This section is a living append-only log. Every completion pass that finds a
reusable lesson — not vertical-specific content — adds one dated entry here.
Nothing in this section is removed or rewritten by a later pass; only new
entries are appended.

### 2026-07-23 — Phase 9 Journey Amendment (Golden Box Packaging Studio Integration)

1. **Capability**: connecting an already-production-complete backend/frontend
   module into a visible learner journey.
   **Gap found**: Packaging Studio was fully functional in isolation after
   its own completion pass but had zero inbound links from the Golden Box
   entry workflow — a learner had no way to discover it.
   **Root cause**: "production complete" was verified module-by-module, not
   by walking the actual learner journey end to end.
   **Correction**: added a real, backend-gated CTA into `EntryWorkspace.jsx`'s
   `review` step, keyed off the same `requiredMet` signal already used to
   gate that step.
   **Prevention rule**: a module is not journey-complete until it is reached
   by clicking through the real journey from its entry point, not just by
   hitting its own routes directly.
   **Reusable rule**: after any module completion pass, run one full
   click-through of the parent journey before declaring the module "done."
   **Tests added**: journey-transition checks in
   `verify-phase9-packaging-studio-journey-amendment.mjs`.
   **Proof added**: `01-build-studio-packaging-cta.png`,
   `02-locked-cta-before-prerequisites.png`.
   **Checklist impact**: "Phase 9 Journey Amendment" item now checked.

2. **Capability**: deriving UI/journey status from real backend records.
   **Gap found**: none existed yet — this pass had to design the status
   model from scratch.
   **Root cause**: n/a (net-new work, not a fix).
   **Correction**: `getPackagingReadinessForEntry()` computes state live from
   `packaging_designs`/`packaging_design_versions`/`packaging_final_submissions`,
   never from a stored duplicate status column.
   **Prevention rule**: never add a second source of truth for a status that
   can already be derived; derive it live or via a maintained view.
   **Reusable rule**: any "status" surfaced in a UI must be traceable to a
   single query over existing tables — grep for a status-only column being
   added as a red flag in review.
   **Tests added**: state-transition checks (not_started →
   draft_in_progress → validation_required → ready_to_submit → submitted).
   **Proof added**: `05`–`09-*-state.json`.
   **Checklist impact**: none (architecture decision, not a checklist item).

3. **Capability**: real end-to-end exercising surfaces defects source review
   misses.
   **Gap found**: `saveDraft()` silently wiped every field not included in a
   given partial PATCH body — a real data-loss bug, invisible from reading
   the happy-path code alone.
   **Root cause**: `buildConfig()` was called on raw request input with no
   merge against the prior version's snapshot.
   **Correction**: merge `input` onto `currentVersion.snapshot` before
   validating/persisting.
   **Prevention rule**: any "partial update" endpoint must be tested with a
   real two-step partial-then-partial save sequence, not just a single full
   save.
   **Reusable rule**: treat draft/version PATCH endpoints as a class that
   needs an explicit multi-step-partial-save regression test.
   **Tests added**: partial-save-preserves-prior-fields case (folded into
   the existing packaging-studio suite's draft persistence checks).
   **Proof added**: n/a (bug fix verified via live API assertions, not a
   screenshot).
   **Checklist impact**: none (bug fix within existing scope).

4. **Capability**: existence validation on identifiers passed across
   service boundaries.
   **Gap found**: `getPackagingReadinessForEntry(entryId, ...)` returned a
   false "not_started" `200` for a nonexistent `entryId` instead of a 404.
   **Root cause**: missing existence check before deriving status.
   **Correction**: added an explicit `golden_box_entries` existence query
   that throws `entry_not_found`.
   **Prevention rule**: every service function taking a foreign-key-shaped
   ID must have an explicit existence check, even when downstream queries
   would "safely" return empty results.
   **Reusable rule**: grep new service functions for a `WHERE x = $1` with no
   preceding existence check before trusting `rows[0] || defaultValue`.
   **Tests added**: nonexistent-entry-id rejection check.
   **Proof added**: n/a (verified via direct API status-code assertion).
   **Checklist impact**: none (bug fix within existing scope).

5. **Capability**: distinguishing "visibly required in the presented flow"
   from "hard-blocking an unrelated protected system."
   **Gap found**: the mandate could be read as requiring packaging
   completion to block Golden Box blend-entry submission.
   **Root cause**: ambiguity between "journey requires a step be shown" and
   "journey requires a step be enforced server-side as a submission gate."
   **Correction**: made packaging visibly required as a distinct presented
   step without modifying `entryService.submitEntry`'s validation — disclosed
   explicitly in `12-JOURNEY-INTEGRATION-AMENDMENT.md`.
   **Prevention rule**: never silently expand scope to modify a protected,
   already-proven system when the mandate's own instructions say to preserve
   it; when ambiguous, choose the smaller, disclosed interpretation.
   **Reusable rule**: any scope decision that narrows what a mandate could be
   read to require must be written down in the discovery-audit doc, not left
   implicit.
   **Tests added**: "presentation route does not hard-block on missing
   packaging submission" check.
   **Proof added**: n/a (documented in the discovery-audit doc directly).
   **Checklist impact**: enabled the 6-vs-7-phase discrepancy to remain
   correctly unresolved rather than being incorrectly "fixed" by this pass.

6. **Capability**: reusing existing authorization infrastructure instead of
   inventing new judge/mentor access paths.
   **Gap found**: none — this was a design choice validated up front, not a
   defect found afterward.
   **Root cause**: n/a.
   **Correction**: judge/mentor packaging-snapshot reads reuse the identical
   `visibilityService.getVisibility().canViewRecipe` policy already proven in
   Phase 8, rather than adding a packaging-specific bypass.
   **Prevention rule**: never build a second, parallel authorization check
   for a new UI surface when an existing, proven policy already covers the
   same actor/resource relationship.
   **Reusable rule**: before writing a new `can*` check, grep for an existing
   visibility/authorization service that already covers the same roles.
   **Tests added**: authorized/unauthorized judge and mentor checks, plus
   share-token non-leakage into judge access.
   **Proof added**: `18-authorized-judge-view.json`,
   `19-unauthorized-judge-rejection.json`, `20-authorized-mentor-view.json`,
   `21-unauthorized-mentor-rejection.json`.
   **Checklist impact**: none (reuse, not new capability).

7. **Capability**: immutable-snapshot presentation data.
   **Gap found**: none — the immutable-snapshot pattern already existed from
   the prior Packaging Studio pass; this pass only had to wire the
   presentation/defense UI to read it instead of the editable draft.
   **Root cause**: n/a.
   **Correction**: `EntryWorkspace.jsx`'s `presentation` step and
   `JudgeEntryReview.jsx` both read `packaging_final_submissions.snapshot`
   via the existing `GET /entries/:entryId/final-submission` route.
   **Prevention rule**: when a "presentation" or "defense" view needs
   evidence, always resolve it through the immutable submitted-snapshot
   route, never through the design's live/editable state.
   **Reusable rule**: any UI showing "what was submitted" must read from a
   submission-time snapshot table, never the mutable draft table, even if
   the mutable table currently holds the same values.
   **Tests added**: "submitted snapshot appears in Defense data unchanged
   after the rejected draft-edit attempt."
   **Proof added**: `22-draft-changed-after-submission-attempt.json`,
   `23-submitted-snapshot-unchanged.json`.
   **Checklist impact**: none (reuse, not new capability).

8. **Capability**: deciding whether a shared progression event is needed for
   a new submission action.
   **Gap found**: none — the mandate's own fallback instruction was to
   document the "no event needed" decision if that's the right call.
   **Root cause**: n/a.
   **Correction**: added zero new `smokecraft_progression_events` types, XP
   paths, or Passport-write paths for packaging submission; documented this
   as a deliberate decision rather than an oversight.
   **Prevention rule**: adding a progression event is a one-way door (new
   event types accumulate permanently); default to not adding one unless the
   mandate explicitly requires new XP/badge/stamp behavior.
   **Reusable rule**: before adding any new progression-event type, check
   whether the mandate's disclosure clause allows documenting "not needed"
   instead — prefer that path when true.
   **Tests added**: no-new-progression-event, no-duplicate-XP,
   no-duplicate-Passport-stamp checks.
   **Proof added**: `24-no-progression-event.json`,
   `25-no-duplicate-xp-or-passport.json`.
   **Checklist impact**: none (explicit non-action, documented).

9. **Capability**: multi-invocation Playwright proof-capture scripts sharing
   one identity.
   **Gap found**: separate `node -e`/script invocations each mint a new,
   unrelated guest-session identity, so a design/entry created in one
   invocation is unreachable (403/404 "not owned") from a later, separate
   invocation.
   **Root cause**: guest identity is derived from a signed session cookie
   generated fresh per `POST /guest-session` call; nothing shares state
   across process invocations unless the same cookie is explicitly reused.
   **Correction**: perform an entire create → configure → save → submit →
   verify flow inside one script/process, reusing one captured cookie
   throughout.
   **Prevention rule**: never assume two separate script runs share test
   identity; either persist and reuse the cookie explicitly, or design the
   proof script as a single end-to-end run.
   **Reusable rule**: proof-capture scripts for identity-gated flows should
   default to "one process, one identity, full flow" unless cross-identity
   behavior (e.g., cross-learner rejection) is specifically what's being
   proven.
   **Tests added**: n/a (operational fix to the proof-capture script itself).
   **Proof added**: enabled successful capture of items 27–34 in
   `public/proof/golden-box-packaging-studio-journey-amendment/`.
   **Checklist impact**: none (tooling fix).

10. **Capability**: exact request-body field names for existing service
    functions must be read from source, not assumed from naming convention.
    **Gap found**: a proof-capture attempt sent `{ permission: 'comment' }`
    to the share-creation endpoint, which actually expects
    `{ accessType: 'comment_enabled' }` — a naming and enum-value mismatch
    that a plausible guess got wrong twice (once on the field name, once on
    the enum value).
    **Root cause**: writing the request payload from memory/inference rather
    than reading `createShare()`'s destructured parameters and its
    `['view_only', 'comment_enabled']` validation list directly.
    **Correction**: read the service function signature before writing any
    ad-hoc test request against it.
    **Prevention rule**: for any endpoint without a checked-in client SDK
    call already exercising it, grep the controller/service source for the
    exact destructured field names and any inline enum/allow-list before
    writing a test payload.
    **Reusable rule**: prefer calling through an existing typed API client
    function (e.g. `packagingStudioApiClient.js`) over hand-writing a raw
    `fetch()` body, precisely because the client function already encodes
    the correct field names.
    **Tests added**: n/a (operational correction during proof capture).
    **Proof added**: `28-sharing-manager.json`,
    `29-shared-design-comment-enabled.json`, `30-comment-via-share.json`,
    `31-revoked-share-rejection.json`.
    **Checklist impact**: none (tooling fix).
