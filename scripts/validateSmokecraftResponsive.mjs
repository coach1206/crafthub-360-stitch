// Holistic Fix 3 — build-blocking responsive-regression validator.
//
// Reads the 5-viewport responsive inventory proof
// (public/proof/smokecraft-holistic-fix-3/01-responsive-inventory.json,
// produced by verify-smokecraft-hf3-responsive-inventory.mjs against a
// live preview server) and fails the build if any active screen:
//   - has horizontal overflow at any viewport
//   - blocks vertical scrolling when content exceeds the viewport
//   - hides a real control behind the fixed bottom nav
//   - stretches a portrait asset (checked via aspect-ratio preservation)
// This is a proof-based validator (consistent with
// validateSmokecraftControlCoverage.mjs) rather than one that launches a
// browser during `npm run build` itself — the inventory is regenerated
// by re-running the sweep script whenever layout-affecting code changes.
import fs from 'node:fs'

let fail = 0
function check(name, cond, detail = '') {
  if (cond) { console.log(`  OK    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

const INVENTORY = 'public/proof/smokecraft-holistic-fix-3/01-responsive-inventory.json'
console.log('── SmokeCraft responsive-regression validator (Holistic Fix 3)\n')

if (!fs.existsSync(INVENTORY)) {
  console.log(`  FAIL  responsive inventory proof file exists (${INVENTORY})`)
  console.log('\n=== RESULT: FAIL (inventory proof missing — run verify-smokecraft-hf3-responsive-inventory.mjs) ===')
  process.exit(1)
}

const inventory = JSON.parse(fs.readFileSync(INVENTORY, 'utf8'))
check(`inventory covers all 108 routes`, inventory.length === 108, `${inventory.length} routes`)

let overflowCount = 0, scrollBlockedCount = 0, obscuredCount = 0, errorCount = 0
const overflowRoutes = [], scrollBlockedRoutes = [], obscuredRoutes = [], errorRoutes = []

for (const r of inventory) {
  for (const [vpName, m] of Object.entries(r.viewports)) {
    if (!m) continue
    if (m.error) { errorCount++; errorRoutes.push(`${r.path} @ ${vpName}: ${m.error.split('\n')[0]}`); continue }
    if (m.horizontalOverflow) { overflowCount++; overflowRoutes.push(`${r.path} @ ${vpName}`) }
    if (m.canScrollIfNeeded === false) { scrollBlockedCount++; scrollBlockedRoutes.push(`${r.path} @ ${vpName}`) }
    if (m.obscuredControls > 0) { obscuredCount++; obscuredRoutes.push(`${r.path} @ ${vpName} (${m.obscuredControls})`) }
  }
}

check('no route has a navigation timeout/crash at any viewport', errorCount === 0, errorRoutes.slice(0, 5).join(' | '))
check('no route has horizontal overflow at any of the 5 viewports', overflowCount === 0, overflowRoutes.slice(0, 10).join(' | '))
check('no route blocks vertical scrolling when content exceeds the viewport', scrollBlockedCount === 0, scrollBlockedRoutes.slice(0, 10).join(' | '))
check('no route has a real control obscured behind the fixed bottom nav', obscuredCount === 0, obscuredRoutes.slice(0, 10).join(' | '))

// Portrait-asset stretch check: object-fit:'contain' or 'cover' NEVER
// distort/skew an image's own pixel proportions (contain letterboxes,
// cover crops) — only object-fit:'fill' (or no object-fit at all, whose
// browser default IS 'fill') can stretch it non-proportionally. So this
// checks the actual computed object-fit rather than inferring "stretch"
// from a rendered-vs-natural aspect-ratio mismatch, which is expected
// and legitimate for 'cover' hero banners.
let stretchCount = 0
const stretchRoutes = []
for (const r of inventory) {
  for (const [vpName, m] of Object.entries(r.viewports)) {
    if (!m || !m.heroImage) continue
    const { naturalW, naturalH, renderedW, renderedH, objectFit } = m.heroImage
    if (!renderedW || !renderedH) continue
    if (objectFit === 'contain' || objectFit === 'cover') continue
    const naturalRatio = naturalW / naturalH
    const renderedRatio = renderedW / renderedH
    const drift = Math.abs(naturalRatio - renderedRatio) / naturalRatio
    if (drift > 0.03) { stretchCount++; stretchRoutes.push(`${r.path} @ ${vpName} (objectFit=${objectFit}, natural ${naturalRatio.toFixed(2)} vs rendered ${renderedRatio.toFixed(2)})`) }
  }
}
check('no hero/backdrop image is stretched or distorted (object-fit:fill with a mismatched box)', stretchCount === 0, stretchRoutes.slice(0, 10).join(' | '))

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) process.exit(1)
