# Support Admin Tools — Production Package 5

`server/controllers/supportAdminController.js` + `server/routes/supportAdminRoutes.js`.

## RBAC (real, tested)
- Lookups + case create/list: `requireAuth` + `requireManager` (manager, admin, founder_level_0).
- Corrective actions: `requireAuth` + `requireAdmin` (admin, founder_level_0 only) — staff is rejected (verified, see `security-and-rbac.md`).
- Unauthenticated requests to any support-admin/ops-status route are rejected (verified).

## No silent state manipulation
Corrective actions are restricted to an explicit allowlist (`ALLOWED_CORRECTIVE_ACTIONS`: `reopen_support_case`, `reassign_support_case`, `add_case_note` — deliberately NOT extended to inventory/payment/XP mutation, which route through their own canonical, already-audited services per `payment-incidents.md`/`inventory-incidents.md`). Every corrective action:
1. Is **previewed** first (`confirm` omitted/false → returns a before/after diff, no write).
2. Requires **authorization** (`confirm: true` + admin role).
3. Is **logged BEFORE the mutation is applied** (`support_case_actions` insert happens before the `UPDATE` in `applyCorrectiveAction`).
4. Is **tied to a support case** (`case_id` required by route shape).
5. Is **reversible where possible** (`reversible` flag + `reversed_by`/`reversed_at` columns exist for future use).

## Real verification (this pass)
`node scripts/test-smokecraft-support-admin-rbac.mjs` — boots the real Express app, exercises real HTTP requests against the real (dev-mode) auth headers:
- unauthenticated request to `/api/admin/ops-status` rejected — PASS
- staff role blocked from corrective-action route (manager creates case, staff attempt rejected) — PASS
- manager creates a real support case in the real DB — PASS
- preview (`confirm` omitted) does not mutate the case — PASS
- admin corrective action with `confirm:true` is applied AND an audit row with `before_state`/`after_state` exists — PASS

5/5 tests passed. Full output: `rbac-test-output.log` in this directory.
