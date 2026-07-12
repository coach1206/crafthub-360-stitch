/**
 * SmokeCraft Connections E2E Tests
 * Route: /smokecraft/connections
 * 32 interaction checks
 */
import { chromium } from 'playwright'

const BASE  = 'http://localhost:4173'
const ROUTE = `${BASE}/smokecraft/connections`
const API   = 'http://localhost:3001'

const ACTION_IDS = [
  'share-passport', 'exchange-contact', 'follow-venue',
  'save-mentor', 'join-cigar-circle', 'join-leaderboard', 'qr-connect',
]

let pass = 0, fail = 0

function log(name, ok, detail = '') {
  console.log(`${ok ? '✅ PASS' : '❌ FAIL'} | ${name}${detail ? ' — ' + detail : ''}`)
  ok ? pass++ : fail++
}

async function setup(page, { clearLocal = true } = {}) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate((clear) => {
    sessionStorage.setItem('novee_demo_mode', '1')
    if (clear) localStorage.removeItem('sc_connections_v1')
  }, clearLocal)
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(700)
}

;(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const page    = await browser.newPage()

  // ── 1. Route loads ────────────────────────────────────────────────────────
  await setup(page)
  log('Route loads (200)', !page.url().includes('locked'))

  // ── 2. Background image rendered ──────────────────────────────────────────
  const img = page.locator('img[src*="connections"]').first()
  log('Background image present (connections-hero.jpg)', await img.count() > 0)

  // ── 3. Gradient mask overlay ──────────────────────────────────────────────
  const mask = page.locator('[aria-hidden="true"]').first()
  log('Gradient mask overlay (aria-hidden)', await mask.count() > 0)

  // ── 4. All 7 action cards rendered ───────────────────────────────────────
  let cardCount = 0
  for (const id of ACTION_IDS) {
    const card = page.locator(`[data-action-card="${id}"]`)
    if (await card.count() > 0) cardCount++
  }
  log('All 7 action cards rendered', cardCount === 7, `found ${cardCount}/7`)

  // ── 5. All actions start neutral (no pre-selected) ───────────────────────
  let anySelected = false
  for (const id of ACTION_IDS) {
    const toggle = page.locator(`[data-action-toggle="${id}"]`)
    if (await toggle.count() > 0) {
      const text = await toggle.innerText()
      if (text.trim() === 'Deselect') { anySelected = true; break }
    }
  }
  log('All actions start neutral (no pre-selected)', !anySelected)

  // ── 6. No fake names or avatars ──────────────────────────────────────────
  const body = await page.locator('body').innerText()
  const hasFake = /John\s+Doe|Jane\s+Doe|Guest\s+\d{4}|avatar\d/i.test(body)
  log('No fake guest names or avatars', !hasFake)

  // ── 7. No baked connection counts ────────────────────────────────────────
  const bakedPattern = /\b(127|243|512|1024)\s*(connections|followers|members)/i.test(body)
  log('No baked connection counts', !bakedPattern)

  // ── 8. Select "Follow This Venue" ────────────────────────────────────────
  const followToggle = page.locator('[data-action-toggle="follow-venue"]')
  if (await followToggle.count() > 0) {
    await followToggle.click()
    await page.waitForTimeout(300)
    const text = await followToggle.innerText()
    log('Select action changes button to Deselect', text.trim() === 'Deselect')
  } else {
    log('Select action changes button to Deselect', false, 'toggle not found')
  }

  // ── 9. Deselect removes selection ────────────────────────────────────────
  if (await followToggle.count() > 0) {
    await followToggle.click()
    await page.waitForTimeout(300)
    const text = await followToggle.innerText()
    log('Deselect restores Select state', text.trim() === 'Select')
  } else {
    log('Deselect restores Select state', false, 'toggle not found')
  }

  // ── 10. Multiple selections supported ────────────────────────────────────
  for (const id of ['follow-venue', 'join-cigar-circle', 'join-leaderboard']) {
    const t = page.locator(`[data-action-toggle="${id}"]`)
    if (await t.count() > 0) await t.click()
  }
  await page.waitForTimeout(300)
  const confirmBtn = page.locator('[data-action="confirm-connections"]')
  const confirmVisible = await confirmBtn.count() > 0 && await confirmBtn.isVisible()
  log('Multiple selections supported (confirm button appears)', confirmVisible)

  // ── 11. Confirm button shows count ───────────────────────────────────────
  if (await confirmBtn.count() > 0) {
    const confirmText = await confirmBtn.innerText()
    log('Confirm button shows selection count', /Confirm\s+\d+/i.test(confirmText), confirmText)
  } else {
    log('Confirm button shows selection count', false, 'not found')
  }

  // ── 12. Confirm fires POST to API ────────────────────────────────────────
  let postFired = false
  page.on('request', req => {
    if (req.url().includes('/api/smokecraft/connections/action') && req.method() === 'POST') postFired = true
  })
  if (await confirmBtn.count() > 0) {
    await confirmBtn.click()
    await page.waitForTimeout(1200)
  }
  log('Confirm fires POST /api/smokecraft/connections/action', postFired)

  // ── 13. Actions show success state after confirm ──────────────────────────
  await page.waitForTimeout(500)
  const followCard = page.locator('[data-action-card="follow-venue"]')
  const followText = await followCard.innerText().catch(() => '')
  log('Completed actions show Done state', followText.includes('Done') || followText.includes('Synced'))

  // ── 14. Completed summary section appears ────────────────────────────────
  const completedSection = page.locator('[data-section="completed-summary"]')
  log('Completed summary section appears after actions', await completedSection.count() > 0)

  // ── 15. Privacy note section present ─────────────────────────────────────
  const privacyNote = page.locator('[data-section="privacy-note"]')
  log('Privacy note section present', await privacyNote.count() > 0)

  // ── 16. Passport 360 sync section present ────────────────────────────────
  const p360 = page.locator('[data-section="passport360-sync"]')
  log('Passport 360 sync section present', await p360.count() > 0)

  // ── 17. Passport stamp sync status section present ────────────────────────
  const passportSync = page.locator('[data-section="passport-sync"]')
  log('Passport stamp sync status present', await passportSync.count() > 0)

  // ── 18. Contact exchange reveals consent gate ─────────────────────────────
  await setup(page)
  const contactToggle = page.locator('[data-action-toggle="exchange-contact"]')
  if (await contactToggle.count() > 0) {
    await contactToggle.click()
    await page.waitForTimeout(300)
    const consentTrigger = page.locator('[data-consent-toggle]')
    log('Contact exchange has consent toggle link when selected', await consentTrigger.count() > 0)
    if (await consentTrigger.count() > 0) {
      await consentTrigger.click()
      await page.waitForTimeout(300)
      const consentGate = page.locator('[data-section="consent-gate"]')
      log('Consent gate appears on click', await consentGate.count() > 0)
    } else {
      log('Consent gate appears on click', false, 'consent-toggle not found')
    }
  } else {
    log('Contact exchange has consent toggle link when selected', false, 'toggle not found')
    log('Consent gate appears on click', false, 'toggle not found')
  }

  // ── 19. QR panel appears on expand ────────────────────────────────────────
  await setup(page)
  const qrToggle = page.locator('[data-action-toggle="qr-connect"]')
  if (await qrToggle.count() > 0) {
    await qrToggle.click()
    await page.waitForTimeout(300)
    const qrExpand = page.locator('[data-qr-toggle]')
    if (await qrExpand.count() > 0) {
      await qrExpand.click()
      await page.waitForTimeout(300)
      const qrPanel = page.locator('[data-section="qr-panel"]')
      log('QR panel appears after expand', await qrPanel.count() > 0)
    } else {
      log('QR panel appears after expand', false, 'qr-toggle not found')
    }
  } else {
    log('QR panel appears after expand', false, 'qr-toggle not found')
  }

  // ── 20. QR camera denied shows fallback ───────────────────────────────────
  const startQrBtn = page.locator('[data-action="start-qr-scan"]')
  if (await startQrBtn.count() > 0) {
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: () => Promise.reject(Object.assign(new Error('denied'), { name: 'NotAllowedError' }))
        },
        configurable: true,
      })
    })
    await startQrBtn.click()
    await page.waitForTimeout(500)
    const qrText = await page.locator('[data-section="qr-panel"]').innerText().catch(() => '')
    log('Camera denied shows fallback state', qrText.toLowerCase().includes('denied') || qrText.toLowerCase().includes('access'))
  } else {
    log('Camera denied shows fallback state', false, 'QR scan button not found')
  }

  // ── 21. No invisible hotspots ─────────────────────────────────────────────
  await setup(page)
  const hotspots = await page.evaluate(() =>
    Array.from(document.querySelectorAll('a[href], button')).filter(el => {
      const s = window.getComputedStyle(el)
      return s.opacity === '0' || s.visibility === 'hidden'
    }).length
  )
  log('No invisible hotspots', hotspots === 0, `found ${hotspots}`)

  // ── 22. Nav menu button visible ───────────────────────────────────────────
  const navBtn = page.locator('button[aria-label*="Menu"], button[aria-label*="menu"]').first()
  log('Nav menu button visible', await navBtn.count() > 0)

  // ── 23. Functional without image ─────────────────────────────────────────
  await page.evaluate(() => document.querySelectorAll('img').forEach(i => i.style.display = 'none'))
  const noImgText = await page.locator('body').innerText()
  log('Functional without image', noImgText.length > 100)
  await page.evaluate(() => document.querySelectorAll('img').forEach(i => i.style.display = ''))

  // ── 24. localStorage persists selected state ──────────────────────────────
  // Do a clean load, select something, then check localStorage
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    localStorage.removeItem('sc_connections_v1')
  })
  await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(600)
  // exchange-contact is never blocked and not used in prior confirm step
  const freshToggle = page.locator('[data-action-toggle="exchange-contact"]')
  await page.waitForTimeout(600)  // allow server sync to complete
  if (await freshToggle.count() > 0) {
    await freshToggle.click()
    await page.waitForTimeout(400)
  }
  const stored = await page.evaluate(() => localStorage.getItem('sc_connections_v1'))
  log('localStorage persists connection state', stored !== null)

  // ── 25. API status endpoint returns structure ─────────────────────────────
  const statusResp = await fetch(`${API}/api/smokecraft/connections/status/e2e-test`)
    .then(r => r.json())
  log('API /status returns ok with actions array', statusResp.ok && Array.isArray(statusResp.actions))

  // ── 26. API action POST records successfully ──────────────────────────────
  const apiSid = `e2e-api-${Date.now()}`
  const actionResp = await fetch(`${API}/api/smokecraft/connections/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: apiSid, action: 'follow-venue', guestId: 'e2e-guest', payload: {} }),
  }).then(r => r.json())
  log('API /action POST records follow-venue', actionResp.ok && actionResp.recorded)

  // ── 27. API prevents duplicate action (409) ───────────────────────────────
  const dupResp = await fetch(`${API}/api/smokecraft/connections/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: apiSid, action: 'follow-venue', guestId: 'e2e-guest', payload: {} }),
  })
  log('API /action returns 409 on duplicate', dupResp.status === 409)

  // ── 28. API requires consent for exchange-contact (403) ───────────────────
  const noConsentResp = await fetch(`${API}/api/smokecraft/connections/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: `e2e-consent-${Date.now()}`, action: 'exchange-contact', payload: { consentGiven: false } }),
  })
  log('API /action returns 403 for contact without consent', noConsentResp.status === 403)

  // ── 29. API requires stampId for share-passport (422) ────────────────────
  const noStampResp = await fetch(`${API}/api/smokecraft/connections/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: `e2e-stamp-${Date.now()}`, action: 'share-passport', payload: {} }),
  })
  log('API /action returns 422 for share-passport without stampId', noStampResp.status === 422)

  // ── 30. API DELETE undoes an action ──────────────────────────────────────
  const delSid = `e2e-del-${Date.now()}`
  await fetch(`${API}/api/smokecraft/connections/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: delSid, action: 'join-cigar-circle', payload: {} }),
  })
  const delResp = await fetch(`${API}/api/smokecraft/connections/action`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId: delSid, action: 'join-cigar-circle' }),
  }).then(r => r.json())
  log('API DELETE removes action', delResp.ok && delResp.removed === true)

  // ── 31. Back → /smokecraft/passport-stamp ────────────────────────────────
  await setup(page)
  const backBtn = page.locator('button:has-text("Back")').first()
  if (await backBtn.count() > 0) {
    await backBtn.click()
    await page.waitForTimeout(600)
    log('Back navigates to /smokecraft/passport-stamp', page.url().includes('passport-stamp'))
    await page.goto(ROUTE, { waitUntil: 'domcontentloaded' })
  } else {
    log('Back navigates to /smokecraft/passport-stamp', false, 'not found')
  }

  // ── 32. Continue → /smokecraft/management-sync ───────────────────────────
  await setup(page)
  const continueBtn = page.locator('button:has-text("Continue")').first()
  if (await continueBtn.count() > 0) {
    await continueBtn.click()
    await page.waitForTimeout(800)
    log('Continue navigates to /smokecraft/management-sync', page.url().includes('management-sync'))
  } else {
    log('Continue navigates to /smokecraft/management-sync', false, 'not found')
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log(`\n──────────────────────────────────────────`)
  console.log(`SmokeCraft Connections E2E: ${pass} PASS / ${fail} FAIL`)
  console.log(`──────────────────────────────────────────`)

  await browser.close()
  process.exit(fail > 0 ? 1 : 0)
})()
