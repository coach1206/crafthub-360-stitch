// SmokeCraft 360 — module configuration.
// Describes SmokeCraft as a registrable module for the module registry
// (src/modules/moduleRegistry.js). This is descriptive metadata only —
// it does not change routing, permissions, or guest flow behavior.
// Sourced directly from src/App.jsx, src/constants/session.js, and
// docs/phase-1-crafthub-smokecraft-audit.md.

import { ENTRY_LAYER_SCREENS, SUPPORTING_MODULES, TOTAL_PHASES, TOTAL_SESSIONS, VISIT_STRUCTURE } from '../../constants/session.js'

const canonicalEntryFlow = ENTRY_LAYER_SCREENS
  .filter(step => step.id !== 'resume')
  .map(step => ({ id: step.id, route: step.route, label: step.label, kind: 'entry-layer' }))

const canonicalSpineFlow = VISIT_STRUCTURE.flatMap(phase =>
  phase.sessions
    .filter(session => !session.mergedInto)
    .map(session => ({
      id: session.id,
      route: session.route,
      label: session.label,
      phase: phase.visit,
      session: session.session,
      kind: 'spine-session',
    }))
)

const canonicalSupportingFlow = SUPPORTING_MODULES.map(module => ({
  id: module.id,
  route: module.route,
  label: module.label,
  requires: module.requires,
  kind: 'supporting-module',
}))

export const smokeCraftModuleConfig = {
  id: 'smokecraft',
  name: 'SmokeCraft 360',
  version: '1.0.0',

  // Guest-facing entry route. The public module registry derives from the
  // locked 27-session/6-phase source of truth in session.js so CraftHub and
  // NOVEE OS never surface the deprecated pre-rebuild SMOKECRAFT_FLOW order.
  routes: {
    entry: '/smokecraft',
    flow: [...canonicalEntryFlow, ...canonicalSpineFlow],
    supportingModules: canonicalSupportingFlow,
  },

  phases: VISIT_STRUCTURE.map(phase => ({
    phase: phase.visit,
    label: phase.title,
    sessions: phase.sessions.map(session => ({
      session: session.session,
      id: session.id,
      route: session.route,
      label: session.label,
      mergedInto: session.mergedInto || null,
      sharedComponent: session.sharedComponent || null,
    })),
  })),
  totals: {
    phases: TOTAL_PHASES,
    sessions: TOTAL_SESSIONS,
  },

  // SmokeCraft is fully guest-accessible today — no permission is required
  // to use it. This field documents that fact rather than inventing a gate.
  permissions: {
    guestAccess: true,
    requiredPermission: null,
    staffOnlyScreens: [],
  },

  passportSupport: {
    enabled: true,
    stampCatalog: 'src/data/passportCatalog.js',
    stampPayloadBuilder: 'src/pages/smokecraft/PassportStamp.jsx (buildStampPayload)',
  },

  // Optional connections — both already real and wired (see Phase 1 audit),
  // but kept here as explicit, documented, OPTIONAL module dependencies
  // rather than hard requirements. SmokeCraft must continue to function if
  // either connection is unavailable.
  connections: {
    pos3: {
      optional: true,
      service: 'src/services/smokecraft/smokePOSHandoffService.js',
      direction: 'smokecraft-to-pos3-unidirectional',
    },
    eatCommandHub: {
      optional: true,
      route: 'server/routes/smokecraftEatRoutes.js',
      direction: 'smokecraft-to-eat-unidirectional',
    },
  },

  // Placeholder only — no vendor system exists yet for SmokeCraft. Left
  // empty/null intentionally rather than fabricated.
  vendor: {
    vendorId: null,
    vendorName: null,
    vendorConfig: {},
  },
}

export default smokeCraftModuleConfig
