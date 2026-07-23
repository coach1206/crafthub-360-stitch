# 03 — Venue Preservation Decision

## Question posed by this pass's mandate

Should a new SmokeCraft journey (A) require the learner to reconfirm Venue Selection, or (B) reuse the account-level active venue while still marking the Venue step honestly complete?

## Answer: (B), and this was already the approved, pre-existing behavior — not silently assumed

`SmokeCraftJourneyContext`'s `startNewJourney()` (unchanged by any pass in this operation) explicitly preserves `selectedVenue`/`venueSelectionCompleted` across a new journey — documented in its own code comment: *"Preserved as-is: identity, selectedVenue, venueSelectionCompleted, lastEntryScreen, rewards, achievements..."* This was disclosed as a deliberate design decision in the prior "Live Remediation: Resume-State Reconciliation" pass's final report, and reused unchanged by `useStartNewSmokeCraftJourney()` in the Clean Start remediation pass.

**This pass's `getSmokeCraftEntryReadiness()` reads venue completion from the canonical, approved venue context** — `journey.selectedVenue`/`journey.venueSelectionCompleted`, the same fields `startNewJourney()` preserves and the same fields `getEntryRoute()` (landing page) already checked before this pass. It does not read from any stale, journey-content-scoped, or client-writable-without-server-basis field — venue selection genuinely happened through the real `/smokecraft/venue-select` screen at some point for that guest, and is legitimately still valid for a returning guest at the same physical venue.

## What this means concretely

A returning guest (same browser, same venue, already selected it in a prior journey) who starts a new journey does **not** have to reselect their venue — `venueComplete` is `true` immediately, and `readyForWelcome` only depends on `enrollmentComplete` at that point. A guest with no prior venue selection (or a genuinely fresh browser) must pass through `/smokecraft/venue-select` before reaching Welcome, exactly as this pass's fix enforces.

This is not a bypass of the fix — venue selection genuinely happened once, through the real screen, and is honestly still valid. It is functionally identical to how enrollment is preserved (`PRESERVED_COMPLETED_STEP_IDS = ['enroll']`) across every journey a guest starts.
