# Skill Tree Persistence — Final Report

## Discovery audit

- **Route/component**: `/smokecraft/skill-tree` → `src/pages/smokecraft/SkillTree.jsx`.
- **Prior state**: hard-coded, local-only, 7 category labels with an explicit "not yet
  backend-connected" honest disclosure — no nodes, no persistence, no rule engine.
- **Reused, not duplicated**: `smokecraft_progression_events` (migration 085) — extended, not
  replaced. `xpService.js`'s idempotent `awardXp`. `DynamicMentorPanel`. The exact route/controller/
  service/migration pattern established by `seedSoilService.js` (Package 4) and
  `fillerArrangementService.js` (prior pass).
- **Existing real backend evidence tables found and reused as-is** (not modified): 
  `smokecraft_seed_soil_progress` (Package 4), `smokecraft_filler_arrangement_completion` (prior pass),
  `smokecraft_rolling_progress` (Package 5, migration 081), `smokecraft_flavor_stage_observations` and
  `smokecraft_pairing_drafts` (Package 6, migration 082), `golden_box_entries` (Package 1).
- **Identifiers**: `guest_reference` is the consistent learner-scope key across every one of the tables
  above — reused directly, no new identity scheme invented. Venue scope reused from
  `req.smokecraftIdentity`/existing middleware, not a new tenant model.
- **Auth pattern reused exactly**: `optionalAuth` + `attachSmokeCraftIdentity` + `requireSmokeCraftIdentity`
  + the same `bridgeIdentity` local helper every other SmokeCraft educational route file already defines.
- **Migration numbering**: last applied was `085`; this pass is `086`.
- **Locked sequence**: `TOTAL_SESSIONS = 27` in `session.js` — confirmed unmodified, not touched by this
  pass. Skill Tree nodes reference phase names (`Arrival`, `First Third`, etc.) as free-text
  `phase_reference`, not new session records — no new session was created.
- **What was deliberately left unchanged**: the approved Skill Tree artwork (`skill tree 1.png`,
  `SC_ASSETS.skillTreeBackground`) and its rendering — no redesign. The 7-category taxonomy and display
  order from the approved artwork — kept exactly, now backing real nodes instead of static labels.

## Data architecture

**Migration `086_skill_tree_persistence.sql`** — additive only, does not touch 075–085:
- `smokecraft_skill_tree_nodes` — node_key (unique), display_title, description, category,
  phase_reference, prerequisite_node_keys (TEXT[]), unlock_rule, completion_rule, xp_reward,
  golden_box_relevance, display_order, active, metadata, timestamps. Seeded with exactly **7 real
  node definitions**, not learner data.
- `smokecraft_skill_tree_learner_state` — guest_reference, node_key (FK), state (CHECK-constrained to
  `locked/available/in_progress/completed`), unlock_source, completion_source, completed_at,
  progress_percent, supporting_event_id (FK to `smokecraft_progression_events`), last_calculated_at,
  timestamps. **UNIQUE (guest_reference, node_key)** — the idempotency constraint (verified present in
  the test suite via `pg_constraint`).

No competing event table was created — `smokecraft_progression_events` is reused, and Skill Tree writes
a real `skill_tree_recalculated` event (idempotent per guest per day).

## Server-side rule engine (`skillTreeService.js`)

Walks all 7 nodes in `display_order` (a sequential prerequisite chain matching the approved artwork's
category order). For each node:
1. Checks whether all `prerequisite_node_keys` are already `completed` in this same pass's running
   state map — if not, the node is `locked`, with the exact missing prerequisite name returned.
2. If prerequisites are met, runs the node's real evidence check against its actual backend table
   (never trusts anything from the client) — `completed` if evidence exists, `available` if not.
3. Upserts the result into `smokecraft_skill_tree_learner_state` with `ON CONFLICT (guest_reference,
   node_key) DO UPDATE` — idempotent by construction, and `completed_at` is preserved (not reset) on
   repeat calculations once first set.

