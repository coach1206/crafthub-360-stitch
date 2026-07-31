# Completion-Persistence Proof

Completion continues to use the exact same path established in the original Package A pass — `submitTastingObservation()` (real evidence) followed by `completeSession()` (gated on that evidence, server-owned XP) — entirely unchanged by this draft-persistence correction.

What this correction adds on top: once a session is completed, its draft becomes read-only — any further `PUT` to that session's draft is rejected with `409 already_completed` (see proof 08), so a stale in-flight draft save (from a slow network, a stray tab, or a leftover debounce timer) can never silently revert or corrupt the completed record.

Verified live (`verify-smokecraft-package-a-draft-correction-browser.mjs`): Session 8 completes, navigates to the real next step, XP total is confirmed `> 0`, a stale draft write attempt is denied with `409`, and a final re-read confirms XP is unchanged (no duplicate award from the denied attempt or from revisiting the route).
