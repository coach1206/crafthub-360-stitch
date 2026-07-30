# SmokeCraft Venue Humidor — Architecture Map

Venue Humidor 1A — backend foundation only (schema, inventory service,
venue isolation, RBAC). No customer, checkout, or admin screens exist
yet — see the 1B handoff.

## Existing systems audited and reused

- **Venue identity**: `venues` / `venue_memberships` (migration 010).
  Every Venue Humidor table's `venue_id` is a real FK to `venues(venue_id)`
  — no parallel venue concept was invented. Staff RBAC reuses
  `venue_memberships.membership_type IN ('staff','manager','admin','owner')`
  with `status = 'active'`, matching the exact venue-scope check
  pattern already established and proven in Golden Box's
  `judgingService.assignJudge()` (Holistic Fix 5C-2A).
- **Authentication and RBAC**: `requireAuth` / `requireRole`
  (`server/middleware/authMiddleware.js`, `roleMiddleware.js`) — reused
  unchanged. A new venue-scoped `requireVenueStaff()` middleware
  (`venueHumidorRoutes.js`) additionally validates real
  `venue_memberships` for the exact `:venueId` in the route path — a
  platform admin (`requireRole('admin')`-equivalent) bypasses the
  membership check; every other authenticated user must have a real,
  active membership row for that specific venue.
- **POS360/tab services** (`pos360OrderBridgeService.js`,
  `pos360ItemMappingService.js`, etc.): audited, not reused directly —
  they bridge to an external POS provider for a different commerce
  surface (bar/restaurant tabs). Venue Humidor cigar inventory is a
  first-party, database-authoritative system; no dependency on POS360
  was introduced this pass.
- **Passport services**: audited (`passportService.js`,
  `passport360SmokeCraftPersistenceService.js`) — not touched this
  pass (no customer-facing reward integration in 1A's scope).
- **Pairing engine**: audited (`pairingEngineRoutes.js`) — not touched
  this pass (no customer-facing recommendation integration in 1A's
  scope).
- **Inventory systems**: `inventoryAvailabilityService.js` and related
  files under `server/services/inventory/` are an in-memory, "preview-
  safe," multi-craft-module prototype (never database-backed, explicitly
  documented as non-authoritative). Venue Humidor does NOT reuse this
  module — it needs a real, transactional, database-backed inventory
  ledger for real cigar stock, which did not exist anywhere in this
  codebase before this pass.
- **Order/payment services**: `orderLifecycleService.js` and
  `orderTotalsService.js` under `server/services/order/` are audited —
  they model a different order domain (not cigar-specific,
  no per-product inventory decrement). Not reused directly; Venue
  Humidor's own `venueCigarOrderService.js` is a small, cigar-specific
  order/sale-completion service built this pass, following the same
  transactional/idempotent conventions.
- **Audit/event infrastructure**: reused the exact append-only,
  idempotency-key-guarded event-ledger pattern established by
  `golden_box_activity_log` / `golden_box_result_finalizations` /
  `golden_box_award_issuances` — `venue_cigar_inventory_events` is the
  append-only ledger; every mutation requires a caller-supplied
  idempotency key, checked with a real `UNIQUE` partial index.
- **Database conventions**: `BIGSERIAL` primary key + `UUID` public
  identifier (`gen_random_uuid()`), `TEXT venue_id` FK to
  `venues(venue_id)`, `CHECK` constraints for enums and non-negative
  quantities, partial `UNIQUE` indexes for nullable idempotency keys —
  all directly reused from the Golden Box migrations (077, 102-105).

## New schema (migration 106)

`venue_cigar_products`, `venue_cigar_inventory_events` (append-only),
`venue_cigar_inventory_holds` (short-lived, expiring), 
`venue_cigar_reservations` (longer-lived, staff-created),
`venue_cigar_orders`, `venue_cigar_order_items`. See the migration file
for full column/constraint detail.

## Inventory calculation

```
available_quantity = physical_quantity
                    - unavailable_quantity
                    - SUM(active holds' quantity)
                    - SUM(active reservations' quantity)
```

Computed on read (`inventoryService.getProductAvailability()`), never
cached/duplicated — the same "never overwrite with a stale aggregate"
principle Golden Box's `golden_box_results` follows relative to
individual judge scores.

## Mutation model

Every inventory-affecting operation goes through
`inventoryService.applyInventoryEvent()` (receiving, box_opened,
stick_added, stick_removed, damage, loss, complimentary, return,
count_correction, sale_completed, cancellation_restored) or the
dedicated hold/reservation functions (`createHold`, `expireHold`,
`releaseHold`, `createReservation`, `cancelReservation`,
`fulfillReservation`). Every one of these:

1. Runs inside one database transaction.
2. Locks the product row (`SELECT ... FOR UPDATE`) before computing
   the new quantity — never a read-then-write race.
3. Rejects any mutation that would drive `physical_quantity` negative
   (`insufficient_inventory` error, transaction rolled back).
4. Requires a caller-supplied idempotency key — checked once before
   the lock (fast path) and once more after acquiring it (authoritative
   recheck, closes the two-tab race a pre-lock-only check would still
   allow) — the same pattern established throughout the Golden Box
   passes.
5. Writes exactly one append-only `venue_cigar_inventory_events` row.
6. Returns the final, authoritative product quantities — never a
   client-echoed value.

## Venue isolation

Every read/write query is scoped by a real `venue_id` parameter — no
query aggregates across venues. `requireVenueStaff()` additionally
validates that the caller has a real, active membership for the exact
venue in the route path before any mutation is attempted — a
client-supplied `venueId` is never trusted on its own.

## Explicitly out of scope for this pass

Customer-facing browsing/checkout screens, staff admin screens, POS
integration, Passport/pairing integration, full-route/five-viewport
sweeps — see the Venue Humidor 1B handoff in
`public/proof/smokecraft-venue-humidor-1a/00-proof-index.md`.
