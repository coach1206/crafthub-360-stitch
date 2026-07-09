// Phase F.2 Verification — SmokeCraft 360 Critical Bug Fixes
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

let passed = 0
let failed = 0
const failures = []

function check(label, condition) {
  if (condition) {
    passed++
    console.log(`  ✓ ${label}`)
  } else {
    failed++
    failures.push(label)
    console.log(`  ✗ FAIL: ${label}`)
  }
}

function read(rel) {
  try { return readFileSync(resolve(process.cwd(), rel), 'utf8') } catch { return '' }
}

function fileExists(rel) {
  return existsSync(resolve(process.cwd(), rel))
}

console.log('\n=== Phase F.2 — SmokeCraft 360 Critical Bug Fixes Verification ===\n')

// --- Identity reward key ---
console.log('[ Identity.jsx — reward key consistency ]')
const identity = read('src/pages/smokecraft/Identity.jsx')
check('Identity.jsx file exists', identity.length > 0)
check('Identity uses SmokeCraftAssetRoute', identity.includes('SmokeCraftAssetRoute'))

// The SESSION_REWARDS key for session 2 (identity/profile-capture screen) is 'enroll'.
// Route /smokecraft/identity is an alias of /smokecraft/enroll. 'enroll' is intentional.
const sessionRewards = read('src/constants/smokecraftRewards.js')
check("SESSION_REWARDS has 'enroll' key (session 2)", sessionRewards.includes("enroll:") || sessionRewards.includes("'enroll'"))
check("Identity.jsx awards 'enroll' (correct SESSION_REWARDS key for session 2)", identity.includes("awardSessionRewards('enroll')"))
check("Identity.jsx does NOT award 'identity' (not a valid SESSION_REWARDS key)", !identity.includes("awardSessionRewards('identity')"))
check("Identity.jsx has clarifying comment for 'enroll' key", identity.includes("SESSION_REWARDS key for session 2"))
check("SESSION_REWARDS 'enroll' has unlockSignal 'golden-box' (consistent unlock chain)", sessionRewards.includes("unlockSignal: 'golden-box'"))

// --- PairingLab hotspot fix ---
console.log('\n[ PairingLab.jsx — hotspot fix ]')
const pairingLab = read('src/pages/smokecraft/PairingLab.jsx')
check('PairingLab.jsx file exists', pairingLab.length > 0)
check('PairingLab uses SmokeCraftAssetRoute', pairingLab.includes('SmokeCraftAssetRoute'))
check('PairingLab does NOT use click-anywhere div pattern', !pairingLab.includes('<div onClick={handleContinue}'))
check('PairingLab does NOT use raw SmokeCraftAssetScreen as root', !pairingLab.match(/<SmokeCraftAssetScreen[\s\S]*?alt="Pairing Lab"/))
check('PairingLab has named HOTSPOTS array', pairingLab.includes('const HOTSPOTS'))
check("PairingLab hotspot routes to /smokecraft/visit-complete", pairingLab.includes('/smokecraft/visit-complete'))
check("PairingLab awards 'pairing-lab' reward", pairingLab.includes("awardSessionRewards('pairing-lab')"))
check("PairingLab hotspot has a label", pairingLab.includes('label:'))
check("PairingLab image is smokecraft-pairing-lab.png", pairingLab.includes('smokecraft-pairing-lab.png'))
check("PairingLab route prop is /smokecraft/pairing-lab", pairingLab.includes('/smokecraft/pairing-lab'))
check("PairingLab SmokeCraftMenuButton preserved", pairingLab.includes('SmokeCraftMenuButton'))

// --- FinalReview hotspot fix ---
console.log('\n[ FinalReview.jsx — hotspot fix ]')
const finalReview = read('src/pages/smokecraft/FinalReview.jsx')
check('FinalReview.jsx file exists', finalReview.length > 0)
check('FinalReview uses SmokeCraftAssetRoute', finalReview.includes('SmokeCraftAssetRoute'))
check('FinalReview does NOT use click-anywhere div pattern', !finalReview.includes('<div onClick={handleContinue}'))
check('FinalReview does NOT use raw SmokeCraftAssetScreen as root', !finalReview.match(/<SmokeCraftAssetScreen[\s\S]*?alt="SmokeCraft Final Review"/))
check('FinalReview has named HOTSPOTS array', finalReview.includes('const HOTSPOTS') || finalReview.includes('hotspots'))
check("FinalReview hotspot routes to /smokecraft/passport-stamp", finalReview.includes('/smokecraft/passport-stamp'))
check("FinalReview awards 'final-review' reward", finalReview.includes("awardSessionRewards('final-review')"))
check("FinalReview hotspot has a label", finalReview.includes('label:'))
check("FinalReview image is smokecraft-final-review.png", finalReview.includes('smokecraft-final-review.png'))
check("FinalReview route prop is /smokecraft/final-review", finalReview.includes('/smokecraft/final-review'))

