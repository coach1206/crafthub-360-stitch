# SmokeCraft Entry Sequence, CraftHub Destination & Passport Back — Final Report

**Starting commit:** `3efbba9ea9f36176c6fb59ec87c30c218d7eecc6` (branch `recovery/smokecraft-codex-final`, local == remote, clean tree)

**Scope:** Start/Resume entry-sequence routing, CraftHub destination routing, one Back button on Passport. Nothing else.

**Hard-locked and verified untouched:** `src/pages/smokecraft/RewardsCenter.jsx`, `src/pages/smokecraft/Leaderboard.jsx`, every file under `public/assets/smokecraft/**`, `VISIT_STRUCTURE` in `src/constants/session.js`.

---

## 1. Root cause — verified in a real browser BEFORE fixing

The bug report ("START SMOKECRAFT JOURNEY opens the Guest Pass screen immediately, regardless of the user's real journey state") was **confirmed as stated for every user still in the entry layer**, not merely as an edge case.

Evidence was captured against a production build of the *pre-fix* source (`src/` stashed at `3efbba9`), driving the real Landing button with Playwright in a fresh browser context per scenario. Raw output is in `public/proof/smokecraft-entry-sequence-and-crafthub/00-PREFIX-defect-evidence.json` with matching screenshots (`00-PREFIX-defect-*.png`):

| Seeded starting state | CTA label shown | Route after clicking it | Journey after click |
|---|---|---|---|
| nothing (brand-new user) | START SMOKECRAFT JOURNEY → | `/smokecraft/enroll` | `[]` |
| **Guest Pass completed** (`['enroll']`) | START SMOKECRAFT JOURNEY → | **`/smokecraft/enroll`** | `['enroll']` |
| **Guest Pass + Venue completed** | START SMOKECRAFT JOURNEY → | **`/smokecraft/enroll`** | `['enroll']`, **venue wiped** |
| Guest Pass + Venue + S1 complete | RESUME SMOKECRAFT JOURNEY → | `/smokecraft/resume` | preserved |

### The exact hardcoding

Two independent faults compounded, both in `src/constants/smokecraftLandingActions.js`:

1. **`case A.START` returned a literal.** It returned `SMOKECRAFT_ENROLLMENT_ROUTE` (`'/smokecraft/enroll'` — the Guest Pass screen) unconditionally, for every user, with no reference to journey state at all.

2. **`getPrimaryActionId()` almost never chose RESUME.** It selected RESUME only when `journeyState.isReturning`, and `isReturning` required `getEntryRoute() === '/smokecraft/resume'` **and** `hasRealJourneyProgress()`. `hasRealJourneyProgress()` delegates to `computeJourneyStatus(...).hasStarted`, which is true only once **at least one of the 27 sessions is complete**. So *every* user in the entry layer — including one who had just completed Guest Pass, and one who had completed Guest Pass *and* Venue Selection — fell through to START.

Because START also carried `startsNewJourney: true`, each such click additionally ran the canonical journey reset, destroying the venue selection the user had just made. That is why the third row above shows the venue wiped: the defect was not only a wrong destination, it was **silent data loss on the primary CTA**.

`case A.START_NEW` carried the same literal, so an already-enrolled account that chose "Start New Journey" was also sent back through Guest Pass even though the reset explicitly preserves the `enroll` step (`PRESERVED_COMPLETED_STEP_IDS`).

---

## 2. The fix — one canonical entry resolver

**Path:** `src/constants/smokecraftLandingActions.js` → `resolveSmokeCraftEntryDestination(journeyState)`

It was placed alongside `resolveSmokeCraftLandingAction` rather than in a new file, because the action resolver is the only caller and a separate module would have created a second entry-resolution system competing with the existing authorities. It **orchestrates** the existing canonical functions and reimplements none of them:

- `getSmokeCraftEntryReadiness(session, journey)` — decides whether the entry requirements (enrollment, venue) are met and which is the first incomplete one, and supplies its route.
- `computeJourneyStatus(completedSteps)` — supplies how far into the 27-session spine the user is, under its contiguous-prefix rule, so "earliest incomplete session" is simply `completedSessionCount + 1`.
- `getSessionByNumber(n)` — maps that number back to its real route.

Decision order: unmet entry requirement wins; otherwise the earliest incomplete session; a fully complete journey resolves to `/smokecraft/resume`.

Supporting changes, all minimal:

- `getSmokeCraftLandingJourneyState()` now also exposes the raw session/journey stores and the readiness result, and defines `hasActiveJourney` as `hasStarted || enrollmentComplete`. Treating an enrolled-but-session-zero user as brand-new was the precise reason RESUME was never reached.
- `case A.START` and `case A.RESUME` both return `resolveSmokeCraftEntryDestination(...)`'s route. `startsNewJourney` on START is now `!journeyState.hasActiveJourney`, so the destructive reset only fires when there is genuinely no journey to preserve.
- `case A.START_NEW` routes to `/smokecraft/venue-select` for an already-enrolled account (the first genuinely incomplete requirement *after* the reset, which preserves `enroll`), and to `/smokecraft/enroll` only for an account that never enrolled.
- `getPrimaryActionId()` returns `START_NEW` for a completed journey, `RESUME` for an active one, `START` otherwise.
- `src/pages/SmokeCraft.jsx` — `handleStart()` now honours the resolved action's `requiresConfirmation`, so the completed-journey primary CTA opens the confirm dialog instead of resetting straight through. No route string was added to the component.

### Disclosed architectural note — Identity

The mandate lists Identity between Guest Pass and Venue. In the real, already-approved architecture `/smokecraft/identity` is guarded `requires="entry"` — i.e. it sits *after* Session 1, not before it — and `getSmokeCraftEntryReadiness` already derives `identityComplete === enrollmentComplete` because Identity is a dashboard reachable once enrolled, not a gate with its own completion flag. This is a pre-existing disclosed finding from the entry-prerequisite-remediation pass, carried forward unchanged rather than silently restructured. The resolver therefore follows the real sequence: **Guest Pass → (Identity satisfied by enrollment) → Venue Selection → Welcome, which *is* Session 1** (`/smokecraft/welcome` renders `screenId="session-1"` behind `sessionNumber={1}`).

---

## 3. Verified entry results (post-fix, live)

| Scenario | Result |
|---|---|
| Brand-new user | `START SMOKECRAFT JOURNEY →` → `/smokecraft/enroll` (Guest Pass, once) |
| Guest Pass completed | `RESUME SMOKECRAFT JOURNEY →` → `/smokecraft/venue-select` — never Guest Pass again |
| Refresh after enrollment | stays at `/smokecraft/venue-select` |
| Second Start click after enrollment | `/smokecraft/venue-select` — no loop back |
| Guest Pass + Venue completed | `/smokecraft/welcome` (= Session 1) |
| Guest Pass + Venue + S1 complete | RESUME → `/smokecraft/humidor-match` (S2, earliest incomplete) |
| Resume side effects | `completedSteps` still `['enroll','entry']` — no enrollment restart, no reset |
| Start New (enrolled) | → `/smokecraft/venue-select`; `['enroll']` preserved, `entry` cleared, `previousCompletedJourneys` retained |

---

## 4. CraftHub

**Old route found:** the Landing CRAFTHUB tile historically navigated to `/smokecraft/smokecraft-challenge`, a `requires="scorecard"`-guarded curriculum screen that bounced users to enroll. A prior pass ("Approved Asset Control Plane") introduced `SmokeCraftCraftHub.jsx` at `/smokecraft/crafthub`; **that wiring was verified live this pass and is genuinely correct today** — it had not regressed.

**Route consolidation:** `src/App.jsx` was grepped case-insensitively for every `crafthub` route. Within the SmokeCraft namespace there is exactly **one** — `<Route path="crafthub" element={<SmokeCraftCraftHub />} />` — and the new suite asserts that count stays at one. The remaining matches (`/crafthub`, `/crafthub/dashboard`, `/crafthub/onboarding`, and the `craft-hub` / `craft-modules` / `dashboard` redirects) belong to the unrelated top-level CraftHub product module, not to the SmokeCraft CraftHub destination; they are not aliases of it and were deliberately left alone as out of scope.

**Corrected destination and behaviour (all live-verified):** `/smokecraft/crafthub`, rendering the approved `CRAFTHUB 360. VENUE TABLE EXPERIENCE.png`. It does not route to Identity, Welcome, or Guest Pass; shows no "Greg Guy" or stale learner data; and leaves `completedSteps` and the selected venue byte-identical across entry and exit — it mutates no journey state at all.

**CraftHub Back — the one behavioural fix:** it previously hardcoded `navigate('/smokecraft')`, so it did not return to the prior screen when the user arrived from elsewhere. It now uses the app's established pattern (`window.history.length > 1 ? navigate(-1) : navigate('/smokecraft')`, as in `VenueOwnerDemo`, `EATCommand`, `KioskSetup`). Verified: entering CraftHub from Landing and pressing Back returns to `/smokecraft`.

---

## 5. Passport Back

The live Passport screen is `src/pages/smokecraft/SmokeCraftPassport.jsx` at `/smokecraft/passport` (distinct from the unrelated top-level `/passport` module and from the session-23 `passport-stamp` curriculum screen).

The approved image and layout are **unchanged**. The only edit is the single Back control: the previous fully transparent, invisible hotspot — positioned over the artwork's "FULL GUIDE →" affordance and hardcoded to `/smokecraft` — was replaced in place by **one** visible premium gold-outline pill in the artwork's empty top-left margin. Exactly one Back control exists on the screen; nothing was added beyond it.

