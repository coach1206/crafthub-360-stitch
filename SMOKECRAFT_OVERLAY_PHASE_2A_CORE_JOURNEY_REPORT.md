# SmokeCraft Overlay Phase 2A — Core Journey Hotspots Report

Baseline: visual reset `96e9ded2`, overlay foundation `a7b5a6bb`, calibration `20823837`. All changes additive.

---

## A. Files Changed

| File | Change |
|------|--------|
| `src/pages/smokecraft/SeedSoil.jsx` | Converted to SmokeCraftAssetRoute + hotspot |
| `src/pages/smokecraft/Mentor.jsx` | Converted to SmokeCraftAssetRoute + hotspot |
| `src/pages/smokecraft/GoldenBox.jsx` | Converted to SmokeCraftAssetRoute + hotspot |
| `src/pages/smokecraft/HumidorMatch.jsx` | Converted to SmokeCraftAssetRoute + hotspot |
| `src/pages/smokecraft/CutToastLight.jsx` | Converted to SmokeCraftAssetRoute + hotspot |

**Not modified:** `SmokeCraftAssetScreen`, `SmokeCraftHotspotLayer`, `SmokeCraftAssetRoute`, `DemoBanner`, `PublicSessionNotice`, `VisitLockGuard`

---

## B. Routes Updated

| Route | File |
|-------|------|
| `/smokecraft/seed-soil` | `src/pages/smokecraft/SeedSoil.jsx` |
| `/smokecraft/mentor-selection` | `src/pages/smokecraft/Mentor.jsx` |
| `/smokecraft/golden-box` | `src/pages/smokecraft/GoldenBox.jsx` |
| `/smokecraft/humidor-match` | `src/pages/smokecraft/HumidorMatch.jsx` |
| `/smokecraft/cut-toast-light` | `src/pages/smokecraft/CutToastLight.jsx` |

---

## C. Hotspot Map

| Route | Label | x | y | width | height | Target |
|-------|-------|---|---|-------|--------|--------|
| `/smokecraft/seed-soil` | Continue to Mentor | 10% | 75% | 80% | 20% | `/smokecraft/mentor-selection` |
| `/smokecraft/mentor-selection` | Continue to Golden Box | 10% | 75% | 80% | 20% | `/smokecraft/golden-box` |
| `/smokecraft/golden-box` | Continue to Humidor Match | 10% | 75% | 80% | 20% | `/smokecraft/humidor-match` |
| `/smokecraft/humidor-match` | Continue to Cut Toast Light | 10% | 75% | 80% | 20% | `/smokecraft/cut-toast-light` |
| `/smokecraft/cut-toast-light` | Continue to First Third | 10% | 75% | 80% | 20% | `/smokecraft/first-third` |

---

## D. Normal Screenshot Paths

```
public/proof/smokecraft-overlay-phase-2a-core-journey/normal/seed-soil.png
public/proof/smokecraft-overlay-phase-2a-core-journey/normal/mentor-selection.png
public/proof/smokecraft-overlay-phase-2a-core-journey/normal/golden-box.png
public/proof/smokecraft-overlay-phase-2a-core-journey/normal/humidor-match.png
public/proof/smokecraft-overlay-phase-2a-core-journey/normal/cut-toast-light.png
```

---

## E. Debug Screenshot Paths

```
public/proof/smokecraft-overlay-phase-2a-core-journey/debug/seed-soil-debug.png
public/proof/smokecraft-overlay-phase-2a-core-journey/debug/mentor-selection-debug.png
public/proof/smokecraft-overlay-phase-2a-core-journey/debug/golden-box-debug.png
public/proof/smokecraft-overlay-phase-2a-core-journey/debug/humidor-match-debug.png
public/proof/smokecraft-overlay-phase-2a-core-journey/debug/cut-toast-light-debug.png
```

---

## F. DOM Proof Summary

### Normal Mode (5/5 PASS)

| Route | bodyLen | visImgs | visBtns | chrome | header | nav | aside | form |
|-------|---------|---------|---------|--------|--------|-----|-------|------|
| `/smokecraft/seed-soil` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/mentor-selection` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/golden-box` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/humidor-match` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/cut-toast-light` | 0 | 1 | 0 | 0 | false | false | false | false |

### Debug Mode (5/5 PASS)

| Route | visImgs | hotspotDOM | labelVisible | visBtns |
|-------|---------|------------|--------------|---------|
| `/smokecraft/seed-soil` | 1 | 1 | true | 1 |
| `/smokecraft/mentor-selection` | 1 | 1 | true | 1 |
| `/smokecraft/golden-box` | 1 | 1 | true | 1 |
| `/smokecraft/humidor-match` | 1 | 1 | true | 1 |
| `/smokecraft/cut-toast-light` | 1 | 1 | true | 1 |

---

## G. Navigation Click Proof (5/5 PASS)

| From | Expected | Landed | Result |
|------|----------|--------|--------|
| `/smokecraft/seed-soil` | `/smokecraft/mentor-selection` | `/smokecraft/mentor-selection` | ✅ |
| `/smokecraft/mentor-selection` | `/smokecraft/golden-box` | `/smokecraft/golden-box` | ✅ |
| `/smokecraft/golden-box` | `/smokecraft/humidor-match` | `/smokecraft/humidor-match` | ✅ |
| `/smokecraft/humidor-match` | `/smokecraft/cut-toast-light` | `/smokecraft/cut-toast-light` | ✅ |
| `/smokecraft/cut-toast-light` | `/smokecraft/first-third` | `/smokecraft/first-third` | ✅ |

---

## H. Build Result

```
✓ built in 8.10s
```

---

## I. Remaining Issues

- Hotspot coordinates use the standard initial placement (x:10% y:75% w:80% h:20%). Final calibration against each PNG's CTA region pending design sign-off on a target device.
- Remaining 15 asset routes without hotspots: `origins`, `pairing`, `terroir`, `vitola`, `pairing-mastery`, `event-challenge`, `session-complete` (already done), `flavor-dna`, `leaderboard`, `passport-stamp`, `request-purchase`, `scorecard`, `connections`, `management-sync`, `golden-box/status`.
- `/smokecraft/first-third`, `/smokecraft/second-third`, `/smokecraft/final-third` (smoking experience routes) not yet wired — scheduled for Phase 2B.
