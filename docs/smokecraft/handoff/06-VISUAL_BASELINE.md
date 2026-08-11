# SmokeCraft 360 — Visual Baseline (Doc 6 of 10)

**Branch inspected:** `integration/smokecraft-main-candidate`
**HEAD SHA at time of writing:** `429ed53626700be9b058d85fd25ddb2ba4afbb16`
(verified via `git rev-parse HEAD` on the actual checked-out branch, not
copied from an earlier report)

This is where to look to see what the branch actually renders. All images
below were captured from a **real browser walking the real, gated journey**
(no direct-URL bypass of any prerequisite guard) — not mockups. Every path
in this document was checked to exist on disk at the time of writing (`ls`
verified, not assumed from a prior doc). No deployment status is stated
here — see doc 07 for why Railway/Vercel status is explicitly marked
NOT VERIFIABLE rather than guessed.

## This baseline is for designer polish, not a rebuild mandate

**Read this before touching anything.** Everything in this document is the
*current, already-fixed* state — the CSS-stacking bug is resolved, the
baked-title duplication is resolved, and the full-height background
treatment is in place and functionally proven (doc 07). A designer picking
this up should treat these 14 screens as a **baseline to refine** (spacing,
opacity, panel treatment, typography, layering — see doc 10's MAY list),
**not** as a rough draft to redesign from scratch. Doc 10
(`10-DESIGNER_CHANGE_BOUNDARIES.md`) is the authoritative statement of what
may and must not change; this document only tells you what exists and where
to find it.

## Current contact sheet (start here)

| File | Verified present | Covers | Notes |
|---|---|---|---|
| `docs/visual-proof/main-integration/SMOKECRAFT_OWNER_REBUILD_FINAL_INDEX.png` | ✅ (3.2 MB, last written during the CSS-stacking/baked-title fix pass) | The 14 owner-rebuild hero screens | **This is the current baseline.** Full-height owner background imagery behind live DOM, CSS-stacking fixed, baked-title duplication fixed. |
| `docs/visual-proof/main-integration/SMOKECRAFT_MAIN_CANDIDATE_INDEX.png` | ✅ (1.4 MB, earlier timestamp) | Same 14 screens | Earlier snapshot, from before the owner-rebuild visual pass — kept for before/after comparison only, **not** the current baseline. |
| `docs/visual-proof/migration/SMOKECRAFT_ONE_SYSTEM_FINAL_INDEX.png` | ✅ | Same 14 screens | Working copy the capture script writes to on every run; `main-integration/…FINAL_INDEX.png` is copied from this file after each pass — they are the same content once a pass completes. |

## The 14 owner-rebuild screens in the current baseline

Verified against `src/constants/smokecraftAssets.js` and the current
contact sheet — all 14 owner hero-image keys resolve to files confirmed
present on disk:

| # | Screen | Route | Asset key |
|---|---|---|---|
| 1 | Identity | `/smokecraft/identity` | `ownerIdentityHero` |
| 2 | SeedSoil | `/smokecraft/seed-soil` | `ownerSeedSoilHero` |
| 3 | Format | `/smokecraft/format` | `ownerFormatHero` |
| 4 | CutToastLight | `/smokecraft/cut-toast-light` | `ownerCutToastLightHero` |
| 5 | FirstThird | `/smokecraft/first-third` | `ownerFirstThirdHero` |
| 6 | SecondThird | `/smokecraft/second-third` | `ownerSecondThirdHero` |
| 7 | FinalThird | `/smokecraft/final-third` | `ownerFinalThirdHero` |
| 8 | Scorecard | `/smokecraft/scorecard` | `ownerScorecardHero` |
| 9 | RequestPurchase | `/smokecraft/request-purchase` | `ownerRequestPurchaseHero` |
| 10 | PairingRecommendations | `/smokecraft/pairing-recommendations` | `ownerPairingRecommendationsHero` |
| 11 | PassportStamp | `/smokecraft/passport-stamp` | `ownerPassportStampHero` |
| 12 | Connections | `/smokecraft/connections` | `ownerConnectionsHero` |
| 13 | Rewards | `/smokecraft/rewards` | `ownerRewardsHero` |
| 14 | SecondHumidorMatch | `/smokecraft/second-humidor-match` | `ownerSecondHumidorMatchHero` |

These are the screens that received the owner's 14 hero images in the most
recent visual pass on this branch — they are **not** the full journey (doc 02
lists 21 spine screens + 10 supporting modules); they are the subset that
received new owner artwork and dedicated visual regression proof. The
remaining spine/supporting-module screens (Welcome, Meet Your Cigar,
Terroir, Lighting Tutorial, First-Third's siblings, Mentor Commentary,
Knowledge Drop, AI Summary, Final Review, Session Complete, Golden Box,
Mentor Selection, Wrapper/Strength, Mini Tasting, SmokeCraft Challenge) exist
and are routed (doc 03/04) but do not have a dedicated up-to-date contact
sheet in this repo as of this handoff — see the gap noted in doc 08.

## Current individual screenshots (28 files, verified present)

`docs/visual-proof/migration/{NN}-{screen-name}-{viewport}.png` — confirmed
on disk, 14 screens × 2 viewports:

```
01-identity              02-seed-soil            03-format
04-cut-toast-light       05-first-third           06-second-third
07-final-third           08-scorecard             09-request-purchase
10-pairing-recommendations   11-passport-stamp    12-connections
13-rewards                14-second-humidor-match
```
…each as `-tablet-primary.png` (1180×820) and `-tablet-secondary.png`
(1024×768). These are the individual frames composited into the contact
sheet above — open any one directly for a full-resolution look at that
screen instead of the compressed contact-sheet thumbnail.

## Derived image crops currently in use, and why

10 of the 14 owner-provided source photos (`public/assets/smokecraft/owner-rebuild/*-hero.jpg`)
have a large decorative title baked directly into the photograph itself —
e.g. `07-final-third-hero.jpg` has "FINAL THIRD" rendered into the image,
`08. Scorecard.png` has "SCOREBOARD" baked in. Under the screen's real
on-screen title (a live DOM `<h1>`, e.g. "Final Third" / "Your Complete
Cigar Review"), that baked text would visually duplicate the heading —
confirmed as an actual on-screen defect during self-QA of the full-height
background treatment, not a hypothetical concern.

The fix, verified currently wired in `src/constants/smokecraftAssets.js`:
a `sharp`-derived crop was cut from each affected source image, windowed to
a clean photographic region with no baked text, saved alongside the
original as `*-hero-crop.jpg`, and pointed at from the asset registry. The
original, uncropped source file is kept on disk (not deleted) as reference/
rollback; only the crop is actually wired into the live screen.

| Screen | Source file (kept, not wired) | Crop file (wired, currently live) |
|---|---|---|
| Identity | `01-identity-hero.jpg` | `01-identity-hero-crop.jpg` |
| SeedSoil | `02-seed-soil-hero.jpg` | `02-seed-soil-hero-crop.jpg` |
| FirstThird | `05-first-third-hero.jpg` | `05-first-third-hero-crop.jpg` |
| SecondThird | `06-second-third-hero.jpg` | `06-second-third-hero-crop.jpg` |
| FinalThird | `07-final-third-hero.jpg` | `07-final-third-hero-crop.jpg` |
| Scorecard | `08. Scorecard.png` | `08-scorecard-hero-crop.jpg` |
| RequestPurchase | `09-request-purchase-hero.jpg` | `09-request-purchase-hero-crop.jpg` |
| PairingRecommendations | `10-pairing-recommendations-hero.jpg` | `10-pairing-recommendations-hero-crop.jpg` |
| PassportStamp | `11-passport-stamp-hero.jpg` | `11-passport-stamp-hero-crop.jpg` |
| Connections | `12-connections-hero.jpg` | `12-connections-hero-crop.jpg` |
| Rewards | `13-rewards-hero.jpg` | `13-rewards-hero-crop.jpg` |
| SecondHumidorMatch | `14-second-humidor-match-hero.jpg` | `14-second-humidor-match-hero-crop.jpg` |

Two screens (**Format**, **CutToastLight**) use their source file directly
with no crop — their source photos never had baked text to remove.

Per doc 10: repositioning/recropping the *existing* approved images
(`bgPosition`/`bgSize`, or a further crop for the same reason above) is a
designer MAY; introducing different imagery in their place is a MUST NOT
without owner approval.

## Capture tooling (how to regenerate)

`scripts/captureSmokecraftMigrationRealJourney.mjs` — walks the real 14-screen
journey (enroll → identity → venue → welcome → golden box → mentor → …),
screenshots each screen at both viewports, and composites the contact sheet.
Requires the dev server running against `crafthub_integration_candidate`
(Postgres) — see doc 08 for the exact run sequence.

## What changed visually in the most recent pass on this branch (context, not a to-do list)

1. **Strip-crop → full-height background.** The prior pattern
   (`SmokeCraftHeroCrop`) showed only a short bordered strip of each owner
   photo over a flat `#0b0f18` panel. The current
   `src/components/smokecraft/SmokeCraftOwnerHeroBackground.jsx` renders the
   full photo as a fixed full-viewport backdrop with a gradient overlay, so
   the image visually continues behind the whole screen instead of being cut
   off.
2. **CSS stacking fix.** The background component must render as a DOM
   sibling immediately before each screen's content wrapper (not nested
   inside it) — a fixed-position element always paints above static siblings
   regardless of z-index or source order otherwise. Each content wrapper
   carries `position: relative; zIndex: 2`.
3. **Baked-title removal.** See "Derived image crops" above.

## Non-visual functional proof accompanying the current baseline

`allScreensPass: true`, all 14 `PASS (NONE)` from a real-browser interaction
trace at both viewports (route-stayed checks, no dead ends) — see doc 07 for
the full breakdown.
