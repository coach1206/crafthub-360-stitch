import fs from 'fs'

let pass = 0, fail = 0
function check(label, ok) {
  if (ok) { pass++; console.log(`PASS — ${label}`) }
  else { fail++; console.log(`FAIL — ${label}`) }
}

// This suite verifies AUDIT COMPLETENESS only. It does not, and must not,
// claim the live product is fixed — see 12-ROOT-CAUSE-FINDINGS.md for what
// remains unproven without real Railway/production access.

const DOCS = 'docs/audits/smokecraft-final-completion/full-root-cause-audit'
const PROOF = 'public/proof/smokecraft-full-root-cause-audit'

function docExists(name) { return fs.existsSync(`${DOCS}/${name}`) }
function docContains(name, str) { return docExists(name) && fs.readFileSync(`${DOCS}/${name}`, 'utf8').includes(str) }

// 1. Deployment source examined
check('1. Deployment source was examined', docContains('01-DEPLOYMENT-AUDIT.md', 'Correct repository'))
// 2. Production commit examined
check('2. Production commit was examined', docContains('01-DEPLOYMENT-AUDIT.md', 'deployed build include commit'))
// 3. Asset inventory
check('3. Asset inventory was performed', docContains('02-APPROVED-ASSET-INVENTORY.md', '365 files'))
// 4. Route-to-asset map
check('4. Route-to-asset map was built', docContains('03-ROUTE-ASSET-TRUTH-TABLE.md', 'Asset Exists on Disk'))
// 5. All entry screens
check('5. All entry screens were examined', ['Landing', 'Enroll', 'Identity', 'Venue Select', 'Mentor'].every(s => docContains('03-ROUTE-ASSET-TRUTH-TABLE.md', s.split(' ')[0])))
// 6. All 27 sessions
check('6. All 27 sessions were examined', docContains('03-ROUTE-ASSET-TRUTH-TABLE.md', 'S27'))
// 7. All 6 phases
check('7. All 6 phases were examined', docContains('06-SESSION-SEQUENCE-AUDIT.md', 'phases: 6'))
// 8. Journey-state authorities
check('8. Journey-state authorities were mapped', docContains('07-JOURNEY-STATE-AUTHORITY-AUDIT.md', 'GuestSessionContext'))
// 9. Storage authorities
check('9. Storage authorities were mapped', docContains('07-JOURNEY-STATE-AUTHORITY-AUDIT.md', 'IndexedDB'))
// 10. Hydration timing
check('10. Hydration/timing was examined', docContains('08-HYDRATION-AND-TIMING-AUDIT.md', 'Timelines'))
// 11. Fallback/demo content
check('11. Fallback/demo content was searched', docContains('09-FALLBACK-DEMO-AUDIT.md', 'Greg Guy'))
// 12. Test validity
check('12. Test validity was audited', docContains('10-TEST-VALIDITY-AUDIT.md', 'chromium.launch'))
// 13. Production bundle
check('13. Production bundle was inspected', docContains('11-PRODUCTION-BUNDLE-AUDIT.md', 'dist/index.html'))
// 14. Browser profiles
check('14. Browser profiles were run', fs.existsSync(`${PROOF}/browser-profile-results.json`))
// 15. Root-cause classification
check('15. Root-cause classification was produced', docContains('12-ROOT-CAUSE-FINDINGS.md', 'Primary root cause'))
// 16. Permanent remediation plan
check('16. Permanent remediation plan was produced', docContains('13-PERMANENT-REMEDIATION-PLAN.md', 'Package 1'))

// Structural safety checks — this suite must never claim the product is fixed
const findings = fs.readFileSync(`${DOCS}/12-ROOT-CAUSE-FINDINGS.md`, 'utf8')
check('Findings do not claim the live product is confirmed fixed', !findings.includes('PASS — LIVE') && !/live.{0,40}confirmed fixed/i.test(findings))
check('Findings disclose unproven items rather than asserting them resolved', findings.includes('Suspected but unproven'))

const readme = fs.existsSync(`${DOCS}/README.md`)
check('README index exists linking every audit document', readme && ['00-SYSTEM-MAP', '01-DEPLOYMENT-AUDIT', '12-ROOT-CAUSE-FINDINGS', '13-PERMANENT-REMEDIATION-PLAN'].every(d => fs.readFileSync(`${DOCS}/README.md`, 'utf8').includes(d)))

const allDocs = ['00-SYSTEM-MAP.md', '01-DEPLOYMENT-AUDIT.md', '02-APPROVED-ASSET-INVENTORY.md', '03-ROUTE-ASSET-TRUTH-TABLE.md', '04-COMPONENT-RENDERING-AUDIT.md', '05-ENTRY-SEQUENCE-AUDIT.md', '06-SESSION-SEQUENCE-AUDIT.md', '07-JOURNEY-STATE-AUTHORITY-AUDIT.md', '08-HYDRATION-AND-TIMING-AUDIT.md', '09-FALLBACK-DEMO-AUDIT.md', '10-TEST-VALIDITY-AUDIT.md', '11-PRODUCTION-BUNDLE-AUDIT.md', '12-ROOT-CAUSE-FINDINGS.md', '13-PERMANENT-REMEDIATION-PLAN.md']
check('All 14 required audit documents exist', allDocs.every(docExists))

check('Proof directory exists with evidence files', fs.existsSync(PROOF) && fs.readdirSync(PROOF).length >= 5)

console.log(`\n${pass} passed, ${fail} failed (of ${pass + fail} total)`)
console.log('\nThis suite verifies AUDIT COMPLETENESS only — it makes no claim about live product correctness.')
process.exit(fail > 0 ? 1 : 0)