// --- SmokeCraftVisualProof stale flags removed ---
console.log('\n[ SmokeCraftVisualProof.jsx — stale missing flags ]')
const proof = read('src/pages/smokecraft/SmokeCraftVisualProof.jsx')
check('SmokeCraftVisualProof.jsx file exists', proof.length > 0)
check('First Third NOT in missingScreens as missing', !proof.includes('"First Third", note: "Only a 521'))
check('Second Third NOT in missingScreens as missing', !proof.includes('"Second Third", note: "flavor-dna.png'))
check('Final Review NOT in missingScreens as missing', !proof.includes('"Final Review", note: "final-review-bg.jpg'))
check('Shape/Size/Burn NOT in missingScreens as missing', !proof.includes('"Shape / Size / Burn", note: "No approved'))
check('smokecraft-vitola.png appears in proof screens', proof.includes('smokecraft-vitola.png'))
check('smokecraft-first-third.png appears in proof screens', proof.includes('smokecraft-first-third.png'))
check('smokecraft-second-third.png appears in proof screens', proof.includes('smokecraft-second-third.png'))
check('smokecraft-final-review.png appears in proof screens', proof.includes('smokecraft-final-review.png'))
check('Visual Proof page preserved (not deleted)', proof.includes('export default function SmokeCraftVisualProof'))

// --- Approved image files still exist ---
console.log('\n[ Approved image files — existence check ]')
const APPROVED = 'public/assets/smokecraft-reference/approved'
check(`${APPROVED}/smokecraft-pairing-lab.png exists`, fileExists(`${APPROVED}/smokecraft-pairing-lab.png`))
check(`${APPROVED}/smokecraft-final-review.png exists`, fileExists(`${APPROVED}/smokecraft-final-review.png`))
check(`${APPROVED}/smokecraft-first-third.png exists`, fileExists(`${APPROVED}/smokecraft-first-third.png`))
check(`${APPROVED}/smokecraft-second-third.png exists`, fileExists(`${APPROVED}/smokecraft-second-third.png`))
check(`${APPROVED}/smokecraft-vitola.png exists`, fileExists(`${APPROVED}/smokecraft-vitola.png`))
check(`${APPROVED}/smokecraft-profile-capture.png exists`, fileExists(`${APPROVED}/smokecraft-profile-capture.png`))
check(`${APPROVED}/smokecraft-gold-box-rules.png exists`, fileExists(`${APPROVED}/smokecraft-gold-box-rules.png`))
check(`${APPROVED}/smokecraft-session-complete.png exists`, fileExists(`${APPROVED}/smokecraft-session-complete.png`))
check(`${APPROVED}/smokecraft-passport-stamp.png exists`, fileExists(`${APPROVED}/smokecraft-passport-stamp.png`))

// --- App.jsx route integrity ---
console.log('\n[ App.jsx — SmokeCraft route integrity ]')
const appJsx = read('src/App.jsx')
check('/smokecraft/identity route preserved', appJsx.includes('/smokecraft/identity') || appJsx.includes("smokecraft/identity"))
check('/smokecraft/pairing-lab route preserved', appJsx.includes('pairing-lab'))
check('/smokecraft/final-review route preserved', appJsx.includes('final-review'))
check('/smokecraft/passport-stamp route preserved', appJsx.includes('passport-stamp'))
check('/smokecraft/session-complete route preserved', appJsx.includes('session-complete'))
check('/smokecraft/management-sync route preserved', appJsx.includes('management-sync'))

// --- No live backend claims added ---
console.log('\n[ Safety gates — no live claims added ]')
const pairingLabFull = read('src/pages/smokecraft/PairingLab.jsx')
const finalReviewFull = read('src/pages/smokecraft/FinalReview.jsx')
const identityFull = read('src/pages/smokecraft/Identity.jsx')
check('PairingLab does not claim live POS360', !pairingLabFull.includes('live_pos360') && !pairingLabFull.includes('pos360_live'))
check('FinalReview does not claim live Passport backend', !finalReviewFull.includes('passport_live') && !finalReviewFull.includes('live_passport'))
check('Identity does not claim production-ready', !identityFull.includes('production_ready') && !identityFull.includes('pilot_ready'))
check('SmokeCraft not marked production-ready in any fixed file', !pairingLabFull.includes('productionReady: true') && !finalReviewFull.includes('productionReady: true'))

// --- Summary ---
console.log(`\n=== RESULT: ${passed} passed / ${passed + failed} total ===`)
if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  ✗ ${f}`))
  process.exit(1)
} else {
  console.log('\nAll checks passed. Phase F.2 verification complete.')
  console.log('\nHonest pilot readiness status:')
  console.log('  SmokeCraft pilot-ready:      NO — tasting data, Passport backend, POS360 live handoff, E.A.T. sync remain unbuilt')
  console.log('  Passport backend connected:  NO — passportAdapter returns not_connected')
  console.log('  POS360 live handoff:         NO — preview only')
  console.log('  E.A.T. live sync:            NO — eatAdapter returns not_connected')
  console.log('  Next phase:                  F.3 — Passport Connection Hardening')
  process.exit(0)
}
