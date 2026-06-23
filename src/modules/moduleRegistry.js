// CraftHub module registry — Phase 2 foundations.
//
// This registry is a descriptive catalog of modules that CraftHub hosts and
// that a future Novi OS could observe/control. Registering a module here
// does NOT wire it to anything yet — no routing, permission, or runtime
// behavior changes as a result of this file existing. It is read-only
// metadata, intended as the seam Phase 3+ work can build an actual
// integration against.
//
// Hard rule carried over from the Phase 1 audit: Novi OS should CONTROL
// these modules, not DUPLICATE them. This registry deliberately holds only
// references/config, never copies of screens, session state, or backend data.

import { smokeCraftModuleConfig } from './smokecraft/smokeCraftModule.config.js'

const pos3ModuleConfig = {
  id: 'pos3',
  name: 'POS 3',
  version: '1.0.0',
  standalone: true,
  // POS 3 is intentionally NOT made to depend on SmokeCraft. SmokeCraft may
  // optionally hand off to POS 3 (see smokeCraftModuleConfig.connections.pos3),
  // but POS 3 has no reverse dependency and must keep working with SmokeCraft
  // absent entirely.
  routes: {
    entry: '/pos3',
    staffEntry: '/pos3/handheld',
  },
  permissions: {
    guestAccess: false,
    requiredPermission: 'access_pos3_staff',
  },
  passportSupport: { enabled: false },
  connections: {
    smokecraft: { optional: true, direction: 'receives-handoff-from-smokecraft' },
    eatCommandHub: { optional: true, service: 'server/routes/pos3IntegrationRoutes.js' },
  },
  vendor: { vendorId: null, vendorName: null, vendorConfig: {} },
}

const eatCommandHubModuleConfig = {
  id: 'eat-command-hub',
  name: 'E.A.T. Command Hub',
  version: '1.0.0',
  standalone: true,
  // Same rule as POS 3 — E.A.T. does not depend on SmokeCraft. It optionally
  // receives event-driven signals (kitchen/bar/humidor) that SmokeCraft may
  // trigger, but must keep working with SmokeCraft absent entirely.
  routes: {
    entry: '/eat',
    commandHub: '/eat/command-hub',
  },
  permissions: {
    guestAccess: false,
    requiredPermission: 'access_eat_command',
  },
  passportSupport: { enabled: false },
  connections: {
    smokecraft: { optional: true, route: 'server/routes/smokecraftEatRoutes.js', direction: 'receives-signal-from-smokecraft' },
    pos3: { optional: true, service: 'server/routes/pos3IntegrationRoutes.js' },
  },
  vendor: { vendorId: null, vendorName: null, vendorConfig: {} },
}

// Atmosphere Control has no dedicated module today. The only existing
// "atmosphere" code is SmokeCraft's own visual background component
// (SmokeCraftAtmosphericBackground in src/components/smokecraft/
// SmokeCraftPremium.jsx) — there is no standalone Atmosphere system, no
// route, and no backend. This entry is registered as an honest placeholder
// for a future module, not a description of something that exists yet.
const atmosphereModuleConfig = {
  id: 'atmosphere',
  name: 'Atmosphere Control',
  version: '0.0.0-placeholder',
  standalone: true,
  status: 'not_built',
  notes: 'No dedicated Atmosphere Control module exists yet. Only SmokeCraft-local atmospheric background visuals exist today (src/components/smokecraft/SmokeCraftPremium.jsx). This entry exists so Novi OS has a known module id to target once a real Atmosphere module is built.',
  routes: { entry: null },
  permissions: { guestAccess: false, requiredPermission: null },
  passportSupport: { enabled: false },
  connections: {},
  vendor: { vendorId: null, vendorName: null, vendorConfig: {} },
}

export const moduleRegistry = {
  smokecraft: smokeCraftModuleConfig,
  pos3: pos3ModuleConfig,
  'eat-command-hub': eatCommandHubModuleConfig,
  atmosphere: atmosphereModuleConfig,
}

export function getModule(id) {
  return moduleRegistry[id] || null
}

export function listModules() {
  return Object.values(moduleRegistry)
}

export default moduleRegistry
