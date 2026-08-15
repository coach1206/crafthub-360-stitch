#!/usr/bin/env node
import { chromium } from 'playwright'
import { readFileSync } from 'fs'

const BASE = (process.env.BASE_URL || process.env.CRAFTHUB_ACCEPTANCE_BASE_URL || 'http://127.0.0.1:5174').replace(/\/$/, '')
const manifest = JSON.parse(readFileSync('docs/smokecraft/SMOKECRAFT_CANONICAL_JOURNEY_MANIFEST.json', 'utf8'))

const OWNER_SCREENS = [
  ['/smokecraft/identity', '01-identity-hero-crop.jpg'],
  ['/smokecraft/seed-soil', '02-seed-soil-hero-crop.jpg'],
  ['/smokecraft/format', '03-format-hero.jpg'],
  ['/smokecraft/cut-toast-light', '04-cut-toast-light-hero.jpg'],
  ['/smokecraft/first-third', '05-first-third-hero-crop.jpg'],
  ['/smokecraft/second-third', '06-second-third-hero-crop.jpg'],
  ['/smokecraft/final-third', '07-final-third-hero-crop.jpg'],
  ['/smokecraft/scorecard', '08-scorecard-hero-crop.jpg'],
  ['/smokecraft/request-purchase', '09-request-purchase-hero-crop.jpg'],
  ['/smokecraft/pairing-recommendations', '10-pairing-recommendations-hero-crop.jpg'],
  ['/smokecraft/passport-stamp', '11-passport-stamp-hero-crop.jpg'],
  ['/smokecraft/connections', '12-connections-hero-crop.jpg'],
  ['/smokecraft/rewards', '13-rewards-hero-crop.jpg'],
  ['/smokecraft/second-humidor-match', '14-second-humidor-match-hero-crop.jpg'],
]

async function openRoute(page, route) {
  const response = await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 })
  if (!response || !response.ok()) throw new Error(`${route}: HTTP ${response?.status?.() ?? 'no response'}`)
  await page.locator('body').waitFor({ state: 'visible', timeout: 8000 })
  // Allow React route guards, lazy modules and image styles to settle without
  // requiring the network to become globally idle.
  await page.waitForTimeout(700)
  const finalPath = new URL(page.url()).pathname.replace(/\/$/, '') || '/'
  const expected = route.replace(/\/$/, '') || '/'
  if (finalPath !== expected) throw new Error(`${route}: redirected to ${finalPath}`)
  const bodyTextLength = await page.locator('body').innerText().then(v => v.trim().length).catch(() => 0)
  const visualSurfaceCount = await page.locator('img,button,input,select,textarea,[role="img"],canvas,svg').count()
  if (bodyTextLength === 0 && visualSurfaceCount === 0) throw new Error(`${route}: rendered empty body`)
  return { route, finalPath, bodyTextLength, visualSurfaceCount }
}

async function verifyOwnerAsset(page, route, fileName) {
  await openRoute(page, route)
  const evidence = await page.evaluate((name) => {
    const nodes = Array.from(document.querySelectorAll('*'))
    const matches = []
    for (const node of nodes) {
      const src = node.getAttribute?.('src') || ''
      const bg = getComputedStyle(node).backgroundImage || ''
      if (src.includes(name) || bg.includes(name)) matches.push({ tag: node.tagName, src, bg })
    }
    return matches
  }, fileName)
  if (evidence.length === 0) throw new Error(`${route}: approved owner asset ${fileName} not rendered`)
  return { route, fileName, matches: evidence.length }
}

const browser = await chromium.launch({ headless: true })
const context = await browser.newContext({ viewport: { width: 1180, height: 820 } })
await context.addInitScript(() => {
  sessionStorage.setItem('novee_demo_mode', '1')
  sessionStorage.setItem('demoMode', 'true')
  sessionStorage.setItem('novee_booted', '1')
})
const page = await context.newPage()
const routeResults = []
const ownerResults = []
let failed = false

try {
  for (const route of manifest.canonicalRouteOrder) {
    try {
      const result = await openRoute(page, route)
      routeResults.push({ ...result, status: 'PASS' })
      console.log(`PASS route ${route}`)
    } catch (error) {
      failed = true
      routeResults.push({ route, status: 'FAIL', error: error.message })
      console.error(`FAIL route ${route}: ${error.message}`)
    }
  }

  for (const [route, fileName] of OWNER_SCREENS) {
    try {
      const result = await verifyOwnerAsset(page, route, fileName)
      ownerResults.push({ ...result, status: 'PASS' })
      console.log(`PASS owner asset ${route} -> ${fileName}`)
    } catch (error) {
      failed = true
      ownerResults.push({ route, fileName, status: 'FAIL', error: error.message })
      console.error(`FAIL owner asset ${route}: ${error.message}`)
    }
  }
} finally {
  await browser.close()
}

const routePass = routeResults.filter(r => r.status === 'PASS').length
const ownerPass = ownerResults.filter(r => r.status === 'PASS').length
console.log(`Deployed sequence routes: ${routePass}/${routeResults.length} PASS`)
console.log(`Deployed owner assets: ${ownerPass}/${ownerResults.length} PASS`)
if (failed || routePass !== routeResults.length || ownerPass !== ownerResults.length) process.exit(1)
console.log('PASS deployed SmokeCraft chronological route + owner-asset browser proof')
