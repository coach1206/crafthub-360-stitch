# SmokeCraft Tablet Viewport Fit Fix Report

Generated: 2026-06-30
Branch: claude/beautiful-thompson-r3mm5m
Viewport tested: 1024×768 (tablet/touchscreen landscape)

---

## A. Fix Applied

`SmokeCraftReferenceCanvas.jsx`:
- Removed the canvas title/header bar (no longer takes vertical space above the image).
- Image now uses `width: auto`, `height: auto`, `maxWidth: 100vw`, `maxHeight: 100vh`, `objectFit: contain`.

Direct `<img>` pages (FirstThird, SecondThird, EventChallenge, SessionComplete, GuestPass, Scan, ComingSoon-based pages, Identity):
- Changed every image from `width:100%; height:auto` (which let portrait images overflow viewport height) to `width:auto; height:auto; maxWidth:100%; maxHeight:82vh; objectFit:contain` so the full image always fits inside the visible screen.
- Moved the approved image to render **first**, immediately under the page header, ahead of any duplicate title text, badges, or hero copy that was pushing it below the fold.
- `ComingSoon.jsx`: when a `referenceImage` is supplied, the placeholder module badge / stitch badge / construction icon / duplicate heading are no longer rendered — the approved image is the primary canvas. Those placeholder elements still render for true coming-soon pages with no image.
- `Identity.jsx`: moved the profile-capture reference image above the hero text block instead of after it.

---

## B. Pages Verified (1024×768 tablet viewport)

| Page | Screenshot | Fits in Viewport | objectFit | Pass? |
|---|---|:---:|:---:|:---:|
| Identity | sc-tablet-proof-identity.png | YES | contain | ✅ |
| FirstThird | sc-tablet-proof-first-third.png | YES | contain | ✅ |
| SecondThird | sc-tablet-proof-second-third.png | YES | contain | ✅ |
| FlavorMemory | sc-tablet-proof-flavor-memory.png | YES | contain | ✅ |
| SecondHumidorMatch | sc-tablet-proof-second-humidor-match.png | YES | contain | ✅ |
| FinalReview | sc-tablet-proof-final-review.png | YES | contain | ✅ |
| SessionComplete | sc-tablet-proof-session-complete.png | YES | contain | ✅ |
| Terroir | sc-tablet-proof-terroir.png | YES | contain | ✅ |
| Vitola | sc-tablet-proof-vitola.png | YES | contain | ✅ |
| EventChallenge | sc-tablet-proof-event-challenge.png | YES | contain | ✅ |
| GuestPass | sc-tablet-proof-guest-pass.png | YES | contain | ✅ |
| Scan | sc-tablet-proof-scan.png | YES | contain | ✅ |

**12 of 12 pages: PASS**

Each page's `getBoundingClientRect()` for the approved image was checked against the 1024×768 viewport bounds (`top >= 0`, `left >= 0`, `bottom <= 768`, `right <= 1024`) — confirming the full image is visible with no vertical or horizontal cutoff.

---

## C. Failed / Needs More Work

None of the 12 pages failed the viewport-fit / cutoff / objectFit checks.

**Note (out of scope, flagged for visibility only):** Two approved source assets (`smokecraft-first-third.png` used on the FirstThird route, and `smokecraft-profile-capture.png` used on the Identity route) contain baked-in design content that doesn't match their filename/route label — these are pre-existing asset-content issues in the approved image files themselves, not layout defects. No image source files were changed in this fix; only CSS sizing and DOM order were touched, per the constraints of this task.

---

## D. Safety

No SmokeCraft scoring, auth, session gate, backend, POS360, E.A.T., NOVEE, or route flow logic was changed. Only CSS sizing/position and element ordering were modified. Demo mode and guest session injection via Playwright `addInitScript` only — no production bypass code committed.
