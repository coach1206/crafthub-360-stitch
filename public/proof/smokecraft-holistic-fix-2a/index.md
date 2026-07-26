# Holistic Fix 2A — Proof Index

Starting commit `d4fe6314` → final commit (see repo log for this batch's
commit hash). 7 target screens: Welcome, Leaderboard, Passport, Venue
Selection, CraftHub, Challenge Hub, Rewards.

## Files in this directory

- `five-viewport-results.json` — raw output of
  `verify-smokecraft-hf2a-shell-migration.mjs`: 35 checks (7 screens × 5
  viewports — handheld-portrait 390×844, tablet-10in 810×1080, tablet-12in
  1024×1366, display-15in 1440×900, desktop 1920×1080). 34/35 clean (no
  horizontal overflow, no console error); the 1 flagged check (Welcome at
  handheld-portrait) was investigated and found to be a non-reproducing
  flake, documented in `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`. Keyboard
  focus reached a real control in all 35/35 checks.
- `screenshots/<screen>-<viewport>.png` — one screenshot per
  screen×viewport combination (35 total), e.g.
  `welcome-tablet-12in.png`, `rewards-desktop.png`.

## Per-screen summary

| Screen | Route | Shell mode | Asset locked | Nav-registry destinations used |
|---|---|---|---|---|
| Welcome | `/smokecraft/welcome` | image-shell | `SC_ASSETS.session1` | HOME, JOURNEY, REWARDS, PASSPORT, LEADERBOARD, EVENTS, COLLECTIONS, MENTOR, KNOWLEDGE, GOLDEN_BOX, PAIRING_STANDALONE |
| Leaderboard | `/smokecraft/leaderboard` | image-shell | `SC_ASSETS.leaderboard` | LOUNGE, JOURNEY, CIGARS, CHALLENGES, EVENTS, REWARDS, PASSPORT |
| Passport | `/smokecraft/passport` | image-shell | `SC_ASSETS.passportHub` | PASSPORT_MODULE.SCAN/DIRECTORY/EVENTS/BENEFITS/HOW_IT_WORKS |
| Venue Selection | `/smokecraft/venue-select` | live | (decorative crop, not shell imageProps) | none registered (entry-flow screen) |
| CraftHub | `/smokecraft/crafthub` | image-shell | `SC_ASSETS.craftHubVenueTable` | HOME (via NAV.HOME); RESUME/PASSPORT via `resolveSmokeCraftLandingAction` |
| Challenge Hub | `/smokecraft/challenge-hub` | live | (no image-shell asset; `SC_ASSETS.challengeHubBackground` shown as in-flow `<img>`) | none registered as literals |
| Rewards (S25) | `/smokecraft/rewards` | image-shell | `SC_ASSETS.rewards` | CHALLENGES, COLLECTIONS |

Test references: `scripts/validateSmokecraftShellAdoption.mjs` (44 checks),
`scripts/validateSmokecraftManifest.mjs` (19 checks, includes the
fullyMigratedScreens cross-check), `verify-smokecraft-hf2a-shell-migration.mjs`
(35 checks, this directory's raw results).