It is a real `<button>`, so Enter and Space activate it natively; it has an explicit gold focus ring, hover and pointer-down states, and calls `triggerHaptic('light')`. It returns to the exact prior route when history exists and `/smokecraft` otherwise, mutates no journey or Passport state, and never targets Guest Pass. Live-verified: measured at 136.8 × 43.3 px, visible, and returning to `/smokecraft` **via keyboard Enter**.

---

## 6. Locked-screen and asset confirmation

- `git diff --stat -- src/pages/smokecraft/RewardsCenter.jsx` → empty. SHA-256 identical to `3efbba9`: `9e1ae9846cf1…`
- `git diff --stat -- src/pages/smokecraft/Leaderboard.jsx` → empty. SHA-256 identical to `3efbba9`: `3fa116286526…`
- `git diff --name-status 3efbba9 -- public/assets/smokecraft` → empty; `git status --porcelain -- public/assets/smokecraft` → empty. No approved asset changed, renamed, deleted, replaced, or newly created.
- `git diff --stat -- src/constants/session.js` → empty. 6-phase / 27-session structure intact.

All four are enforced as assertions inside the new suite, not merely asserted here.

---

## 7. Regression matrix (exact, honest counts)

| Suite | Result |
|---|---|
| **verify-smokecraft-entry-sequence-and-crafthub.mjs** (new) | **33 / 33** |
| verify-smokecraft-canonical-runtime.mjs | 19 / 19 |
| verify-smokecraft-canonical-journey-authority.mjs | 25 / 25 *(2 assertions amended — see below)* |
| verify-smokecraft-approved-landing-control-plane.mjs | 62 / 62 |
| verify-smokecraft-zero-legacy-runtime.mjs | 9 / 9 |
| verify-smokecraft-zero-old-visuals.mjs | 20 / 20 |
| verify-smokecraft-entry-prerequisite-guard.mjs | 43 / 43 |
| verify-smokecraft-clean-start-entry-flow.mjs | 52 passed, 2 failed, 1 blocked (of 55) — **both failures pre-existing at `3efbba9`** |
| verify-smokecraft-27-session-sequence.mjs | 39 / 39 |
| verify-passport-security-unified-identity.mjs | 59 / 59 |
| Production build | PASS |
| Production startup + health | PASS — `{"success":true,"status":"ok","db":"postgres"}` |

### The two amended assertions (disclosed, not weakened)

`verify-smokecraft-canonical-journey-authority.mjs` seeds an **enrolled** guest (`completedSteps: ['enroll']`) and previously asserted (a) the Landing shows `START SMOKECRAFT JOURNEY` and no RESUME, and (b) Start New routes to `/smokecraft/enroll`. Both encode precisely the behaviour this pass was mandated to remove — showing START to an already-enrolled user is what sent them back through Guest Pass and wiped their journey. They now assert the corrected contract (RESUME shown and START absent; Start New → `/smokecraft/venue-select`). Each still asserts an exact CTA and an exact route with the same strictness, including the original "never directly to Welcome" clause. Both carry inline `AMENDED —` comments explaining why.

### The two pre-existing failures (not caused by this pass)

`verify-smokecraft-clean-start-entry-flow.mjs` lines 99–100 grep **`src/pages/SmokeCraft.jsx`** for `guestStepDone('enroll')` and `'/smokecraft/venue-select'`. That logic was moved out of the component into `src/constants/smokecraftLandingCta.js` by an earlier pass, so the greps target the wrong file. Confirmed pre-existing: `git show 3efbba9:src/pages/SmokeCraft.jsx` contains neither string, so the baseline for this suite was already 52/55, not the 54/55 recorded in the mandate. Left untouched as out of scope; the underlying behaviour is positively verified by `verify-smokecraft-entry-prerequisite-guard.mjs` (43/43) and by the new suite.

---

## 8. Rollback plan

Every change is confined to four source files, one amended suite, one new suite, and proof/docs. To roll back completely:

```
git revert <this commit>
npm run build
```

For a partial rollback, the entry-sequence fix is fully contained in `src/constants/smokecraftLandingActions.js` plus the `handleStart` change in `src/pages/SmokeCraft.jsx`; restoring both files to their `3efbba9` versions restores the prior behaviour exactly, with no schema, storage-format, backend, asset, or route-table migration to undo. `resolveSmokeCraftEntryDestination` is additive — nothing outside this file calls it — and the CraftHub and Passport Back changes are independent one-function edits that can each be reverted alone.

No storage keys, journey schema versions, session ids, routes, or approved assets were added, removed, or renamed, so no forward or backward data migration is involved in either direction.

---

**PASS — SMOKECRAFT NOW FOLLOWS THE CORRECT ENTRY SEQUENCE, CRAFTHUB ROUTES CORRECTLY, AND PASSPORT HAS A WORKING BACK BUTTON**
