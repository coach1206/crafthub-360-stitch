# 12 — Inventory Authority Model

## What is real and proven (Venue Humidor)

Venue Humidor's inventory model is real, server-enforced, and proven
live in `public/proof/smokecraft-venue-humidor-media-management/`:

- `VenueHumidorAdminProductForm` — product CRUD (`new`, `:cigarId/edit`).
- `VenueHumidorAdminInventoryEvents` — inventory event log.
- `VenueHumidorAdminMedia` — image/media lifecycle: upload → metadata
  entry → product assignment → approve/reject → primary selection →
  retirement, all server-wired.
- Venue isolation is proven at the resource level, not just the caller
  level: `assertProductBelongsToVenue()` rejects assigning an asset to a
  product ID belonging to a different venue (422), even for a correctly-
  authenticated staff member of some venue.
- Master catalog concept exists (`listMasterCatalog()`,
  brand-mismatch rejection, `source_type='smokecraft_master_catalog'`)
  for sharing verified manufacturer imagery across venues without
  duplicating uploads.

## RBAC for inventory/media actions (reused venue_memberships tiers)

| Action | member | mentor | staff | manager/admin/owner | platform admin |
|---|---|---|---|---|---|
| Upload image | ❌ | ❌ | ✅ | ✅ | ✅ |
| Edit metadata / reorder / assign to product | ❌ | ❌ | ✅ | ✅ | ✅ |
| Set primary / retire | ❌ | ❌ | ✅ | ✅ | ✅ |
| Approve / reject / activate | ❌ | ❌ | ❌ (no self-approval) | ✅ | ✅ |
| CSV import (live) | ❌ | ❌ | ❌ | ✅ | ✅ |
| CSV dry-run | ❌ | ❌ | ✅ | ✅ | ✅ |
| View library / missing-image report | ❌ | ✅ read-only | ✅ | ✅ | ✅ |

## What is unresolved (flagged, not fixed — this pass makes no code changes)

**Two parallel inventory-adjacent surfaces exist and this repository does
not visibly document how, or whether, they reconcile:**

1. Venue Humidor Admin's own inventory (`/smokecraft/admin/humidor/*`) —
   proven, product-and-event-based.
2. POS360's `HumidorControl.jsx` / `InventoryControl.jsx` screens at
   `/pos3` — real files, no proof coverage, purpose implied by naming
   only.

A UI/UX developer should **not assume these are the same inventory
system with two UIs**, nor assume they are fully separate — this was not
conclusively determined by reading routes/component names alone, and
this documentation-only pass was explicitly barred from reading deep
into `server/` inventory logic to resolve it (out of scope per the task
brief: "only read from it for documentation purposes," and inventory
logic itself was flagged untouchable). **Recommendation for the next
implementation pass**: before building new inventory UI in POS360,
confirm with a backend/API trace whether `HumidorControl`/
`InventoryControl` read from the same `venue_cigar_media_assets` /
inventory-events tables Venue Humidor Admin uses, or from a separate
POS360-only data model. Document the answer in this file's next
revision.

## Reorder signals (E.A.T. 360)

`/eat/reorders` (`EATReorders`) implies a management-facing reorder
recommendation/authority screen exists conceptually, consistent with
`ReorderDemandSignalPanel.jsx` found in `src/components/reorder/`. No
proof coverage confirms this is wired to real inventory-depletion data;
treat as real UI, unverified data pipeline.

## Design guidance

- Any new inventory screen should visually distinguish **authority**
  (who can change a count) from **visibility** (who can see a count) —
  the RBAC table above already encodes this distinction; carry it
  through to UI affordances (e.g., disabled vs. hidden controls) rather
  than collapsing the two.
- Reuse the append-only audit-event pattern from Venue Humidor Media
  Management (see `11-ORDER-PAYMENT-FULFILLMENT-STATE-MODELS.md`) for
  any new POS360/E.A.T. inventory mutation, for consistency and
  auditability across the platform.
