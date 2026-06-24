/**
 * Phase 9 — Final Novi OS Remote Deployment Readiness Verification
 * Confirms the full CraftHub → Novi OS architecture is locked and honest:
 * no live deploy function exists anywhere, all four modules are visible
 * with the correct standalone/readiness facts, the Phase 8 preview layers
 * (assignment/disable/audit) work, and the Phase 9 safety checklist
 * correctly blocks production deployment because billing, device APIs,
 * and rollback are not real yet.
 * Run with:
 *   node server/scripts/verifyNoviRemoteDeploymentReadiness.js
 */

import { readFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getAllNoviModules } from '../../src/services/noviModuleStatusService.js'
import { CONTROL_MODE } from '../../src/modules/noviModuleRegistry.js'
import { assignModuleToVendor, getAssignedModuleIds } from '../../src/modules/noviVendorModuleAssignments.js'
import { disableModuleForVendor, isModuleDisabledForVendor } from '../../src/services/noviRemoteDisableService.js'
import { recordNoviAuditEvent, getNoviAuditLog, NOVI_AUDIT_ACTION } from '../../src/modules/noviDeploymentAuditLog.js'
import { runDeploymentSafetyChecklist, canDeployToProduction, CHECK_STATUS } from '../../src/modules/noviDeploymentSafetyChecklist.js'
import { createDeploymentContract } from '../../src/modules/noviRemoteDeploymentContract.js'

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

function readAllSourceFiles(dirs) {
  const files = []
  for (const dir of dirs) {
    const full = resolve(ROOT, dir)
    for (const name of readdirSync(full)) {
      if (name.endsWith('.js') || name.endsWith('.jsx')) files.push(resolve(full, name))
    }
  }
  return files
}

// ── 1. No live deploy function exists anywhere in the Novi layer ───────
const noviSourceFiles = [
  ...readAllSourceFiles(['src/modules']).filter(f => /novi/i.test(f)),
  ...readAllSourceFiles(['src/services']).filter(f => /novi/i.test(f)),
  resolve(ROOT, 'src/pages/novi/ModuleDeploymentCenter.jsx'),
]
const noLiveDeployFunction = noviSourceFiles.every(path => !/function\s+(deployModule|liveDeployModule|handleDeploy)\s*\(/.test(readFileSync(path, 'utf8')))
check('No deployModule()/liveDeployModule()/handleDeploy() function exists anywhere in the Novi layer', noLiveDeployFunction)

// ── 2. All modules are visible ──────────────────────────────────────────
const modules = getAllNoviModules()
check('All four modules are visible via getAllNoviModules()', modules.length === 4)

// ── 3. Standalone rules and Atmosphere not-ready ────────────────────────
const pos3 = modules.find(m => m.moduleId === 'pos3')
const eat = modules.find(m => m.moduleId === 'eat-command-hub')
const smokecraft = modules.find(m => m.moduleId === 'smokecraft')
const atmosphere = modules.find(m => m.moduleId === 'atmosphere')
check('POS 3 reports standaloneAllowed: true', pos3?.standaloneAllowed === true)
check('E.A.T. Command Hub reports standaloneAllowed: true', eat?.standaloneAllowed === true)
check('SmokeCraft 360 reports standaloneAllowed: true', smokecraft?.standaloneAllowed === true)
check('Atmosphere Control reports controlMode NOT_READY', atmosphere?.controlMode === CONTROL_MODE.NOT_READY)

// ── 4. Phase 8 preview layers work ──────────────────────────────────────
const assignResult = assignModuleToVendor({ vendorId: 'phase9-verify-vendor', vendorName: 'Phase 9 Verify Vendor', moduleId: 'pos3', environment: 'demo', assignedBy: 'test' })
check('Assignment preview works (POS 3 assignable to a vendor)', assignResult.ok && getAssignedModuleIds('phase9-verify-vendor').includes('pos3'))

const disableRecord = disableModuleForVendor({ moduleId: 'pos3', vendorId: 'phase9-verify-vendor', reason: 'test', actor: 'test', environment: 'demo' })
check('Disable preview works (vendor-scoped disable recorded)', isModuleDisabledForVendor('pos3', 'phase9-verify-vendor') && Boolean(disableRecord.id))

recordNoviAuditEvent({ action: NOVI_AUDIT_ACTION.VENDOR_ASSIGNED_PREVIEW, moduleId: 'pos3', vendorId: 'phase9-verify-vendor', actorRole: 'admin', status: 'success' })
check('Audit preview works (event recorded and queryable)', getNoviAuditLog().some(e => e.vendorId === 'phase9-verify-vendor'))

// ── 5. Safety checklist blocks production deployment ───────────────────
const productionChecklist = runDeploymentSafetyChecklist({
  vendorId: 'phase9-verify-vendor', moduleId: 'pos3', role: 'admin', environment: 'production',
})
check('Safety checklist blocks production deployment overall', productionChecklist.allReady === false)
check('Missing billing connection blocks production deployment', productionChecklist.checks.billingConnected === CHECK_STATUS.NOT_READY)
check('Missing device API connection blocks device control', productionChecklist.checks.deviceApisConnected === CHECK_STATUS.NOT_READY)
check('canDeployToProduction() returns false', canDeployToProduction({ vendorId: 'phase9-verify-vendor', moduleId: 'pos3', role: 'admin', environment: 'production' }) === false)

// ── 6. Live deployment is locked at the contract level ──────────────────
const contract = createDeploymentContract({ vendorId: 'phase9-verify-vendor', moduleId: 'pos3', deploymentMode: 'production' })
check('Deployment contract reports liveDeploymentAllowed: false even when deploymentMode is production', contract.liveDeploymentAllowed === false)

// ── 7. UI shows the final Remote Deployment Readiness section ──────────
const pageSource = readFileSync(resolve(ROOT, 'src/pages/novi/ModuleDeploymentCenter.jsx'), 'utf8')
check('Page renders the "Remote Deployment Readiness" section', /Remote Deployment Readiness/.test(pageSource))
const readinessLabels = [
  'Preview Assignment Ready',
  'Remote Disable Preview Ready',
  'Audit Trail Preview Ready',
  'Live Deployment Locked',
  'Billing Not Connected',
  'Device Control Not Connected',
  'Atmosphere Not Ready',
]
check('Page renders all required readiness labels', readinessLabels.every(label => pageSource.includes(label)))
check('No new live-deployment button is added to the page', !/Deploy Now|Push Live|Go Live/i.test(pageSource))

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
