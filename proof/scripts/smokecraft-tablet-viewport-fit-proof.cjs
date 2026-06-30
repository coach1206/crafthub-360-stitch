const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE = 'http://localhost:4173'
const OUT  = path.join(__dirname, '../../public/proof/smokecraft-tablet-viewport-fit-proof')

// Tablet/touchscreen viewport (iPad-class landscape)
const VIEWPORT = { width: 1024, height: 768 }

const PAGES = [
  { name: 'identity',             route: '/smokecraft/identity',             waitMs: 4200 },
  { name: 'first-third',          route: '/smokecraft/first-third',          waitMs: 1200 },
  { name: 'second-third',         route: '/smokecraft/second-third',         waitMs: 1200 },
  { name: 'flavor-memory',        route: '/smokecraft/flavor-memory',        waitMs: 1200 },
  { name: 'second-humidor-match', route: '/smokecraft/second-humidor-match', waitMs: 1200 },
  { name: 'final-review',         route: '/smokecraft/final-review',         waitMs: 1200 },
  { name: 'session-complete',     route: '/smokecraft/session-complete',     waitMs: 1200 },
  { name: 'terroir',              route: '/smokecraft/terroir',              waitMs: 1200 },
  { name: 'vitola',               route: '/smokecraft/vitola',               waitMs: 1200 },
  { name: 'event-challenge',      route: '/smokecraft/event-challenge',      waitMs: 1200 },
  { name: 'guest-pass',           route: '/smokecraft/guest-pass',           waitMs: 1200 },
  { name: 'scan',                 route: '/smokecraft/scan',                 waitMs: 1200 },
]

const GUEST_SESSION = {
  schemaVersion: 4,
  sessionId: 'tablet-fit-session',
  guestId: 'tablet-fit-guest',
  venueId: 'proof-venue',
  guestName: 'Proof User',
  completedSteps: [
    'art','mentor','seed-soil','pairing-lab','humidor-match',
    'cut-toast-light','first-third','second-third','flavor-memory',
    'final-third','scorecard','smokecraft-challenge','second-humidor-match',
    'mini-tasting','final-review','leaves','origins','cultivation','leaf-challenge',
  ],
  badges: [{ id: 'golden-box-invitation', name: 'Golden Box', icon: 'star' }],
  xp: 750,
  mentors: ['Alejandro Cruz'],
  selectedMentor: 'Alejandro Cruz',
  smokecraftStamps: ['art','mentor'],
  passport: { earnedStamps: ['art','mentor'] },
  profile: { nickname: 'ProofUser', flavorProfile: 'Medium' },
  smokeCraft: {
    goldenBox: { accepted: true },
    eventLog: [],
  },
}

;(async () => {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox'],
  })

  const results = []

  for (const page of PAGES) {
    const ctx = await browser.newContext({ viewport: VIEWPORT, hasTouch: true, isMobile: false })

    await ctx.addInitScript((session) => {
      sessionStorage.setItem('novee_demo_mode', '1')
      sessionStorage.setItem('demoMode', 'true')
      sessionStorage.setItem('novee_booted', '1')
      localStorage.setItem('novee_guest_session', JSON.stringify(session))
    }, GUEST_SESSION)

    const p = await ctx.newPage()
    try {
      await p.goto(BASE + page.route, { waitUntil: 'networkidle', timeout: 20000 })
      await p.waitForTimeout(page.waitMs)

      const imgData = await p.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'))
        const approved = imgs.filter(img => img.src && img.src.includes('smokecraft-reference/approved'))
        return approved.map(img => {
          const rect = img.getBoundingClientRect()
          return {
            src: img.src,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete,
            objectFit: window.getComputedStyle(img).objectFit,
            displayWidth: rect.width,
            displayHeight: rect.height,
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
          }
        })
      })

      const vw = VIEWPORT.width
      const vh = VIEWPORT.height
      const img = imgData[0]
      const fitsInViewport = !!img && img.top >= -1 && img.left >= -1 && img.bottom <= vh + 1 && img.right <= vw + 1

      const file = `sc-tablet-proof-${page.name}.png`
      await p.screenshot({ path: path.join(OUT, file), fullPage: false })

      results.push({
        name: page.name,
        route: page.route,
        file,
        viewport: VIEWPORT,
        approvedImages: imgData,
        fitsInViewport,
        pass: !!img && img.naturalWidth > 0 && fitsInViewport && img.objectFit === 'contain',
      })

      console.log(`${results[results.length - 1].pass ? '✓' : '✗'} ${page.name}: fitsInViewport=${fitsInViewport} objectFit=${img ? img.objectFit : 'N/A'}`)
    } catch (err) {
      console.error(`✗ ${page.name}: ${err.message}`)
      results.push({ name: page.name, route: page.route, file: null, approvedImages: [], fitsInViewport: false, pass: false, error: err.message })
    }
    await ctx.close()
  }

  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2))
  console.log(`\nDone. ${results.filter(r => r.pass).length}/${results.length} pages passed.`)
  await browser.close()
})()
