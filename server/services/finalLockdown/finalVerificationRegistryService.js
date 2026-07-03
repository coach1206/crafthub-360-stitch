const VERIFICATION_REGISTRY = [
  { script: 'verify:external-operations-gateway', command: 'node server/scripts/verifyExternalOperationsGateway.js', phase: 18, expectedPass: 369, description: 'Phase 18 EOCG — External Operations Connector Gateway' },
  { script: 'verify:locc-dashboard', command: 'node server/scripts/verifyLiveOperationsDashboard.js', phase: 17, expectedPass: 223, description: 'Phase 17 LOCC — Live Operations Command Center' },
  { script: 'verify:environment-readiness', command: 'node server/scripts/verifyEnvironmentReadiness.js', phase: 16, expectedPass: 219, description: 'Phase 16 EPRL — Environment Persistence Readiness Layer' },
  { script: 'verify:inventory-persistence-sync', command: 'node server/scripts/verifyInventoryPersistenceSync.js', phase: 15, expectedPass: 240, description: 'Phase 15 OIPSL — Inventory Persistence and Sync Layer' },
  { script: 'verify:inventory', command: 'node server/scripts/verifyInventoryAvailabilityEngine.js', phase: 14, expectedPass: 78, description: 'Phase 14 ISPAE — Inventory Availability Engine' },
  { script: 'verify:reorder-connectors', command: 'node server/scripts/verifyReorderConnectors.js', phase: 14, expectedPass: 130, description: 'Phase 14 DMRC — Reorder Connector' },
  { script: 'verify:staff-dragdrop', command: 'node server/scripts/verifyStaffTableDragDropActivation.js', phase: 13, expectedPass: 131, description: 'Phase 13B — Staff Table Drag/Drop Activation' },
  { script: 'verify:staff', command: 'node server/scripts/verifyStaffOrderTablePatioEngine.js', phase: 13, expectedPass: 194, description: 'Phase 13 — Staff Order Table/Patio Engine' },
  { script: 'verify:checkout', command: 'node server/scripts/verifyCheckoutFlow.js', phase: 12, expectedPass: 116, description: 'Phase 12 — Checkout Flow' },
  { script: 'verify:ncie-wiring', command: 'node server/scripts/verifyNCIEWiring.js', phase: 11, expectedPass: 135, description: 'Phase 11 — NCIE Wiring' },
  { script: 'verify:ncie', command: 'node server/scripts/verifyNoveeOSNCIE.js', phase: 11, expectedPass: 116, description: 'Phase 11 — NOVEE OS + NCIE Foundation' },
  { script: 'verify:kds', command: 'node server/scripts/verifyKDSEngine.js', phase: 10, expectedPass: 101, description: 'Phase 10 — KDS Engine' },
  { script: 'verify:orders', command: 'node server/scripts/verifyOrderLifecycle.js', phase: 8, expectedPass: 125, description: 'Phase 8 — Order Lifecycle Engine' },
  { script: 'verify:tax', command: 'node server/scripts/verifyTaxCompliance.js', phase: 7, expectedPass: 80, description: 'Phase 7 — Tax Profiles and Compliance Engine' },
  { script: 'verify:payments', command: 'node server/scripts/verifyStripeConnectBridge.js', phase: 6, expectedPass: 38, description: 'Phase 6 — Stripe Connect Money Bridge' },
  { script: 'verify:database', command: 'node server/scripts/verifyDatabaseFoundation.js', phase: 5, expectedPass: 40, description: 'Phase 5 — Database Foundation' },
  { script: 'verify:pos360', command: 'node server/scripts/verifyPOS360Engine.js', phase: 4, expectedPass: 121, description: 'Phase 4 — POS360 Engine' },
  { script: 'verify:venue-onboarding', command: 'node server/scripts/verifyVenueOnboarding.js', phase: 3, expectedPass: 43, description: 'Phase 3 — Venue Onboarding Engine' },
  { script: 'verify:partner-vendors', command: 'node server/scripts/verifyPartnerVendors.js', phase: 2, expectedPass: 48, description: 'Phase 2 — Partner Vendor Onboarding Engine' },
  { script: 'verify:final-lockdown', command: 'node server/scripts/verifyFinalLockdown.js', phase: 19, expectedPass: 320, description: 'Phase 19 FPLMRL — Final Production Lockdown and Module Readiness' },
  { script: 'build', command: 'npm run build', phase: 'all', expectedPass: null, description: 'Production build — must complete clean' },
]

export function getFinalVerificationRegistry() {
  return VERIFICATION_REGISTRY
}

export function getRequiredVerificationScripts() {
  return VERIFICATION_REGISTRY.filter(r => r.script !== 'build')
}

export function getVerificationCommandList() {
  return VERIFICATION_REGISTRY.map(r => `npm run ${r.script}`)
}

export function buildVerificationChecklist() {
  return {
    total_scripts: VERIFICATION_REGISTRY.length,
    phase_scripts: VERIFICATION_REGISTRY.filter(r => r.script !== 'build').length,
    build_check: true,
    registry: VERIFICATION_REGISTRY,
    all_must_pass: true,
    run_in_order: false,
    note: 'All verification scripts must pass before Phase 19 is considered sealed.',
  }
}

export function buildFinalVerificationReportTemplate() {
  return {
    phase: 'Phase 19 — FPLMRL',
    verification_date: new Date().toISOString(),
    scripts: VERIFICATION_REGISTRY.map(r => ({
      script: r.script,
      phase: r.phase,
      description: r.description,
      result: 'pending',
      passed: null,
      failed: null,
    })),
    build_result: 'pending',
    all_pass: false,
    sealed: false,
  }
}
