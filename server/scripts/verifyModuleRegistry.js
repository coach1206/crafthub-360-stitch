/**
 * Phase 3 — Module Registry Verification
 * Imports the live module registry, runs structural + standalone-module
 * validation, and confirms the Phase 1/2/3 module rules still hold. No
 * network calls, no database, no browser globals. Run with:
 *   node server/scripts/verifyModuleRegistry.js
 */

import { moduleRegistry, listModules } from '../../src/modules/moduleRegistry.js'
import { validateModuleRegistry } from '../../src/modules/validateModuleRegistry.js'
import { MODULE_STATUS } from '../../src/modules/moduleIntegrationContract.js'

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

// ── 1. Structural + standalone-module validation ──────────────────
const { valid, results } = validateModuleRegistry(moduleRegistry)

for (const [moduleId, issues] of Object.entries(results)) {
  if (issues.length === 0) {
    check(`Module "${moduleId}" passes contract + standalone-module rules`, true)
  } else {
    check(`Module "${moduleId}" passes contract + standalone-module rules`, false)
    for (const issue of issues) console.error(`       ${issue}`)
  }
}

check('Module registry is structurally valid overall', valid)

// ── 2. Explicit standalone-module spot checks ──────────────────────
const pos3 = moduleRegistry.pos3
const eat = moduleRegistry['eat-command-hub']
const smokecraft = moduleRegistry.smokecraft
const atmosphere = moduleRegistry.atmosphere

check('POS 3 has zero hard dependencies', Array.isArray(pos3?.dependencies) && pos3.dependencies.length === 0)
check('E.A.T. Command Hub has zero hard dependencies', Array.isArray(eat?.dependencies) && eat.dependencies.length === 0)
check('SmokeCraft has zero hard dependencies', Array.isArray(smokecraft?.dependencies) && smokecraft.dependencies.length === 0)
check(
  'SmokeCraft optionally integrates with POS 3 and/or E.A.T. Command Hub',
  Object.keys(smokecraft?.optionalIntegrations ?? {}).some(key => key === 'pos3' || key === 'eat-command-hub' || key === 'eatCommandHub'),
)
check(
  'Atmosphere Control can stand alone (empty optionalIntegrations is acceptable)',
  atmosphere && typeof atmosphere.optionalIntegrations === 'object',
)
check('Atmosphere Control is honestly marked not_built', atmosphere?.status === MODULE_STATUS.NOT_BUILT)

// ── 3. Registry completeness ────────────────────────────────────────
const expectedIds = ['smokecraft', 'pos3', 'eat-command-hub', 'atmosphere']
check('All four expected modules are registered', expectedIds.every(id => id in moduleRegistry))
check('listModules() returns the same count as the registry object', listModules().length === Object.keys(moduleRegistry).length)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
