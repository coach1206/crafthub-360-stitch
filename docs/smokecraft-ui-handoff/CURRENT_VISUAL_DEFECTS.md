# Current Visual Defects (Disclosed)

## FIXED this pass — Golden Box Rules letterboxing on tablet-portrait

Previously: at 768×1024, the image-shell "contain" fit against a landscape-oriented approved image left roughly 45% of the viewport as empty black bars (top + bottom). Fixed via a blurred, cover-fit backdrop copy of the same image behind the sharp contain-fit image (`SmokeCraftImageBoundsOverlay.jsx`) — zero hotspot coordinate changes, so the fix applies safely to all ~20 image-shell screens at once. See `docs/SMOKECRAFT_FULL_BROWSER_IMAGE_PROOF.md`.

## Open — Scorecard "Pairing Match" row overlapped by the Final Impressions panel

The last of Scorecard's 6 rating categories sits visually behind/adjacent to the "Final Impressions & Personal Notes" panel in a way that intercepts pointer clicks on its rating dots in at least one real-browser layout state. Screenshot: `public/proof/smokecraft-full-real-browser-journey/18--smokecraft-scorecard.png`. Confirmed via direct DOM element targeting that the button exists and is findable — the issue is specifically pointer-event interception by an overlapping element, not a missing/broken control. Not fixed this pass (Scorecard.jsx layout was not modified) — flagged for a design/engineering pass on this screen's panel stacking/z-index.

## No other disclosed visual defects found this pass

`scripts/captureSmokecraftViewportTouchProof.mjs` is 55/55 clean (no console errors, no overflow, no touch-target failures) across all 5 supported viewports for every screen it covers.
