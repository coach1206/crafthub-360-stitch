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

### 2026-07-23 — Phase Architecture Reconciliation (6-vs-7-phase discrepancy)

**Prevention rules established by this pass** (apply to every future CraftHub vertical):

1. Session count and phase count must be separate explicit architecture
   contracts — never assume one implies the other, and never let a single
   planning-doc paragraph stand in for both.
2. Every new CraftHub must define one canonical phase map before feature
   construction begins — not derived after the fact from whatever the UI
   happens to render.
3. Tests, UI, documentation, database state, and route maps must all read
   from the same phase source (e.g. `TOTAL_VISITS`/`VISIT_STRUCTURE`) — never
   a second, independently-maintained count.
4. A planning statement must not override verified production architecture
   without an explicit reconciliation pass; when a mandate's wording
   conflicts with what is actually built and gate-verified, investigate
   before assuming either the code or the mandate is wrong.
5. Never fabricate an architecture element (a phase, a session, a boundary)
   merely to satisfy a checklist number — an unresolved, disclosed
   discrepancy is always safer than an invented "fix."
6. Architecture discrepancies must be resolved before UI Designer handoff —
   inconsistent phase/session counts would otherwise leak into design
   handoff artifacts and downstream tooling.
7. New feature integration (e.g. connecting a module into the visible
   journey) must not silently alter session or phase counts as a side
   effect — verified explicitly in this pass via source diff review.
8. Historical architecture decisions must remain documented after
   correction — the original discrepancy finding
   (`PHASE-ARCHITECTURE-DISCREPANCY.md`) was annotated with a link to the
   resolution, not deleted or rewritten.
9. Existing learner progress must be preserved during any grouping change —
   verified this pass by confirming no phase identifier is persisted
   anywhere in the database (session/step ids are the only persisted keys).
10. A phase-count verification check must be part of every future CraftHub
    journey audit — this pass's dedicated suite
    (`verify-smokecraft-phase-architecture-reconciliation.mjs`) is the
    reusable template for that check.

**Root-cause note for this specific case**: the "7 phases" language quoted by
later mandates traced back to `docs/SMOKECRAFT_360_MASTER_REBUILD_PLAN.md`'s
own early planning section (§3a) — a target design written before
implementation, superseded by that same document's own later "Scope actually
implemented" section (6 phases, matching code exactly). No structural change
was needed; the correction was fully documentation-level.

### 2026-07-23 — Live Deployment Verification (Phase 10, blocked)

**Prevention rules established by this pass** (apply to every future CraftHub vertical):

1. Local production build success is not live deployment success — a clean
   `npm run build` and a healthy localhost server prove nothing about what
   is actually running in production.
2. Every CraftHub module must expose safe deployment-version evidence (a
   `GET /api/version`-style endpoint returning commit/build metadata only,
   never secrets) — this pass added the reusable pattern to
   `server/controllers/healthController.js`.
3. Deployed commit verification is mandatory before live UI testing —
   testing routes/flows against an unverified commit risks validating the
   wrong code entirely.
4. Database migration verification must occur against the real production
   database — local sandbox migration success is necessary but not
   sufficient evidence.
5. Localhost screenshots cannot close a live deployment gate — this pass
   deliberately produced zero localhost-sourced screenshots as "live" proof,
   even under significant pressure to complete the checklist.
6. Deployment-provider evidence and application evidence must agree — a
   `/api/version` response and a Railway dashboard's reported commit should
   match; a mismatch is itself a finding.
7. A later deployed commit requires an intervening-commit audit — never
   assume a newer deployed commit is safe without reviewing every commit
   between the expected and actual deployed SHA.
8. Production verification must use controlled non-customer test identities
   — never real learner accounts, even when verification is otherwise
   unblocked.
9. Production testing must remain non-destructive and low-load — no
   aggressive penetration testing or load testing against a live service.
10. Live storage configuration must be reported honestly — "not configured"
    is a valid, expected finding, not a defect to paper over.
11. A blocked external verification gate must remain unchecked — this pass's
    own outcome is the template: `ENGINEERING COMPLETE` (the code is ready)
    is a distinct, honest status from `PASS` (verified live), and the
    checklist item stays unchecked until real evidence closes the gap.
12. Every future module must define its live deployment verification
    strategy *before* development completion — deciding how a module's live
    state will be checked (version endpoint, health check shape, deploy
    branch) at design time avoids exactly the blocked-gate scenario this
    pass encountered after the fact.

**Root-cause note for this specific case**: this session's outbound network
access is governed by an organization egress policy that denies (403,
non-transient) the only known production host. No deployment-provider
dashboard or CLI credential was available as a fallback, and no CI/CD
workflow exists in-repo to inspect for deployment records. A significant
additional finding, unrelated to network access: this repository's default
branch (`main`) does not contain any of this multi-phase operation's
completed work, which is itself a deployment-configuration risk worth
flagging to the project owner independent of this specific verification
attempt.

