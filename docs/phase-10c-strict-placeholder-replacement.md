# Phase 10C — Strict Placeholder-Only Replacement

Scope for this pass, per explicit instruction: audit every uploaded image,
find every fake/placeholder/SVG-simulated/glyph artwork in the app, swap
only those 1:1 for the closest matching real uploaded asset. No new
placements, no layout/background/redesign changes, no moving images
between modules, no touching real photography already in place.

## 1. Uploaded image audit (all 15 files, individually)

| # | Filename | Content |
|---|---|---|
| 1 | `360 PASSPORT NETWORK INTERFACE 2.png` | Passport Connections dashboard mockup — navy passport book + gold wax-seal photo |
| 2 | `DIGETAL STAMP COLLECTION 1.png` | Isolated gold wax-seal badge (clean, no background clutter) |
| 3 | `360 LUXARY STAMP COLLECT 2.png` | Near-duplicate stamp collection mockup, same wax seal |
| 4 | `360 PASSPORT CONNECTION 2.png` | Passport Connections mockup, same book+seal photo |
| 5 | `360 Passport 1.png` | Passport dashboard mockup (UI chrome only, no standalone photo) |
| 6 | `360 passport  connections 11.png` | Passport dashboard + 5-tier passport-color book row |
| 7 | `360  passport connect  CONECTIONS.png` | Passport Connections mockup, same book+seal photo |
| 8 | `360 story board.png` | Multi-panel SmokeCraft ritual storyboard |
| 9 | `SMOKECRAT STORY BOARD.png` | Multi-panel SmokeCraft storyboard, low-res per-panel |
| 10 | `STORY BOARD.png` | Duplicate of #9 |
| 11 | `CRAFT HUB EXPLAIND.png` | NOVEE OS marketing/explainer infographic (multi-section deck page) |
| 12 | `DECK, NOVEE OS.png` | 16-slide NOVEE OS investor deck grid |
| 13 | `DAYONE360 CONICERGE 1.png` | DayOne360 Concierge mockup — full screen UI composite |
| 14 | `SEED PARING 2.png` | Seed & Soil Pairing screen mockup w/ cigar product photo |
| 15 | `smokecraft Intake.png` | SmokeCraft Intake form mockup w/ lounge hero photo |

## 2 & 3. Placeholder/fake-artwork audit of the live app (all 6 modules)

Searched every `.jsx` page under NOVEE OS, E.A.T., POS 3, SmokeCraft 360,
Passport Connections, and DayOne360 for hand-drawn SVG simulations,
`radialGradient`/`linearGradient`-only fake badges, `textPath` curved-text
seals, and icon-only stand-ins for artwork.

**Found, and already fixed in Phase 10B (prior pass, unchanged here):**
- `PassportStamp` (`PassportConnections.jsx`) and `WaxSeal`
  (`PassportStamps.jsx`) — both already replaced with the real cropped
  seal (`/assets/passport/verified-seal.png`).

**Found and fixed in this pass:**
- `PassportMedallion` (`src/pages/passport/PassportStamps.jsx`, lines
  14–50) — used for every individual earned stamp across all 5 stamp
  categories (24 stamp slots total). This was a hand-drawn SVG: gold
  linear-gradient ring + navy fill + curved `<textPath>` reading "360" /
  "PASSPORT CONN." — the exact same kind of fake medallion-stamp
  simulation as the two already-fixed components, just not caught in the
  Phase 10B pass because it lives in a different function in the same
  file as the already-fixed `WaxSeal`.

**Checked and confirmed NOT placeholders (left untouched):**
- `PassportHome.jsx` — `DirectorySeal`, `ConnectionSeal`, `EventSeal`,
  `BenefitSeal`, `ScanBadge`, `Emblem` — these are custom SVG glyphs
  (ID-card icon, network-node icon, ticket icon, VIP ribbon, QR icon),
  each representing a distinct semantic category. None of them simulate
  a specific piece of artwork that exists in the uploaded images — there
  is no uploaded "network icon" or "ticket icon" reference to swap them
  for. Replacing distinct functional icons with one photographic seal
  would erase the meaning each icon currently conveys, which is outside
  this task's scope (placeholder-for-real-art swap, not redesign).
- `LeafChallengeCalculating.jsx` / `LeafChallengeResult.jsx` —
  `linearGradient`-filled SVG circles are functional progress-ring /
  score-meter graphics (data visualizations), not artwork placeholders.
