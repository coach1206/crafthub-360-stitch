#!/usr/bin/env node
// Verifies that each uploaded SmokeCraft source image (a) exists on disk,
// (b) has a corresponding cropped/replacement asset, and (c) that the
// matching screen's source code actually references the cropped asset
// (not a leftover generic/shared image).
//
// This script intentionally FAILS for any requested source filename that
// does not exist in the repo — it does not silently substitute a "close
// enough" file. See docs/smokecraft-image-placement-proof.md for the full
// mapping and an explanation of any failures.

import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..', '..')

function abs(p) { return join(ROOT, p) }

let passed = 0
let failed = 0
const failures = []

function check(label, ok, detail) {
  if (ok) {
    passed++
    console.log(`PASS — ${label}`)
  } else {
    failed++
    failures.push({ label, detail })
    console.log(`FAIL — ${label}${detail ? ` (${detail})` : ''}`)
  }
}

function fileExists(relPath) {
  return existsSync(abs(relPath))
}

function fileContains(relPath, needle) {
  if (!existsSync(abs(relPath))) return false
  const text = readFileSync(abs(relPath), 'utf8')
  return text.includes(needle)
}

function fileDoesNotContain(relPath, needle) {
  if (!existsSync(abs(relPath))) return true
  const text = readFileSync(abs(relPath), 'utf8')
  return !text.includes(needle)
}

console.log('=== SmokeCraft Image Placement Verification ===\n')

/* ─────────────────────────────────────────────────────────────
   Requirement set: one entry per uploaded image named by the user.
   `sourceCandidates` — exact filename(s) that would satisfy the
   requirement if found on disk (case/spacing exactly as requested).
   `cropAsset`        — the cropped/replacement file expected to exist.
   `component`        — the page file that must reference cropAsset.
   `oldGeneric`        — a shared/generic image path that must NOT
                         remain referenced on that same line/screen
                         (omit check if not applicable).
───────────────────────────────────────────────────────────── */
const requirements = [
  {
    name: 'smokecraft Intake.png',
    sourceCandidates: ['public/assets/smokecraft/smokecraft Intake.png'],
    cropAsset: 'public/assets/smokecraft/cropped/intake-ashtray-bg.jpg',
    component: 'src/pages/smokecraft/Enroll.jsx',
    oldGeneric: '/assets/smokecraft/cropped/humidor-match-bg.jpg',
  },
  {
    name: 'Humidor Match 1.png',
    sourceCandidates: ['public/assets/smokecraft/Humidor Match 1.png'],
    cropAsset: 'public/assets/smokecraft/cropped/humidor-match-bg-v2.jpg',
    component: 'src/pages/smokecraft/HumidorMatch.jsx',
    oldGeneric: '/assets/smokecraft/cropped/humidor-match-bg.jpg',
  },
  {
    name: 'SEED PARING 2.png',
    sourceCandidates: ['public/SEED PARING 2.png'],
    cropAsset: 'public/assets/smokecraft/cropped/seed-soil-bg.jpg',
    component: 'src/pages/smokecraft/SeedSoil.jsx',
    oldGeneric: '/assets/smokecraft/cropped/humidor-match-bg.jpg',
  },
  {
    name: 'SHAPE SIZE BURN.11.png',
    sourceCandidates: ['public/SHAPE SIZE BURN.11.png'],
    cropAsset: 'public/assets/smokecraft/cropped/format-master-tip-v2.jpg',
    component: 'src/pages/smokecraft/Format.jsx',
    oldGeneric: '/assets/smokecraft/cropped/format-master-tip.jpg',
  },
  {
    name: 'GOLDEN BOX JOURNEY11.png',
    sourceCandidates: ['public/GOLDEN BOX JOURNEY11.png'],
    cropAsset: 'public/assets/smokecraft/cropped/scorecard-bg-v2.jpg',
    component: 'src/pages/smokecraft/Scorecard.jsx',
    oldGeneric: '/assets/smokecraft/cropped/scorecard-bg.jpg',
  },
  {
    name: 'lounge demo ranking.11png.png',
    sourceCandidates: ['public/lounge demo ranking.11png.png'],
    cropAsset: 'public/assets/smokecraft/cropped/golden-box-hero-v2.jpg',
    component: 'src/pages/smokecraft/Leaderboard.jsx',
    oldGeneric: '/assets/smokecraft/cropped/golden-box-hero.jpg',
  },
  {
    name: 'PROFILE DISCOVER 11.png',
    sourceCandidates: ['public/PROFILE DISCOVER 11.png'],
    cropAsset: 'public/assets/smokecraft/cropped/discover-profile-hero.jpg',
    component: 'src/pages/SmokeCraft.jsx',
    oldGeneric: '/assets/smokecraft/cropped/discover-profile-bg-v3.jpg',
  },
  {
    name: 'SEED & PAIRING.11.png',
    sourceCandidates: ['public/SEED & PAIRING.11.png'],
    cropAsset: 'public/assets/smokecraft/cropped/seed-soil-bg.jpg',
    component: 'src/pages/smokecraft/SeedSoil.jsx',
  },
]

for (const req of requirements) {
  console.log(`\n--- ${req.name} ---`)

  // 1. Exact requested filename must exist (no substitution credit).
  const exactPath = req.sourceCandidates[0]
  const exactExists = fileExists(exactPath)
  check(`Requested source file exists at exactly "${exactPath}"`, exactExists,
    exactExists ? undefined : 'file not found in repo under this exact name')

  // 1b. The wired component image — the underlying source asset that was
  // actually content-matched and cropped — must also exist on disk.
  const wiredSource = req.sourceCandidates[req.sourceCandidates.length - 1]
  check(`Wired component source image exists at "${wiredSource}"`, fileExists(wiredSource))
  if (exactExists && wiredSource !== exactPath) {
    console.log(`     note: exact filename "${exactPath}" is an alias copy of "${wiredSource}"`)
  }

  // 2. Cropped/replacement asset must exist.
  check(`Cropped replacement asset exists at "${req.cropAsset}"`, fileExists(req.cropAsset))

  // 3. Component must reference the cropped asset.
  const cropBasename = req.cropAsset.replace('public', '')
  check(`${req.component} references the cropped asset (${cropBasename})`,
    fileContains(req.component, cropBasename.split('/').pop()))

  // 4. Component must NOT still point at the old generic shared image, if applicable.
  if (req.oldGeneric) {
    check(`${req.component} no longer references old generic image (${req.oldGeneric})`,
      fileDoesNotContain(req.component, req.oldGeneric))
  }
}

console.log(`\n=== ${passed} passed, ${failed} failed ===`)

if (failed > 0) {
  console.log('\nFAILURES:')
  for (const f of failures) {
    console.log(`  - ${f.label}${f.detail ? ` (${f.detail})` : ''}`)
  }
  process.exit(1)
} else {
  process.exit(0)
}
