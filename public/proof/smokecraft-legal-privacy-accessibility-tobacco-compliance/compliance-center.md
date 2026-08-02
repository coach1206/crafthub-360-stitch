# Admin Compliance Center

Real, backend-connected, RBAC-gated (`server/routes/complianceRoutes.js`, reusing `requireAuth`/`requireManager`/`requireAdmin` from existing middleware — same pattern as Package 5's `supportAdminRoutes.js`):

| Area | Endpoint(s) | RBAC |
|---|---|---|
| Jurisdiction settings | `GET/PATCH /api/compliance/jurisdictions[/:code]` | read public, write admin+ |
| Policy versions | `GET /api/compliance/policies` | public read |
| Consent records | `GET/POST /api/compliance/consent`, `/consent/withdraw` | self-service |
| Data-rights requests | `GET /api/compliance/data-rights/requests` (list/admin), self-service verify/export/preview/commit | manager+ list, owner-or-staff per-request |
| Retention settings | `GET /api/compliance/retention-policies` | manager+ |
| Staff acknowledgements | `GET/POST /api/compliance/staff-acknowledgements` | manager+ list, any authenticated staff to acknowledge |
| Media-rights review | `GET /api/compliance/media-rights`, `POST /media-rights/takedown` | manager+ |
| Accessibility issue tracking | `GET/POST /api/compliance/accessibility-issues`, `/resolve` | manager+ create/list, admin+ resolve |
| Audit trail | `GET /api/compliance/audit-events` | admin+ |

No dead controls: every listed endpoint was exercised live in this pass (see `regression-results.md`) and returns real DB-backed data, not a stub. No fake approval status: `counsel_review_status` defaults `pending` everywhere and is only ever set by an explicit admin write — there is no code path that silently flips it to `approved`.

**Known limitation**: this is the API layer only; a dedicated admin-console front-end screen for the Compliance Center was not built in this pass (see `known-limitations.md`).
