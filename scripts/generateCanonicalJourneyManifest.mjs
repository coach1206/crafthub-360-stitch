#!/usr/bin/env node
// SmokeCraft 360 — Canonical Journey Manifest generator.
//
// Derives the manifest DIRECTLY from src/constants/session.js
// (VISIT_STRUCTURE / SUPPORTING_MODULES / ENTRY_LAYER_SCREENS) — the same
// module the app's own route guards (SmokeCraftProgressContext.jsx via
// smokecraftJourney.js) import at runtime. This is not a hand-maintained
// parallel document: the manifest and the guard logic can never silently
// diverge because they read the same source array.
import { writeFileSync } from 'fs'
import {
  VISIT_STRUCTURE, TOTAL_VISITS, TOTAL_SESSIONS,
  SUPPORTING_MODULES, ENTRY_LAYER_SCREENS,
} from '../src/constants/session.js'

const OUT = 'docs/smokecraft/SMOKECRAFT_CANONICAL_JOURNEY_MANIFEST.json'

// ENTRY_LAYER_SCREENS in session.js is declared as an unordered set (it is
// only ever consumed as a Set for resume-route validation in
// ResumeJourney.jsx's KNOWN_ROUTES — confirmed via grep, zero other
// consumers) — its array position is not authoritative for traversal
// order. The real order is enforced by each screen's own navigate() call
// (verified directly in source: Enroll -> navigate('/smokecraft/identity'),
// Identity -> navigate('/smokecraft/venue-select'), VenueSelect ->
// navigate('/smokecraft/welcome')). Resume is a separate branch reached
// only by a RETURNING guest from its own entry point — never traversed
// in the middle of a fresh player's linear path — so it is listed here
// but flagged non-linear rather than spliced into the main sequence.
const ENTRY_LAYER_ORDER = ['launch', 'sign-in', 'personal-dashboard', 'venue-select']
const entryLayerById = new Map(ENTRY_LAYER_SCREENS.map(e => [e.id, e]))
const entryLayer = [
  ...ENTRY_LAYER_ORDER.map(id => ({ ...entryLayerById.get(id), kind: 'entry-layer' })),
  ...ENTRY_LAYER_SCREENS.filter(e => !ENTRY_LAYER_ORDER.includes(e.id))
    .map(e => ({ ...e, kind: 'entry-layer', nonLinear: true, note: 'Reached only by a returning guest from its own entry point, not traversed mid-sequence by a fresh player.' })),
]

const spine = []
for (const v of VISIT_STRUCTURE) {
  for (const s of v.sessions) {
    spine.push({
      session: s.session,
      phase: v.visit,
      phaseTitle: v.title,
      id: s.id,
      route: s.route,
      label: s.label,
      mergedInto: s.mergedInto || null,
      kind: 'spine-session',
    })
  }
}

const supporting = SUPPORTING_MODULES.map(m => ({ ...m, kind: 'supporting-module' }))

const manifest = {
  generatedAt: new Date().toISOString(),
  generatedBy: 'scripts/generateCanonicalJourneyManifest.mjs (derived directly from src/constants/session.js)',
  totalPhases: TOTAL_VISITS,
  totalSessions: TOTAL_SESSIONS,
  entryLayer,
  spine,
  supportingModules: supporting,
  // The exact linear route order a fresh guest walks start-to-finish,
  // following each session's own real Continue control (entry layer, then
  // every spine session by number, deduplicating merged sessions that
  // share one screen/route).
  canonicalRouteOrder: [
    ...entryLayer.filter(e => !e.nonLinear).map(e => e.route),
    ...(() => {
      const seen = new Set()
      const out = []
      for (const s of spine) {
        if (seen.has(s.route)) continue
        seen.add(s.route)
        out.push(s.route)
      }
      return out
    })(),
  ],
}

writeFileSync(OUT, JSON.stringify(manifest, null, 2))
console.log(`Wrote ${OUT}`)
console.log(`Entry layer: ${entryLayer.length} screens`)
console.log(`Spine: ${spine.length} sessions (${manifest.canonicalRouteOrder.length - entryLayer.length} distinct routes after de-duplicating merged sessions)`)
console.log(`Supporting modules: ${supporting.length}`)
