# Holistic Fix 2E-6 — Proof Index

Starting commit: `6fd149e4`

## What this proof directory covers

1. **SC-D014 — genuinely closed.** Root-caused via source read
   (`server/middleware/smokecraftGuestIdentity.js`,
   `src/hooks/useSmokeCraftServerJourney.js`, `WelcomeExperience.jsx`): the
   guest-identity cookie is only issued when Session 1 (Welcome) mounts. A
   real player always visits Session 1 first, so the cookie is always
   present by the time Flavor Memory's backend-dependent Continue runs.
   The original SC-D014 finding was a test-harness gap (an earlier ad hoc
   test skipped visiting Welcome), not a real product defect. Verified live:
   visited `/smokecraft/welcome` first, confirmed the
   `smokecraft_guest_session` cookie via `context.cookies()`, then clicked a
   real flavor selection and Continue on Flavor Memory — advanced correctly
   to Session 11 (Pairing Lab). This is now a permanent regression test
   (section "SC-D014 regression" in
   `verify-smokecraft-hf2e5-curriculum-forward-backward.mjs`, 10/10 passing).
   See `01-sc-d014-fix-and-regression-test.txt`.

2. **Educational-content enrichment — attempted, tested, reverted (not
   shipped broken).** Built a centralized fix (18 sessions' worth of real,
   lesson-specific "Why It Matters" and "Golden Box relevance" copy,
   injected via `SmokeCraftScreenRenderer.jsx`), then verified it live with
   real screenshots before trusting it — the verification step this
   operation has always required. Found a real, reproducible visual defect:
   several session components (`Terroir.jsx`, `HumidorMatch.jsx`, at least)
   already render their own phase/session indicator at the exact same
   top-of-viewport position, so the new banner overlapped/duplicated
   existing content rather than filling a real gap. Reverted the renderer
   change rather than ship a confirmed regression. The prepared content
   itself was kept (`src/constants/smokecraftEducationalEnrichment.js`,
   currently unreferenced, clearly marked as prepared-but-not-wired) for a
   future per-file integration pass. See `02-enrichment-attempt-and-revert.png`
   (the Terroir overlap screenshot that triggered the revert) and
   `03-enrichment-attempt-clean-session2.png` (the one session where the
   banner rendered cleanly, for contrast).

## What this proof directory does NOT cover (explicit gaps, not silently omitted)

- **Golden Box relevance and Why It Matters gaps are NOT fixed.** The
  centralized fix attempt was reverted after finding a real regression; no
  safe per-file alternative was built in the remaining time this pass. All
  four originally-disclosed gaps from Holistic Fix 2E-5 remain open:
  Golden Box relevance, 11 missing lesson titles, Why It Matters coverage,
  and (now resolved) SC-D014.
- **No full click-test of every quiz/slider/card/mentor control across all
  27 sessions was performed** — only the specific controls needed to
  verify SC-D014 (a flavor selection + Continue) were clicked this pass.
- **Educational audit was NOT updated with PASS/FAIL for every criterion**
  — the existing Holistic Fix 2E-5 audit (P/F/I per session per criterion)
  is unchanged; no session moved from I/F to a confirmed P this pass.
- **No new build-blocking validation was added** for lesson-title/Golden-Box/
  Why-It-Matters disappearance, since no such content was actually shipped
  to lock in place. The SC-D014 regression test is the one genuinely new,
  real, build-relevant safeguard from this pass.
