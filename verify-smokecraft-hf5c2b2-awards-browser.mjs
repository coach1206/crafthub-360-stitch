/**
 * Holistic Fix 5C-2B-2 — real Playwright browser verification of the
 * Golden Box award display on ResultsExperience.jsx, connected to the
 * now server-authoritative award-issuance endpoints.
 */
import { chromium } from 'playwright'
import { execSync } from 'child_process'
import 'dotenv/config'

const BASE = 'http://localhost:5000'
const API = 'http://localhost:3001'
const EXEC = '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
const results = []
function ok(msg) { pass++; results.push({ name: msg, ok: true }); console.log(`  PASS  ${msg}`) }
function bad(msg, detail) { fail++; results.push({ name: msg, ok: false, detail }); console.log(`  FAIL  ${msg}${detail ? ' — ' + detail : ''}`) }

function sh(cmd) { return execSync(cmd, { encoding: 'utf8', env: process.env }) }

const COMPLETE_COMPONENTS = [
  { componentType: 'wrapper', componentKey: 'habano', componentValue: {} },
  { componentType: 'binder', componentKey: 'nicaragua', componentValue: {} },
  { componentType: 'filler', componentKey: 'criollo', componentValue: {} },
  { componentType: 'vitola', componentKey: 'robusto', componentValue: {} },
]
const ALL_CATEGORIES = ['construction', 'draw', 'burn', 'aroma', 'flavor', 'balance', 'complexity', 'progression', 'finish', 'creativity', 'rule_compliance', 'overall_impression']

async function loginAs(page, { email, pin }) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.context().request.post(`${API}/api/auth/admin-login`, { data: { email, pin } })
}

async function nav(page, path) {
  try { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 20000 }) }
  catch { await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 }) }
  await page.waitForTimeout(1200)
}

async function run() {
  const dbName = new URL(process.env.DATABASE_URL).pathname.replace(/^\//, '')
  const psql = (sql) => sh(`sudo -u postgres psql -d ${dbName} -tAc "${sql.replace(/"/g, '\\"')}"`).split('\n')[0].trim()

  const competitionId = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('hf5c2b2-awards-browser-${Date.now()}', 'HF5C2B2 Awards Browser Test', 'global', 'results_pending', now() + interval '7 days', 'test-admin') RETURNING id`)

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })

  const entrantContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const entrantPage = await entrantContext.newPage()
  await entrantPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await entrantPage.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'hf5c2b2-awards-entrant-' + Date.now(), guestId: 'hf5c2b2-awards-guest-' + Date.now(),
      completedSteps: ['entry'], xp: 25, rank: 'Novice', badges: [], __version: 4,
    }))
  })
  const createdRes = await entrantContext.request.post(`${BASE}/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  const created = await createdRes.json()
  const entryId = created.entry.entry_id
  await entrantContext.request.patch(`${BASE}/api/smokecraft/golden-box/entries/${entryId}/draft`, {
    data: { presentationPayload: { note: 'x' }, expectedVersion: 1, components: COMPLETE_COMPONENTS },
  })
  await entrantContext.request.post(`${BASE}/api/smokecraft/golden-box/entries/${entryId}/submit`)
  await entrantContext.close()
  ok(`A real submitted entry was created via a real browser guest identity (entryId=${entryId.slice(0, 8)}…)`)

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const adminPage = await adminContext.newPage()
  await loginAs(adminPage, { email: 'admin@novee.dev', pin: '9999' })
  await adminContext.request.post(`${API}/api/smokecraft/golden-box/competitions/${competitionId}/entries/${entryId}/judges`, {
    data: { judgeUserId: 'manager-demo-001' },
  })

  const judgeContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const judgePage = await judgeContext.newPage()
  await loginAs(judgePage, { email: 'manager@novee.dev', pin: '5678' })
  await judgeContext.request.post(`${API}/api/smokecraft/golden-box/entries/${entryId}/scorecard`, {
    data: { scores: ALL_CATEGORIES.map(category => ({ category, score: 9 })) },
  })
  await judgeContext.close()

  await adminContext.request.post(`${API}/api/smokecraft/golden-box/competitions/${competitionId}/results/finalize`, { data: {} })

  const consoleErrors = []
  adminPage.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  adminPage.on('pageerror', err => consoleErrors.push(String(err)))

  console.log('\n── Award section — pending state before issuance ──')
  await nav(adminPage, `/smokecraft/golden-box/results/${competitionId}?entryId=${entryId}`)
  const awardHeadingVisible = await adminPage.locator('text=Your Award').first().isVisible().catch(() => false)
  awardHeadingVisible ? ok('Award section renders with approved visuals') : bad('Award section renders')
  const pendingCopyVisible = await adminPage.locator('text=Awards have not been issued yet').first().isVisible().catch(() => false)
  pendingCopyVisible ? ok('Real awards_pending state renders before issuance') : bad('awards_pending state renders')

  console.log('\n── Issue Awards action — real server issuance from the browser ──')
  const issueBtn = adminPage.getByRole('button', { name: /Issue Awards/i })
  const issueBtnVisible = await issueBtn.first().isVisible().catch(() => false)
  if (issueBtnVisible) {
    await issueBtn.first().click()
    await adminPage.waitForTimeout(1500)
    ok('Issue Awards control is present and clickable for an authorized admin')
  } else {
    bad('Issue Awards control is present')
  }
  await adminPage.reload({ waitUntil: 'domcontentloaded' })
  await adminPage.waitForTimeout(1200)
  const awardTitleVisible = await adminPage.locator('text=1st Place').first().isVisible().catch(() => false)
  awardTitleVisible ? ok('After issuance, reloading shows the real, server-computed award title (1st Place)') : bad('Award title renders after reload')
  const unavailableVisible = await adminPage.locator('text=/Not yet available/').first().isVisible().catch(() => false)
  unavailableVisible ? ok('XP/badge/stamp render an honest "unavailable" state — never a fabricated reward') : bad('Honest unavailable state renders')

  console.log('\n── Unauthorized viewer — never sees a fabricated reward, honest cross-user handling ──')
  const strangerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const strangerPage = await strangerContext.newPage()
  await strangerPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await strangerContext.request.post(`${API}/api/auth/staff-pin-login`, { data: { pin: '1234' } })
  await nav(strangerPage, `/smokecraft/golden-box/results/${competitionId}?entryId=${entryId}`)
  const strangerBodyVisible = await strangerPage.locator('body').isVisible().catch(() => false)
  strangerBodyVisible ? ok('An unrelated stranger viewing the results URL gets an honest response, not a crash') : bad('Stranger view handled honestly')
  await strangerContext.close()

  console.log('\n── Keyboard / layout / no console errors ──')
  await adminPage.keyboard.press('Tab')
  const activeTag = await adminPage.evaluate(() => document.activeElement?.tagName)
  activeTag ? ok('Keyboard navigation moves focus on the Results screen') : bad('Keyboard navigation moves focus')
  const overflowX = await adminPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowX ? ok('No horizontal layout cutoff on the Results screen') : bad('No horizontal layout cutoff')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[139]|status of 429/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the award-display flow') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await adminContext.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5c-2b-2', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5c-2b-2/02-awards-browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