### 2026-07-23 — Live Remediation: Start vs. Resume Journey State Correction

**Prevention rules established by this pass** (apply to every future CraftHub vertical):

1. A landing CTA must be derived from canonical server state — never from a
   client-side heuristic re-implemented per screen.
2. Start, resume, and completed journey states must be separate explicit
   states, each with its own exact label and route — never a binary
   Start/Resume toggle that a completed journey has to awkwardly share.
3. A journey record (or any completedStep evidence) existing does not
   automatically mean Resume — presence of evidence must be validated for
   real, in-order progress before it is trusted.
4. Contradictory state must be reconciled before display — never patch the
   displayed values independently without fixing the shared source they
   should both derive from.
5. Completion percentage, current step, and last completed step must derive
   from the same evidence source — this pass's own defect was two *different*
   functions computing "has real progress" with different rules.
6. LocalStorage must never select the canonical active journey — it may
   cache a display value, but the check for "does progress exist" must use
   the same authoritative derivation the rest of the app uses, not its own
   raw scan.
7. New Journey must create a new identity and not inherit prior module
   state — audited and confirmed already compliant in this pass (see
   `06-ROLLBACK-PLAN.md`), except an explicitly disclosed, pre-existing,
   intentional scope decision (venue/XP preservation).
8. Completed journeys must not be treated as incomplete resumable journeys —
   the 3-state contract (start/resume/completed) prevents this by
   construction once all consuming screens share one source.
9. Resume pages require honest empty, incomplete, and completed states —
   never a single "Saved Journey" card rendered unconditionally.
10. Every CraftHub module must test fresh user, returning user, completed
    user, archived journey, and corrupt legacy state — this pass's dedicated
    suite exercises exactly these five shapes at the pure-function level.
11. Live screenshots revealing contradictory state must reopen the affected
    completion gate — this pass and its immediate predecessor both exist
    because production screenshots surfaced a real defect neither prior
    pass's automated suites had caught (both suites tested the already-fixed
    `lastCompletedSession` path but not the still-buggy `hasProgress` path).
12. A label-only fix is prohibited when the underlying state is wrong — this
    pass fixed the derivation function first, then updated labels to match;
    changing only the button text while leaving `hasProgress`'s weak check
    in place would have been a cosmetic non-fix.

**Root-cause note for this specific case**: two independently-implemented
functions checked for "does real progress exist" with different, both-wrong
rules, even after a prior pass fixed the *adjacent* `lastCompletedSession`
calculation. This is the general lesson: when a defect's root cause is "N
independent implementations of what should be one function," fixing one
implementation is necessary but not sufficient — every sibling
implementation must be found (grep for the same weak pattern, e.g.
`completedSteps.some(...)`, across the whole codebase) and fixed in the same
pass, not discovered one screenshot at a time across multiple passes.

### 2026-07-23 — Emergency Live Remediation: Clean Start, State Reset, and Entry-Sequence Restoration

**Prevention rules established by this pass** (apply to every future CraftHub vertical):

1. A Start action must create a new journey, not merely change routes — a
   route change with no accompanying state reset is not a "new journey,"
   it's a new URL over old data.
2. All journey-specific state must be scoped by journey ID — this pass
   disclosed (in `05-JOURNEY-SCOPING.md`) that true per-journey-ID
   namespacing does not exist in the current architecture; future verticals
   should build this in from the start rather than retrofit it under
   pressure.
3. New Journey must clear every module-specific state source — this pass's
   root cause was exactly one context (`GuestSessionContext`) never being
   cleared by an otherwise-working reset function that only touched its
   sibling context.
4. Shared Passport identity and journey identity must remain separate —
   confirmed still correctly separated in this pass; the fix never touches
   `passport.*`.
5. Clean-start testing must verify no prior learner, venue, cigar, mentor,
   progress, Golden Box, or Packaging state survives — this pass's
   dedicated suite and a real Playwright end-to-end run both did exactly
   this, reproducing the precise reported values (`Greg Guy`, `Romeo y
   Julieta 1875`, `Carlos Mendoza`, `63%`) and confirming their absence.
6. Entry sequence must be verified from the live landing page through
   Session 1 — done locally (blocked live, same as every Phase 10 attempt).
7. An approved asset existing is not enough; the correct live route must
   render it — confirmed via source: exactly one route registration for
   `/smokecraft/welcome`, no duplicate/fallback.
8. Fallback screens must not silently replace approved production visuals —
   none found in this case; the "plain" appearance was traced to stale
   *data* feeding a real component, not a substitute component.
