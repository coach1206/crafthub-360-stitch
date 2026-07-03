# ISPAE — Inventory Sync and Product Availability Engine (Phase 14)

## Overview

ISPAE tracks product availability per venue and gates checkout, staff orders,
NCIE recommendations, KDS routing, and POS360 against live stock levels.

## Status Vocabulary

| Status | Meaning |
|---|---|
| `in_stock` | Available stock >= requested quantity |
| `low_stock` | Stock at or below reorder threshold |
| `sold_out` | Current stock = 0 |
| `availability_required` | No inventory record exists |
| `inventory_unavailable` | Product blocked or insufficient stock |
| `inventory_sync_pending` | Inventory not yet synced from live source |

## Honest Status Rule

ISPAE must not claim inventory is synced, reserved, or persisted unless a
database is connected and a real sync has completed.

All ISPAE responses include `syncStatus: 'inventory_sync_pending'` and
`persistenceStatus: 'database_required'` or `'not_persisted'` until a real
database write is confirmed.

## Availability Thresholds

- `current_stock <= 0` → `sold_out`
- `current_stock <= reorder_threshold` → `low_stock`
- else → `in_stock`

Available stock = `current_stock - reserved_stock` (minimum 0).

## Integration Points

- **Checkout**: `validateProductsForCheckout` blocks sold-out items
- **Staff Order**: `validateProductsForStaffOrder` same logic, labels for POS360
- **NCIE**: `buildNcieAvailabilityContext` filters unavailable recommendations
- **Demand Signals**: Blocked items emit demand signals for DMRC

## Persistence

All data held in-memory Maps. A real database migration is provided in
`server/db/migrations/027_inventory_availability_reorder_engine.sql`.
