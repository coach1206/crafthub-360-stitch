# SmokeCraft Overlay Phase 2D — Core Sequence Repair Report

Baseline: visual reset `96e9ded2`, overlay foundation `a7b5a6bb`, Phase 2A `9c84a739`, Phase 2B. All changes additive.

---

## A. Files Changed

| File | Change |
|------|--------|
| `src/pages/smokecraft/Enroll.jsx` | Converted bare `SmokeCraftAssetScreen` to `SmokeCraftAssetRoute`; added hotspot "Continue to Intake" → `/smokecraft/identity` |
| `src/pages/smokecraft/HumidorMatch.jsx` | Changed hotspot target from `/smokecraft/cut-toast-light` to `/smokecraft/request-purchase`; label updated to "Request Purchase" |
| `src/pages/smokecraft/RequestPurchase.jsx` | Converted bare `SmokeCraftAssetScreen` to `SmokeCraftAssetRoute`; added hotspot "Continue to Cut Toast Light" → `/smokecraft/cut-toast-light` |
| `src/pages/smokecraft/SecondThird.jsx` | Changed hotspot target from `/smokecraft/final-third` to `/smokecraft/flavor-memory`; label updated to "Continue to Flavor Memory" |
| `src/pages/smokecraft/FlavorMemory.jsx` | Converted from `<div onClick>` + `SmokeCraftAssetScreen` to `SmokeCraftAssetRoute`; removed `useNavigate`; preserved `completeStep('flavor-memory')`, `addXP(75)`, `triggerHaptic('medium')`; hotspot "Continue to Final Third" → `/smokecraft/final-third` |
| `src/pages/smokecraft/PassportStamp.jsx` | Changed hotspot target from `/smokecraft/session-complete` to `/smokecraft/connections`; label updated to "Continue to Connections" |
| `src/pages/smokecraft/Connections.jsx` | Converted bare `SmokeCraftAssetScreen` to `SmokeCraftAssetRoute`; added hotspot "Continue to Management Sync" → `/smokecraft/management-sync` |
| `src/pages/smokecraft/ManagementSync.jsx` | Converted bare `SmokeCraftAssetScreen` to `SmokeCraftAssetRoute`; added hotspot "Complete SmokeCraft" → `/smokecraft/session-complete` |

**Not modified:** `SmokeCraftAssetScreen`, `SmokeCraftHotspotLayer`, `SmokeCraftAssetRoute`, `DemoBanner`, `PublicSessionNotice`, `VisitLockGuard`

---

## B. Sequence Gaps Fixed

| Gap | Before | After |
|-----|--------|-------|
| Session 10 (request-purchase) skipped | HumidorMatch → cut-toast-light | HumidorMatch → request-purchase → cut-toast-light |
| Session 14 (flavor-memory) skipped | SecondThird → final-third | SecondThird → flavor-memory → final-third |
| Sessions 22–23 (connections, management-sync) unreachable | PassportStamp → session-complete | PassportStamp → connections → management-sync → session-complete |
| enroll had no hotspot | Dead-end screen | enroll → identity |

---

## C. Hotspot Map (Phase 2D Routes)

| Route | Label | x | y | width | height | onClick side effects | Target |
|-------|-------|---|---|-------|--------|----------------------|--------|
| `/smokecraft/enroll` | Continue to Intake | 10% | 75% | 80% | 20% | none | `/smokecraft/identity` |
| `/smokecraft/humidor-match` | Request Purchase | 10% | 75% | 80% | 20% | none | `/smokecraft/request-purchase` |
| `/smokecraft/request-purchase` | Continue to Cut Toast Light | 10% | 75% | 80% | 20% | none | `/smokecraft/cut-toast-light` |
| `/smokecraft/second-third` | Continue to Flavor Memory | 10% | 75% | 80% | 20% | `setSecondThirdTasting`, `completeStep('second-third')`, `addXP(50)` | `/smokecraft/flavor-memory` |
| `/smokecraft/flavor-memory` | Continue to Final Third | 10% | 75% | 80% | 20% | `completeStep('flavor-memory')`, `addXP(75)`, `triggerHaptic('medium')` | `/smokecraft/final-third` |
| `/smokecraft/passport-stamp` | Continue to Connections | 10% | 75% | 80% | 20% | none | `/smokecraft/connections` |
| `/smokecraft/connections` | Continue to Management Sync | 10% | 75% | 80% | 20% | none | `/smokecraft/management-sync` |
| `/smokecraft/management-sync` | Complete SmokeCraft | 10% | 75% | 80% | 20% | none | `/smokecraft/session-complete` |

