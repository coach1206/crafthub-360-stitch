#!/usr/bin/env node
// Enforces docs/smokecraft-visual-image-registry.md.
//
// Fails the build if:
//  1. Any banned mockup reference image is used as a runtime image source
//     (img src, CSS url(), backgroundImage/background-image) anywhere in
//     src/ or a built dist/ bundle.
//  2. scorecard-bg-v2.jpg is used with a distorted/mismatched stretch box
//     (height expressed as a percentage greater than 100, which forces a
//     narrow crop into an oversized box instead of a sane aspect-ratio
//     container).
//
// This script exists because approved reference mockups (full UI
// screenshots) must never become runtime backgrounds, and narrow crops
// must never be stretched into mismatched boxes — both have caused real
// visual bugs in this codebase. See docs/smokecraft-visual-image-registry.md.

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname, extname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')

const BANNED_IMAGE_NAMES = [
  'PROFILE DISCOVER 11.png',
  'smokecraft Intake.png',
  'GOLDEN BOX JOURNEY11.png',
  'GOLDEN BOX JOURNEY.png',
  'SEED & PAIRING.11.png',
  'SEED PARING 2.png',
  'SHAPE SIZE BURN.11.png',
  'SHAPE SIZE BURN.1.png',
  'lounge demo ranking.11png.png',
  'lounge demo ranking.png',
  'DISCOVER YOUR PROFILE.png',
]

const SCAN_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx', '.css'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist'])

let failed = 0
const failures = []

function fail(label, detail) {
  failed++
  failures.push({ label, detail })
  console.log(`FAIL — ${label}${detail ? ` (${detail})` : ''}`)
}

function pass(label) {
  console.log(`PASS — ${label}`)
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walk(full, files)
    else if (SCAN_EXTENSIONS.has(extname(entry))) files.push(full)
  }
  return files
}

console.log('=== SmokeCraft Banned Image Guard ===\n')

const srcDir = join(ROOT, 'src')
const sourceFiles = existsSync(srcDir) ? walk(srcDir) : []

const distDir = join(ROOT, 'dist')
const distFiles = existsSync(distDir) ? walk(distDir, []).concat(
  readdirSync(distDir).flatMap(() => [])
) : []
// dist assets are typically .js bundles; walk() already filters by extension
// but dist/assets/*.js still has a .js extension so it's included via walk.
function walkDist(dir, files = []) {
  if (!existsSync(dir)) return files
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) walkDist(full, files)
    else if (entry.endsWith('.js') || entry.endsWith('.css')) files.push(full)
  }
  return files
}
const distScanFiles = walkDist(distDir)

const allFiles = [...sourceFiles, ...distScanFiles]

// 1. Banned mockup images must never appear as a runtime reference
// (img src=, url(...), backgroundImage:, background-image:) in any scanned file.
for (const bannedName of BANNED_IMAGE_NAMES) {
  let found = false
  for (const file of allFiles) {
    const text = readFileSync(file, 'utf8')
    if (text.includes(bannedName)) {
      found = true
      fail(
        `Banned mockup "${bannedName}" must not be referenced as a runtime image`,
        `found in ${file.replace(ROOT + '/', '')}`
      )
    }
  }
  if (!found) pass(`Banned mockup "${bannedName}" is not referenced anywhere in src/ or dist/`)
}

// 2. scorecard-bg-v2.jpg stretch-distortion guard.
// Flags any inline style block that pairs scorecard-bg-v2.jpg with a height
// percentage greater than 100 — the exact pattern already found at
// src/pages/smokecraft/Leaderboard.jsx (width:54%, height:125%).
const STRETCH_WINDOW = 400 // chars of lookahead/lookbehind around the match to scan for height:NNN%
for (const file of sourceFiles) {
  const text = readFileSync(file, 'utf8')
  let idx = text.indexOf('scorecard-bg-v2.jpg')
  while (idx !== -1) {
    // Only look forward to the end of the current style block (next "/>" or "}}"),
    // not backward into a previous element's unrelated height — otherwise an
    // earlier sibling's height:100% can mask this element's own height:125%.
    const blockEnd = text.indexOf('/>', idx)
    const windowEnd = blockEnd === -1 ? Math.min(text.length, idx + STRETCH_WINDOW) : blockEnd
    const surrounding = text.slice(idx, windowEnd)
    const heightMatch = surrounding.match(/height:\s*['"]?(\d+)%/)
    if (heightMatch && Number(heightMatch[1]) > 100) {
      fail(
        'scorecard-bg-v2.jpg used with a distorted stretch box',
        `${file.replace(ROOT + '/', '')} has height:${heightMatch[1]}% near this usage — use a sane aspect-ratio container instead`
      )
    }
    idx = text.indexOf('scorecard-bg-v2.jpg', idx + 1)
  }
}
if (!failures.some(f => f.label.includes('stretch box'))) {
  pass('scorecard-bg-v2.jpg has no distorted (height > 100%) stretch usage')
}

console.log(`\n=== ${failed} failure(s) ===`)

if (failed > 0) {
  console.log('\nFAILURES:')
  for (const f of failures) {
    console.log(`  - ${f.label}${f.detail ? ` (${f.detail})` : ''}`)
  }
  process.exit(1)
} else {
  process.exit(0)
}
