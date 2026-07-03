# OIPSL — Operational Inventory Persistence and Sync Layer (Phase 15)

## Overview

OIPSL sits beneath ISPAE and DMRC, providing durable storage for inventory records,
adjustments, audit events, purchase order drafts, approval decisions, receiving records,
and operational sync events.

## What Changed from Phase 14

Phase 14 created ISPAE + DMRC with in-memory Maps as the storage layer.

Phase 15 adds persistence services that:
- Write to a database when `DATABASE_URL` is set
- Fall back to `in_memory_only` with honest status when DB is not available
- Always include `persisted`, `persistenceStatus`, `databaseRequired`, `degradedMode` in every response

## What is Database-Backed

When `DATABASE_URL` is set:
- `inventoryPersistenceService` — inventory records
- `inventoryAdjustmentPersistenceService` — all stock change events
- `inventoryAuditPersistenceService` — full audit trail
- `purchaseOrderPersistenceService` — PO drafts, approval status
- `reorderApprovalPersistenceService` — manager/owner decisions
- `receivingPersistenceService` — receiving confirmations and inventory adjustments
- `reorderPersistenceService` — recommendations, demand signals
- `operationalSyncEventService` — sync event queue

## What Remains Preview-Only

Without a connected database, all persistence falls back to `in_memory_only`:
- Data is lost on server restart
- `persistenceStatus: 'in_memory_only'`
- `degradedMode: true`
- `databaseRequired: true`

## How Receiving Confirmation Works

1. `createReceivingRecord` creates a durable receiving preview
2. `confirmReceivingRecord` marks items received
3. If database available: calls `confirmReceivingInventoryAdjustment` → writes to `inventory_adjustments` table
4. If database not available: returns `receiving_preview_only` + `inventory_not_persisted` + `adjusted_in_memory_only`
5. Audit event recorded regardless: `inventory_receiving_adjusted` or `receiving_confirmed`

## How Inventory Adjustment Persistence Works

All adjustments flow through `inventoryAdjustmentPersistenceService`:
- `persistInventoryAdjustment` — generic adjustment with full ledger record
- `reserveInventoryForOrder` → `order_reserved` adjustment type
- `commitCheckoutInventory` → `checkout_completed` adjustment type
- `confirmReceivingInventoryAdjustment` → `receiving_confirmed` adjustment type

## How Purchase Order Persistence Works

1. `persistPurchaseOrderDraft` creates PO with `submission_status: 'reorder_not_submitted'`
2. `markPurchaseOrderApproved` records manager/owner decision
3. Submission NEVER happens automatically
4. If no vendor API/email/export: returns `purchase_order_not_submitted`

## How Approval Persistence Works

Only `manager`, `owner`, `admin` roles may approve.
All decisions written to `reorder_approvals` table (or in-memory fallback).
Every approval/rejection generates an audit event.

## How Audit Persistence Works

`inventoryAuditPersistenceService` records all significant events:
- Inventory created/updated/adjusted
- Products marked sold out, hidden, disabled
- Checkout/staff/KDS blocks
- Purchase order lifecycle events
- Receiving events
- Sync failures

## How Sync Events Work

`operationalSyncEventService` records sync events for future real-time systems.
Events are queued (`sync_status: 'queued'`) and can be processed by future workers.

## What is NOT Live External POS Sync

- `external_sync_not_live` — no POS inventory push active
- `real_time_push_pending` — requires future phase for WebSocket or webhook integration
- `external_pos_required` — external POS API not connected

## What is NOT Live Vendor/Manufacturer Sync

- `vendor_sync_not_live` — no vendor API push active
- `distributor_connection_required` — distributor API not connected
- `manufacturer_connection_required` — manufacturer API not connected
- `reorder_not_submitted` — no purchase orders have been submitted to any vendor

## Future Phases Required

- Phase 16+: External POS inventory sync (webhook/WebSocket)
- Phase 16+: Vendor/distributor API live ordering
- Phase 16+: Real-time multi-user inventory push
- Phase 16+: Automated reorder submission with approval rules

## Migration

Migration 028 creates:
- `inventory_records` — full ISPAE model
- `inventory_adjustments` — durable adjustment ledger
- `inventory_audit_events` — audit trail
- `reorder_approvals` — approval decisions
- `receiving_records` — receiving headers
- `receiving_items` — receiving line items
- `operational_sync_events` — sync event queue
