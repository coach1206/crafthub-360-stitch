# SmokeCraft Overlay Phase 2E — Optional/Side Route Audit Report

Report-only. No files modified. No routes touched. No protected files touched.

Baseline: Phase 2D commit `f8b3fc20`, gitignore cleanup `44d29e94`.

---

## A. Current Required Linear Chain (Post Phase 2D)

The confirmed hotspot-wired core journey, derived from VISIT_STRUCTURE and verified by Phase 2D E2E proof:

```
/smokecraft               (Landing — hotspot → /smokecraft/identity)
/smokecraft/enroll        (Session 2 — hotspot → /smokecraft/identity) ← ADDED 2D
/smokecraft/identity      (Session 1 — hotspot → /smokecraft/seed-soil)
/smokecraft/seed-soil     (Session 7 — hotspot → /smokecraft/mentor-selection)
/smokecraft/mentor-selection (Session 4 — hotspot → /smokecraft/golden-box)
/smokecraft/golden-box    (Session 5 — hotspot → /smokecraft/humidor-match)
/smokecraft/humidor-match (Session 9 — hotspot → /smokecraft/request-purchase) ← FIXED 2D
/smokecraft/request-purchase (Session 10 — hotspot → /smokecraft/cut-toast-light) ← ADDED 2D
/smokecraft/cut-toast-light  (Session 11 — hotspot → /smokecraft/first-third)
/smokecraft/first-third   (Session 12 — hotspot → /smokecraft/second-third)
/smokecraft/second-third  (Session 13 — hotspot → /smokecraft/flavor-memory) ← FIXED 2D
/smokecraft/flavor-memory (Session 14 — hotspot → /smokecraft/final-third) ← ADDED 2D
/smokecraft/final-third   (Session 15 — hotspot → /smokecraft/scorecard)
/smokecraft/scorecard     (Session 16 — hotspot → /smokecraft/passport-stamp)
/smokecraft/passport-stamp (Session 21 — hotspot → /smokecraft/connections) ← FIXED 2D
/smokecraft/connections   (Session 22 — hotspot → /smokecraft/management-sync) ← ADDED 2D
/smokecraft/management-sync (Session 23 — hotspot → /smokecraft/session-complete) ← ADDED 2D
/smokecraft/session-complete (Session 24 — hotspot → /pos3)
```

**Note on user-supplied chain vs. actual chain:**
The Phase 2E mission listed `/smokecraft/profile`, `/smokecraft/shape-size`, `/smokecraft/mentor`, `/smokecraft/gold-box-rules` — these are redirect aliases in `App.jsx` (e.g. `/smokecraft/profile` → `/smokecraft/identity`) and are not separate functional routes. The actual routes are as listed above.

**Sessions present in VISIT_STRUCTURE but NOT yet in the linear hotspot chain:**

| Session | ID | Route | Visit |
|---------|-----|-------|-------|
| Session 5 | format | /smokecraft/format | Visit 2 |
| Session 6 | wrapper-strength | /smokecraft/wrapper-strength | Visit 2 |
| Session 8 | pairing-lab | /smokecraft/pairing-lab | Visit 3 |
| Session 17 | smokecraft-challenge | /smokecraft/smokecraft-challenge | Visit 7 |
| Session 18 | second-humidor-match | /smokecraft/second-humidor-match | Visit 7 |
| Session 19 | mini-tasting | /smokecraft/mini-tasting | Visit 7 |
| Session 20 | final-review | /smokecraft/final-review | Visit 8 |

These are Visits 2, 3, 7, and 8 session members currently bypassed in the main hotspot chain. They have div-onClick nav already; they are the next restoration candidates beyond Phase 2D scope.

---

## B. Side/Optional Route Audit Table

### Routes specified in Phase 2E scope

