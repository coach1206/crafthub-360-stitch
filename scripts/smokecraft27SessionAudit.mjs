#!/usr/bin/env node
// SmokeCraft System Audit — Prompt 1, Part 4.
// Generates the 27-session audit table from the real, canonical single
// source of truth (VISIT_STRUCTURE in session.js + SMOKECRAFT_SCREEN_MANIFEST
// + SC_ASSETS + smokecraftComponentRegistry), not hand-transcribed.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'

const { VISIT_STRUCTURE } = await import('../src/constants/session.js')
const { SMOKECRAFT_SCREEN_MANIFEST } = await import('../src/constants/smokecraftScreenManifest.js')
const { SC_ASSETS } = await import('../src/constants/smokecraftAssets.js')

// smokecraftComponentRegistry.js imports .jsx component files, which plain
// node (no bundler/loader) cannot execute directly. Read its source text and
// check registration by regex instead of importing it.
const registrySrc = readFileSync('src/constants/smokecraftComponentRegistry.js', 'utf8')
function getRegisteredComponent(componentKey) {
  if (!componentKey) return null
  const re = new RegExp(`['"\`]${componentKey}['"\`]\\s*:`)
  return re.test(registrySrc) ? true : null
}

function sha256(p) {
  try { return createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12) } catch { return null }
}
function decode(u) { return decodeURIComponent(String(u).split('?')[0]) }
function assetOnDisk(assetKey) {
  if (!assetKey || !SC_ASSETS[assetKey]) return null
  const p = 'public' + decode(SC_ASSETS[assetKey])
  return existsSync(p) ? p : null
}

const spine = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) spine.push({ ...s, visit: v.visit, visitTitle: v.title })

const rows = spine.map(s => {
  const manifest = SMOKECRAFT_SCREEN_MANIFEST.find(m => m.screenId === `session-${s.session}`)
  const assetKey = manifest?.assetKey || null
  const assetPath = assetOnDisk(assetKey)
  const hash = assetPath ? sha256(assetPath) : null
  const componentKey = manifest?.componentKey
  const registered = componentKey ? !!getRegisteredComponent(componentKey) : false
  return {
    session: s.session,
    phase: s.visit,
    phaseTitle: s.visitTitle,
    title: s.label,
    route: s.route,
    screenId: `session-${s.session}`,
    componentKey,
    registered,
    mergedInto: s.mergedInto || null,
    sharedComponent: s.sharedComponent || null,
    assetKey,
    assetPath: assetPath ? assetPath.replace('public/', '') : (assetKey ? 'MISSING ON DISK' : '(none registered)'),
    assetHashPrefix: hash,
    previousScreenId: manifest?.previousScreenId,
    nextScreenId: manifest?.nextScreenId,
  }
})

const out = [
  '# SmokeCraft 27-Session Audit (Prompt 1 — programmatically generated)',
  '',
  'Generated directly from `VISIT_STRUCTURE` (src/constants/session.js), '
  + '`SMOKECRAFT_SCREEN_MANIFEST` (src/constants/smokecraftScreenManifest.js), and '
  + '`SC_ASSETS` (src/constants/smokecraftAssets.js) — the three canonical single sources '
  + 'of truth already used by the live route guards, not hand-transcribed. Asset hash '
  + '(first 12 hex chars of sha256) is computed from the actual file on disk at generation '
  + `time, commit \`d6469504a2a83ab4acfb27e89a25064d505d4d55\`.`,
  '',
  `**Total sessions: ${rows.length}** (expected 27) — ${rows.length === 27 ? 'MATCH' : 'MISMATCH — INVESTIGATE'}`,
  `**Total phases: ${new Set(rows.map(r => r.phase)).size}** (expected 6, per this repo's locked spine — see note below)`,
  '',
  '> Note on "7 phases": this prompt\'s mandate says "27 sessions across 7 phases." This '
  + 'repository\'s single canonical registry (`VISIT_STRUCTURE`, `TOTAL_VISITS`) has always '
  + 'been, and remains, **6 phases** — verified directly from source, not assumed. This is '
  + 'flagged here as a discrepancy between the mandate\'s stated number and the actual locked '
  + 'architecture, not silently corrected or silently ignored. No session was merged, split, '
  + 'renumbered, or reordered to produce this count.',
  '',
  '| Session | Phase | Route | Component key | Registered | Asset key | Asset file | Hash (12) | Prev screen | Next screen |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(r => `| S${r.session} | ${r.phase} (${r.phaseTitle}) | \`${r.route}\` | \`${r.componentKey}\` | ${r.registered ? 'yes' : 'NO — MISSING'} | ${r.assetKey || '—'} | ${r.assetPath} | ${r.assetHashPrefix || '—'} | ${r.previousScreenId} | ${r.nextScreenId} |`),
  '',
]

writeFileSync('docs/smokecraft/SMOKECRAFT_27_SESSION_AUDIT.md', out.join('\n'))
const unregistered = rows.filter(r => !r.registered).map(r => r.session)
const KNOWN_MERGED = [9, 13, 17, 18, 20, 26]
const unexplainedUnregistered = unregistered.filter(s => !KNOWN_MERGED.includes(s))
console.log(`Wrote ${rows.length} session rows.`)
console.log('Sessions with unregistered component:', unregistered, unregistered.length && JSON.stringify(unregistered) === JSON.stringify(KNOWN_MERGED) ? '(exactly the known merged/shared sessions — expected, not a defect)' : '')
console.log('UNEXPLAINED unregistered sessions (real defect if non-empty):', unexplainedUnregistered)
console.log('Sessions with missing asset on disk:', rows.filter(r => r.assetKey && r.assetPath === 'MISSING ON DISK').map(r => r.session))
console.log('Sessions with no asset key at all:', rows.filter(r => !r.assetKey).map(r => r.session))
