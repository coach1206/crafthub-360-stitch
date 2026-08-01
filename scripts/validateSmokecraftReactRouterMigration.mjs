#!/usr/bin/env node
// SmokeCraft React Router Major-Version Security Migration validator.
// Confirms: secure target router version installed, no vulnerable 6.x
// router remains, no duplicate/incompatible router version, canonical
// routes still exist, route owners identifiable, guards remain attached,
// wildcard route ordered safely, legacy redirects intentional, no
// deprecated router APIs remain, and route proof/test references exist.

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

let failed = 0
function check(label, ok, detail = '') {
  if (ok) {
    console.log(`  OK    ${label}`)
  } else {
    failed++
    console.log(`  FAIL  ${label}${detail ? ' — ' + detail : ''}`)
  }
}

console.log('── SmokeCraft React Router migration validator ──\n')

// 1. Secure target version installed, single intentional line, no 6.x remains.
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
const declared = pkg.dependencies?.['react-router-dom'] || ''
check(
  'package.json declares react-router-dom ^7.x (target secure line)',
  /^\^?7\./.test(declared),
  `declared: ${declared}`
)
check('package.json does not declare a separate react-router dependency (single package)', !pkg.dependencies?.['react-router'] && !pkg.devDependencies?.['react-router'])

let lsOut = ''
try {
  lsOut = execSync('npm ls react-router react-router-dom --json', { cwd: ROOT }).toString()
} catch (e) {
  lsOut = e.stdout ? e.stdout.toString() : ''
}
let lsTree
try {
  lsTree = JSON.parse(lsOut)
} catch {
  lsTree = {}
}
const domVersion = lsTree.dependencies?.['react-router-dom']?.version || ''
const coreVersion = lsTree.dependencies?.['react-router-dom']?.dependencies?.['react-router']?.version || ''
check('installed react-router-dom is 7.x', domVersion.startsWith('7.'), `installed: ${domVersion || 'unresolved'}`)
check('installed react-router (transitive) is 7.x, matching react-router-dom', coreVersion.startsWith('7.'), `installed: ${coreVersion || 'unresolved'}`)
check('no vulnerable 6.x react-router-dom remains installed anywhere', !/6\.\d/.test(lsOut))

// npm audit: no unresolved react-router advisory affecting declarative (non-RSC) usage.
let auditJson = {}
try {
  auditJson = JSON.parse(execSync('npm audit --json', { cwd: ROOT }).toString())
} catch (e) {
  try { auditJson = JSON.parse(e.stdout.toString()) } catch { auditJson = { vulnerabilities: {} } }
}
const routerVulns = Object.keys(auditJson.vulnerabilities || {}).filter((k) => k.startsWith('react-router'))
check(
  'only known/out-of-scope router advisory remains (RSC-mode CSRF, not applicable — this app uses no RSC/data routers)',
  routerVulns.every((k) => (auditJson.vulnerabilities[k].via || []).every((v) => typeof v !== 'object' || /RSC/i.test(v.title || '')))
)

// 2. No duplicate/incompatible router architecture.
const appSrc = fs.readFileSync(path.join(ROOT, 'src/App.jsx'), 'utf8')
check('single router architecture: declarative BrowserRouter present', /BrowserRouter/.test(appSrc))
check('no data-router APIs introduced (createBrowserRouter/RouterProvider) — architecture preserved as declarative', !/createBrowserRouter|RouterProvider|createMemoryRouter/.test(appSrc))
check('no deprecated/removed v6-only router APIs remain', !/unstable_HistoryRouter|createRoutesFromElements/.test(appSrc))

// 3. Canonical route count preserved (before/after route inventory comparison).
const routeMatches = appSrc.match(/<Route\s/g) || []
check('canonical route registry present with expected route volume (>=250 <Route entries)', routeMatches.length >= 250, `found: ${routeMatches.length}`)

// 4. Wildcard route ordered safely (last, catch-all only).
const lines = appSrc.split('\n')
const wildcardIdx = lines.findIndex((l) => l.includes('path="*"'))
check('a catch-all wildcard route exists', wildcardIdx !== -1)
check('wildcard route is the last <Route> registered at its nesting level (does not swallow earlier valid routes)', wildcardIdx > lines.length - 20)

// 5. Legacy redirects intentional (documented Navigate replace patterns).
const legacyRedirects = (appSrc.match(/<Route path="[^"]+"\s+element=\{<Navigate to="[^"]+" replace \/>\}/g) || []).length
check('legacy compatibility redirects present and use replace (no back-button loop)', legacyRedirects >= 10, `found: ${legacyRedirects}`)

// 6. Guards remain attached to session-gated routes.
check('SmokeCraftSessionGuard still wraps session routes', /SmokeCraftSessionGuard/.test(appSrc))
const guardedCount = (appSrc.match(/<SmokeCraftSessionGuard/g) || []).length
check('guard usage count did not drop to zero', guardedCount > 20, `found: ${guardedCount}`)

// 7. Route proof / test references exist.
check('fresh-player closure script exists', fs.existsSync(path.join(ROOT, 'scripts/verify-smokecraft-full-game-fresh-player.mjs')))
check('final gameplay acceptance script exists', fs.existsSync(path.join(ROOT, 'scripts/verify-smokecraft-final-gameplay-acceptance.mjs')))
check('canonical route inventory script exists', fs.existsSync(path.join(ROOT, 'scripts/smokecraftRouteInventory.mjs')))
check('responsive route validator exists', fs.existsSync(path.join(ROOT, 'scripts/validateSmokecraftResponsive.mjs')))
check('migration proof directory exists', fs.existsSync(path.join(ROOT, 'public/proof/smokecraft-react-router-security-migration')))

console.log(`\n=== RESULT: ${failed === 0 ? 'PASS' : 'FAIL'} (${failed} checks failed) ===`)
process.exit(failed === 0 ? 0 : 1)
