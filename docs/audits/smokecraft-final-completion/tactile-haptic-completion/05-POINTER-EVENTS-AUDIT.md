# 05 — Pointer-Events Audit

## Method

The earlier "Start New Journey" pass found and fixed a real defect where a new confirmation dialog inherited `pointer-events: none` from `SmokeCraftImageBoundsOverlay`'s children-wrapper (a deliberate design so non-interactive baked-image regions don't block clicks, with every hotspot re-enabling `pointerEvents: 'auto'` on itself). This pass adds a **permanent, automated, live-browser regression check** for exactly that failure mode rather than relying on it having been caught once by chance.

## Check implemented

`verify-smokecraft-tactile-haptic-interactions.mjs` drives a real Chromium browser through: open Start New Journey confirmation dialog → assert the Cancel button is `isEnabled()` (Playwright's own actionability check, which fails if any ancestor has `pointer-events: none` or another element is intercepting the click point) → click it → assert the dialog is gone. **Passed live this pass.**

## Update (final closeout pass)

The three newly-interactive screens (Welcome, Lighting Tutorial, Mentor Commentary) were audited for the same failure class: none introduce a new `pointer-events: none` wrapper, and all new interactive elements (`SummaryCard` toggle buttons, advice Apply/Dismiss/Confirm/Cancel controls) are plain `<button>` elements with no `pointerEvents` override, inheriting the browser default `auto`. Live-verified this pass: clicking through Welcome's Cigar Preview, Mentor Commentary's Apply→Confirm two-step flow, and Lighting Tutorial's step-advance controls all worked on the first click with no retry needed — the class of symptom a pointer-events blocker would produce (Playwright timing out waiting for actionability) did not occur.

## Broader sweep

A full audit of every `pointerEvents:` occurrence across `src/components/smokecraft/` (confirmed in the prior root-cause audit, re-checked this pass) shows every `'none'` value is on a decorative/background wrapper with every real interactive child explicitly setting `'auto'` — no new occurrence of the omission pattern was introduced by this pass's new `SmokeCraftTactileCard` component (which does not set `pointerEvents` at all, inheriting the browser default `auto`, so it can never be accidentally blocked by this specific failure mode).