9. Direct deep links must enforce entry prerequisites — **a real gap was
   found and disclosed, not fixed** (S1's guard has no earlier session to
   require, so it doesn't block skipping enrollment/venue). Future
   verticals should design entry-layer guards independently from
   session-number guards from the start, since "session 1 requires session
   0" is structurally impossible.
10. Double-click and retry behavior must not create duplicate journeys —
    implemented via a `useRef` lock in the new shared start hook.
11. Live user screenshots override prior assumptions and reopen the
    affected gate — this is the fourth consecutive pass in this operation
    triggered by a live screenshot revealing a defect the automated suites
    hadn't caught; each was a different facet of the same underlying
    "multiple state sources, not all reset together" family of bugs.
12. Every future CraftHub module must test brand-new user, returning user,
    completed user, archived journey, and corrupt legacy state before
    completion — the dedicated suite for this pass exercises all five at
    the deterministic, pure-function level, matching the established
    pattern from every prior remediation pass in this operation.
13. Route rendering, asset wiring, state reset, and sequence correctness
    are separate completion checks — this pass audited all four
    independently rather than assuming a fix to one implied the others
    were also fine (04-VISUAL-ROUTE-ASSET-MAP.md and 03-ENTRY-SEQUENCE.md
    were investigated and found clean/found-a-gap respectively, not
    assumed).
14. A feature is not complete until the live user-visible flow matches the
    approved sequence — still not verified live in this operation; every
    pass since Phase 10 has honestly reported "engineering complete, live
    unverified" rather than closing the gate on local evidence alone.

**Root-cause note for this specific case**: this is the second pass in this
operation whose root cause was "two independent state stores exist for
overlapping concepts, and a reset function was only ever written against
one of them." The general lesson: whenever a codebase has more than one
context/store/table representing conceptually the same entity (here:
"the current journey's content"), every reset/clear/archive operation on
that entity must be audited against *every* store representing it, not just
the one the original bug report happened to point at.

### 2026-07-23 — Emergency Remediation Continuation: Entry-Prerequisite Guard

**Prevention rules established by this pass** (apply to every future CraftHub vertical):

1. Canonical session guards do not replace pre-session entry guards — a
   "session N requires session N-1" guard is structurally satisfied for
   session 1 by definition, so it enforces nothing at the true entry point.
2. Entry preparation must have its own explicit readiness contract —
   `getSmokeCraftEntryReadiness()` is the reusable template.
3. Every post-entry route must enforce entry readiness — achieved here
   transitively (protecting S1 alone closes the bypass for S2–S27 via the
   existing prior-session chain), not by duplicating the check everywhere.
4. Direct deep links must be tested before a journey is declared complete —
   this defect existed through four prior remediation passes in this
   operation before a live screenshot-driven report caught it.
5. A first canonical session can still require pre-session prerequisites —
   don't assume "first in the numbered spine" means "first reachable."
6. Route guards must resolve before rendering protected content — verified
   via a `return null` render path plus a live browser check that the
   redirected target's content, never the protected content, appears.
7. Browser Back, Forward, refresh, second-tab, and bookmarks must be tested
   — all five were exercised live in this pass's dedicated suite, not just
   asserted from source.
8. Preserved account-level state must not silently satisfy journey-level
   prerequisites — verified explicitly: venue preservation is disclosed and
   traced to the real, canonical venue context, not a stale or forgeable
   field (`03-VENUE-PRESERVATION-DECISION.md`).
9. Every future CraftHub module must separate onboarding prerequisites from
   curriculum progression as two distinct guard concerns from the start —
   retrofitting this (as this pass had to) risks exactly the kind of
   architecture-vs-mandate mismatch this pass had to disclose (Mentor
   Selection's real position vs. the requested generic sequence).
10. Disclosed out-of-scope defects that violate an explicit completion
    requirement must be fixed before the gate can pass — this is precisely
    why this pass exists: the immediately-prior pass's own honest
    disclosure of the deep-link gap is what correctly reopened the gate,
    exactly as intended by the pattern established across this operation.

**Root-cause note for this specific case**: this is the fifth consecutive
pass in this operation triggered by a live-observed defect the automated
suites hadn't caught (or, in this case, by this operation's own honest
disclosure of a known gap from the prior pass). Unlike the earlier four,
the fix here required carefully distinguishing "the real, verified defect"
(entry-layer bypass) from "the mandate's generically-worded but
architecturally-inconsistent requested sequence" (Mentor Selection before
Welcome) — and choosing to fix the former precisely while disclosing,
rather than silently forcing, a mismatch with the latter. When a mandate's
literal wording and the real, already-approved architecture conflict,
disclose the conflict and fix what is actually verified broken; don't
silently comply with wording that would require an unreviewed structural
change.

## Approved Entry Visual Restoration — permanent rules

1. User-approved GitHub visuals are the source of truth.
2. Claude-created replacement visuals are prohibited unless explicitly approved.
3. Asset registration does not equal live rendering — verify the image actually
   appears on screen, not just that a constant points at a file.
4. Every route must prove the approved asset actually appears (source check
   plus a real live-browser screenshot/attribute read, not source inspection
   alone).
5. Fallback layouts cannot replace approved screens.
6. Existing artwork must be wired, not recreated.
7. Exact filename case, spacing, punctuation, and extension must be verified
   by opening the file, never guessed from a similar-sounding name.
