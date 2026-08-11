# E.A.T. 360 + POS360 / POS3 Handoff Package

Audit date: 2026-08-11
Branch: integration/smokecraft-main-candidate

## Verdict

STATUS: FAIL for owner acceptance.

The route tree is now complete enough for designer handoff and the SmokeCraft staff-mode bridge no longer points at a dead `/staff/pin` route. The system is not acceptance-ready because `/pos3/*` and `/eat/*` remain mostly local-state implementations, provider sync is only partially wired, real payments are not configured, and deployed Vercel preview verification was not completed in this pass.

## Canonical System Boundaries

POS360 / POS3 is the staff transaction surface: table/service mode, order entry, station routing, checkout, receipts, and SmokeCraft purchase verification. Current canonical route root is `/pos3`, with legacy `/pos` still present as the older POS3 page.

E.A.T. 360 is the management surface: command hub, operations, inventory, reorders, staff, sections, station oversight, reporting, data inspection, device mode, media, and settings. Current canonical route root is `/eat`, with legacy `/eat-legacy` still present as the older E.A.T. command page.

SmokeCraft guest flow remains separate and hands staff into POS360/POS3 or E.A.T. through staff-gated handoff controls.

## Route Inventory

### E.A.T. 360

| Route | Component | Status |
|---|---|---|
| `/eat` | `src/pages/eat/EATCommandHub.jsx` | PARTIAL, local ops data |
| `/eat/command-hub` | `src/pages/eat/EATCommandHub.jsx` | PARTIAL, alias |
| `/eat/pos-control` | `src/pages/eat/EATPosControl.jsx` | PARTIAL, local POS control bus |
| `/eat/operations` | `src/pages/eat/EATOperations.jsx` | PARTIAL, local operations panels |
| `/eat/inventory` | `src/pages/eat/EATInventory.jsx` | PARTIAL, static/local inventory |
| `/eat/reorders` | `src/pages/eat/EATReorders.jsx` | PARTIAL, static reorder suggestions |
| `/eat/staff` | `src/pages/eat/EATStaff.jsx` | PARTIAL, static staff roster |
| `/eat/sections` | `src/pages/eat/EATSections.jsx` | PARTIAL, local section layout |
| `/eat/kitchen` | `src/pages/eat/EATKitchen.jsx` | PARTIAL, local station data |
| `/eat/bar` | `src/pages/eat/EATBar.jsx` | PARTIAL, local station data |
| `/eat/humidor` | `src/pages/eat/EATHumidor.jsx` | PARTIAL, local station data |
| `/eat/data` | `src/pages/eat/EATData.jsx` | PARTIAL, local ops bus inspection |
| `/eat/reports` | `src/pages/eat/EATReports.jsx` | PARTIAL, local reporting |
| `/eat/device-mode` | `src/pages/eat/EATDeviceMode.jsx` | PARTIAL, browser/session setting |
| `/eat/media` | `src/pages/EATMediaLibrary.jsx` | PARTIAL, local media library |
| `/eat/settings` | `src/pages/eat/EATSettings.jsx` | PARTIAL, local settings |

### POS360 / POS3

| Route | Component | Status |
|---|---|---|
| `/pos3` | `src/pages/pos3/POS3Home.jsx` | PARTIAL, local ticket/table data |
| `/pos3/handheld` | `src/pages/pos3/POS3Handheld.jsx` | PARTIAL, local order entry |
| `/pos3/tables` | `src/pages/pos3/POS3Tables.jsx` | PARTIAL, local tables |
| `/pos3/venue-tables` | `src/pages/pos3/POS360TableManagement.jsx` | PARTIAL, local venue table management |
| `/pos3/venue-systems` | `src/pages/pos3/POS360VenueSystemsSetup.jsx` | PARTIAL, local venue setup |
| `/pos3/orders` | `src/pages/pos3/POS3Orders.jsx` | PARTIAL, local orders |
| `/pos3/checkout` | `src/pages/pos3/POS3Checkout.jsx` | PARTIAL, local checkout; real card processor not connected |
| `/pos3/kitchen` | `src/pages/pos3/KitchenDisplay.jsx` | PARTIAL, local KDS queue |
| `/pos3/bar` | `src/pages/pos3/BarDisplay.jsx` | PARTIAL, local bar queue |
| `/pos3/humidor` | `src/pages/pos3/HumidorControl.jsx` | PARTIAL, local humidor requests |
| `/pos3/inventory` | `src/pages/pos3/InventoryControl.jsx` | PARTIAL, local inventory |
| `/pos3/integrations` | `src/pages/pos3/POSIntegrationHub.jsx` | PARTIAL, provider UI/sample sync |
| `/pos3/settings` | `src/pages/pos3/POS3Settings.jsx` | PARTIAL, local settings |
| `/pos` | `src/pages/POS3.jsx` | LEGACY, older POS3 surface; uses more provider-sync wiring than new `/pos3/*` |

