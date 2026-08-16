import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5174'
const OUT_DIR = path.resolve('docs/visual-proof/smokecraft-launch-ux')

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

function pathOf(page) {
  return new URL(page.url()).pathname
}

function scrollStateScript() {
  return Array.from(document.querySelectorAll('body, body *'))
    .map((node, index) => ({
      index,
      top: node.scrollTop,
      max: node.scrollHeight - node.clientHeight,
      tag: node.tagName,
      role: node.getAttribute?.('role') || '',
    }))
    .filter(item => item.max > 20)
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

async function clickButton(page, name) {
  const matches = page.getByRole('button', { name })
  const textMatches = matches.filter({ hasText: /\S/ })
  if (await textMatches.count()) {
    await textMatches.first().click({ timeout: 12000 })
    return
  }
  await matches.first().click({ timeout: 12000 })
}

async function screenshot(page, name, locator = null) {
  const file = path.join(OUT_DIR, `${name}.png`)
  if (locator) await locator.screenshot({ path: file })
  else await page.screenshot({ path: file, fullPage: true })
  return file
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1180, height: 820 } })
  await seedApi(context)
  const page = await context.newPage()

  try {
    await page.goto(`${BASE_URL}/`)
    await page.evaluate(() => {
      localStorage.removeItem('novee_guest_session')
      localStorage.removeItem('sc_journey_v1')
      sessionStorage.clear()
    })
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForURL(url => url.pathname === '/smokecraft/welcome', { timeout: 12000 })
    const launchPath = pathOf(page)
    const launchProof = await screenshot(page, '01-launch-first-screen')

    await clickButton(page, /continue to identity setup/i)
    await page.waitForURL(url => url.pathname === '/smokecraft/identity', { timeout: 12000 })
    const identityProof = await screenshot(page, '02-identity')

    const dob = page.getByTestId('identity-birthDate')
    const dobType = await dob.evaluate(node => node.getAttribute('type'))
    if (dobType !== 'text') throw new Error(`Birth date input must be text, got ${dobType}`)
    await dob.fill('01011990')
    await dob.blur()
    const dobValue = await dob.inputValue()
    if (dobValue !== '01/01/1990') throw new Error(`Birth date masking failed: ${dobValue}`)
    const dobProof = await screenshot(page, '03-date-of-birth-control', dob)

    const sidebar = page.getByRole('navigation', { name: /smokecraft journey shortcuts/i })
    const sidebarText = await sidebar.innerText()
    for (const expected of ['Identity', 'Venue Selection', 'Golden Box', 'Mentor Selection']) {
      if (!sidebarText.includes(expected)) throw new Error(`Identity sidebar missing ${expected}`)
    }
    for (const forbidden of ['Humidor Match', 'Pairing Lab', 'Request / Purchase', 'Cut, Toast & Light']) {
      if (sidebarText.includes(forbidden)) throw new Error(`Identity sidebar shows later journey item: ${forbidden}`)
    }
    const sidebarProof = await screenshot(page, '04-identity-sidebar', sidebar)

    await page.getByTestId('identity-fullName').fill('Owner Launch Guest')
    await page.getByTestId('identity-experienceLevel').selectOption('enthusiast')
    await clickButton(page, /continue to venue selection/i)
    await page.waitForURL(url => url.pathname === '/smokecraft/venue-select', { timeout: 12000 })

    await page.getByRole('button', { name: /select grand lounge/i }).click()
    await clickButton(page, /continue to golden box rules/i)
    await page.waitForURL(url => url.pathname === '/smokecraft/golden-box', { timeout: 12000 })

    await page.mouse.move(590, 410)
    const beforeScroll = await page.evaluate(scrollStateScript)
    await page.mouse.wheel(0, 900)
    await page.waitForTimeout(200)
    const afterScroll = await page.evaluate(scrollStateScript)
    const scrolled = afterScroll.some(after => {
      const before = beforeScroll.find(item => item.index === after.index)
      return before && after.top > before.top
    })
    if (!scrolled) throw new Error(`Golden Box did not scroll normally: ${JSON.stringify({ beforeScroll, afterScroll })}`)
    const goldenProof = await screenshot(page, '05-golden-box')

    await page.locator('input[type="checkbox"]').check()
    await clickButton(page, /continue to mentor selection/i)
    await page.waitForURL(url => url.pathname === '/smokecraft/mentor-selection', { timeout: 12000 })
    const mentorProof = await screenshot(page, '06-mentor-transition')

    const result = {
      status: 'PASS',
      baseUrl: BASE_URL,
      launchPath,
      dobType,
      dobValue,
      goldenBoxScrolled: scrolled,
      finalPath: pathOf(page),
      screenshots: {
        launch: launchProof,
        identity: identityProof,
        dob: dobProof,
        identitySidebar: sidebarProof,
        goldenBox: goldenProof,
        mentorTransition: mentorProof,
      },
    }
    await writeFile(path.join(OUT_DIR, 'functional-results.json'), JSON.stringify(result, null, 2))
    console.log(JSON.stringify(result, null, 2))
  } finally {
    await context.close()
    await browser.close()
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
