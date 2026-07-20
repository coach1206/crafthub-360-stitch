# CraftHub MVP2 — Restoration Report

See `docs/CRAFTHUB_MVP2_APPROVED_VERSION_AUDIT.md` for the full forensic
search. Summary: no separate approved/current CraftHub implementation
exists to restore from — `src/pages/CraftHub.jsx` is already the current
and only approved implementation. This package therefore corrects the one
proven defect within it rather than performing a restoration from a
nonexistent alternate version.

## Change made

Removed the hardcoded `SIGNALS` constant and the "Venue Signals" grid
section that rendered it (`src/pages/CraftHub.jsx`). Every value in that
array (`Active Tables: 12`, `Staff Handoffs: 3`, `Humidor: 62°F / 70%`,
etc.) was a fabricated literal with no data source. Per this task's own
rule — "If a data source is unavailable: show an honest empty state; do not
fabricate values; document the missing connection" — and given there is no
real venue-signal data source wired anywhere in this application to connect
an honest empty state to, the fabricated section was removed rather than
replaced with new UI (avoiding "do not redesign"/"do not create a new
composition" risk).

## Everything else preserved unchanged

- `ROW1_MODULES` (SmokeCraft 360, PourCraft 360, WineCraft 360, BeerCraft
  360, 360 Passport Connections) — unchanged, all real routes/images.
- `ROW2_MODULES` (Staff Handoff, DayOne360 Travel) — unchanged.
- Header (Back to NOVEE OS, Home, DayOne360 Travel, Demo Mode, 360 Passport
  Connections buttons) — unchanged.
- Hero text — unchanged.
- Bottom action nav (Enter CraftHub, Staff Handoff, 360 Passport
  Connections, DayOne360 Travel) — unchanged.
- All approved images (`/smokecraft.jpg`, `/pourcraft.jpg`, `/winecraft.jpg`,
  `/beercraft.jpg`, `/passport.jpg`, `/crafthub-gold.jpg`) — confirmed
  present on disk, unchanged, no new/generated/stock images introduced.
- `status: "coming-soon"` labeling on PourCraft/WineCraft/BeerCraft — kept;
  this is an honest label (these verticals are not built yet, per
  `docs/crafthub-mvp2-replication-blueprint.md`), not a fabricated metric.
- Staff Handoff PIN flow, Demo Mode entry, all `navigate()` targets — kept
  identical.

## Backend and wiring preserved

No API calls, context reads, routes, or Staff Handoff/Demo Mode logic were
touched. `useDemoMode()`, `StaffHandoffButton`, and every `navigate()` call
site are byte-identical to before this change except for the deleted
`SIGNALS` block and its render section.

## Tests

`verify-smokecraft-start-journey-crafthub-mvp2.mjs` (CraftHub section) —
confirms `/crafthub` loads, no JS runtime console errors, no fabricated
venue-signal text present, SmokeCraft entry / Passport Connections / Back to
NOVEE OS all navigate correctly, no broken images.

## Proof

`public/proof/smokecraft-start-journey-crafthub-mvp2-correction/crafthub-rebuilt-live.png`

## Superseded by the approved-asset implementation

This report covered the metrics-removal-only fix to the old centered
card-grid `CraftHub.jsx`. That implementation was subsequently fully
replaced with a rebuild over a newly-uploaded approved image
(`public/assets/CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`) — see
`docs/CRAFTHUB_MVP2_APPROVED_ASSET_IMPLEMENTATION.md` for the current
implementation. The fabricated-metrics removal documented here remains
true of the current implementation (the new approved image contains no
fabricated metrics either) — this document is preserved as the historical
record of that specific fix, not overwritten.
