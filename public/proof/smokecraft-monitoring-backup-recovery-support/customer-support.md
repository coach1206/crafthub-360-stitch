# Customer Support Workflow — Production Package 5

Reuses the existing case/audit structures built this pass (`support_cases`, `support_case_actions`) rather than a duplicate ticketing platform.

## Intake fields (support_cases columns)
case_number, customer_identifier, venue_id, category, severity, status, assigned_owner, related_order_id/payment_id/session_id, description, resolution_code, resolution_notes, opened_by, timestamps.

## Categories covered
login issue, lost session, missing XP, missing Passport stamp, missing reward, failed payment, missing receipt, order delay, wrong product, refund request, broken image, venue mismatch, Golden Box issue.

## Workflow
1. **Intake** — `POST /api/support-admin/cases` (manager+). Category + description required.
2. **Identity verification** — customer_identifier captured; real identity resolution goes through the existing Passport/session identity system (Package covering unified identity), not a new ad-hoc lookup.
3. **Venue verification** — venue_id captured; cross-checked against venue-tenant-guard middleware for any lookups performed.
4. **Order/session lookup** — `GET /api/support-admin/lookup/order/:orderId`, `GET /api/support-admin/lookup/player/:identifier` (manager+, real DB queries, every lookup logged to `support_case_actions` when a `caseId` is supplied).
5. **Evidence** — captured in `description`/`resolution_notes`; corrective actions capture `before_state`/`after_state` JSON automatically.
6. **Escalation** — by category-appropriate owner per `incident-severity.md` for anything above sev4.
7. **Resolution code** — recorded on `support_cases.resolution_code` at close.
8. **Audit note** — every action (lookup, corrective action, note) is a row in `support_case_actions`, timestamped, tied to actor_id/actor_role.
9. **Customer communication template** (example, fake data only):
   > Hi {{customer_name}}, thanks for reaching out about {{category}}. We've located your {{order/session}} and {{resolution_summary}}. Case reference: {{case_number}}. Let us know if anything's still off.

See `support-case-examples.json` in this directory for FAKE example cases (no real customer data).
