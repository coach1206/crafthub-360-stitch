# SmokeCraft Hotspot Calibration Phase 1B Report

Baseline: visual reset `96e9ded2`, overlay foundation `a7b5a6bb`. All changes additive.

---

## A. Files Changed

| File | Change |
|------|--------|
| `src/components/smokecraft/SmokeCraftHotspotLayer.jsx` | Added `route` prop; added `console.log` output per hotspot in debug mode only |
| `src/components/smokecraft/SmokeCraftAssetRoute.jsx` | Pass-through `route` prop to `SmokeCraftHotspotLayer` |
| `src/pages/SmokeCraft.jsx` | Added `route="/smokecraft"` prop |
| `src/pages/smokecraft/Identity.jsx` | Added `route="/smokecraft/identity"` prop |
| `src/pages/smokecraft/SessionComplete.jsx` | Added `route="/smokecraft/session-complete"` prop |

**Not modified:** `SmokeCraftAssetScreen`, `DemoBanner`, `PublicSessionNotice`, `VisitLockGuard`

---

## B. Hotspots Calibrated

### `/smokecraft`
| Label | x | y | width | height | Target |
|-------|---|---|-------|--------|--------|
| Start SmokeCraft | 10% | 70% | 80% | 25% | `/smokecraft/identity` |

### `/smokecraft/identity`
| Label | x | y | width | height | Target |
|-------|---|---|-------|--------|--------|
| Continue | 10% | 75% | 80% | 20% | `/smokecraft/seed-soil` |

### `/smokecraft/session-complete`
| Label | x | y | width | height | Target |
|-------|---|---|-------|--------|--------|
| Staff Handoff | 10% | 75% | 80% | 20% | `/pos3` |

Debug console output (only fires when `smokecraft_hotspot_debug=1`):
```
[SmokeCraft Hotspot] { route, label, x, y, width, height, target }
```

---

## C. Normal Screenshot Paths

```
public/proof/smokecraft-hotspot-calibration-phase-1b/normal/smokecraft-index.png
public/proof/smokecraft-hotspot-calibration-phase-1b/normal/smokecraft-identity.png
public/proof/smokecraft-hotspot-calibration-phase-1b/normal/session-complete.png
```

---

## D. Debug Screenshot Paths

```
public/proof/smokecraft-hotspot-calibration-phase-1b/debug/smokecraft-index-debug.png
public/proof/smokecraft-hotspot-calibration-phase-1b/debug/smokecraft-identity-debug.png
public/proof/smokecraft-hotspot-calibration-phase-1b/debug/session-complete-debug.png
```

---

## E. DOM Proof — Normal Mode

Tested at 1024×768, demo mode active, `smokecraft_hotspot_debug` NOT set.

| Route | Pass | bodyTextLength | visibleImageCount | visibleButtonCount | fixedChrome | header | nav | aside | form |
|-------|------|---------------|-------------------|---------------------|-------------|--------|-----|-------|------|
| `/smokecraft` | ✅ | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/identity` | ✅ | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/session-complete` | ✅ | 0 | 1 | 0 | 0 | false | false | false | false |

**Result: 3/3 PASS.** Hotspot `<button>` exists in DOM (1 per route) but is visually invisible — no background, no border, no text rendered.

---

## F. DOM Proof — Debug Mode

Tested at 1024×768, demo mode active, `sessionStorage.smokecraft_hotspot_debug = "1"`.

| Route | Pass | visibleImageCount | hotspotDOM | debugLabelVisible | visibleButtonCount | header | failTerms |
|-------|------|-------------------|------------|-------------------|--------------------|--------|-----------|
| `/smokecraft` | ✅ | 1 | 1 | true | 1 | false | [] |
| `/smokecraft/identity` | ✅ | 1 | 1 | true | 1 | false | [] |
| `/smokecraft/session-complete` | ✅ | 1 | 1 | true | 1 | false | [] |

**Result: 3/3 PASS.** In debug mode: approved image remains the screen, hotspot outline and label text become visible (translucent gold). No old chrome introduced.

---

## G. Build Result

```
✓ built in 8.23s
```

---

## H. Remaining Calibration Notes

- Hotspot coordinates (x/y/width/height) are initial placements. Final calibration against each PNG's actual button/CTA region should be done once the design is confirmed on a target device.
- Debug mode is activated by `sessionStorage.setItem('smokecraft_hotspot_debug', '1')` from the browser console. No UI toggle exists by design — dev-only tool.
- Console log fires on every render in debug mode (not just first mount). This is intentional for placement iteration.
- 20 remaining asset routes are not yet wired with hotspots. Phase 2 will extend coverage once these 3 are signed off.
