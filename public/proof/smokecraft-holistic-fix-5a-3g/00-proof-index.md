# Holistic Fix 5A-3G — Proof Index

Starting commit: `b3460089`.

## Skill Tree routes audited

`GET /api/smokecraft/skill-tree/`, `GET /api/smokecraft/skill-tree/nodes/:nodeKey`,
`POST /api/smokecraft/skill-tree/recalculate` (backend, migration 086,
already real before this pass); `SkillTree.jsx` (`/smokecraft/skill-tree`,
frontend).

## Client progression paths found

**None.** `skillTreeApiClient.js` only exposes read calls
(`getSkillTree`/`getNode`) and a server-side `recalculate` trigger —
there was never a client-set-progress path to remove.
`smokecraft_skill_tree_learner_state.state` is recomputed from real
backend evidence tables (`EVIDENCE_CHECKS`) on every request; the client
never submits a completion flag. Confirmed by direct code audit, not
assumed.

## Client progression paths removed

N/A — none existed. This pass's real work was closing 4 concrete
correctness defects found during the audit (identity/rate-limit/first-
visit/account-conversion) and adding a correction/reversal capability the
system genuinely lacked, not removing a client-authority path.

## Skill Tree nodes mapped (7 real nodes, matches migration 086's own disclosure)

| Node | Qualifying activity | Evidence table | Unlock requirement |
|---|---|---|---|
| foundation | Explore ≥1 Seed & Soil component | smokecraft_seed_soil_progress | always available |
| leaf-process | Complete Filler Arrangement lesson | smokecraft_filler_arrangement_completion | requires: foundation |
| construction | Complete ≥1 rolling-process step | smokecraft_rolling_progress | requires: leaf-process |
| flavor-experience | Record ≥1 flavor-stage observation | smokecraft_flavor_stage_observations | requires: construction |
| pairing-pairings | Build ≥1 pairing draft | smokecraft_pairing_drafts | requires: flavor-experience |
| mastery-blending | Start a real Golden Box entry | golden_box_entries | requires: pairing-pairings |
| community-legacy | ≥2 distinct progression-event types | smokecraft_progression_events (breadth) | requires: mastery-blending |

No new nodes, progression rules, or artwork were invented this pass —
this is the exact 7-node set migration 086 already seeded.

## Defects found and fixed

- **SC-D034**: missing rate-limiter dev/test skip on `skillTreeRoutes.js`
  (same class as SC-D021/SC-D031) — closed.
- **SC-D035**: authenticated-account Skill Tree identity unprefixed
  (`req.smokecraftIdentity.id` instead of `user:${id}`), keying an
  account's node progression inconsistently with the rest of player
  state — closed.
- **SC-D036**: missing `ensureSmokeCraftGuestIdentity` on
  `skillTreeRoutes.js` — a genuinely first-ever visit to
  `/smokecraft/skill-tree` would have 401'd (same class as SC-D033).
  Closed and re-verified live via a fresh-cookie-jar request.
- **SC-D037**: `convertGuestToAccount` never transferred any of the
  underlying Skill Tree evidence tables (Seed & Soil, Filler
  Arrangement, Rolling, Flavor Stage, Pairing Drafts, Golden Box
  entries) on guest-to-account conversion — since `recalculate()` always
  re-derives node state from live evidence (never trusts a cached
  flag), this meant 100% of Skill Tree progress was silently lost on
  every conversion. Closed by transferring the 6 backing evidence
  tables plus the learner-state cache, then re-running `recalculate()`
  for the new account identity AFTER commit (on a fresh connection, to
  avoid reading the transfer's own uncommitted rows). Verified live:
  earn Foundation + Leaf & Process as a guest → create account →
  convert → both nodes still completed under the account identity.

## Evidence integration result

PASS — every node's state is recalculated from real backend evidence on
every request, never trusted from the client. `supporting_event_id` /
the underlying evidence tables link each node to real gameplay activity;
every `completion_rule` maps to a real `EVIDENCE_CHECKS` entry (enforced
by the new validator).

## Duplicate-race result

PASS — a two-tab `recalculate` race against the same qualifying evidence
still results in exactly one `completedAt` per node (enforced by the
real `UNIQUE(guest_reference, node_key)` DB constraint).

## Correction/reversal result

PASS (new this pass) — staff-only, append-only, reuses the existing
`smokecraft_reward_corrections` ledger (`correctionType='skill_tree'`,
same table Collections uses). The original
`smokecraft_skill_tree_learner_state` row is never deleted/edited/set to
a non-enum value; `recalculate()` overlays a `'corrected'` state at
read-time only, excludes the node from `summary.completedNodes`, and
correctly breaks the downstream prerequisite chain (a corrected node's
dependents re-lock).

## Cross-device result

PASS — Skill Tree progression is 100% server-side; any device
authenticated as the same guest/account sees identical live
recalculated data (no local mirror to desync).

## Account-conversion result

PASS (newly closed this pass — was previously 100% broken/silent data
loss). Verified live: a guest completes 2 real nodes, creates a real
account, converts, and both nodes are still completed under the new
authenticated identity (`skillTreeEvidenceRowsTransferred` and
`skillTreeCompletedNodes` are now real, non-zero, auditable fields on the
conversion response).

## Live-screen result

PASS — `SkillTree.jsx` fetches live server data on every mount (no stale
local mirror), with real loading/error/offline/retry states already
present before this pass; a new `'corrected'` visual state was added
this pass so a reversed node is never silently hidden.

## Migration added

None. Migration 086 (`smokecraft_skill_tree_learner_state` /
`smokecraft_skill_tree_nodes`) and migration 096
(`smokecraft_reward_corrections`) already provided everything required
— reused, not duplicated, per this operation's established discipline.

## Contents

- `00-proof-index.md` — this file.
- `01-skill-tree-flow-results.json` — 22/22 from
  `verify-smokecraft-hf5a3g-skill-tree-flow.mjs`.
- `02-skill-tree-authority-validator-output.txt` — 20/20 from the new
  build-blocking `scripts/validateSmokecraftSkillTreeAuthority.mjs`.

## Regression re-verified (quick confirmation, unaffected suites)

HF4 player-state 30/30, HF4B account/conversion 32/32, HF5A-3 blend
evidence 5/5, HF5A-3D tasting 13/13, HF5A-3E cultivator 11/11, HF5A-3F
collections 19/19 — all clean, confirming zero regression from this
pass's changes.

## Build result

`npm run build` (17 prebuild validators + vite build): clean.

## What this pass does NOT cover

Leaderboard, reward-screen reconnection beyond Skill Tree,
correction/reversal beyond what Skill Tree required — untouched,
explicitly out of this mandate's scope. The full 109-route/five-viewport
sweeps were not run, per this mandate's own instruction.