8. Route-to-asset maps must identify duplicate and deprecated routes.
9. Live visual proof is required for every approved entry screen before a
   visual-restoration gate can close.
10. A route or state fix does not complete a screen if the wrong visual (or
    no visual) remains — this is a distinct gate from routing/state
    correctness.
11. User screenshots showing unauthorized visuals reopen the visual gate
    immediately.
12. Approved imagery and live React interactivity must coexist — but an
    approved image that itself bakes in fake/demo data (sample venues, a
    fake XP panel, a test user's own PII) must never be shown wholesale;
    only its data-free regions may be used as a visual shell, with real
    live data rendered alongside, never the image's own baked fake content.

## SmokeCraft 27-Session Sequence Reconciliation — permanent rules

1. Session count, phase count, route order, visual order, and progress order
   are separate completion gates — passing one does not imply another passes.
2. Entry preparation must never be counted as curriculum sessions.
3. One canonical registry must drive routes, labels, progress, resume, and
   unlocks — trace every consumer, don't just check that the registry
   itself looks correct.
4. Duplicate session arrays are prohibited; where one is found and confirmed
   dead (zero real runtime consumers), mark it clearly deprecated rather
   than leaving it to mislead a future engineer, even if deleting it is
   judged out of a given pass's safe scope.
5. Every session requires a canonical previous and next relationship.
6. Completion is based on contiguous completed sessions, not the highest
   completed session number found in storage.
7. A route existing does not prove it appears in the correct sequence —
   verify the guard's session number against the canonical registry
   directly, not just that the route renders something.
8. Every phase boundary must be browser-tested, not just asserted from the
   registry's own phase field.
9. Golden Box and Packaging Studio placement must not alter the locked
   session count.
10. Session 27 must be the only curriculum event that completes the
    27-session journey.
11. Full route traversal (live browser, real navigation) is required before
    a sequence-completion gate can close — registry-only testing is
    insufficient on its own.
12. Live screenshots showing wrong order immediately reopen the sequence
    gate.
13. An approved visual must be attached to the correct session, not merely
    present somewhere in the repository.
14. Entry flow, curriculum flow, challenge flow, and post-completion flow
    must remain explicitly separated in both code and documentation.

## SmokeCraft Full Root-Cause Audit — permanent rules

1. Repeated user-visible failures require a cross-layer root-cause audit
   before another page-level patch.
2. Asset existence, asset registration, asset rendering, visual visibility,
   and live deployment are separate gates.
3. Route correctness, sequence correctness, state correctness, and
   deployment correctness are separate gates.
4. Source-text verification cannot substitute for browser-visible
   verification.
5. Tests must explain how a production defect could still occur despite
   passing — a test that only proves local correctness must say so.
6. Every production route must prove the intended component and approved
   asset render together, not just that each exists independently.
7. Multiple state contexts require an explicit authority and
   hydration-order map.
8. Deployment commit proof is mandatory before blaming application code or
   cache for a live discrepancy.
9. Fallback and demo content must be searchable and production-reachability
   tested, not just assumed absent.
10. The production bundle must be inspected for required assets and route
    components after every visual/routing-affecting change.
11. A local development pass does not prove production-build behavior, and
    a local production-build pass does not prove live-deployment behavior —
    these are three distinct levels of proof.
12. Audit findings must precede remediation when the root cause is
    uncertain.
13. Completion reports must separate verified fact, inference, blocked
    evidence, and untested assumption.
14. Repeated isolated fixes without a system map are prohibited.

## Production Build Identity and Cache Invalidation — permanent rules

1. Every production frontend must expose its exact build commit, sourced
   from the actual host's real environment variable (verify the variable
   name against the actual deployment platform — a wrong-platform variable
   name fails silently, exactly as `VERCEL_GIT_COMMIT_SHA` did on Railway).
2. Frontend and backend build identity must be comparable from a single
   source of truth (e.g. one manifest file read by both), not two
   independently-set values that can silently drift apart.
3. Static approved assets require versioned URLs or content hashes — a
   filename that never changes gives a cache no signal that its bytes did.
4. HTML must not remain indefinitely cached across deployments; hashed
   JS/CSS may be cached aggressively since a content change always
   produces a new filename.
5. Deployment success is not proven without commit identity — a green
   build log is not proof of what is currently being served.
6. A current GitHub branch does not prove a current production build.
7. Every deployment must publish a non-sensitive build manifest reachable
   without dashboard/CLI access.
8. Critical visual assets must be listed and hashed in the build manifest
   so their presence and content can be verified from outside the build
   process.
9. Browser cache updates must preserve legitimate user state — a
   version-mismatch or hard-refresh mechanism must never clear active
   journey data, Passport identity, or archived history.
10. Service workers (if present) must remove obsolete application caches
    on activation; if none is registered, document that fact rather than
    adding one solely to satisfy this rule.
