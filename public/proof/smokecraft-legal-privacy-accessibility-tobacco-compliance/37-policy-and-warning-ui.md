# Terms / Privacy / Tobacco-Warning UI

**Route:** `/smokecraft/compliance/policies?returnTo=<path>&jurisdiction=<code>&type=<optional>`
**File:** `src/pages/smokecraft/compliance/PolicyCenter.jsx`

## Real backend wiring

- `GET /api/compliance/policies?locale=<en|es>` — loads the **current**
  `policy_versions` row per type (terms/privacy/tobacco_warning),
  preferring a jurisdiction-specific row over the global (`NULL`
  jurisdiction) row. Never a hardcoded local copy of legal text.
- `POST /api/compliance/policies/accept` — records `{subjectType,
  subjectId, policyVersionId, locale}`; server stamps `accepted_at`,
  request metadata is captured by the existing `auditAction`-independent
  audit event (`terms_acceptance`/`privacy_acknowledgement`) recorded in
  `complianceController.acceptPolicy`.

## States

`loading` → `ready` (per-policy accept/decline) | `unavailable` (no
current policy configured for the locale/jurisdiction) | `error`.
Declining shows an honest blocking notice — tobacco purchases cannot
proceed. Continue is disabled until every loaded policy is accepted.

## Counsel-review labeling

Every screen renders a persistent draft banner:
> "DRAFT — PENDING QUALIFIED LEGAL COUNSEL REVIEW. Not final or legally
> approved language." (Spanish equivalent when `locale=es`.)

Each policy card also shows its raw `counsel_review_status` value
(`pending` for every seeded policy — never fabricated as `approved`).

## Acceptance record content

`policy_acceptances` rows persist subject, `policy_version_id`
(→ policy_type + version + locale via join), and `accepted_at` — matches
mandate section 5 (player/customer id, policy type, version, locale,
timestamp). A real audit event is recorded for every acceptance
(verified in `verify-smokecraft-compliance-checkout-enforcement-api.mjs`
section 15).
