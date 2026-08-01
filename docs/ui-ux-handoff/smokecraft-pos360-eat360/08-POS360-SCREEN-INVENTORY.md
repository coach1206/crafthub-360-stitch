# 08 — POS360 Screen Inventory (Staff)

Source: `src/App.jsx` route tree under `path="pos3"` (gated by
`requiredPermission="access_pos3_staff"`, `demoBlocked`), plus
`src/pages/pos3/*.jsx`. **No dedicated proof/verification package exists
for these screens** — this inventory documents what is routed and coded,
not what has been tested end-to-end.

## Venue Humidor Admin (staff-facing back office — proof-covered separately)

`/smokecraft/admin/humidor` (dashboard), `.../new`,
`.../inventory-events`, `.../media`, `.../:cigarId/edit`,
`.../orders/history`, `.../payments`, `.../orders/:orderId/handoff`,
`.../orders/:orderId`, `.../orders`, `.../assisted-selling`. These are
technically mounted under the SmokeCraft/Venue Humidor route tree, not
`/pos3`, but are the staff-facing commerce back office and functionally
belong to the "staff receiving and fulfillment" surface described in the
task brief. **This part is proof-covered** — see `smokecraft-venue-humidor-media-management`.

## POS360 core (`/pos3/*`) — real routes, unverified end-to-end

| Route | Component | Purpose (from component naming/context) |
|---|---|---|
| `/pos3` (index) | `POS3` | Legacy/base POS3 shell |
| `/pos3/handheld` | `POS3Handheld` / `POS360HandheldPOS` | Handheld order entry |
| `/pos3/tables` | `POS3Tables` | Table list/status |
| `/pos3/venue-tables` | `POS360TableManagement` | Floor table management |
| `/pos3/venue-systems` | `POS360VenueSystemsSetup` | Venue systems configuration |
| `/pos3/orders` | `POS3Orders` / `POS360OrderLifecycle` | Order lifecycle view |
| `/pos3/checkout` | `POS3Checkout` | POS checkout |
| `/pos3/settings` | `POS3Settings` | POS settings |
| `/pos3/smokecraft-checkout` | `POS360SmokeCraftCheckout` | Checkout flow specific to SmokeCraft-originated orders |
| `/pos3/floor-management` | `POS360FloorManagement` | Floor layout management |
| `/pos3/menu-builder` | `POS360VenueMenuBuilder` | Menu authoring |
| `/pos3/production` | `POS360ProductionDisplay` | Kitchen/production display |
| `/pos3/sync` | `POS360OfflineSync` | Offline sync status/control |
| `/pos3/payments` | `POS360Payments` | Payments |
| `/pos3/guests` | `POS360CustomerLoyalty` | Guest loyalty view |
| `/pos3/reservations` | `POS360ReservationsGuestFlow` | Reservations/guest flow |
| `/pos3/event-packages` | `POS360EventPackagesMonetization` | Event packages/monetization |
| `/pos3/payments-closeout` | `POS360PaymentsCloseout` | Shift/payment closeout |
| `/pos3/staff-labor-governance` | `POS360StaffLaborGovernance` | Staff/labor governance |
| `/pos3/reports-analytics-decision` | `POS360ReportsAnalyticsDecision` | POS-level reporting |
| `/pos3/settings-venue-admin` | `POS360SettingsVenueAdmin` | Venue admin settings (POS-scope) |
| `/pos3/external-integrations` | `POS360ExternalIntegrations` | External integrations |
| `/pos3/fulfillment-kds` | `POS360FulfillmentKds` | Kitchen display system for fulfillment |
| `/pos3/self-ordering` | `POS360SelfOrdering` | Guest self-ordering kiosk mode |
| `/pos3/production-readiness` | `POS360ProductionReadiness` | Production-readiness status screen |
| `/pos360-visual-proof` (top-level, not under `/pos3`) | `POS360VisualProof` | Internal visual-proof/QA screen |

## Additional POS360 components used across the above screens

`src/pages/pos3/BarDisplay.jsx`, `KitchenDisplay.jsx`,
`HumidorControl.jsx`, `InventoryControl.jsx`, `POSIntegrationHub.jsx` —
14 files total in `src/pages/pos3/`.

## Supporting shared components

- `src/components/staff/TableCard.jsx`, `TableActionMenu.jsx`,
  `StaffStatusBadge.jsx`, `ManualPOS360HandoffPanel.jsx`.
- `src/components/pos3/shell/CommandAppShell.jsx` — shared
  five-zone layout shell (rail/top bar/canvas/right panel/bottom strip)
  intended to be reused across POS360/E.A.T. command screens. Its own
  header comment states this is the "MVP2 structure-reset fix" — implying
  a prior period where each screen hand-rolled its own layout.

## Screen count summary

**24 distinct routed POS360 screens** at `/pos3/*` plus **1 top-level QA
screen**, plus the **11 Venue Humidor admin screens** that functionally
serve the same staff-receiving-and-fulfillment role. Substantial real UI
surface; zero dedicated proof package. Treat every screen in this file as
**implemented but unverified** unless it also appears in
`02-PLATFORM-RESPONSIBILITY-MAP.md`'s Venue Humidor rows.
