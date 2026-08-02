# Alert Inventory — Production Package 5

All 17 alerts from mandate §6, implemented as real, unit-tested threshold logic in `server/lib/alertRules.mjs` (`ALERT_DEFINITIONS` + `evaluate()`). No live delivery channel is wired (no PagerDuty/Slack account exists in this sandbox) — `channel` fields say so explicitly rather than claiming delivery.

| Alert | Severity | Window | Min samples / threshold | Owner | Channel (not wired) |
|---|---|---|---|---|---|
| app_unavailable | sev1 | 60s | 3 failed checks | on-call-engineer | pagerduty-or-equivalent |
| readiness_failing | sev2 | 120s | 3 | on-call-engineer | pagerduty-or-equivalent |
| db_unavailable | sev1 | 30s | 2 | on-call-engineer | pagerduty-or-equivalent |
| migration_mismatch | sev2 | n/a | 1 | release-owner | slack-deploys |
| elevated_5xx_rate | sev2 | 300s | 20 samples, rate ≥ 5% | on-call-engineer | slack-alerts |
| payment_webhook_failures | sev1 | 600s | 3 | payments-owner | pagerduty-or-equivalent |
| duplicate_payment_anomaly | sev1 | n/a | 1 (no dampening — always investigate) | payments-owner | pagerduty-or-equivalent |
| inventory_oversell_attempt | sev1 | n/a | 1 | inventory-owner | slack-alerts |
| object_storage_unavailable | sev1 | 60s | 3 | on-call-engineer | pagerduty-or-equivalent |
| image_processing_backlog | sev3 | 900s | queue depth ≥ 50 | media-owner | slack-alerts |
| background_job_failure | sev2 | n/a | 2 consecutive failures | on-call-engineer | slack-alerts |
| backup_failure | sev1 | n/a | 1 | db-owner | pagerduty-or-equivalent |
| restore_verification_failure | sev1 | n/a | 1 | db-owner | pagerduty-or-equivalent |
| disk_memory_pressure | sev2 | 300s | usage ≥ 85% | on-call-engineer | slack-alerts |
| abnormal_rate_limit_activity | sev3 | 300s | 25 events | security-owner | slack-alerts |
| golden_box_lifecycle_failure | sev3 | 600s | 3 | gameplay-owner | slack-alerts |
| passport_claim_failure_spike | sev2 | 600s | 10 samples, rate ≥ 10% | gameplay-owner | slack-alerts |

Each rule includes: severity, threshold, evaluation window, owner, notification channel (documented), and avoids single-event noise by requiring either a minimum sample count within a rolling window (e.g. `app_unavailable` needs 3 failed checks inside 60s, not 1) or an explicit "this is inherently sev1 on one occurrence" decision documented for financial-integrity alerts (`duplicate_payment_anomaly`, `inventory_oversell_attempt`, `backup_failure`, `restore_verification_failure`) where waiting for a second occurrence would be actively harmful.

## Recovery confirmation
Each alert's "first response" step (documented in `incident-runbooks.md`) ends with a recovery-confirmation query — e.g. `db_unavailable` recovers when `isDbAvailable()` returns true again and `/api/health/ready` returns 200 for 3 consecutive checks.

## Real verification (this pass)
`node scripts/test-smokecraft-monitoring-recovery-support.mjs`:
- `app_unavailable` does not fire below minSamples in window — PASS
- `app_unavailable` fires at minSamples within window — PASS
- `app_unavailable` ignores samples outside the window (proves no noisy single-event alert) — PASS
- `elevated_5xx_rate` requires both sample count AND rate threshold — PASS
- `duplicate_payment_anomaly` fires on a single confirmed event (sev1, no dampening, by design) — PASS
- every alert definition has severity/owner/channel — PASS
- unknown alert rule throws (fails closed, not open) — PASS

## Honesty statement
No alert was actually delivered to a live PagerDuty/Slack/email endpoint. The threshold-evaluation logic that decides WHEN an alert should fire is real and tested; wiring `evaluate()`'s output to a live notification channel is a credential/config task for whoever owns the eventual paid account.