Every node response includes a human-readable `reason` (why locked / what evidence completed it) and
`missingRequirements` — proven in the test suite, not just implemented.

## API endpoints

`server/routes/skillTreeRoutes.js`, mounted at `/api/smokecraft/skill-tree`:
- `GET /` — full tree with learner state, summary (`totalNodes`/`completedNodes`/`completionPercent`,
  computed from real counts, never a fabricated number).
- `GET /nodes/:nodeKey` — single node detail with prerequisite/evidence explanation.
- `POST /recalculate` — secure server-side recalculation, same rule engine, idempotent.

All three require `requireSmokeCraftIdentity` — unauthenticated requests are rejected (verified: 400).
No route accepts a client-submitted node state (verified: `POST /` with a forged `{nodeKey, state:
'completed'}` body hits no route, 404).

## Frontend

`src/pages/smokecraft/SkillTree.jsx` — fully rewritten to load live state from the API:
- Real `loading` → `ready`/`error`/`offline` states, no pre-highlighted node during load.
- Every node (including locked ones) is a real interactive button — clicking a locked node opens a
  real detail panel explaining what's missing, never a dead control.
- Node colors/labels driven entirely by the real `state` field returned from the backend.
- `DynamicMentorPanel` reused unchanged.
- New `src/services/smokecraft/skillTreeApiClient.js` — same fetch/timeout/error-handling conventions
  as every other SmokeCraft API client.

## Idempotency verification (proven, not just implemented)

- Duplicate Filler Arrangement completion call: `alreadyCompleted: true, xpAwarded: false` (no second
  XP award) — verified by both the API response and a direct `COUNT(*) = 1` database check.
- Two consecutive `/recalculate` calls produce byte-identical `changeSummary` output.
- The daily recalculation event (`skill_tree_recalculated`) has exactly one row per guest per day in
  the database, even after multiple recalculation calls.

## Session/phase mapping confirmation

`TOTAL_SESSIONS` in `src/constants/session.js` is unchanged at 27 (confirmed via `grep`, not re-derived).
No new session, no removed session, no reordering. Skill Tree nodes reference phases as descriptive
text only (`Arrival`, `First Third`, `Second Third`, `Final Third`, `Reflection`) — not new session
records.

## Files changed

- `server/db/migrations/086_skill_tree_persistence.sql` (new)
- `server/services/smokecraft/skillTreeService.js` (new)
- `server/controllers/skillTreeController.js` (new)
- `server/routes/skillTreeRoutes.js` (new)
- `server/index.js` (route mounted)
- `src/services/smokecraft/skillTreeApiClient.js` (new)
- `src/pages/smokecraft/SkillTree.jsx` (rewritten — was static shell, now live)
- `verify-smokecraft-skill-tree.mjs` (new, 32 checks)
- `verify-smokecraft-new-gamification-screens.mjs` (updated: 2 assertions changed to match the real
  live Skill Tree instead of the old static-shell text; seed function updated to acquire a real guest
  session cookie, since the Skill Tree API is now identity-gated)
- 6 proof screenshots under `public/proof/smokecraft-skill-tree-persistence/`

## Tests run and exact results

| Suite | Result |
|---|---|
| `npm run db:migrate` | Applied cleanly (086 applied, 84 already-applied skipped) |
| `npm run build` | PASS |
| `verify-smokecraft-skill-tree.mjs` (new) | **32/32 passed** |
| `verify-smokecraft-filler-arrangement.mjs` | 17/17 |
| `verify-golden-box-package-5-leaf-construction.mjs` | 27/27 |
| `verify-golden-box-package-7a.mjs` | 33/33 |
| `verify-smokecraft-journey-state.mjs` | 7/7 |
| `verify-smokecraft-new-gamification-screens.mjs` (updated) | 23/23 |
| `verify-venue-management-command-hub-package-6b.mjs` | 33/33 |