11. Production diagnostics must show route registry version, session
    count, phase count, and asset availability from one page reachable
    without infrastructure access.
12. Missing approved assets must be disclosed in the build manifest rather
    than fabricated or silently omitted.
13. Repeated differences between local and live behavior require build-
    identity and caching verification before another round of UI patches —
    a page-level fix cannot solve a deployment-identity problem.

## Full Tactile and Haptic Interaction Completion — permanent rules

1. Approved images are visual shells, not finished interactive screens.
2. Every meaningful visual region must connect to a live control.
3. No educational visual may remain dead and static — but audit method
   matters: a naive `onClick` string count undercounts real interactivity
   when one handler drives many cards (verify by reading the actual
   interaction pattern, not by grepping for a literal occurrence count).
4. Pressed state and selected state are separate; selected state must
   only appear after user action.
5. Haptic feedback must be optional (respect `prefers-reduced-motion` and
   an explicit account-level preference) and accessibility-safe, and must
   never gate the underlying action's success.
6. Pointer-event reachability must be browser-tested, permanently, as an
   automated regression — not re-discovered by chance a second time.
7. Hotspots must use responsive normalized coordinates or fixed touch-
   target minimums (72px), not viewport-relative sizing for touch targets
   specifically.
8. Every visual interaction must teach what, why, effect, and application
   where it is genuinely an educational choice — not every screen needs a
   selectable-card grid; narrative/results/ceremony screens are a
   legitimate exception, but must be explicitly disclosed as such, not
   silently assumed compliant.
9. Touch targets must be designed for tablet users aged 45–75.
10. Static decorative exceptions must be documented, not silently left
    unlabeled.
11. Journey-specific interaction state must reset on Start New Journey —
    verify by checking the new state lives inside the same object the
    existing reset already clears, not by re-implementing a second reset
    path.
12. Interaction state must not leak between learners.
13. XP, Passport updates, and rewards must remain idempotent.
14. A screen is not complete because its image displays; its required
    visual regions must function — but retrofitting a shared component
    onto already-working, already-regression-tested screens is a real
    blast-radius decision, not automatically the smallest safe fix; new
    shared infrastructure may be introduced as adoptable without forcing
    immediate migration of working code.

## Final Tactile Closeout — permanent rules

1. "0 selectable-controls" from a grep-based audit heuristic is a hint to
   read the source, not a verdict — accessible selection patterns vary
   (`aria-pressed`, `aria-selected`+`role="tab"`, `aria-current="step"`
   progress indicators) and a narrow string search will miss real,
   working interactivity built with a different valid pattern.
2. A confirmation step before an "apply advice to my journey" action is
   not optional polish — it is the difference between a real choice and
   a silent mutation; require it explicitly and verify it live.
3. Dismissed/rejected content should stay recoverable within the session
   unless there's a specific reason it shouldn't — a toggle costs little
   and avoids a frustrating dead end.
4. Journey-persisted state added to an existing per-session object (e.g.
   `journey.cutToastLight.newField`) inherits that object's existing
   Start New Journey reset for free — verify this by reading the reset
   function's field list, not by re-implementing a second reset path.
5. A representative single-screen viewport sweep (checking for horizontal
   overflow at all required widths) is real, valid evidence for the most
   common responsive-layout failure mode, but is not a substitute for an
   exhaustive per-screen matrix when one is explicitly required — label
   which one was actually performed.

## Canonical Journey Authority Root-Cause Fix — permanent rules

1. A "preserved as-is" grouping in a reset function is a place to re-verify
   at every pass, not a permanent decision — a field grouped with a
   deliberately-preserved value (e.g. venue) for convenience is not
   automatically correct to preserve for the same reason (identity is not
   venue).
2. Live production screenshots cited in a mandate must be investigated as
   a credible bug report when they cannot be independently verified — not
   accepted as fact, and not dismissed either.
3. Finding and fixing the actual narrow root cause is preferable to
   building a large parallel architecture "just in case" — verify the
   existing canonical authority (if one already exists and is correct)
   before assuming a new one is needed.
4. A "no active journey" state rendering inline vs. redirecting is a real,
   fixable presentation choice, distinct from whether the underlying
   state computation itself is correct — don't conflate the two when
   diagnosing a "competing authority" report.
5. Not every defect requires a migration/reconciliation step for existing
   browsers — evaluate whether the defect self-heals on the next natural
   user action (e.g., the next Start New Journey) before building one.

## Canonical Runtime (Prompt 1 of 2) — permanent rules

1. Route, component, asset, data, interaction, navigation, and completion
   should ultimately come from one canonical runtime — but migrating an
   entire working, regression-tested application to a new generic
   renderer in one pass is a real, large-blast-radius decision requiring
   explicit user sign-off on scope, not an assumption.
2. Before building new "canonical" infrastructure, trace what already
   exists — this codebase already had single-source-of-truth patterns
   per concern (one session registry, one guard, one journey-status
   function); the real gap was duplicated logic across 27 screens, not
   competing authorities.
