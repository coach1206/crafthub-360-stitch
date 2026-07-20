# Game-Engine Wiring — Remaining Functional Gap Audit

| # | Severity | Route | Component | Control | Current behavior | Required behavior | Backend dependency | Game-engine dependency | Recommended next package |
|---|---|---|---|---|---|---|---|---|---|
| 1 | Medium | /smokecraft/scorecard | Scorecard.jsx | Unknown — not audited | Unknown | Confirm real backend persistence, save-state feedback, no silent failures (same pattern as FlavorMemory) | TBD | TBD | Game-Engine Wiring Phase 2 |
| 2 | Medium | /smokecraft/pairing-lab | PairingLab.jsx | Unknown — not audited | Unknown | Same as above | TBD | TBD | Game-Engine Wiring Phase 2 |
| 3 | Medium | /smokecraft/humidor-match, /second-humidor-match | HumidorMatch.jsx, SecondHumidorMatch.jsx | Unknown — not audited | Unknown | Same as above | TBD | TBD | Game-Engine Wiring Phase 2 |
| 4 | Low | LeafChallenge*.jsx routes | Challenge scoring flow | Unknown — not audited | Unknown | Confirm challenge inputs, completion/failure conditions, XP/badge hooks are real (already flagged for hero-art in Image Integration Phase 2) | TBD | TBD | Game-Engine Wiring Phase 2 |
| 5 | Low | Any remaining `type="range"`/slider controls outside FlavorMemory | Not found — `FlavorMemory.jsx` was the only screen using `type="range"` in `src/pages/smokecraft/` (grep-confirmed) | N/A | N/A | N/A | N/A | N/A | No action needed — FlavorMemory's sliders were the only slider controls in scope, now fixed |
| 6 | Info | N/A | ~48 remaining images from the Image Integration Phase 2 gap audit | N/A | Blocked by human visual choice, not a game-engine issue | N/A | N/A | N/A | Image Integration Phase 3 (separate track) |
| 7 | Info | N/A | Package 7B/7C/7D systems (Rewards Center, Skill Tree, Challenge Hub, Quests, Streaks) | N/A | Don't exist yet | N/A | N/A | N/A | Package 7B/7C/7D (explicitly out of scope this pass) |

## What was confirmed genuinely solid (not re-litigated, just re-confirmed as not broken this pass)

Seed & Soil, Wrapper/Leaf Construction, Golden Box entry/judging/mentor-review/results — all re-run
clean this pass (`verify-golden-box-package-4-seed-soil.mjs` 17/17) with zero regressions from the
FlavorMemory fix.
