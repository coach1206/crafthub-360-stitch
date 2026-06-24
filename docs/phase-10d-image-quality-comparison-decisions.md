# Phase 10D — Image Quality Comparison: Replace if Uploaded Is Better

Re-evaluated the 6 named images using a brand/quality comparison instead
of a placeholder test: for each, find the current image on the matching
screen (if any), compare it to the uploaded image, and replace it if the
uploaded image is equal-or-better and matches the screen's purpose.

## 1. `DAYONE360 CONICERGE 1.png` → REPLACED

- **Screen:** DayOne360 Concierge (`src/pages/DayOneTravel.jsx`), hero banner.
- **Component:** the `<img>` at the top of the page, directly under the header.
- **Current image (before):** `craftImages.fallbacks.lounge` — a generic
  external stock photo (`lh3.googleusercontent.com/aida-public/...`) from
  a shared fallback bank also reused on unrelated screens (events, other
  trip cards). Not specific to this app or this screen in any way. I
  could not render this URL to eyeball it directly — outbound network
  access to `googleusercontent.com` is blocked by this environment's
  proxy policy (confirmed via a 403 CONNECT failure) — but its own name
  ("fallback") and its reuse across multiple unrelated screens establish
  it as a generic stock placeholder, not purpose-built art.
- **Uploaded image:** cropped a clean region from `DAYONE360 CONICERGE
  1.png` (the exact mockup for this exact screen) — passport, globe, and
  airport-lounge background, no UI text in the crop. Saved as
  `public/assets/dayone/concierge-hero.png`.
- **Decision: uploaded wins.** It's purpose-built for this specific
  screen (the source mockup's own header literally reads "DayOne360
  Concierge"), on-brand (navy passport with the app's real "360 PASSPORT"
  branding, a globe, a travel-lounge setting), versus a generic shared
  stock asset with no connection to this app's identity.
- **Change made:** swapped the `src` on that one `<img>` tag only. Same
  size, same `style`, same `filter`, same `onError` fallback — no layout
  change. The per-destination thumbnails further down the page
  (`TRIP_IMAGES`, Dominican Republic / Colombia / Atlanta) were **not**
  touched — those need destination-specific photos, and the uploaded
  image is a generic lounge scene, not a match for any specific
  destination.

## 2. `SEED PARING 2.png` → NOT REPLACED

- **Screen:** SmokeCraft → Pairing (`src/pages/smokecraft/Pairing.jsx`).
- **Component:** `CIGAR.imageUrl` (currently `null`), rendered via the
  `PairingImage` component, which by explicit in-file rule shows
  "Image pending" rather than any stock photo when `src` is missing.
- **Current image (before):** none — `null`, renders "Image pending."
- **Uploaded image:** a cigar-tip product photo cropped from the mockup.
- **Decision: uploaded does NOT win, even though the current slot is
  empty.** The named product in this slot is a specific real cigar
  (`Arturo Fuente OpusX`). The uploaded photo is generic mockup artwork,
  not verified photography of that actual product. The file itself
  contains this comment directly above the component:
  *"APPROVED SMOKECRAFT VISUAL RULE: No stock-photo fallback URLs... If a
  real image is missing, render 'Image pending' only."* Inserting the
  uploaded crop would do exactly what that rule forbids — present
  non-matching stock-style art as if it were the real product. An empty
  slot that's honest beats a filled slot that's wrong.

## 3. `smokecraft Intake.png` → NOT REPLACED

- **Screen:** SmokeCraft Intake (`src/pages/smokecraft/Enroll.jsx`,
  `className="smokecraft-intake"` — this is literally the screen the
  upload is named for).
- **Component:** full-bleed `backgroundImage` on the page root, currently
  `/assets/smokecraft/cropped/humidor-match-bg.jpg`.
- **Current image:** real photography — cigars in a humidor with rising
  smoke, dark and on-brand. Viewed directly: clean, no artifacts, no baked-in
  text.
- **Uploaded image:** the mockup's background is a similar ambient
  lounge/smoke photo, but it exists only as part of a flattened design
  composite with UI text/buttons baked in — there is no clean standalone
  crop of equal usability, and the cleanest extractable patch is a narrow
  smoke-wisp sliver, not a full background-quality image.
- **Decision: current wins.** It's already real, working photography
  specifically serving this exact ambient role, with no text artifacts —
  not a placeholder needing replacement, and not inferior to what's
  extractable from the upload.

## 4. `360 PASSPORT NETWORK INTERFACE 2.png` → NOT REPLACED

- **Screen:** Passport Connections — checked `PassportHome.jsx` (closest
  named match).
- **Component:** none — grepped the file for any `<img>`, `background-image`,
  or `.png`/`.jpg` reference: zero results. The screen is built entirely
  from CSS gradients and SVG icon glyphs.
- **Current image:** does not exist — there is no image element on this
  screen to compare against or replace.
- **Decision: no comparison is possible, so no replacement was made.**
  This upload's wax-seal content is already in active use elsewhere
  (`verified-seal.png`, used in `PassportConnections.jsx` and
  `PassportStamps.jsx`). Its passport-book photo has no existing image
  slot anywhere to drop into without adding a new image block, which
  falls outside "only swap images, don't add new functionality."

## 5. `CRAFT HUB EXPLAIND.png` → NOT REPLACED

- **Screen:** NOVEE OS (`src/pages/novi/ModuleDeploymentCenter.jsx`).
- **Component:** none — grepped the file: zero `<img>`, zero
  `background-image`, zero image references of any kind.
- **Current image:** does not exist.
- **Decision: no comparison possible, no replacement made,** for the same
  reason as #4 — there is nothing on this screen to swap.

## 6. `DECK, NOVEE OS.png` → NOT REPLACED

- Same screen, same finding as #5: NOVEE OS has zero image elements.
  **No comparison possible, no replacement made.**

## Verification

```
npm run build      # ✓ succeeds
node server/scripts/verifyFounderAdminAccess.js          # 14/14
node server/scripts/verifyNoviDeploymentCenter.js         # 16/16
node server/scripts/verifyNoviRemoteDeploymentReadiness.js # 17/17
node server/scripts/verifyReviewDeploymentCenterRoute.js  # 12/12
```

All 59/59 pass. Only one file changed functionally
(`src/pages/DayOneTravel.jsx`, one `src` attribute) plus one new image
asset (`public/assets/dayone/concierge-hero.png`). No layout, spacing,
navigation, or workflow was touched.