3. When a full rewrite isn't authorized, build the new infrastructure for
   real and prove it against one representative unit end-to-end (with
   live verification) rather than either skipping the infrastructure
   entirely or claiming a full migration that didn't happen.
4. A canonical manifest must be generated from (or otherwise provably
   locked to) the existing canonical registry it's meant to describe —
   never hand-duplicated, which reintroduces the exact drift risk it
   exists to prevent.
5. Testing a migration against a live browser will surface real,
   sometimes pre-existing and unrelated defects (e.g. a reward map
   missing an entry) — disclose these plainly as found, distinct from
   whatever the migration itself did or didn't cause.
6. When the user overrides a scoped-down decision and requires the full
   migration, don't force every unit into the same generic shape — one
   screen (SmokeCraft Format/S5) had a real, approved non-linear branch
   (a supporting-module detour, not a defect). The fix was to let the
   manifest express that one exception (a `nextRouteOverride` field)
   rather than either breaking the approved navigation to fit the
   default chain, or leaving that one unit unmigrated and short of a
   genuine 100%. Prefer widening the canonical model's expressiveness
   over bending real product behavior to match it.
7. Per-screen migration goes faster and safer file-by-file with live
   verification after each small batch, not as one giant blind edit —
   this also makes it easy to correctly special-case the few screens
   whose completion has more than one side effect (e.g. two merged
   sessions behind one mode toggle, a terminal on-mount completion)
   without weakening the shared completion service to accommodate them.
8. A final "play the whole thing live" proof pass, run after the
   architecture and visual-lock work is already done and locked, will
   sometimes find genuinely nothing wrong — that is a valid, honest
   outcome, not evidence the pass wasn't thorough enough. Don't invent
   busywork fixes to justify the pass; report the clean result plainly
   with real live evidence (every route/marker/asset cross-checked
   against the single source of truth, not just "it looked fine").
9. When a long-running interactive browser test suite runs back-to-back
   against a local dev backend, an in-memory rate limiter can exhaust
   and produce errors that look like a product/environment defect but
   are actually a testing-harness artifact — check for a stale/duplicate
   server process and a fresh backend restart (which clears in-memory
   counters) before concluding the underlying feature is broken.

## Live Landing, Journey Entry, and Destination-Card Root-Cause Fix — permanent rules

1. Landing actions (Start / Resume / Start New / destination cards) must be
   tested through the visible controls a real user clicks — located by
   role/text, against the production build (`vite preview`) — never by calling
   the journey service directly, navigating programmatically, or seeding an
   active journey before the click.
2. Destination cards must preserve the active journey state — never reset it,
   never create a new journey, and never route in a way that discards progress.
3. Approved-asset status requires actual rendered-hash verification: hash the
   asset the browser really rendered (served URL / computed background-image)
   against the approved file on disk — a registry/manifest label is not proof.
4. Registry labels (`SC_ASSETS` keys, manifest entries, `data-visual-source`
   markers) cannot substitute for browser proof that the correct approved
   pixels actually rendered on the live route.
5. Static lock-screen images cannot replace a live prerequisite state: a
   not-yet-unlocked screen may only be gated by a live panel (real prerequisite
   + current progress + correct return route), never baked lock artwork.
6. Tests may not bypass the visible UI by directly invoking services to reach
   the assertion — set-up seeding to reach a starting condition is allowed, but
   the control under test must always be activated by a real click/keypress.
7. Start, Resume, and Start New are three distinct real-user states and must be
   validated separately as such, each with a real click, not assumed from
   source or collapsed into one path.
8. Landing destination routes (Rewards, Rankings, Passport, CraftHub) must be
   included in full-game acceptance testing, not just the linear session spine.

## Reverse-Proxy Header Trust and Local-vs-Production Testing Gaps — permanent rules
1. Any app deployed behind a PaaS edge (Railway, Render, Fly, Heroku, most
   load balancers) receives the real client IP in `X-Forwarded-For`. If
   `express-rate-limit` (or any IP-dependent middleware) runs with Express's
   default `trust proxy = false`, its validator throws
   `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` on every proxied request — which can
   silently break unrelated-looking flows (e.g. journey creation) in production
   only.
2. Set `app.set('trust proxy', <hop count>)` immediately after
   `const app = express()`, before any rate-limit / auth / session / IP-logging
   middleware and before route registration.
3. Use a **bounded hop count** equal to the number of trusted proxy hops (Railway
   = `1`), never `trust proxy = true`. `true` trusts an unbounded XFF chain and
   lets a direct attacker spoof `req.ip` to evade per-IP rate limiting and poison
   IP-based logging/auth.
4. Gate the setting on environment: production behind the proxy trusts its hop(s);
   local dev (direct connections, no proxy) stays `false` — trusting a phantom
   hop locally is itself spoofable.
