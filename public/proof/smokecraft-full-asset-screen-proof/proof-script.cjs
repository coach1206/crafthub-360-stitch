const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT_DIR = '/home/user/crafthub-360-stitch/public/proof/smokecraft-full-asset-screen-proof';
const BASE = 'http://localhost:4173';

const PAGES = [
  { name: 'art', route: '/smokecraft/art' },
  { name: 'how-it-works', route: '/smokecraft/how-it-works' },
  { name: 'flavor-memory', route: '/smokecraft/flavor-memory' },
  { name: 'smokecraft-challenge', route: '/smokecraft/smokecraft-challenge' },
  { name: 'second-humidor-match', route: '/smokecraft/second-humidor-match' },
  { name: 'mini-tasting-round', route: '/smokecraft/mini-tasting' },
  { name: 'final-review', route: '/smokecraft/final-review' },
  { name: 'pairing-lab', route: '/smokecraft/pairing-lab' },
  { name: 'guest-pass', route: '/smokecraft/guest-pass' },
  { name: 'scan', route: '/smokecraft/scan' },
  { name: 'first-third', route: '/smokecraft/first-third' },
  { name: 'second-third', route: '/smokecraft/second-third' },
  { name: 'final-third', route: '/smokecraft/final-third' },
  { name: 'terroir', route: '/smokecraft/terroir' },
  { name: 'vitola', route: '/smokecraft/vitola' },
  { name: 'pairing-mastery', route: '/smokecraft/pairing-mastery' },
];

const DEMO_SESSION = {
  schemaVersion: 4,
  guestName: 'Proof Guest',
  xp: 100,
  rank: 'Bronze',
  completedSteps: [],
  smokeCraft: {},
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const results = [];

  for (const p of PAGES) {
    const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
    await context.addInitScript((session) => {
      sessionStorage.setItem('novee_demo_mode', '1');
      sessionStorage.setItem('demoMode', 'true');
      sessionStorage.setItem('novee_booted', '1');
      localStorage.setItem('novee_guest_session', JSON.stringify(session));
    }, DEMO_SESSION);
    const page = await context.newPage();
    let errored = false;
    page.on('pageerror', () => { errored = true; });
    try {
      await page.goto(BASE + p.route, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(800);
      const imgInfo = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const fg = imgs.find(i => i.style.objectFit === 'contain' && i.getBoundingClientRect().width > 100);
        if (!fg) return null;
        const r = fg.getBoundingClientRect();
        return {
          src: fg.getAttribute('src'),
          objectFit: fg.style.objectFit,
          naturalWidth: fg.naturalWidth,
          naturalHeight: fg.naturalHeight,
          rect: { top: r.top, left: r.left, right: r.right, bottom: r.bottom },
        };
      });
      const screenshotPath = path.join(OUT_DIR, `sc-asset-proof-${p.name}.png`);
      await page.screenshot({ path: screenshotPath });
      results.push({ page: p.name, route: p.route, imgInfo, screenshot: path.basename(screenshotPath), jsError: errored });
    } catch (e) {
      results.push({ page: p.name, route: p.route, error: String(e), jsError: errored });
    }
    await context.close();
  }

  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close();
  console.log(JSON.stringify(results.map(r => ({ page: r.page, ok: !r.error && !r.jsError, hasFgImage: !!r.imgInfo })), null, 2));
})();
