// SmokeCraft 360 — module configuration.
// Describes SmokeCraft as a registrable module for the module registry
// (src/modules/moduleRegistry.js). This is descriptive metadata only —
// it does not change routing, permissions, or guest flow behavior.
// Sourced directly from src/App.jsx, src/constants/session.js, and
// docs/phase-1-crafthub-smokecraft-audit.md.

import { SMOKECRAFT_FLOW } from '../../constants/session.js'

export const smokeCraftModuleConfig = {
  id: 'smokecraft',
  name: 'SmokeCraft 360',
  version: '1.0.0',

  // Guest-facing entry route. Full flow routes are listed in SMOKECRAFT_FLOW
  // (src/constants/session.js) and are NOT duplicated here — this config
  // references that flow rather than re-declaring it.
  routes: {
    entry: '/smokecraft',
    flow: SMOKECRAFT_FLOW.map(step => ({ id: step.id, route: step.route, label: step.label })),
  },

  // Phases 0-13 as currently implemented in the guest flow.
  // Phase 0 = enrollment; phases 1-13 follow SMOKECRAFT_FLOW ordering.
  phases: [
    { phase: 0,  id: 'enroll',           label: 'Profile Enrollment' },
    { phase: 1,  id: 'format',           label: 'Shape, Size & Burn Time' },
    { phase: 2,  id: 'seed-soil',        label: 'Seed & Soil Pairing' },
    { phase: 3,  id: 'mentor',           label: 'Select Master Mentor' },
    { phase: 4,  id: 'golden-box',       label: 'Gold Box Rules' },
    { phase: 5,  id: 'humidor-match',    label: 'Humidor Match' },
    { phase: 6,  id: 'request-purchase', label: 'Request or Purchase Cigar' },
    { phase: 7,  id: 'cut-toast-light',  label: 'Cut, Toast & Light' },
    { phase: 8,  id: 'first-third',      label: 'First Third Tasting' },
    { phase: 9,  id: 'second-third',     label: 'Second Third Tasting' },
    { phase: 10, id: 'final-third',      label: 'Final Third Tasting' },
    { phase: 11, id: 'scorecard',        label: 'Scorecard' },
    { phase: 12, id: 'passport-stamp',   label: 'Passport Stamp' },
    { phase: 13, id: 'connections',      label: '360 Passport Connections' },
  ],

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
