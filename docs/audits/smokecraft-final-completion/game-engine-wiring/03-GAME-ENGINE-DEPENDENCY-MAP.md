# Game-Engine Wiring — Dependency Map

Real dependency chains, as implemented and verified across this session's suites (not aspirational):

```
Flavor Memory perception/flavor save (fixed this pass)
  → smokecraft_pairing flavor-memory table
  → passport-360 flavor-memory table
  → (downstream, confirmed by architecture, not re-verified this pass) Pairing Lab recommendation input

Leaf/construction step completion (Package 5)
  → construction progress tables
  → knowledge-check eligibility on the same screen
  → (Golden Box relevance: component catalog rows these steps reference are the same rows
     Golden Box entries select from — shared catalog, not a duplicate system)

Golden Box entry draft → submit (Package 1/2/3)
  → golden_box_entries.status transition
  → judge assignment becomes possible (Package 7A)
  → judge scorecard submit/lock/amend (Package 7A)
  → computeAggregateResult() → golden_box_results
  → XP award (idempotent, Package 1)
  → leaderboard/badge integration hooks (Package 1, honest not_configured/real-insert behavior)

Mentor review submit (Package 7A)
  → golden_box_mentor_reviews (submitted/amended only, never draft)
  → visible on entrant Results Experience
```

## Central event/idempotency mechanism (already exists — not duplicated this pass)

`xpService.awardXp({..., idempotencyKey})` — already the single shared idempotent-award mechanism used
throughout Packages 1–7A. This pass did not create a new parallel event-bus system, since one already
exists and is already used correctly everywhere audited. No new migration was needed or added.

## Not yet mapped

Quiz-pass → skill-eligibility → Golden Box prerequisite chains for the screens listed as `NOT_AUDITED`
in `01-COMPLETE-INTERACTION-INVENTORY.md` are not confirmed either way this pass.
