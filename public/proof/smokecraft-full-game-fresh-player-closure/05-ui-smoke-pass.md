# 05 — UI Smoke Pass

Script: `scripts/verify-smokecraft-full-game-ui-smoke.mjs`
Target: `vite preview` production build on `localhost:5050`, real backend on
`localhost:3001`, real Playwright Chromium (headless).

## Purpose

Steps 1-4 of this package prove server-side correctness via direct HTTP
calls. This script proves the **UI layer is not disconnected from that
server truth** — a real browser, driven only by real clicks (no
`localStorage.setItem`, no seeded `completedSteps`, no route-skipping),
reaches and completes Session 1, and after a hard reload still reflects
what the server itself persisted.

## Result: 9 passed, 0 failed

1. `/smokecraft` renders for a genuinely fresh guest (cleared
   localStorage/sessionStorage/cookies first).
2. Real click on **"Explore as Guest"** (Enroll screen) navigates to
   Identity.
3. Real form fill (name, email, required experience-level select) +
   **"Begin My Journey"** click navigates to Venue Selection.
4. Real **"Continue without venue"** + **"Continue to Welcome"** clicks
   reach the real Session 1 screen (Welcome).
5. At least one later-phase sidebar destination is locked/disabled for this
   fresh, Session-1-only guest — later sessions are not all pre-unlocked.
6. Directly visiting a late-journey route (`/smokecraft/session-complete`)
   as this fresh guest does **not** render a spoofed "100% complete" state
   — the route renders honestly for the guest's real (near-zero) progress.
7. Real click on **"Begin Experience"** completes Session 1
   (`awardSessionRewards('entry')` in the live component) and advances the
   journey off the Welcome screen.
8. After a **hard page reload**, the UI still reflects the progressed
   state — it does not reset to a fresh Session 1, proving persistence is
   real (server-backed), not just in-memory React state.
9. A direct `fetch('/api/smokecraft/player-state', { credentials:
   'include' })` call made **from inside the same browser page** (same
   cookie-scoped identity the UI itself used) independently confirms
   Session 1 (`entry`) is marked completed server-side — the UI and the
   API agree because they are reading the same one ledger.

## Fix required to get this test working (test-script fix, not a product defect)

The Identity screen's "Begin My Journey" button is validation-gated on a
required `experience-level` `<select>`; the script initially only filled
the two text inputs and timed out waiting for navigation. This was a gap in
the *test script*, not a product defect — the Identity screen's own status
line (`data-testid="identity-status"`) correctly and honestly reported
"Please select your experience level" the whole time. Fixed by selecting a
real option from `identity-experienceLevel` before clicking Begin.
