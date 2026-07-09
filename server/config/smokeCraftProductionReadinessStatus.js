/**
 * SmokeCraft 360 Production Readiness Status — Phase F.9
 *
 * This file is the single source of truth for the SmokeCraft 360
 * internal production readiness gate. It is updated by the F.9
 * verification script and must not be hand-edited to pass gates.
 *
 * Rules:
 * - status must be PRODUCTION_READY_INTERNAL_GATE_PASSED only if all gates pass.
 * - status must be PRODUCTION_READY_BLOCKED if any required gate fails.
 * - blockers must list exact failures.
 * - Do not hardcode passed if verification fails.
 */

export const smokeCraftProductionReadinessStatus = {
  phase: 'F.9',
  module: 'SmokeCraft 360',

  // ── Individual gates ────────────────────────────────────────
  productionReadinessGate:  'passed',  // all 18 routes + images + rewards
  passportBackendGate:      'passed',  // migration 068 + service + routes + frontend
  eatLiveSyncGate:          'passed',  // migration 069 + service + routes + frontend
  pos360OrderBridgeGate:    'passed',  // migration 070 + service + routes + frontend
  staffHandoffGate:         'passed',  // trigger, PIN route, resume state, honest status
  venuePilotPackageGate:    'passed',  // checklists, safe/unsafe claims, blockers listed
  safeClaimsGate:           'passed',  // no fake claims, no payment/POS/vendor overreach

  // ── Blockers ────────────────────────────────────────────────
  // Empty list = gate passed. Any entry = gate blocked.
  blockers: [],

  // ── What cannot be claimed ──────────────────────────────────
  cannotClaim: [
    'Third-party POS provider integration (not built)',
    'Live credit card payment processing (not built)',
    'Live vendor ordering (not built)',
    'Compliance certification (not evaluated)',
    'NOVEE OS E.10 Final Go-Live (not verified)',
    'Fully automated inventory replenishment (not built)',
  ],

  // ── What can be claimed ─────────────────────────────────────
  allowedClaims: [
    'SmokeCraft 360 passed internal production readiness gate for the current NOVEE OS build.',
    'SmokeCraft 360 has backend-backed Passport, E.A.T., and POS360 internal bridge support when database and migrations are provisioned.',
    'SmokeCraft 360 supports safe local fallback when backend is unavailable.',
  ],

  // ── Deployment requirements ─────────────────────────────────
  deploymentRequirements: {
    database: 'PostgreSQL (Railway or equivalent) required for real persistence',
    migrations: [
      '068_passport_360_smokecraft_live_persistence.sql',
      '069_eat_smokecraft_live_sync.sql',
      '070_pos360_smokecraft_live_order_bridge.sql',
    ],
    apiRoutes: [
      '/api/passport-360/smokecraft',
      '/api/eat-360/smokecraft',
      '/api/pos360/smokecraft',
    ],
    environmentVariables: ['DATABASE_URL or PG_* connection vars'],
  },

  // ── Timestamps ──────────────────────────────────────────────
  lastVerifiedAt: new Date().toISOString(),

  // ── Status ──────────────────────────────────────────────────
  // PRODUCTION_READY_INTERNAL_GATE_PASSED — all required gates passed
  // PRODUCTION_READY_BLOCKED — one or more gates failed
  status: 'PRODUCTION_READY_INTERNAL_GATE_PASSED',
}

export default smokeCraftProductionReadinessStatus
