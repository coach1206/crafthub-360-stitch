import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5174'
const OUT_DIR = path.resolve('docs/visual-proof/smokecraft-onboarding-sequence')

const venueResponse = {
  venues: [
    {
      id: 'grand-lounge',
      name: 'Grand Lounge',
      address: '120 Madison Ave',
      city: 'New York',
      state: 'NY',
      type: 'Cigar Lounge',
      capacity: 80,
    },
    {
      id: 'bottle-house',
      name: 'The Bottle House',
      address: '44 Hudson St',
      city: 'New York',
      state: 'NY',
      type: 'Whiskey Bar',
      capacity: 54,
    },
  ],
}

function parseSession(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('novee_guest_session') || '{}'))
}

function pathOf(page) {
  return new URL(page.url()).pathname
}

async function waitPath(page, expected) {
  await page.waitForURL(url => url.pathname === expected, { timeout: 12000 })
  return pathOf(page)
}

async function clickButton(page, name) {
  const matches = page.getByRole('button', { name })
  const textMatches = matches.filter({ hasText: /\S/ })
  if (await textMatches.count()) {
    await textMatches.first().click({ timeout: 12000 })
    return
  }
  await matches.first().click({ timeout: 12000 })
}

async function seedApi(context) {
  await context.route('**/api/smokecraft/venue-commerce/venues', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(venueResponse),
    })
  )
  await context.route('**/api/ticket-tapper/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ specials: [] }),
    })
  )
}

async function screenshot(page, name) {
  const file = path.join(OUT_DIR, `${name}.png`)
  await page.screenshot({ path: file, fullPage: true })
  return file
}

async function runForwardAndBack(browser) {
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 } })
  await seedApi(context)
  const page = await context.newPage()
  const proof = []

  await page.goto(`${BASE_URL}/smokecraft`)
  await page.evaluate(() => {
    localStorage.removeItem('novee_guest_session')
    localStorage.removeItem('sc_journey_v1')
    sessionStorage.clear()
  })
  await page.reload({ waitUntil: 'domcontentloaded' })
  proof.push({ step: 'landing', path: pathOf(page) })

  await clickButton(page, /start smokecraft journey/i)
  proof.push({ step: 'start_to_welcome', path: await waitPath(page, '/smokecraft/welcome') })
  const beforeWelcome = await parseSession(page)
  if ((beforeWelcome.completedSteps || []).includes('entry')) throw new Error('Welcome awarded completion on page visit.')
  proof.push({ step: 'welcome_visit_no_completion', completedSteps: beforeWelcome.completedSteps || [], xp: beforeWelcome.xp || 0 })
  await screenshot(page, '01-welcome')

  await clickButton(page, /continue to identity setup/i)
  proof.push({ step: 'welcome_to_identity', path: await waitPath(page, '/smokecraft/identity') })
  const afterWelcome = await parseSession(page)
  if (!(afterWelcome.completedSteps || []).includes('entry')) throw new Error('Welcome Continue did not complete entry.')

  await page.getByTestId('identity-fullName').fill('Owner Acceptance Guest')
  await page.getByTestId('identity-experienceLevel').selectOption('enthusiast')
  await clickButton(page, /continue to venue selection/i)
  proof.push({ step: 'identity_to_venue', path: await waitPath(page, '/smokecraft/venue-select') })
  await screenshot(page, '02-venue-select')

  await page.getByRole('button', { name: /select grand lounge/i }).click()
  await clickButton(page, /continue to golden box rules/i)
  proof.push({ step: 'venue_to_golden_box', path: await waitPath(page, '/smokecraft/golden-box') })

  await page.locator('input[type="checkbox"]').check()
  await clickButton(page, /mentor selection/i)
  proof.push({ step: 'golden_box_to_mentor', path: await waitPath(page, '/smokecraft/mentor-selection') })

  await page.locator('[role="button"][aria-label*="—"]').first().click()
  await clickButton(page, /continue to session 1/i)
  proof.push({ step: 'mentor_to_session_1', path: await waitPath(page, '/smokecraft/humidor-match') })
  await screenshot(page, '03-session-1')

  await clickButton(page, /back/i)
  proof.push({ step: 'back_session_1_to_mentor', path: await waitPath(page, '/smokecraft/mentor-selection') })
  await clickButton(page, /back/i)
  proof.push({ step: 'back_mentor_to_golden_box', path: await waitPath(page, '/smokecraft/golden-box') })
  await clickButton(page, /back/i)
  proof.push({ step: 'back_golden_box_to_venue', path: await waitPath(page, '/smokecraft/venue-select') })
  await clickButton(page, /back/i)
  proof.push({ step: 'back_venue_to_identity', path: await waitPath(page, '/smokecraft/identity') })
  await clickButton(page, /back/i)
  proof.push({ step: 'back_identity_to_welcome', path: await waitPath(page, '/smokecraft/welcome') })

  await context.close()
  return proof
}

async function runBypassChecks(browser) {
  const attempted = [
    '/smokecraft/identity',
    '/smokecraft/venue-select',
    '/smokecraft/golden-box',
    '/smokecraft/mentor-selection',
    '/smokecraft/humidor-match',
  ]
  const results = []
  for (const route of attempted) {
    const context = await browser.newContext({ viewport: { width: 1180, height: 820 } })
    await seedApi(context)
    const page = await context.newPage()
    await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForURL(url => url.pathname === '/smokecraft/welcome', { timeout: 12000 })
    results.push({ attempted: route, redirectedTo: pathOf(page), pass: pathOf(page) === '/smokecraft/welcome' })
    await context.close()
  }
  return results
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    const forwardBack = await runForwardAndBack(browser)
    const bypass = await runBypassChecks(browser)
    const failedBypass = bypass.filter(r => !r.pass)
    const result = {
      status: failedBypass.length === 0 ? 'PASS' : 'FAIL',
      baseUrl: BASE_URL,
      forwardBack,
      bypass,
      screenshots: [
        path.join(OUT_DIR, '01-welcome.png'),
        path.join(OUT_DIR, '02-venue-select.png'),
        path.join(OUT_DIR, '03-session-1.png'),
      ],
    }
    await writeFile(path.join(OUT_DIR, 'functional-results.json'), JSON.stringify(result, null, 2))
    if (result.status !== 'PASS') throw new Error(`Bypass failures: ${failedBypass.map(r => r.attempted).join(', ')}`)
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await browser.close()
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
