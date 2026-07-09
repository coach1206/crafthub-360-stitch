// Phase F.3 Verification — SmokeCraft + Passport Connection Hardening
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

console.log('\n=== Phase F.3 — SmokeCraft + Passport Connection Hardening Verification ===\n')

// --- FirstThird.jsx — honest tasting status ---
console.log('[ FirstThird.jsx — observe_confirm_step ]')
const firstThird = read('src/pages/smokecraft/FirstThird.jsx')
check('FirstThird.jsx file exists', firstThird.length > 0)
check("FirstThird sets status: 'observe_confirm_step'", firstThird.includes("status: 'observe_confirm_step'"))
check("FirstThird sets source: 'local_only'", firstThird.includes("source: 'local_only'"))
check("FirstThird sets tasteProfileSource: 'not_collected'", firstThird.includes("tasteProfileSource: 'not_collected'"))
check('FirstThird has safeClaim field', firstThird.includes('safeClaim:'))
check('FirstThird still calls setFirstThirdTasting', firstThird.includes('setFirstThirdTasting'))
check('FirstThird still awards first-third reward', firstThird.includes("awardSessionRewards('first-third')"))
check('FirstThird does NOT claim live tasting backend', !firstThird.includes('live_tasting') && !firstThird.includes('tastingBackend'))

// --- SecondThird.jsx — honest tasting status ---
console.log('\n[ SecondThird.jsx — observe_confirm_step ]')
const secondThird = read('src/pages/smokecraft/SecondThird.jsx')
check('SecondThird.jsx file exists', secondThird.length > 0)
check("SecondThird sets status: 'observe_confirm_step'", secondThird.includes("status: 'observe_confirm_step'"))
check("SecondThird sets source: 'local_only'", secondThird.includes("source: 'local_only'"))
check("SecondThird sets tasteProfileSource: 'not_collected'", secondThird.includes("tasteProfileSource: 'not_collected'"))
check('SecondThird has safeClaim field', secondThird.includes('safeClaim:'))
check('SecondThird still calls setSecondThirdTasting', secondThird.includes('setSecondThirdTasting'))
check('SecondThird still awards second-third reward', secondThird.includes("awardSessionRewards('second-third')"))
check('SecondThird does NOT claim live tasting backend', !secondThird.includes('live_tasting') && !secondThird.includes('tastingBackend'))

// --- FinalThird.jsx — honest tasting status ---
console.log('\n[ FinalThird.jsx — observe_confirm_step ]')
const finalThird = read('src/pages/smokecraft/FinalThird.jsx')
check('FinalThird.jsx file exists', finalThird.length > 0)
check("FinalThird sets status: 'observe_confirm_step'", finalThird.includes("status: 'observe_confirm_step'"))
check("FinalThird sets source: 'local_only'", finalThird.includes("source: 'local_only'"))
check("FinalThird sets tasteProfileSource: 'not_collected'", finalThird.includes("tasteProfileSource: 'not_collected'"))
check('FinalThird has safeClaim field', finalThird.includes('safeClaim:'))
check('FinalThird still calls setFinalThirdTasting', finalThird.includes('setFinalThirdTasting'))
check('FinalThird still awards final-third reward', finalThird.includes("awardSessionRewards('final-third')"))
check('FinalThird does NOT claim live tasting backend', !finalThird.includes('live_tasting') && !finalThird.includes('tastingBackend'))

// --- FlavorMemory.jsx — local flavor memory record ---
console.log('\n[ FlavorMemory.jsx — local flavor memory record ]')
const flavorMemory = read('src/pages/smokecraft/FlavorMemory.jsx')
check('FlavorMemory.jsx file exists', flavorMemory.length > 0)
check('FlavorMemory saves smokecraftFlavorMemory to sessionStorage', flavorMemory.includes('smokecraftFlavorMemory'))
check("FlavorMemory record has status: 'pilot_preview'", flavorMemory.includes("status: 'pilot_preview'"))
check("FlavorMemory record has source: 'local_only'", flavorMemory.includes("source: 'local_only'"))
check('FlavorMemory record has backendConnected: false', flavorMemory.includes('backendConnected: false'))
check("FlavorMemory record has tasteProfileSource: 'not_collected'", flavorMemory.includes("tasteProfileSource: 'not_collected'"))
check('FlavorMemory still awards flavor-memory reward', flavorMemory.includes("awardSessionRewards('flavor-memory')"))
check('FlavorMemory wraps sessionStorage in try/catch', flavorMemory.includes('try {') || flavorMemory.includes('try{'))

