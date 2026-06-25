# SmokeCraft Visual QA Protocol

## The rule

A SmokeCraft visual screen is never "fixed," "done," or "matches the reference"
on the strength of any of the following alone:

- `npm run build` passing
- `grep`/string-search confirming an image path is or isn't referenced
- `node server/scripts/verifySmokeCraftImagePlacement.js` passing
- `node server/scripts/verifySmokeCraftBannedImages.js` passing

Those checks catch real regressions (wrong file wired up, banned mockup
referenced, distorted stretch box) but they say nothing about whether the
*rendered* page visually matches the *approved reference image*. They are
necessary, not sufficient.

**The only valid visual approval artifact is a side-by-side proof image:**

- LEFT: the approved reference image (the original mockup PNG)
- RIGHT: an actual rendered screenshot of the live route, captured at a
  documented viewport
- both sides labeled, with route, viewport, timestamp, and commit hash
  recorded alongside

No screen may be described as "matches reference," "fixed," or "ready for
approval" without this artifact existing on disk. If the artifact cannot be
generated (no browser available, dev server won't boot, etc.), the honest
status is "cannot verify visually in this environment" — not "should be
fixed" or "build passes so it's probably right."

## Why this exists

Multiple SmokeCraft screens were declared fixed based on code diffs, build
success, and verification-script success, while the live rendered page still
did not visually match the approved reference. Source-code correctness and
rendered-pixel correctness are different claims; this protocol exists so the
second claim is never made without evidence for the second claim specifically.

## Workflow per screen

1. Identify the route and its approved reference image (see the mapping in
   `scripts/smokecraftVisualProof.js`).
2. Run `npm run visual:smokecraft` (or the targeted route flag) to produce/
   refresh `docs/visual-proof/<screen-name>-proof.png` (and its adjacent
   `.json` metadata file).
3. Look at the proof image. Compare composition, density, scale, and framing
   against the reference side.
4. If it does not match, make the code change, then regenerate the proof
   image. Do not move to the next screen until the current screen's proof
   image visually passes.
5. Only once the proof image shows a visual match may the screen be
   described as matching its reference.

## Temporary markers

Every SmokeCraft screen touched under this protocol carries a hidden
`data-marker="<SCREEN MARKER VX>"` element. This exists so a stale deploy or
a stale screenshot can be identified — if the marker in a screenshot's page
source doesn't match the marker in the current source file, the screenshot is
not evidence about the current code and must be discarded.

## What this protocol does not claim

This protocol does not replace human visual judgment. A passing proof image
contact sheet is evidence to be looked at, not an automated pass/fail gate —
pixel-diffing two intentionally different (mockup vs. live React UI) images
is not meaningful. The artifact's job is to put both images in front of a
human (or an agent that can actually view images) at the same time so the
comparison is honest, instead of relying on memory or assumption.
