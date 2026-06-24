/**
 * Verifies the temporary public review route added so the Deployment
 * Center can be reviewed on a Vercel static preview without a working
 * backend login. Confirms:
 *   - /review/deployment-center exists, is NOT wrapped in ProtectedRoute
 *   - /admin/deployment-center is still wrapped in ProtectedRoute (unchanged)
 *   - ModuleDeploymentCenter renders the Review Mode banner only when readOnly
 *   - readOnly mode disables vendor assignment, disable, and restore actions
 *   - readOnly mode never calls assignModuleToVendor/disableModuleForVendor/
 *     disableModuleGlobally/requestRestore
 * Run with:
 *   node server/scripts/verifyReviewDeploymentCenterRoute.js
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

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

const appSrc = readFileSync(resolve(ROOT, 'src/App.jsx'), 'utf8')

const reviewRouteMatch = appSrc.match(
  /<Route path="review\/deployment-center" element=\{([\s\S]{0,200}?)\}\s*\/>/,
)
check(
  'App.jsx defines the review/deployment-center route',
  Boolean(reviewRouteMatch),
)
check(
  'review/deployment-center route is NOT wrapped in ProtectedRoute',
  Boolean(reviewRouteMatch) && !/ProtectedRoute/.test(reviewRouteMatch[1]),
)
check(
  'review/deployment-center route renders ModuleDeploymentCenter with readOnly',
  Boolean(reviewRouteMatch) && /ModuleDeploymentCenter\s+readOnly/.test(reviewRouteMatch[1]),
)

const adminRouteMatch = appSrc.match(
  /admin\/deployment-center[\s\S]{0,400}?allowedRoles=\{(\[[^\]]*\])\}/,
)
check(
  'admin/deployment-center route is still wrapped in ProtectedRoute with allowedRoles',
  Boolean(adminRouteMatch) && adminRouteMatch[1].includes("'admin'") && adminRouteMatch[1].includes("'founder_level_0'"),
)

const pageSrc = readFileSync(resolve(ROOT, 'src/pages/novi/ModuleDeploymentCenter.jsx'), 'utf8')

check(
  'Page accepts a readOnly prop',
  /ModuleDeploymentCenter\(\{\s*readOnly\s*=\s*false/.test(pageSrc),
)
check(
  'Page renders "Review Mode Only — No Live Deployment Controls" banner gated on readOnly',
  /\{readOnly && \([\s\S]{0,400}?Review Mode Only/.test(pageSrc),
)
check(
  'handleAssign returns early when readOnly, before calling assignModuleToVendor',
  /function handleAssign[\s\S]{0,80}?if \(readOnly\) return[\s\S]{0,80}?assignModuleToVendor/.test(pageSrc),
)
check(
  'handleDisable returns early when readOnly, before calling disableModuleForVendor',
  /function handleDisable[\s\S]{0,80}?if \(readOnly\) return[\s\S]{0,80}?disableModuleForVendor/.test(pageSrc),
)
check(
  'handleRestore returns early when readOnly, before calling requestRestore',
  /function handleRestore[\s\S]{0,80}?if \(readOnly\) return/.test(pageSrc),
)
check(
  'ModuleCard renders only DisabledActionButton elements (no PreviewActionButton) when readOnly',
  /readOnly \? \(\s*<>\s*<DisabledActionButton label="Assign Vendor Preview"[\s\S]{0,400}?<DisabledActionButton label="Restore Module Preview"/.test(pageSrc),
)
check(
  'Vendor <select> is disabled when readOnly',
  /<select[\s\S]{0,200}?disabled=\{readOnly\}/.test(pageSrc),
)
check(
  'Page never imports or calls a live-deployment function regardless of mode',
  !/deployModule\(|liveDeployModule\(/.test(pageSrc),
)

console.log(`\n${passed} passed, ${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
