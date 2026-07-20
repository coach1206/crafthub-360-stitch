// SMOKECRAFT 360 + CRAFTHUB 360 — MVP2 Continuation Fix
// Verifies: (1) SmokeCraft landing CTA correctly distinguishes Start vs
// Resume Journey based on real journey progress, not merely Entry-layer
// completion; (2) /crafthub renders the current implementation with no
// fabricated operational metrics.
import { chromium } from 'playwright'
import fs from 'node:fs'

const BASE = 'http://localhost:5000'
const PROOF_DIR = 'public/proof/smokecraft-start-journey-crafthub-mvp2-correction'
fs.mkdirSync(PROOF_DIR, { recursive: true })

let pass = 0, fail = 0
function ok(label, cond) {
  if (cond) { pass++; console.log(`  ✓ ${label}`) }
  else { fail++; console.log(`  ✗ ${label}`) }
}

async function freshContext(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/smokecraft`)
  await page.evaluate(() => localStorage.clear())
  return { ctx, page }
}

async function seedState(page, { completedSteps = [], journey = {} } = {}) {
  await page.evaluate(({ completedSteps, journey }) => {
    const session = { completedSteps, xp: 0, rank: 'Guest' }
    localStorage.setItem('novee_guest_session', JSON.stringify(session))
    if (Object.keys(journey).length) {
      localStorage.setItem('sc_journey_v1', JSON.stringify({ version: 3, ...journey }))
    }
  }, { completedSteps, journey })
}

async function landingCtaLabel(page) {
  await page.goto(`${BASE}/smokecraft`)
  await page.waitForTimeout(300)
  const btn = page.locator('button:has-text("Journey")').first()
  return (await btn.textContent())?.trim()
}

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })

  console.log('── SmokeCraft Landing CTA ──')
  {
    const { ctx, page } = await freshContext(browser)
    const label = await landingCtaLabel(page)
    ok('A. Fresh visitor sees Start Journey', /Start Journey/.test(label))
    await ctx.close()
  }
  {
    const { ctx, page } = await freshContext(browser)
    await seedState(page, { completedSteps: [] })
    const label = await landingCtaLabel(page)
    ok('B. Guest session, no progress sees Start Journey', /Start Journey/.test(label))
    await ctx.close()
  }
  {
    const { ctx, page } = await freshContext(browser)
    await seedState(page, { completedSteps: ['enroll'] })
    const label = await landingCtaLabel(page)
    ok('C. Identity/enroll-only sees Start Journey (root-cause case)', /Start Journey/.test(label))
    await ctx.close()
  }
  {
    const { ctx, page } = await freshContext(browser)
    await seedState(page, { completedSteps: ['enroll'], journey: { selectedVenue: { id: 'v1', name: 'Test Venue' } } })
    const label = await landingCtaLabel(page)
    ok('D. Venue selected only sees Start Journey', /Start Journey/.test(label))
    await ctx.close()
  }
  {
    const { ctx, page } = await freshContext(browser)
    await seedState(page, {
      completedSteps: ['enroll', 'golden-box', 'mentor'],
      journey: { selectedVenue: { id: 'v1', name: 'Test Venue' }, resumeRoute: '/smokecraft/seed-soil' },
    })
    const label = await landingCtaLabel(page)
    ok('F. Valid progress at Seed & Soil sees Resume Journey', /Resume Journey/.test(label))
    await page.screenshot({ path: `${PROOF_DIR}/smokecraft-resume-state.png` })
    await ctx.close()
  }
  {
    const { ctx, page } = await freshContext(browser)
    await seedState(page, {
      completedSteps: ['enroll', 'mentor'],
      journey: { selectedVenue: { id: 'v1', name: 'Test Venue' }, resumeRoute: '/smokecraft/format' },
    })
    const label = await landingCtaLabel(page)
    ok('H. Stale /format target after Mentor still shows Resume (real progress exists)', /Resume Journey/.test(label))
    await ctx.close()
  }
  {
    const { ctx, page } = await freshContext(browser)
    await seedState(page, {
      completedSteps: ['enroll', 'golden-box', 'mentor', 'session-complete'],
      journey: { selectedVenue: { id: 'v1', name: 'Test Venue' } },
    })
    const label = await landingCtaLabel(page)
    ok('I. Completed journey does not crash / has a defined CTA label', typeof label === 'string' && label.length > 0)
    await ctx.close()
  }
  {
    const { ctx, page } = await freshContext(browser)
    await seedState(page, { completedSteps: ['enroll'], journey: { resumeRoute: '/smokecraft/nonexistent-route' } })
    const label = await landingCtaLabel(page)
    ok('J. Corrupted/unknown persisted route never breaks the CTA (safe fallback)', /Start Journey|Resume Journey/.test(label))
    await ctx.close()
  }
  {
    const { ctx, page } = await freshContext(browser)
    const label1 = await landingCtaLabel(page)
    await page.reload()
    await page.waitForTimeout(300)
    const label2 = await landingCtaLabel(page)
    ok('L. Refresh preserves correct CTA', label1 === label2)
    await ctx.close()
  }
  {
    const { ctx, page } = await freshContext(browser)
    await page.waitForTimeout(300)
    const bodyText = await page.locator('body').textContent()
    const startCount = (bodyText.match(/Start Journey/g) || []).length
    const resumeCount = (bodyText.match(/Resume Journey/g) || []).length
    ok('No duplicate baked + live CTA text (exactly one journey CTA)', startCount + resumeCount === 1)
    await page.screenshot({ path: `${PROOF_DIR}/smokecraft-fresh-state.png` })
    await ctx.close()
  }
  {
    const { ctx, page } = await freshContext(browser)
    await page.waitForTimeout(300)
    const session = await page.evaluate(() => localStorage.getItem('novee_guest_session'))
    ok('No reward/session write occurs merely from landing on Launch', !session || !JSON.parse(session).completedSteps?.length)
    await ctx.close()
  }

  console.log('\n── CraftHub /crafthub ──')
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))
    // Network-level "Failed to load resource" 4xx/5xx messages (e.g.
    // /api/auth/me 500 with no backend process under `vite preview` static
    // hosting, or a favicon 404) reproduce identically on /smokecraft and
    // every other pre-existing route in this harness — a known environment
    // limitation, not a CraftHub-caused regression. Only real JS runtime
    // console errors are checked here.
    page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push(m.text()) })
    await page.goto(`${BASE}/crafthub`)
    await page.waitForTimeout(500)
    ok('/crafthub loads directly', page.url().includes('/crafthub'))
    ok('No JS runtime console errors on /crafthub', errors.length === 0)

    const bodyText = await page.locator('body').textContent()
    ok('No fabricated venue signal metrics ("Active Tables", "Staff Handoffs" counts) present', !/Active Tables|Staff Handoffs|Humidor.*°F/.test(bodyText))

    const smokecraftTile = page.locator('text=SmokeCraft 360').first()
    await smokecraftTile.click()
    await page.waitForTimeout(300)
    ok('SmokeCraft entry works from CraftHub', page.url().includes('/smokecraft'))
    await page.goBack()
    await page.waitForTimeout(300)

    const passportBtn = page.locator('text=360 Passport Connections').first()
    await passportBtn.click()
    await page.waitForTimeout(300)
    ok('Passport Connections works from CraftHub', page.url().includes('/passport'))
    await page.goBack()
    await page.waitForTimeout(300)

    const backBtn = page.locator('button:has-text("Back to NOVEE OS")')
    await backBtn.click()
    await page.waitForTimeout(300)
    ok('Back to NOVEE OS works', page.url() === `${BASE}/` || page.url().endsWith('/'))

    await page.goto(`${BASE}/crafthub`)
    await page.waitForTimeout(300)
    const broken = await page.locator('img').evaluateAll(imgs => imgs.filter(i => !i.complete || i.naturalWidth === 0).length)
    ok('No broken images on /crafthub', broken === 0)

    await page.screenshot({ path: `${PROOF_DIR}/crafthub-rebuilt-live.png`, fullPage: true })
    await ctx.close()
  }

  await browser.close()

  console.log('\n' + '─'.repeat(51))
  console.log(`Result: ${pass} passed, ${fail} failed`)
  if (fail > 0) process.exit(1)
})()
