#!/usr/bin/env node
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'fs'
import { genericAdvance } from './proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = (process.env.BASE_URL || process.env.CRAFTHUB_ACCEPTANCE_BASE_URL || 'http://localhost:3002').replace(/\/$/, '')
const OUT = 'public/proof/smokecraft-deployed-full-journey'
mkdirSync(OUT, { recursive: true })

const trace = []
function record(action, page, extra = {}) {
  const row = { index: trace.length + 1, at: new Date().toISOString(), action, url: page?.url?.() || null, ...extra }
  trace.push(row)
  console.log(`[${row.index}] ${action}${row.url ? ` -> ${row.url}` : ''}`)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true })
  const page = await context.newPage()
  const visited = new Set()
  let reachedSessionComplete = false

  try {
    record('Start fresh deployed journey', page, { baseUrl: BASE })
    await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'networkidle', timeout: 30000 })
    visited.add(new URL(page.url()).pathname)

    const exploreGuest = page.getByText('Explore as Guest', { exact: false }).first()
    if (await exploreGuest.count() === 0) throw new Error('Explore as Guest control not found')
    await exploreGuest.click()
    await page.waitForURL('**/smokecraft/identity', { timeout: 15000 })
    record('Entered Identity from real guest enrollment', page)

    const fullName = page.locator('input[aria-label="Full Name"]')
    if (await fullName.count()) await fullName.fill('CraftHub Production Journey Proof')
    const experience = page.locator('select[aria-label="Cigar Experience Level"]')
    if (await experience.count()) await experience.selectOption({ index: 1 })
    const identityContinue = page.getByRole('button', { name: /Continue to Venue Selection/i }).first()
    if (await identityContinue.count() === 0) throw new Error('Identity Continue control not found')
    await identityContinue.click()
    await page.waitForURL('**/smokecraft/venue-select', { timeout: 15000 })
    record('Identity completed and persisted', page)

    const alphaLounge = page.getByText('Alpha Lounge (Seed)', { exact: false }).first()
    if (await alphaLounge.count()) {
      await alphaLounge.click()
    } else {
      const withoutVenue = page.getByText('Continue without venue', { exact: false }).first()
      if (await withoutVenue.count()) await withoutVenue.click()
    }
    const venueContinue = page.getByText('Continue to Welcome', { exact: false }).first()
    if (await venueContinue.count() === 0) throw new Error('Venue Continue control not found')
    await venueContinue.click()
    await page.waitForURL('**/smokecraft/welcome', { timeout: 15000 })
    record('Venue step completed', page)

    const begin = page.getByText('Begin Experience', { exact: false }).first()
    if (await begin.count() === 0) throw new Error('Welcome Begin Experience control not found')
    await begin.click()
    await page.waitForTimeout(1200)
    record('Welcome completed; chronological journey started', page)

    let stagnantCount = 0
    const MAX_STEPS = 48
    for (let i = 0; i < MAX_STEPS; i++) {
      const beforePath = new URL(page.url()).pathname
      visited.add(beforePath)

      if (beforePath === '/smokecraft/session-complete') {
        reachedSessionComplete = true
        record('Reached Session Complete before advance', page)
        break
      }

      const result = await genericAdvance(page, {
        screenshotName: `${String(i + 1).padStart(2, '0')}-${beforePath.replace(/\W+/g, '-').replace(/^-|-$/g, '')}`,
        label: beforePath,
      })
      const afterPath = new URL(page.url()).pathname
      visited.add(afterPath)
      record(`Real-click advance ${beforePath}`, page, { beforePath, afterPath, advanced: result.advanced, clickedPrimary: result.clickedPrimary })

      if (afterPath === '/smokecraft/session-complete') {
        reachedSessionComplete = true
        record('Reached Session Complete / S27', page)
        break
      }

      if (!result.advanced) {
        stagnantCount++
        if (stagnantCount >= 2) throw new Error(`Journey stalled on ${beforePath} after two real-click attempts`)
      } else {
        stagnantCount = 0
      }
    }

    if (!reachedSessionComplete) {
      throw new Error(`Full journey did not reach /smokecraft/session-complete. Last path=${new URL(page.url()).pathname}; unique routes=${visited.size}`)
    }

    if (visited.size < 20) {
      throw new Error(`Journey reached completion with insufficient route coverage (${visited.size} unique routes)`)
    }

    record('PASS full deployed real-browser chronological journey', page, { uniqueRoutes: visited.size })
  } finally {
    writeFileSync(`${OUT}/route-trace.json`, JSON.stringify({ baseUrl: BASE, reachedSessionComplete, uniqueRoutes: [...visited], trace }, null, 2))
    await page.screenshot({ path: `${OUT}/final.png`, fullPage: true }).catch(() => {})
    await browser.close()
  }
}

main().catch(error => {
  console.error(`DEPLOYED FULL JOURNEY FAIL: ${error.stack || error.message}`)
  process.exit(1)
})
