# SmokeCraft Image Placement — Verification Proof

This document is generated to satisfy an explicit "prove it, don't just tell
me" requirement. It reports the **real, script-verified** state of all 7
uploaded SmokeCraft images named by the user, including honest failures.

Verification script: `server/scripts/verifySmokeCraftImagePlacement.js`
Run command: `node server/scripts/verifySmokeCraftImagePlacement.js`

## Real result of running the script (verbatim summary)

```
=== 22 passed, 4 failed ===

FAILURES:
  - Requested source file exists at exactly "public/SHAPE SIZE BURN.1.png" (file not found in repo under this exact name)
  - Requested source file exists at exactly "public/GOLDEN BOX JOURNEY.png" (file not found in repo under this exact name)
  - Requested source file exists at exactly "public/lounge demo ranking.png" (file not found in repo under this exact name)
  - Requested source file exists at exactly "public/DISCOVER YOUR PROFILE.png" (file not found in repo under this exact name)
```

`npm run build` — ✓ succeeds (`✓ built in 8.80s`).

**Important honesty note:** 4 of the 7 exact filenames the user typed do not
exist anywhere in this repository under those literal names. This is not
a script bug — it is the script doing exactly what was asked ("must fail if
any required image is missing"). For each of those 4, the closest actual
file on disk (a real uploaded mockup, content-matched by hand) is identified
below and is what's actually wired into the live code. Where a literal
filename match exists (3 of 7), it is marked accordingly.

## Per-image detail

### 1. smokecraft Intake.png — ✅ exact filename found
- **Source file:** `public/assets/smokecraft/smokecraft Intake.png` (exists, exact match)
- **Crop created:** `public/assets/smokecraft/cropped/intake-ashtray-bg.jpg`
- **Component:** `src/pages/smokecraft/Enroll.jsx`
- **Reference:** background `url('/assets/smokecraft/cropped/intake-ashtray-bg.jpg')`, ~line 101
- **Old image replaced:** `/assets/smokecraft/cropped/humidor-match-bg.jpg` (generic shared photo)
- **Route:** `/smokecraft/enroll`

### 2. Humidor Match 1.png — ✅ exact filename found
- **Source file:** `public/assets/smokecraft/Humidor Match 1.png` (exists, exact match)
- **Crop created:** `public/assets/smokecraft/cropped/humidor-match-bg-v2.jpg`
- **Component:** `src/pages/smokecraft/HumidorMatch.jsx`
- **Reference:** background div + `humidor-hero__img` banner, ~lines 172 and 187
- **Old image replaced:** `/assets/smokecraft/cropped/humidor-match-bg.jpg` (generic shared photo)
- **Route:** `/smokecraft/humidor-match`

### 3. SEED PARING 2.png — ✅ exact filename found
- **Source file:** `public/SEED PARING 2.png` (exists, exact match)
- **Crop created:** `public/assets/smokecraft/cropped/seed-soil-bg.jpg` (re-cropped in this pass directly from this exact file, replacing an earlier crop that had been sourced from a different, similarly-named file `SEED & PARING.png`)
- **Component:** `src/pages/smokecraft/SeedSoil.jsx`
- **Reference:** background div, ~line 192: `backgroundImage: "url('/assets/smokecraft/cropped/seed-soil-bg.jpg')"`
- **Old image replaced:** `/assets/smokecraft/cropped/humidor-match-bg.jpg` (generic shared photo)
- **Route:** `/smokecraft/seed-soil`

### 4. SHAPE SIZE BURN.1.png — ❌ exact filename NOT found
- **Requested exact filename:** `public/SHAPE SIZE BURN.1.png` — does not exist in this repo.
- **Closest actual file on disk:** `public/smokecraft/images/cigar-shape-size.png` (a real uploaded mockup, content-matched to this screen's "Master Tip" cigar/ashtray photo).
- **Crop created:** `public/assets/smokecraft/cropped/format-master-tip.jpg`
- **Component:** `src/pages/smokecraft/Format.jsx`
- **Reference:** `.format-tip__image` box, ~line 1173
- **Old image replaced:** `/assets/smokecraft/cropped/humidor-match-bg.jpg` (generic shared photo)
- **Route:** `/smokecraft/format`

### 5. GOLDEN BOX JOURNEY.png — ❌ exact filename NOT found
- **Requested exact filename:** `public/GOLDEN BOX JOURNEY.png` — does not exist in this repo.
- **Closest actual file on disk:** `public/assets/smokecraft/smokecraft-scorecard.png` (a real uploaded mockup whose content — Protocol Score, Awards, Badges, category breakdown — matches the description given for this image).
- **Crop created:** `public/assets/smokecraft/cropped/scorecard-bg.jpg`
- **Component:** `src/pages/smokecraft/Scorecard.jsx`
- **Reference:** background `url('/assets/smokecraft/cropped/scorecard-bg.jpg')`, ~line 180
- **Old image replaced:** n/a — this screen had no separate "old generic" swap tracked for this pass.
- **Route:** `/smokecraft/scorecard`

### 6. lounge demo ranking.png — ❌ exact filename NOT found
- **Requested exact filename:** `public/lounge demo ranking.png` — does not exist in this repo.
- **Closest actual file on disk:** `public/assets/smokecraft/golden-box.png` (a real uploaded mockup; this screen's literal page title is "Demo Lounge Ranking", matching the description given).
- **Crop created:** `public/assets/smokecraft/cropped/golden-box-hero.jpg`
- **Component:** `src/pages/smokecraft/Leaderboard.jsx`
- **Reference:** `<img src="/assets/smokecraft/cropped/golden-box-hero.jpg" .../>`, ~line 603 (also reused at ~line 84/97 for the rewards-atmosphere background)
- **Old image replaced:** n/a — no separate "old generic" swap tracked for this pass.
- **Route:** `/smokecraft/leaderboard`

### 7. DISCOVER YOUR PROFILE.png — ❌ exact filename NOT found
- **Requested exact filename:** `public/DISCOVER YOUR PROFILE.png` — does not exist in this repo.
- **Closest actual file on disk:** `public/assets/smokecraft/DISOVER YOUR CIGAR PROFILE.png` (note: this is the literal on-disk filename, with the upload's own typo "DISOVER"; content-matched to this screen by the "Discover your cigar profile" headline).
- **Crop created:** `public/assets/smokecraft/cropped/discover-profile-bg.jpg`
- **Component:** `src/pages/SmokeCraft.jsx`
- **Reference:** background `url('/assets/smokecraft/cropped/discover-profile-bg.jpg')`, ~line 106
- **Old image replaced:** `/assets/smokecraft/cropped/management-sync-bg.jpg` (generic shared "hands on tablet" photo, reused on 5+ unrelated screens)
- **Route:** `/smokecraft` (index route)

## Screenshots

This sandboxed environment has no installable browser binary — Playwright's
Chromium download is blocked by network policy (confirmed via a 403 from
`cdn.playwright.dev`), so no real in-browser screenshot tool is available
here. This is the same limitation documented in prior phases (10C/10D/10E)
of this project. No before/after screenshots can be generated from this
session.

**Manual verification route list** (open each in a browser against the
running app to see the actual rendered image):

- `/smokecraft` — DISCOVER YOUR PROFILE replacement
- `/smokecraft/enroll` — smokecraft Intake replacement
- `/smokecraft/format` — SHAPE SIZE BURN replacement
- `/smokecraft/seed-soil` — SEED PARING 2 replacement
- `/smokecraft/humidor-match` — Humidor Match 1 replacement
- `/smokecraft/leaderboard` — lounge demo ranking replacement
- `/smokecraft/scorecard` — GOLDEN BOX JOURNEY replacement
