# Retention Matrix (Operational Defaults, Pending Counsel Approval)

`retention_policies` table (migration 117), one row per data category, all seeded `status='operational_default_pending_counsel'`:

| Category | Retention (days) | Note |
|---|---|---|
| accounts | 2555 (~7yr) | pending counsel |
| guest_identities | 180 | no-conversion guest sessions |
| gameplay_state / xp_rewards / passport | 2555 | tied to account retention |
| orders / payments / refunds / disputes | 2555 | tax/audit alignment; payment records retained even after account deletion |
| inventory_audit | 1095 (~3yr) | operational default |
| media_rights | 2555 | per rights-agreement term |
| support_cases / incident_logs | 1095 | operational default |
| security_logs | 400 | matches Package 5 monitoring window |
| backups | 90 | matches Package 5 backup rotation |
| deleted_account_tombstones | 2555 | anonymized reference only, no PII |

Configurable by jurisdiction via `retention_policies.jurisdiction_code` (currently all rows scoped to `US-DEFAULT`; additional jurisdiction-specific overrides can be inserted without a schema change). This is a real config table, not full automated per-table enforcement — the mandate explicitly scoped automated enforcement across every table as excessive for this pass; enforcement jobs are a documented follow-up (`known-limitations.md`).
