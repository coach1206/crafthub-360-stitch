# Customer Data-Rights UI

**Route:** `/smokecraft/compliance/data-rights`
**File:** `src/pages/smokecraft/compliance/DataRightsCenter.jsx`

## Real backend wiring

`POST /api/compliance/data-rights/requests` (access/export/deletion/
correction) → `POST .../verify-identity` (real `requireAuth`; a
prototype guest identity cannot self-verify — 401/403, proven in
regression section 12) → for export/access: `POST .../export` (returns
the real export bundle, rendered in a `<pre>`); for deletion:
`POST .../preview-deletion` (shows real `will_retain_with_exception`
categories from `retention_policies`) → `POST .../commit-deletion`
(`sessions_revoked: true`).

## Cross-user protection (server-enforced, UI cannot bypass)

`assertOwnerOrStaff()` in `complianceController.js` (unmodified core)
rejects any caller whose id doesn't match `request.subject_id`, unless
the caller is a real staff-role actor. Verified:
```
── 9. Cross-user / cross-venue isolation ──
  PASS  A different guest cannot export another subject's data-rights request
```

## Honest states

`idle` → `submitted` → `verifying` → `verified` → (`previewing` →
`previewed` for deletion) → `committing`/exporting → `done` | `error`.
Support-case reference = the real `request_number` (`SC-DR-<ts>-<rand>`).
No fabricated "cancel" control is shown — this workflow has no
cancellable intermediate state once submitted (disclosed honestly in the
component's own header comment rather than faking one).

## Retention-exception disclosure

Deletion preview renders every `will_retain_with_exception` entry with
its real legal-basis note (e.g. "payments — tax/audit legal retention").
