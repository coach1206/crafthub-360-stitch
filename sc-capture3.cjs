const { chromium } = require('playwright');

const VP_ARG = process.argv[2] || 'desktop-1440';
const VP_MAP = {
  'desktop-1440':          { width: 1440, height: 900  },
  'tablet-landscape-1024': { width: 1024, height: 768  },
  'tablet-portrait-768':   { width: 768,  height: 1024 },
  'mobile-390':            { width: 390,  height: 844  },
};
const vp = VP_MAP[VP_ARG];

const ROUTES = [
  ['01-landing',            '/smokecraft'],
  ['02-enroll',             '/smokecraft/enroll'],
  ['03-identity',           '/smokecraft/identity'],
  ['04-golden-box',         '/smokecraft/golden-box'],
  ['05-mentor-selection',   '/smokecraft/mentor-selection'],
  ['06-format',             '/smokecraft/format'],
  ['07-seed-soil',          '/smokecraft/seed-soil'],
  ['08-pairing-lab',        '/smokecraft/pairing-lab'],
  ['09-humidor-match',      '/smokecraft/humidor-match'],
  ['10-request-purchase',   '/smokecraft/request-purchase'],
  ['11-cut-toast-light',    '/smokecraft/cut-toast-light'],
  ['12-first-third',        '/smokecraft/first-third'],
  ['13-second-third',       '/smokecraft/second-third'],
  ['14-flavor-memory',      '/smokecraft/flavor-memory'],
  ['15-final-third',        '/smokecraft/final-third'],
  ['16-scorecard',          '/smokecraft/scorecard'],
  ['17-final-review',       '/smokecraft/final-review'],
  ['18-passport-stamp',     '/smokecraft/passport-stamp'],
  ['19-connections',        '/smokecraft/connections'],
  ['20-management-sync',    '/smokecraft/management-sync'],
  ['21-session-complete',   '/smokecraft/session-complete'],
  ['22-leaderboard',        '/smokecraft/leaderboard'],
  ['23-event-challenge',    '/smokecraft/event-challenge'],
  ['24-how-it-works',       '/smokecraft/how-it-works'],
  ['25-smokecraft-challenge','/smokecraft/smokecraft-challenge'],
  ['26-second-humidor-match','/smokecraft/second-humidor-match'],
  ['27-mini-tasting',       '/smokecraft/mini-tasting'],
  ['28-visit-complete',     '/smokecraft/visit-complete'],
];

const BASE = 'public/proof/live-deployment-final-verification/' + VP_ARG;
const JOURNEY = JSON.stringify({
  stateVersion: 2,
  identity: { fullName: 'Test Guest', preferredName: 'Test', experienceLevel: 'enthusiast' },
  mentor: [{ id: 'alejandro', name: 'Don Alejandro', origin: 'Dominican Republic', expertise: 'Aged blends & terroir depth' }],
  format: { id: 'robusto', label: 'Robusto', desc: '5" × 50 ring', burnTime: '45–60 min' },
  seedSoil: { seedType: 'Criollo', soilType: 'Volcanic' },
});

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  for (const [name, route] of ROUTES) {
    // Fresh context per route ensures clean state and avoids memory build-up
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await ctx.addInitScript((j) => {
      window.addEventListener('DOMContentLoaded', () => {
        sessionStorage.setItem('novee_demo_mode', '1');
        localStorage.setItem('sc_journey_v1', j);
        localStorage.setItem('sc_identity_v1', JSON.stringify({ fullName:'Test Guest', preferredName:'Test', experienceLevel:'enthusiast' }));
        localStorage.setItem('sc_golden_box_v1', JSON.stringify({ acknowledged: true }));
      }, { once: true });
    }, JOURNEY);

    const page = await ctx.newPage();
    try {
      await page.goto('http://localhost:5000' + route, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: BASE + '/' + name + '.png' });
      console.log('OK ' + name);
    } catch(e) {
      console.log('ERR ' + name + ': ' + e.message.slice(0,50));
    }
    await ctx.close();
  }

  await browser.close();
  console.log('DONE ' + VP_ARG);
})();
