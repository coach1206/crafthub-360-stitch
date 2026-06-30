# SmokeCraft Overlay Phase 2C — Side Route Hotspot Map

Classification of remaining SmokeCraft asset routes. Based on source inspection of page files, `src/constants/session.js` VISIT_STRUCTURE (sessions 1–24), and App.jsx routing.

No files were modified in this phase.

---

## A. Remaining Routes Found

Routes without hotspots as of Phase 2B completion:

1. `/smokecraft/enroll`
2. `/smokecraft/origins`
3. `/smokecraft/pairing`
4. `/smokecraft/terroir`
5. `/smokecraft/vitola`
6. `/smokecraft/pairing-mastery`
7. `/smokecraft/event-challenge`
8. `/smokecraft/flavor-dna`
9. `/smokecraft/flavor-memory`
10. `/smokecraft/leaderboard`
11. `/smokecraft/request-purchase`
12. `/smokecraft/connections`
13. `/smokecraft/management-sync`
14. `/smokecraft/golden-box/status`

Routes confirmed with hotspots (from Phase 1, 2A, 2B):
`/smokecraft`, `/smokecraft/identity`, `/smokecraft/session-complete`, `/smokecraft/seed-soil`, `/smokecraft/mentor-selection`, `/smokecraft/golden-box`, `/smokecraft/humidor-match`, `/smokecraft/cut-toast-light`, `/smokecraft/first-third`, `/smokecraft/second-third`, `/smokecraft/final-third`, `/smokecraft/scorecard`, `/smokecraft/passport-stamp`

---

## B. Route Classification Table

| Route | Approved Image | Hotspot Status | Session # | Role | Entry Point | Exit Route | Guest Path |
|-------|---------------|----------------|-----------|------|-------------|-----------|------------|
| `/smokecraft/enroll` | `smokecraft-entry-gate.png` | None | Session 2 | **Core journey** | From `/smokecraft` (identity hotspot) | `/smokecraft/identity` | Main |
| `/smokecraft/request-purchase` | `smokecraft-request-purchase.png` | None | Session 10 | **Core journey** | From `/smokecraft/humidor-match` | `/smokecraft/cut-toast-light` | Main |
| `/smokecraft/connections` | `smokecraft-passport-connection.png` | None | Session 22 | **Core journey** | From `/smokecraft/passport-stamp` | `/smokecraft/management-sync` | Main |
| `/smokecraft/management-sync` | `smokecraft-venue-management-sync.png` | None | Session 23 | **Staff/POS/E.A.T. support** | From `/smokecraft/connections` | `/smokecraft/session-complete` | Main (end of session) |
| `/smokecraft/flavor-memory` | `smokecraft-session-complete.png`* | None | Session 14 | **Core journey** | From `/smokecraft/second-third` | `/smokecraft/final-third` | Main — see Section C |
| `/smokecraft/pairing` | `smokecraft-pairing.png` | None | Visit 2+ list | **Pairing module** | From `/smokecraft/session-complete` or reward hub | `/smokecraft/terroir` or hub | Optional side path |
| `/smokecraft/terroir` | `smokecraft-terroir.png` | None | Session 17 (Visit 5) | **Education module** | From `session-complete` → ComingSoon prevRoute | `/smokecraft/pairing-mastery` | Optional side path |
| `/smokecraft/pairing-mastery` | `smokecraft-pairing-mastery.png` | None | Session 18 (Visit 5) | **Pairing module** | From `/smokecraft/terroir` | `/smokecraft/vitola` | Optional side path |
| `/smokecraft/vitola` | `smokecraft-vitola.png` | None | Session 19 (Visit 5) | **Education module** | From `/smokecraft/pairing-mastery` | `/smokecraft/identity` | Optional side path |
| `/smokecraft/origins` | `smokecraft-origins.png` | None | Visit 2+ list | **Education module** | Standalone / hub link | No current nav target | Optional side path |
| `/smokecraft/flavor-dna` | `smokecraft-flavor-dna.png` | None | Visit 2+ list | **Education module** | Standalone / hub link | No current nav target | Optional side path |
| `/smokecraft/event-challenge` | `smokecraft-event-challenge.png` | None | Unlocked separately | **Event/challenge module** | From venue event trigger | No current nav target | Optional / event-triggered |
| `/smokecraft/leaderboard` | `smokecraft-leaderboard.png` | None | Session list | **Reward/status module** | Hub link / post-session | No current nav target | Optional / accessible from session-complete |
| `/smokecraft/golden-box/status` | `smokecraft-golden-box-status.png` | None | Status screen | **Reward/status module** | From `/smokecraft/golden-box` (nested) | No current nav target | Optional sub-route |

*Note: `FlavorMemory.jsx` uses `SmokeCraftAssetScreen` with `smokecraft-session-complete.png` as its approved image per the visual reset. It has its own `completeStep('flavor-memory')` + `addXP(75)` side effects and internally calls `navigate('/smokecraft/final-third')`.

---

## C. Flavor Memory Recommendation

**Recommendation: Option A — restore it between SecondThird and FinalThird.**

Evidence from source:

