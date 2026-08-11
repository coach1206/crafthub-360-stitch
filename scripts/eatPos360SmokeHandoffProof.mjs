import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const baseUrl = process.env.PROOF_BASE_URL || 'http://127.0.0.1:26301'
const proofDir = path.resolve('docs/eat-pos360-handoff/browser-proof')

const routes = [
  { id: 'eat-command', route: '/eat', expect: 'E.A.T. SYSTEM' },
  { id: 'eat-operations', route: '/eat/operations', expect: 'E.A.T. Operations' },
  { id: 'pos3-home', route: '/pos3', expect: 'POS360' },
  { id: 'pos3-tables', route: '/pos3/tables', expect: 'Tables' },
  { id: 'pos3-checkout', route: '/pos3/checkout', expect: 'Checkout' },
]

async function seedManager(page) {
  await page.addInitScript(() => {
    localStorage.setItem('novee_admin_session', JSON.stringify({
      role: 'manager',
      userId: 'proof-manager',
      email: 'proof-manager@novee.local',
      displayName: 'Proof Manager',
      grantedAt: Date.now(),
    }))
    sessionStorage.removeItem('novee_demo_mode')
    sessionStorage.removeItem('demoMode')
  })
}

async function main() {
  await mkdir(proofDir, { recursive: true })
  const launchOptions = process.env.PLAYWRIGHT_CHROME_PATH
    ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH }
    : {}
  const browser = await chromium.launch(launchOptions)
  const page = await browser.newPage({ viewport: { width: 1180, height: 820 } })
  await seedManager(page)

  const checks = []
  for (const item of routes) {
    await page.goto(`${baseUrl}${item.route}`, { waitUntil: 'networkidle' })
    const body = await page.locator('body').innerText()
    const screenshot = path.join(proofDir, `${item.id}.png`)
    await page.screenshot({ path: screenshot, fullPage: true })
    checks.push({
      id: item.id,
      route: item.route,
      status: body.includes(item.expect) ? 'PASS' : 'FAIL',
      expectedText: item.expect,
      url: page.url(),
      screenshot,
    })
  }

  await page.addInitScript(() => {
    sessionStorage.setItem('sc_staff_handoff_resume', JSON.stringify({
      source: 'smokecraft',
      currentRoute: '/smokecraft/visit-complete',
      completedSteps: ['identity', 'venue-select', 'request-purchase'],
      journeyXP: 120,
      timestamp: Date.now(),
    }))
  })
  await page.goto(`${baseUrl}/staff/pin?target=pos360`, { waitUntil: 'networkidle' })
  const pinBody = await page.locator('body').innerText()
  const pinScreenshot = path.join(proofDir, 'staff-pin-bridge.png')
  await page.screenshot({ path: pinScreenshot, fullPage: true })
  checks.push({
    id: 'staff-pin-bridge',
    route: '/staff/pin?target=pos360',
    status: pinBody.includes('Staff Handoff') || pinBody.includes('Staff Access') || pinBody.includes('Open in POS 3') || pinBody.includes('OPEN IN POS 3') ? 'PASS' : 'FAIL',
    expectedText: 'Staff Handoff or Open in POS 3',
    url: page.url(),
    screenshot: pinScreenshot,
  })

  await page.goto(`${baseUrl}/pos3`, { waitUntil: 'networkidle' })
  const returnButton = page.getByRole('button', { name: 'Return to Guest' }).first()
  let returnStatus = 'FAIL'
  let returnUrl = page.url()
  if (await returnButton.count()) {
    await returnButton.click()
    await page.waitForLoadState('networkidle')
    returnUrl = page.url()
    returnStatus = returnUrl.includes('/smokecraft/visit-complete') ? 'PASS' : 'FAIL'
  }
  const returnScreenshot = path.join(proofDir, 'return-to-guest.png')
  await page.screenshot({ path: returnScreenshot, fullPage: true })
  checks.push({
    id: 'return-to-guest',
    route: '/pos3',
    status: returnStatus,
    expectedText: '/smokecraft/visit-complete',
    url: returnUrl,
    screenshot: returnScreenshot,
  })

  await browser.close()

  const result = {
    auditDate: '2026-08-11',
    baseUrl,
    viewport: { width: 1180, height: 820 },
    status: checks.every((c) => c.status === 'PASS') ? 'PASS' : 'FAIL',
    checks,
  }
  await writeFile(path.join(proofDir, 'browser-proof-results.json'), JSON.stringify(result, null, 2))
  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
