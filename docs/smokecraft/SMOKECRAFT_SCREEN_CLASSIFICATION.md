# SmokeCraft Screen Classification — Holistic Fix 1

Generated from `docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json`
(`node scripts/generateSmokecraftGameManifest.mjs`). Do not hand-edit the
counts below — regenerate the manifest and re-derive them.

Classification taxonomy (per the Holistic Fix 1 mandate):

- **full-live-react** — real component, real state, real backend or real
  local computation; no baked mockup image driving the layout.
- **clean-image-shell** — an approved image rendered via
  `SmokeCraftImageBoundsOverlay`, with percentage-positioned live controls
  overlaid on top. The image is decorative/structural, not a fabricated
  data source.
- **instructional-image** — an approved image used purely as reference
  material (e.g. a diagram), with no interactive hotspots implied by its
  content.
- **unsafe-full-mockup** — a baked image that visually implies interactive
  controls (sidebars, cards, nav strips) with no live control behind them.
  **None currently exist in this codebase** — every screen of this kind
  found during this recovery operation (SC-D001, SC-D010, SC-D011, SC-D012,
  SC-D013) has already been fixed and reclassified as `clean-image-shell`.
- **unclassified** — not yet individually interaction-audited by this
  recovery operation. This is the honest, disclosed default for any route
  this operation has not yet put a real browser in front of. It is NOT a
  claim of "broken" — it is a claim of "not yet verified either way."

## Current counts (108 total routes under `/smokecraft`)

| Classification | Count | Notes |
|---|---|---|
| full-live-react | 25 | 21 curriculum-spine screens (see below) + Connections, Passport Stamp, Rewards, Challenge Hub, Event Challenge, SmokeCraft Challenge, Blend Fault Identification |
| clean-image-shell | 5 | Welcome (S1), Leaderboard, Passport, CraftHub, Venue Selection |
| instructional-image | 0 | none yet confirmed as this specific type — see migration queue |
| unsafe-full-mockup | 0 | none remaining — all found instances already fixed |
| unclassified | 78 | not yet individually audited this operation; see the migration queue below for how these are grouped for Holistic Fix 2 |

21 of the 27 curriculum sessions share a route with a merged sibling
session (S9→S8, S13→S12, S17/S18→S16, S20→S19, S26→S25 — see
`SMOKECRAFT_27_SESSION_AUDIT.md` for why this merging is intentional, not a
defect), which is why 27 sessions resolve to 21 unique manifest entries.

## Correction made during this pass (not a screen defect — a tooling bug)

`scripts/smokecraftRouteInventory.mjs` was emitting a phantom duplicate
route entry for any `<Route path="X">` line that only opens a nested route
group (e.g. `<Route path="golden-box">`, which has no `element=` of its
own — its real page is the nested `<Route index element={...} />` right
under it). This inflated every prior route count in this operation by
exactly 1 (109 reported, 108 real). Fixed by only recording a route entry
for lines that actually carry an `element=`. Historical documents in this
folder that recorded "109" reflect what that script actually printed at
the time and are left as an accurate record of that prompt's real output;
this file and `SMOKECRAFT_GAME_MANIFEST.json` are the corrected count going
forward.

## Full per-route detail

See `docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json` — every one of the 108
routes, with its component, guard type, asset key/status, classification,
and `auditedIn` evidence citation (or the honest `unclassified` /
`not yet individually audited this operation` marker).