---

## D. Complete Core Journey (Post Phase 2D)

```
/smokecraft/enroll
  → /smokecraft/identity        (Session 1)
  → /smokecraft/seed-soil       (Session 3)
  → /smokecraft/mentor-selection (Session 4)
  → /smokecraft/golden-box      (Session 5)
  → /smokecraft/humidor-match   (Session 9)
  → /smokecraft/request-purchase (Session 10) ← restored
  → /smokecraft/cut-toast-light (Session 11)
  → /smokecraft/first-third     (Session 12)
  → /smokecraft/second-third    (Session 13)
  → /smokecraft/flavor-memory   (Session 14) ← restored
  → /smokecraft/final-third     (Session 15)
  → /smokecraft/scorecard       (Session 20)
  → /smokecraft/passport-stamp  (Session 21)
  → /smokecraft/connections     (Session 22) ← restored
  → /smokecraft/management-sync (Session 23) ← restored
  → /smokecraft/session-complete (Session 24)
```

---

## E. Normal Mode DOM Proof (8/8 PASS)

| Route | bodyLen | visImgs | visBtns | chrome | header | nav | aside | form |
|-------|---------|---------|---------|--------|--------|-----|-------|------|
| `/smokecraft/enroll` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/request-purchase` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/connections` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/management-sync` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/second-third` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/flavor-memory` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/passport-stamp` | 0 | 1 | 0 | 0 | false | false | false | false |
| `/smokecraft/humidor-match` | 0 | 1 | 0 | 0 | false | false | false | false |

---

## F. Debug Mode Proof (8/8 PASS)

| Route | visImgs | hotspotDOM | labelVisible | label | visBtns |
|-------|---------|------------|--------------|-------|---------|
| `/smokecraft/enroll` | 1 | 1 | true | "Continue to Intake" | 1 |
| `/smokecraft/request-purchase` | 1 | 1 | true | "Continue to Cut Toast Light" | 1 |
| `/smokecraft/connections` | 1 | 1 | true | "Continue to Management Sync" | 1 |
| `/smokecraft/management-sync` | 1 | 1 | true | "Complete SmokeCraft" | 1 |
| `/smokecraft/second-third` | 1 | 1 | true | "Continue to Flavor Memory" | 1 |
| `/smokecraft/flavor-memory` | 1 | 1 | true | "Continue to Final Third" | 1 |
| `/smokecraft/passport-stamp` | 1 | 1 | true | "Continue to Connections" | 1 |
| `/smokecraft/humidor-match` | 1 | 1 | true | "Request Purchase" | 1 |

---

## G. Navigation Click Proof (8/8 PASS)

| From | Expected | Landed | Result |
|------|----------|--------|--------|
| `/smokecraft/enroll` | `/smokecraft/identity` | `/smokecraft/identity` | ✅ |
| `/smokecraft/humidor-match` | `/smokecraft/request-purchase` | `/smokecraft/request-purchase` | ✅ |
| `/smokecraft/request-purchase` | `/smokecraft/cut-toast-light` | `/smokecraft/cut-toast-light` | ✅ |
| `/smokecraft/second-third` | `/smokecraft/flavor-memory` | `/smokecraft/flavor-memory` | ✅ |
| `/smokecraft/flavor-memory` | `/smokecraft/final-third` | `/smokecraft/final-third` | ✅ |
| `/smokecraft/passport-stamp` | `/smokecraft/connections` | `/smokecraft/connections` | ✅ |
| `/smokecraft/connections` | `/smokecraft/management-sync` | `/smokecraft/management-sync` | ✅ |
| `/smokecraft/management-sync` | `/smokecraft/session-complete` | `/smokecraft/session-complete` | ✅ |

