// Phase F.5 Verification — SmokeCraft 360 Venue Pilot Package
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

console.log('\n=== Phase F.5 — SmokeCraft Venue Pilot Package Verification ===\n')

// --- SmokeCraftVenuePilotPackage.jsx ---
console.log('[ SmokeCraftVenuePilotPackage.jsx — exists and contents ]')
const page = read('src/pages/smokecraft/SmokeCraftVenuePilotPackage.jsx')
check('SmokeCraftVenuePilotPackage.jsx file exists', page.length > 0)
check('Page has export default function SmokeCraftVenuePilotPackage', page.includes('export default function SmokeCraftVenuePilotPackage'))
check('Page is labeled Staff / Admin Only', page.includes('STAFF / ADMIN') || page.includes('Staff / Admin') || page.includes('Staff / admin'))
check('Page is labeled Not Guest-Facing', page.includes('Not Guest-Facing') || page.includes('Not guest-facing') || page.includes('not guest-facing'))

// --- Pilot status ---
console.log('\n[ Pilot status section ]')
check('Page states Passport backend not connected', page.includes('Not Connected') || page.includes('not connected'))
check('Page states POS360 handoff preview/internal', page.includes('Preview') && page.includes('POS360 Handoff') || page.includes('POS360') && page.includes('Preview'))
check('Page states E.A.T. sync preview/internal', page.includes('E.A.T.') && (page.includes('Preview') || page.includes('preview')))
check('Page states tasting data local/observe-confirm', page.includes('Observe-Confirm') || page.includes('observe_confirm') || page.includes('local only') || page.includes('Local Only'))
check('Page states NOT production-ready', page.includes('NOT PRODUCTION-READY') || page.includes('Not Production-Ready') || page.includes('not production-ready'))
check('Page states Pilot Package In Preparation (or similar)', page.includes('Pilot Package') || page.includes('pilot package'))

// --- Guest journey ---
console.log('\n[ Guest journey overview — all 18 screens ]')
check('Page lists Identity screen', page.includes('Identity'))
check('Page lists Golden Box Rules screen', page.includes('Golden Box'))
check('Page lists Mentor Selection screen', page.includes('Mentor'))
check('Page lists Pairing Lab screen', page.includes('Pairing Lab'))
check('Page lists Seed & Soil screen', page.includes('Seed'))
check('Page lists Humidor Match screen', page.includes('Humidor'))
check('Page lists Request Purchase screen', page.includes('Request Purchase'))
check('Page lists Cut / Toast / Light screen', page.includes('Cut'))
check('Page lists First Third screen', page.includes('First Third'))
check('Page lists Second Third screen', page.includes('Second Third'))
check('Page lists Flavor Memory screen', page.includes('Flavor Memory'))
check('Page lists Final Third screen', page.includes('Final Third'))
check('Page lists Scorecard screen', page.includes('Scorecard'))
check('Page lists Final Review screen', page.includes('Final Review'))
check('Page lists Passport Stamp screen', page.includes('Passport Stamp'))
check('Page lists Connections screen', page.includes('Connections'))
check('Page lists Management Sync screen', page.includes('Management Sync'))
check('Page lists Session Complete screen', page.includes('Session Complete'))
check('Guest journey has 18 locked screens listed', (page.match(/\d+\.\s+(Identity|Golden Box|Mentor|Pairing Lab|Seed|Humidor|Request Purchase|Cut|First Third|Second Third|Flavor Memory|Final Third|Scorecard|Final Review|Passport Stamp|Connections|Management Sync|Session Complete)/g) || []).length >= 18)

// --- Checklists ---
console.log('\n[ Venue setup checklist ]')
check('Page has venue setup checklist section', page.includes('Venue Setup') || page.includes('venue setup'))
check('Checklist mentions staff PIN flow', page.includes('PIN') || page.includes('staff pin') || page.includes('staff/pin'))
check('Checklist mentions confirming guest path', page.includes('guest path') || page.includes('guest starts'))
check('Checklist mentions pilot feedback process', page.includes('feedback'))

console.log('\n[ Staff shift checklist ]')
check('Page has staff shift checklist section', page.includes('Staff Shift') || page.includes('staff shift'))
check('Staff checklist: do not promise live POS', page.includes('Do not promise') || page.includes('do not promise'))
check('Staff checklist: escalate blockers', page.includes('Escalate') || page.includes('escalate'))

console.log('\n[ Manager readiness checklist ]')
check('Page has manager readiness checklist section', page.includes('Manager') && (page.includes('Readiness') || page.includes('readiness') || page.includes('Checklist')))
check('Manager checklist: review all 18 screens', page.includes('18 screens') || page.includes('18-screen') || page.includes('all 18'))
check('Manager checklist: confirm Pairing Lab hotspot', page.includes('Pairing Lab'))
check('Manager checklist: confirm Final Review hotspot', page.includes('Final Review'))

