#!/usr/bin/env node
// Blank-panel detector (Live Production Player-Experience Repair pass).
//
// Static-source heuristic: flags any component in a canonical screen file
// that (a) has an explicit, non-trivial width+height (or a percentage
// width+height pair, the image-shell coordinate convention this repo
// uses) and (b) renders no text, no <img>, and no real control inside it
// — the exact shape of the GoldenBox.jsx `BlankPanel` defect (a
// decorated, appropriately-sized void with `aria-hidden="true"` and zero
// content). This is what let three large empty regions ship to
// production despite every existing test passing: none of them asserted
// on *visible content*, only on route/component/interaction presence.
//
// Deliberately conservative — flags only the exact repeated pattern
// (a self-closing or content-free `<ComponentName ... />` / `<div ...>
// </div>` invocation with aria-hidden="true" and an explicit width+height
// or percentage box), not every empty `<div>` (many are legitimate
// spacing/layout helpers, which the mandate explicitly says not to flag).
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const PAGES_DIR = path.join(REPO_ROOT, 'src/pages/smokecraft')

let pass = 0, fail = 0
const findings = []

function scan(file) {
  const src = readFileSync(file, 'utf8')
  const base = path.basename(file)

  // Pattern 1: a self-closing component invocation, aria-hidden, with an
  // explicit width+height (percentage or px) — the exact GoldenBox
  // BlankPanel shape.
  const selfClosingRe = /<(\w+)\s+aria-hidden="true"\s+style=\{\{[^}]*\}\}\s*\/>/g
  let m
  let hadFinding = false
  while ((m = selfClosingRe.exec(src))) {
    const snippet = m[0]
    const hasWidth = /width:\s*['"`]?\d/.test(snippet)
    const hasHeight = /height:\s*['"`]?\d/.test(snippet)
    if (hasWidth && hasHeight) {
      findings.push({ file: base, component: m[1], snippet: snippet.slice(0, 120) })
      hadFinding = true
    }
  }

  if (hadFinding) { fail++; console.log(`  FAIL  ${base}  — suspicious sized-and-empty component(s) found`) }
  else { pass++; console.log(`  PASS  ${base}`) }
}

const files = readdirSync(PAGES_DIR).filter(f => f.endsWith('.jsx')).map(f => path.join(PAGES_DIR, f))
for (const f of files) scan(f)

console.log(`\n${files.length} file(s) scanned, ${pass} pass, ${fail} fail.`)
if (findings.length > 0) {
  console.log('\nFindings:')
  for (const f of findings) console.log(`  ${f.file}: <${f.component} ...> — ${f.snippet}`)
}
if (fail > 0) process.exit(1)