| Route | File | Current Image | Has Hotspot | Should Have Hotspot | Next Route if Yes | Side Effects | In Linear Chain | Touch Risk | Recommendation |
|-------|------|--------------|-------------|---------------------|-------------------|--------------|----------------|------------|----------------|
| `/smokecraft/origins` | `Origins.jsx` | `smokecraft-origins.png` | NO — bare SmokeCraftAssetScreen | NO | N/A | none | NO — standalone/hub | Low | LEAVE STATIC |
| `/smokecraft/flavor-dna` | `FlavorDNA.jsx` | `smokecraft-flavor-dna.png` | NO — bare SmokeCraftAssetScreen | NO | none | NO — hub link | Low | LEAVE STATIC |
| `/smokecraft/pairing` | `Pairing.jsx` | `smokecraft-pairing.png` | NO — bare SmokeCraftAssetScreen | NO | none | NO — Visit 2+ multi-path | Low | LEAVE STATIC |
| `/smokecraft/pairing-lab` | `PairingLab.jsx` | `smokecraft-pairing-lab.png` | NO — div onClick (wraps SmokeCraftAssetScreen) | YES — has side effects, routes to humidor-match | `/smokecraft/humidor-match` | `completeStep('pairing-lab')`, `addXP(75)`, haptic | YES — Session 8, Visit 3 | Medium — has div onClick, needs conversion to SmokeCraftAssetRoute | RESTORE INTO FLOW |
| `/smokecraft/pairing-mastery` | `PairingMastery.jsx` | `smokecraft-pairing-mastery.png` | NO — ComingSoon wrapper with div onClick → `/smokecraft/vitola` | Deferred | `/smokecraft/vitola` | none current | NO — optional side path | HIGH — ComingSoon shared component, div onClick conflict | LEAVE STATIC (ComingSoon conflict — see Section C) |
| `/smokecraft/terroir` | `Terroir.jsx` | `smokecraft-terroir.png` | NO — ComingSoon wrapper with div onClick → `/smokecraft/pairing-mastery` | Deferred | none current | NO — optional side path | HIGH — same ComingSoon conflict | LEAVE STATIC (ComingSoon conflict — see Section C) |
| `/smokecraft/vitola` | `Vitola.jsx` | `smokecraft-vitola.png` | NO — ComingSoon wrapper with div onClick → `/smokecraft/identity` | Deferred | none current | NO — optional side path | HIGH — same ComingSoon conflict | LEAVE STATIC (ComingSoon conflict — see Section C) |
| `/smokecraft/event-challenge` | `EventChallenge.jsx` | `smokecraft-event-challenge.png` | NO — bare SmokeCraftAssetScreen | NO | none | NO — event-triggered, no nav target defined | Low | LEAVE STATIC |
| `/smokecraft/leaderboard` | `Leaderboard.jsx` | `smokecraft-leaderboard.png` | NO — bare SmokeCraftAssetScreen | NO | none | NO — reward/status screen | Low | LEAVE STATIC |
| `/smokecraft/golden-box/status` | `GoldenBoxStatus.jsx` | `smokecraft-golden-box-status.png` | NO — bare SmokeCraftAssetScreen | NO | none | NO — sub-route, golden-box nested | Low | LEAVE STATIC |

---

### Additional side routes found in repo (not listed in Phase 2E scope but present)

