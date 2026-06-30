# SmokeCraft Functional Overlay Phase 1 Report

Baseline sealed at commit `96e9ded2`. All changes are additive only.

---

## A. Files Changed

| File | Action |
|------|--------|
| `src/components/smokecraft/SmokeCraftHotspotLayer.jsx` | Created |
| `src/components/smokecraft/SmokeCraftAssetRoute.jsx` | Created |
| `src/pages/SmokeCraft.jsx` | Updated |
| `src/pages/smokecraft/Identity.jsx` | Updated |
| `src/pages/smokecraft/SessionComplete.jsx` | Updated |

**Not modified:**
- `src/components/smokecraft/SmokeCraftAssetScreen.jsx`
- `src/components/demo/DemoBanner.jsx`
- `src/components/PublicSessionNotice.jsx`
- `src/components/smokecraft/VisitLockGuard.jsx`

---

## B. Hotspot System Created

### `SmokeCraftHotspotLayer.jsx`

Invisible percentage-based tap/click target layer rendered `position:fixed` over the full viewport at `zIndex:10`. Each hotspot is a `<button>` with:

- `background: transparent`, `border: none` — invisible by default
- `position: absolute` using `left/top/width/height` as viewport percentages
- `aria-label` for accessibility
- `touchAction: manipulation` for kiosk/tablet support
- `WebkitTapHighlightColor: transparent` — no flash on tap
- `onClick` callback support + `to` react-router navigation

**Debug mode:** Set `sessionStorage.setItem('smokecraft_hotspot_debug', '1')` to reveal translucent gold outlines and label text. Off by default. No visible effect in production without this flag.

### `SmokeCraftAssetRoute.jsx`

Thin wrapper composing `SmokeCraftAssetScreen` + optional `SmokeCraftHotspotLayer`. `SmokeCraftAssetScreen` is unchanged. The wrapper renders both in a fragment — no additional DOM wrapper element.

---

## C. Routes Updated

| Route | File |
|-------|------|
| `/smokecraft` | `src/pages/SmokeCraft.jsx` |
| `/smokecraft/identity` | `src/pages/smokecraft/Identity.jsx` |
| `/smokecraft/session-complete` | `src/pages/smokecraft/SessionComplete.jsx` |

---

## D. Hotspot Actions Per Route

### `/smokecraft`
| Label | Region | Action |
|-------|--------|--------|
| Start SmokeCraft | x:10% y:70% w:80% h:25% | Navigate → `/smokecraft/identity` |

### `/smokecraft/identity`
| Label | Region | Action |
|-------|--------|--------|
| Continue | x:10% y:75% w:80% h:20% | Navigate → `/smokecraft/seed-soil` |

### `/smokecraft/session-complete`
| Label | Region | Action |
|-------|--------|--------|
| Staff Handoff | x:10% y:75% w:80% h:20% | Navigate → `/pos3` |

---

## E. SessionComplete Side Effects Preserved

All existing `useEffect` logic carried forward unchanged:

```js
const alreadyDone = session.completedSteps.includes('session-complete')
if (!alreadyDone) {
  completeStep('session-complete')
  addXP(XP_AWARDS.SESSION_1_COMPLETE)
  awardStamp('journey-complete', 'session-complete')
  triggerHaptic('success')
}
completeSmokeCraftSession({ tasteProfile: TASTE_TAGS })
syncPos3Activity()
syncEATActivity()
```

The Staff Handoff hotspot routes to `/pos3` (an existing route in `App.jsx`). No fake backend calls. No invented success state.

---

## F. Screenshot Proof Paths

```
public/proof/smokecraft-functional-overlay-phase-1/01-smokecraft-index.png
public/proof/smokecraft-functional-overlay-phase-1/02-smokecraft-identity.png
public/proof/smokecraft-functional-overlay-phase-1/03-session-complete.png
public/proof/smokecraft-functional-overlay-phase-1/strict-dom-results.json
```

---

## G. DOM Proof Summary

All 3 routes tested at 1024×768 viewport, demo mode active, debug flag OFF.

| Route | Pass | bodyTextLength | visibleImageCount | visibleButtonCount | fixedChrome | header | nav | aside | form |
|-------|------|---------------|-------------------|--------------------|-------------|--------|-----|-------|------|
| `/smokecraft` | ✅ | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/identity` | ✅ | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/session-complete` | ✅ | 0 | 1 | 0 | 0 | false | false | false | false |

**Result: 3/3 PASS**

Hotspot `<button>` elements exist in the DOM (1 per route) but register as visually invisible: transparent background, no border, no text, no layout impact.

---

## H. Build Result

```
✓ built in 8.22s
```

No errors. Chunk size warning is pre-existing and unrelated.

---

## I. Remaining Issues

- Hotspot coordinates are approximate. Final placement should be calibrated against the actual approved PNG layout once the design positions are confirmed.
- Only 3 routes have hotspots. Remaining 20 asset routes use bare `SmokeCraftAssetScreen` — no hotspots yet. Phase 2 will extend coverage.
- `/smokecraft/session-complete` Staff Handoff routes to `/pos3` home. A dedicated handoff sub-route can be wired when the POS360/E.A.T. handoff flow is scoped.
