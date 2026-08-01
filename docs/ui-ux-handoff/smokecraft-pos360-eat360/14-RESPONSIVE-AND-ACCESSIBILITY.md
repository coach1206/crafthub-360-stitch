# 14 — Responsive and Accessibility Requirements

## Proven, real responsive/accessibility behavior (Venue Humidor Media Management)

From `public/proof/smokecraft-venue-humidor-media-management/13-responsive-and-accessibility.md`:

- Every media asset carries real stored `width`/`height` metadata;
  `buildResponsiveVariants()` derives thumbnail/browseCard/tablet/desktop
  buckets from real aspect ratio so consuming screens can reserve a
  stable aspect-ratio box (no layout shift) — **though the underlying
  bytes served are not yet actually resized**, only the display box is
  size-constrained (known limitation, not fixed).
- `<img>` tags use `object-fit: cover` in a fixed-aspect-ratio box, with
  an `onError` handler that hides the broken element rather than
  crashing layout — proven live.
- 0 horizontal overflow verified at tablet (1280×800) and mobile portrait
  (390×844) on the admin media screen.
- Every form control has a real `aria-label`/`<label>` (Venue ID, Product
  ID, Choose image file, Image purpose, Source declaration, Alt text,
  Rights reference) — proven via Playwright `getByLabel()` locators
  actually finding and interacting with controls.
- Alt text is a required, server-stored metadata field, surfaced both in
  the admin form and the public API response.
- Keyboard navigation (Tab order) proven live for the alt-text field and
  onward.
- One disclosed a11y gap: rejection reason uses a native browser
  `prompt()` rather than a styled in-page modal — functionally
  accessible (native dialogs are keyboard/screen-reader supported
  already) but visually inconsistent; flagged for a follow-up pass, not
  fixed here.

## Real, disclosed responsive defect pattern (SmokeCraft core, carried forward — not fixed by this pass)

From `public/proof/smokecraft-final-gameplay-acceptance/06-responsive-tablet-notes.md`:

- **Mobile/tablet letterboxing**: across every tablet (834×1194) and
  mobile (390×844) capture, the shared `SmokeCraftScreenShell` renders a
  fixed, roughly desktop-proportioned "device card" centered in the real
  viewport with substantial black margin above/below/beside it — not a
  full-bleed responsive reflow. Text stays legible and every primary
  control (Back/Continue/etc.) remains present and clickable. This is a
  **consistent, intentional-looking presentation choice**, not a crash,
  but is disclosed as a real UX limitation requiring an app-wide
  breakpoint redesign to fix (out of scope for small, targeted passes).
- **Golden Box Rules screen text overlap** (real, found, not fixed): at
  mobile width (390px), the "I have read, understood, and agree..."
  checkbox label visibly overlaps the "YOUR JOURNEY / 0 XP" badge and
  "Quick Rule Reminders" icon row — a genuine text collision. At tablet
  width (834px), the same screen shows **two content sections rendering
  as empty black boxes** — likely below-the-fold panels or an image/
  media block that failed to size at that width. Visible in
  `screenshots/tablet/11-golden-box-build.png` and
  `screenshots/mobile/11-golden-box-build.png` from that proof package
  (also present in `docs/ui-ux-handoff/smokecraft-pos360-eat360/screenshots/smokecraft/`
  where copied). **Top candidate for the next visual-acceptance pass.**
- No captured screen showed a primary control obstructed by a fixed
  bottom nav bar.

## POS360/E.A.T. responsive/accessibility posture [SPEC / unverified]

No proof package tests responsive or accessibility behavior for `/pos3/*`
or `/eat/*` screens. What is known from source:
- `CommandAppShell.jsx`'s `BIG_BTN` standard (min-height 56px) and
  `NAV_BTN_HEIGHT` (44px) both meet or exceed the WCAG 2.1 minimum
  44×44px touch target — a good sign for tablet/kiosk use, but untested
  in a real browser per this pass.
- The shell's 3-column CSS grid (`220px minmax(0,1fr) 380px`) has no
  documented narrow-viewport (phone) fallback in the source read — POS360
  and E.A.T. 360 both appear designed primarily for tablet/desktop kiosk
  use, consistent with their staff/management audience, but a developer
  should not assume phone-width support exists until verified.

## Requirements for new work in this platform

1. **Never serve full-resolution originals to small display contexts**
   without at least the existing aspect-ratio-box pattern from Venue
   Humidor Media Management — reuse `buildResponsiveVariants()`'s
   metadata contract rather than inventing a new one.
2. **Every interactive control needs a real accessible name** — label,
   aria-label, or aria-labelledby — matching the proven Venue Humidor
   Media Management standard. No icon-only buttons without one.
3. **Minimum touch target 44×44px** on any staff/kiosk-facing control
   (matches existing `NAV_BTN_HEIGHT` convention).
4. **`onError` fallback required on every `<img>`** — hide gracefully,
   never a broken-image icon or layout crash.
5. **Do not silently "fix" the SmokeCraft letterboxing pattern** as a
   side effect of unrelated work — it is a deliberate scope boundary
   from a prior pass, not an oversight; any change to
   `SmokeCraftScreenShell`'s breakpoints is a dedicated redesign project.
6. **Do fix genuine text-collision/empty-box defects** like the Golden
   Box Rules screen issue when encountered — that is a real, disclosed,
   unfixed defect, not an intentional design.
7. Replace native `prompt()`/`confirm()` dialogs with styled, accessible
   in-page modals wherever a UI is otherwise brand-styled (the media
   rejection-reason `prompt()` is the known example).
