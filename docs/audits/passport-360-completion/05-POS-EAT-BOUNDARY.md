# Phase 5 — POS360 and E.A.T. 360 Boundary

## Inspection performed

Searched the codebase for any reference connecting POS360 purchases, venue visits, purchase/product/spending history, venue rewards, or E.A.T. 360 operational/guest-engagement/management/inventory data to the Passport system (migration 068 tables, the pre-existing Phase F.5 API, or this pass's new sync layer).

**Result: no such connection exists anywhere.** `passport360SmokeCraftPersistenceService.js` and this pass's `passport360SyncService.js` reference only SmokeCraft-owned tables (`smokecraft_*`) and the shared `xp_accounts` ledger — no POS360 order/payment table, no E.A.T. 360 guest-engagement table, and no venue-reward table is queried by any Passport code path, old or new.

## Decision

**Not connected, honestly reported as such.** No fabricated POS360 or E.A.T. 360 connection was created or implied by this pass. `getProfile()`'s response does not include any POS360/E.A.T. 360 field at all — rather than including a field and setting it to a misleadingly-labeled `false`, the response simply omits it, since these systems are not part of this pass's actual synchronized domains.

## Future API contract (preserved, not built)

If a future pass connects POS360/E.A.T. 360 to Passport, the same pattern established in `03-SMOKECRAFT-SYNC.md` applies: a dedicated evidence-collector function reading POS360's/E.A.T. 360's own real tables, producing stamps/summary fields through the same `awardPassportStampLive()`/`passport_360_guest_progress` primitives — no schema change to migration 068 would be required, since `module_key` already exists as a per-domain scoping column on every relevant table (`passport_360_guest_progress`, `passport_360_earned_stamps`, `passport_360_badges` all key on `(guest_id, module_key)` or include `module_key`), ready to accept a `pos360` or `eat360` module key without modification.

## Scope boundary respected

This pass did not block, modify, or touch the valid SmokeCraft-to-Passport connection while investigating this boundary — the two are structurally independent (different `module_key` values would be used), so leaving POS360/E.A.T. 360 disconnected has no effect on SmokeCraft's real, working sync.
