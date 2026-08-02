# Incident Severity Model — Production Package 5

| Level | Definition | Response target | Owner | Communication | Escalation | Status-update cadence | Closure requirements | Post-incident review |
|---|---|---|---|---|---|---|---|---|
| SEV-1 | Complete outage, payment corruption, inventory corruption, or security incident | Acknowledge ≤15 min, mitigate ≤1 hr | On-call engineer, escalates to founder if unresolved in 30 min | Internal immediately; customer-facing status page update within 30 min if customer-visible | Immediate page to secondary on-call if no ack in 15 min | Every 30 min until resolved | Root cause identified, fix deployed or rolled back, data integrity confirmed (reconciliation tooling run), affected customers identified | REQUIRED within 48 hours |
| SEV-2 | Degraded service, elevated error rate, single-component failure with workaround | Acknowledge ≤30 min, mitigate ≤4 hrs | On-call engineer | Internal; status page if customer-visible and >1hr | Escalate to founder if unresolved in 4 hrs | Every 2 hrs | Root cause identified, fix or workaround deployed | REQUIRED within 5 business days |
| SEV-3 | Minor functional defect, non-critical background job failure, isolated support-affecting issue | Acknowledge ≤4 hrs, mitigate ≤2 business days | Assigned owner (media/gameplay/inventory as applicable) | Internal only unless customer asks | None automatic | Daily | Fix deployed or tracked with defect ID | Optional, owner's discretion |
| SEV-4 | Minor defect, cosmetic issue, individual support ticket | Acknowledge ≤1 business day | Support/assigned owner | Case-level only | None | Per case update | Case resolved, resolution code recorded | Not required |

Applies uniformly across gameplay, Venue Humidor, Inventory, Media, Payments, Passport, Golden Box, POS360, E.A.T. 360, and infra/DB/storage/jobs/deployment.