The new suite proves, with real database queries and a real two-learner isolation check (not just UI
text): migration/table/constraint existence, exactly 7 seeded nodes, unauthenticated rejection, correct
initial locked/available states for a brand-new learner, zero fake completion/percentage for a learner
with no evidence, real Seed & Soil evidence unlocking Foundation, real Filler Arrangement completion
recognized and unlocking Leaf & Process, prerequisite chaining through Construction, idempotent
recalculation, idempotent duplicate-completion protection, rejection of a forged completion claim,
state persistence across a fresh API call (simulating refresh/new session), a second learner not
inheriting the first learner's progress, locked-node explanations, completed-node evidence display,
keyboard focus reaching a real control, and no horizontal overflow at desktop or handheld.

## Proof screenshots

`public/proof/smokecraft-skill-tree-persistence/`:
- `live-state-desktop-1440x900.png`, `live-state-handheld-390x844.png`,
  `live-state-tablet10-1280x800.png`, `live-state-tablet12-1366x1024.png` — real live learner state
  (Foundation completed, Leaf & Process available, rest locked) at all 4 required viewports.
- `node-detail-completed-filler-arrangement-evidence.png` — Foundation's detail panel showing real
  Seed & Soil evidence text.
- `node-detail-locked-explanation.png` — Community & Legacy's locked-state explanation.

Captured from the running application against a controlled test learner (a dedicated guest session
created via the real `/api/smokecraft/management-sync/guest-session` endpoint, given real evidence via
the real Seed & Soil and Filler Arrangement APIs — not fabricated data, not a design mockup). Test data
was cleaned up from the database after capture; the PNG files themselves remain as the proof record.

## Regression protection

Explicitly re-verified this pass did not break: Filler Arrangement (17/17), Wrapper Strength/leaf
construction (27/27, the screen whose nav link to Filler Arrangement was added in the prior pass),
Golden Box flows (33/33), journey state (7/7), the other 3 gamification screens
(Collections/Challenge Hub/Blend Fault Identification, 23/23), Venue Management (33/33), routing
(covered by the above suites' route checks), the asset registry (Skill Tree's existing
`skillTreeBackground` key untouched), authentication (unauthenticated-rejection test), database
migrations (086 applies cleanly on top of 085 without altering it), and the production build.

## Remaining blockers / honest disclosure

- **7 nodes, one per approved category** — not a deep multi-node-per-category tree. This was a
  deliberate scoping decision, disclosed here rather than silently done: building a finer-grained node
  graph (e.g., separate nodes per lesson within each category) would multiply the evidence-mapping work
  well beyond what fits in one controlled pass while keeping every node backed by real, distinct
  evidence rather than guessed thresholds.
- Collections ownership, Challenge Hub live state, and Blend Fault Identification backend scoring
  remain **explicitly out of scope**, exactly as instructed — not touched, not stubbed.
- `in_progress` state is defined in the schema/CHECK constraint but no current node transitions through
  it (every evidence check is binary: has the learner produced real evidence, yes or no) — this is
  accurate to the real backend tables available, not a missing feature; a future node with genuinely
  partial/measurable progress (e.g., "3 of 10 rolling steps") could use it without a schema change.
- XP awards for Skill Tree node completion itself (`xp_reward` column, seeded per node) are **not yet
  actually granted** — the node's `xp_reward` is informational/display-ready but no `awardXp()` call
  fires on node completion in this pass, since node completion is *derived* from other systems' XP-
  granting events (e.g., Filler Arrangement already awards its own XP) rather than being a second,
  separate award trigger — awarding XP again for the same underlying achievement would violate the
  idempotency principle rather than serve it. This is a deliberate design choice, disclosed rather than
  silently done.

## Source control

- Repo: `coach1206/crafthub-360-stitch`, branch `recovery/smokecraft-codex-final`.
- Starting commit confirmed: `00f25571` (verified `HEAD` exact match, working tree clean, before any
  change was made).
- Ending/new commit and push confirmation: reported in the same turn immediately after this document is
  committed (see final chat response for the exact hash and push result).

PASS — SKILL TREE PERSISTENCE COMPLETE
