# SmokeCraft Full Visual Reset Report

Generated: 2026-06-30
Branch: claude/beautiful-thompson-r3mm5m
Viewport: 1024×768, hasTouch:true

---

## A. Git Status Before Work

```
On branch claude/beautiful-thompson-r3mm5m
Your branch is up to date with 'origin/claude/beautiful-thompson-r3mm5m'.
nothing to commit, working tree clean
```

## B. Current Branch

`claude/beautiful-thompson-r3mm5m`

## C. Previous Commit Context

- `fc4e23c6` — proof: add Round B live recheck screenshots and verification report (NOT accepted)
- `14d91e3d` — fix: convert remaining SmokeCraft pages to asset screens (NOT accepted)

## D. Why Previous Proof Was Insufficient

The previous proof script checked only:
- Whether an img with `objectFit:contain` and `width > 100` was present
- A short list of old UI text strings

It did NOT check for:
- The global `DemoBanner` (position:fixed, zIndex:9999 "DEMO MODE ACTIVE" badge overlaying all SmokeCraft routes)
- The `DemoModeBanner` from VisitLockGuard (position:fixed, "Demo preview only — progression not saved")
- `imgCount=2` caused by the blurred background duplicate copy of the approved image inside SmokeCraftAssetScreen
- Whether `header`, `nav`, `button`, `form`, `aside` elements were present
- Whether any fixed/sticky overlay chrome elements existed

It accepted `fgWidth=1024` as proof even when the global DemoBanner was fixed on top of the viewport.

## E. Root Cause Found

Three active components were injecting chrome on top of every SmokeCraft asset-screen route:

1. **`src/components/demo/DemoBanner.jsx`** — Rendered globally in `App.jsx` line 211 (`<DemoBanner />`) OUTSIDE the route tree, `position:fixed; top:12; right:12; zIndex:9999`. Shows "DEMO MODE ACTIVE" badge on every route without exception. Was never suppressed for SmokeCraft routes.

2. **`src/components/smokecraft/SmokeCraftAssetScreen.jsx`** — The component itself rendered the SAME image twice: once as a blurred/scaled background (objectFit:cover, blur(26px), opacity:0.42) and once as the foreground (objectFit:contain). This caused `allImgCount=2`, `visibleImgCount=2`, and a duplicate image layer behind the approved image — violating "no duplicate blurred background image."

3. **`src/components/smokecraft/VisitLockGuard.jsx`** — In demo mode with incomplete session progression (the proof script used `completedSteps:[]`), it rendered `<DemoModeBanner /> + children`. DemoModeBanner is `position:fixed; top-20 left-1/2 z-40`. This hit the `session-complete` route specifically.

## F. Old Layout/Wrapper Files Identified

| File | Issue | Action |
|---|---|---|
| `src/components/demo/DemoBanner.jsx` | Global fixed overlay, no SmokeCraft suppression | Added `useLocation` check — suppressed on `/smokecraft/*` |
| `src/components/smokecraft/SmokeCraftAssetScreen.jsx` | Rendered blurred duplicate background image | Completely rewritten — one image only, no background copy |
| `src/components/smokecraft/VisitLockGuard.jsx` | Rendered DemoModeBanner in demo mode | In demo mode, now returns only `children` (no DemoModeBanner) |
| `src/components/Layout.jsx` | NOT a source of chrome | Already hides ticker for all `/smokecraft/*` routes, only renders `<Outlet />` — left unchanged |

## G. Duplicate Image / Background Source Identified and Removed

`SmokeCraftAssetScreen.jsx` lines 20–38 (old): a second `<img>` with `objectFit:cover; filter:blur(26px); opacity:0.42` rendered the same `src` as a decorative background fill.

Removed entirely. The new component renders exactly ONE `<img>` element with `objectFit:contain`.

## H. Files Changed

```
src/components/smokecraft/SmokeCraftAssetScreen.jsx   — full rewrite, one img only
src/components/demo/DemoBanner.jsx                    — suppress on /smokecraft/* routes
src/components/smokecraft/VisitLockGuard.jsx          — demo mode returns children only
```

