# Holistic Fix 5A-3F — Proof Index

Starting commit: `2c655da2`.

## Collections routes audited

`GET /api/smokecraft/collections/`, `GET /api/smokecraft/collections/items/:itemKey`,
`POST /api/smokecraft/collections/recalculate` (backend, migration 087,
already real before this pass); `CollectionsCenter.jsx`
(`/smokecraft/collections`, frontend).

## Client unlock paths found

**None.** The client-side `collectionsApiClient.js` only exposes read
calls and a server-side `recalculate` trigger — there was never a
client-set-ownership path to remove. This system was already genuinely
server-authoritative, evidence-checked (`EVIDENCE_CHECKS` against real
backend tables), and duplicate-protected at the DB level before this
pass — confirmed by direct code audit, not assumed.

## Client unlock paths removed

N/A — none existed. This pass's real work was closing 3 concrete
correctness defects found during the audit (identity/conversion/first-
visit) and adding a correction/reversal capability the system genuinely
lacked, not removing a client-authority path.

## Collection items mapped (5 real items, matches migration 087's own disclosure)

| Item | Category | Qualifying activity | Source table |
|---|---|---|---|
| filler-mastery-badge | Leaf Collection | Complete Filler Arrangement lesson | smokecraft_filler_arrangement_completion |
| seed-soil-scholar-badge | Knowledge Collection | Explore ≥1 Seed & Soil component | smokecraft_seed_soil_progress |
| master-roller-badge | Cigar Collection | Complete ≥1 rolling-process step | smokecraft_rolling_progress |
| skill-tree-starter-badge | Badge Collection | Complete Skill Tree Foundation node | smokecraft_skill_tree_learner_state |
| progression-pioneer-badge | Reward/Achievement Collection | ≥2 distinct progression event types | smokecraft_progression_events |

Tool Collection and Lounge Collection categories have no seeded items —
disclosed by migration 087's own comments as having no legitimate
backend earn condition; not fabricated this pass.

## Defects found and fixed

- **SC-D031**: missing rate-limiter dev/test skip (same class as
  SC-D021) — closed.
- **SC-D032**: authenticated-account identity unprefixed
  (`req.smokecraftIdentity.id` instead of `user:${id}`), causing
  guest-to-account conversion to never transfer Collections ownership —
  closed. Verified live: earn → create account → convert → still owned
  under the account identity.
- **SC-D033**: missing `ensureSmokeCraftGuestIdentity` — a genuinely
  first-ever visit to `/smokecraft/collections` 401'd. Found live via a
  fresh-browser Playwright smoke test, not assumed. Closed.

## Source-event integration result

PASS (already real before this pass, re-verified) — every item's
ownership is recalculated from real backend evidence on every request,
never trusted from the client. `source_progression_event_id` links each
award to a real `smokecraft_progression_events` row.

## Duplicate-race result

PASS — a two-tab `recalculate` race against the same qualifying event
still results in exactly one ownership record (enforced by the real
`UNIQUE(guest_reference, collection_item_key)` DB constraint).

## Correction/reversal result

PASS (new this pass) — staff-only, append-only. The original
`smokecraft_collection_ownership` row is never deleted/edited;
`recalculate()` reads the corrections ledger to report `state:
'corrected'` and excludes it from the ownership summary total, while
preserving the original `earnedAt`.

## Cross-device result

PASS — Collections ownership is 100% server-side; any device
authenticated as the same guest/account sees identical live data (no
local mirror to desync).

## Account-conversion result

PASS (newly closed this pass — was previously broken) — verified live:
a guest earns an item, creates a real account, converts, and the SAME
item is visible under the new authenticated identity.

## Live-screen result

PASS — `CollectionsCenter.jsx` fetches live server data on every mount
(no stale local mirror), with real loading/error/offline/retry states
already present before this pass.

## Contents

- `00-proof-index.md` — this file.
- `01-collections-flow-results.json` — 19/19 from
  `verify-smokecraft-hf5a3f-collections-flow.mjs`.
- `02-collections-authority-validator-output.txt` — 15/15 from the new
  build-blocking `scripts/validateSmokecraftCollectionsAuthority.mjs`.

## Regression re-verified (quick confirmation, unaffected suites)

HF4 30/30, HF4B 32/32, HF5A-3 blend 5/5, HF5A-3D tasting 13/13, HF5A-3E
cultivator 11/11 — all clean, confirming zero regression from this
pass's changes.

## Build result

`npm run build` (16 prebuild validators + vite build): clean.

## What this pass does NOT cover

Skill Tree, Leaderboard, reward-screen reconnection beyond Collections,
correction/reversal beyond what Collections required — untouched,
explicitly out of this mandate's scope. The full 109-route/five-
viewport sweeps were not run, per this mandate's own instruction.
