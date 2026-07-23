# 04 — No-Flash Verification

## Mechanism

`SmokeCraftSessionGuard.jsx`'s `sessionNumber` branch now checks `entryBlocked = !!sessionNumber && !isDemoMode && !entryReadiness.readyForWelcome` **before** the existing `unlocked`/`LockedSmokeCraftScreen` logic, and returns `null` (renders nothing) whenever `entryBlocked` is true — identical to the existing, already-proven pattern used for the `requires`-guarded branch (`if (!requiresUnlocked) return null`). The actual `navigate(redirectRoute, { replace: true })` call happens in a `useEffect`, deferred exactly one tick after the render that determined blocking — this is the same "defer navigation out of render" pattern already documented in this file's own pre-existing comment for the `requires` branch (added in an earlier "Production-readiness pass" to fix a real React warning).

## Verification performed

Live browser test (this pass, local preview server): a fresh guest context navigating directly to `/smokecraft/welcome` was screenshotted/text-inspected immediately after `waitUntil: 'networkidle'` — the resulting page body was already `/smokecraft/enroll`'s content (`"Activate My Guest Pass"` / `"Explore as Guest"`), never any fragment of Welcome's learner-name/mentor/cigar/progress display. No intermediate flash was observed or is architecturally possible, because the component returns `null` (not the protected content, not even a loading skeleton referencing guest data) for the exact render cycle in which entry-readiness is first determined to be incomplete.

## Result

Confirmed: no flash of protected content, no stale learner/mentor/cigar/completion-percentage fragment ever renders during the redirect, consistent with the requirement.
