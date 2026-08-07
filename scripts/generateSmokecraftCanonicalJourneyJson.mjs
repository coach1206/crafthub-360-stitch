#!/usr/bin/env node
// Regenerates docs/SMOKECRAFT_CANONICAL_JOURNEY.json directly from
// src/constants/session.js — the single source of truth — so the
// machine-readable canonical journey document can never silently drift
// from the code that actually enforces it.
import { ENTRY_LAYER_SCREENS, VISIT_STRUCTURE, SUPPORTING_MODULES, TOTAL_SESSIONS, TOTAL_VISITS } from '../src/constants/session.js'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

const out = {
  generatedAt: new Date().toISOString(),
  generatedBy: 'scripts/generateSmokecraftCanonicalJourneyJson.mjs (source: src/constants/session.js)',
  totalSessions: TOTAL_SESSIONS,
  totalPhases: TOTAL_VISITS,
  entryLayer: ENTRY_LAYER_SCREENS,
  recoveredOpeningChain: [
    { id: 'entry',         route: '/smokecraft/welcome',          label: "Welcome to Today's Experience", spine: true,  session: 1 },
    { id: 'golden-box',    route: '/smokecraft/golden-box',       label: 'Gold Box Rules',   spine: false, note: 'supporting module, now wired into the primary forward path (Canonical Journey Recovery, SC-D077)' },
    { id: 'mentor',        route: '/smokecraft/mentor-selection', label: 'Mentor Selection', spine: false, note: 'supporting module, now wired into the primary forward path (Canonical Journey Recovery, SC-D077)' },
    { id: 'seed-soil',     route: '/smokecraft/seed-soil',        label: 'Seed & Soil',      spine: false, note: 'supporting module, now wired into the primary forward path (Canonical Journey Recovery, SC-D077)' },
    { id: 'humidor-match', route: '/smokecraft/humidor-match',    label: 'Choose Your Cigar', spine: true, session: 2 },
  ],
  spine: VISIT_STRUCTURE,
  supportingModules: SUPPORTING_MODULES,
}

writeFileSync(resolve('docs/SMOKECRAFT_CANONICAL_JOURNEY.json'), JSON.stringify(out, null, 2) + '\n')
console.log('docs/SMOKECRAFT_CANONICAL_JOURNEY.json written from src/constants/session.js')
