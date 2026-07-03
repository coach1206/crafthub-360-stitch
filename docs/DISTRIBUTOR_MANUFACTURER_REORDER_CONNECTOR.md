# DMRC — Distributor and Manufacturer Reorder Connector (Phase 14 Add-on)

## Overview

DMRC provides vendor registration, reorder recommendation detection, purchase
order drafting, manager/owner approval workflow, demand signal aggregation,
and inventory receiving preview for CraftHub venues.

## Honest Status Rule

DMRC must not claim any purchase order has been submitted, acknowledged, or
delivered without proof of a real vendor API connection and confirmed submission.

Default submission status is always `reorder_not_submitted`.

No automatic purchasing. Human approval required at every stage.

A reorder without vendor API integration is `reorder_preview_only`.

## Vendor Types

`distributor` · `manufacturer` · `wholesaler` · `brand_partner` · `broker` ·
`local_supplier` · `marketplace` · `internal_warehouse`

## Reorder Status Flow

```
reorder_not_needed
  → reorder_recommended   (ISPAE low stock trigger)
  → reorder_approved      (manager/owner approves draft PO)
  → reorder_submitted     (explicit submit action, vendor API required)
  → reorder_acknowledged  (vendor confirms receipt)
  → reorder_in_transit    (shipping confirmed)
  → reorder_received      (receiving_complete)
  → reorder_inventory_updated (adjustInventory applied)
```

## Approval Roles

Only `manager`, `owner`, and `admin` roles may approve or reject purchase orders.

`guest`, `customer`, `server`, `bartender`, `kitchen_staff`, and
`humidor_staff` roles are blocked from reorder submission.

## Vendor Connection Statuses

`connected` · `disconnected` · `pending_setup` · `api_required` ·
`credentials_required` · `vendor_approval_required` · `unsupported_vendor` ·
`email_order_only` · `manual_export_only` · `preview_only`

## E.A.T. Hooks

- `getInventoryAvailabilityReadinessHooks`
- `getProductAvailabilityReadinessHooks`
- `getDistributorReorderReadinessHooks`
- `getManufacturerReorderReadinessHooks`
- `getVendorConnectionReadinessHooks`
- `getPurchaseOrderDraftReadinessHooks`
- `getReorderApprovalReadinessHooks`
- `getInventoryReceivingReadinessHooks`

## Demand Signal Sources

Demand signals aggregate from: `checkout` · `pos360` · `ncie` · `kds` ·
`system` · `staff` · `manager`

High `times_blocked` counts surface as urgent reorder triggers.

## Persistence

All data held in-memory Maps. A real database migration is provided in
`server/db/migrations/027_inventory_availability_reorder_engine.sql`.
