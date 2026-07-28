# Holistic Fix 5A-3D — Proof Index

Starting commit: `3e7d9d40`.

## Scope

Closes only the tasting-flow gap (per this mandate's own exclusions —
Collections, Skill Tree, Leaderboard, reward-screen reconnection are all
untouched this pass).

## Tasting screens audited

- `MiniTastingRound.jsx` (`/smokecraft/mini-tasting`) — already server-
  authoritative via the existing, already-closed
  `awardSessionRewards`/`completeSession` path (Holistic Fix 4/5A). No
  gap, no change.
- `FirstThird.jsx` / `SecondThird.jsx` / `FinalThird.jsx` (curriculum
  Third Tasting sessions) — their real `personalNotes` free-text fields
  already persist via the existing, already-server-authoritative
  journey-snapshot sync (Holistic Fix 4B); confirmed by inspection that
  `completeSessionOnServer` never transmits journey content, only
  `sourceRoute`/`deviceId` metadata — private notes never enter the
  public award/audit ledger. XP already flows through the closed
  `awardSessionRewards` path. No gap found.
- **`MiniTasting.jsx`** (`/smokecraft/mini-tasting-module`) — the real
  gap, closed this pass (see below).

## What was closed

`MiniTasting.jsx` previously granted XP the instant "Begin" was clicked
— no requirement to actually select a cigar, and the
selection/comparison state lived only in local `GuestSessionContext`
state (no server persistence, no cross-device resume). Now:

- **Draft** (`smokecraft_tasting_drafts`, migration 097): server-
  authoritative, optimistic-concurrency (same pattern as the existing
  journey-snapshot sync — `expectedVersion`, 409 + server's current state
  on a stale write), debounced save, real cross-device resume.
- **Completion** (`submitTastingCompletion`, reuses the existing
  `smokecraft_activity_attempts` ledger, `activity_type='tasting'`): the
  client submits its raw selection as evidence; the server independently
  verifies `selectedCigarId` is a genuine id from its own copy of the
  venue flight inventory before granting anything. Idempotent — at most
  one completion, ever, per guest.

## Contents

- `00-proof-index.md` — this file.
- `01-tasting-flow-results.json` — 13/13 from
  `verify-smokecraft-hf5a3d-tasting-flow.mjs`.
- `02-tasting-authority-validator-output.txt` — 15/15 from the new
  build-blocking `scripts/validateSmokecraftTastingAuthority.mjs`.
- `03-migration-097-schema.sql` — the new schema.

## Test results (13/13)

New draft (honest empty state) → save → update → reload (exact match) →
stale-write rejected (409, server value preserved) → incomplete
completion rejected (400) → fabricated cigar id rejected (400) → valid
completion (server-decided XP) → duplicate completion rejected (no
double XP, even with a different selection) → two-tab race (XP granted
exactly once) → cross-user isolation (a separate guest never sees
another guest's draft) → draft-save-alone grants zero XP.

## Live smoke test (Playwright, real browser)

Navigated to `/smokecraft/mini-tasting-module`: primary button starts
"Select a Cigar First" (disabled) → real click on a flight card's Select
button → button becomes "Complete Tasting" (enabled) → real click →
"Tasting Complete ✓". Zero console errors attributable to the tasting
flow (one pre-existing, unrelated `/api/auth/me` 404 from a global
auth-check probe, confirmed unrelated by inspection).

## Regression re-verified (unaffected suites, quick confirmation)

HF4 30/30, HF4B 32/32, HF5A 22/22, HF5A-2 19/19, HF5A-3 blend 5/5 — all
clean, confirming zero regression from this pass's changes.

## Build result

`npm run build` (14 prebuild validators + vite build): clean.

## What this pass does NOT cover

Collections, Skill Tree, Leaderboard, reward-screen reconnection —
untouched, explicitly out of this mandate's scope. The full 109-route/
five-viewport sweeps were not run, per this mandate's own instruction.
