# 02 — Platform Responsibility Map

Which system owns which concern. Use this to decide where a new screen or
feature belongs.

| Concern | Owning system | Notes |
|---|---|---|
| Guest curriculum/education (27 sessions) | SmokeCraft 360 | `src/pages/smokecraft/*`, routed under `/smokecraft/*` |
| Guest identity/enrollment | SmokeCraft 360 | `Enroll`, `Identity`, `GuestSessionContext` |
| Mentor guidance content | SmokeCraft 360 (real dynamic service) | Session 14, `smokecraftMenuPairingPanel` adjacent |
| Cigar catalog browse/detail | Venue Humidor | `/smokecraft/venue-humidor*` |
| Cart/checkout/payment intent | Venue Humidor | `VenueHumidorCheckout` |
| Guest order tracking/receipt/pickup | Venue Humidor | `/smokecraft/orders*`, `orders/:orderId/pickup`, `/receipt` |
| Venue product CRUD, inventory events | Venue Humidor Admin | `/smokecraft/admin/humidor*` |
| Venue media management (upload/approve/assign) | Venue Humidor Admin | `/smokecraft/admin/humidor/media` |
| Venue order queue / order detail / handoff | Venue Humidor Admin | `/smokecraft/admin/humidor/orders*` |
| Payments ledger (venue side) | Venue Humidor Admin | `/smokecraft/admin/humidor/payments` |
| Assisted selling (staff-assisted guest ordering) | Venue Humidor Admin | `/smokecraft/admin/humidor/assisted-selling` |
| Passport stamps / acquisitions | SmokeCraft 360 + Venue Humidor | `/smokecraft/passport/acquisitions*` |
| Rewards / XP / rank | SmokeCraft 360 | `/smokecraft/rewards`, server ledger |
| Golden Box competitions | SmokeCraft 360 | `/smokecraft/golden-box/*` |
| Floor/table management (staff) | POS360 | `/pos3/tables`, `/pos3/venue-tables`, `floor-management` |
| Handheld order entry (staff) | POS360 | `/pos3/handheld` |
| Kitchen/bar display | POS360 | `/pos3` `KitchenDisplay`, `BarDisplay`, `/pos3/fulfillment-kds` |
| Humidor/inventory control (staff-level) | POS360 | `/pos3` `HumidorControl`, `InventoryControl` |
| POS checkout/payments/closeout | POS360 | `/pos3/checkout`, `/pos3/payments`, `/pos3/payments-closeout` |
| Offline sync | POS360 | `/pos3/sync` |
| Reservations/guest flow | POS360 | `/pos3/reservations` |
| Event packages/monetization | POS360 | `/pos3/event-packages` |
| Staff/labor governance | POS360 | `/pos3/staff-labor-governance` |
| POS-level reporting | POS360 | `/pos3/reports-analytics-decision` |
| POS venue admin settings | POS360 | `/pos3/settings-venue-admin` |
| External integrations (POS-level) | POS360 | `/pos3/external-integrations` |
| Self-ordering (guest kiosk mode within POS360) | POS360 | `/pos3/self-ordering` |
| Cross-department command hub (management) | E.A.T. 360 | `/eat/command-hub` |
| POS oversight (management view into POS) | E.A.T. 360 | `/eat/pos-control` |
| Cross-venue operations | E.A.T. 360 | `/eat/operations` |
| Inventory oversight (management authority) | E.A.T. 360 | `/eat/inventory`, `/eat/reorders` |
| Staff management | E.A.T. 360 | `/eat/staff` |
| Section/kitchen/bar/humidor oversight | E.A.T. 360 | `/eat/sections`, `/eat/kitchen`, `/eat/bar`, `/eat/humidor` |
| Data/reporting | E.A.T. 360 | `/eat/data`, `/eat/reports` |
| Device mode management | E.A.T. 360 | `/eat/device-mode` |
| Media library (management-level) | E.A.T. 360 | `/eat/media` |
| Settings | E.A.T. 360 | `/eat/settings` |
| SmokeCraft cross-view for management | E.A.T. 360 | `/eat/smokecraft-panel` |
| Founder/platform-wide control **[SPEC / unbuilt]** | NOVEE OS Ultra Command Center, NOVEE Vault, Remote Software Control | `ModulePlaceholder` stubs only |
| Multi-system venue-scoped hub **[SPEC / unbuilt]** | Venue Mirror Command Hub | `ModulePlaceholder` stub only |

## Boundary rules for a developer

- Never let a POS360 screen mutate SmokeCraft's guest XP/session state
  directly — it must go through the same server ledger SmokeCraft itself
  uses (see `11-ORDER-PAYMENT-FULFILLMENT-STATE-MODELS.md`).
- Never let E.A.T. 360 write directly to a specific order/table row —
  its role is oversight/reporting/authority-setting, execution stays in
  POS360 (see `03-USER-ROLES-AND-RBAC.md`).
- Venue Humidor Admin and POS360's Humidor/Inventory Control currently
  appear to be **two separate UIs over related but not confirmed-unified
  inventory concepts** — flagged as an integration question for a
  developer in `12-INVENTORY-AUTHORITY-MODEL.md`, not resolved by this
  documentation pass (no code changes made).
