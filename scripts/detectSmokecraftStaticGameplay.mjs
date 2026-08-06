#!/usr/bin/env node
/**
 * SmokeCraft static-gameplay detector.
 *
 * Scans every src/pages/smokecraft/*.jsx page for two real red flags:
 *
 *  1. IMAGE-DRIVES-COMPLETION: an <img> or a raw CSS-background "image"
 *     element (role="img" / backgroundImage:) that itself carries an
 *     onClick/onLoad handler which calls a completion/navigation function
 *     (onComplete(), navigate(...), awardSessionRewards(...), etc). If the
 *     picture itself is what finishes the session, there is no real
 *     gameplay behind it — that's the definition of "static gameplay
 *     dressed up as an interaction."
 *
 *  2. MANIFEST-CLAIMS-INTERACTION-BUT-HAS-NONE: the page's entry in
 *     src/constants/smokecraftRequiredInteractions.js declares a
 *     requiredInteractionType that is not null/'none', but the component
 *     file contains (heuristically) zero real interactive elements —
 *     no <button, no onClick on a non-image element, no <input, no
 *     <select, no <textarea, no role="button"/"radio"/"checkbox" controls.
 *
 * This is a heuristic, not a full AST/type analyzer — it is deliberately
 * simple (regex-based) but real: it reads actual file contents, counts
 * actual matches, and fails routes that actually trip the checks. It is
 * not a stub that always passes.
 *
 * Usage:
 *   node scripts/detectSmokecraftStaticGameplay.mjs [--dir <pagesDir>]
 *
 * --dir lets callers point the scan at a temp/copy directory instead of
 * the real src/pages/smokecraft, for testing the detector itself without
 * touching real source files.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')

const args = process.argv.slice(2)
const dirFlagIdx = args.indexOf('--dir')
const PAGES_DIR = dirFlagIdx !== -1 && args[dirFlagIdx + 1]
  ? path.resolve(args[dirFlagIdx + 1])
  : path.join(REPO_ROOT, 'src/pages/smokecraft')

const MANIFEST_PATH = path.join(REPO_ROOT, 'src/constants/smokecraftRequiredInteractions.js')

// ── Load the required-interactions manifest (best-effort, regex-based —
// it's a plain JS module, not JSON, so we extract route/type/component
// triples without executing it). ──────────────────────────────────────
function loadManifestEntries() {
  if (!existsSync(MANIFEST_PATH)) return []
  const src = readFileSync(MANIFEST_PATH, 'utf8')
  const entries = []
  // Match each object literal's route, requiredInteractionType, and
  // canonicalComponent fields — order-independent within a reasonable
  // window, since the manifest's field order is consistent but not
  // guaranteed to be identical, we scan blocks split on '{\n' boundaries.
  const blocks = src.split(/\n {2}\{\n/).slice(1)
  for (const block of blocks) {
    const routeMatch = block.match(/route:\s*'([^']+)'/)
    const typeMatch = block.match(/requiredInteractionType:\s*'([^']+)'/)
    const componentMatch = block.match(/canonicalComponent:\s*'([^']+)'/)
    if (routeMatch && componentMatch) {
      entries.push({
        route: routeMatch[1],
        requiredInteractionType: typeMatch ? typeMatch[1] : null,
        componentFile: componentMatch[1],
      })
    }
  }
  return entries
}

// ── Red flag 1: image element wired directly to completion/navigation. ──
function findImageDrivenCompletion(content) {
  const flags = []

  // Find candidate "image" elements: <img ...> tags, and role="img" divs
  // that also carry a CSS backgroundImage — then check whether that same
  // element's opening tag also carries an onClick/onLoad that itself
  // invokes a completion/navigation call.
  const completionCallPattern = /(onComplete|onNavigate|navigate|awardSessionRewards|completeSession|handleComplete|handleContinue)\s*\(/

  // <img ... onClick={...} ...> (also matches onLoad) — capture the full
  // tag content up to its self-closing '/>'. We match lazily up to '/>'
  // rather than a plain '>' because attribute values (e.g. an arrow
  // function `() => {...}`) can themselves contain a literal '>'.
  const imgTagRe = /<img\b[\s\S]*?\/>/g
  for (const m of content.matchAll(imgTagRe)) {
    const tag = m[0]
    const onClickMatch = tag.match(/on(?:Click|Load)=\{([\s\S]*?)\}(?=\s|\/?>)/)
    if (onClickMatch && completionCallPattern.test(onClickMatch[1])) {
      flags.push(`<img> handler wires directly to completion/navigation: ${onClickMatch[0].slice(0, 80)}`)
    }
  }

  // role="img" element whose nearby (same JSX element, ~400 char window)
  // props include both a backgroundImage and an onClick/onLoad that
  // itself completes/navigates.
  const roleImgRe = /<[A-Za-z][\w.]*\s[\s\S]{0,600}?role=["']img["'][\s\S]{0,600}?\/>/g
  for (const m of content.matchAll(roleImgRe)) {
    const tag = m[0]
    const hasBg = /backgroundImage\s*:/.test(tag)
    const onHandlerMatch = tag.match(/on(?:Click|Load)=\{([\s\S]*?)\}/)
    if (hasBg && onHandlerMatch && completionCallPattern.test(onHandlerMatch[1])) {
      flags.push(`role="img" background element wires directly to completion/navigation: ${onHandlerMatch[0].slice(0, 80)}`)
    }
  }

  return flags
}

// ── Red flag 2: manifest claims a real interaction type but the
// component has (heuristically) zero real interactive controls. ────────
const REAL_CONTROL_PATTERNS = [
  /<button\b/g,
  /<input\b/g,
  /<select\b/g,
  /<textarea\b/g,
  /role=["'](?:button|radio|checkbox|switch|slider|tab)["']/g,
]

function countRealControls(content) {
  // onClick on a non-<img>/non-role="img" element: strip out <img ...>
  // tags and role="img" elements first, then count remaining onClick.
  let stripped = content.replace(/<img\b[\s\S]*?\/>/g, '')
  stripped = stripped.replace(/<[A-Za-z][\w.]*\s[\s\S]{0,600}?role=["']img["'][\s\S]{0,600}?\/>/g, '')
  const onClickCount = (stripped.match(/onClick=\{/g) || []).length

  let total = onClickCount
  for (const re of REAL_CONTROL_PATTERNS) {
    total += (content.match(re) || []).length
  }
  return total
}

function detectManifestMismatch(content, requiredInteractionType) {
  if (!requiredInteractionType || requiredInteractionType === 'none' || requiredInteractionType === null) {
    return null
  }
  const controlCount = countRealControls(content)
  if (controlCount === 0) {
    return `manifest declares requiredInteractionType="${requiredInteractionType}" but component has 0 real interactive controls (button/input/select/textarea/role + non-image onClick)`
  }
  return null
}

// ── Run the scan. ────────────────────────────────────────────────────
function run() {
  if (!existsSync(PAGES_DIR)) {
    console.error(`FATAL: pages directory not found: ${PAGES_DIR}`)
    process.exit(2)
  }

  const manifestEntries = loadManifestEntries()
  const manifestByFile = new Map()
  for (const e of manifestEntries) {
    const base = e.componentFile.split('/').pop()
    manifestByFile.set(base, e)
  }

  const files = readdirSync(PAGES_DIR).filter(f => f.endsWith('.jsx'))
  const results = []

  for (const file of files) {
    const fullPath = path.join(PAGES_DIR, file)
    const content = readFileSync(fullPath, 'utf8')
    const manifestEntry = manifestByFile.get(file)
    const route = manifestEntry?.route || '(no manifest entry)'
    const reasons = []

    reasons.push(...findImageDrivenCompletion(content))

    const mismatch = detectManifestMismatch(content, manifestEntry?.requiredInteractionType)
    if (mismatch) reasons.push(mismatch)

    results.push({
      file,
      route,
      pass: reasons.length === 0,
      reasons,
    })
  }

  results.sort((a, b) => a.file.localeCompare(b.file))

  let failCount = 0
  console.log('SmokeCraft static-gameplay detector — per-route results\n')
  for (const r of results) {
    const status = r.pass ? 'PASS' : 'FAIL'
    if (!r.pass) failCount++
    console.log(`[${status}] ${r.file}  (${r.route})`)
    for (const reason of r.reasons) {
      console.log(`         - ${reason}`)
    }
  }

  console.log(`\n${results.length} file(s) scanned, ${results.length - failCount} pass, ${failCount} fail.`)

  if (failCount > 0) {
    process.exit(1)
  }
}

run()
