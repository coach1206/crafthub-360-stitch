# Age Gating — Server-Authoritative

Implementation: `server/controllers/complianceController.js`, `server/db/migrations/117_*.sql`.

- Eligibility for tobacco purchase is decided **entirely server-side** in `evaluatePurchaseEligibility()`, reading `age_verification_records` + `compliance_jurisdictions` from Postgres. No endpoint accepts or trusts a client-supplied `isEligible`/`ageConfirmed` boolean — verified by grep in the validator (`validateSmokecraftComplianceReadiness.mjs`) and by live testing (see `regression-results.md`).
- Age requirement is configurable per jurisdiction (`compliance_jurisdictions.min_purchase_age`, default 21 for US-DEFAULT).
- Purchase path is blocked when eligibility evaluates false — `GET /api/compliance/purchase-eligibility` returns `{eligible:false, reason:...}` and checkout code (future wiring) is expected to call this endpoint / `evaluatePurchaseEligibility()` before allowing a tobacco line item.
- Re-verification: every `age_verification_records` row has `expires_at` computed from `jurisdiction.reverification_days` (default 365 days); eligibility excludes expired rows.
- Venue/staff verification state: `method IN ('staff_verified','in_person_fulfillment')` requires an authenticated staff-role actor (`ROLE_LEVELS.staff` or above) — enforced in the controller, tested live (anonymous call denied with 401 `staff_actor_required`).
- Audit record: every verification attempt and every purchase-eligibility check writes a `compliance_audit_events` row (`age_verification`, `tobacco_purchase_approved`/`tobacco_purchase_denied`).
- Honest denial: denial responses return a specific `reason` code (`no_valid_age_verification`, `jurisdiction_not_active`, `tobacco_sales_not_permitted_in_jurisdiction`) rather than a generic failure, so UI can show an honest explanation.
- Scope discipline: self-attestation is boolean+timestamp+declared birthdate only — no ID-scanning infrastructure was built, per the mandate's explicit instruction not to over-collect for this pass.

## Live proof (see regression-results.md for full transcript)
- Under-21 self-attestation (DOB 2012) -> `result: denied`.
- Adult self-attestation (DOB 1990) -> `result: approved`.
- Purchase-eligibility for a subject with no verification record -> `eligible:false, reason:no_valid_age_verification`.
- Purchase-eligibility for a disabled jurisdiction (`DR`) -> `eligible:false, reason:jurisdiction_not_active`.
- Sending `isEligible=true`/`ageConfirmed=true` as extra query params has **no effect** — the endpoint ignores them entirely (client bypass denied).
