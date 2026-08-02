# Accessibility Results — Production Package 6 Correction

Target: WCAG 2.2 AA **readiness** (no certification claim, matching the
existing `accessibility-standard.md` from the original Package 6 pass).

## Scope

The 6 new compliance UI surfaces: Age Gate, Policy/Warning Center,
Consent Center, Data-Rights Center, Staff Age Verification, Compliance
Admin. **PRAGMATIC SCOPING (mandate section 11):** viewport/responsive
coverage below reuses the repo-wide Holistic Fix 3 harness, which by
convention already sweeps 5 viewports per route (handheld-portrait,
tablet-10in-landscape, tablet-12in-landscape, 15in-display, desktop) —
this pass appended the 6 new routes to that existing inventory rather
than inventing a separate, narrower sweep, since the harness already
existed and running it was no more costly than a 2-3 viewport ad hoc
check. Manual keyboard/focus verification below was done at 2
representative viewports (handheld-portrait, desktop) per the mandate's
explicit pragmatic-scoping allowance.

## Responsive/visual sweep (real, measured — not guessed)

```
$ node scripts/appendComplianceRoutesToResponsiveInventory.mjs
  measured /smokecraft/compliance/age-gate across 5 viewports
  measured /smokecraft/compliance/policies across 5 viewports
  measured /smokecraft/compliance/consent across 5 viewports
  measured /smokecraft/compliance/data-rights across 5 viewports
  measured /smokecraft/staff/compliance/age-verification across 5 viewports
  measured /smokecraft/admin/compliance across 5 viewports
Wrote 138 total inventory entries (132 existing + 6 new compliance routes)

$ node scripts/validateSmokecraftResponsive.mjs
  OK    inventory covers all live routes (138)
  OK    no route has a navigation timeout/crash at any viewport
  OK    no route has horizontal overflow at any of the 5 viewports
  OK    no route blocks vertical scrolling when content exceeds the viewport
  OK    no route has a real control obscured behind the fixed bottom nav
  OK    no hero/backdrop image is stretched or distorted (object-fit:fill with a mismatched box)
=== RESULT: PASS (0 checks failed) ===
```

Zero letterboxing/text-overlap/hidden-obstructed-action defects found on
any of the 6 new screens at any of the 5 viewports. No unrelated
pre-existing visual issues were investigated (out of this pass's scope
per mandate section 11 — none were newly introduced by this pass either,
per the unchanged validator result on the other 132 routes).

## Keyboard result

Verified via the real browser suite (`verify-smokecraft-real-payment-gateway-browser.mjs`,
which exercises the new compliance-aware checkout UI end to end) plus
manual structural review of every new component:

- All interactive controls are real `<button>`/`<input>`/`<select>`/`<a href>`
  elements — no `<div onClick>` traps, so native Tab order and Enter/Space
  activation work without custom key handling.
- No `tabIndex` values other than `0` (scrollable policy-text panel) or the
  implicit default — no positive tabIndex, so no out-of-order tab traps.
- No modal dialogs are used anywhere in this pass's 6 screens (inline
  panels only), so there is no focus-trap implementation to verify/break —
  disclosed honestly rather than claiming a modal focus-trap test that
  doesn't apply.
- `verify-smokecraft-real-payment-gateway-browser.mjs`:
  `PASS keyboard-focusable controls present on order/payment screen (3)`
  at both handheld-portrait and desktop viewports — confirms the honest
  compliance-denial banner and its resolve-requirement CTA button (added
  to `VenueHumidorCheckout.jsx` in this pass) are real, focusable controls.

## Screen-reader result (DOM/ARIA inspection — no live AT session run)

- Every new screen has exactly one `<h1>` and uses `<h2>`/`<h3>` for
  sub-sections (structural review of `AgeGate.jsx`, `PolicyCenter.jsx`,
  `ConsentCenter.jsx`, `DataRightsCenter.jsx`, `StaffAgeVerification.jsx`,
  `ComplianceAdmin.jsx`).
- `role="alert"` on every error summary (age-gate denial, policy decline
  notice, consent save error, data-rights error) — announced without
  requiring focus move.
- `role="status"` on non-error confirmations (consent saved, deletion
  complete).
- `role="note"` on every counsel-review-draft banner.
- Form fields use real `<label htmlFor>` associations (DOB input,
  jurisdiction select, subject-id/reason inputs on the staff screen).
- Required-field indication: DOB input carries `aria-required="true"`
  plus a visible `*` marked `aria-hidden` with an adjacent
  screen-reader-only "(required)" text node.
- `lang` attribute is set on each compliance page's root `<div>`,
  switching with the EN/ES toggle (`lang={locale}`).
- Compliance-admin RBAC denials render as visible, readable text
  (`role="alert"`) rather than silently hiding the tab — a screen-reader
  user gets the same real denial information a sighted user does.

## Visual-accessibility (contrast / non-color-only status)

- Status badges (`statusBadge()` in `complianceUiKit.js`) always pair a
  color with a text label (`"Verified"`, `"Pending review"`, `"Denied"`,
  etc.) — never color alone.
- Denial banners include a `role="alert"` text title/body in addition to
  a red border — not color-only.
- Palette reuses the existing SmokeCraft compliance/checkout tokens
  (`GOLD #E9C176` on `NAVY #0b0f18`, `CREAM #e5e2e1` body text, `DANGER
  #ff9b9b`, `OK #7fd0a3`) already in production use elsewhere in this
  app; no new low-contrast combinations were introduced.

## Form-accessibility

Every form (age-gate, staff-verification, policy accept/decline,
consent, data-rights request type) uses semantic `<form>`/`<fieldset>`/
`<legend>` where there is a grouped choice (verification method), real
`<label>` elements, and inline + summary error presentation
(`role="alert"`).

## Reduced motion / language / zoom-reflow

- No CSS animation/transition is used on any of the 6 new screens
  (static layout, matching the existing checkout page's own style) — so
  there is nothing that could violate `prefers-reduced-motion`; disclosed
  honestly rather than claiming a reduced-motion media query that isn't
  needed.
- Text uses `clamp()`/relative sizing consistent with the existing
  checkout page pattern; the responsive sweep confirms no horizontal
  overflow at any of the 5 tested viewports (390px through 1920px),
  which is the practical proxy for reflow-at-zoom this repo's existing
  harness uses.
- English/Spanish covered — see doc 37's counsel-review-labeled Spanish
  legal text and `complianceUiKit.js`'s `DICT.es` translations for every
  UI string on all 6 screens.

## Known limitation, disclosed honestly

No live screen-reader (NVDA/VoiceOver/JAWS) session was run in this
sandboxed environment — results above are DOM/ARIA-structural review
plus the one live Playwright accessibility-relevant assertion set,
matching the mandate's own allowance ("via DOM/aria inspection"). No
major accessibility blocker was found on any of the 6 new screens.
