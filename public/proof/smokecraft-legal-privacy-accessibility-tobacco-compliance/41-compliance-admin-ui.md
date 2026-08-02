# Compliance Administration UI

**Route:** `/smokecraft/admin/compliance`
**File:** `src/pages/smokecraft/compliance/admin/ComplianceAdmin.jsx`

## Tabs, all backend-connected, zero dead controls

| Tab | Endpoint | RBAC |
|---|---|---|
| jurisdictions | `GET/PATCH /api/compliance/jurisdictions` | requireAdmin (write) |
| retention | `GET /api/compliance/retention-policies` | requireManager |
| dataRights | `GET /api/compliance/data-rights/requests` | requireManager |
| staffAcks | `GET /api/compliance/staff-acknowledgements` | requireManager |
| mediaRights | `GET /api/compliance/media-rights` | requireManager |
| accessibility | `GET /api/compliance/accessibility-issues` | requireManager |
| audit | `GET /api/compliance/audit-events` | requireAdmin |

Jurisdiction `tobacco_sales_allowed`/`shipping_allowed` toggle buttons
call the real `PATCH /api/compliance/jurisdictions/:code` — a change is
immediately reflected in checkout eligibility (this is the SAME
`compliance_jurisdictions` table the checkout evaluator reads).

## RBAC proven server-side (no client-only gating)

```
── 13. Compliance-admin RBAC ──
  PASS  A staff-level (non-admin) caller is denied the admin-only audit trail
  PASS  A real admin can read the audit trail
  PASS  A manager can read retention policies (requireManager)
  PASS  A non-admin cannot modify jurisdiction rules
```

The UI surfaces a real error/RBAC message (`error === 'forbidden'` etc.)
rather than hiding tabs client-side only — a denied fetch still shows the
real 401/403 to make server enforcement visible.

## No fake approvals

Jurisdiction rows render their real `counsel_review_status` (`pending`
for every seeded row) — the admin UI has no "approve as legal" control;
legal approval remains an out-of-band process per the mandate.
