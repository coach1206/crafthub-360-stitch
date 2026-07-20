# Production Readiness — Route and Sequence Map (Scoped)

Source of truth: `src/constants/session.js` (`VISIT_STRUCTURE`, locked, not modified this pass) and
`src/App.jsx` (route registry, not modified this pass beyond prior packages' additions).

## The real, locked 27-session sequence (unchanged, verified against source)

| # | Route | Screen | Phase group |
|---|---|---|---|
| 1 | /smokecraft/welcome | Welcome to Today's Experience | Arrival |
| 2 | /smokecraft/humidor-match | Choose Your Cigar | Arrival |
| 3 | /smokecraft/meet-your-cigar | Meet Your Cigar | Arrival |
| 4 | /smokecraft/terroir | Terroir | Arrival |
| 5 | /smokecraft/format | Construction Inspection | Arrival |
| 6 | /smokecraft/cut-toast-light | Choose Your Cut | Arrival |
| 7 | /smokecraft/lighting-tutorial | Lighting Tutorial | Arrival |
| 8 | /smokecraft/first-third | First Draw (merges 9: Flavor Discovery) | First Third |
| 10 | /smokecraft/flavor-memory | Flavor Memory Exercise | First Third |
| 11 | /smokecraft/pairing-lab | Suggested Pairings | First Third |
| 12 | /smokecraft/second-third | Flavor Evolution (merges 13: Construction Check) | Second Third |
| 14 | /smokecraft/mentor-commentary | Mentor Commentary | Second Third |
| 15 | /smokecraft/knowledge-drop | Knowledge Drop | Second Third |
| 16 | /smokecraft/final-third | Flavor Finish (merges 17, 18) | Final Third |
| 19 | /smokecraft/scorecard | Rate Every Category (merges 20: Personal Notes) | Scoring |
| 21 | /smokecraft/ai-summary | AI Summary | Closeout |
| 22 | /smokecraft/pairing-recommendations | Personalized Pairing Recommendations | Closeout |
| 23 | /smokecraft/passport-stamp | Passport Stamp Animation | Closeout |
| 24 | /smokecraft/final-review | Completed Scorecard | Closeout |
| 25 | /smokecraft/rewards | Rewards and XP | Closeout |
| 26 | /smokecraft/rewards (shared) | Achievements | Closeout |
| 27 | /smokecraft/session-complete | Recommended Next Journey | Closeout |

Confirmed unchanged from every prior package's own regression testing this session — not re-derived,
re-verified against the current source file only.

## Supporting/entry-layer routes (pre-session, requires-gated, from `ENTRY_LAYER_SCREENS`)

`golden-box` (Gold Box Rules), `mentor` → `/smokecraft/mentor-selection`, `seed-soil` (requires mentor),
`enroll`, `venue-select`, `management-sync` — all confirmed present in `session.js`, unchanged.

## Golden Box / gamification routes (confirmed reachable, from `App.jsx`, Packages 1–7A)

`/smokecraft/golden-box`, `/smokecraft/golden-box/competitions/:id`, `/smokecraft/golden-box/entries/:id`,
`/smokecraft/golden-box/judge`, `/smokecraft/golden-box/judge/entries/:id`,
`/smokecraft/golden-box/mentor/entries/:id`, `/smokecraft/golden-box/results/:id`,
`/smokecraft/leaderboard`, `/smokecraft/rewards`.

## Routes referenced by name in this mandate but not found in the current route registry

Grep-confirmed absent from `src/App.jsx`: Challenge Hub, daily/weekly challenge routes, Quest system,
Streak system, Skill Tree, Collections Center, Mentor Collection/Progress (dedicated route),
Recommended-Next-Journey as a distinct route (session 27 currently renders `session-complete`, which
mentions but does not build a dedicated "Recommended Next Journey" screen). These are exactly the
Package 7B/7C/7D systems every prior pass has explicitly and correctly deferred — **their absence here
is expected and already documented, not a new finding.**

## POS360 / E.A.T. 360 route discovery (scoped)

```
grep -c "path=\"" src/App.jsx  → (see below)
```
POS360 and E.A.T. 360 routes exist under separate route trees in `src/App.jsx` (`/pos3/*`, `/pos360/*`,
`/eat/*`, `VenueManagementCommandHub`, `ModuleDeploymentCenter`, etc.) — confirmed present and reachable
via the same route registry SmokeCraft uses. A full per-screen visual audit of POS360/E.A.T. 360
equivalent in depth to the SmokeCraft audits this session has built is a multi-pass undertaking on its
own (these are two more full applications); this pass confirms **route existence and reachability only**
(Phase 8/9 scope reduction, disclosed in `07-PRODUCTION-GATE.md`) rather than fabricating a full
per-screen visual-completeness claim for applications that have had zero dedicated audit passes this
session.
