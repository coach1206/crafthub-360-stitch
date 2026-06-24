# Phase 10E — SmokeCraft Imagery Replaced with Uploaded Artwork

Per explicit instruction: stop auditing, treat the uploaded SmokeCraft images
as the intended source artwork, and replace existing imagery on the 4 named
screens with crops from that uploaded artwork. No layout, navigation,
workflow, or feature changes — image assets only.

## 1. SmokeCraft Intake

- **Screen:** `src/pages/smokecraft/Enroll.jsx` (`className="smokecraft-intake"`)
- **Current image (before):** `/assets/smokecraft/cropped/humidor-match-bg.jpg`
  — a shared generic ambient smoke/humidor photo also reused by 4 other
  unrelated screens (`Leaves.jsx`, `LeafChallenge.jsx`, `venueHomeContent.js`,
  `seedMediaAssets.js`).
- **Uploaded image:** `public/assets/smokecraft/smokecraft Intake.png` (the
  exact mockup for this exact screen, filename match).
- **Exact file changed:** `src/pages/smokecraft/Enroll.jsx`, line 101 —
  `src` swapped to a new dedicated crop:
  `public/assets/smokecraft/cropped/intake-ashtray-bg.jpg` (cigar resting in
  an ashtray with rising smoke, cropped from the left margin of the uploaded
  mockup, no UI text).
- All gradients/filters/sizing on the page background were left untouched —
  only the photo URL changed.

## 2. Shape, Size & Burn Time

- **Screen:** `src/pages/smokecraft/Format.jsx`, the `.format-tip__image`
  box ("Master Tip" card).
- **Current image (before):** `/assets/smokecraft/cropped/humidor-match-bg.jpg`
  — same shared generic ambient photo, unrelated to this specific tip card.
- **Uploaded image:** `public/smokecraft/images/cigar-shape-size.png` (the
  exact mockup for this screen — its own "MASTER TIP" box contains a cigar
  resting on an ashtray with a lit ember, which this page's Master Tip card
  is clearly meant to show).
- **Exact file changed:** `src/pages/smokecraft/Format.jsx`, line 1173 —
  swapped to a new dedicated crop:
  `public/assets/smokecraft/cropped/format-master-tip.jpg` (cropped directly
  from the mockup's own Master Tip photo box).

## 3. Seed & Soil Pairing

- **Screen:** `src/pages/smokecraft/SeedSoil.jsx`, full-page ambient
  background.
- **Current image (before):** `/assets/smokecraft/cropped/humidor-match-bg.jpg`
  — same shared generic photo, not specific to this screen.
- **Uploaded image:** `public/assets/smokecraft/SEED & PARING.png` (the
  exact mockup for this screen).
- **Exact file changed:** `src/pages/smokecraft/SeedSoil.jsx`, line 192 —
  swapped to a new dedicated crop:
  `public/assets/smokecraft/cropped/seed-soil-bg.jpg` (tobacco-leaf/cigar-box
  texture cropped from the mockup's left margin, no UI text). Opacity/filter
  values on the background div were left unchanged.

## 4. Humidor Match

- **Screen:** `src/pages/smokecraft/HumidorMatch.jsx` — two references:
  the full-page ambient background div, and the `humidor-hero__img` banner
  at the top of the page content.
- **Current image (before, both):** `/assets/smokecraft/cropped/humidor-match-bg.jpg`
  — same shared generic photo.
- **Uploaded image:** `public/assets/smokecraft/Humidor Match 1.png` (the
  exact mockup for this screen, filename match).
- **Exact file changed:** `src/pages/smokecraft/HumidorMatch.jsx`, lines 172
  and 187 — both swapped to a new dedicated crop:
  `public/assets/smokecraft/cropped/humidor-match-bg-v2.jpg` (humidor
  shelf/cigar-storage photo cropped from the mockup's left margin).

## Note on the shared original file

`/assets/smokecraft/cropped/humidor-match-bg.jpg` itself was **not modified
or deleted** — it is still used by `Leaves.jsx`, `LeafChallenge.jsx`,
`src/data/venueHomeContent.js`, and `src/data/eat/seedMediaAssets.js`, none
of which were in scope for this pass. Each of the 4 target screens above now
points to its own newly-cropped, screen-specific asset instead.

## Screenshot proof

This sandboxed environment has no installable browser binary (Playwright's
Chromium download is blocked by network policy — confirmed via a 403 from
`cdn.playwright.dev`), so an in-browser before/after screenshot of the
running app could not be captured, consistent with the same limitation
documented in Phase 10C/10D. As proof of the actual pixel content now
rendering on each screen, the 4 newly-cropped asset files themselves are
included in this commit at:

- `public/assets/smokecraft/cropped/intake-ashtray-bg.jpg`
- `public/assets/smokecraft/cropped/format-master-tip.jpg`
- `public/assets/smokecraft/cropped/seed-soil-bg.jpg`
- `public/assets/smokecraft/cropped/humidor-match-bg-v2.jpg`

Each was cropped directly from the uploaded mockup file named in its
section above, viewed and confirmed clean (no overlapping UI text) before
being wired into code.

## Verification

```
npm run build      # ✓ succeeds
node server/scripts/verifyFounderAdminAccess.js          # 14/14
node server/scripts/verifyNoviDeploymentCenter.js         # 16/16
node server/scripts/verifyNoviRemoteDeploymentReadiness.js # 17/17
node server/scripts/verifyReviewDeploymentCenterRoute.js  # 12/12
```

All 59/59 pass. Only the 4 `src` line and `background` references listed
above were changed, plus 4 new cropped asset files. No layout, spacing,
navigation, or workflow was touched.