- NOVEE OS (`ModuleDeploymentCenter.jsx`), E.A.T. (`src/pages/eat/*`),
  POS 3 (`src/pages/pos3/*`), DayOne360 (`DayOneTravel.jsx`) — grepped
  for `radialGradient|linearGradient|textPath|<svg|Seal|Medallion`:
  **zero matches**. These modules use plain Material Symbols icons and
  CSS-only buttons/status dots for standard UI chrome — none of it is a
  simulation of missing photographic/graphic artwork, so there is
  nothing here that qualifies as a "placeholder standing in for real
  art." Nothing was changed in these four modules.

## 4. What was implemented

**`src/pages/passport/PassportStamps.jsx` — `PassportMedallion`:**
For the unlocked state only, the hand-drawn SVG disc (gradient ring +
curved text) was replaced with `<img src="/assets/passport/verified-seal.png">`
sized identically (`size` prop unchanged, same parent `div`). The globe
icon overlay, the "lock" icon overlay for locked stamps, the teal
check-badge, and all title/date/"Coming Soon" labels were left
byte-for-byte unchanged — only the base disc artwork was swapped. The
locked-state disc (plain dark circle, no text) was also left unchanged,
since a locked stamp should show no artwork.

No new image asset was created for this pass — the existing
`verified-seal.png` (cropped in Phase 10B from `DIGETAL STAMP COLLECTION
1.png`) was reused, since it is the same medallion motif this SVG was
already simulating.

## 5. Replacement table

| Uploaded image | Screen using placeholder | Asset replaced | Before | After |
|---|---|---|---|---|
| `DIGETAL STAMP COLLECTION 1.png` (via existing `verified-seal.png` crop) | Passport → Stamp Collection (`PassportStamps.jsx`), all 5 categories, every unlocked stamp (≈14 unlocked of 24 total slots) | `PassportMedallion` SVG disc (gold-gradient ring + curved "PASSPORT CONN." text) | Hand-drawn SVG simulating a wax-seal medallion | Real cropped wax-seal photo, same size/position, overlays unchanged |

(`PassportStamp` and `WaxSeal` rows are unchanged from Phase 10B — not
re-listed here since this pass made no further edit to those two.)

## 6. Uploaded images with no matching placeholder (left unused, per instruction)

| Uploaded image | Why unused |
|---|---|
| `360 Passport 1.png`, `360 passport  connections 11.png` | UI-chrome mockups / 5-tier book row — no SVG placeholder in the app simulates this content; the app's real tier system (Novice/Bronze/Silver/Gold/Diamond) is a different business-logic set than the reference's tier-colored books, so there is no like-for-like placeholder to swap |
| `360 story board.png`, `SMOKECRAT STORY BOARD.png`, `STORY BOARD.png` | Multi-panel storyboards — no screen has a placeholder shaped like a storyboard panel |
| `CRAFT HUB EXPLAIND.png`, `DECK, NOVEE OS.png` | Marketing infographic / investor deck — NOVEE OS has no SVG-simulated graphic standing in for either of these; nothing to replace |
| `DAYONE360 CONICERGE 1.png` | DayOne360's only screen (`DayOneTravel.jsx`) has no SVG/fake-artwork placeholder — it uses plain icons and CSS buttons, none of which simulate this mockup |
| `SEED PARING 2.png`, `smokecraft Intake.png` | Both target screens (`SeedSoil.jsx`, SmokeCraft intake flow) already use real, working photography from earlier phases; no placeholder gap exists to justify touching them |
| `360 LUXARY STAMP COLLECT 2.png`, `360 PASSPORT CONNECTION 2.png`, `360  passport connect  CONECTIONS.png` | Near-duplicate wax-seal mockups — the same badge already has a clean crop in use (`verified-seal.png`, from `DIGETAL STAMP COLLECTION 1.png`); these duplicates were not separately cropped since one clean source was sufficient |

## Verification

```
npm run build
node server/scripts/verifyFounderAdminAccess.js
node server/scripts/verifyNoviDeploymentCenter.js
node server/scripts/verifyNoviRemoteDeploymentReadiness.js
node server/scripts/verifyReviewDeploymentCenterRoute.js
```

All pass (59/59, unrelated to this change but confirming no regression).
Build succeeds. `/assets/passport/verified-seal.png` confirmed to resolve
with `200 image/png` from the dev server.

**Screenshot limitation:** this sandboxed environment has no installable
browser binary (Playwright's Chromium download is blocked by network
policy), so before/after screenshots could not be captured. Verification
was done via successful build, the four passing verification scripts, and
a direct HTTP check that the asset resolves. No functionality, layout,
spacing, navigation, or workflow was touched — only the artwork inside
`PassportMedallion`'s unlocked-state disc.
