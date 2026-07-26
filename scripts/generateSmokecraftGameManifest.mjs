#!/usr/bin/env node
// Holistic Fix 1 — SmokeCraft Shared Game Architecture.
//
// Generates the ONE canonical game manifest (docs/smokecraft/
// SMOKECRAFT_GAME_MANIFEST.json) covering every active route registered
// under /smokecraft in src/App.jsx. It is derived programmatically from
// existing canonical sources — never hand-transcribed, never a second
// competing source of truth:
//   - SMOKECRAFT_SCREEN_MANIFEST (src/constants/smokecraftScreenManifest.js)
//     already covers the 4 entry screens + 27 curriculum sessions with
//     asset/guard/xp/passport/prev/next data. Those fields are reused as-is.
//   - docs/smokecraft/smokecraft-routes-raw.json (scripts/smokecraftRouteInventory.mjs)
//     gives the full, real 109-route list nested under /smokecraft.
//   - SC_ASSETS gives the single approved-asset registry.
//
// For the ~78 "supporting module" routes NOT already in
// SMOKECRAFT_SCREEN_MANIFEST (Golden Box, Origins/Curation, Pairing family,
// Challenge family, Passport-adjacent, commerce, admin/demo utilities),
// this pass records what can be truthfully extracted from source (route,
// component name, guard type) and marks fields this operation has not yet
// individually interaction-audited as "unclassified" rather than
// fabricating a value — consistent with this operation's no-fabrication
// rule. Screens this operation HAS already deep-audited (see
// SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md) get their real, evidence-backed
// classification filled in below in KNOWN_AUDITED.
import { readFileSync, writeFileSync } from 'node:fs'

const { SMOKECRAFT_SCREEN_MANIFEST } = await import('../src/constants/smokecraftScreenManifest.js')
const { SC_ASSETS } = await import('../src/constants/smokecraftAssets.js')

const rawRoutes = JSON.parse(readFileSync('docs/smokecraft/smokecraft-routes-raw.json', 'utf8'))

function toFullRoute(fullPath) {
  if (fullPath === '(smokecraft index)') return '/smokecraft'
  return `/smokecraft/${fullPath}`
}

function extractComponent(elementRaw) {
  // Innermost JSX element name (skip guard/provider wrappers).
  const matches = [...elementRaw.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map(m => m[1])
  const wrappers = new Set(['SmokeCraftSessionGuard', 'SmokeCraftScreenRenderer'])
  const inner = matches.filter(m => !wrappers.has(m))
  if (elementRaw.includes('SmokeCraftScreenRenderer')) {
    const screenIdMatch = elementRaw.match(/screenId="([^"]+)"/)
    return screenIdMatch ? `SmokeCraftScreenRenderer(${screenIdMatch[1]})` : 'SmokeCraftScreenRenderer'
  }
  if (elementRaw.includes('<Navigate')) {
    const to = elementRaw.match(/to="([^"]+)"/)
    return `Navigate->${to ? to[1] : '?'}`
  }
  return inner[0] || matches[0] || 'unknown'
}

function extractGuard(elementRaw) {
  if (elementRaw.includes('<Navigate')) return 'alias-redirect'
  const sessionNum = elementRaw.match(/sessionNumber=\{(\d+)\}/)
  if (sessionNum) return `sessionNumber:${sessionNum[1]}`
  const requires = elementRaw.match(/requires="([^"]+)"/)
  if (requires) return `requires:${requires[1]}`
  if (elementRaw.includes('SmokeCraftSessionGuard')) return 'guarded:unspecified'
  return 'ungated'
}

// Screens this operation has already deep-audited via real browser test
// this recovery operation, with real evidence in SMOKECRAFT_SYSTEM_DEFECT_REGISTER.md.
// classification: 'full-live-react' | 'clean-image-shell' | 'instructional-image' | 'unsafe-full-mockup'
const KNOWN_AUDITED = {
  'welcome':          { classification: 'clean-image-shell', auditedIn: 'Prompt 3B (SC-D001, closed)' },
  'leaderboard':      { classification: 'clean-image-shell', auditedIn: 'Prompt 3 (SC-D010, closed)' },
  'passport':         { classification: 'clean-image-shell', auditedIn: 'Prompt 3D/3E-1 (SC-D011/SC-D012, closed)' },
  'crafthub':         { classification: 'clean-image-shell', auditedIn: 'Prompt 3E-1 (SC-D013, closed)' },
  'connections':      { classification: 'full-live-react',   auditedIn: 'Prompt 3E-2 (no defect)' },
  'passport-stamp':   { classification: 'full-live-react',   auditedIn: 'Prompt 3E-2 (no defect)' },
  'rewards':          { classification: 'full-live-react',   auditedIn: 'Prompt 3E-2 (no defect)' },
  'challenge-hub':    { classification: 'full-live-react',   auditedIn: 'Prompt 3E-3 (no defect)' },
  'event-challenge':  { classification: 'full-live-react',   auditedIn: 'Prompt 3E-3 (no defect)' },
  'smokecraft-challenge': { classification: 'full-live-react', auditedIn: 'Prompt 3E-3 (no defect)' },
  'challenges/blend-fault-identification': { classification: 'full-live-react', auditedIn: 'Prompt 3E-3 (spot-checked, no defect)' },
  'venue-select':     { classification: 'clean-image-shell', auditedIn: 'Prompt 1 (crop fix, closed)' },
}

