/**
 * Phase 6 — Novi OS Module Registry Verification
 * Imports the Novi module registry, status service, and security policy
 * and confirms the Phase 6 rules hold: all four CraftHub modules are
 * represented, POS 3/E.A.T. are standalone, Atmosphere is honestly
 * not_ready, no SmokeCraft screens were duplicated, and no live deployment
 * function exists anywhere in this layer. Run with:
 *   node server/scripts/verifyNoviModuleRegistry.js
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { listNoviModules, getNoviModule, CONTROL_MODE } from '../../src/modules/noviModuleRegistry.js'
import {
  getAllNoviModules,
  getVendorAssignableModules,
  getStandaloneModules,
  getNotReadyModules,
  getModulesBySourceSystem,
} from '../../src/services/noviModuleStatusService.js'
import { ROLES } from '../../src/modules/roleAccessRules.js'
import {
  canViewModuleRegistry,
  canViewAssignedModulesOnly,
  canDeployModule,
  canManageModuleRegistry,
  canDisableModuleGlobally,
} from '../../src/modules/noviModuleSecurityPolicy.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../..')

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

// ── 1. All four modules exist ────────────────────────────────────────
const expectedIds = ['smokecraft', 'pos3', 'eat-command-hub', 'atmosphere']
check('All four CraftHub modules are registered in the Novi registry', expectedIds.every(id => Boolean(getNoviModule(id))))

// ── 2. Standalone rules ──────────────────────────────────────────────
const pos3 = getNoviModule('pos3')
const eat = getNoviModule('eat-command-hub')
const smokecraft = getNoviModule('smokecraft')
const atmosphere = getNoviModule('atmosphere')

check('POS 3 standaloneAllowed is true', pos3?.standaloneAllowed === true)
check('E.A.T. Command Hub standaloneAllowed is true', eat?.standaloneAllowed === true)
check('SmokeCraft does not require POS 3 or E.A.T. (dependencies empty)', Array.isArray(smokecraft?.dependencies) && smokecraft.dependencies.length === 0)
check('POS 3 has zero dependencies', Array.isArray(pos3?.dependencies) && pos3.dependencies.length === 0)
check('E.A.T. Command Hub has zero dependencies', Array.isArray(eat?.dependencies) && eat.dependencies.length === 0)

// ── 3. Atmosphere is honestly not_ready ──────────────────────────────
check('Atmosphere Control control mode is not_ready', atmosphere?.controlMode === CONTROL_MODE.NOT_READY)
check('Atmosphere Control is not marked vendor assignable', atmosphere?.vendorAssignable === false)

// ── 4. No SmokeCraft screen duplication ──────────────────────────────
const registrySource = readFileSync(resolve(ROOT, 'src/modules/noviModuleRegistry.js'), 'utf8')
const statusServiceSource = readFileSync(resolve(ROOT, 'src/services/noviModuleStatusService.js'), 'utf8')
const noScreenImports = ![registrySource, statusServiceSource].some(src => /pages\/smokecraft|components\/smokecraft/.test(src))
check('Novi registry/status service does not import any SmokeCraft screen or component', noScreenImports)

// ── 5. Security level + supported environments present on every module ──
check('Every module has a securityLevel', listNoviModules().every(m => Boolean(m.securityLevel)))
check('Every module has a non-empty supportedEnvironments list', listNoviModules().every(m => Array.isArray(m.supportedEnvironments) && m.supportedEnvironments.length > 0))

// ── 6. Registry is read-only ─────────────────────────────────────────
check('Novi registry module exports no setter/write function', !/export function set|export function update|export function deploy/.test(registrySource))
check('canDeployModule() denies every role (no live deployment exists)', Object.values(ROLES).every(role => canDeployModule(role) === false))

// ── 7. No live deployment function exists anywhere in this layer ───
const securityPolicySource = readFileSync(resolve(ROOT, 'src/modules/noviModuleSecurityPolicy.js'), 'utf8')
check('No "deployModule(" implementation exists in the Novi registry layer', ![registrySource, statusServiceSource, securityPolicySource].some(src => /function deployModule\(/.test(src)))

// ── 8. Status service behaves as documented ──────────────────────────
check('getAllNoviModules() returns all 4 modules', getAllNoviModules().length === 4)
check('getVendorAssignableModules() includes SmokeCraft/POS3/E.A.T. but not Atmosphere', (() => {
  const ids = getVendorAssignableModules().map(m => m.moduleId)
  return ids.includes('smokecraft') && ids.includes('pos3') && ids.includes('eat-command-hub') && !ids.includes('atmosphere')
})())
check('getStandaloneModules() includes POS3, E.A.T., and SmokeCraft', (() => {
  const ids = getStandaloneModules().map(m => m.moduleId)
  return ids.includes('pos3') && ids.includes('eat-command-hub') && ids.includes('smokecraft')
})())
check('getNotReadyModules() returns only Atmosphere', (() => {
  const ids = getNotReadyModules().map(m => m.moduleId)
  return ids.length === 1 && ids[0] === 'atmosphere'
})())
check('getModulesBySourceSystem("CraftHub") returns all 4 modules', getModulesBySourceSystem('CraftHub').length === 4)

// ── 9. Security policy role rules ────────────────────────────────────
check('guest cannot view the module registry', canViewModuleRegistry(ROLES.GUEST) === false)
check('staff cannot deploy modules', canDeployModule(ROLES.STAFF) === false)
check('vendor_admin can only view assigned modules, not the full registry', canViewAssignedModulesOnly(ROLES.VENDOR_ADMIN) === true && canViewModuleRegistry(ROLES.VENDOR_ADMIN) === false)
check('novi_admin can manage the module registry', canManageModuleRegistry(ROLES.NOVI_ADMIN) === true)
check('super_admin can disable modules globally', canDisableModuleGlobally(ROLES.SUPER_ADMIN) === true)
check('novi_admin cannot disable modules globally', canDisableModuleGlobally(ROLES.NOVI_ADMIN) === false)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
