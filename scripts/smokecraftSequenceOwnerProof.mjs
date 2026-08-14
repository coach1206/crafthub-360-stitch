#!/usr/bin/env node
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs'
import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'docs', 'visual-proof', 'smokecraft-sequence-final')
const SCREENSHOT_DIR = path.join(OUT_DIR, 'screenshots')
const VIEWPORT = { width: 1180, height: 820 }
const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5174'

const OWNER_SCREENS = [
  { n: 1, screen: 'Identity', route: '/smokecraft/identity', component: 'Identity.jsx', assetKey: 'ownerIdentityHero', asset: '/assets/smokecraft/owner-rebuild/01-identity-hero-crop.jpg' },
  { n: 2, screen: 'Seed & Soil', route: '/smokecraft/seed-soil', component: 'SeedSoil.jsx', assetKey: 'ownerSeedSoilHero', asset: '/assets/smokecraft/owner-rebuild/02-seed-soil-hero-crop.jpg' },
  { n: 3, screen: 'Format', route: '/smokecraft/format', component: 'Format.jsx', assetKey: 'ownerFormatHero', asset: '/assets/smokecraft/owner-rebuild/03-format-hero.jpg' },
  { n: 4, screen: 'Cut / Toast / Light', route: '/smokecraft/cut-toast-light', component: 'CutToastLight.jsx', assetKey: 'ownerCutToastLightHero', asset: '/assets/smokecraft/owner-rebuild/04-cut-toast-light-hero.jpg' },
  { n: 5, screen: 'First Third', route: '/smokecraft/first-third', component: 'FirstThird.jsx', assetKey: 'ownerFirstThirdHero', asset: '/assets/smokecraft/owner-rebuild/05-first-third-hero-crop.jpg' },
  { n: 6, screen: 'Second Third', route: '/smokecraft/second-third', component: 'SecondThird.jsx', assetKey: 'ownerSecondThirdHero', asset: '/assets/smokecraft/owner-rebuild/06-second-third-hero-crop.jpg' },
  { n: 7, screen: 'Final Third', route: '/smokecraft/final-third', component: 'FinalThird.jsx', assetKey: 'ownerFinalThirdHero', asset: '/assets/smokecraft/owner-rebuild/07-final-third-hero-crop.jpg' },
  { n: 8, screen: 'Scorecard', route: '/smokecraft/scorecard', component: 'Scorecard.jsx', assetKey: 'ownerScorecardHero', asset: '/assets/smokecraft/owner-rebuild/08-scorecard-hero-crop.jpg' },
  { n: 9, screen: 'Request / Purchase', route: '/smokecraft/request-purchase', component: 'RequestPurchase.jsx', assetKey: 'ownerRequestPurchaseHero', asset: '/assets/smokecraft/owner-rebuild/09-request-purchase-hero-crop.jpg' },
  { n: 10, screen: 'Pairing Recommendations', route: '/smokecraft/pairing-recommendations', component: 'PairingRecommendations.jsx', assetKey: 'ownerPairingRecommendationsHero', asset: '/assets/smokecraft/owner-rebuild/10-pairing-recommendations-hero-crop.jpg' },
  { n: 11, screen: 'Passport Stamp', route: '/smokecraft/passport-stamp', component: 'PassportStamp.jsx', assetKey: 'ownerPassportStampHero', asset: '/assets/smokecraft/owner-rebuild/11-passport-stamp-hero-crop.jpg' },
  { n: 12, screen: 'Connections', route: '/smokecraft/connections', component: 'Connections.jsx', assetKey: 'ownerConnectionsHero', asset: '/assets/smokecraft/owner-rebuild/12-connections-hero-crop.jpg' },
  { n: 13, screen: 'Rewards', route: '/smokecraft/rewards', component: 'Rewards.jsx', assetKey: 'ownerRewardsHero', asset: '/assets/smokecraft/owner-rebuild/13-rewards-hero-crop.jpg' },
  { n: 14, screen: 'Second Humidor Match', route: '/smokecraft/second-humidor-match', component: 'SecondHumidorMatch.jsx', assetKey: 'ownerSecondHumidorMatchHero', asset: '/assets/smokecraft/owner-rebuild/14-second-humidor-match-hero-crop.jpg' },
]