const manifestByRoute = {}
for (const m of SMOKECRAFT_SCREEN_MANIFEST) manifestByRoute[m.route] = m

const entries = []
for (const r of rawRoutes) {
  const route = toFullRoute(r.fullPath)
  const existing = manifestByRoute[route]
  const known = KNOWN_AUDITED[r.fullPath]

  if (existing) {
    entries.push({
      screenId: existing.screenId,
      route,
      type: existing.type,
      phase: existing.phase,
      sessionNumber: existing.sessionNumber,
      component: existing.componentKey,
      assetKey: existing.assetKey || null,
      assetStatus: existing.assetStatus,
      previousScreenId: existing.previousScreenId,
      nextScreenId: existing.nextScreenId,
      guardType: existing.guardType,
      persistenceScope: existing.persistenceScope,
      xpEvent: existing.xpEvent,
      passportEvent: existing.passportEvent,
      classification: known?.classification || (existing.type === 'curriculum' ? 'full-live-react' : 'unclassified'),
      auditedIn: known?.auditedIn || (existing.type === 'curriculum' || existing.type === 'entry' ? 'canonical spine (session.js / smokecraftScreenManifest.js)' : 'unclassified'),
      requiredControls: 'see SMOKECRAFT_INTERACTION_MATRIX.md',
      requiredData: 'see SMOKECRAFT_SCREEN_MANIFEST dataSelectorKey: ' + existing.dataSelectorKey,
      states: 'unclassified — not yet enumerated per-screen this pass',
      responsiveLayoutType: 'unclassified — full 4-viewport sweep only exists for Venue Selection + the 31-screen horizontal-overflow sweep (verify-smokecraft-full-journey-sequence-and-assets.mjs Section G)',
      source: 'SMOKECRAFT_SCREEN_MANIFEST',
    })
    continue
  }

  entries.push({
    screenId: `supporting-${r.fullPath.replace(/[\/:]/g, '-')}`,
    route,
    type: 'supporting',
    phase: null,
    sessionNumber: null,
    component: extractComponent(r.elementRaw),
    assetKey: null,
    assetStatus: 'unclassified',
    previousScreenId: null,
    nextScreenId: null,
    guardType: extractGuard(r.elementRaw),
    persistenceScope: 'unclassified',
    xpEvent: null,
    passportEvent: null,
    classification: known?.classification || 'unclassified',
    auditedIn: known?.auditedIn || 'not yet individually audited this operation',
    requiredControls: 'unclassified',
    requiredData: 'unclassified',
    states: 'unclassified',
    responsiveLayoutType: 'unclassified',
    source: 'smokecraft-routes-raw.json',
  })
}

const output = {
  generatedAt: new Date().toISOString(),
  generatedBy: 'scripts/generateSmokecraftGameManifest.mjs',
  totalRoutes: entries.length,
  totalCurriculumSessions: entries.filter(e => e.type === 'curriculum').length,
  totalEntryScreens: entries.filter(e => e.type === 'entry').length,
  totalSupportingRoutes: entries.filter(e => e.type === 'supporting').length,
  classificationCounts: entries.reduce((acc, e) => { acc[e.classification] = (acc[e.classification] || 0) + 1; return acc }, {}),
  entries,
}

writeFileSync('docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json', JSON.stringify(output, null, 2) + '\n')
console.log(`Wrote docs/smokecraft/SMOKECRAFT_GAME_MANIFEST.json`)
console.log(`Total routes: ${output.totalRoutes} (entry: ${output.totalEntryScreens}, curriculum: ${output.totalCurriculumSessions}, supporting: ${output.totalSupportingRoutes})`)
console.log(`Classification counts:`, output.classificationCounts)
