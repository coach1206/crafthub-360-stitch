const { chromium } = require('playwright')
const path = require('path')
const fs = require('fs')

const BASE = 'http://localhost:4173'
const OUT  = path.join(__dirname, '../../public/proof/smokecraft-canvas-clean-proof')

const PAGES = [
  { name: 'first-third',          route: '/smokecraft/first-third' },
  { name: 'second-third',         route: '/smokecraft/second-third' },
  { name: 'flavor-memory',        route: '/smokecraft/flavor-memory' },
  { name: 'second-humidor-match', route: '/smokecraft/second-humidor-match' },
  { name: 'mini-tasting-round',   route: '/smokecraft/mini-tasting' },
  { name: 'final-review',         route: '/smokecraft/final-review' },
  { name: 'session-complete',     route: '/smokecraft/session-complete' },
  { name: 'event-challenge',      route: '/smokecraft/event-challenge' },
  { name: 'terroir',              route: '/smokecraft/terroir' },
  { name: 'vitola',               route: '/smokecraft/vitola' },
  { name: 'pairing-lab',          route: '/smokecraft/pairing-lab' },
  { name: 'pairing-mastery',      route: '/smokecraft/pairing-mastery' },
  { name: 'origins',              route: '/smokecraft/origins' },
  { name: 'guest-pass',           route: '/smokecraft/guest-pass' },
  { name: 'scan',                 route: '/smokecraft/scan' },
  { name: 'how-it-works',         route: '/smokecraft/how-it-works' },
  { name: 'art',                  route: '/smokecraft/art' },
  { name: 'golden-box-status',    route: '/smokecraft/golden-box-status' },
]

const GUEST_SESSION = {
  schemaVersion: 4,
  sessionId: 'canvas-proof-session',
  guestId: 'canvas-proof-guest',
  venueId: 'proof-venue',
  guestName: 'Proof User',
  completedSteps: [
    'art','mentor','seed-soil','pairing-lab','humidor-match',
    'cut-toast-light','first-third','second-third','flavor-memory',
    'final-third','scorecard','smokecraft-challenge','second-humidor-match',
    'mini-tasting','final-review',
  ],
  badges: [],
  xp: 500,
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
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })

    await ctx.addInitScript((session) => {
      sessionStorage.setItem('novee_demo_mode', '1')
      sessionStorage.setItem('demoMode', 'true')
      sessionStorage.setItem('novee_booted', '1')
      localStorage.setItem('novee_guest_session', JSON.stringify(session))
    }, GUEST_SESSION)

    const p = await ctx.newPage()
    try {
      await p.goto(BASE + page.route, { waitUntil: 'networkidle', timeout: 20000 })
      await p.waitForTimeout(1200)

      // Check for the approved image
      const imgData = await p.evaluate((route) => {
        const imgs = Array.from(document.querySelectorAll('img'))
        const approved = imgs.filter(img => img.src && img.src.includes('smokecraft-reference/approved'))
        return approved.map(img => ({
          src: img.src,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          complete: img.complete,
          objectFit: window.getComputedStyle(img).objectFit,
          displayWidth: img.getBoundingClientRect().width,
          displayHeight: img.getBoundingClientRect().height,
        }))
      }, page.route)

      const file = `sc-canvas-proof-${page.name}.png`
      await p.screenshot({ path: path.join(OUT, file), fullPage: false })

      results.push({
        name: page.name,
        route: page.route,
        file,
        approvedImages: imgData,
        pass: imgData.length > 0 && imgData[0].naturalWidth > 0,
      })

      console.log(`✓ ${page.name}: ${imgData.length} approved img(s)${imgData[0] ? ` — ${imgData[0].naturalWidth}×${imgData[0].naturalHeight} objectFit:${imgData[0].objectFit}` : ''}`)
    } catch (err) {
      console.error(`✗ ${page.name}: ${err.message}`)
      results.push({ name: page.name, route: page.route, file: null, approvedImages: [], pass: false, error: err.message })
    }
    await ctx.close()
  }

  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2))
  console.log(`\nDone. ${results.filter(r => r.pass).length}/${results.length} pages passed.`)
  await browser.close()
})()