5. Local-vs-production testing gap: a defect rooted in forwarded-header handling
   is INVISIBLE to `vite preview` / direct-connection local servers because no
   proxy inserts the header. Reproduce it honestly by sending a real request with
   an `X-Forwarded-For` header to a local production-mode backend and asserting it
   returns 200 with no validation throw — do not conclude "unreproducible" from a
   no-proxy local run alone.
6. Emit a boot diagnostic (no PII) showing environment, resolved `trust proxy`
   value, `req.ip` source, and limiter status, so a future proxy misconfiguration
   is visible at deploy time rather than only under production load.
7. Distinguish a working limiter from the bug: a plain `429` with the normal
   rate-limit body is the limiter correctly enforcing its limit under load; a
   `500`/thrown `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` is the trust-proxy
   misconfiguration. Do not conflate them when triaging.

## Mixed-Build Diagnosis and the Limits of Local-Only Verification — permanent rules

Learned during the Single Build & Live Runtime pass, investigating a credible live report
that one domain served two different build IDs across routes.

1. **Before theorising about caches, check whether the routes even *can* disagree.** If the
   affected routes all ship in the same main chunk (verify against the real `dist/` manifest —
   lazy chunks are often only admin/rarely-used screens), then a per-route build divergence
   cannot happen within one page load. It necessarily means different route URLs received
   *different HTML documents pointing at different bundles*. That single observation eliminates
   most component-level hypotheses immediately and reframes the problem as a delivery problem.
2. **Date the fix, not just the bug.** `git log -S "<marker>" -- <file>` tells you whether a
   cache-hygiene fix landed *before or after* the stale build being served. If correct
   `no-store` HTML headers already predate the stale build, browser HTML caching is largely
   excluded and suspicion should shift to the platform: an incomplete rollout or overlapping
   replicas serving two builds concurrently. This is a cheap check that redirects an entire
   investigation.
3. **Unregistering a service worker does NOT delete its Cache Storage.** These are independent
   APIs. A "we unregister any stray worker on load" safety net is only half a fix — the buckets
   it created survive and, if a worker is ever registered again, a stale-while-revalidate
   strategy will serve a previous build's hashed chunk ahead of the network. Always pair
   `getRegistrations().unregister()` with a prefix-scoped `caches.delete()`. Scope it by cache
   name prefix and never touch localStorage/IndexedDB, so recovery can never destroy user data.
4. **Keep a retired service worker file as a kill switch; delete the registrar instead.** The
   instinct is to delete `sw.js`. That is backwards: a 404 on `/sw.js` leaves browsers that
   still hold an old registration stuck with their old worker. Replace its body with a
   self-destructing worker (delete all caches on install/activate, then `unregister()`), and
   delete the *registration* code so nothing new ever registers. Dead registrar code that
   nothing imports is still a landmine worth removing.
5. **A directory in `public/` that shares a name with an SPA route makes `express.static` emit
   a 301.** `public/smokecraft/` + route `/smokecraft` produced a **301 Moved Permanently** —
   the most persistently cached response a browser stores — on a module's primary entry route.
   Use `express.static(dist, { index: false, redirect: false })` so such routes fall through to
   the no-store SPA fallback. Worth checking on every SPA whose asset folders mirror route names.
6. **A version-mismatch banner that waits for a click does not fix a stale tab.** If the
   frontend's embedded build ID disagrees with `/api/version`, recover automatically **once**,
   guarded by a `sessionStorage` marker **keyed to the backend commit you are recovering for**.
   Keying to the commit (not a bare boolean) means a genuine later deploy still gets one fresh
   attempt, while a mismatch no client can fix — such as a server genuinely serving inconsistent
   builds — never reloads twice.
7. **"Approved" is a directory name, not a verdict — open the asset.** A file sitting in an
   `approved/` folder was an internal design storyboard, complete with planning labels, wired
   into a live production route. Conversely, a genuinely user-facing candidate elsewhere baked
   fabricated learner stats into its pixels. Both were disqualified on inspection. Never wire an
   image into a production route without viewing it, and prefer a component built from existing
   UI patterns over any image containing baked data — baked numbers are stale data by
   construction and cannot be verified by any test that reads the DOM.
8. **Derive on-screen architecture facts from the authoritative registry.** The replacement
   How-It-Works screen renders its phase names and session counts from `VISIT_STRUCTURE` rather
   than hardcoded copy, so it cannot silently drift from the real journey the way both candidate
   images had (one described 4 stages, the other "6 of 16" sessions, against a real 6/27).
9. **When a live-shaped report arrives, sort every claim into three buckets and keep them
   separate in the write-up:** *genuinely broken in source* (reproduce it, fix it),
   *already correct in source* (re-verify fresh, then explain the divergence — usually a stale
   deploy), and *unverifiable from here*. Blurring these is the single most misleading thing a
   report can do. The credibility of "these three were already fine" rests entirely on having
   found and fixed real defects in the same investigation — follow the evidence in both
   directions, and say so.
