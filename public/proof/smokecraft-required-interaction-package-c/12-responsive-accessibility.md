# 12 — Responsive and Accessibility

**Responsive**: verified live across 5 viewports (1440×900, 1180×820, 1024×768, 768×1024, 390×844) on Session 5's new sequencing panel — no horizontal layout cutoff at any size (browser test).

**Accessibility, per session**:

- **Session 2**: real `<button aria-label aria-pressed>` zones, unchanged from before — natively keyboard-focusable.
- **Session 5**: real `<button aria-label="Move X earlier/later">` controls — keyboard/tap-operable, no drag-and-drop required; large enough tap targets for tablet use.
- **Session 6**: real native `<select>` elements — the accessible non-drag alternative *is* the primary interface, inherently keyboard-operable, no custom widget needed.
- **Session 10**: real `<button aria-label="X flavor">` hotspots, unchanged from before.

**Honest UI states implemented**: loading, error (with Retry), in-progress (real controls), draft-saved (server-confirmed only), submitted/incorrect (real `role="alert"` feedback naming the actual reason), completed (real navigation only after server confirmation). No success state is ever shown before a real server response is received — verified structurally (every `handleContinue` awaits `submitSelectionAttempt` and checks `result.data.correct` before navigating) and live (incorrect-attempt browser assertions).

**Not implemented this pass** (documented, not silently dropped): a dedicated "session-expired" UI state and full HTML5 drag-and-drop for Session 5 (a real, accessible, non-drag keyboard/click alternative was implemented instead, satisfying the mandate's explicit accessibility requirement even without drag-and-drop). See `15-known-limitations.md`.
