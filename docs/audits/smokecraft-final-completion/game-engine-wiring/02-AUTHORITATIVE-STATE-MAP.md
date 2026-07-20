# Game-Engine Wiring — Authoritative State Map

For every screen confirmed `FULLY_WIRED` in `01-COMPLETE-INTERACTION-INVENTORY.md`, the authoritative
source of truth is a real database table reached through a real API, with `localStorage`
(`sc_journey_v1` via `SmokeCraftJourneyContext`) acting only as a client-side resume cache layered on
top — never the sole source of truth. Specifically:

| Domain | Authoritative store | Access path |
|---|---|---|
| Seed/soil/terroir progress, notes | Generic SmokeCraft progress/notes tables (Package 4) | `seedSoilApiClient.js` |
| Leaf/construction progress, QC decisions | `golden_box_component_catalog`-linked progress tables (Package 5) | `leafConstructionApiClient.js` |
| Golden Box entries, versions, components | `golden_box_entries`, `golden_box_entry_versions`, `golden_box_blend_components` | `goldenBoxApiClient.js` |
| Judge scorecards | `golden_box_scorecards`, `golden_box_scores` | `goldenBoxApiClient.js` |
| Mentor reviews | `golden_box_mentor_reviews` (Package 7A) | `goldenBoxApiClient.js` |
| Flavor Memory perception/flavor selections | `smokecraft_pairing`/passport-360 flavor-memory tables | `POST /api/modules/smokecraft/pairing/flavor-memory`, `POST /api/passport-360/smokecraft/flavor-memory/save` — **now debounce-saved on every change, not just at Continue (fixed this pass)** |
| XP | `xp_accounts`/`xp_transactions` (idempotent by key) | `xpService.js` |

## Temporary compatibility state (documented separately, not authoritative)

- `sc_journey_v1` (`localStorage`) — venue/mentor selection cache, in-progress form values before a
  debounced/final save completes, and UI-only navigation state (which step of a multi-step screen is
  showing). This is legitimate resume-without-reload UX, not a substitute for backend persistence, for
  every screen confirmed above.
- React `useState` inside `EducationalDetailPanel`/`MediaSlot`/quiz widgets — purely presentational
  (which detail panel is open, which tab is active) and correctly does not hold any state the mandate
  would call "permanent learner or game state."

## Screens not yet mapped

`Scorecard.jsx`, `PairingLab.jsx`, `HumidorMatch.jsx`/`SecondHumidorMatch.jsx`, `LeafChallenge*.jsx` —
authoritative-state status unknown pending the audits flagged in `01-COMPLETE-INTERACTION-INVENTORY.md`.
