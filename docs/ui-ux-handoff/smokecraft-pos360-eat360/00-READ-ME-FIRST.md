# 00 — Read Me First

## What this package is

A complete UI/UX developer handoff for the connected **SmokeCraft
POS360-EAT360** platform inside CrafthHub 360 Stitch: the customer-facing
**SmokeCraft 360** education game and **Venue Humidor** commerce surface,
the staff-facing **POS360** floor/fulfillment system, and the
management-facing **E.A.T. 360** oversight system.

This package is **documentation only**. It was produced by reading the
real repository — routes, components, contracts, permission tables,
design tokens — and by mining prior verified proof packages under
`public/proof/smokecraft-*`. It does not modify any application code,
database schema, migration, payment logic, or inventory logic.

## How real is each part? (read this before anything else)

| System | Build maturity | Evidence |
|---|---|---|
| **SmokeCraft 360** (27-session game) | **Extensively built, server-verified, screenshot-proven** | `public/proof/smokecraft-final-gameplay-acceptance/`, `smokecraft-full-game-fresh-player-closure/`, `smokecraft-required-interaction-package-a..f/` |
| **Venue Humidor** (customer cigar ordering) | **Extensively built, server-verified, screenshot-proven**, including a dedicated Media Management pass | `public/proof/smokecraft-venue-humidor-media-management/`, `smokecraft-venue-humidor-1a..1b-2b-6/` |
| **POS360** (staff floor/fulfillment) | **Real, substantial UI code exists** (`/pos3/*`, 20+ screens, a real RBAC module `pos360Permissions.js`) but **no dedicated screenshot/API proof package exists for it** anywhere in `public/proof/`. Treat as implemented-but-unverified from a UI/UX handoff standpoint. | `src/pages/pos3/*.jsx`, `src/modules/pos360Permissions.js`, `src/components/staff/ManualPOS360HandoffPanel.jsx` |
| **E.A.T. 360** (management oversight) | **Real routed screens exist** (`/eat/*`, 15 screens) but they are thinner than POS360/SmokeCraft, and — like POS360 — **have no dedicated proof package**. Several nearby "command hub" surfaces (`novee-vault`, `remote-software-control`, `venue-mirror`) are explicit `ModulePlaceholder` stubs, not built screens. | `src/pages/eat/*.jsx`, `src/App.jsx` lines ~896-923 |
| **Confirmed screen dissolve + tracking transition** | A real component (`RippleDissolveTransition`) implements a gold-ripple/smoke-dissolve overlay with a `target` prop for `pos360`/`eat`/`smokecraft`/`guest`, and it **is wired live** into staff PIN mode-switching (`/staff/pin?target=eat|pos360`) and guest↔staff handoff buttons. It is **not** used for customer order-status tracking transitions — that specific use is a real gap. See `06-SCREEN-DISSOLVE-AND-TRACKING-STANDARD.md`. | `src/components/transitions/RippleDissolveTransition.jsx`, `src/pages/staff/StaffPinScreen.jsx` |

**Do not read this package as "everything below is equally proven."**
Every section below states, explicitly, whether it describes shipped/
verified behavior or a design specification for something partially built
or not yet built. Where content is aspirational, it is labeled
**[SPEC / GAP]**.

## Who this is for

A UI/UX developer who has never opened this repository, brought on to
finish, polish, or extend the platform's interface. No prior context is
assumed.

## How to use this package

1. Start here, then read `01` through `03` for the product/role model.
2. Read `04`-`06` for the cross-system customer→staff→manager journey and
   the dissolve/handoff pattern.
3. Read `07`-`10` for the concrete screen and route inventories per
   system.
4. Read `11`-`12` for the data/state models behind orders, payment,
   fulfillment, inventory, Passport, rewards, and audit.
5. Read `13`-`15` for the design system, responsive/accessibility rules,
   and error/exception handling standard.
6. Read `16` for the investor-demo path (SmokeCraft/Venue Humidor only —
   the only systems with a proven demo path).
7. Read `17`-`19` for known defects, the implementation checklist, and a
   full index of this package's contents.

## Source material used

- `public/proof/smokecraft-final-gameplay-acceptance/*`
- `public/proof/smokecraft-full-game-fresh-player-closure/*`
- `public/proof/smokecraft-venue-humidor-media-management/*`
- `public/proof/smokecraft-required-interaction-package-{a..f}/*`
- `src/App.jsx` (route registry, ~1,150 lines)
- `src/constants/smokecraftRequiredInteractions.js`, `smokecraftScreenManifest.js`, `smokecraftNavigationRegistry.js`
- `src/modules/pos360Permissions.js`, `src/modules/smokecraft/**`
- `src/components/transitions/RippleDissolveTransition.jsx`
- `src/components/staff/ManualPOS360HandoffPanel.jsx`, `StaffStatusBadge.jsx`, `TableCard.jsx`
- `tailwind.config.js` (design tokens)
- `src/pages/pos3/*.jsx` (14 files), `src/pages/eat/*.jsx` (15 files)

## Package location

- Docs: `docs/ui-ux-handoff/smokecraft-pos360-eat360/`
- Screenshots: `docs/ui-ux-handoff/smokecraft-pos360-eat360/screenshots/`
- Diagrams: `docs/ui-ux-handoff/smokecraft-pos360-eat360/diagrams/`
- Shareable ZIP: `public/handoff/SmokeCraft-POS360-EAT360-UIUX-Handoff.zip`
