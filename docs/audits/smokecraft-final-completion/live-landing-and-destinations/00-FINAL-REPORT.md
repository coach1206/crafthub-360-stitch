# Live Landing & Destinations — Final Report

**Starting commit:** `3949a28a8f3f54096c06604fe3553ddad317ffdb` (branch `recovery/smokecraft-codex-final`, clean tree confirmed).

## Method
Production build (`npm run build`, exit 0) served via `npx vite preview --port 5050`. Every Start / Resume / Start-New / destination-card action was exercised with a REAL visible-control click located by role/text in a fresh Playwright context — no `startNewJourney()` calls, no programmatic `navigate()`, no pre-click seeding of an active journey. Mid-journey/completed set-up used the established `completedSteps` seeding technique only to reach a starting condition; the button clicks under test were always real.

## Defect reproduction verdict (honest)
| # | Reported defect | Verdict |
|---|---|---|
| 1 | START does not leave /smokecraft | NOT reproduced — click hits the real BUTTON (pointer-events:auto), navigates to `/smokecraft/enroll`, journey persists across reload |
| 2 | Landing stuck on Start when active journey exists | NOT reproduced — with real contiguous progress the CTA renders RESUME, and Resume leaves /smokecraft without creating a new journey |
| 3 | Rewards opens old/incorrect visual | REAL and FIXED — landing Rewards card routed to `/smokecraft/humidor-match`, which bounced every real user to `/smokecraft/enroll` via the session-2 entry guard; the approved Reward Center visual was never shown |
| 4 | Rankings old generic leaderboard / stale baked data | NOT reproduced — Leaderboard already renders approved `LEADERBOARD 111.png`, never fabricates competitors, honest empty state; strings `James Carter`/`18,750`/`4435` absent from SmokeCraft source |
| 5 | Passport old lock images (FUTURE VISIT LOCKED / MANAGEMENT SYNC LOCKED) | REAL and FIXED — `LockedSmokeCraftScreen` rendered baked lock PNGs under neutralization overlays; replaced with a live state panel, all old lock-PNG references removed |
| 6 | CraftHub behavior | VERIFIED — routes to `/smokecraft/smokecraft-challenge` (requires `scorecard`); active journey preserved, no reset/new-journey; entry-guard bounce for fresh users is correct product gating |
| 7 | Prior tests exercised seeded/programmatic paths | CONFIRMED — existing `verify-smokecraft-clean-start-entry-flow.mjs` is source-inspection only; this pass adds a real-browser suite |

## Changes made (smallest real root-cause)
1. `src/constants/smokecraftAssets.js` — added `rewardCenter` key → `/assets/smokecraft/rewards/Reward Center.png`.
2. `src/pages/smokecraft/RewardsCenter.jsx` (new) — landing-accessible Reward Center destination; approved visual shell; real XP/rank + real loyalty-point fields; honest venue-rewards empty state (no fabricated offers).
3. `src/App.jsx` — new route `/smokecraft/rewards-center`; import RewardsCenter.
4. `src/pages/SmokeCraft.jsx` — landing Rewards card re-wired from `/smokecraft/humidor-match` to `/smokecraft/rewards-center`.
5. `src/components/smokecraft/LockedSmokeCraftScreen.jsx` — replaced static baked lock images with a live state panel (real prerequisite + current progress + correct return route); removed all old lock-PNG references.
6. `verify-smokecraft-live-landing-and-destinations.mjs` (new) — 28 real-browser checks. Consolidates the mandate-named `verify-smokecraft-live-start-navigation.mjs` and `verify-smokecraft-approved-asset-content.mjs` (neither existed in the repo).

## Results
- New suite: **28/28**.
- Regressions all at/above baseline (see `07-REGRESSION-MATRIX.md`).
- Production build exit 0; preview + backend health 200.
- Reward Center rendered-asset sha256 == disk sha256 (`489ad9ca…`).

## Honest remaining blockers
- No real venue-specific rewards backend exists; Reward Center shows an honest empty state, by design.
- CraftHub / Passport bottom-bar cards route to session-gated screens; fresh users are correctly redirected to enroll by the entry guard (working as designed, not a defect).
