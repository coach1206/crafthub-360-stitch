# 10 — Complete Route Inventory

This is a consolidated index. For full per-system detail see `07`, `08`,
`09`. All routes below were confirmed present in `src/App.jsx` by direct
grep during this documentation pass (not inferred).

## SmokeCraft customer routes (`/smokecraft/*`)

~75+ routes: 27 numbered curriculum session renderers, enrollment/identity/
venue-select/mentor-selection flow, Golden Box (13 routes), Venue Humidor
customer routes (8 routes), Passport/rewards/skill-tree/collections/
challenge-hub side content, plus many `<Navigate>` legacy-path redirects
(`intake`→`enroll`, `entry`→index, `profile`→`identity`,
`education`→`format`, `mentors`→`mentor-selection`, `humidor`→
`humidor-match`, `light`→`cut-toast-light`, `complete`→`session-complete`,
`gold-box`→`golden-box`, `mentor`→`mentor-selection`,
`shape-size-burn`→`format`, `challenge`→`smokecraft-challenge`,
`mini-tasting-round`→`mini-tasting`). Full list: `07-SMOKECRAFT-SCREEN-INVENTORY.md`.

## Venue Humidor admin routes (`/smokecraft/admin/humidor*`)

11 routes: dashboard, new product, inventory-events, media, product edit,
orders/history, payments, orders/:orderId/handoff, orders/:orderId,
orders (queue), assisted-selling.

## POS360 routes (`/pos3/*`, `/pos`, `/pos/table/:tableId`, `/pos360-visual-proof`)

27 routes total. Full list: `08-POS360-SCREEN-INVENTORY.md`.

## E.A.T. 360 routes (`/eat/*`, `/eat-legacy`, redirects)

15 `/eat/*` routes + `/eat-legacy` (deprecated) + 2 redirect routes
(`/command-center`, `/eat-command` → `/eat`). Full list:
`09-EAT360-SCREEN-INVENTORY.md`.

## Elevated/founder-tier routes (mostly `ModulePlaceholder` stubs)

`/novee-vault`, `/remote-software-control`, `/venue-mirror`, plus the
NOVEE OS Ultra Command Center route — all gated `allowedRoles=['admin',
'founder_level_0', 'developer']` or similar, all `demoBlocked`. See
`09-EAT360-SCREEN-INVENTORY.md` for the "adjacent unbuilt surfaces"
table.

## Sidecar role routes

- `/mentor-console` — `requiredPermission="access_mentor_console"`,
  **not** demo-blocked.
- `/dev-diagnostics` — `requiredPermission="view_diagnostics"`,
  demo-blocked.
- `/staff/pin?target=eat|pos360` — `StaffPinScreen`, the real dissolve-
  transition-driven staff mode-switch entry point (see `06`).

## Route naming/consistency notes for a developer

- `/pos3` is the code/URL namespace; `POS360` is the product/component
  naming convention used inside it (`POS360OrderLifecycle`,
  `POS360Payments`, etc.) — this is intentional (POS3 was the prior
  engineering-internal name, POS360 is the current product name) but can
  be confusing when searching the codebase. Search both terms.
- Similarly, `/eat` is the URL; `EAT*` is the component prefix; "E.A.T.
  360" is the product name used in UI copy and this document.
- `/eat-legacy` and `/pos360-visual-proof` are examples of routes kept
  live for reference/QA purposes, not part of the current intended user
  flow — do not link to them from new customer- or staff-facing UI.
