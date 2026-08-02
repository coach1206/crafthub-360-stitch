# Package 6 Correction — Baseline

**Starting commit:** `51e3dbf40094fc12db9ed4906739e7d911a79e5b` — "Production Package 6: Legal, Privacy, Accessibility, Tobacco Compliance"

```
$ git status
On branch recovery/smokecraft-codex-final
Your branch is up to date with 'origin/recovery/smokecraft-codex-final'.
nothing to commit, working tree clean

$ git rev-parse HEAD
51e3dbf40094fc12db9ed4906739e7d911a79e5b

$ git rev-parse origin/recovery/smokecraft-codex-final
51e3dbf40094fc12db9ed4906739e7d911a79e5b

$ git log -1 --oneline
51e3dbf4 Production Package 6: Legal, Privacy, Accessibility, Tobacco Compliance
```

Local HEAD == remote HEAD == the just-completed Package 6 commit. Working
tree clean. Proceeded per mandate.

## Package 6 core inspected before building anything new

- `server/controllers/complianceController.js` — server-authoritative age
  gate (`evaluatePurchaseEligibility`, exported for reuse), versioned
  Terms/Privacy/warning acceptance, consent, data-rights workflow
  (access/export/deletion with retention-exception preview), staff
  acknowledgements, media-rights takedown, append-only audit trail.
- `server/routes/complianceRoutes.js` — `/api/compliance/*`, RBAC via
  `requireManager`/`requireAdmin` reused unmodified from Package 2-5.
- `server/db/migrations/117_smokecraft_legal_privacy_accessibility_compliance.sql`
  — `compliance_jurisdictions`, `age_verification_records`,
  `policy_versions`, `policy_acceptances`, `consent_records`,
  `data_rights_requests`, `retention_policies`, `staff_acknowledgements`,
  `compliance_audit_events`, `media_rights_review`,
  `accessibility_issues`.
- `public/proof/smokecraft-legal-privacy-accessibility-tobacco-compliance/`
  — 33 existing proof docs, all reviewed; `regression-results.md` and
  `known-limitations.md` disclosed the omissions this correction closes.

**Confirmed gap this correction closes:** the real Venue Humidor checkout
path (`server/services/venueHumidor/checkoutService.js`,
`server/controllers/venueHumidorCheckoutController.js`) accepted a raw
client-submitted `ageVerified: true/false` boolean and never called the
compliance evaluator at all — a genuine, exploitable trust-the-client
defect, exactly as the prior pass honestly disclosed it had not yet wired.
No duplicate compliance system was created; the existing
`evaluatePurchaseEligibility` core is reused and extended with a new
`evaluateCheckoutEligibility` wrapper in the same controller file.