## I. Files Archived

No archiving required. The 7 page files were already bare SmokeCraftAssetScreen wrappers from the previous pass. No old page chrome files were left active.

## J. Routes Converted (this pass)

All 7 previously unconverted pages were already reduced to `SmokeCraftAssetScreen` in commit `14d91e3d`. This pass fixed the SYSTEM-LEVEL chrome injectors that were overlaying those pages.

## K. All SmokeCraft Routes Inspected

23 asset-screen routes verified with strict DOM check (see section M):
Art, HowItWorks, FlavorMemory, SmokeCraftChallenge, SecondHumidorMatch, MiniTastingRound, FinalReview, PairingLab, GuestPass, Scan, FirstThird, SecondThird, FinalThird, Terroir, Vitola, PairingMastery, EventChallenge, SessionComplete, Origins, GoldenBoxStatus, Pairing, Mentor, Identity

Remaining SmokeCraft routes NOT converted (functional hubs with multi-destination navigation, left in prior state):
Enroll, GoldenBox, Format, CigarGaugeGuide, WrapperStrength, Curation, Leaves, LeafChallenge, LeafChallengeCalculating, LeafChallengeResult, Cultivation, Blend, FlavorDNA, Available, Assistant, Leaderboard, PassportStamp, SeedSoil, HumidorMatch, RequestPurchase, CutToastLight, Scorecard, Connections, ManagementSync, Demo

## L. Routes Still Using Old Shell

None of the 23 asset-screen routes use old shell. Non-asset-screen routes listed in K above retain their functional layouts — these were explicitly excluded per prior agreed scope (multi-destination hubs, leaderboard, enrollment, etc.).

## M. Strict DOM Verification Table (23/23 PASS)

All 23 routes: `bodyLen=0`, `visImgs=1`, `chrome=0`, `header=false`, `nav=false`, `button=false`

| Route | fgW | fgH | visImgs | bodyLen | chrome | header | button | PASS |
|---|---|---|---|---|---|---|---|---|
| /smokecraft/art | 538 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/how-it-works | 1024 | 683 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/flavor-memory | 576 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/smokecraft-challenge | 1024 | 683 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/second-humidor-match | 1024 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/mini-tasting | 1024 | 576 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/final-review | 1024 | 683 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/pairing-lab | 576 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/guest-pass | 576 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/scan | 432 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/first-third | 1024 | 576 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/second-third | 576 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/final-third | 1024 | 576 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/terroir | 576 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/vitola | 1024 | 640 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/pairing-mastery | 576 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/event-challenge | 576 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/session-complete | 1024 | 576 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/origins | 576 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/golden-box/status | 1024 | 576 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/pairing | 576 | 768 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/mentor-selection | 1024 | 576 | 1 | 0 | 0 | false | false | ✅ |
| /smokecraft/identity | 1024 | 576 | 1 | 0 | 0 | false | false | ✅ |

## N. Screenshot Proof Paths

```
public/proof/smokecraft-full-visual-reset-proof/EventChallenge.png
public/proof/smokecraft-full-visual-reset-proof/SessionComplete.png
public/proof/smokecraft-full-visual-reset-proof/Origins.png
public/proof/smokecraft-full-visual-reset-proof/GoldenBoxStatus.png
public/proof/smokecraft-full-visual-reset-proof/Pairing.png
public/proof/smokecraft-full-visual-reset-proof/Mentor.png
public/proof/smokecraft-full-visual-reset-proof/Identity.png
public/proof/smokecraft-full-visual-reset-proof/strict-dom-results.json
```

## O. Grep Results

```
grep on src/pages/smokecraft/{EventChallenge,SessionComplete,Origins,GoldenBoxStatus,Pairing,Mentor,Identity}.jsx
for old chrome terms: no output (zero matches)
```

## P. Build Result

```
✓ built in 10.55s
No errors.
```

## Q. Commit Hash

(set after push)

## R. Push Status

(set after push)

## S. Remaining Failures

None on the 23 asset-screen routes.
