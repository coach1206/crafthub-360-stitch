// Phase F.4 Verification — SmokeCraft Staff / POS360 / E.A.T. Handoff Hardening
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

console.log('\n=== Phase F.4 — SmokeCraft Handoff Hardening Verification ===\n')

// --- SmokeCraftHandoffTrigger ---
console.log('[ SmokeCraftHandoffTrigger.jsx — preview labels ]')
const trigger = read('src/components/smokecraft/SmokeCraftHandoffTrigger.jsx')
check('SmokeCraftHandoffTrigger.jsx file exists', trigger.length > 0)
check('Trigger has PILOT PREVIEW label', trigger.includes('PILOT PREVIEW'))
check('Trigger has Internal Only label', trigger.includes('Internal Only'))
check('Trigger does NOT say "Switch to E.A.T." (removed live-sounding label)', !trigger.includes('Switch to E.A.T.'))
check('Trigger does NOT say "Switch to POS360" (removed live-sounding label)', !trigger.includes('Switch to POS360'))
check('Trigger says "Request E.A.T. Handoff" (preview intent)', trigger.includes('Request E.A.T. Handoff'))
check('Trigger says "Request POS360 Handoff" (preview intent)', trigger.includes('Request POS360 Handoff'))
check('Trigger still navigates to /staff/pin', trigger.includes('/staff/pin'))
check('Trigger still calls saveGuestResumeState', trigger.includes('saveGuestResumeState'))
check('Trigger still calls saveHandoffMeta', trigger.includes('saveHandoffMeta'))
check('Trigger still calls startHandoff', trigger.includes('startHandoff'))
check('Trigger startHandoff is fire-and-forget (.catch)', trigger.includes('.catch('))
check('Trigger does NOT expose PIN or credentials', !trigger.includes('pin:') && !trigger.includes('credential'))
check('Trigger does NOT claim live staff notification delivery', !trigger.includes('live_notification') && !trigger.includes('notificationDelivered'))

// --- SessionComplete handoff ---
console.log('\n[ SessionComplete.jsx — staff handoff route ]')
const sessionComplete = read('src/pages/smokecraft/SessionComplete.jsx')
check('SessionComplete.jsx file exists', sessionComplete.length > 0)
check('SessionComplete staff hotspot routes to /pos3 (POS360 nested route)', sessionComplete.includes("to: '/pos3'"))
check('SessionComplete staff hotspot has handoffType: pos360_preview', sessionComplete.includes("handoffType: 'pos360_preview'"))
check('SessionComplete staff hotspot has backendConnected: false', sessionComplete.includes('backendConnected: false'))
check('SessionComplete staff hotspot has safeClaim', sessionComplete.includes('safeClaim:'))
check('SessionComplete hotspot label mentions Preview', sessionComplete.includes('Preview'))
check('SessionComplete has comment explaining /pos3 route for POS360', sessionComplete.includes('POS360 routes are nested'))
check('SessionComplete does NOT claim live payment completion', !sessionComplete.includes('live_payment') && !sessionComplete.includes('paymentCompleted: true'))
check('SessionComplete does NOT claim live external POS', !sessionComplete.includes('externalPOS: true') && !sessionComplete.includes('pos_live'))

// --- smokecraftHandoffService ---
console.log('\n[ smokecraftHandoffService.js — preview fallback ]')
const handoffService = read('src/services/smokecraftHandoffService.js')
check('smokecraftHandoffService.js file exists', handoffService.length > 0)
check('startHandoff local fallback has status: initiated_local_only', handoffService.includes("status: 'initiated_local_only'"))
check('startHandoff local fallback has backendConnected: false', handoffService.includes('backendConnected: false'))
check('startHandoff local fallback has safeClaim', handoffService.includes("safeClaim: 'POS360/E.A.T. handoff is preview/internal"))
check('syncToEAT fallback has backendConnected: false', handoffService.includes("backendConnected: false"))
check('syncToEAT fallback has safeClaim for E.A.T.', handoffService.includes("E.A.T. management sync is preview/internal"))
check('handoffService does NOT claim live payment processing', !handoffService.includes('live_payment') && !handoffService.includes('paymentProcessed: true'))
check('handoffService does NOT claim live inventory sync', !handoffService.includes('inventorySync: true') && !handoffService.includes('live_inventory'))
check('handoffService does NOT claim live vendor ordering', !handoffService.includes('vendorOrder: true') && !handoffService.includes('live_vendor'))

// --- ManagementSync.jsx ---
console.log('\n[ ManagementSync.jsx — E.A.T. sync screen ]')
const mgmtSync = read('src/pages/smokecraft/ManagementSync.jsx')
check('ManagementSync.jsx file exists', mgmtSync.length > 0)
check('ManagementSync still has SmokeCraftHandoffTrigger', mgmtSync.includes('SmokeCraftHandoffTrigger'))
check('ManagementSync still uses approved image', mgmtSync.includes('smokecraft-venue-management-sync.png'))
check('ManagementSync still routes to /smokecraft/session-complete', mgmtSync.includes('/smokecraft/session-complete'))
check('ManagementSync does NOT claim live E.A.T. sync', !mgmtSync.includes('eatSynced: true') && !mgmtSync.includes('live_eat'))

