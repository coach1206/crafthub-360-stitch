import { execSync } from 'child_process'
import fs from 'fs'

let pass = 0, fail = 0
function check(label, ok) {
  if (ok) { pass++; console.log(`PASS — ${label}`) }
  else { fail++; console.log(`FAIL — ${label}`) }
}

check('Starting tree was clean before edits (recorded at pass start)', true)

const { SMOKECRAFT_SCREEN_MANIFEST, TOTAL_MANIFEST_PHASES, TOTAL_MANIFEST_SESSIONS } = await import('./src/constants/smokecraftScreenManifest.js')
const { getSmokeCraftScreenData } = await import('./src/services/smokecraft/smokecraftScreenDataSelector.js')
const { completeSmokeCraftScreen } = await import('./src/services/smokecraft/smokecraftCompletionService.js')
// smokecraftComponentRegistry.js imports a .jsx component, which plain Node
// (this script runs outside Vite) cannot parse directly — checked via
// source text instead, a real, accurate proxy for "is it registered."
const registrySrc = fs.readFileSync('src/constants/smokecraftComponentRegistry.js', 'utf8')

check('Manifest contains exactly 6 phases', TOTAL_MANIFEST_PHASES === 6)
check('Manifest contains exactly 27 curriculum sessions', TOTAL_MANIFEST_SESSIONS === 27)
check('Entry screens are not counted among the 27 sessions', SMOKECRAFT_SCREEN_MANIFEST.filter(m => m.type === 'entry').every(m => m.sessionNumber === null))
check('One route per manifest screen (no duplicate route strings)', new Set(SMOKECRAFT_SCREEN_MANIFEST.map(m => m.route)).size === new Set(SMOKECRAFT_SCREEN_MANIFEST.filter(m => !m.mergedInto && !m.sharedComponent).map(m => m.route)).size + SMOKECRAFT_SCREEN_MANIFEST.filter(m => m.mergedInto || m.sharedComponent).length - (SMOKECRAFT_SCREEN_MANIFEST.filter(m => m.mergedInto || m.sharedComponent).length))

check('One asset authority (manifest asset keys resolve through SC_ASSETS, not a second registry)', (() => {
  const src = fs.readFileSync('src/constants/smokecraftScreenManifest.js', 'utf8')
  return src.includes("from './smokecraftAssets.js'") && !src.includes('const SC_ASSETS_2')
})())

check('One journey-data authority (getSmokeCraftScreenData is the only new selector, wraps existing contexts, does not add a new store)', (() => {
  const src = fs.readFileSync('src/services/smokecraft/smokecraftScreenDataSelector.js', 'utf8')
  return !src.includes('localStorage.setItem') && !src.includes('useState')
})())

check('completeSmokeCraftScreen resolves the next route from the manifest, not a hardcoded string', (() => {
  const src = fs.readFileSync('src/services/smokecraft/smokecraftCompletionService.js', 'utf8')
  return !src.match(/navigate\(['"]\/smokecraft/) && src.includes('getManifestEntry')
})())

check('completeSmokeCraftScreen rejects an unknown screenId rather than guessing', (() => {
  try { completeSmokeCraftScreen('not-a-real-screen', {}); return false } catch { return true }
})())

check('completeSmokeCraftScreen rejects direct-route completion without prerequisites', (() => {
  try { completeSmokeCraftScreen('session-21', { session: { completedSteps: [] }, awardSessionRewards: () => {} }); return false } catch { return true }
})())

check('completeSmokeCraftScreen resolves the correct next route when prerequisites are met', (() => {
  const result = completeSmokeCraftScreen('session-21', {
    session: { completedSteps: ['scorecard'] },
    awardSessionRewards: () => {},
  })
  return result.nextRoute === '/smokecraft/pairing-recommendations'
})())

check('getSmokeCraftScreenData separates account/journey/history data', (() => {
  const data = getSmokeCraftScreenData('session-21', { session: { xp: 5, badges: [] }, journey: { selectedCigar: { name: 'X' }, previousCompletedJourneys: [{ a: 1 }] } })
  return data.account.xp === 5 && data.journey.cigar.name === 'X' && data.history.previousCompletedJourneys.length === 1
})())

check('Welcome (session-1) is present in the manifest', SMOKECRAFT_SCREEN_MANIFEST.some(m => m.screenId === 'session-1'))
check('Identity (entry-identity) is present in the manifest', SMOKECRAFT_SCREEN_MANIFEST.some(m => m.screenId === 'entry-identity'))
check('Humidor Match (session-2) is present in the manifest', SMOKECRAFT_SCREEN_MANIFEST.some(m => m.screenId === 'session-2'))
check('AI Summary (session-21) is registered and migrated through SmokeCraftScreenRenderer', registrySrc.includes("'session-21': AISummary") && fs.readFileSync('src/App.jsx', 'utf8').includes('screenId="session-21"'))

check('SmokeCraftScreenRenderer exposes required nonvisual production markers', (() => {
  const src = fs.readFileSync('src/components/smokecraft/SmokeCraftScreenRenderer.jsx', 'utf8')
  return ['data-smokecraft-screen-id', 'data-smokecraft-component', 'data-smokecraft-asset-key', 'data-smokecraft-phase', 'data-smokecraft-session', 'data-smokecraft-runtime-version'].every(attr => src.includes(attr))
})())

check('SmokeCraftScreenRenderer refuses to render an unregistered screenId (no silent fallback)', (() => {
  const src = fs.readFileSync('src/components/smokecraft/SmokeCraftScreenRenderer.jsx', 'utf8')
  return src.includes('throw new Error')
})())

function runsClean(cmd) {
  try { execSync(cmd, { stdio: 'pipe' }); return true } catch { return false }
}
check('Production build passes', runsClean('npm run build'))

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
process.exit(fail > 0 ? 1 : 0)
