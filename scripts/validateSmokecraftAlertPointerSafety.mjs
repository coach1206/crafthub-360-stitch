#!/usr/bin/env node
/**
 * Holistic Fix 5A-3B — build-blocking guard for SC-D027: fails the build
 * if the shared version-mismatch alert (src/components/system/
 * BuildDiagnosticFooter.jsx) regresses to blocking pointer events on
 * controls underneath/nearby it, or if its own interactive action stops
 * being clickable, or if role="alert" semantics are removed.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft alert pointer-safety validator (Holistic Fix 5A-3B, SC-D027)\n')

const file = 'src/components/system/BuildDiagnosticFooter.jsx'
const src = fs.readFileSync(file, 'utf8')

check('BuildDiagnosticFooter.jsx exists and is readable', src.length > 0)
check('The mismatch banner still has role="alert" (screen-reader semantics intact)', /role="alert"/.test(src))

// Isolate just the mismatch-banner block (from `{mismatch &&` to its closing `)}`)
// to scope these checks to the actual alert, not the whole file.
const bannerMatch = src.match(/\{mismatch && \([\s\S]*?\n {6}\)\}/)
check('The mismatch-banner JSX block is present and parseable', !!bannerMatch)
const banner = bannerMatch ? bannerMatch[0] : ''

check('The banner\'s outer wrapper is pointer-transparent (pointerEvents: \'none\') — SC-D027 fix, empty regions never block controls underneath',
  /pointerEvents:\s*'none'/.test(banner))
check('The Refresh button explicitly opts back into pointer events (pointerEvents: \'auto\') — remains clickable',
  /pointerEvents:\s*'auto'/.test(banner))
check('The Refresh button still has a real onClick handler (interactive action not accidentally disabled)',
  /onClick=\{hardRefresh\}/.test(banner))
check('The banner is still full-viewport-width at top:0 (visual/position unchanged — no redesign)',
  /position:\s*'fixed',\s*top:\s*0,\s*left:\s*0,\s*right:\s*0/.test(banner))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