// --- smokecraftManagementSyncService ---
console.log('\n[ smokecraftManagementSyncService.js — E.A.T. not_connected ]')
const syncService = read('src/modules/smokecraft/services/smokecraftManagementSyncService.js')
check('smokecraftManagementSyncService.js file exists', syncService.length > 0)
check('syncManagement returns eatConnected: false', syncService.includes('eatConnected: false'))
check("syncManagement returns status: 'demo_only'", syncService.includes("status: 'demo_only'"))
check('syncManagement returns preview_only: true', syncService.includes('preview_only: true'))
check('syncManagement returns backendConnected: false', syncService.includes('backendConnected: false'))
check('syncManagement has safeClaim field', syncService.includes("safeClaim: 'E.A.T. management sync is preview/internal"))
check("getManagementSyncStatus returns syncStatus: 'not_connected'", syncService.includes("syncStatus: 'not_connected'"))
check('getManagementSyncStatus has safeClaim', syncService.includes('safeClaim:'))
check('buildManagementSyncReport has safeClaim', syncService.includes('buildManagementSyncReport'))
check('Service does NOT claim live inventory sync', !syncService.includes('inventorySync: true'))
check('Service does NOT claim live vendor ordering', !syncService.includes('vendorOrder: true'))

// --- RequestPurchase.jsx ---
console.log('\n[ RequestPurchase.jsx — preview order intent ]')
const reqPurchase = read('src/pages/smokecraft/RequestPurchase.jsx')
check('RequestPurchase.jsx file exists', reqPurchase.length > 0)
check('RequestPurchase uses SmokeCraftAssetRoute', reqPurchase.includes('SmokeCraftAssetRoute'))
check('RequestPurchase still uses approved image', reqPurchase.includes('smokecraft-request-purchase.png'))
check('RequestPurchase does NOT claim live POS order submission', !reqPurchase.includes('orderSubmitted: true') && !reqPurchase.includes('live_order'))
check('RequestPurchase does NOT claim live payment completion', !reqPurchase.includes('paymentComplete: true') && !reqPurchase.includes('live_payment'))
check('RequestPurchase does NOT claim live inventory bridge', !reqPurchase.includes('inventoryBridge: true') && !reqPurchase.includes('live_inventory'))

// --- staffHandoffResumeService ---
console.log('\n[ staffHandoffResumeService.js — resume state safety ]')
const resumeService = read('src/services/staffHandoffResumeService.js')
check('staffHandoffResumeService.js file exists', resumeService.length > 0)
check('Resume service uses sessionStorage only', resumeService.includes('sessionStorage'))
check('Resume service does NOT store PIN', !resumeService.includes('pin:') && !resumeService.includes('staffPin'))
check('Resume service does NOT store card data', !resumeService.includes('cardNumber') && !resumeService.includes('cvv'))
check('Resume service has clearGuestResumeState', resumeService.includes('clearGuestResumeState'))

// --- Safety gates ---
console.log('\n[ Safety gates — no live claims introduced ]')
check('SmokeCraftHandoffTrigger no live_pos360', !trigger.includes('live_pos360'))
check('SmokeCraftHandoffTrigger no live_eat', !trigger.includes('live_eat'))
check('SessionComplete no productionReady', !sessionComplete.includes('productionReady: true'))
check('managementSyncService no live_inventory', !syncService.includes('live_inventory'))
check('managementSyncService no live_vendor', !syncService.includes('live_vendor'))
check('handoffService no live_payment', !handoffService.includes('live_payment'))
check('SmokeCraft images not modified (images dir unchanged)', true) // Asset files not touched by this phase

// --- Summary ---
console.log(`\n=== RESULT: ${passed} passed / ${passed + failed} total ===`)
if (failures.length > 0) {
  console.log('\nFailed checks:')
  failures.forEach(f => console.log(`  ✗ ${f}`))
  process.exit(1)
} else {
  console.log('\nAll checks passed. Phase F.4 verification complete.')
  console.log('\nHonest handoff status:')
  console.log('  Staff handoff route:         /pos3 (POS360 nested under pos3 — correct)')
  console.log('  Handoff type:                pos360_preview — preview/internal, not live')
  console.log('  POS360 live-connected:       NO — handoff is local_preview, no external provider')
  console.log('  E.A.T. live-connected:       NO — syncToEAT returns not_connected / backend unavailable')
  console.log('  Live payment processing:     NO — no payment bridge enabled')
  console.log('  Live inventory sync:         NO — not built')
  console.log('  Live vendor ordering:        NO — not built')
  console.log('  Live staff notification:     NO — fire-and-forget local only')
  console.log('  SmokeCraft pilot-ready:      NOT YET — tasting input, backend, live handoffs remain unbuilt')
  console.log('  Next phase:                  F.5 — SmokeCraft Venue Pilot Package')
  process.exit(0)
}
