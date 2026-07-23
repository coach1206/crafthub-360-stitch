# 04 — Canonical Session-to-Phase Map (unchanged by this pass, recorded for the record)

Source: `VISIT_STRUCTURE` in `src/constants/session.js`.

| Phase | Title | Session # | Session id | Route |
|---|---|---|---|---|
| 1 | Session Preparation | 1 | entry | /smokecraft/welcome |
| 1 | Session Preparation | 2 | humidor-match | /smokecraft/humidor-match |
| 1 | Session Preparation | 3 | meet-your-cigar | /smokecraft/meet-your-cigar |
| 1 | Session Preparation | 4 | terroir | /smokecraft/terroir |
| 1 | Session Preparation | 5 | format | /smokecraft/format |
| 1 | Session Preparation | 6 | cut-toast-light | /smokecraft/cut-toast-light |
| 1 | Session Preparation | 7 | lighting-tutorial | /smokecraft/lighting-tutorial |
| 2 | First Third | 8 | first-third | /smokecraft/first-third |
| 2 | First Third | 9 | first-third (merged into 8) | /smokecraft/first-third |
| 2 | First Third | 10 | flavor-memory | /smokecraft/flavor-memory |
| 2 | First Third | 11 | pairing-lab | /smokecraft/pairing-lab |
| 3 | Second Third | 12 | second-third | /smokecraft/second-third |
| 3 | Second Third | 13 | second-third (merged into 12) | /smokecraft/second-third |
| 3 | Second Third | 14 | mentor-commentary | /smokecraft/mentor-commentary |
| 3 | Second Third | 15 | knowledge-drop | /smokecraft/knowledge-drop |
| 4 | Final Third | 16 | final-third | /smokecraft/final-third |
| 4 | Final Third | 17 | final-third (merged into 16) | /smokecraft/final-third |
| 4 | Final Third | 18 | final-third (merged into 16) | /smokecraft/final-third |
| 5 | Reflection | 19 | scorecard | /smokecraft/scorecard |
| 5 | Reflection | 20 | scorecard (merged into 19) | /smokecraft/scorecard |
| 6 | Results | 21 | ai-summary | /smokecraft/ai-summary |
| 6 | Results | 22 | pairing-recommendations | /smokecraft/pairing-recommendations |
| 6 | Results | 23 | passport-stamp | /smokecraft/passport-stamp |
| 6 | Results | 24 | final-review | /smokecraft/final-review |
| 6 | Results | 25 | rewards | /smokecraft/rewards |
| 6 | Results | 26 | achievements (shared component) | /smokecraft/rewards |
| 6 | Results | 27 | session-complete | /smokecraft/session-complete |

Every session belongs to exactly one phase. No session number is duplicated, skipped, or orphaned. Merged sessions (9→8, 13→12, 17/18→16, 20→19) each keep their own stable session number/title per the original locked-spine mandate, sharing one screen's completion signal — this pass did not change that structure.

## Supporting modules and entry-layer screens (outside the 27-session/6-phase spine, unaffected)

`SUPPORTING_MODULES` (9 entries incl. Golden Box, mentor selection, seed-soil, etc.) and `ENTRY_LAYER_SCREENS` (5 entries) remain explicitly outside `TOTAL_SESSIONS`/the phase map, as documented in `src/constants/session.js`. Golden Box Packaging Studio (added in a prior pass, connected to the journey in Phase 9A) is likewise outside the numbered spine — its placement is unaffected by this reconciliation in either direction.