| Route | File | Current Image | Has Hotspot | Side Effects | In VISIT_STRUCTURE | Recommendation |
|-------|------|--------------|-------------|--------------|-------------------|----------------|
| `/smokecraft/art` | `Art.jsx` | `smokecraft-art.png` | NO — div onClick → `/smokecraft/mentor` | `addXP(50)`, `addBadge('art-appreciation')`, `completeStep('art')` | NO — not in VISIT_STRUCTURE | NEEDS FUNCTIONAL REVIEW — has side effects but step `art` is not in VISIT_STRUCTURE; currently using div onClick, no approved sequence position |
| `/smokecraft/guest-pass` | `GuestPass.jsx` | `smokecraft-guest-pass.png` | NO — div onClick → `/smokecraft/enroll` | haptic only | NO | ADD HOTSPOT LATER — entry/onboarding screen, no session side effects, good candidate for SmokeCraftAssetRoute conversion |
| `/smokecraft/how-it-works` | `HowItWorks.jsx` | `smokecraft-how-it-works.png` | NO — div onClick → `/smokecraft/enroll` | haptic only | NO | ADD HOTSPOT LATER — onboarding screen, no session side effects, good candidate |
| `/smokecraft/scan` | `Scan.jsx` | `smokecraft-scan.png` | NO — div onClick → `/smokecraft/enroll` | haptic only | NO | ADD HOTSPOT LATER — entry scan screen, same pattern |
| `/smokecraft/smokecraft-challenge` | `SmokeCraftChallenge.jsx` | `smokecraft-challenge.png` | NO — div onClick → `/smokecraft/second-humidor-match` | `completeStep('smokecraft-challenge')`, `addXP(75)`, haptic | YES — Session 17, Visit 7 | RESTORE INTO FLOW — Visit 7 session, has correct side effects, needs SmokeCraftAssetRoute conversion |
| `/smokecraft/second-humidor-match` | `SecondHumidorMatch.jsx` | `smokecraft-second-humidor-match.png` | NO — div onClick → `/smokecraft/mini-tasting` | `completeStep('second-humidor-match')`, `addXP(75)`, haptic | YES — Session 18, Visit 7 | RESTORE INTO FLOW — Visit 7 session |
| `/smokecraft/mini-tasting` | `MiniTastingRound.jsx` | `smokecraft-mini-tasting-round.png` | NO — div onClick → `/smokecraft/final-review` | `completeStep('mini-tasting')`, `addXP(75)`, haptic | YES — Session 19, Visit 7 | RESTORE INTO FLOW — Visit 7 session |
| `/smokecraft/final-review` | `FinalReview.jsx` | `smokecraft-final-review.png` | NO — div onClick → `/smokecraft/passport-stamp` | `completeStep('final-review')`, `addXP(100)`, haptic | YES — Session 20, Visit 8 | RESTORE INTO FLOW — sits between mini-tasting and passport-stamp per VISIT_STRUCTURE; currently bypassed in main chain (scorecard → passport-stamp skips final-review) |
| `/smokecraft/pairing-lab` | `PairingLab.jsx` | `smokecraft-pairing-lab.png` | NO — div onClick → `/smokecraft/humidor-match` | `completeStep('pairing-lab')`, `addXP(75)`, haptic | YES — Session 8, Visit 3 | RESTORE INTO FLOW — sits between seed-soil and humidor-match per VISIT_STRUCTURE; currently bypassed |

---

## C. ComingSoon Conflict — Terroir, PairingMastery, Vitola

These three routes use `ComingSoon.jsx` with a `referenceImage` prop. When `referenceImage` is set, `ComingSoon` renders:

```jsx
<div onClick={() => navigate(nextRoute || prevRoute || '/smokecraft')} role="button" tabIndex={0}>
  <SmokeCraftAssetScreen src={referenceImage} alt={...} />
</div>
```

This means:
1. They already have click-to-navigate behavior via `<div onClick>`.
2. Adding a `SmokeCraftHotspotLayer` on top would create **two competing nav triggers** — the div fires AND the hotspot fires on the same tap.
3. Fixing this requires either converting ComingSoon's `referenceImage` branch to use `SmokeCraftAssetRoute` directly, or replacing the `ComingSoon` wrapper entirely.
4. `ComingSoon.jsx` is a **shared component** used across multiple routes. Modifying its `referenceImage` branch affects all three simultaneously.

**Decision: Do not touch Terroir, PairingMastery, or Vitola until ComingSoon refactor is scoped as a separate work item.**

---

## D. Image Asset Concerns

| Route | Image | Concern |
|-------|-------|---------|
| `/smokecraft/art` | `smokecraft-art.png` | Used but step `art` absent from VISIT_STRUCTURE — unclear if this is a retired route or an unofficial extension |
| All static routes | approved PNGs | No image swap needed — all using `/assets/smokecraft-reference/approved/` paths |

No missing images found. No placeholder images found in the audited routes.

---

## E. Side Effect Concerns

