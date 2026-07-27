# Holistic Fix 5A-3C — Proof Index

Starting commit: `3d59b8cf`.

## Route and asset

Route: `/smokecraft/terroir` (Session 4, "Terroir").
Approved asset: `smokecraft-terroir.png`
(`/assets/smokecraft-reference/approved/smokecraft-terroir.png`).

## Exact cause (proven, not assumed)

S4's approved image is intentionally data-gated behind a real user click
on one of the 6 section-selector tabs (Country/Region/Soil/Climate/
Growing Conditions/Why It Matters) — a real, deliberate product design
(comment already in the test file: "S4 shows a terroir plate only once a
section is opened"). This is NOT the defect.

The full-journey test's `revealSections()` helper clicks the first
eligible section tab, then waited a **fixed 350ms** before re-checking
whether the image had been fetched. Root-caused via two reproducible,
instrumented before/after runs:

1. A standalone debug script (isolated, no concurrent load) confirmed
   clicking "Country" triggers the `smokecraft-terroir.png` request and
   it completes well within 350ms, every time.
2. A debug-instrumented copy of the actual full-journey test, run in a
   clean environment (single process, no concurrent builds/tests/curl
   traffic), passed 107/107 — the S4 check succeeded, logging the exact
   fetched path matching the expected asset.

Conclusion: the fixed 350ms wait was sufficient in isolation but
occasionally too short under the real resource contention present during
Holistic Fix 5A-3's diagnostic runs (multiple concurrent Node/Playwright/
build processes in the same container). This is a **test-harness
readiness-wait defect**, not a real product defect — the product itself
loads the correct image reliably on every real click.

## Fix

`revealSections()` in `verify-smokecraft-full-journey-sequence-and-assets.mjs`
now uses `page.waitForResponse()` scoped to image-file requests (bounded
at 3s) instead of a fixed sleep — resolves as soon as the real network
response arrives, deterministic rather than timing-guessed. No product
code changed; the approved asset file is untouched.

## Targeted regression (7/7)

`verify-smokecraft-hf5a3c-s4-asset-fetch-regression.mjs`:

- S4 does not fetch the image on plain page load (confirms the
  data-gating is real design, not a load-order bug).
- First visit: click loads the image deterministically.
- Refresh: click after a hard reload loads the image.
- Back-and-return: navigating away and back, then clicking, loads the
  image.
- Repeated click on an already-viewed section still resolves the image
  (cache-served responses are fine — no network 'response' event is
  required, only that the `<img>` element actually renders, matching
  real user experience).
- The rendered `<img>` element is `complete` with non-zero
  `naturalWidth` — no blank/broken image.
- A real 800ms-throttled response (via Playwright route interception)
  still resolves within the bounded 3s wait, proving the fix doesn't
  merely paper over slowness with an even longer arbitrary sleep.

## Full-journey result

107/107 (was 106/107 before this fix), re-run once after the targeted
tests passed, per this mandate's scope.

## Build result

`npm run build` (all 13 prebuild validators + vite build): clean.

## What this pass does NOT cover

- Any of the other Holistic Fix 5A-3 gaps (tasting, Collections, Skill
  Tree, Leaderboard, reward-screen reconnection) — untouched, unchanged.
- The full 109-route/five-viewport sweep — explicitly excluded by this
  mandate's own scope.
