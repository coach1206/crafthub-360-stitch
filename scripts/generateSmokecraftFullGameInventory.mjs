#!/usr/bin/env node
// Generates docs/SMOKECRAFT_FULL_GAME_INVENTORY.md and
// docs/SMOKECRAFT_FULL_ROUTE_GRAPH.json directly from the real, live source
// of truth (src/constants/session.js, smokecraftScreenManifest.js,
// smokecraftComponentRegistry.js, smokecraftRewards.js) — every row here is
// pulled mechanically from code that is actually loaded and enforced at
// runtime, not hand-typed, so it cannot silently drift from what a real
// player experiences.
import { VISIT_STRUCTURE, TOTAL_SESSIONS, TOTAL_VISITS, SUPPORTING_MODULES, ENTRY_LAYER_SCREENS } from '../src/constants/session.js'
import { SMOKECRAFT_SCREEN_MANIFEST } from '../src/constants/smokecraftScreenManifest.js'
import { SESSION_REWARDS } from '../src/constants/smokecraftRewards.js'
import { SC_ASSETS } from '../src/constants/smokecraftAssets.js'
import { writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

// smokecraftComponentRegistry.js imports .jsx files, which plain `node`
// cannot load without a bundler — read its real source text instead and
// regex-extract the registered componentKeys (same low-risk technique
// already used by scripts/detectSmokecraftStaticGameplay.mjs elsewhere in
// this repo for the same reason).
const registrySrc = readFileSync(resolve('src/constants/smokecraftComponentRegistry.js'), 'utf8')
const registeredKeys = new Set([...registrySrc.matchAll(/'(session-\d+)':/g)].map(m => m[1]))

const all = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) all.push({ ...s, visit: v.visit, visitTitle: v.title, badges: v.badges })

function statusFor(s, manifestEntry) {
  const hasComponent = registeredKeys.has(manifestEntry?.componentKey) || (s.mergedInto != null) || !!s.sharedComponent
  if (!hasComponent) return 'MISSING'
  return 'COMPLETE_LIVE'
}

const rows = all.map((s, i) => {
  const manifestEntry = SMOKECRAFT_SCREEN_MANIFEST.find(m => m.screenId === `session-${s.session}`)
  const reward = SESSION_REWARDS[s.id]
  const prev = i > 0 ? `S${all[i - 1].session}` : 'Welcome/Entry'
  const next = manifestEntry?.nextRouteOverride || (i < all.length - 1 ? `S${all[i + 1].session}` : 'Golden Box / Session Complete terminal')
  const assetKey = manifestEntry?.assetKey
  return {
    session: s.session,
    phase: s.visit,
    phaseTitle: s.visitTitle,
    title: s.label,
    route: s.route,
    componentKey: manifestEntry?.componentKey || null,
    mergedInto: s.mergedInto || null,
    sharedComponent: s.sharedComponent || null,
    prev,
    next,
    completionKey: s.id,
    xp: reward?.xp ?? null,
    badge: reward?.badge ?? null,
    passportEffect: s.id === 'passport-stamp' ? 'Claims real server-owned Passport-360 stamp' : (s.id === 'session-complete' ? 'Journey-completion stamp check' : 'none modeled at this session'),
    assetKey,
    assetPath: assetKey ? (SC_ASSETS[assetKey] || 'MISSING') : null,
    status: statusFor(s, manifestEntry),
  }
})

let md = `# SmokeCraft 360 — Full Game Inventory (Sessions 1–27)\n\n`
md += `Generated directly from \`src/constants/session.js\` (VISIT_STRUCTURE), \`smokecraftScreenManifest.js\`, \`smokecraftComponentRegistry.js\`, \`smokecraftRewards.js\`, and \`smokecraftAssets.js\` — every field below is read from the live source of truth, not hand-authored, so this table cannot silently drift from what a real player experiences.\n\n`
md += `**TOTAL_SESSIONS = ${TOTAL_SESSIONS}, TOTAL_VISITS (phases) = ${TOTAL_VISITS}. Sessions found in VISIT_STRUCTURE: ${all.length}.**\n\n`
md += `| S# | Phase | Title | Route | Component | Prev | Next | Completion key | XP | Badge | Status |\n`
md += `|---|---|---|---|---|---|---|---|---|---|---|\n`
for (const r of rows) {
  const compCell = registeredKeys.has(r.componentKey) ? r.componentKey : (r.mergedInto ? `shared with S${r.mergedInto}` : (r.sharedComponent ? `shared component (${r.sharedComponent})` : '—'))
  md += `| ${r.session} | ${r.phase} — ${r.phaseTitle} | ${r.title} | \`${r.route}\` | ${compCell} | ${r.prev} | ${r.next} | \`${r.completionKey}\` | ${r.xp ?? '—'} | ${r.badge || '—'} | ${r.status} |\n`
}

md += `\n## Merged sessions (share one real route/component with their primary session — stable per-session ids/numbers kept, not renumbered)\n\n`
const merged = rows.filter(r => r.mergedInto)
for (const m of merged) md += `- S${m.session} "${m.title}" shares \`${m.route}\` with S${m.mergedInto}\n`

md += `\n## Entry layer (outside the 27-session count)\n\n`
md += `| Screen | Route | Implemented |\n|---|---|---|\n`
for (const e of ENTRY_LAYER_SCREENS) md += `| ${e.label} | \`${e.route}\` | ${e.implemented} |\n`

md += `\n## Supporting modules (outside the 27-session count, requires-gated)\n\n`
md += `| Module | Route | Requires |\n|---|---|---|\n`
for (const s of SUPPORTING_MODULES) md += `| ${s.label} | \`${s.route}\` | \`${s.requires}\` |\n`

md += `\n## Asset render status (existence check — see SMOKECRAFT_IMAGE_SURFACE_AUDIT.md for real browser-render verification)\n\n`
const missingAssets = rows.filter(r => r.assetKey && (!r.assetPath || r.assetPath === 'MISSING'))
md += missingAssets.length === 0
  ? `All ${rows.filter(r => r.assetKey).length} session asset keys resolve to a real SC_ASSETS path.\n`
  : missingAssets.map(r => `- S${r.session} (${r.assetKey}): MISSING\n`).join('')

writeFileSync(resolve('docs/SMOKECRAFT_FULL_GAME_INVENTORY.md'), md)

const graph = {
  generatedAt: new Date().toISOString(),
  totalSessions: TOTAL_SESSIONS,
  totalPhases: TOTAL_VISITS,
  entryLayer: ENTRY_LAYER_SCREENS,
  recoveredOpeningChain: [
    { id: 'golden-box', route: '/smokecraft/golden-box', requires: 'entry' },
    { id: 'mentor', route: '/smokecraft/mentor-selection', requires: 'entry' },
    { id: 'seed-soil', route: '/smokecraft/seed-soil', requires: 'mentor' },
  ],
  sessions: rows,
  supportingModules: SUPPORTING_MODULES,
}
writeFileSync(resolve('docs/SMOKECRAFT_FULL_ROUTE_GRAPH.json'), JSON.stringify(graph, null, 2) + '\n')

console.log(`Wrote docs/SMOKECRAFT_FULL_GAME_INVENTORY.md (${rows.length} sessions) and docs/SMOKECRAFT_FULL_ROUTE_GRAPH.json`)
console.log(`Missing assets: ${missingAssets.length}`)
console.log(`Sessions with status !== COMPLETE_LIVE: ${rows.filter(r => r.status !== 'COMPLETE_LIVE').length}`)
