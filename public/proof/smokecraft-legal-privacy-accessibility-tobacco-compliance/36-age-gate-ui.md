# Customer Age-Gate UI

**Route:** `/smokecraft/compliance/age-gate?returnTo=<path>&jurisdiction=<code>`
**File:** `src/pages/smokecraft/compliance/AgeGate.jsx`
**API client:** `src/services/compliance/complianceApiClient.js`

## Real backend wiring

- Identity: `GET /api/compliance/whoami` (new endpoint, server-derived
  from the httpOnly `smokecraft_guest_session` cookie / authenticated
  user session — the client never reads or decodes the cookie itself,
  since it is httpOnly by design).
- Jurisdiction list: `GET /api/compliance/jurisdictions` (active only).
- Existing-verification check: `GET /api/compliance/purchase-eligibility`.
- Submission: `POST /api/compliance/age-verification` with
  `{subjectType, subjectId, jurisdictionCode, method, declaredBirthdate?}`.

## States implemented

`idle` → `checking` → `approved` | `denied` | `error`. Approved shows a
"Continue" action back to `returnTo`. Denied shows a retry button and a
`mailto:` support-escalation link. No `localStorage`-as-authority — every
render re-derives state from the server response.

## Methods offered

- **Self-attestation** — real date-of-birth input, age computed
  server-side against `compliance_jurisdictions.min_purchase_age`.
- **Third-party verification** — labeled honestly:
  "(Placeholder shape only — not a live third-party identity provider in
  this environment.)" per mandate section 4.
- **Staff-assisted** — described in-page; actual submission happens via
  the separate Staff Age Verification screen (doc 40), which requires a
  real authenticated staff actor server-side.

## No unnecessary ID storage

Only a date-of-birth (self-attestation) or a boolean staff decision is
persisted — no government-ID image/number field exists anywhere in this
UI or its API payloads.

## Accessibility

Real `<label>`/`<fieldset>`/`<legend>` for the method radio group and
DOB field, `aria-required`, `role="alert"` error summary, visible
required-field asterisk, `lang` attribute set per active locale,
44px-minimum control heights. Verified in the responsive/keyboard sweep
(doc 42).