1. `src/constants/session.js` VISIT_STRUCTURE places `flavor-memory` at **Session 14**, between `second-third` (Session 13) and `final-third` (Session 15). This is the canonical order.
2. `FlavorMemory.jsx` has its own `completeStep('flavor-memory')` + `addXP(75)` side effects and already calls `navigate('/smokecraft/final-third')` internally — it was always designed as the bridge step.
3. `SecondThird` previously navigated to `/smokecraft/flavor-memory` before Phase 2B changed it to `/smokecraft/final-third` per mission spec. That change skipped Session 14.
4. `VisitLockGuard` wraps `/smokecraft/flavor-memory` with `stepId="flavor-memory"`, meaning the session model expects it to be completed in order.

**Consequence of current state:** Phase 2B's SecondThird hotspot skips Session 14. The session progression model (`arePriorSessionsComplete` in VisitLockGuard) may block FinalThird or later routes if `flavor-memory` is never marked complete. This is a real sequencing risk.

**Recommended action for Phase 2D:**
- Update SecondThird hotspot target from `/smokecraft/final-third` back to `/smokecraft/flavor-memory`
- Add a hotspot to FlavorMemory with `onClick: handleContinue, to: '/smokecraft/final-third'` (preserving `completeStep('flavor-memory')` + `addXP(75)`)
- This restores the correct Session 13 → 14 → 15 order without breaking the visual reset

Do not implement in this phase. Flagging for Phase 2D.

---

## D. Suggested Next Hotspot Batch (Phase 2D)

High priority — these are sequencing fixes and core flow completions:

| Route | Action | Target | Side Effects |
|-------|--------|--------|--------------|
| `SecondThird` | Fix hotspot target | `/smokecraft/flavor-memory` (restore) | existing |
| `FlavorMemory` | Add hotspot + preserve side effects | `/smokecraft/final-third` | `completeStep('flavor-memory')`, `addXP(75)` |
| `/smokecraft/enroll` | Add hotspot | `/smokecraft/identity` | none currently |
| `/smokecraft/request-purchase` | Add hotspot | `/smokecraft/cut-toast-light` | none currently (was wrapped in VisitLockGuard) |
| `/smokecraft/connections` | Add hotspot | `/smokecraft/management-sync` | VisitLockGuard-wrapped |
| `/smokecraft/management-sync` | Add hotspot | `/smokecraft/session-complete` | VisitLockGuard-wrapped |

---

## E. Routes That Should Stay Optional (No MVP Hotspot Yet)

These are side paths, education modules, or event-triggered screens. They should not be wired into the main guest journey chain:

| Route | Reason |
|-------|--------|
| `/smokecraft/origins` | Education module, Visit 2+ only, no clear next step defined |
| `/smokecraft/flavor-dna` | Education module, no current nav chain |
| `/smokecraft/pairing` | Pairing experience, Visit 2+ multi-visit path |
| `/smokecraft/terroir` | ComingSoon wrapper with prevRoute/nextRoute already encoded; do not duplicate with hotspot system yet |
| `/smokecraft/pairing-mastery` | ComingSoon wrapper; same as terroir |
| `/smokecraft/vitola` | ComingSoon wrapper; same as terroir |
| `/smokecraft/event-challenge` | Event-triggered, not part of normal guest flow |
| `/smokecraft/leaderboard` | Reward/status screen, accessible after session-complete |
| `/smokecraft/golden-box/status` | Sub-route status screen, accessible from golden-box only |

---

## F. Routes That Should Not Be Touched Yet

| Route | Reason |
|-------|--------|
| `/smokecraft/terroir` | Uses `ComingSoon` with `<div onClick>` for nav — already has click behavior; converting would require touching ComingSoon which is shared |
| `/smokecraft/pairing-mastery` | Same as terroir |
| `/smokecraft/vitola` | Same as terroir |
| `/smokecraft/event-challenge` | No defined entry or exit in the MVP flow; destination unclear |
| `/smokecraft/leaderboard` | Reward screen — needs a back/return path defined, not a forward continuation |
| `/smokecraft/golden-box/status` | Nested route under golden-box; entry/exit should be scoped separately |

---

## G. Risks

1. **Session sequencing gap (highest priority):** SecondThird now skips `flavor-memory` (Session 14). If `VisitLockGuard` checks prior session completion, any session after Session 14 that requires Session 14 to be complete will be blocked for guests who navigate the current hotspot path. Fix in Phase 2D.

2. **ComingSoon `<div onClick>` conflict:** Terroir, PairingMastery, and Vitola still use `ComingSoon` with a `<div onClick={navigate(nextRoute)}>` wrapper. Adding a hotspot on top would create two competing nav triggers. These routes should be handled by converting ComingSoon itself or left as-is until that is scoped.

3. **RequestPurchase VisitLockGuard:** This route is gated by VisitLockGuard (`stepId="request-purchase"`). In demo mode the lock is bypassed, but in real sessions the guest must have reached this step legitimately. The hotspot placement is safe, but the navigation from HumidorMatch currently goes to CutToastLight (Phase 2A), skipping RequestPurchase. This is also a sequencing gap — HumidorMatch should route to RequestPurchase, not CutToastLight, per Session 10 order.

4. **Connections/ManagementSync VisitLockGuard:** Both are visit-locked. They sit at Sessions 22 and 23, meaning they require all prior sessions complete. The hotspot to these routes will function in demo mode but will be gated in real sessions as intended.

5. **FlavorMemory image:** Currently using `smokecraft-session-complete.png` (same as SessionComplete). This is likely a placeholder. If a dedicated `smokecraft-flavor-memory.png` is approved later, the file should be updated. Do not change the image in Phase 2D — use whatever is currently approved.
