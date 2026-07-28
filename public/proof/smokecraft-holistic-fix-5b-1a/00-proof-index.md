# Holistic Fix 5B-1A — Proof Index

Starting commit: `70e3c802`.

## Screens tested

`src/pages/smokecraft/PairingLab.jsx` (Session 11, `/smokecraft/pairing-lab`)
and `src/pages/smokecraft/PairingRecommendations.jsx` (Session 22,
`/smokecraft/pairing-recommendations`) — real Playwright browser
interaction against a live frontend (`vite`, port 5000) and live backend
(port 3001, real Postgres).

## Controls tested

Cigar-profile selectors (shape/wrapper/origin/strength), flavor-note
chips, pairing-goal selector, pairing-type hotspots (Whiskey/Rum/
Coffee/etc.), the Match score badge, the recommendation detail panel,
keyboard Tab focus, Back/Continue navigation (S11); the score donut,
Learn More expansion, alternates list, Save/View Alternate buttons,
Continue Journey control, keyboard Tab focus (S22).

## Recommendation-rendering result

PASS — the real server-computed `compatScore` renders in both screens'
existing pixel-positioned zones (verified live: 100 on S11's Match
badge, "100%" in S22's score donut), sourced entirely from
`useSmokeCraftPairingEngine`, never a client computation.

## Explanation result

PASS — S11's detail panel renders the real server `explanation` text
live; S22's "Learn More" expansion renders the real `servingSequence`
("Serving: …") live.

## Conflict-warning result

PASS (after fix — see Defects) — selecting flavor notes that clash
with the chosen pairing type (Sweet/Creamy vs. Whiskey) renders the
real "Watch for tension…" conflict text live.

## Save/reload result

PASS — Save produces a real "✓ Saved to your pairings" confirmation;
a duplicate Save click does not error (server-side true no-op,
confirmed in Holistic Fix 5B-1); a full page reload re-fetches from the
server and renders the identical deterministic score (same rule
version, same input).

## Keyboard/focus result

PASS — Tab moves focus to a real focusable element on both screens; a
visible focus style is present on the active element.

## Pointer/touch result

PASS (after fix — see Defects) — every selector chip, pairing-type
hotspot, and action button is reliably clickable; the previously-found
blocked-overlay condition (chip clicks silently intercepted by an
invisible pairing-type hotspot layered on top) is closed.

## Defects found and fixed

- **SC-D047**: `PairingLab.jsx` was missing the single visually-hidden
  accessible `<h1>` page title present on every other SmokeCraft
  screen — closed.
- **SC-D048 (real, serious — found live via Playwright)**: `PairingLab.jsx`'s
  journey-sync `useEffect` depended on `rec`, a brand-new object
  literal created on every render (derived from the async
  `engineResult`). This caused `setPairing` to fire on every single
  render, indefinitely (`setPairing` → journey-context update →
  re-render → new `rec` identity → effect fires again). It never
  surfaced in any prior API-level test because it is purely a client
  render-loop defect — visible only under real DOM interaction, where
  it manifested as chip buttons constantly detaching and re-attaching
  to the DOM (Playwright: "element was detached from the DOM,
  retrying" — over 50 retries observed before timeout). Closed by
  depending on the real underlying primitive values (including
  `engineResult?.compatScore`) instead of the freshly-created object.
- **SC-D049 (real — found live via Playwright)**: once SC-D048 was
  fixed and the render loop stopped, a second real defect became
  visible: the Pairing Choices panel (Flavor Notes / Pairing Goal
  chips) and the Pairing-type hotspot row both occupy real, separately
  measured rectangles against the approved image that genuinely
  overlap in the source coordinate space. With no explicit stacking
  order, the later-rendered, visually-transparent hotspot buttons sat
  on top in the DOM paint/hit-test order, silently swallowing clicks
  aimed at the visually-visible flavor-note chips underneath in the
  overlapping region — a real, silent blocked-overlay defect a user
  would experience as "I can see and read the Sweet/Creamy chips, but
  clicking them does nothing (or selects the wrong pairing type)."
  Closed with an explicit `zIndex: 3` on the Pairing Choices panel — no
  visual change (the panel's own solid background already painted over
  this area); the affected hotspots remain clickable via their
  still-uncovered edge.

None of these three defects were introduced by this pass's scoring/
persistence logic (Holistic Fix 5B-1) — they are pre-existing client
render/layout defects that had never been exercised by a real browser
interaction test before this mandate. `SMOKECRAFT_PAIRING_ENGINE_RULES.md`
is unchanged — none of these fixes altered scoring, rules, or
explanation behavior.

## Tests and build

`verify-smokecraft-hf5b1a-pairing-screens-browser.mjs` (new, real
Playwright): 25/25. `verify-smokecraft-hf5b1-pairing-engine.mjs`
(API-level, from Holistic Fix 5B-1): 36/36, re-verified clean.
`validateSmokecraftPairingEngineAuthority.mjs`: 28/28 (25 from 5B-1 +
3 new static regression checks encoding the defects above, so a
regression of any of the three fails the build going forward — this is
this pass's "one targeted build-blocking browser regression," expressed
as static checks rather than a live-browser check wired into `npm run
build` itself, since no other validator in this build chain depends on
a running dev server/database, and adding one would break `npm run
build` in any environment without a live Postgres + backend + frontend
running simultaneously). `npm run build` (19 prebuild validators + vite
build): clean.

## Proof path

`public/proof/smokecraft-holistic-fix-5b-1a/`

## What this pass does NOT cover (handoff to 5B-2)

- Pairing rules, scoring, and persistence are unchanged — this pass was
  scoped entirely to browser-verified visual/interaction correctness.
- The other existing pairing systems (Module-Build-4 intelligence
  module, Package 6 flavor-pairing) were not touched or consolidated.
- Mentor voices were not started.
- Full 109-route/five-viewport sweeps were not run, per this mandate's
  own instruction — only the two pairing screens were exercised.
- A deep visual-regression (pixel-diff) check was not added — this
  pass verified functional interaction correctness (clicks land where
  expected, real data renders, no console errors), not pixel-level
  appearance.
