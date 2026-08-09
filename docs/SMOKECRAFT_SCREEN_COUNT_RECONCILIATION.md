# SmokeCraft 360 — Screen Count Reconciliation

## Previous count
The prior audit (`docs/SMOKECRAFT_OWNER_VISUAL_AUDIT.md`) captured **30** numbered screens — the 5 entry-layer screens, the 3-screen recovered opening chain, the 27-session spine (with its 5 merged-session groups collapsed to one capture each), and nothing else.

## New complete count
This pass captured **43** numbered screens/states.

## Why screens/states were missing before
The prior 30-screen pass followed only the `SEQUENCE` array in `scripts/captureSmokecraftOwnerVisualAudit.mjs`, which was built strictly from `docs/SMOKECRAFT_FULL_ROUTE_GRAPH.json`'s `sessions` array (the 27-session spine) plus `entryLayer` and `recoveredOpeningChain`. It did not read that same JSON file's **`supportingModules`** array, which lists 10 real, routed, gated screens outside the 27-session spine — 6 of which (`wrapper-strength`, `smokecraft-challenge`, `second-humidor-match`, `mini-tasting`, `connections`, `management-sync`) were never visited or captured at all. It also captured exactly one frame per screen regardless of whether that screen has materially different real states (environment-selection screens, acknowledgement screens, results screens).

## Newly discovered screens/states this pass
- **6 previously-uncaptured supporting-module routes**: Wrapper/Strength Education, SmokeCraft Challenge, Second Humidor Match, Mini Tasting Round, 360 Passport Connections, Venue/Management Sync (global #s 018, 032, 033, 034, 040, 041).
- **1 previously-uncaptured post-game screen**: Golden Box Competitions Hub (#043) — the real entry point into the post-game competition backend described in `FULL_SUBSTEP_SEQUENCE.md`. Note: the deeper Build Studio / Presentation / Defense / Judging flow inside that system requires creating a real competition entry and driving it through a real multi-actor (player + judge) cycle — this was **not** captured in this pass; doing so honestly would require its own dedicated capture pass, not a quick add-on. This is disclosed rather than papered over.
- **6 additional meaningful states** for screens whose internal state materially changes what a player sees: Golden Box Rules (unchecked / acknowledged), Humidor Match (initial / environment selected / settings applied — 3 states, 2 new beyond the initial), Meet Your Cigar (initial / section selected), Pairing Lab (before / after selection), Scorecard (initial / completed).
- **1 real defect found only because of the expanded pass**: Mentor Commentary (#027) was successfully reached this time via a more careful, still-real interaction sequence (filling the Second Third observation textarea and letting autosave settle before advancing) — the prior audit's generic advance heuristic had failed to leave Second Third and had mis-captured Second Third content under the "Mentor Commentary" label. The real Mentor Commentary screen is now confirmed to exist and render correctly.

## Previous captures that were duplicates / collapses
No previously-captured screen turned out to be a true duplicate of another. The prior pass's 5 merge-groups (S8/9, S12/13, S16/17/18, S19/20, S25/26) remain correctly collapsed in this pass too, per the mandate's own rule ("do not collapse unless literally same route/visible state") — each of those 5 route/component pairs genuinely renders once, tracking one completion signal, confirmed in `docs/smokecraft-ui-handoff/FULL_SUBSTEP_SEQUENCE.md`.

## Final exact canonical visual count
**43** distinct real screens/states were captured and are the basis of this inspection package, up from the prior pass's 30. This number is **not** asserted as final/exhaustive — the disclosed gap (the full Golden Box post-game competition/judging cycle, and a tablet-portrait secondary pass) means a still-more-complete count is possible in a dedicated follow-up pass, which this mandate's "keep it lean" instruction did not ask for here.
