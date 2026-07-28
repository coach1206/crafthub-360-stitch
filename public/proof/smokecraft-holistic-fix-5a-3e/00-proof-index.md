# Holistic Fix 5A-3E — Proof Index

Starting commit: `edde8322`.

## Cultivator route audited

`Cultivation.jsx`, `/smokecraft/cultivation`.

## Exact prior eligibility gap

`handleSave()` granted 50 XP + the `cultivator` Passport stamp
immediately on any click of "Save to Passport" — no requirement to have
viewed any of the 7 real cultivation stages (Seed/Soil/Climate/Harvest/
Curing/Fermentation/Aging). A real "page-visit-only award," exactly the
gap disclosed in the Holistic Fix 5A-2 proof index.

## Evidence model

The client tracks `viewedStages` (a `Set` of stage ids genuinely opened
by the guest) and submits that raw set as evidence to
`POST /api/smokecraft/player-state/cultivator/submit`. The server
(`submitCultivatorEvidence` in `playerStateService.js`) independently
verifies the submission is a superset of all 7 real stage ids
(`src/data/cultivationStages.js`, the same list both client and server
import) before granting anything — a real, mechanical completeness
check ("all required steps completed"), not a subjective quality
judgment. Reuses the existing `smokecraft_activity_attempts` ledger
(`activity_type='skill_checkpoint'`, `activity_key='cultivator'`) — the
exact same pattern already proven for `master-blend` in Holistic Fix
5A-3. No new migration was required.

## Server-verification result

PASS — incomplete evidence (3 of 7 stages) rejected 400; a fabricated
stage id substituted for a real one rejected 400; a malformed
(non-array) payload rejected 400.

## XP result

PASS — the server-owned 50 XP amount (matching the existing
`cultivation-seed` value) is granted once, from real verified evidence.

## Passport result

PASS — the `cultivator` stamp is granted atomically alongside the XP,
once, idempotently (`ON CONFLICT DO NOTHING` on the existing
`(guest_reference, award_type, award_key)` UNIQUE index).

## Contents

- `00-proof-index.md` — this file.
- `01-cultivator-flow-results.json` — 11/11 from
  `verify-smokecraft-hf5a3e-cultivator-flow.mjs`.
- `02-cultivator-authority-validator-output.txt` — 13/13 from the new
  build-blocking `scripts/validateSmokecraftCultivatorAuthority.mjs`.

## Test results (11/11)

Incomplete evidence rejected (partial + empty) → invalid evidence
rejected (malformed payload + fabricated stage id) → valid evidence
accepted, XP + stamp awarded → repeated submission rejected (no double
grant) → two-tab race (exactly one grant) → cross-user isolation.

## Live smoke test (Playwright, real browser)

Navigated to `/smokecraft/cultivation`: Save button starts "View All 7
Stages First" (disabled) → real clicks opening all 7 stage cards → Save
button becomes "Save to Passport" (enabled) → real click → "Saved to
Passport". Zero console errors attributable to the cultivator flow (one
pre-existing, unrelated `/api/auth/me` 404 from a global auth-check
probe, confirmed unrelated by inspection — same finding as Holistic Fix
5A-3D).

## Regression re-verified (quick confirmation, unaffected suites)

HF4 30/30, HF5A-2 19/19, HF5A-3 blend 5/5, HF5A-3D tasting 13/13 — all
clean, confirming zero regression from this pass's changes.

## Build result

`npm run build` (15 prebuild validators + vite build): clean.

## What this pass does NOT cover

Collections, Skill Tree, Leaderboard, reward-screen reconnection —
untouched, explicitly out of this mandate's scope. The full 109-route/
five-viewport sweeps were not run, per this mandate's own instruction.
