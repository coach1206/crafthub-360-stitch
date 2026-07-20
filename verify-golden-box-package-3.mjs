// Package 3 tests: educational content model + tobacco component catalog
// + Golden Box integration. Real disposable local Postgres, real running
// Express server, real browser for the integration checks. Clearly
// separates API/database checks from browser/UI checks.
import { chromium } from 'playwright'
import pg from 'pg'

const API_BASE = process.env.PKG3_BASE || 'http://localhost:3001'
const UI_BASE = 'http://localhost:5000'
const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) { console.error('DATABASE_URL required'); process.exit(1) }
const pool = new pg.Pool({ connectionString: DATABASE_URL })

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? ' — ' + detail : ''}`)
}

const adminHeaders = { 'Content-Type': 'application/json', 'x-novee-user-role': 'admin', 'x-novee-user-id': 'pkg3-admin' }

try {
  // ── DATABASE checks ──
  const tableCheck = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_name IN
     ('smokecraft_content_versions','smokecraft_content_media','smokecraft_hotspots',
      'smokecraft_flavor_notes','smokecraft_component_compatibility','smokecraft_quiz_questions',
      'smokecraft_content_audit_log')`
  )
  check('DB: all 7 new Package 3 tables exist', tableCheck.rows.length === 7)

  // Package 6 gate review: this was `=== 34`, an exact count that broke
  // every time a later package (Package 4, Package 5) legitimately added
  // more real content through the same seed script (all rows share
  // created_by = 'package-3-seed' regardless of which package added
  // them). Changed to >= 34 to preserve the original regression intent
  // ("did Package 3's rows disappear?") without re-breaking on growth.
  // See docs/audits/smokecraft-final-completion/package-6/01-PREEXISTING-TEST-GATE-REVIEW.md.
  const seedCheck = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE created_by = 'package-3-seed'`)
  check('DB: at least 34 seeded educational component records exist (Package 3 floor, later packages add more)', seedCheck.rows[0].c >= 34)

  const anatomyCheck = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type = 'plant_anatomy'`)
  check('DB: 7 plant anatomy records seeded', anatomyCheck.rows[0].c === 7)

  const primingCheck = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE component_type = 'leaf_priming'`)
  check('DB: 4 leaf priming records seeded (ligero/viso/seco/volado)', primingCheck.rows[0].c === 4)

  const flavorCheck = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_flavor_notes`)
  check('DB: 16 flavor taxonomy groups seeded', flavorCheck.rows[0].c === 16)

  const compatCheck = await pool.query(`SELECT COUNT(*)::int AS c FROM smokecraft_component_compatibility`)
  check('DB: component compatibility relationships seeded', compatCheck.rows[0].c > 0)

  const substantiveCheck = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_component_catalog WHERE created_by='package-3-seed' AND length(why_it_matters) < 20`)
  check('DB: every seeded record has substantive (not one-line) educational text', substantiveCheck.rows[0].c === 0)

  // ── API checks ──
  const listRes = await fetch(`${API_BASE}/api/smokecraft/golden-box-content/components?category=leaf_priming`).then(r => r.json())
  check('API: GET /components?category=leaf_priming returns real published records', listRes.success === true && listRes.components.length === 4)

  const ligero = listRes.components.find(c => c.component_key === 'ligero')
  const detailRes = await fetch(`${API_BASE}/api/smokecraft/golden-box-content/components/${ligero.id}`).then(r => r.json())
  check('API: GET /components/:id returns full detail with compatibility + quiz', detailRes.success === true && Array.isArray(detailRes.compatibility) && Array.isArray(detailRes.quiz))
  check('API: quiz reads exclude correct_answer/explanation (no answer leakage)', detailRes.quiz.every(q => !('correct_answer' in q) && !('explanation' in q)))

  const flavorRes = await fetch(`${API_BASE}/api/smokecraft/golden-box-content/flavor-notes`).then(r => r.json())
  check('API: GET /flavor-notes returns real taxonomy', flavorRes.success === true && flavorRes.notes.length === 16)

  // Unauthorized management denial
  const unauthCreateRes = await fetch(`${API_BASE}/api/smokecraft/golden-box-content/components`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-novee-user-role': 'staff', 'x-novee-user-id': 'pkg3-outsider' },
    body: JSON.stringify({ componentType: 'wrapper', componentKey: 'test-unauthorized', displayName: 'Should be denied' }),
  })
  check('API: unauthorized (non-admin) content creation denied', unauthCreateRes.status === 403)

  // Draft/publish lifecycle
  const draftRes = await fetch(`${API_BASE}/api/smokecraft/golden-box-content/components`, {
    method: 'POST', headers: adminHeaders,
    body: JSON.stringify({ componentType: 'wrapper', componentKey: 'pkg3-test-draft', displayName: 'Test Draft Wrapper', whyItMatters: 'Test content for Package 3 verification.' }),
  }).then(r => r.json())
  check('API: draft content creation succeeds', draftRes.success === true && draftRes.component.visibility === 'draft')
  const draftId = draftRes.component.id

  const draftVisibilityRes = await fetch(`${API_BASE}/api/smokecraft/golden-box-content/components/${draftId}`).then(r => r.json())
  check('API: draft content NOT visible via public read', draftVisibilityRes.success === false)

  const publishRes = await fetch(`${API_BASE}/api/smokecraft/golden-box-content/components/${draftId}/publish`, { method: 'POST', headers: adminHeaders }).then(r => r.json())
  check('API: publish succeeds', publishRes.success === true && publishRes.component.visibility === 'published')

  const publishedVisibilityRes = await fetch(`${API_BASE}/api/smokecraft/golden-box-content/components/${draftId}`).then(r => r.json())
  check('API: published content now visible via public read', publishedVisibilityRes.success === true)

  const auditRows = await pool.query(`SELECT COUNT(*)::int AS c FROM audit_logs WHERE action_category='GOLDEN_BOX' AND action IN ('content_draft_created','content_published') AND created_at > now() - interval '5 minutes'`)
  check('DB: content audit log rows created', auditRows.rows[0].c > 0)

  // ── BROWSER / UI checks ──
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const consoleErrors = []
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()) })

  await page.goto(`${UI_BASE}/smokecraft/venue-select`)
  await page.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1'); sessionStorage.setItem('demoMode', 'true'); sessionStorage.setItem('novee_booted', '1')
    localStorage.setItem('novee_guest_session', JSON.stringify({ completedSteps: ['entry'], xp: 0, badges: [] }))
    localStorage.setItem('sc_journey_v1', JSON.stringify({
      stateVersion: 3, spineVersion: 1,
      selectedVenue: { id: 'pkg3-venue', name: 'Package 3 Venue', skipped: false, selectedAt: Date.now() },
      mentor: [{ id: 'dominican', name: 'Don Alejandro', country: 'DR', image: '/mentors/don-alejandro.jpg' }],
    }))
  })

  const compRow = await pool.query(`SELECT id FROM golden_box_competitions WHERE competition_key = 'pkg3-live-comp'`)
  const competitionId = compRow.rows[0].id
  const entryRes = await fetch(`${API_BASE}/api/smokecraft/golden-box/competitions/${competitionId}/entries`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
  })
  // Guest identity cookie needed — use the real UI flow instead for entry creation
  await page.goto(`${UI_BASE}/smokecraft/golden-box/competitions/${competitionId}`)
  await page.waitForTimeout(1200)
  await page.click('text=Check My Eligibility')
  await page.waitForTimeout(1200)
  await page.click('text=Create My Entry')
  await page.waitForTimeout(1500)
  const workspaceUrl = page.url()
  const entryIdMatch = workspaceUrl.match(/entries\/([0-9a-f-]{36})\/blend/)
  const entryId = entryIdMatch?.[1]
  check('UI: entry workspace reached with real backend entry', !!entryId)

  await page.waitForTimeout(1000)
  const wrapperSelectCount = await page.locator('#gb-picker-wrapper option').count()
  check('UI: Wrapper dropdown shows real catalog options (not a fabricated placeholder)', wrapperSelectCount > 1)

  const bodyText = await page.textContent('body')
  check('UI: no honestly-labeled-placeholder text remains for seeded categories', !bodyText.includes('catalog not yet configured'))

  // No default selection
  const wrapperValue = await page.locator('#gb-picker-wrapper').inputValue()
  check('UI: no default/auto-selected component (empty until learner chooses)', wrapperValue === '')

  // Select real wrapper option, open educational panel with real content
  await page.selectOption('#gb-picker-wrapper', { index: 1 })
  await page.waitForTimeout(300)
  const wrapperPanels = page.locator('div').filter({ hasText: 'Wrapper (role)' })
  await page.locator('button', { hasText: 'Learn More' }).first().click()
  await page.waitForTimeout(500)
  const modalText = await page.textContent('body')
  check('UI: educational modal shows real database-backed content (Why it matters present)', modalText.includes('Why it matters'))
  await page.locator('button[aria-label="Close educational detail"]').click()
  await page.waitForTimeout(300)

  // Anatomy category should show honest not-yet-available only if not present in required/optional lists (it's not currently listed in EntryWorkspace's UI at all — confirmed separately)
  check('UI: no NEW console errors', consoleErrors.filter(e => !e.includes('SmokeCraftSessionGuard') && !e.includes('404')).length === 0)

  await browser.close()

  // ── Cleanup ──
  await pool.query(`DELETE FROM golden_box_submissions WHERE entry_id = $1`, [entryId]).catch(() => {})
  await pool.query(`DELETE FROM golden_box_blend_components WHERE entry_version_id IN (SELECT id FROM golden_box_entry_versions WHERE entry_id = $1)`, [entryId]).catch(() => {})
  await pool.query(`DELETE FROM golden_box_entry_versions WHERE entry_id = $1`, [entryId]).catch(() => {})
  await pool.query(`DELETE FROM golden_box_entries WHERE entry_id = $1`, [entryId]).catch(() => {})
  await pool.query(`DELETE FROM golden_box_competitions WHERE competition_key = 'pkg3-live-comp'`)
  await pool.query(`DELETE FROM smokecraft_content_versions WHERE component_id = $1`, [draftId])
  await pool.query(`DELETE FROM golden_box_component_catalog WHERE component_key = 'pkg3-test-draft'`)

  const remaining = await pool.query(`SELECT COUNT(*)::int AS c FROM golden_box_competitions WHERE competition_key = 'pkg3-live-comp'`)
  check('Test data removed', remaining.rows[0].c === 0)

} catch (err) {
  console.error('Unexpected error:', err)
  results.push({ name: 'unexpected error', pass: false, detail: err.message })
} finally {
  await pool.end()
}

const failed = results.filter(r => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} passed`)
if (failed.length) process.exit(1)
