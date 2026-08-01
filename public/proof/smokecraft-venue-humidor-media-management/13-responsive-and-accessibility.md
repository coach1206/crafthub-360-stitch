# Responsive Delivery and Accessibility

## Responsive delivery

- Every media asset carries real, stored `width`/`height` metadata
  (parsed from the actual file header, not guessed) and
  `mediaService.js#buildResponsiveVariants()` derives
  thumbnail/browseCard/tablet/desktop width/height buckets from the
  real aspect ratio — giving every consuming screen a stable
  aspect-ratio container to avoid layout shift (mandate requirement).
- The admin gallery/library `<img>` tags use `object-fit: cover`
  inside a fixed-aspect-ratio box, and every `<img>` has an `onError`
  handler that hides the broken element rather than showing a broken-
  image icon or crashing the layout — proven live in the browser test
  ("Broken-image element does not crash the page").
- No full-resolution original is served to a small card in this pass's
  UI (the admin library thumbnails render at a fixed 96px/220px CSS
  box) — though see Known Limitation #2: the underlying bytes served
  are not yet actually resized by a real transform pipeline, only the
  *display* box is size-constrained.
- Verified with 0 horizontal overflow at tablet (1280×800) and mobile
  portrait (390×844) on the new admin media screen —
  `05-browser-test-results.txt`.
- The new `/smokecraft/admin/humidor/media` route was included in the
  full 131-route, 5-viewport system-wide responsive-regression sweep
  (`scripts/validateSmokecraftResponsive.mjs`, backed by
  `verify-smokecraft-hf3-responsive-inventory.mjs`) — see
  `12-build.log` for the real, current result.

## Accessibility

- Every upload/purpose/source-type control has a real `aria-label` or
  associated `<label>` (Venue ID, Product ID, Choose image file, Image
  purpose, Source declaration, Alt text, Rights reference) — proven
  live via Playwright's accessible-name-based `getByLabel()` locators
  actually finding and interacting with each control (not a visual-only
  check).
- Alt text is a first-class, required-by-convention metadata field on
  every uploaded asset (`altText` column, surfaced in both the admin
  upload form and the public API response) — supporting the EN/ES
  live-text requirement's accessibility half (screen-reader text is
  real, server-stored text, not baked into the image).
- Keyboard navigation: the alt-text field is keyboard-focusable and
  `Tab` moves focus to the next real interactive control — proven live
  (`05-browser-test-results.txt`, "Keyboard accessibility" section).
- Rejection reason is collected via a real browser `prompt()` in this
  pass's admin screen (not a custom modal) — functionally accessible
  (native browser dialogs are already keyboard/screen-reader
  supported) but a follow-up pass should replace it with an in-page,
  styled, fully brand-consistent modal for visual polish; documented
  as a known limitation rather than silently left unstated.
