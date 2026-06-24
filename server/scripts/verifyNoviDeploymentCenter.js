/**
 * Phase 7 — Novi Deployment Center Verification
 * Static, file-system-level checks confirming the read-only Module
 * Deployment Center page exists, displays all four registry modules,
 * shows Atmosphere as not ready, contains no deploy function, has its
 * action buttons disabled, is route-protected, and imports no SmokeCraft
 * screen. No browser is launched — this is source-level verification.
 * Run with:
 *   node server/scripts/verifyNoviDeploymentCenter.js
 */

import { existsSync, readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getAllNoviModules } from '../../src/services/noviModuleStatusService.js'
import { CONTROL_MODE } from '../../src/modules/noviModuleRegistry.js'

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

const pagePath = resolve(ROOT, 'src/pages/novi/ModuleDeploymentCenter.jsx')
const appPath = resolve(ROOT, 'src/App.jsx')

// ── 1. Page exists ────────────────────────────────────────────────────
check('Module Deployment Center page file exists', existsSync(pagePath))
const pageSource = existsSync(pagePath) ? readFileSync(pagePath, 'utf8') : ''
const appSource = readFileSync(appPath, 'utf8')

// ── 2. All four modules are displayed from registry/service ───────────
const modules = getAllNoviModules()
check('Registry/status service exposes exactly 4 modules', modules.length === 4)
check('Page renders modules via getAllNoviModules()', /getAllNoviModules\(\)/.test(pageSource))
check('Page does not hardcode a duplicate module list (no literal module name array)', !/\[\s*['"]SmokeCraft 360['"]/.test(pageSource))

// ── 3. Atmosphere is shown as not ready ────────────────────────────────
const atmosphere = modules.find(m => m.moduleId === 'atmosphere')
check('Atmosphere module data reports controlMode NOT_READY', atmosphere?.controlMode === CONTROL_MODE.NOT_READY)
check('Page has logic to render a "Not Ready" label distinct from "Ready"', /Not Ready/.test(pageSource) && /['"]Ready['"]/.test(pageSource))

// ── 4. No deploy function exists ───────────────────────────────────────
check('Page contains no deployModule(/handleDeploy( implementation', !/function\s+(deployModule|handleDeploy)\s*\(/.test(pageSource))
const deployModuleLine = [...pageSource.split('\n')].reverse().find(line => line.includes('Deploy Module'))
check(
  'Deploy Module button has no onClick handler wired to it (still fully inert)',
  Boolean(deployModuleLine) && /DisabledActionButton/.test(deployModuleLine) && !/onClick/.test(deployModuleLine),
)

// ── 5. Disabled actions are disabled ───────────────────────────────────
const requiredButtons = ['Assign Vendor', 'Deploy Module', 'Disable Module', 'Restore Module']
check('All four required action buttons are present', requiredButtons.every(label => pageSource.includes(label)))
check('Action buttons are marked disabled', /disabled\b/.test(pageSource))
check('Deploy Module button references "Coming in Phase 9"', /Deploy Module — Coming in Phase 9/.test(pageSource))

// ── 6. Route is protected ──────────────────────────────────────────────
const routeBlockMatch = appSource.match(/admin\/deployment-center[\s\S]{0,400}/)
check('App.jsx defines the admin/deployment-center route', Boolean(routeBlockMatch))
check(
  'admin/deployment-center route is wrapped in ProtectedRoute with admin/founder_level_0 roles',
  Boolean(routeBlockMatch) && /ProtectedRoute/.test(routeBlockMatch[0]) && /allowedRoles=\{\['admin', 'founder_level_0'\]\}/.test(routeBlockMatch[0]),
)
check(
  'admin/deployment-center route is demo-blocked like the existing admin route',
  Boolean(routeBlockMatch) && /demoBlocked/.test(routeBlockMatch[0]),
)

// ── 7. No SmokeCraft screen imports exist ──────────────────────────────
check(
  'Page does not import any SmokeCraft page or component',
  !/from\s+['"].*pages\/smokecraft|from\s+['"].*components\/smokecraft/.test(pageSource),
)
check(
  'Page does not import any POS3/E.A.T. screen directly (data-layer only)',
  !/from\s+['"].*pages\/pos3|from\s+['"].*pages\/eat/.test(pageSource),
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
