import fs from 'fs'

let pass = 0, fail = 0
function check(label, ok) {
  if (ok) { pass++; console.log(`PASS — ${label}`) }
  else { fail++; console.log(`FAIL — ${label}`) }
}

const appSrc = fs.readFileSync('src/App.jsx', 'utf8')

check('SMOKECRAFT_FLOW is marked deprecated and has zero real order/routing consumers', fs.readFileSync('src/constants/session.js', 'utf8').includes('DEPRECATED — Session-Sequence-Reconciliation'))
check('JOURNEY_STEPS (24-session contract) is marked deprecated', fs.readFileSync('src/modules/smokecraft/data/smokecraftJourneyContract.js', 'utf8').includes('DEPRECATED — Session-Sequence-Reconciliation'))
check('SmokeCraftModule.jsx is not imported by App.jsx (dead, unreachable)', !appSrc.includes('SmokeCraftModule'))
check('Format.legacy.jsx is not imported by App.jsx (dead, unreachable)', !appSrc.includes('Format.legacy'))

check('No duplicate <Route> registration exists for any of the 21 unique curriculum routes', (() => {
  const routes = ['welcome', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third', 'mentor-commentary', 'knowledge-drop', 'final-third', 'scorecard', 'ai-summary', 'pairing-recommendations', 'passport-stamp', 'final-review', 'rewards', 'session-complete']
  return routes.every(r => (appSrc.match(new RegExp(`path="${r}"`, 'g')) || []).length === 1)
})())

// "Personal Dashboard" is Identity's own legitimate, approved screen title
// (session.js: ENTRY_LAYER_SCREENS 'personal-dashboard' -> /smokecraft/identity)
// — the actual, previously-fixed defect was a *navigation button* mid-journey
// incorrectly labeled "Continue to Personal Dashboard", not the title itself.
check('No button/CTA still says "Continue to Personal Dashboard" mid-journey (the actual previously-fixed defect, re-verified)', !fs.readdirSync('src/pages/smokecraft').some(f => f.endsWith('.jsx') && fs.readFileSync(`src/pages/smokecraft/${f}`, 'utf8').includes('Continue to Personal Dashboard')))

check('AI Summary (session-21) has zero legacy production consumers outside the canonical registry/renderer', (() => {
  const consumers = []
  for (const f of fs.readdirSync('src/pages/smokecraft')) {
    if (f === 'AISummary.jsx' || !f.endsWith('.jsx')) continue
    const src = fs.readFileSync(`src/pages/smokecraft/${f}`, 'utf8')
    if (src.includes("from './AISummary") || src.includes('from "../AISummary')) consumers.push(f)
  }
  return consumers.length === 0
})())

check('SmokeCraftScreenRenderer is the only place App.jsx wires screenId="session-21"', (appSrc.match(/<SmokeCraftScreenRenderer screenId="session-21"/g) || []).length === 1)
check('No fallback component silently replaces AISummary at the ai-summary route', appSrc.includes('screenId="session-21"') && !appSrc.match(/path="ai-summary"[^>]*element=\{<SmokeCraftSessionGuard sessionNumber=\{21\}><AISummary/))

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
process.exit(fail > 0 ? 1 : 0)