10. **Local verification cannot close a live-deployment-shaped defect, and no amount of test
    quality changes that.** When the acceptance bar is "live screenshots show one build" and the
    environment cannot reach the deployment, the honest outcome is failure against that bar with
    an explicit statement of what *was* proven locally. Record the real blocked-access error
    verbatim. Never fabricate a live screenshot or a deployed-commit reading.

## Approved Asset Control Plane — permanent rules

1. **The approved image is always the visual foundation. React never
   substitutes its own layout for one — even a well-designed one.** A screen's
   shell is an actual approved image file from the repo, rendered as-is at its
   true aspect ratio (never cropped or reinterpreted), with React adding only
   live text, data, controls, hotspots, states and navigation positioned over
   it in percentage coordinates. A hand-built CSS/React composition standing in
   for an approved image is a defect regardless of how good it looks — design
   authority belongs to the owner, not to the implementer. When unsure, copy the
   pattern an existing correct screen already uses rather than inventing one.

2. **"The approved image has fake data baked in" is rarely a reason to abandon
   it.** Baked placeholder values almost always sit inside bounded *value
   zones* — which is precisely what React overlays are for. Cover each one with
   an **opaque** overlay carrying the real value. This satisfies "use only
   approved images" and "never show fake data" simultaneously. Treating the two
   as mutually exclusive, and drawing a replacement screen, gets the visual
   authority question exactly backwards. Overlays must be opaque: a translucent
   panel lets baked pixels bleed through and produces two numbers at once.
   Disclose the residual risk honestly (the file still contains the fake data)
   and recommend the owner re-export with blank value zones.

3. **Some approved images are explicitly overlay templates — read them before
   judging them.** Empty dashed circles, dotted blank lines and unfilled rings
   are the artwork telling you where live values belong. An image like this
   rendered with a hand-built data stack *below* it is a double failure: the
   template's own zones stay empty while a redundant panel duplicates them.

4. **Never let a destination control carry its own route string.** Route
   destinations for a hub/landing screen belong in ONE resolver that maps an
   action id to a destination. Scattered inline `navigate('/...')` calls are not
   just untidy — they hide bugs that are invisible per-control and obvious in
   aggregate. Consolidating them here immediately exposed two controls pointing
   at session-guarded curriculum routes that bounced every real user to
   enrollment, so the destination each advertised was never reachable. Patching
   such controls one at a time guarantees the next one recurs.

5. **A resolver should decide, not mutate — and should throw, not fall back.**
   Return the route plus flags (e.g. `startsNewJourney`) and let the caller run
   the one canonical state-changing hook. Throwing on an unknown action beats a
   default route: a silent fallback lands users on the wrong screen with no
   signal, which is indistinguishable from working.

6. **Guard-free by construction beats guard-checked by inspection.** Every route
   reachable from a public landing screen must be verified to sit behind no
   session guard. Keeping them in one map makes that property auditable in one
   place instead of requiring a per-control review that will be skipped.

7. **Three fields incremented by the same amount are one field with three
   names.** Before rendering "available / earned / lifetime / redeemed"-style
   breakdowns, check whether the engine actually derives them independently. If
   it does not, show the one real number and mark the rest unavailable. A value
   computed as `lifetime - available` when both always move together is
   identically zero by construction while *looking* like a derived figure —
   which is worse than an empty state, because it is quietly false.

8. **When a test asserts the shape of a rejected design, retarget it — don't
   delete it, and don't leave it.** An assertion whose target legitimately
   changed should be re-pointed at the equivalent correct property, with a
   comment recording what it used to check and why that changed. Two signals
   that you are retargeting honestly rather than weakening: the replacement is
   often *stricter* (e.g. "no empty buttons" → "every control exposes an
   accessible name", which is the correct requirement for image hotspots that
   are intentionally text-free), and any assertion that turns out to have
   mandated a defect (e.g. requiring account XP on a rewards screen) should be
   **inverted**, not relaxed.

9. **Verify assets by bytes, not by label.** Never accept an asset because a
   registry key says "approved". Confirm the file exists on disk at that exact
   path and case, and have the suite hash what the browser actually received and
   compare it to the file in the repo. Filenames with spaces (and especially
   double spaces) make percent-encoding mistakes easy and silent; hashing turns
   them into loud failures.

10. **Not every approved image is a blank-zone template — check each one
    individually before converting.** Two visually-similar sibling assets can
    differ completely: one may be a genuine overlay template (every value shown
    as `--`/blank), the other a fully-baked mock with specific fake numbers
    printed into its own pixels (e.g. one sibling image showing `-- / --` next
    to another showing `2,750 XP` as real-looking pixel content). A fully-baked
    asset cannot be safely converted into a live shell without either exposing
    its fake numbers or covering the entire composition — that is an asset
    problem for the owner to re-export, not a code problem to engineer around.
    Open and visually inspect every approved image before deciding it's
    convertible; don't assume based on a sibling or a filename.
