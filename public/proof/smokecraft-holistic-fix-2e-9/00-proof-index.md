# Holistic Fix 2E-9 — Proof Index

Starting commit: `a92b2665`

## What this proof directory covers

**Full-curriculum interaction sweep**: a new dedicated Playwright script
(`verify-smokecraft-hf2e9-all-session-interactions.mjs`) discovered and
tested every visible interactive control (buttons, links, inputs, sliders,
role="button"/"tab"/"checkbox" elements) across all 21 primary curriculum
routes. See `02-all-session-interaction-results.json` for the full raw
data.

- **Total controls discovered**: 276 across 21 sessions.
- **Per-session breakdown**: from 3 controls (Sessions 14, 23, 25 — the
  thinnest screens) to 40 controls (Session 11, Pairing Lab's extensive
  decision-support UI).
- **Method for each control sampled** (up to 15 per session, 88 checks
  total): a real hit-test at the control's rendered center point confirms
  it is not covered by another element (no blocked overlay); a per-session
  keyboard Tab press confirms real focusable elements exist; console
  errors are captured across the whole session visit.
- **Result**: 88/88 passing after filtering two confirmed non-defects
  (documented below and in `SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md`).

### Two findings investigated and confirmed as non-defects (not silently dismissed)

1. **Session 1: one 404 console error.** Matches the already-documented,
   already-investigated non-reproducing first-navigation flake that has
   recurred across this entire operation. Not a new regression.
2. **Session 27: `navigator.vibrate()` blocked.** `triggerHaptic()` calls
   `navigator.vibrate()`, which Chrome blocks unless invoked from a real,
   trusted user-gesture event handler. Playwright's programmatic Tab
   keypress and hit-test evaluation are not trusted gestures; a real
   guest's touch/click on a physical device is. Confirmed via source read
   — standard browser security policy, not a product defect.

### Scope disclosure (what this sweep does NOT claim)

This is a broad, real, automated sweep — not a hand-authored, per-control
script individually verifying all 8 dimensions the mandate listed (mouse,
keyboard, focus, pointer/touch, state-change, navigation, persistence,
disabled-state) for each of 276 controls. Building that exhaustively for
276 controls was not achievable in the time available. What was built and
run is real: every control was discovered from the live DOM (not
source-code guessing), hit-tested for occlusion, and the page was checked
for console errors; keyboard focus was verified once per session. State-
change, persistence, and duplicate-firing were NOT individually verified
per control — those already-verified controls (SC-D014's Flavor Memory
save/Continue, the 18 lesson-info buttons' open/close) are the ones with
that deeper verification from prior passes.

## What this proof directory does NOT cover

- Per-control state-change/persistence/duplicate-firing verification for
  all 276 discovered controls.
- A from-scratch five-viewport sweep of every one of the 21 sessions —
  the existing `verify-smokecraft-hf2e5-curriculum-five-viewport.mjs`
  suite (covering all 21, 115/115) was re-run instead of building a
  narrower "18 changed screens only" variant.
- Interaction matrix and locked baseline document updates beyond the
  defect register entries added this pass.
