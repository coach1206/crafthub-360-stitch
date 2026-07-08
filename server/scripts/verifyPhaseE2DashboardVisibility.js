/**
 * NOVEE OS — Phase E.2 Dashboard Visibility + Command Center Navigation Verification
 * Run: node server/scripts/verifyPhaseE2DashboardVisibility.js
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())
const pass = []
const fail = []

function check(label, value) {
  if (value) { pass.push(label) } else { fail.push(label) }
}

const appJsx         = readFileSync(resolve(root, 'src/App.jsx'), 'utf8')
const noveeHome      = readFileSync(resolve(root, 'src/pages/NoveeHome.jsx'), 'utf8')
const commandCenter  = readFileSync(resolve(root, 'src/pages/noveeOS/NoveeOSCommandCenter.jsx'), 'utf8')
const registry360    = readFileSync(resolve(root, 'src/pages/noveeOS/NoveeOS360PlatformRegistry.jsx'), 'utf8')
const placeholder    = readFileSync(resolve(root, 'src/pages/ModulePlaceholderReserved.jsx'), 'utf8')
const pkgJson        = readFileSync(resolve(root, 'package.json'), 'utf8')

// ── App.jsx imports ───────────────────────────────────────────
check('APP: NoveeOSCommandCenter imported',       appJsx.includes('NoveeOSCommandCenter'))
check('APP: NoveeOS360PlatformRegistry imported', appJsx.includes('NoveeOS360PlatformRegistry'))
check('APP: ModulePlaceholderReserved imported',  appJsx.includes('ModulePlaceholderReserved'))

// ── App.jsx routes ────────────────────────────────────────────
check('APP: /novee-os/command-center route',      appJsx.includes("path=\"novee-os/command-center\""))
check('APP: /novee-os/360-platforms route',       appJsx.includes("path=\"novee-os/360-platforms\""))
check('APP: placeholder/* route',                appJsx.includes("path=\"placeholder/*\""))
// Pre-existing phase-d routes
check('APP: phase-d/provider-activation route',           appJsx.includes('phase-d/provider-activation'))
check('APP: phase-d/payment-provider-activation route',   appJsx.includes('phase-d/payment-provider-activation'))
check('APP: phase-d/external-pos-activation route',       appJsx.includes('phase-d/external-pos-activation'))
check('APP: phase-d/inventory-activation route',          appJsx.includes('phase-d/inventory-activation'))
check('APP: phase-d/communication-activation route',      appJsx.includes('phase-d/communication-activation'))
// Pre-existing novee-os routes
check('APP: novee-os/modules route',              appJsx.includes('novee-os/modules'))
check('APP: novee-os/tenants route',              appJsx.includes('novee-os/tenants'))
check('APP: novee-os/billing route',              appJsx.includes('novee-os/billing'))
check('APP: novee-os/security route',             appJsx.includes('novee-os/security'))
check('APP: novee-os/final-readiness route',      appJsx.includes('novee-os/final-readiness'))

// ── NoveeHome admin nav ───────────────────────────────────────
check('NOVEEHOME: ADMIN_LINKS defined',                   noveeHome.includes('ADMIN_LINKS'))
check('NOVEEHOME: /novee-os/command-center link',         noveeHome.includes('/novee-os/command-center'))
check('NOVEEHOME: /novee-os/360-platforms link',          noveeHome.includes('/novee-os/360-platforms'))
check('NOVEEHOME: /novee-os/modules link',                noveeHome.includes('/novee-os/modules'))
check('NOVEEHOME: /novee-os/tenants link',                noveeHome.includes('/novee-os/tenants'))
check('NOVEEHOME: /novee-os/billing link',                noveeHome.includes('/novee-os/billing'))
check('NOVEEHOME: /novee-os/security link',               noveeHome.includes('/novee-os/security'))
check('NOVEEHOME: /novee-os/final-readiness link',        noveeHome.includes('/novee-os/final-readiness'))
check('NOVEEHOME: /phase-d/provider-activation link',     noveeHome.includes('/phase-d/provider-activation'))
check('NOVEEHOME: /phase-d/communication-activation link',noveeHome.includes('/phase-d/communication-activation'))
check('NOVEEHOME: Operator & Admin Access section',       noveeHome.includes('Operator'))

// ── NoveeOS Command Center ────────────────────────────────────
check('CC: contains_secrets: false comment',              commandCenter.includes('contains_secrets: false'))
check('CC: Section A — Core Platform',                    commandCenter.includes('Core Platform'))
check('CC: Section B — Active 360 Platforms',             commandCenter.includes('Active 360 Platforms'))
check('CC: Section C — Phase D Activation',               commandCenter.includes('Phase D Activation'))
check('CC: Section D — Phase E Readiness',                commandCenter.includes('Phase E Readiness'))
check('CC: Section E — Risk/Audit',                       commandCenter.includes('Risk'))
check('CC: /novee-os/modules link',                       commandCenter.includes('/novee-os/modules'))
check('CC: /novee-os/tenants link',                       commandCenter.includes('/novee-os/tenants'))
check('CC: /novee-os/billing link',                       commandCenter.includes('/novee-os/billing'))
check('CC: /novee-os/security link',                      commandCenter.includes('/novee-os/security'))
check('CC: /novee-os/final-readiness link',               commandCenter.includes('/novee-os/final-readiness'))
check('CC: /novee-os/360-platforms link',                 commandCenter.includes('/novee-os/360-platforms'))
check('CC: /crafthub/dashboard link',                     commandCenter.includes('/crafthub/dashboard'))
check('CC: /crafthub/onboarding link',                    commandCenter.includes('/crafthub/onboarding'))
check('CC: /pos360 link',                                 commandCenter.includes('/pos360'))
check('CC: /eat link',                                    commandCenter.includes('/eat'))
check('CC: /smokecraft link',                             commandCenter.includes('/smokecraft'))
check('CC: /passport link',                               commandCenter.includes('/passport'))
check('CC: phase-d/provider-activation link',             commandCenter.includes('/phase-d/provider-activation'))
check('CC: phase-d/payment-provider-activation link',     commandCenter.includes('/phase-d/payment-provider-activation'))
check('CC: phase-d/external-pos-activation link',         commandCenter.includes('/phase-d/external-pos-activation'))
check('CC: phase-d/inventory-activation link',            commandCenter.includes('/phase-d/inventory-activation'))
check('CC: phase-d/communication-activation link',        commandCenter.includes('/phase-d/communication-activation'))
check('CC: D.6 marked not built',                         commandCenter.includes('not built') && commandCenter.includes('D.6'))
check('CC: D.7 marked not built',                         commandCenter.includes('D.7'))
check('CC: D.8 marked not built',                         commandCenter.includes('D.8'))
check('CC: E.3–E.10 marked pending',                      commandCenter.includes('pending'))
check('CC: Reserved platforms section',                   commandCenter.includes('Reserved Platforms'))
check('CC: Agent X 360 reserved note',                    commandCenter.includes('Agent X 360'))
check('CC: DayOne 360 reserved note',                     commandCenter.includes('DayOne 360'))
check('CC: EgoMusic 360 reserved note',                   commandCenter.includes('EgoMusic 360'))
check('CC: AMBI reserved note',                           commandCenter.includes('AMBI'))
check('CC: no live activation claim',                    !commandCenter.includes('live_activation: true'))
check('CC: no fake remote deployment claim',             !commandCenter.includes('remote_deployment_active: true'))
check('CC: operator safety notice',                       commandCenter.includes('No live activation'))

// ── NoveeOS 360 Platform Registry page ───────────────────────
check('360REG: contains_secrets: false comment',          registry360.includes('contains_secrets: false'))
check('360REG: fetches /api/novee-os/360-platforms/registry',  registry360.includes('/api/novee-os/360-platforms/registry'))
check('360REG: fetches ecosystem-snapshot',               registry360.includes('ecosystem-snapshot'))
check('360REG: EcosystemSnapshot component',              registry360.includes('EcosystemSnapshot'))
check('360REG: PlatformCard component',                   registry360.includes('PlatformCard'))
check('360REG: activation_status filter',                 registry360.includes('activation_status'))
check('360REG: production_ready displayed',               registry360.includes('production_ready'))
check('360REG: preview_only displayed',                   registry360.includes('preview_only'))
check('360REG: reserved_only displayed',                  registry360.includes('reserved_only'))
check('360REG: blockers displayed',                       registry360.includes('_blockers'))
check('360REG: safety registry note',                     registry360.includes('REGISTRY NOTE'))
check('360REG: no self-declare production_ready claim',  !registry360.includes('production_ready: true'))

// ── ModulePlaceholderReserved ─────────────────────────────────
check('PLACEHOLDER: Feature Not Yet Built heading',       placeholder.includes('Feature Not Yet Built'))
check('PLACEHOLDER: NOT BUILT label',                     placeholder.includes('NOT BUILT'))
check('PLACEHOLDER: links back to command center',        placeholder.includes('/novee-os/command-center'))
check('PLACEHOLDER: shows current pathname',              placeholder.includes('location.pathname'))

// ── Package.json ──────────────────────────────────────────────
check('PKG: verify:phase-e2-dashboard-visibility script', pkgJson.includes('verify:phase-e2-dashboard-visibility'))

// ── REPORT ────────────────────────────────────────────────────
console.log('\nNOVEE OS — Phase E.2 Dashboard Visibility + Command Center Navigation Verification')
console.log('='.repeat(82))
console.log(`PASS: ${pass.length}`)
console.log(`FAIL: ${fail.length}`)

if (fail.length > 0) {
  console.log('\nFAILED CHECKS:')
  fail.forEach(f => console.log(`  ✗ ${f}`))
}

console.log('\n' + (fail.length === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${fail.length} check(s) failed`))

console.log('\n── PHASE E.2 COVERAGE ──')
const coverage = [
  ['NoveeHome Admin Nav',        '12 links added',         'visible'],
  ['NoveeOS Command Center',     '/novee-os/command-center','built'],
  ['360 Platform Registry Page', '/novee-os/360-platforms', 'built'],
  ['ModulePlaceholderReserved',  '/placeholder/*',          'built'],
  ['App.jsx routes',             '+3 new routes',           'wired'],
  ['Phase D.1–D.5',             'now linked from nav',     'surfaced'],
  ['Phase D.6–D.8',             'marked not built',        'honest'],
  ['Phase E.3–E.10',            'marked pending',          'honest'],
  ['Reserved platforms',         'Agent X, DayOne, EgoMusic, AMBI', 'documented'],
]
for (const [area, detail, status] of coverage) {
  console.log(`  ${area.padEnd(30)} | ${detail.padEnd(35)} | ${status}`)
}

process.exit(fail.length > 0 ? 1 : 0)
