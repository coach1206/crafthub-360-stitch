/**
 * Verification: SmokeCraft /smokecraft/identity — current live-DOM contract.
 *
 * Identity was intentionally migrated away from the old screenshot/hotspot
 * architecture. This verifier checks the production behavior that exists now:
 * semantic fields, validation, autosave, enroll gate, haptics, one primary
 * NavBar action, route registration, and no fake live-service claims.
 */

import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../')
let passed = 0
let failed = 0

function check(label, ok, detail = '') {
  if (ok) { console.log(`  ✅ ${label}`); passed++ }
  else { console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`); failed++ }
}
function read(relPath) {
  const p = resolve(ROOT, relPath)
  return existsSync(p) ? readFileSync(p, 'utf8') : null
}

console.log('\nSmokeCraft /smokecraft/identity Live DOM Verification\n')
const identity = read('src/pages/smokecraft/Identity.jsx')
const app = read('src/App.jsx')

console.log('Gate 1 — Live DOM architecture')
check('Identity.jsx exists', Boolean(identity))
if (identity) {
  check('Identity uses SmokeCraftScreenShell', identity.includes('SmokeCraftScreenShell'))
  check('Identity uses shared SmokeCraftNavBar', identity.includes('SmokeCraftNavBar'))
  check('Identity uses owner hero background as photography, not baked UI', identity.includes('SmokeCraftOwnerHeroBackground'))
  check('Identity explicitly documents no baked screenshot UI/hotspot', identity.includes('No baked screenshot UI or click hotspot'))
  check('Identity does not render legacy SmokeCraftAssetRoute', !identity.includes('<SmokeCraftAssetRoute'))
  check('Identity does not render SmokeCraftHotspotLayer', !identity.includes('<SmokeCraftHotspotLayer'))
}

console.log('\nGate 2 — Semantic identity form')
if (identity) {
  for (const field of ['fullName','email','preferredName','birthDate','country','experienceLevel','focusArea']) {
    check(`Identity field ${field} present`, identity.includes(`'${field}'`) || identity.includes(`\"${field}\"`))
  }
  check('Required full name validation exists', identity.includes('Full name is required'))
  check('Required experience validation exists', identity.includes('Please select your experience level'))
  check('Email validation exists', identity.includes('EMAIL_RE'))
  check('Accessible validation state exists', identity.includes('aria-invalid'))
  check('Status region exists', identity.includes('data-testid="identity-status"'))
}

console.log('\nGate 3 — Persistence and progression')
if (identity) {
  check('Journey identity setter imported/used', identity.includes('setIdentity'))
  check('Autosave status is represented', identity.includes("setSaveStatus('saving')") && identity.includes("setSaveStatus('saved')"))
  check('Enroll gate redirects non-demo users', identity.includes("navigate('/smokecraft/enroll', { replace: true })"))
  check('Continue action validates before navigation', identity.includes('Object.keys(errors).length > 0'))
  check('Continue action awards identity rewards', identity.includes("awardSessionRewards('identity')"))
  check('Continue action targets venue selection', identity.includes("navigate('/smokecraft/venue-select')"))
  check('Primary NavBar action calls handleBegin', identity.includes('onPrimary={handleBegin}'))
  check('Back action returns to enroll', identity.includes("navigate('/smokecraft/enroll')"))
  check('Navigation remains non-blocking', !identity.match(/await\s+navigate/))
}

console.log('\nGate 4 — Journey shortcuts and Golden Box wording')
if (identity) {
  check('Golden Box may exist only as a journey destination, not an Open the Box CTA', identity.includes("label: 'Golden Box'") && !identity.includes('Open the Box') && !identity.includes('OPEN THE BOX'))
  check('Shortcut buttons use real navigate()', identity.includes('navigate(item.route)'))
  check('Locked journey destinations are disabled', identity.includes('disabled={!unlocked}'))
  check('Current route uses currentAllowed', identity.includes('currentAllowed'))
}

console.log('\nGate 5 — Route registration')
check('App.jsx exists', Boolean(app))
if (app) {
  check('Identity component imported or lazily loaded', app.includes('Identity'))
  check('/smokecraft/identity child route registered', app.includes('path="identity"') || app.includes("path='identity'"))
  check('SmokeCraft session guard architecture still present', app.includes('SmokeCraftSessionGuard'))
}

console.log('\nGate 6 — Safety and interaction quality')
if (identity) {
  check('Haptic confirmation is used', identity.includes('triggerHaptic'))
  check('Double submission is prevented', identity.includes('if (submitting) return'))
  check('No fake payment-live claim', !identity.match(/payments?.*live/i))
  check('No fake POS-connected claim', !identity.match(/pos.*connected/i))
  check('Only one primary continue control is intentionally used', identity.includes('One real control, not two'))
}

console.log(`\n─────────────────────────────────────────────────`)
console.log(`SmokeCraft Identity Live DOM: ${passed + failed} checks, ${passed} passed, ${failed} failed`)
if (failed === 0) {
  console.log('\n✅ /smokecraft/identity matches the current live-DOM production contract.')
  process.exit(0)
}
console.log('\n❌ Identity live-DOM issues found — fix before deployment.')
process.exit(1)
