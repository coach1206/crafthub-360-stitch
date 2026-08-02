# Disaster Recovery Targets — Production Package 5

## MVP targets (current, realistic for a free/low-cost hosting tier)
| Metric | MVP target | Realistic provider capability today | Cost to hit it | Future enterprise target |
|---|---|---|---|---|
| RPO (data loss window) | ≤ 24 hours | Daily automated `pg_dump` (this pass proves the mechanism works) | $0 (local) / <$1/mo (cloud storage of dumps) | ≤ 5 min via managed provider PITR/WAL streaming |
| RTO (time to restore) | ≤ 2 hours | Manual: locate backup → provision DB → `pg_restore` → run validator → cutover. This pass's real restore of a 95MB/1093-table DB completed in well under 2 minutes end-to-end; the 2-hour MVP target budgets for human decision time, DNS/cutover, and re-validation, not raw restore speed | $0 | ≤ 15 min via automated failover on a managed provider |
| Max acceptable payment-reconciliation delay | ≤ 4 hours after restore | Package 2's reconciliation tooling run against restored data | $0 | ≤ 30 min, automated reconciliation job |
| Max acceptable media-restoration delay | ≤ 24 hours (originals from provider replication/export) | Not exercised — no live bucket this pass; documented target only | Provider-dependent (R2/S3 replication is near-real-time once configured) | ≤ 1 hour |
| Max acceptable customer-facing outage | ≤ 1 hour (SEV-1) | Realistic for a solo/small-team on-call model with free-tier alerting | $0 | ≤ 5 min via redundant infra |

## Honesty statement
These are MVP targets set for a small team on free/low-cost infrastructure — not promises of near-zero recovery. The actual local restore-cycle timing observed this pass (backup + restore + 20-check validation, all real) was under 2 minutes for a 95MB database; that leaves generous headroom against the 2-hour MVP RTO even before cloud-provider realities (network transfer, DNS propagation, human review) are added back in.
