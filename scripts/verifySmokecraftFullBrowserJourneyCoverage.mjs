#!/usr/bin/env node
// Coverage gate for the real full-browser journey proof
// (public/proof/smokecraft-full-real-browser-journey/route-trace.json,
// produced by scripts/proveSmokecraftFullRealBrowserJourney.mjs against
// a live server). Fails if the proof file is missing, stale in shape, or
// doesn't show the walkthrough reaching Session 27 naturally.
//
// NOT wired into `npm run prebuild` — prebuild must stay fast and
// offline (no live server/browser dependency), and every other gate in
// this repo's prebuild chain is a pure static-source check. This one
// requires scripts/proveSmokecraftFullRealBrowserJourney.mjs to have
// been run against a live server first. Run it as part of the release/
// CI process alongside the production build, not as a prebuild step.
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const TRACE_PATH = resolve('public/proof/smokecraft-full-real-browser-journey/route-trace.json')
let pass = 0, fail = 0
function assert(name, cond, detail) {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

assert('route-trace.json exists (run scripts/proveSmokecraftFullRealBrowserJourney.mjs against a live server first)', existsSync(TRACE_PATH))
if (!existsSync(TRACE_PATH)) {
  console.log(`\n${pass} passed, ${fail} failed`)
  process.exit(1)
}

const trace = JSON.parse(readFileSync(TRACE_PATH, 'utf8'))
assert('Trace is a non-empty array', Array.isArray(trace) && trace.length > 0)

const urls = trace.map(t => t.url || t.afterUrl).filter(Boolean)
const uniqueRoutes = new Set(urls.map(u => u.replace(/^https?:\/\/[^/]+/, '')))

// The 20 canonical spine routes reached via genuine substeps (some
// sessions share a route — S8/9, S12/13, S16/17/18, S19/20, S25/26 —
// so 27 sessions map to fewer distinct routes) plus the 3 opening-chain
// supporting screens and the entry layer.
const REQUIRED_ROUTES = [
  '/smokecraft/enroll', '/smokecraft/identity', '/smokecraft/venue-select', '/smokecraft/welcome',
  '/smokecraft/golden-box', '/smokecraft/mentor-selection', '/smokecraft/seed-soil',
  '/smokecraft/humidor-match', '/smokecraft/meet-your-cigar', '/smokecraft/terroir', '/smokecraft/format',
  '/smokecraft/request-purchase', '/smokecraft/cut-toast-light', '/smokecraft/lighting-tutorial',
  '/smokecraft/first-third', '/smokecraft/flavor-memory', '/smokecraft/pairing-lab', '/smokecraft/second-third',
  '/smokecraft/mentor-commentary', '/smokecraft/knowledge-drop', '/smokecraft/final-third', '/smokecraft/scorecard',
  '/smokecraft/ai-summary', '/smokecraft/pairing-recommendations', '/smokecraft/passport-stamp',
  '/smokecraft/final-review', '/smokecraft/rewards', '/smokecraft/session-complete',
]
for (const route of REQUIRED_ROUTES) {
  assert(`Route trace includes a real visit to ${route}`, [...uniqueRoutes].some(u => u.includes(route)))
}

assert('Trace reaches Session Complete (S27) — natural end of the numbered spine',
  trace.some(t => /session-complete/.test(t.url || '') && /Session Complete/i.test(t.action || '')))

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
console.log(`Unique routes visited: ${uniqueRoutes.size}`)
if (fail > 0) process.exit(1)
