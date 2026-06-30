# SmokeCraft Overlay Phase 2B — Smoking Experience + Completion Hotspots Report

Baseline: visual reset `96e9ded2`, overlay foundation `a7b5a6bb`, Phase 2A `9c84a739`. All changes additive.

---

## A. Files Changed

| File | Change |
|------|--------|
| `src/pages/smokecraft/FirstThird.jsx` | Converted to SmokeCraftAssetRoute; hotspot onClick preserves `setFirstThirdTasting`, `completeStep`, `addXP` side effects; removed `<div onClick>` wrapper |
| `src/pages/smokecraft/SecondThird.jsx` | Converted to SmokeCraftAssetRoute; hotspot onClick preserves `setSecondThirdTasting`, `completeStep`, `addXP` side effects; nav target updated to `/smokecraft/final-third` per mission spec |
| `src/pages/smokecraft/FinalThird.jsx` | Converted to SmokeCraftAssetRoute; hotspot onClick preserves `setFinalThirdTasting`, `completeStep`, `addXP` side effects; removed `<div onClick>` wrapper |
| `src/pages/smokecraft/Scorecard.jsx` | Converted to SmokeCraftAssetRoute + hotspot (no side effects) |
| `src/pages/smokecraft/PassportStamp.jsx` | Converted to SmokeCraftAssetRoute + hotspot (no side effects) |

**Not modified:** `SmokeCraftAssetScreen`, `SmokeCraftHotspotLayer`, `SmokeCraftAssetRoute`, `DemoBanner`, `PublicSessionNotice`, `VisitLockGuard`

---

## B. Routes Updated

| Route | File |
|-------|------|
| `/smokecraft/first-third` | `src/pages/smokecraft/FirstThird.jsx` |
| `/smokecraft/second-third` | `src/pages/smokecraft/SecondThird.jsx` |
| `/smokecraft/final-third` | `src/pages/smokecraft/FinalThird.jsx` |
| `/smokecraft/scorecard` | `src/pages/smokecraft/Scorecard.jsx` |
| `/smokecraft/passport-stamp` | `src/pages/smokecraft/PassportStamp.jsx` |

---

## C. Hotspot Map

| Route | Label | x | y | width | height | onClick side effects | Target |
|-------|-------|---|---|-------|--------|----------------------|--------|
| `/smokecraft/first-third` | Continue to Second Third | 10% | 75% | 80% | 20% | `setFirstThirdTasting`, `completeStep('first-third')`, `addXP(5)` | `/smokecraft/second-third` |
| `/smokecraft/second-third` | Continue to Final Third | 10% | 75% | 80% | 20% | `setSecondThirdTasting`, `completeStep('second-third')`, `addXP(50)` | `/smokecraft/final-third` |
| `/smokecraft/final-third` | Continue to Scorecard | 10% | 75% | 80% | 20% | `setFinalThirdTasting`, `completeStep('final-third')`, `addXP(5)` | `/smokecraft/scorecard` |
| `/smokecraft/scorecard` | Continue to Passport Stamp | 10% | 75% | 80% | 20% | none | `/smokecraft/passport-stamp` |
| `/smokecraft/passport-stamp` | Complete Session | 10% | 75% | 80% | 20% | none | `/smokecraft/session-complete` |

---

## D. Normal Screenshot Paths

```
public/proof/smokecraft-overlay-phase-2b-smoking-completion/normal/first-third.png
public/proof/smokecraft-overlay-phase-2b-smoking-completion/normal/second-third.png
public/proof/smokecraft-overlay-phase-2b-smoking-completion/normal/final-third.png
public/proof/smokecraft-overlay-phase-2b-smoking-completion/normal/scorecard.png
public/proof/smokecraft-overlay-phase-2b-smoking-completion/normal/passport-stamp.png
```

---

## E. Debug Screenshot Paths

```
public/proof/smokecraft-overlay-phase-2b-smoking-completion/debug/first-third-debug.png
public/proof/smokecraft-overlay-phase-2b-smoking-completion/debug/second-third-debug.png
public/proof/smokecraft-overlay-phase-2b-smoking-completion/debug/final-third-debug.png
public/proof/smokecraft-overlay-phase-2b-smoking-completion/debug/scorecard-debug.png
public/proof/smokecraft-overlay-phase-2b-smoking-completion/debug/passport-stamp-debug.png
```

---

## F. DOM Proof Summary

### Normal Mode (5/5 PASS)

| Route | bodyLen | visImgs | visBtns | chrome | header | nav | aside | form |
|-------|---------|---------|---------|--------|--------|-----|-------|------|
| `/smokecraft/first-third` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/second-third` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/final-third` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/scorecard` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/passport-stamp` | 0 | 1 | 0 | 0 | false | false | false | false |

### Debug Mode (5/5 PASS)

| Route | visImgs | hotspotDOM | labelVisible | visBtns |
|-------|---------|------------|--------------|---------|
| `/smokecraft/first-third` | 1 | 1 | true | 1 |
| `/smokecraft/second-third` | 1 | 1 | true | 1 |
| `/smokecraft/final-third` | 1 | 1 | true | 1 |
| `/smokecraft/scorecard` | 1 | 1 | true | 1 |
| `/smokecraft/passport-stamp` | 1 | 1 | true | 1 |

---

## G. Navigation Click Proof (5/5 PASS)

| From | Expected | Landed | Result |
|------|----------|--------|--------|
| `/smokecraft/first-third` | `/smokecraft/second-third` | `/smokecraft/second-third` | ✅ |
| `/smokecraft/second-third` | `/smokecraft/final-third` | `/smokecraft/final-third` | ✅ |
| `/smokecraft/final-third` | `/smokecraft/scorecard` | `/smokecraft/scorecard` | ✅ |
| `/smokecraft/scorecard` | `/smokecraft/passport-stamp` | `/smokecraft/passport-stamp` | ✅ |
| `/smokecraft/passport-stamp` | `/smokecraft/session-complete` | `/smokecraft/session-complete` | ✅ |

---

## H. Build Result

```
✓ built in 8.31s
```

---

## I. Remaining Issues

- `SecondThird` previously navigated to `/smokecraft/flavor-memory`. That route has been superseded; the hotspot now routes to `/smokecraft/final-third` per mission spec. The `flavor-memory` route (if it still exists in the router) is an orphan — not addressed in this phase.
- Session side effects (`setFirstThirdTasting`, `setSecondThirdTasting`, `setFinalThirdTasting`) write empty tasting objects. Full tasting input forms are not part of this phase; the hotspot fires immediately without collecting user input.
- Hotspot coordinates remain at standard initial placement. Device calibration pending.
- Routes still without hotspots: `origins`, `pairing`, `terroir`, `vitola`, `pairing-mastery`, `event-challenge`, `flavor-dna`, `leaderboard`, `request-purchase`, `connections`, `management-sync`, `golden-box/status`, `enroll`.
