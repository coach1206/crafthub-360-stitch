# 11 — Final Report: SmokeCraft 360 Final Gameplay Acceptance and Investor Visual Proof

## Baseline

- Starting commit: `c727c0f9f4adcbebc5b4a2e228f506d3c988eb0d` (verified
  clean tree, local `HEAD` == `origin/recovery/smokecraft-codex-final`).

## What was done

1. Read the required-interaction manifest and prior Full Game
   Fresh-Player Closure proof docs to inherit canonical routes without
   re-deriving them.
2. Built one deterministic, fully-completed demo-player state (22/22
   sessions, real Golden Box build → submit → judge → finalize → award
   lifecycle with a real first-place award) via real HTTP calls to the
   existing server-authoritative API — no DB edits, no localStorage
   seeding.
3. Used Playwright to capture 24 real screenshots across 14 representative
   investor screens at up to 3 viewports (desktop/tablet/mobile), sharing
   the demo player's real, server-issued identity cookie with the browser
   and using the app's own sanctioned investor **Demo Mode** control
   (`enterDemoMode()`, a real UI click) to unlock in-order navigation —
   not a localStorage hack.
4. Found and fixed two real, provable, investor-visible defects:
   - **SC-D068**: the Golden Box Results screen permanently showed
     "Judging is not complete yet... Current status: active" directly
     above its own real, correctly finalized rankings, because
     `finalizeResults()` never advanced the competition's own `status`
     column. Fixed with a small, targeted update inside that one
     function.
   - **SC-D068b**: `goldenBoxContentRoutes.js`'s rate limiters lacked the
     dev/test exemption every sibling Golden Box router already has,
     causing real 429 console errors during the automated demo walk.
     Fixed by adding the same `skip: () => !IS_PROD` guard.
5. Wrote and ran `scripts/verify-smokecraft-final-gameplay-acceptance.mjs`
   — a real Playwright + HTTP script asserting render-without-error,
   clickable primary controls, UI-vs-server live-data agreement, and
   post-reload persistence. **Final result: 82/82 assertions passed.**
6. Documented the canonical investor demo path (14 screens, ~10-15
   minutes, required demo state, reset procedure, fallbacks).
7. Ran a reasonably scoped regression: build, manifest/gameplay/integrity
   validators, Golden Box authority/results/judging/awards validators,
   Package B-F authority validators, and a full re-run of the existing
   62-assertion Full Game Fresh-Player Closure script — **all passed, 0
   regressions** from this pass's two fixes.
8. Wrote this condensed 11-document proof set plus 24 real screenshots
   under `public/proof/smokecraft-final-gameplay-acceptance/`.

## Demo path summary

14 screens, canonical order Welcome → Venue Select → Mentor Selection →
Humidor Match → First Draw → Scorecard → Rewards → Passport → Skill Tree
→ Leaderboard → Golden Box Build → Competitions → Results/Award → Session
Complete. Estimated live duration: 10-15 minutes. Full detail:
`02-investor-demo-path.md`.

## Visual acceptance findings

2 real defects found and fixed (SC-D068, SC-D068b); 4 investigated
signals confirmed as benign/pre-existing/correct-by-design (not fixed
because not broken); 1 real, disclosed-but-unfixed layout issue found one
screen deeper than the originally-scoped set (Golden Box Rules, mobile
text overlap + empty content boxes at tablet width), recommended for a
follow-up pass. Full detail: `03-visual-acceptance-review.md`,
`06-responsive-tablet-notes.md`.

## Regression

0 regressions across 16 existing validators + the full 62-assertion
Fresh-Player Closure re-run + this pass's own new 82-assertion acceptance
script. Full detail: `09-regression-results.md`.

## Proof path

`public/proof/smokecraft-final-gameplay-acceptance/` (11 docs +
`screenshots/{desktop,tablet,mobile}/` + `acceptance-run-output.json`).

## Push confirmation

See commit below; local `HEAD` confirmed equal to
`origin/recovery/smokecraft-codex-final` after push, tree clean.

---

**SMOKECRAFT FINAL GAMEPLAY ACCEPTANCE PASS — PLAYABLE GAME COMPLETE AND
INVESTOR-DEMO READY**