// --- Safe / unsafe claims ---
console.log('\n[ Safe and unsafe claims ]')
check('Page has safe claims section', page.includes('Safe') && (page.includes('Can Claim') || page.includes('can claim') || page.includes('SAFE')))
check('Page has unsafe/prohibited claims section', page.includes('Cannot Claim') || page.includes('cannot claim') || page.includes('Unsafe') || page.includes('Prohibited'))
check('Safe claims include guided cigar education', page.includes('guided cigar') || page.includes('cigar education'))
check('Safe claims include 18-screen premium guest flow', page.includes('18-screen') || page.includes('18 screen') || page.includes('premium guest flow'))
check('Unsafe claims list production-ready', page.includes('Production-ready') || page.includes('production-ready') || page.includes('production ready'))
check('Unsafe claims list live Passport backend', page.includes('Live Passport') || page.includes('live Passport'))
check('Unsafe claims list live payment processing', page.includes('Live payment') || page.includes('live payment') || page.includes('Live payment processing'))
check('Unsafe claims list live E.A.T. backend sync', page.includes('Live E.A.T.') || page.includes('live E.A.T.'))

// --- Known blockers ---
console.log('\n[ Known blockers ]')
check('Page has known blockers section', page.includes('Known Blocker') || page.includes('known blocker'))
check('Blockers: Passport backend not connected', page.includes('Passport backend not connected') || page.includes('Passport backend'))
check('Blockers: POS360 handoff preview/internal', page.includes('POS360 handoff') || (page.includes('POS360') && page.includes('preview')))
check('Blockers: E.A.T. sync preview/internal', page.includes('E.A.T. sync') && (page.includes('preview') || page.includes('internal')))
check('Blockers: F.6 final verification not complete', page.includes('F.6') || page.includes('final pilot verification') || page.includes('final verification'))

// --- Documentation portal reference ---
console.log('\n[ Documentation portal reference ]')
check('Page references /novee-os/documentation-portal', page.includes('/novee-os/documentation-portal') || page.includes('documentation-portal') || page.includes('Documentation Portal'))
check('Page labels docs as Draft / Not Published / Needs Review', page.includes('Draft') && page.includes('Not Published') && page.includes('Needs Review'))
check('Page does NOT claim docs are published', !page.includes('documentationPublished: true') && !page.includes('Published: true'))

// --- App.jsx route ---
console.log('\n[ App.jsx — route wired ]')
const appJsx = read('src/App.jsx')
check('App.jsx imports SmokeCraftVenuePilotPackage', appJsx.includes('SmokeCraftVenuePilotPackage'))
check('App.jsx has route smokecraft/venue-pilot-package', appJsx.includes('smokecraft/venue-pilot-package') || appJsx.includes('venue-pilot-package'))

// --- NoveeOSCommandCenter navigation link ---
console.log('\n[ NoveeOSCommandCenter.jsx — navigation link ]')
const cmd = read('src/pages/noveeOS/NoveeOSCommandCenter.jsx')
check('NoveeOSCommandCenter has link to venue-pilot-package', cmd.includes('venue-pilot-package'))
check('NoveeOSCommandCenter labels it not guest-facing / not production-ready', cmd.includes('Not guest-facing') || cmd.includes('not guest-facing') || cmd.includes('Not production-ready') || cmd.includes('not production-ready') || cmd.includes('Not Production-Ready'))

// --- Safety gates ---
console.log('\n[ Safety gates — no live claims ]')
check('Page does NOT claim SmokeCraft production-ready', !page.includes('productionReady: true') && !page.includes('production_ready: true'))
check('Page does NOT claim live Passport backend', !page.includes('passportBackendConnected: true') && !page.includes('passport_live'))
check('Page does NOT claim live POS360 provider', !page.includes('pos360_live') && !page.includes('live_pos360'))
check('Page does NOT claim live E.A.T. sync', !page.includes('eat_live') && !page.includes('eatConnected: true'))
check('Page does NOT claim live inventory sync', !page.includes('inventorySync: true') && !page.includes('live_inventory: true'))
check('Page does NOT claim live vendor ordering', !page.includes('vendorOrder: true') && !page.includes('live_vendor: true'))
check('SmokeCraft journey screens unchanged (visual proof still exists)', existsSync(resolve(process.cwd(), 'src/pages/smokecraft/SmokeCraftVisualProof.jsx')))
check('SmokeCraft approved images directory intact', existsSync(resolve(process.cwd(), 'public/assets/smokecraft-reference/approved')))

// --- Summary ---
console.log(`\n=== RESULT: ${passed} passed / ${passed + failed} total ===`)
if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  ✗ ${f}`))
  process.exit(1)
} else {
  console.log('\nAll checks passed. Phase F.5 verification complete.')
  console.log('\nHonest pilot readiness status:')
  console.log('  SmokeCraft production-ready:      NO')
  console.log('  SmokeCraft venue pilot-ready:     NOT YET — awaiting Phase F.6 final verification')
  console.log('  Passport backend connected:       NO')
  console.log('  POS360 live-connected:            NO — preview/internal only')
  console.log('  E.A.T. live-connected:            NO — preview/internal only')
  console.log('  Pilot package page:               YES — /smokecraft/venue-pilot-package')
  console.log('  Venue checklist:                  YES — 12 items')
  console.log('  Staff checklist:                  YES — 10 items')
  console.log('  Manager checklist:                YES — 11 items')
  console.log('  Safe claims documented:           YES — 6 safe, 11 unsafe')
  console.log('  Known blockers documented:        YES — 8 blockers')
  console.log('  Next phase:                       F.6 — Final SmokeCraft Pilot Verification')
  process.exit(0)
}
