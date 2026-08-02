# 20 — Compliance UI (Production Package 6 Correction)

This doc covers the customer/staff/admin compliance surfaces added by
the Package 6 correction pass (Checkout Enforcement, Compliance UI,
Accessibility, Full Regression) — the first UI built on top of the
server-authoritative compliance core from the original Package 6 pass.

## New routes

| Route | Screen | Audience |
|---|---|---|
| `/smokecraft/compliance/age-gate` | Age verification (self-attestation / third-party placeholder / staff-assisted description) | Customer |
| `/smokecraft/compliance/policies` | Terms / Privacy / Tobacco-warning acceptance | Customer |
| `/smokecraft/compliance/consent` | Consent preference center | Customer |
| `/smokecraft/compliance/data-rights` | Access / export / deletion / correction requests | Customer |
| `/smokecraft/staff/compliance/age-verification` | In-person ID inspection → approve/deny | Staff |
| `/smokecraft/admin/compliance` | Jurisdictions, retention, data-rights admin, staff acks, media rights, accessibility issues, audit trail | Admin/Manager |

## Checkout eligibility enforcement (server-side; UI reflects it honestly)

`server/services/venueHumidor/checkoutService.js`'s `createOrderFromHold()`
no longer accepts a client `ageVerified` boolean. It calls
`complianceController.evaluateCheckoutEligibility()` — jurisdiction,
age-verification validity, current Terms/Privacy/warning acceptance, and
fulfillment-method eligibility — before any hold is locked or order row
is written. `getCheckoutQuote()` runs the same evaluator read-only and
returns `complianceEligible`/`complianceState` in the quote.
`VenueHumidorCheckout.jsx` (Package 2's real checkout screen) was updated
to render this real state via a `data-checkout-compliance-state`
attribute and route the customer to the right compliance screen
(age-gate vs. policy center) when blocked — never advancing the
"Place Order" button until the server confirms eligibility.

## New identity endpoint

`GET /api/compliance/whoami` — resolves the caller's real compliance
subject (`{subjectType, subjectId}`) server-side from the httpOnly guest-
session cookie / authenticated user session. The customer compliance UI
uses this instead of ever reading `document.cookie` (the guest cookie is
httpOnly by design — client JS cannot and must not read it directly).

## Design system reuse

All 6 screens reuse the existing SmokeCraft checkout/Venue Humidor visual
language (`GOLD #E9C176` / `NAVY #0b0f18` / `CREAM #e5e2e1`, Georgia
serif, `SmokeCraftScreenShell`) via a new shared token file
`src/pages/smokecraft/compliance/complianceUiKit.js` — no new design
system was introduced.

## English/Spanish

Every string on all 6 screens ships in English and Spanish via
`complianceUiKit.js`'s `DICT`; legal body text itself
(Terms/Privacy/warning) is loaded from the server's `policy_versions`
table per-locale, each carrying its own counsel-review-draft label in
that language.

## Accessibility

See `public/proof/smokecraft-legal-privacy-accessibility-tobacco-compliance/42-accessibility-results.md`
for the full keyboard/screen-reader/visual/form/responsive results —
0 defects found on any of the 6 new screens across the 5 standard
viewports.

## E.A.T. known live-sync blocker — unchanged, carried into Package 7

`ManagementSync.jsx`/`SessionComplete.jsx` still do not call the E.A.T.
backend live-sync endpoints (19/130 route-smoke failures, pre-existing).
Nothing in this compliance UI pass touches that code path — compliance
administration does not depend on it. See
`public/proof/smokecraft-legal-privacy-accessibility-tobacco-compliance/eat-known-defect.md`.

## Handoff ZIP

Regenerated after this doc was added — see
`public/handoff/SmokeCraft-POS360-EAT360-UIUX-Handoff.zip`, verified with
`unzip -t`.
