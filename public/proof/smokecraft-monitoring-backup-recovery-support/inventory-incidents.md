# Inventory Incident Handling — Production Package 5

`inventory_events` is an append-only ledger (pre-existing, unchanged this pass). Every incident-response procedure below preserves append-only ledger history — never erase evidence to force totals to match. Corrective actions are new, offsetting ledger events, not edits/deletes of history.

| Scenario | Detection | Resolution principle |
|---|---|---|
| Negative available inventory | Computed availability < 0 | Investigate root cause (oversell, double-decrement); write a corrective ledger event, never edit/delete the original events |
| Duplicate inventory event | Two identical decrement events for one order | Write an offsetting increment event referencing the duplicate's ID; both events remain visible in history |
| Stale reservation | Hold past expected TTL, not yet released | Background job should auto-release; if job failed, write a release event manually via support tooling, tied to a support case |
| Failed hold release | `inventory.hold_expired` job errors | `background_job_failure` alert; fix job, backfill missed releases as new events with a clear reason code |
| Fulfillment without decrement | Order fulfilled but no matching ledger event | Write the missing decrement event retroactively, tagged with the real fulfillment timestamp and a note explaining the backfill |
| Refund-related inventory question | Was stock restored on refund? | Query ledger for a matching restock event; if missing, write one, tied to the refund's support case |
| Damaged/missing product | Physical count mismatch | Write an adjustment event with reason `damaged`/`missing`, never overwrite the running total directly |
| Cross-venue inventory mismatch | Venue-isolation check fails | Investigate for a venue-isolation bug (see `security-and-rbac.md`'s venue-tenant-guard) before assuming it's a data-entry error |

`supportAdminController.js`'s corrective-action allowlist deliberately does NOT include a generic "set inventory count" operation — any real inventory correction must go through inventory's own append-only event-writing path (existing `inventory_events`/`inventory_adjustments` services), keeping one authoritative ledger rather than a second support-tool-specific write path.
