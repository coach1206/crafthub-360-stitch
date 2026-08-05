// Standalone compliance-proof validator — split out of
// scripts/validateSmokecraftComplianceReadiness.mjs so the production
// build (npm run build / Railway's Docker build) never depends on
// public/proof/, which .dockerignore deliberately excludes from the
// build context. This script preserves those exact checks, unweakened,
// as an explicit local/CI verification command: `npm run
// verify:smokecraft-compliance-proof`.
//
// This validator confirms proof/evidence DOCUMENTS exist and say the
// right (honest, counsel-review-labeled) things — it does NOT and CANNOT
// confirm legal sufficiency.
import fs from 'node:fs'

let fail = 0
function check(name, cond, detail = '') {
  if (cond) { console.log(`  OK    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('── SmokeCraft compliance proof validator (Production Package 6)\n')

const proofDir = 'public/proof/smokecraft-legal-privacy-accessibility-tobacco-compliance'
check('proof path exists', fs.existsSync(proofDir))
check('E.A.T. known-defect doc exists and discloses 111/130', fs.existsSync(`${proofDir}/eat-known-defect.md`) &&
  /111\s*\/\s*130/.test(fs.existsSync(`${proofDir}/eat-known-defect.md`) ? fs.readFileSync(`${proofDir}/eat-known-defect.md`, 'utf8') : ''))
check('counsel-review-items doc exists (consolidated list for real lawyer review)', fs.existsSync(`${proofDir}/counsel-review-items.md`))
check('final-report doc exists', fs.existsSync(`${proofDir}/final-report.md`))
const a11yDocPath = `${proofDir}/accessibility-standard.md`
const a11yDoc = fs.existsSync(a11yDocPath) ? fs.readFileSync(a11yDocPath, 'utf8') : ''
check('accessibility standard doc exists and targets WCAG 2.2 AA readiness (not "certified")',
  fs.existsSync(a11yDocPath) && /WCAG 2\.2/.test(a11yDoc) && !/is (certified|WCAG 2\.2 (Level )?AA certified)/i.test(a11yDoc))
check('data-export sample doc exists (real FAKE-data export run)', fs.existsSync(`${proofDir}/export-sample.json`) || fs.existsSync(`${proofDir}/data-rights-workflow.md`))
check('deletion sample doc exists (real FAKE-data deletion run)', fs.existsSync(`${proofDir}/deletion-sample.json`) || fs.existsSync(`${proofDir}/data-rights-workflow.md`))

// No legal text anywhere in the proof docs claims unqualified "fully
// compliant" / "legally approved" language.
const bannedPhrases = [/fully legally compliant/i, /legally approved(?! pending)/i, /guarantees? compliance/i]
let bannedFound = []
if (fs.existsSync(proofDir)) {
  for (const f of fs.readdirSync(proofDir)) {
    const full = `${proofDir}/${f}`
    if (fs.statSync(full).isFile() && (f.endsWith('.md') || f.endsWith('.json'))) {
      const text = fs.readFileSync(full, 'utf8')
      for (const re of bannedPhrases) if (re.test(text)) bannedFound.push(`${f}:${re}`)
    }
  }
}
check('no proof doc falsely claims full legal compliance or legal approval', bannedFound.length === 0, bannedFound.join(', '))

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) process.exit(1)
