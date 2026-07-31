# 11 — Responsive and Accessibility

**Responsive**: verified live across 5 viewports (1440×900, 1180×820, 1024×768, 768×1024, 390×844) on Terroir's checkpoint+synthesis UI — no horizontal layout cutoff at any size.

**Accessibility, all 3 sessions**:

- Checkpoint tabs are real `role="tab"`/`aria-selected` elements, unchanged from the pre-existing UI — natively keyboard-focusable.
- The synthesis pickers are real `role="radiogroup"`/`role="radio"`/`aria-checked` controls — keyboard-operable, large (44px minimum) touch targets.
- Session 15's quiz options are real `<button aria-pressed>` elements, unchanged.
- Completion indicators are never color-only: real ✓/○ glyphs plus text labels ("All terroir sections reviewed" / "N sections remaining").
- No hidden submit button — the `SmokeCraftNavBar` Continue control is always visible, disabled (not hidden) while a submission is in flight.
- Long content scrolls within the existing `main` scroll container, unchanged.
- Checkpoint state and the final synthesis field both remain visible/reachable within the same scrollable area — no separate modal or hidden step.

**Honest UI states implemented**: loading, error (with Retry), checkpoint-incomplete rejection, missing-synthesis rejection, incorrect-attempt feedback (with real distinguishing text per failure reason), completed (navigation only after server confirmation). No success is ever shown before a real server response.