const COMPONENT_BY_ROUTE = new Map([
  ['/smokecraft', 'SmokeCraft.jsx'],
  ['/smokecraft/enroll', 'Enroll.jsx'],
  ['/smokecraft/identity', 'Identity.jsx'],
  ['/smokecraft/venue-select', 'VenueSelect.jsx'],
  ['/smokecraft/welcome', 'WelcomeExperience.jsx'],
  ['/smokecraft/humidor-match', 'HumidorMatch.jsx'],
  ['/smokecraft/meet-your-cigar', 'MeetYourCigar.jsx'],
  ['/smokecraft/terroir', 'Terroir.jsx'],
  ['/smokecraft/format', 'Format.jsx'],
  ['/smokecraft/cut-toast-light', 'CutToastLight.jsx'],
  ['/smokecraft/lighting-tutorial', 'LightingTutorial.jsx'],
  ['/smokecraft/first-third', 'FirstThird.jsx'],
  ['/smokecraft/flavor-memory', 'FlavorMemory.jsx'],
  ['/smokecraft/pairing-lab', 'PairingLab.jsx'],
  ['/smokecraft/second-third', 'SecondThird.jsx'],
  ['/smokecraft/mentor-commentary', 'MentorCommentary.jsx'],
  ['/smokecraft/knowledge-drop', 'KnowledgeDrop.jsx'],
  ['/smokecraft/final-third', 'FinalThird.jsx'],
  ['/smokecraft/scorecard', 'Scorecard.jsx'],
  ['/smokecraft/ai-summary', 'AISummary.jsx'],
  ['/smokecraft/pairing-recommendations', 'PairingRecommendations.jsx'],
  ['/smokecraft/passport-stamp', 'PassportStamp.jsx'],
  ['/smokecraft/final-review', 'FinalReview.jsx'],
  ['/smokecraft/rewards', 'Rewards.jsx'],
  ['/smokecraft/session-complete', 'SessionComplete.jsx'],
])

function rel(file) {
  return path.relative(ROOT, file)
}

function gitSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim()
  } catch {
    return 'unknown'
  }
}

