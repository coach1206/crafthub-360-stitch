# Phase 7G — Button / Functionality QA

Audit of every button/tile/tab/card across the screens touched in Phases 7A–7F. Source: direct file reads (7D/7E/7F) plus a targeted audit pass (7A/7B/7C, see agent findings folded in below).

## 7A — Premium components (`src/components/premium/PremiumPanel.jsx`)

| Element | File | Behavior | Wired | Disabled | Reason | Needs backend | Risk |
|---|---|---|---|---|---|---|---|
| `PremiumButton` | PremiumPanel.jsx | Forwards `onClick`/`disabled` from caller | n/a (generic) | n/a | n/a | No | Low |
| `PremiumCommandTile` | PremiumPanel.jsx | Forwards `onClick`, requires `disabledReason` when `disabled` | n/a (generic) | n/a | Caller-supplied | No | Low |

No decorative-only buttons — this file only defines reusable primitives whose wiring is determined by callers.

## 7B — SmokeCraft / Passport

| Element | File | Behavior | Wired | Disabled | Reason | Needs backend | Risk |
|---|---|---|---|---|---|---|---|
| 360 Passport card | `pages/SmokeCraft.jsx` (~L286) | `onClick={() => navigate('/passport')}` on the card | Yes | No | — | No | Low |
| "View Passport" inner row | `pages/SmokeCraft.jsx` L309 | Styled `cursor:pointer` but no own `onClick`; relies on parent card's handler | Yes (via parent) | No | — | No | Low — cosmetic risk only if refactored independently of parent; flagged for future cleanup, not a functional bug today |
| Passport Connections actions | `pages/passport/PassportConnections.jsx` | Navigate / call API / open-close modal per button | Yes | n/a | — | Some (consent-gated networking actions) | Low |

## 7C — NOVEE / Admin

| Element | File | Behavior | Wired | Disabled | Reason | Needs backend | Risk |
|---|---|---|---|---|---|---|---|
| Remote-push action buttons | `components/commandhub/CommandHub.jsx` (~L764-771) | Disabled with tooltip reason | No | Yes | Stated in tooltip | Yes | Low |
| Notifications bell | `components/commandhub/CommandHub.jsx` (~L589) | Disabled with tooltip reason | No | Yes | Stated in tooltip | Yes | Low |
| Static summary/ecosystem/vault tiles | `components/commandhub/CommandHub.jsx` | Plain divs, no `cursor:pointer`, no onClick | n/a (display-only, not styled as clickable) | n/a | — | No | Low |
| Admin login submit | `pages/AdminLogin.jsx` | `handleSubmit` → `loginAdmin()` | Yes | No | — | No (local auth) | Low |
| CRAFT_MODULES tiles | `pages/PublicCraftHubLanding.jsx` (~L76-90) | Static status cards, not styled clickable | n/a | n/a | — | No | Low |
| NoveeHome card tiles | `pages/NoveeHome.jsx` | `openCard(card)` → navigate or open external URL | Yes | n/a | — | No | Low |

## 7D — POS 3 Handheld (`src/pages/pos3/POS3Handheld.jsx`)

| Element | Behavior | Wired | Disabled | Reason | Needs backend | Risk |
|---|---|---|---|---|---|---|
| Notifications bell (header) | **Fixed this phase** — was rendered clickable with no `onClick` (decorative). Now `disabled`, `opacity:0.45`, `cursor:not-allowed` | No | Yes | "Notification center is not yet built" | Yes | Low (fixed) |
| Scan Table | `disabled`, tooltip | No | Yes | "Table QR scanning is not yet wired — coming soon" | Yes | Low |
| Quick Actions | `onClick={newTicket}` | Yes | No | — | No | Low |
| My Tables "View All" | `navigate('/pos3/tables')` | Yes | No | — | No | Low |
| Active Orders "View All" | `navigate('/pos3/orders')` | Yes | No | — | No | Low |
| + New Order | `newTicket()` | Yes | No | — | No | Low |
| 6 category tiles | `setTab()` catalog filter | Yes | No | — | No | Low |
| Payment Card/Cash | Opens real `CheckoutDrawer` | Yes | No | — | No | Low |
| View Humidor | `navigate('/pos3/humidor')` | Yes | No | — | No | Low |
| Bottom nav Home/Tables/Orders/More | Real routes | Yes | No | — | No | Low |
| Bottom nav Messages | `disabled`, tooltip | No | Yes | "Staff messaging is not yet built" | Yes | Low |

## 7E — E.A.T. Command Hub (`src/pages/eat/EATCommandHub.jsx`)

| Element | Behavior | Wired | Disabled | Reason | Needs backend | Risk |
|---|---|---|---|---|---|---|
| Tabs: Sections & Zones, Staff Assignment | `navigate('/eat/sections')`, `navigate('/eat/staff')` | Yes | No | — | No | Low |
| Tabs: Floor Plan, Table Assignment, Reservations | `disabled`, per-tab tooltip | No | Yes | "...is not yet built" (per feature) | Yes | Low |
| Switch Mode | `navigate('/system-overview')` | Yes | No | — | No | Low |
| Mark Received / Mark Completed (ops feed) | `receiveCommand`/`completeCommand` → real `opsControlBridge` | Yes | No | — | No (already real) | Low |
| Staff Assignment / Sections & Zones "View" links | Real routes | Yes | No | — | No | Low |
| Open Operations View | `navigate('/eat/operations')` | Yes | No | — | No | Low |
| SyncStatusPanel / SyncConflictReviewPanel / SyncAuditTimelinePanel | Real, unchanged staff tools | Yes | No | — | No | Low (manager-gated) |

## 7F — DayOne360 (`src/pages/DayOneTravel.jsx`)

| Element | Behavior | Wired | Disabled | Reason | Needs backend | Risk |
|---|---|---|---|---|---|---|
| Plan Travel | Scrolls to destinations section | Yes | No | — | No | Low |
| Request Concierge (top button, FAB, destination card "Request This Destination", trip modal "Request This Journey") | All open the real concierge form | Yes | No | — | No | Low |
| Concierge form Submit | `POST /api/travel/concierge`, shows real backend message or honest error | Yes | No | — | Yes (already wired) | Low — confirmed graceful failure handling (try/catch → "Request could not be sent. Please try again.") |
| Travel Stamps / Claim Stamp | `GET/POST /api/travel/stamps`, re-fetches real ledger | Yes | No | — | Yes (already wired) | Low |
| View Passport | `navigate('/passport')` | Yes | No | — | No | Low |
| 10 Concierge Service tiles | `disabled`, per-tile tooltip | No | Yes | "Booking gateway not connected" / "Concierge workflow not connected yet" / "Vendor system not connected" | Yes | Low |
| Bottom nav Home/Reserve/Passport/Profile | Real routes | Yes | No | — | No | Low |

## Summary

- **1 decorative-only button found and fixed this phase**: the POS3Handheld notification bell (now honestly disabled).
- **0 decorative-only buttons remain** across all audited 7A–7F screens after the fix.
- Every button that calls a backend (DayOne360 concierge/stamps, E.A.T. ops bridge) handles failure with an honest message rather than a silent or fabricated success.
- All disabled buttons in touched screens carry a specific, accurate reason string (no generic "Coming Soon" placeholders).