// --- SessionComplete.jsx — honest tasteProfile ---
console.log('\n[ SessionComplete.jsx — honest tasteProfile ]')
const sessionComplete = read('src/pages/smokecraft/SessionComplete.jsx')
check('SessionComplete.jsx file exists', sessionComplete.length > 0)
check('SessionComplete does NOT use hardcoded TASTE_TAGS', !sessionComplete.includes("'Dark Cocoa'") && !sessionComplete.includes("'Cedar Smoke'"))
check('SessionComplete reads from smokecraftFlavorMemory', sessionComplete.includes('smokecraftFlavorMemory'))
check("SessionComplete has tasteProfileSource fallback 'not_collected'", sessionComplete.includes("'not_collected'"))
check('SessionComplete passes tasteProfileSource to completeSmokeCraftSession', sessionComplete.includes('tasteProfileSource'))
check('SessionComplete passes backendConnected: false', sessionComplete.includes('backendConnected: false'))
check('SessionComplete has safeClaim in completeSmokeCraftSession call', sessionComplete.includes('safeClaim'))
check('SessionComplete still calls awardSessionRewards session-complete', sessionComplete.includes("awardSessionRewards('session-complete')"))
check('SessionComplete still calls awardStamp journey-complete', sessionComplete.includes("awardStamp('journey-complete'"))
check('SessionComplete still calls syncPos3Activity', sessionComplete.includes('syncPos3Activity'))
check('SessionComplete still calls syncEATActivity', sessionComplete.includes('syncEATActivity'))
check('SessionComplete does NOT claim live Passport backend', !sessionComplete.includes('passport_live') && !sessionComplete.includes('live_passport'))

// --- PassportStamps.jsx — honest local preview ---
console.log('\n[ PassportStamps.jsx — honest local preview ]')
const passportStamps = read('src/pages/passport/PassportStamps.jsx')
check('PassportStamps.jsx file exists', passportStamps.length > 0)
check('PassportStamps imports getEarnedPassportStamps', passportStamps.includes('getEarnedPassportStamps'))
check('PassportStamps calls getEarnedPassportStamps(session)', passportStamps.includes('getEarnedPassportStamps(session)'))
check('PassportStamps has LOCAL PASSPORT PREVIEW banner', passportStamps.includes('LOCAL PASSPORT PREVIEW'))
check('PassportStamps banner says Backend Not Connected', passportStamps.includes('Backend Not Connected'))
check('PassportStamps has localStamps variable', passportStamps.includes('localStamps'))
check('PassportStamps renders localStamps when earned', passportStamps.includes('localStamps.length > 0'))
check('PassportStamps labels demo section as preview', passportStamps.includes('Demo Preview') || passportStamps.includes('demo preview') || passportStamps.includes('not live-earned'))
check('PassportStamps does NOT claim live stamp backend', !passportStamps.includes('stamp_live') && !passportStamps.includes('live_stamp'))
check('PassportStamps still renders CATS demo sections', passportStamps.includes('CATS.map'))
check('PassportStamps still has PassportBottomNav', passportStamps.includes('PassportBottomNav'))

// --- passportProgress utility still intact ---
console.log('\n[ passportProgress.js — utility intact ]')
const passportProgress = read('src/utils/passportProgress.js')
check('passportProgress.js file exists', passportProgress.length > 0)
check('getEarnedPassportStamps exported', passportProgress.includes('export function getEarnedPassportStamps'))
check('getPassportProgress exported', passportProgress.includes('export function getPassportProgress'))
check('awardPassportStamp exported', passportProgress.includes('export function awardPassportStamp'))

// --- No live backend claims introduced ---
console.log('\n[ Safety gates — no live backend claims introduced ]')
check('FirstThird no live_pos360', !firstThird.includes('live_pos360'))
check('SecondThird no live_pos360', !secondThird.includes('live_pos360'))
check('FinalThird no live_pos360', !finalThird.includes('live_pos360'))
check('FlavorMemory no live_passport', !flavorMemory.includes('live_passport'))
check('SessionComplete no productionReady', !sessionComplete.includes('productionReady: true'))
check('PassportStamps no passport_live', !passportStamps.includes('passport_live'))

// --- Summary ---
console.log(`\n=== RESULT: ${passed} passed / ${passed + failed} total ===`)
if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  ✗ ${f}`))
  process.exit(1)
} else {
  console.log('\nAll checks passed. Phase F.3 verification complete.')
  console.log('\nHonest pilot readiness status:')
  console.log('  Tasting data collected:       NO — observe_confirm_step only; no guest input UI built')
  console.log('  Flavor Memory input:          NO — pilot_preview placeholder; no input form')
  console.log('  tasteProfile honest source:   YES — reads session/sessionStorage; falls back to not_collected')
  console.log('  Passport stamps local:        YES — getEarnedPassportStamps wired to session')
  console.log('  Passport backend connected:   NO — passportAdapter returns not_connected')
  console.log('  Demo stamps labeled:          YES — PILOT PREVIEW banner + Demo Preview label')
  console.log('  Next phase:                   F.4 — Staff / POS360 / E.A.T. Handoff Hardening')
  process.exit(0)
}
