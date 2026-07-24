#!/usr/bin/env node
// Build-time SmokeCraft asset validation — Production Build Identity pass.
// Fails the build if a registered approved asset does not exist on disk,
// or if filename case does not match exactly. Run as a "prebuild" step so
// a broken asset registry can never silently ship.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// Screens with an intentionally, honestly disclosed missing approved asset
// (found by the prior root-cause audit — no fabricated substitute allowed).
const KNOWN_MISSING = new Set(['wrapperStrength', 'welcome'])

const { SC_ASSETS } = await import(path.join(root, 'src/constants/smokecraftAssets.js'))

let failed = 0
let checked = 0

for (const [key, value] of Object.entries(SC_ASSETS)) {
  if (value === null) {
    if (!KNOWN_MISSING.has(key)) console.log(`WARN  ${key}: null value not in the known-missing allowlist`)
    continue
  }
  checked++
  const withoutQuery = value.split('?')[0]
  const decoded = decodeURIComponent(withoutQuery)
  const fsPath = path.join(root, 'public', decoded)
  if (!fs.existsSync(fsPath)) {
    failed++
    console.error(`FAIL  ${key}: asset does not exist on disk — ${fsPath}`)
    continue
  }
  // Exact-case verification: readdir the parent and confirm a byte-identical
  // filename match (catches a case-insensitive filesystem masking a real
  // case mismatch that would 404 on Linux/Railway).
  const dir = path.dirname(fsPath)
  const base = path.basename(decoded.split('?')[0])
  const realEntries = fs.readdirSync(dir)
  if (!realEntries.includes(base)) {
    failed++
    console.error(`FAIL  ${key}: exact-case filename mismatch — expected "${base}" in ${dir}`)
  }
}

console.log(`\nSmokeCraft asset validation: ${checked - failed}/${checked} registered assets verified on disk with correct case.`)
if (failed > 0) {
  console.error(`\n${failed} asset(s) failed validation. Build refused.`)
  process.exit(1)
}
console.log('All registered SmokeCraft assets verified. Build may proceed.')
