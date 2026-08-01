# 09 — E.A.T. 360 Screen Inventory (Management)

Source: `src/App.jsx` route tree under `path="eat"` (gated by
`requiredPermission="access_eat_command"`, `demoBlocked`), plus
`src/pages/eat/*.jsx` (15 files). **No dedicated proof/verification
package exists for E.A.T. 360** — this inventory documents what is
routed and coded, not what has been tested end-to-end. This is the
thinnest-proven system on the platform.

## E.A.T. 360 core (`/eat/*`)

| Route | Component | Purpose (from component naming/context) |
|---|---|---|
| `/eat` (index), `/eat/command-hub` | `EATCommandHub` | Cross-department management command hub |
| `/eat/pos-control` | `EATPosControl` | Management oversight into POS |
| `/eat/operations` | `EATOperations` | Cross-venue operations |
| `/eat/inventory` | `EATInventory` | Inventory oversight/authority |
| `/eat/reorders` | `EATReorders` | Reorder signal review |
| `/eat/staff` | `EATStaff` | Staff management |
| `/eat/sections` | `EATSections` | Section oversight |
| `/eat/kitchen` | `EATKitchen` | Kitchen oversight |
| `/eat/bar` | `EATBar` | Bar oversight |
| `/eat/humidor` | `EATHumidor` | Humidor oversight (management level) |
| `/eat/data` | `EATData` | Data view |
| `/eat/reports` | `EATReports` | Reporting |
| `/eat/device-mode` | `EATDeviceMode` | Device mode management |
| `/eat/media` | `EATMediaLibrary` | Management-level media library |
| `/eat/settings` | `EATSettings` | Settings |
| `/eat/smokecraft-panel` | `EATSmokeCraftPanel` | Management view into SmokeCraft activity |

**15 routed E.A.T. 360 screens.** All real files, all real routes, no
proof coverage.

## Legacy surface

`/eat-legacy` — explicitly documented in `App.jsx`'s own comments as "the
older surface," moved aside so the new `/eat/*` system could take over
the canonical `/eat` route. A UI/UX developer should treat `/eat-legacy`
as deprecated reference material, not a screen to extend.

## Redirects into the new hub

`/command-center` and `/eat-command` both `<Navigate to="/eat" replace />`
— confirms `/eat` is the intended single canonical E.A.T. entry point.

## Adjacent, explicitly unbuilt "higher tier" surfaces [SPEC / unbuilt]

These are gated by `allowedRoles` in `App.jsx` but render
`<ModulePlaceholder>` — a component that displays a `title`, `purpose`
string, and a `phases` array of *future* build steps. They are **not**
part of the built E.A.T. 360 screen set and must not be presented to a
developer as working screens:

| Route | Title (as declared) | Declared purpose |
|---|---|---|
| `/novee-os-ultra-command-center` (approx., see `App.jsx` ~708) | NOVEE OS Ultra Command Center | "Master control system for venues, licenses, modules, deployments, vault data, diagnostics, users, roles, security, analytics, and remote updates." |
| `/novee-vault` | NOVEE Vault | "Secure system of record for venue accounts, licenses, identities, profiles, E.A.T., POS, assets, legal, deployments, audit logs, support, and release records." |
| `/remote-software-control` | Remote Software Control | "Deployment control for UI updates, module releases, content pushes, E.A.T., POS 3, ticker, legal, demo mode, and role access updates." |
| `/venue-mirror` | Venue Mirror Command Hub | "Establishment-level command hub for local E.A.T., POS 3, CraftHub, Passport members, staff activity, events, specials, ticker, reports, and venue settings scoped by venueId." |

Each `ModulePlaceholder`'s `phases` array is itself the clearest evidence
these are pre-implementation stubs — e.g. Venue Mirror's declared phases
are `['Bind selected venueId', 'Connect local E.A.T. and POS 3 data', 'Add tenant-safe manager actions']`,
none of which are done.

## Honesty summary for this file

E.A.T. 360 has real, routed, coded screens (15 of them) — it is not
vaporware. But relative to SmokeCraft (75+ proof-verified screens) and
even POS360 (24+ routed, code-complete screens), E.A.T. 360's screens are
comparatively thin, have zero dedicated proof/test coverage, and the
platform's own code signals (the `ModulePlaceholder` stubs one tier up)
that the E.A.T. brand still has aspirational, unbuilt surface area beyond
what exists today.
