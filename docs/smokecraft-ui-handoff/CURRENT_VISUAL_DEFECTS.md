# Current Visual Defects (Disclosed, Not Yet Fixed)

## Golden Box Rules — severe letterboxing on tablet-portrait

At 768×1024, the image-shell "contain" fit against a landscape-oriented approved image leaves roughly 45% of the viewport as empty black bars (top + bottom). Screenshot: `public/proof/smokecraft-canonical-opening-sequence-recovery/golden-box--tablet-portrait.png`. Root cause and why it wasn't force-fixed this pass: `docs/smokecraft-ui-handoff/RESPONSIVE_AND_TOUCH_SPEC.md` §Known exception. Recommended as a dedicated engineering pass (re-deriving hotspot coordinates for a new fit mode across every affected image-shell screen), not a same-day UI patch.

## No other disclosed visual defects found this pass

`scripts/captureSmokecraftViewportTouchProof.mjs` is 55/55 clean (no console errors, no overflow, no touch-target failures) across all 5 supported viewports for every screen it covers.