| Route | Side Effects | Risk |
|-------|--------------|------|
| `Art.jsx` | `addXP(50)`, `addBadge('art-appreciation')`, `completeStep('art')` | `art` not in VISIT_STRUCTURE — `completeStep('art')` writes to session but no lockGuard references it; badge `art-appreciation` may be an orphan |
| `PairingLab.jsx` | `completeStep('pairing-lab')`, `addXP(75)` | Session 8 in VISIT_STRUCTURE — safe to restore, side effects correct |
| `SmokeCraftChallenge.jsx` | `completeStep('smokecraft-challenge')`, `addXP(75)` | Session 17 in VISIT_STRUCTURE — safe to restore |
| `SecondHumidorMatch.jsx` | `completeStep('second-humidor-match')`, `addXP(75)` | Session 18 — safe |
| `MiniTastingRound.jsx` | `completeStep('mini-tasting')`, `addXP(75)` | Session 19 — safe |
| `FinalReview.jsx` | `completeStep('final-review')`, `addXP(100)` | Session 20 — safe; NOTE: currently main chain routes `scorecard → passport-stamp`, bypassing `final-review`. Restoring it would require changing Scorecard's hotspot target from `/smokecraft/passport-stamp` to `/smokecraft/final-review`. |

---

## F. Risk Notes

1. **FinalReview insertion risk:** Restoring `/smokecraft/final-review` into the chain requires changing `Scorecard.jsx` hotspot target. Scorecard is a sealed Phase 2B file. The change is minimal (one target string) but touches a previously approved file — needs explicit approval.

2. **PairingLab insertion risk:** Restoring `/smokecraft/pairing-lab` requires changing `SeedSoil.jsx` hotspot target from `/smokecraft/mentor-selection` to `/smokecraft/pairing-lab`. SeedSoil is a sealed Phase 2A file. Same class of change as FinalReview — needs explicit approval.

3. **Visit 7 chain (Sessions 17–19):** SmokeCraftChallenge, SecondHumidorMatch, MiniTastingRound already navigate correctly among themselves via div onClick. No upstream entry point wired to them in the current hotspot chain — nothing routes INTO SmokeCraftChallenge yet. Entry point needs to be defined before these can be restored.

4. **Art.jsx orphan:** Step `art` is not in VISIT_STRUCTURE. `completeStep('art')` writes to session storage but VisitLockGuard will never reference it. The route is reachable but has no defined position in the journey. Do not restore until sequence position is defined.

5. **No protected files at risk:** SmokeCraftAssetScreen, SmokeCraftHotspotLayer, SmokeCraftAssetRoute, DemoBanner, PublicSessionNotice, VisitLockGuard are not involved in any recommended Phase 2E action.

---

## G. Recommended Phase 2E Build Scope

If approved, implement in this order (lowest risk first):

**Batch 1 — Simple static-screen hotspot conversions (div onClick → SmokeCraftAssetRoute, no chain surgery):**
| Route | Convert | Target | Side Effects to Preserve |
|-------|---------|--------|--------------------------|
| `/smokecraft/guest-pass` | div onClick | `/smokecraft/enroll` | haptic |
| `/smokecraft/how-it-works` | div onClick | `/smokecraft/enroll` | haptic |
| `/smokecraft/scan` | div onClick | `/smokecraft/enroll` | haptic |

**Batch 2 — Flow restore requiring upstream chain edit (requires approval of sealed file touch):**
| Route | Upstream File to Edit | Upstream Change | Side Effects to Preserve |
|-------|----------------------|-----------------|--------------------------|
| `/smokecraft/pairing-lab` | `SeedSoil.jsx` (Phase 2A) | target: `/smokecraft/pairing-lab`; PairingLab → `/smokecraft/humidor-match` | `completeStep('pairing-lab')`, `addXP(75)`, haptic |
| `/smokecraft/final-review` | `Scorecard.jsx` (Phase 2B) | target: `/smokecraft/final-review`; FinalReview → `/smokecraft/passport-stamp` | `completeStep('final-review')`, `addXP(100)`, haptic |

**Batch 3 — Visit 7 chain (entry point undefined, scope separately):**
SmokeCraftChallenge, SecondHumidorMatch, MiniTastingRound — already nav-wired among themselves. Need upstream entry point decision before any hotspot work.

**Do not touch:** Terroir, PairingMastery, Vitola (ComingSoon conflict), Art (orphan step), Origins, FlavorDNA, Pairing, EventChallenge, Leaderboard, GoldenBoxStatus.

