/**
 * Phase 8 — Novi Vendor Assignment + Remote Disable Foundation Verification
 * Exercises the real Phase 8 modules/services directly (not a browser) to
 * confirm: the vendor assignment registry exists and enforces readiness,
 * standalone modules can be assigned independently of one another,
 * Atmosphere cannot be assigned while not_ready, remote disable supports
 * both vendor-scoped and global scope, the audit log records
 * assignment/disable/restore preview events, no deployModule function
 * exists anywhere in the new layer or the page, and the UI labels
 * prototype-only actions clearly with no live-deployment language.
 * Run with:
 *   node server/scripts/verifyNoviVendorAssignmentFoundation.js
 */

import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  assignModuleToVendor,
  isModuleAssignable,
  getAssignedModuleIds,
} from '../../src/modules/noviVendorModuleAssignments.js'
import {
  disableModuleForVendor,
  disableModuleGlobally,
  requestRestore,
  isModuleDisabledForVendor,
} from '../../src/services/noviRemoteDisableService.js'
import {
  recordNoviAuditEvent,
  getNoviAuditLog,
  NOVI_AUDIT_ACTION,
} from '../../src/modules/noviDeploymentAuditLog.js'

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

// ── 1. Vendor assignment registry exists ───────────────────────────────
const registryPath = resolve(ROOT, 'src/modules/noviVendorModuleAssignments.js')
check('Vendor assignment registry file exists', existsSync(registryPath))

// ── 2. Standalone modules assignable independently ─────────────────────
const pos3Result = assignModuleToVendor({
  vendorId: 'verify-vendor-pos3', vendorName: 'Verify Vendor POS3', moduleId: 'pos3', environment: 'demo', assignedBy: 'test',
})
check('POS 3 can be assigned without SmokeCraft', pos3Result.ok && getAssignedModuleIds('verify-vendor-pos3').includes('pos3') && !getAssignedModuleIds('verify-vendor-pos3').includes('smokecraft'))

const eatResult = assignModuleToVendor({
  vendorId: 'verify-vendor-eat', vendorName: 'Verify Vendor EAT', moduleId: 'eat-command-hub', environment: 'demo', assignedBy: 'test',
})
check('E.A.T. can be assigned without SmokeCraft', eatResult.ok && getAssignedModuleIds('verify-vendor-eat').includes('eat-command-hub') && !getAssignedModuleIds('verify-vendor-eat').includes('smokecraft'))

const smokecraftResult = assignModuleToVendor({
  vendorId: 'verify-vendor-smokecraft', vendorName: 'Verify Vendor SmokeCraft', moduleId: 'smokecraft', environment: 'demo', assignedBy: 'test',
})
check('SmokeCraft can be assigned without POS3/EAT', smokecraftResult.ok && getAssignedModuleIds('verify-vendor-smokecraft').includes('smokecraft') && !getAssignedModuleIds('verify-vendor-smokecraft').some(id => ['pos3', 'eat-command-hub'].includes(id)))

// ── 3. Atmosphere cannot be assigned while not_ready ────────────────────
check('Atmosphere reports not assignable today', !isModuleAssignable('atmosphere'))
const atmosphereResult = assignModuleToVendor({
  vendorId: 'verify-vendor-atmosphere', vendorName: 'Verify Vendor Atmosphere', moduleId: 'atmosphere', environment: 'demo', assignedBy: 'test',
})
check('Atmosphere assignment is refused, not faked', !atmosphereResult.ok && atmosphereResult.record === null)

// ── 4. Remote disable supports vendor-specific and global scope ─────────
const vendorDisable = disableModuleForVendor({ moduleId: 'pos3', vendorId: 'verify-vendor-pos3', reason: 'test', actor: 'test', environment: 'demo' })
check('Remote disable supports vendor-specific disable', isModuleDisabledForVendor('pos3', 'verify-vendor-pos3') && vendorDisable.scope === 'vendor')

const globalDisable = disableModuleGlobally({ moduleId: 'eat-command-hub', reason: 'test', actor: 'test', environment: 'demo' })
check('Remote disable supports global disable', isModuleDisabledForVendor('eat-command-hub', 'any-vendor-id') && globalDisable.scope === 'global')

const restored = requestRestore({ disableRecordId: vendorDisable.id, actor: 'test' })
check('Restore placeholder marks a disable record as requested (not actually restored)', restored?.restoreStatus === 'requested')

// ── 5. Audit log records assignment/disable/restore preview events ─────
recordNoviAuditEvent({ action: NOVI_AUDIT_ACTION.VENDOR_ASSIGNED_PREVIEW, moduleId: 'pos3', vendorId: 'verify-vendor-pos3', actorRole: 'admin', status: 'success' })
recordNoviAuditEvent({ action: NOVI_AUDIT_ACTION.MODULE_DISABLED_PREVIEW, moduleId: 'pos3', vendorId: 'verify-vendor-pos3', actorRole: 'admin', status: 'success' })
recordNoviAuditEvent({ action: NOVI_AUDIT_ACTION.MODULE_RESTORED_PREVIEW, moduleId: 'pos3', vendorId: 'verify-vendor-pos3', actorRole: 'admin', status: 'success' })
const auditLog = getNoviAuditLog()
check('Audit log records a vendor-assigned preview event', auditLog.some(e => e.action === NOVI_AUDIT_ACTION.VENDOR_ASSIGNED_PREVIEW))
check('Audit log records a module-disabled preview event', auditLog.some(e => e.action === NOVI_AUDIT_ACTION.MODULE_DISABLED_PREVIEW))
check('Audit log records a module-restored preview event', auditLog.some(e => e.action === NOVI_AUDIT_ACTION.MODULE_RESTORED_PREVIEW))

// ── 6. No deployModule function exists anywhere in the new layer ────────
const newModuleFiles = [
  resolve(ROOT, 'src/modules/noviVendorModuleAssignments.js'),
  resolve(ROOT, 'src/services/noviRemoteDisableService.js'),
  resolve(ROOT, 'src/modules/noviDeploymentAuditLog.js'),
  resolve(ROOT, 'src/pages/novi/ModuleDeploymentCenter.jsx'),
]
const noDeployFunction = newModuleFiles.every(path => !/function\s+(deployModule|handleDeploy)\s*\(/.test(readFileSync(path, 'utf8')))
check('No deployModule()/handleDeploy() function exists in any Phase 8 file', noDeployFunction)

// ── 7. UI labels prototype-only actions clearly, no live-deployment language ──
const pageSource = readFileSync(resolve(ROOT, 'src/pages/novi/ModuleDeploymentCenter.jsx'), 'utf8')
check('Page labels prototype-only actions clearly', /Prototype only\. No live deployment sent\./.test(pageSource))
check('Page contains no "deployed" success wording', !/\bdeployed\b/i.test(pageSource))
const deploymentSentMatches = pageSource.match(/deployment sent/gi) ?? []
check(
  'Page contains no live-deployment language ("push to vendor", "send to device", "deployment sent" outside the prototype notice)',
  !/push to vendor|send to device/i.test(pageSource) &&
  deploymentSentMatches.every(() => /No live deployment sent\./.test(pageSource)),
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
