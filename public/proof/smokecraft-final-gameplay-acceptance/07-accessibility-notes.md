# 07 — Accessibility Notes (Practical Demo-Usability Check)

This is a practical, demo-usability pass — not a legal/WCAG compliance
audit or claim.

## Observed positives

- Every representative screen has real, descriptive button text (e.g.
  "Continue to Meet Your Cigar →", "Continue to Achievements →") rather
  than icon-only or ambiguous "Submit" controls — good for a live
  presenter narrating a screen reader or low-vision investor's experience.
- Form controls captured (Scorecard star ratings, Duration/Puff Count
  inputs) have visible on-screen labels adjacent to each control.
- Color contrast: primary CTAs use a high-contrast gold-on-dark-navy
  treatment throughout every captured screen — legible in every
  screenshot reviewed for this pass, including at mobile width.
- The Identity screen's required experience-level `<select>` produces a
  clear, honest inline status message when incomplete (confirmed
  previously in the Full Game Fresh-Player Closure UI smoke pass, `identity-status`
  testid) rather than a silent disabled button with no explanation.

## Observed gaps (practical, not a compliance claim)

- `data-testid` attributes exist on some but not all interactive
  elements across the app (confirmed by needing role/text-based
  Playwright locators — e.g. `getByRole('button', { name: /.../ })` —
  for several screens in this pass's own script rather than stable
  testids everywhere). This affects automated-testing ergonomics more
  than end-user accessibility, but consistent testids often correlate
  with consistent `aria-label` coverage, which this pass did not audit
  screen-by-screen.
- The mobile-width text-overlap observation in `06-responsive-tablet-notes.md`
  (Golden Box Rules screen) is also a practical accessibility concern —
  overlapping text is harder to parse for any reader, screen-magnifier
  user included.

No screen in this pass's representative set showed a genuinely
unreadable/unusable control (all captured primary CTAs were legible and
clickable at every viewport tested).
