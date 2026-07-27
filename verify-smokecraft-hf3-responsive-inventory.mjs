#!/usr/bin/env node
// Holistic Fix 3 — system-wide responsive inventory across all 108 routes
// at 5 viewports: handheld portrait, 10" tablet landscape, 12" tablet
// landscape, 15" display, desktop. Records real, measured layout facts
// (not guesses) for every route: scrollability, horizontal overflow,
// image orientation/size (for image-shell screens), bottom-nav clearance,
// dead-space ratio, and a representative font-size sample.
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const BASE = process.env.SC_UI || 'http://localhost:5050'
const OUT_DIR = 'public/proof/smokecraft-holistic-fix-3'
mkdirSync(OUT_DIR, { recursive: true })
mkdirSync(`${OUT_DIR}/screenshots`, { recursive: true })

const routes = JSON.parse(readFileSync('docs/smokecraft/smokecraft-routes-raw.json', 'utf8'))

const VIEWPORTS = [
  { name: 'handheld-portrait', width: 390, height: 844 },
  { name: 'tablet-10in-landscape', width: 1280, height: 800 },
  { name: 'tablet-12in-landscape', width: 1366, height: 1024 },
  { name: '15in-display', width: 1440, height: 900 },
  { name: 'desktop', width: 1920, height: 1080 },
]

function toUrl(fullPath) {
  if (fullPath === '(smokecraft index)') return '/smokecraft'
  const withPlaceholders = fullPath.replace(/:([A-Za-z]+)/g, 'placeholder-$1')
  return `/smokecraft/${withPlaceholders}`
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] })
const ctx = await browser.newContext()
const page = await ctx.newPage()

await page.addInitScript(() => {
  const now = Date.now()
  localStorage.setItem('novee_guest_session', JSON.stringify({
    sessionId: 's_responsive_audit', createdAt: now, updatedAt: now, __version: 4,
    profile: { firstName: 'Audit', lastName: 'Tester' },
    completedSteps: ['enroll', 'identity', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format',
      'cut-toast-light', 'lighting-tutorial', 'first-third', 'flavor-memory', 'pairing-lab', 'second-third',
      'mentor-commentary', 'knowledge-drop', 'final-third', 'scorecard', 'passport-stamp', 'final-review',
      'session-complete', 'golden-box', 'mentor', 'wrapper-strength', 'seed-soil', 'request-purchase',
      'smokecraft-challenge', 'second-humidor-match', 'mini-tasting', 'connections', 'management-sync'],
    xp: 5000, rank: 'Master', badges: [], smokecraftStamps: [], mentors: [], favorites: [], pendingOrders: [],
    currentSmokecraftStep: null, latestStampId: null, goldenBoxProgress: null,
    skillScore: 0, challengeScore: 0, loyaltyPoints: 0, lifetimeLoyaltyPoints: 0, redeemablePoints: 0,
    passportStampCount: 0, purchaseCount: 0, houseCigarPurchases: 0, pairingPurchases: 0,
    eventParticipationCount: 0, referralCount: 0, loyaltyLedger: [], usedTransactionIds: [],
    guestId: 'g_responsive_audit', venueId: 'novee-grand-lounge', deviceId: 'kiosk-001', entrySource: 'qr-scan',
    entryStartedAt: now, lastActiveAt: now, guestProfile: null, profileComplete: true, resumeToken: null,
    audioEnabled: true, hapticsEnabled: true, lastVisitedRoute: null, leaderboardScore: 0, selectedCraft: null,
    selectedMentor: null, selectedMentorCountry: null, selectedLevel: null,
    smokeCraft: {}, passport: {}, goldenBox: {}, leaderboard: {}, preferences: {}, system: {}, pos3: {}, eatCommand: {},
  }))
  localStorage.setItem('sc_journey_v1', JSON.stringify({
    stateVersion: 3, identity: { preferredName: 'Audit' },
    selectedVenue: { id: 'v1', name: 'Test Lounge', selectedAt: now },
    selectedCigar: { name: 'Test Reserve Robusto', origin: 'Nicaragua', wrapper: 'Habano', strength: 'Medium', body: 'Medium', format: 'Robusto' },
  }))
})

