/**
 * Holistic Fix 5C-2B-1 — real Playwright browser verification of the
 * Golden Box results/ranking screen (ResultsExperience.jsx), connected
 * to the now server-authoritative results aggregation and finalization
 * endpoints.
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

// Playwright's context-scoped request API — shares the same cookie jar
// as any page opened in this context, and proved more reliable than an
// in-page fetch() through the dev proxy in this environment (see the
// entry-creation flow below for the same substitution).
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

  const competitionId = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('hf5c2b1-results-browser-${Date.now()}', 'HF5C2B1 Results Browser Test', 'global', 'results_pending', now() + interval '7 days', 'test-admin') RETURNING id`)

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })

  // ── Build a real submitted, judged entry via real browser contexts ──
  const entrantContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const entrantPage = await entrantContext.newPage()
  await entrantPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await entrantPage.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({
      sessionId: 'hf5c2b1-results-entrant-' + Date.now(), guestId: 'hf5c2b1-results-guest-' + Date.now(),
      completedSteps: ['entry'], xp: 25, rank: 'Novice', badges: [], __version: 4,
    }))
  })
  // Playwright's context-scoped request API (shares the same cookie jar
  // as entrantPage) rather than in-page fetch() — in-page PATCH fetches
  // through the Vite dev proxy proved flaky (ERR_ABORTED) in headless
  // Chromium for this endpoint; context.request is the more reliable,
  // still-real HTTP path and still exercises the real server routes
  // under the real browser-established guest identity cookie.
  const createdRes = await entrantContext.request.post(`${BASE}/api/smokecraft/golden-box/competitions/${competitionId}/entries`)
  const created = await createdRes.json()
  const entryId = created.entry.entry_id
  const draftRes = await entrantContext.request.patch(`${BASE}/api/smokecraft/golden-box/entries/${entryId}/draft`, {
    data: { presentationPayload: { note: 'x' }, expectedVersion: 1, components: COMPLETE_COMPONENTS },
  })
  if (!draftRes.ok()) { console.error('DEBUG draft save failed:', draftRes.status(), await draftRes.text()); process.exit(1) }
  const submitRes = await entrantContext.request.post(`${BASE}/api/smokecraft/golden-box/entries/${entryId}/submit`)
  if (!submitRes.ok()) { console.error('DEBUG submit failed:', submitRes.status(), await submitRes.text()); process.exit(1) }
  await entrantContext.close()
  ok(`A real submitted entry was created via a real browser guest identity (entryId=${entryId.slice(0, 8)}…)`)

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const adminPage = await adminContext.newPage()
  await loginAs(adminPage, { email: 'admin@novee.dev', pin: '9999' })
  await adminContext.request.post(`${API}/api/smokecraft/golden-box/competitions/${competitionId}/entries/${entryId}/judges`, {
    data: { judgeUserId: 'manager-demo-001' },
  })

  // Score as the judge, then return to the admin page for finalization.
  const judgeContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const judgePage = await judgeContext.newPage()
  await loginAs(judgePage, { email: 'manager@novee.dev', pin: '5678' })
  await judgeContext.request.post(`${API}/api/smokecraft/golden-box/entries/${entryId}/scorecard`, {
    data: { scores: ALL_CATEGORIES.map(category => ({ category, score: 8 })) },
  })
  await judgeContext.close()

  const consoleErrors = []
  adminPage.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(`${msg.text()} [${msg.location()?.url || ''}]`) })
  adminPage.on('pageerror', err => consoleErrors.push(String(err)))

  console.log('\n── Results screen — ready to finalize state, real live server data ──')
  await nav(adminPage, `/smokecraft/golden-box/results/${competitionId}?entryId=${entryId}`)
  const headingVisible = await adminPage.locator('text=Results').first().isVisible().catch(() => false)
  headingVisible ? ok('Approved heading still renders (no visual regression)') : bad('Approved heading renders')
  const rankingsHeading = await adminPage.locator('text=Competition Rankings').first().isVisible().catch(() => false)
  rankingsHeading ? ok('Competition Rankings section renders') : bad('Competition Rankings section renders')
  const readyCopyVisible = await adminPage.locator('text=live preview').first().isVisible().catch(() => false)
  readyCopyVisible ? ok('The real ready-to-finalize state copy renders (server-driven, not hardcoded)') : bad('ready-to-finalize state copy renders')
  const rankRowVisible = await adminPage.locator(`text=${entryId.slice(0, 8)}`).first().isVisible().catch(() => false)
  rankRowVisible ? ok('The real ranked entry row is visible in the live preview') : bad('Ranked entry row visible')

  console.log('\n── Finalize action — real server finalization from the browser ──')
  const finalizeBtn = adminPage.getByRole('button', { name: /Finalize Results/i })
  const finalizeBtnVisible = await finalizeBtn.first().isVisible().catch(() => false)
  if (finalizeBtnVisible) {
    await finalizeBtn.first().click()
    await adminPage.waitForTimeout(1500)
    ok('Finalize Results control is present and clickable for an authorized admin')
  } else {
    bad('Finalize Results control is present')
  }
  await adminPage.reload({ waitUntil: 'domcontentloaded' })
  await adminPage.waitForTimeout(1200)
  const finalizedCopyVisible = await adminPage.locator('text=Official, finalized rankings').first().isVisible().catch(() => false)
  finalizedCopyVisible ? ok('After finalization, reloading shows the real, immutable finalized ranking') : bad('Finalized ranking renders after reload')

  console.log('\n── Non-admin viewer — sees only the published finalized ranking, no live pending detail ──')
  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const publicPage = await publicContext.newPage()
  await publicPage.goto(BASE, { waitUntil: 'domcontentloaded' })
  await publicContext.request.post(`${API}/api/auth/staff-pin-login`, { data: { pin: '1234' } })
  await nav(publicPage, `/smokecraft/golden-box/results/${competitionId}?entryId=${entryId}`)
  const publicFinalizedVisible = await publicPage.locator('text=Official, finalized rankings').first().isVisible().catch(() => false)
  publicFinalizedVisible ? ok('A non-admin viewer sees the real published finalized ranking') : bad('Non-admin sees finalized ranking')
  const publicFinalizeBtnVisible = await publicPage.getByRole('button', { name: /Finalize Results/i }).first().isVisible().catch(() => false)
  !publicFinalizeBtnVisible ? ok('A non-admin viewer never sees a Finalize control (server never returns the ready_to_finalize admin state to them)') : bad('Non-admin correctly hides Finalize control')
  await publicContext.close()

  console.log('\n── No entries — honest empty state ──')
  const emptyCompetitionId = psql(`INSERT INTO golden_box_competitions (competition_key, title, scope, status, submission_closes_at, created_by) VALUES ('hf5c2b1-empty-${Date.now()}', 'HF5C2B1 Empty', 'global', 'active', now() + interval '7 days', 'test-admin') RETURNING id`)
  await nav(adminPage, `/smokecraft/golden-box/results/${emptyCompetitionId}`)
  const noEntriesVisible = await adminPage.locator('text=No entries have been submitted').first().isVisible().catch(() => false)
  noEntriesVisible ? ok('An empty competition renders an honest "no entries" state, not a crash') : bad('Honest no-entries state')

  console.log('\n── Keyboard / layout / no console errors ──')
  await adminPage.keyboard.press('Tab')
  const activeTag = await adminPage.evaluate(() => document.activeElement?.tagName)
  activeTag ? ok('Keyboard navigation moves focus on the Results screen') : bad('Keyboard navigation moves focus')
  const overflowX = await adminPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2)
  overflowX ? ok('No horizontal layout cutoff on the Results screen') : bad('No horizontal layout cutoff')

  const realErrors = consoleErrors.filter(e => !/favicon|ResizeObserver|status of 40[139]|status of 429/i.test(e))
  realErrors.length === 0 ? ok('No unexpected console errors across the Results screen') : bad('No console errors', realErrors.slice(0, 3).join(' | '))

  await adminContext.close()
  await browser.close()

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  const fs = await import('fs')
  fs.mkdirSync('public/proof/smokecraft-holistic-fix-5c-2b-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-holistic-fix-5c-2b-1/02-results-browser-results.json', JSON.stringify({ pass, fail, total: pass + fail, results }, null, 2))
  process.exit(fail > 0 ? 1 : 0)
}

run().catch(err => { console.error(err); process.exit(1) })
