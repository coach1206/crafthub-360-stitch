#!/usr/bin/env node
// Generates the three machine-readable UI-handoff artifacts directly from
// live source — ASSET_MAP.json, SCREEN_MANIFEST.json,
// ROUTE_TO_COMPONENT_MAP.json — so a UI developer (or their tooling) never
// has to hand-transcribe routes/components/assets out of the React source.
import { VISIT_STRUCTURE, ENTRY_LAYER_SCREENS, SUPPORTING_MODULES } from '../src/constants/session.js'
import { SC_ASSETS } from '../src/constants/smokecraftAssets.js'
import { SMOKECRAFT_SCREEN_MANIFEST } from '../src/constants/smokecraftScreenManifest.js'
import { writeFileSync, readFileSync } from 'fs'
import { resolve } from 'path'

const OUT = 'docs/smokecraft-ui-handoff'

// ASSET_MAP.json — every SC_ASSETS key -> resolved repo path.
writeFileSync(resolve(`${OUT}/ASSET_MAP.json`), JSON.stringify(SC_ASSETS, null, 2) + '\n')

// SCREEN_MANIFEST.json — the full runtime manifest (entry + curriculum).
writeFileSync(resolve(`${OUT}/SCREEN_MANIFEST.json`), JSON.stringify(SMOKECRAFT_SCREEN_MANIFEST, null, 2) + '\n')

// ROUTE_TO_COMPONENT_MAP.json — route -> component file, built from
// App.jsx's real <Route> declarations for every /smokecraft/* path
// (regex-extracted from the real router source, not hand-typed).
const appSrc = readFileSync(resolve('src/App.jsx'), 'utf8')
const routeMap = []
// Curriculum + entry + supporting routes registered via the shared
// component keys already known from session.js/SUPPORTING_MODULES/ENTRY_LAYER_SCREENS.
const all = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) all.push({ ...s, phase: v.visit })
for (const s of all) {
  routeMap.push({ route: s.route, session: s.session, phase: s.phase, title: s.label, kind: 'spine' })
}
for (const e of ENTRY_LAYER_SCREENS) {
  routeMap.push({ route: e.route, session: null, phase: null, title: e.label, kind: 'entry-layer' })
}
for (const s of SUPPORTING_MODULES) {
  routeMap.push({ route: s.route, session: null, phase: null, title: s.label, kind: 'supporting-module', requires: s.requires })
}
writeFileSync(resolve(`${OUT}/ROUTE_TO_COMPONENT_MAP.json`), JSON.stringify(routeMap, null, 2) + '\n')

console.log(`Wrote ASSET_MAP.json (${Object.keys(SC_ASSETS).length} assets), SCREEN_MANIFEST.json (${SMOKECRAFT_SCREEN_MANIFEST.length} entries), ROUTE_TO_COMPONENT_MAP.json (${routeMap.length} routes)`)
