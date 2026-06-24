/**
 * Phase 5 — Deployment Readiness Verification
 * Imports the deployment readiness layer (profiles, health monitor,
 * readiness validator, vendor planner) and confirms each module/profile
 * reports an honest readiness state. No live deployment, no network
 * calls, no database. Run with:
 *   node server/scripts/verifyDeploymentReadiness.js
 */

import { moduleRegistry } from '../../src/modules/moduleRegistry.js'
import { listDeploymentProfiles, DEPLOYMENT_PROFILE_ID } from '../../src/modules/deploymentProfiles.js'
import { getModuleHealthSnapshot } from '../../src/modules/moduleHealthMonitor.js'
import { validateModuleReadiness, validateProfileReadiness } from '../../src/modules/deploymentReadinessValidator.js'
import { generateDeploymentPlan } from '../../src/modules/vendorDeploymentPlanner.js'
import { validateModuleRegistry } from '../../src/modules/validateModuleRegistry.js'

let passed = 0
let failed = 0

function check(label, condition) {
  if (condition) {
    passed += 1
    console.log(`PASS — ${label}`)
  } else {
    failed += 1
    console.error(`FAIL — ${label}`)
  }
}

// ── 1. SmokeCraft / POS 3 / E.A.T. are deployment ready ─────────────
const smokecraftReadiness = validateModuleReadiness('smokecraft')
const pos3Readiness = validateModuleReadiness('pos3')
const eatReadiness = validateModuleReadiness('eat-command-hub')
const atmosphereReadiness = validateModuleReadiness('atmosphere')

check('SmokeCraft is deployment ready', smokecraftReadiness.ready === true)
check('POS 3 is deployment ready', pos3Readiness.ready === true)
check('E.A.T. Command Hub is deployment ready', eatReadiness.ready === true)

// ── 2. Atmosphere placeholder is honestly NOT deployment ready ──────
check(
  'Atmosphere Control is registered but honestly reports as not deployment ready (placeholder)',
  atmosphereReadiness.checks.moduleRegistered === true && atmosphereReadiness.ready === false,
)

// ── 3. Deployment profiles are valid ─────────────────────────────────
const profiles = listDeploymentProfiles()
check('All 8 deployment profiles are defined', profiles.length === 8)
check('Every profile references only registered modules', profiles.every(profile => profile.modules.every(moduleId => moduleId in moduleRegistry)))

const smokecraftOnly = validateProfileReadiness(DEPLOYMENT_PROFILE_ID.SMOKECRAFT_ONLY)
const pos3Only = validateProfileReadiness(DEPLOYMENT_PROFILE_ID.POS3_ONLY)
const eatOnly = validateProfileReadiness(DEPLOYMENT_PROFILE_ID.EAT_ONLY)
const pos3AndEat = validateProfileReadiness(DEPLOYMENT_PROFILE_ID.POS3_AND_EAT)
const fullSuite = validateProfileReadiness(DEPLOYMENT_PROFILE_ID.FULL_SUITE)

check('SmokeCraft Only profile is ready', smokecraftOnly.ready === true)
check('POS 3 Only profile is ready', pos3Only.ready === true)
check('E.A.T. Only profile is ready', eatOnly.ready === true)
check('POS 3 + E.A.T. profile is ready', pos3AndEat.ready === true)
check(
  'Full CraftHub Suite profile is honestly NOT ready (Atmosphere is a placeholder)',
  fullSuite.ready === false && fullSuite.issues.some(issue => issue.toLowerCase().includes('atmosphere')),
)

// ── 4. Security rules still hold (registry + vendor security) ───────
const registryValidation = validateModuleRegistry(moduleRegistry)
check('Module registry passes structural + standalone-module validation', registryValidation.valid === true)
check('POS 3 has no SmokeCraft dependency', moduleRegistry.pos3.dependencies.length === 0)
check('E.A.T. Command Hub has no SmokeCraft dependency', moduleRegistry['eat-command-hub'].dependencies.length === 0)

// ── 5. Module health monitor reports honest, non-fabricated metrics ──
const smokecraftHealth = getModuleHealthSnapshot('smokecraft')
check('Module health monitor reports no uptime metric (not fabricated)', !('uptime' in smokecraftHealth))
check('Module health monitor reports deploymentReady derived from real checks', smokecraftHealth.deploymentReady === true)

// ── 6. Vendor deployment planner produces a plan, never a fake deploy ──
const plan = generateDeploymentPlan({ vendorId: 'demo-vendor-pos3', profileId: DEPLOYMENT_PROFILE_ID.POS3_ONLY })
check('Vendor deployment plan includes the requested modules', JSON.stringify(plan.modulesIncluded) === JSON.stringify(['pos3']))
check('Vendor deployment plan reports a readiness score derived from real checks', plan.readinessScore === 1)
check('Vendor deployment plan exposes no deployment-execution function (planning only)', typeof plan.deploy === 'undefined')

const unknownVendorPlan = generateDeploymentPlan({ vendorId: 'no-such-vendor', profileId: DEPLOYMENT_PROFILE_ID.POS3_ONLY })
check('Deployment plan for an unknown vendor warns instead of fabricating success', unknownVendorPlan.warnings.length > 0 && unknownVendorPlan.readinessScore === 0)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