## Staff Handoff Map

| Source | Target | Behavior |
|---|---|---|
| CraftHub staff handoff tile | `/pos3` or `/eat` | Uses `StaffHandoffButton`, staff modal, saved handoff payload |
| SmokeCraft Visit Complete trigger | `/staff/pin?target=pos360` or `/staff/pin?target=eat` | Now resolves to `StaffPinHandoff`, then `StaffHandoffButton` |
| POS/E.A.T. staff surfaces | saved SmokeCraft route | `ReturnToGuestButton` appears when a resume snapshot exists |

State is stored in sessionStorage only. Guest route and progress snapshot are preserved; raw PIN and card data are not stored.

## Approved Asset Map

| System | Existing approved/reference assets | Wired status |
|---|---|---|
| E.A.T. | `public/EAT SYSTEM UPDATE 11.png`, `public/EAT system  UPDATE.png`, `public/assets/eat/eat-system-reference.png`, `public/design-references/mvp2/eat-system/*` | PARTIAL, references exist; not every management page uses a dedicated approved image |
| POS360/POS3 | `public/POS3  UPDATE.png`, `public/assets/pos3/pos3-handheld-reference.png`, `public/assets/pos3/pos3-tablet-reference.png`, `public/assets/pos360-reference/*`, `public/assets/pos3/reference-crops/*` | PARTIAL, POS3 home/table imagery is wired; many reference/contact-sheet assets remain handoff references |
| SmokeCraft handoff context | `public/assets/smokecraft/MANAGEMENT SYNC.png`, `public/assets/smokecraft/POS 3 SYSTEM.png`, `public/assets/smokecraft/EAT SYSTEM.png` | PARTIAL, SmokeCraft visuals preserved; no replacement performed |

## Integration Matrix

| Integration | Status | Notes |
|---|---|---|
| Clover | PARTIAL | Backend provider sync exists under `/api/pos3/providers/*`; new `/pos3/*` UI does not fully consume it |
| Toast | PARTIAL | Same provider sync status as Clover |
| Square | PARTIAL | Same provider sync status as Clover |
| Lightspeed | NOT CONNECTED | No verified live adapter wiring in current POS3 journey |
| Shopify | NOT CONNECTED | No verified live adapter wiring in current POS3 journey |
| Stripe | NOT CONNECTED | Card/split payment paths are not configured for live processing |
| Manual/provider-neutral mode | SIMULATED | Local POS flow works on localStorage data |
| KDS/station routing | SIMULATED | Kitchen/bar/humidor queues are local |
| Inventory | SIMULATED/PARTIAL | Local inventory signals; generic backend inventory tables exist but are not wired to POS/E.A.T. pages |
| SmokeCraft handoff | PARTIAL | Staff bridge and return route wired; backend handoff is best-effort/fallback |
| E.A.T. management sync | PARTIAL | Management Sync page reports fallback when backend is absent |

## Designer Constraints

Designer may change typography hierarchy, spacing, opacity, panel treatment, visual depth, image positioning, responsive polish, and transitions.

Designer must not change route sequence, transaction logic, backend contracts, session state, payment integrity, reward integrity, POS/E.A.T. separation, owner-approved images, live DOM controls, staff/guest restoration, or integration contracts.

## Proof References

Visual proof already present:
- `docs/visual-proof/eat-command-center-rendered.png`
- `docs/visual-proof/eat-operations-rendered.png`
- `docs/visual-proof/eat-sections-rendered.png`
- `docs/visual-proof/pos3-handheld-rendered.png`
- `docs/visual-proof/pos3-tables-rendered.png`
- `docs/visual-proof/pos3-checkout-rendered.png`
- `public/proof/smokecraft-responsive-verification/003-primary-1180x820.png`

Functional proof for this pass:
- `docs/eat-pos360-handoff/functional-proof.json`
- `docs/eat-pos360-handoff/route-integration-matrix.json`
- `docs/eat-pos360-handoff/browser-proof/browser-proof-results.json`

## Known Blockers

- Deployed Vercel preview URL was not available in this workspace, so deployed preview verification is BLOCKED.
- Deployed preview verification still requires a Vercel preview URL/access.
- New `/pos3/*` and `/eat/*` pages remain local-state heavy and are not fully attached to first-party DB tables.
- Real card payments/tip/signature/provider token flows are not configured.
- Provider sync backend exists, but current `/pos3/*` UI does not fully consume it.
- First-party POS/E.A.T. persistence tables are incomplete or unwired for native tables, tickets, queues, payments, receipts, staff assignments, and sections.