---

## H. End-to-End Path Test (16/16 PASS)

Linear click-through from `/smokecraft/enroll` to `/smokecraft/session-complete` in a single Playwright session:

| Step | From | Expected | Landed | Result |
|------|------|----------|--------|--------|
| 1 | `/smokecraft/enroll` | `/smokecraft/identity` | `/smokecraft/identity` | ✅ |
| 2 | `/smokecraft/identity` | `/smokecraft/seed-soil` | `/smokecraft/seed-soil` | ✅ |
| 3 | `/smokecraft/seed-soil` | `/smokecraft/mentor-selection` | `/smokecraft/mentor-selection` | ✅ |
| 4 | `/smokecraft/mentor-selection` | `/smokecraft/golden-box` | `/smokecraft/golden-box` | ✅ |
| 5 | `/smokecraft/golden-box` | `/smokecraft/humidor-match` | `/smokecraft/humidor-match` | ✅ |
| 6 | `/smokecraft/humidor-match` | `/smokecraft/request-purchase` | `/smokecraft/request-purchase` | ✅ |
| 7 | `/smokecraft/request-purchase` | `/smokecraft/cut-toast-light` | `/smokecraft/cut-toast-light` | ✅ |
| 8 | `/smokecraft/cut-toast-light` | `/smokecraft/first-third` | `/smokecraft/first-third` | ✅ |
| 9 | `/smokecraft/first-third` | `/smokecraft/second-third` | `/smokecraft/second-third` | ✅ |
| 10 | `/smokecraft/second-third` | `/smokecraft/flavor-memory` | `/smokecraft/flavor-memory` | ✅ |
| 11 | `/smokecraft/flavor-memory` | `/smokecraft/final-third` | `/smokecraft/final-third` | ✅ |
| 12 | `/smokecraft/final-third` | `/smokecraft/scorecard` | `/smokecraft/scorecard` | ✅ |
| 13 | `/smokecraft/scorecard` | `/smokecraft/passport-stamp` | `/smokecraft/passport-stamp` | ✅ |
| 14 | `/smokecraft/passport-stamp` | `/smokecraft/connections` | `/smokecraft/connections` | ✅ |
| 15 | `/smokecraft/connections` | `/smokecraft/management-sync` | `/smokecraft/management-sync` | ✅ |
| 16 | `/smokecraft/management-sync` | `/smokecraft/session-complete` | `/smokecraft/session-complete` | ✅ |

---

## I. Build Result

```
✓ built in 8.26s
```

---

## J. Proof Files

```
public/proof/smokecraft-overlay-phase-2d-core-sequence-repair/normal/*.png  (8 files)
public/proof/smokecraft-overlay-phase-2d-core-sequence-repair/debug/*-debug.png  (8 files)
public/proof/smokecraft-overlay-phase-2d-core-sequence-repair/strict-dom-results.json
public/proof/smokecraft-overlay-phase-2d-core-sequence-repair/navigation-click-results.json
public/proof/smokecraft-overlay-phase-2d-core-sequence-repair/e2e-path-results.json
```

---

## K. Remaining Issues

- `FlavorMemory.jsx` still uses `smokecraft-flavor-memory.png`. If a dedicated asset is not approved yet, this may be a placeholder. Do not change image in Phase 2D per Phase 2C guidance.
- Optional side paths (origins, flavor-dna, pairing, terroir, pairing-mastery, vitola, event-challenge, leaderboard, golden-box/status) remain without hotspots per Phase 2C classification. These are not part of the MVP core journey.
- ComingSoon conflict on terroir, pairing-mastery, vitola still unresolved — not addressed in Phase 2D.
