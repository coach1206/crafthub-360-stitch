# Phase 7G — Route / Functionality Map

Verified directly against `src/App.jsx` (675 lines, single route tree). "Access level" reflects the actual `ProtectedRoute` wrapper (or absence of one) found in that file — not assumed.

## NOVEE OS / Command Hub / Manager-Admin Access

| Route | Component | Access | Purpose | Major actions | Wired/disabled/route-backed | Limitations | Risk |
|---|---|---|---|---|---|---|---|
| `/home` (NOVEE OS shell) | `pages/NoveeHome.jsx` | guest (no gate) | Module launcher | Card tiles → `openCard()` (navigate or open external) | Wired | None significant | Low |
| `/novee-home` | `pages/Home.jsx` | `ProtectedRoute allowedRoles=[admin,founder_level_0,developer]`, demoBlocked | NOVEE OS Command Hub | `CommandHub.jsx` tiles | Wired/disabled per tile (see button QA) | Some sections informational only | Low |
| `/admin-login`, `/staff-login`, `/founder-login`, `/mentor-login`, `/dev-login` | respective `*Login.jsx` | public (pre-auth) | Role-specific sign-in | Submit → `loginX()` | Wired | None | Low |
| `/admin` | `pages/Admin.jsx` (lazy) | `ProtectedRoute allowedRoles=[admin,founder_level_0]`, demoBlocked | Admin console | n/a (not redesigned in Phase 7) | Route-backed | Out of Phase 7 scope | Low |
| `/founder` | `pages/FounderControl.jsx` (lazy) | `ProtectedRoute allowedRoles=[founder_level_0]`, demoBlocked | Founder-only console | n/a | Route-backed | Out of Phase 7 scope | Low |
| `/ultra-command-center`, `/novee-vault`, `/remote-software-control` | `ModulePlaceholder` | `ProtectedRoute allowedRoles=[admin,founder_level_0,developer]`, demoBlocked | Future founder/admin master-control surfaces | None — explicit `ModulePlaceholder` | Honestly placeholder, not faked | Low (clearly labeled not-yet-built) |
| `/venue-mirror` | `ModulePlaceholder` | `ProtectedRoute allowedRoles=[manager,admin,founder_level_0]`, demoBlocked | Future venue-scoped manager hub | None | Honest placeholder | Low |
| `/system-overview` | `pages/SystemOverview.jsx` (lazy) | `ProtectedRoute allowedRoles=[manager,admin,founder_level_0]`, demoBlocked | System status dashboard | n/a | Route-backed | Out of Phase 7 scope | Low |

## SmokeCraft (guest flow)

| Route | Component | Access | Purpose | Limitations | Risk |
|---|---|---|---|---|---|
| `/smokecraft` and ~40 nested sub-routes (`enroll`, `golden-box`, `mentor-selection`, `leaf-challenge`, `pairing`, `scorecard`, etc.) | `pages/smokecraft/*.jsx` | guest (no gate), demo-allowed | Full guided cigar-education guest journey | Pre-Phase-7 functionality untouched this phase; only verified, not redesigned | Low |

## 360 Passport / Passport Connections

| Route | Component | Access | Purpose | Limitations | Risk |
|---|---|---|---|---|---|
| `/passport`, `/passport/profile`, `/passport/stamps`, `/passport/directory`, `/passport/events`, `/passport/benefits`, `/passport/scan`, `/passport/how-it-works` | `pages/passport/*.jsx` | guest (no gate), demo-allowed | Passport dashboard, stamps, directory, events | Phase 7B work, verified not redone | Low |
| `/passport/connections` | `pages/passport/PassportConnections.jsx` | guest | Networking/connections UI | Verified no decorative buttons (Phase 7G audit) | Low |
| `/passport-networking` | `pages/PassportConnection.jsx` | guest | Legacy connection screen | Older surface, kept alongside `/passport/connections` | Low |

## POS 3

