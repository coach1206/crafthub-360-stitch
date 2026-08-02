# Data-Rights Workflow

Real, working (see `export-sample.json`, `deletion-sample.json` for live output against a fake test identity `proof-fake-customer`):

1. `POST /api/compliance/data-rights/requests` — subject submits request (access/correction/deletion/export/consent_withdrawal/marketing_opt_out/restriction). Gets a `request_number`, 30-day operational deadline.
2. `POST .../verify-identity` — owner-or-staff only (enforced via `ROLE_LEVELS.staff` check, not "anything but customer" — this exact bug was found and fixed during this pass, see `regression-results.md`).
3. Export: `POST .../export` — requires `identity_verified` status (or staff), builds a real JSON bundle from `consent_records`/`age_verification_records`/`policy_acceptances`, excludes secrets/staff notes/fraud logic/other users' data by construction (only queries scoped to `subject_type`+`subject_id`).
4. Deletion: `POST .../preview-deletion` (computes anonymize-vs-retain-with-exception plan) then `POST .../commit-deletion` (requires a preview to already exist; withdraws consent records, revokes sessions, marks request completed, writes `data_deletion` audit event).
5. Cross-user protection: verified live — a different authenticated non-staff subject attempting to export/verify/delete another subject's request receives `403 forbidden_cross_user_request`.
