# Security and RBAC — Production Package 5

All new endpoints this pass reuse the existing Auth v2 middleware (`requireAuth`, `requireManager`, `requireAdmin` from `server/middleware/{authMiddleware,roleMiddleware}.js`) — no new/parallel auth system was built.

| Endpoint | RBAC gate | Verified |
|---|---|---|
| `GET /api/admin/ops-status` | requireAuth + requireAdmin | Unauthenticated → rejected (401/403), confirmed in RBAC test |
| `GET /api/health/metrics` | requireAuth + requireAdmin | Newly gated (was previously unguarded — this pass closes that gap by putting it behind the same admin gate as ops-status, since metrics can reveal operational internals) |
| `POST /api/support-admin/cases`, `GET .../cases`, `GET .../cases/:id` | requireAuth + requireManager | Manager successfully creates/reads; confirmed |
| `GET /api/support-admin/lookup/*` | requireAuth + requireManager | Real DB queries, all lookups audit-logged when tied to a case |
| `POST /api/support-admin/cases/:id/corrective-action` | requireAuth + requireAdmin | Staff (below admin) rejected — confirmed in RBAC test; admin succeeds with `confirm:true`, preview-only without it |

## Real test evidence
`scripts/test-smokecraft-support-admin-rbac.mjs` (5/5 passed, `rbac-test-output.log`):
1. Unauthenticated request to `/api/admin/ops-status` rejected.
2. Staff role blocked from the corrective-action endpoint (manager creates the case; staff's attempt to apply a corrective action against it is rejected).
3. Manager creates a real support case in the live database.
4. Preview (no `confirm`) leaves the case unmodified.
5. Admin corrective action with `confirm:true` is applied AND produces an audit row with captured `before_state`/`after_state`.

## No unaudited state manipulation
Corrective actions are allowlisted (`ALLOWED_CORRECTIVE_ACTIONS`), require `confirm:true`, are logged to `support_case_actions` BEFORE the mutation runs, and are scoped to support-case metadata only — never a path for directly editing payment/inventory/XP data (those remain owned by their existing canonical services, per `payment-incidents.md`/`inventory-incidents.md`).