const results = []
let idx = 0
for (const r of routes) {
  idx++
  const url = toUrl(r.fullPath)
  const isDynamic = /placeholder-/.test(url)
  const isRedirect = r.elementRaw.includes('<Navigate')

  const routeResult = { idx, path: `/smokecraft/${r.fullPath}`, testedUrl: url, isDynamicSegment: isDynamic, isRedirect, viewports: {} }

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    let measured = null
    try {
      await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 12000 })
      await page.waitForTimeout(300)
      measured = await page.evaluate(() => {
        const doc = document.documentElement
        const body = document.body
        const scrollableHeight = Math.max(doc.scrollHeight, body.scrollHeight)
        const viewportH = window.innerHeight
        const viewportW = window.innerWidth
        const horizontalOverflow = Math.max(doc.scrollWidth, body.scrollWidth) > viewportW + 2
        // Is there a scroll container? Either the shell's own overflow:auto
        // fixed container, a fixed body page taller than viewport, OR
        // (the common case) native document/body scroll, which works by
        // default unless html/body/#root sets overflow:hidden. Verified
        // directly by attempting a real scroll and checking it moved.
        const scrollableEls = [...document.querySelectorAll('*')].filter(el => {
          const cs = getComputedStyle(el)
          return (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 4
        })
        const beforeScrollY = window.scrollY
        window.scrollTo(0, 100)
        const nativeScrollWorks = window.scrollY > beforeScrollY
        window.scrollTo(0, beforeScrollY)
        const canScrollIfNeeded = scrollableHeight <= viewportH + 4 || scrollableEls.length > 0 || nativeScrollWorks
        // Bottom-nav clearance: find a fixed bottom nav-like element and
        // check nothing meaningful is obscured beneath it.
        const fixedBottomEls = [...document.querySelectorAll('*')].filter(el => {
          const cs = getComputedStyle(el)
          const r = el.getBoundingClientRect()
          return cs.position === 'fixed' && r.bottom >= viewportH - 4 && r.height > 20 && r.height < 140
        })
        let bottomNavHeight = 0
        for (const el of fixedBottomEls) { const r = el.getBoundingClientRect(); bottomNavHeight = Math.max(bottomNavHeight, r.height) }
        // Content obscured behind bottom nav: any interactive control whose
        // rect bottom exceeds (viewportH - bottomNavHeight) but is still
        // "on-screen" per naive layout (i.e. would be visually covered) —
        // EXCLUDING controls that are themselves inside the fixed nav bar
        // (its own buttons legitimately sit in that band; that is not an
        // obscuring defect).
        let obscuredControls = 0
        if (bottomNavHeight > 0) {
          const controls = [...document.querySelectorAll('button, a[href], input, [role="button"]')]
            .filter(el => !fixedBottomEls.some(nav => nav.contains(el)))
          for (const el of controls) {
            const r = el.getBoundingClientRect()
            if (r.width > 0 && r.height > 0 && r.bottom > viewportH - bottomNavHeight && r.top < viewportH - bottomNavHeight) obscuredControls++
          }
        }
        // Image orientation (image-shell screens): find the largest visible
        // <img> that is actually rendered at hero scale (>= 40% of the
        // viewport's smaller dimension) — excludes small avatar/decorative
        // thumbnails that would otherwise be misidentified as the screen's
        // backdrop image by a naive "largest natural-pixel-count" heuristic.
        const heroThreshold = Math.min(viewportW, viewportH) * 0.4
        const imgs = [...document.querySelectorAll('img')].filter(i => {
          if (i.naturalWidth <= 0) return false
          const r = i.getBoundingClientRect()
          return Math.max(r.width, r.height) >= heroThreshold
        })
        let heroImage = null
        if (imgs.length) {
          const largest = imgs.reduce((a, b) => (a.naturalWidth * a.naturalHeight > b.naturalWidth * b.naturalHeight ? a : b))
          const r = largest.getBoundingClientRect()
          heroImage = {
            naturalW: largest.naturalWidth, naturalH: largest.naturalHeight,
            orientation: largest.naturalWidth >= largest.naturalHeight ? 'landscape' : 'portrait',
            renderedW: r.width, renderedH: r.height,
            src: largest.src.split('/').pop(),
          }
        }
        // Dead-space heuristic for image-shell screens: unused letterbox
        // area (black bars) as a fraction of viewport.
        let deadSpaceRatio = null
        if (heroImage && heroImage.renderedW > 0 && heroImage.renderedH > 0) {
          const usedArea = heroImage.renderedW * heroImage.renderedH
          const totalArea = viewportW * viewportH
          deadSpaceRatio = Math.max(0, 1 - usedArea / totalArea)
        }
        // Touch-target sample: smallest interactive control's rendered box
        const controls = [...document.querySelectorAll('button, a[href], [role="button"]')].filter(el => {
          const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0
        })
        let minTouchTarget = null
        for (const el of controls) {
          const r = el.getBoundingClientRect()
          const size = Math.min(r.width, r.height)
          if (minTouchTarget === null || size < minTouchTarget) minTouchTarget = size
        }
        // Typography sample: smallest font-size among visible text nodes' parents
        const textEls = [...document.querySelectorAll('p, span, button, a, h1, h2, h3, label')].filter(el => (el.innerText || '').trim().length > 0)
        let minFontSize = null
        for (const el of textEls.slice(0, 200)) {
          const fs = parseFloat(getComputedStyle(el).fontSize)
          if (!isNaN(fs) && (minFontSize === null || fs < minFontSize)) minFontSize = fs
        }
        return {
          viewportW, viewportH, scrollableHeight, horizontalOverflow, canScrollIfNeeded,
          bottomNavHeight, obscuredControls, heroImage, deadSpaceRatio, minTouchTarget, minFontSize,
          bodyEmpty: (body.innerText || '').trim().length < 10,
        }
      })
    } catch (e) {
      measured = { error: String(e.message || e).slice(0, 200) }
    }
    routeResult.viewports[vp.name] = measured
  }

  // One screenshot per route at the primary tablet viewport for the proof record
  try {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto(`${BASE}${url}`, { waitUntil: 'networkidle', timeout: 12000 })
    await page.waitForTimeout(250)
    const shotFile = `${String(idx).padStart(3, '0')}-${r.fullPath.replace(/[/:]/g, '_')}.png`
    await page.screenshot({ path: `${OUT_DIR}/screenshots/${shotFile}` })
    routeResult.screenshot = shotFile
  } catch { routeResult.screenshot = null }

  results.push(routeResult)
  console.log(`[${idx}/${routes.length}] ${routeResult.path}`)
}

await browser.close()
writeFileSync(`${OUT_DIR}/01-responsive-inventory.json`, JSON.stringify(results, null, 2))
console.log(`\nWrote ${results.length} route inventories to ${OUT_DIR}/01-responsive-inventory.json`)
