#!/usr/bin/env node
/**
 * Production Package 4 — static/proof artifact exclusion.
 *
 * Vite's default publicDir behavior copies the entire public/ directory
 * into dist/ byte-for-byte, which includes internal proof/audit docs.
 * This script runs after `vite build` and removes exactly the paths
 * documented as excluded below, leaving everything else untouched.
 *
 * public/handoff/SmokeCraft-POS360-EAT360-UIUX-Handoff.zip is
 * INTENTIONALLY NOT excluded — it was explicitly published as a
 * stakeholder deliverable in the UI/UX handoff pass and is meant to be
 * reachable in the deployed build. See docs/ui-ux-handoff/ for context.
 * Do not add it to EXCLUDED_PATHS without a deliberate decision to
 * un-publish it.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '../dist')

const EXCLUDED_PATHS = [
  'proof', // public/proof/** — internal test logs, screenshots, audit docs
]

let removedCount = 0
for (const rel of EXCLUDED_PATHS) {
  const target = path.join(DIST, rel)
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true })
    removedCount += 1
    console.log(`[strip-production-assets] removed dist/${rel}`)
  }
}

console.log(`[strip-production-assets] ${removedCount}/${EXCLUDED_PATHS.length} excluded paths removed from dist/`)