| Route | Component | Access | Purpose | Wired/disabled | Limitations | Risk |
|---|---|---|---|---|---|---|
| `/pos3` (index), `/pos3/tables`, `/pos3/orders`, `/pos3/checkout`, `/pos3/kitchen`, `/pos3/bar`, `/pos3/humidor`, `/pos3/inventory`, `/pos3/integrations`, `/pos3/settings` | `pages/pos3/*.jsx` | `ProtectedRoute requiredPermission="access_pos3_staff"`, demoBlocked | Tablet/desktop staff POS | Route-backed, ticket/order logic real | Out of Phase 7D/7E redesign scope except handheld | Low |
| `/pos3/handheld` | `pages/pos3/POS3Handheld.jsx` | same `access_pos3_staff` gate | Staff handheld home (Phase 7D redesign) | Scan Table disabled (reason given), Quick Actions/My Tables/Active Orders/category tiles/Payment/Humidor/bottom nav wired to real services; Messages disabled (reason given); notification bell fixed this phase to be honestly disabled (was decorative — see Section I) | Staff messaging and table-QR scan genuinely not built yet | Low |
| `/pos` , `/pos/table/:tableId` | `pages/POS3.jsx` | `ProtectedRoute requiredPermission="access_pos3_staff"`, demoBlocked | Legacy POS surface, kept alongside `/pos3` | Route-backed | Legacy, not redesigned in Phase 7 | Low |

## E.A.T.

| Route | Component | Access | Purpose | Wired/disabled | Limitations | Risk |
|---|---|---|---|---|---|---|
| `/eat` (index), `/eat/command-hub` | `pages/eat/EATCommandHub.jsx` | `ProtectedRoute requiredPermission="access_eat_command"`, demoBlocked | Venue command center (Phase 7E redesign) | Sections & Zones / Staff Assignment tabs wired; Floor Plan / Table Assignment / Reservations disabled with reasons; Live Ops Feed, Revenue/Tickets/Inventory/Staff panels, Sync panels all real and unchanged | Floor-plan editor, table assignment, reservations not built | Low |
| `/eat/pos-control`, `/eat/operations`, `/eat/inventory`, `/eat/reorders`, `/eat/staff`, `/eat/sections`, `/eat/kitchen`, `/eat/bar`, `/eat/humidor`, `/eat/data`, `/eat/reports`, `/eat/device-mode`, `/eat/media`, `/eat/settings` | `pages/eat/*.jsx` | same `access_eat_command` gate (inherited via parent `<Route path="eat">` wrapper) | Manager tools | Route-backed | Out of Phase 7E redesign scope | Low |
| `/eat-legacy` | `pages/EATCommand.jsx` | `ProtectedRoute requiredPermission="access_eat_command"`, demoBlocked | Legacy E.A.T. surface | Route-backed | Legacy, kept for compatibility | Low |

## DayOne360

| Route | Component | Access | Purpose | Wired/disabled | Limitations | Risk |
|---|---|---|---|---|---|---|
| `/dayone360-travel`, `/dayone360` | `pages/DayOneTravel.jsx` | guest (no gate) | Concierge/travel screen (Phase 7F redesign) | Trips fetched from real `/api/travel/trips`; Concierge form posts to real `/api/travel/concierge`; stamps fetched/claimed via real `/api/travel/stamps`; 10 service tiles disabled with reasons | Only one real screen exists; service tiles and journey-phase progression have no backing workflow yet | Low |

## Staff-only sync/audit/conflict tools

| Component | Mounted in | Access | Risk |
|---|---|---|---|
| `components/staff/SyncStatusPanel.jsx` | `pages/eat/EATCommandHub.jsx` (manager-gated), `components/pos3/integrations/POSSyncStatusPanel.jsx` → `pages/pos3/POSIntegrationHub.jsx` (staff-gated) | Staff/manager only | Low — confirmed no guest-route import |
| `components/staff/SyncConflictReviewPanel.jsx` | `pages/eat/EATCommandHub.jsx` only | Manager only | Low |
| `components/staff/SyncAuditTimelinePanel.jsx` | `pages/eat/EATCommandHub.jsx` only | Manager only | Low |

All three Sync panels resolve to zero guest-route imports — verified by grep (see `docs/phase-7g-access-boundary-qa.md`).