function fileSlug(n, label) {
  return `${String(n).padStart(2, '0')}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}.png`
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function readJson(relPath) {
  return JSON.parse(readFileSync(path.join(ROOT, relPath), 'utf8'))
}

function buildSequenceMap(manifest) {
  const routes = manifest.canonicalRouteOrder
  return routes.map((route, index) => {
    const owner = OWNER_SCREENS.find(screen => screen.route === route)
    const spine = manifest.spine.find(step => step.route === route && !step.mergedInto)
    const entry = manifest.entryLayer.find(step => step.route === route)
    return {
      sequence_number: index + 1,
      stage: entry?.label || spine?.label || owner?.screen || route,
      route,
      component: COMPONENT_BY_ROUTE.get(route) || null,
      next_route: routes[index + 1] || null,
      previous_route: routes[index - 1] || null,
      approved_image: owner ? `public${owner.asset}` : null,
      actual_currently_wired: owner ? owner.assetKey : null,
      status: COMPONENT_BY_ROUTE.has(route) ? 'PASS' : 'FAIL',
    }
  })
}

async function main() {
  mkdirSync(SCREENSHOT_DIR, { recursive: true })
  const manifest = readJson('docs/smokecraft/SMOKECRAFT_CANONICAL_JOURNEY_MANIFEST.json')
  const sequenceMap = buildSequenceMap(manifest)
  const commit = gitSha()

  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport: VIEWPORT })
  await context.addInitScript(() => {
    sessionStorage.setItem('novee_demo_mode', '1')
    sessionStorage.setItem('demoMode', 'true')
    sessionStorage.setItem('novee_booted', '1')
  })
  const page = await context.newPage()

  const routeResults = []
  for (const item of sequenceMap) {
    const url = `${BASE_URL}${item.route}`
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(300)
      const title = await page.locator('h1').first().textContent({ timeout: 3000 }).catch(() => null)
      routeResults.push({
        sequence_number: item.sequence_number,
        route: item.route,
        expected_component: item.component,
        final_url: new URL(page.url()).pathname,
        route_match: new URL(page.url()).pathname === item.route,
        dom_status: await page.locator('body').isVisible().catch(() => false) ? 'PASS' : 'FAIL',
        first_heading: title,
      })
    } catch (error) {
      routeResults.push({
        sequence_number: item.sequence_number,
        route: item.route,
        expected_component: item.component,
        final_url: page.url(),
        route_match: false,
        dom_status: 'FAIL',
        error: error.message,
      })
    }
  }

  const matrix = []
  for (const owner of OWNER_SCREENS) {
    const screenshotName = fileSlug(owner.n, owner.screen)
    const screenshotPath = path.join(SCREENSHOT_DIR, screenshotName)
    let result
    try {
      await page.goto(`${BASE_URL}${owner.route}`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(600)
      await page.screenshot({ path: screenshotPath, fullPage: false })
      result = await page.evaluate(({ expectedAssetKey, expectedAsset }) => {
        const bodyVisible = !!document.body && getComputedStyle(document.body).visibility !== 'hidden'
        const ownerLayers = Array.from(document.querySelectorAll('[role="img"][aria-label]'))
        const backgroundImages = ownerLayers.map(el => getComputedStyle(el).backgroundImage)
        const hiddenImages = Array.from(document.querySelectorAll('img[aria-hidden="true"]')).map(img => img.getAttribute('src') || '')
        const renderedImage = [...backgroundImages, ...hiddenImages].find(value => value.includes(expectedAsset.split('/').pop())) || null
        return {
          finalPath: window.location.pathname,
          bodyVisible,
          dataAssetKey: document.querySelector('[data-smokecraft-asset-key]')?.getAttribute('data-smokecraft-asset-key') || null,
          renderedImage,
          imageMatch: Boolean(renderedImage && renderedImage.includes(expectedAsset.split('/').pop())),
          assetKeyMatch: document.body.innerHTML.includes(`assetKey="${expectedAssetKey}"`) || Boolean(renderedImage && renderedImage.includes(expectedAsset.split('/').pop())),
        }
      }, { expectedAssetKey: owner.assetKey, expectedAsset: owner.asset })
      matrix.push({
        sequence_number: owner.n,
        screen_name: owner.screen,
        canonical_route: owner.route,
        component: owner.component,
        approved_source_image: `public${owner.asset}`,
        actual_rendered_image: result.renderedImage,
        image_match: result.imageMatch,
        route_match: result.finalPath === owner.route,
        live_dom_status: result.bodyVisible ? 'PASS' : 'FAIL',
        screenshot_path: rel(screenshotPath),
      })
    } catch (error) {
      matrix.push({
        sequence_number: owner.n,
        screen_name: owner.screen,
        canonical_route: owner.route,
        component: owner.component,
        approved_source_image: `public${owner.asset}`,
        actual_rendered_image: null,
        image_match: false,
        route_match: false,
        live_dom_status: 'FAIL',
        screenshot_path: rel(screenshotPath),
        error: error.message,
      })
    }
  }

  await browser.close()

  const thumbWidth = 360
  const thumbHeight = 250
  const labelHeight = 38
  const cols = 2
  const rows = Math.ceil(OWNER_SCREENS.length / cols)
  const composites = []
  for (const row of matrix) {
    const input = path.join(ROOT, row.screenshot_path)
    if (!existsSync(input)) continue
    const buffer = await sharp(input)
      .resize(thumbWidth, thumbHeight, { fit: 'cover', position: 'top' })
      .extend({
        top: labelHeight,
        background: '#080a0f',
      })
      .composite([{
        input: Buffer.from(`<svg width="${thumbWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#080a0f"/><text x="14" y="25" fill="#e9c176" font-family="Arial" font-size="17">${escapeXml(`${String(row.sequence_number).padStart(2, '0')} ${row.screen_name}`)}</text></svg>`),
        top: 0,
        left: 0,
      }])
      .png()
      .toBuffer()
    composites.push({
      input: buffer,
      left: ((row.sequence_number - 1) % cols) * thumbWidth,
      top: Math.floor((row.sequence_number - 1) / cols) * (thumbHeight + labelHeight),
    })
  }
  const contactSheetPath = path.join(OUT_DIR, '04-chronological-contact-sheet.png')
  await sharp({
    create: {
      width: cols * thumbWidth,
      height: rows * (thumbHeight + labelHeight),
      channels: 4,
      background: '#05070a',
    },
  }).composite(composites).png().toFile(contactSheetPath)

  const functional = {
    generated_at: new Date().toISOString(),
    commit,
    base_url: BASE_URL,
    viewport: VIEWPORT,
    canonical_route_results: routeResults,
    owner_image_result: {
      total: matrix.length,
      passed: matrix.filter(row => row.image_match && row.route_match && row.live_dom_status === 'PASS').length,
      failed: matrix.filter(row => !(row.image_match && row.route_match && row.live_dom_status === 'PASS')).length,
    },
  }

  writeFileSync(path.join(OUT_DIR, '01-sequence-map.json'), JSON.stringify(sequenceMap, null, 2))
  writeFileSync(path.join(OUT_DIR, '02-image-transfer-matrix.json'), JSON.stringify(matrix, null, 2))
  writeFileSync(path.join(OUT_DIR, '03-functional-route-results.json'), JSON.stringify(functional, null, 2))

  const routeFailures = routeResults.filter(row => !row.route_match || row.dom_status !== 'PASS')
  const imageFailures = matrix.filter(row => !(row.image_match && row.route_match && row.live_dom_status === 'PASS'))
  console.log(`Sequence routes: ${routeResults.length - routeFailures.length}/${routeResults.length} PASS`)
  console.log(`Owner images: ${matrix.length - imageFailures.length}/${matrix.length} PASS`)
  console.log(`Proof directory: ${rel(OUT_DIR)}`)
  if (routeFailures.length || imageFailures.length) process.exit(1)
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
