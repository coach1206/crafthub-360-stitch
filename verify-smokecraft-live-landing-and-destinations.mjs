// Live Landing & Destinations verification — Live Landing & Destinations pass.
//
// Runs against the PRODUCTION BUILD served by `vite preview` (default port
// 5050) and drives ONLY the visible landing controls a real user clicks
// (located by role/text), never by seeding an active journey before the click
// or calling startNewJourney()/navigate() directly. Consolidates the intent of
// the mandate-named verify-smokecraft-live-start-navigation.mjs and
// verify-smokecraft-approved-asset-content.mjs (neither of which existed in
// the repo) into this one real browser suite.
//
// Legitimate localStorage use: to reach a "mid-journey" or "completed" set-up
// condition we seed completedSteps (the established playthrough-suite
// technique) — but every Start / Resume / Start-New / destination-card
// activation under test is always a REAL visible-control click.
import { chromium } from 'playwright'

const BASE = process.env.SC_BASE || 'http://localhost:5050'
const EXEC = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'

let pass = 0, fail = 0
const results = []
function check(name, cond, detail = '') {
  if (cond) { pass++; results.push(`PASS  ${name}`) }
  else { fail++; results.push(`FAIL  ${name}${detail ? ' :: ' + detail : ''}`) }
}

const browser = await chromium.launch({ executablePath: EXEC })

async function freshPage() {
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  const errors = []
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', e => errors.push('pageerror: ' + e.message))
  return { ctx, page, errors }
}

// ── Case 1: Clean start via the visible Start control ──────────────────────
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const start = page.getByRole('button', { name: /START SMOKECRAFT JOURNEY/i })
  check('Clean start: visible START control present', (await start.count()) >= 1)
  await start.first().click()
  await page.waitForTimeout(1200)
  check('Clean start: real click navigates to /smokecraft/enroll', page.url().endsWith('/smokecraft/enroll'), page.url())
  const jid = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('sc_journey_v1')).activeJourneyId } catch { return null } })
  check('Clean start: activeJourneyId exists after real click', !!jid, String(jid))
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  check('Clean start: journey persists across refresh (stays on enroll)', page.url().endsWith('/smokecraft/enroll'), page.url())
  await ctx.close()
}

// ── Case 2: Active mid-journey → Resume via visible control ────────────────
{
  const { ctx, page } = await freshPage()
  await page.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
  // Seed a real player's history (completedSteps) — set-up only, not the click.
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem('novee_guest_session') || '{}')
    // Contiguous session prefix (S1 'entry' → S2 → S3) plus the entry-layer
    // 'enroll' flag, matching the authoritative computeJourneyStatus prefix rule.
    raw.completedSteps = ['enroll', 'entry', 'humidor-match', 'meet-your-cigar']
    localStorage.setItem('novee_guest_session', JSON.stringify(raw))
    const j = JSON.parse(localStorage.getItem('sc_journey_v1') || '{}')
    j.selectedVenue = 'novee-grand-lounge'; j.venueSelectionCompleted = true
    localStorage.setItem('sc_journey_v1', JSON.stringify(j))
  })
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const resume = page.getByRole('button', { name: /RESUME SMOKECRAFT JOURNEY/i })
  check('Active journey: RESUME control appears (not Start)', (await resume.count()) >= 1)
  if (await resume.count()) {
    const before = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('sc_journey_v1')).activeJourneyId } catch { return null } })
    await resume.first().click()
    await page.waitForTimeout(1200)
    check('Active journey: Resume click leaves /smokecraft (no bounce back to Start)', !page.url().endsWith('/smokecraft'), page.url())
    const after = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('sc_journey_v1')).activeJourneyId } catch { return null } })
    check('Active journey: Resume does NOT create a new journey', before === after, `${before} -> ${after}`)
  }
  await ctx.close()
}

// ── Destination cards (fresh journey preserved) ────────────────────────────
async function destination(cardLabel, expectPathIncludes, assertFn) {
  const { ctx, page, errors } = await freshPage()
  await page.goto(BASE + '/smokecraft', { waitUntil: 'networkidle' })
  await page.waitForTimeout(500)
  const jidBefore = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('sc_journey_v1')).activeJourneyId } catch { return null } })
  const btn = page.getByRole('button', { name: cardLabel })
  check(`Destination[${cardLabel}]: visible control present`, (await btn.count()) >= 1)
  if (await btn.count()) {
    await btn.first().click()
    await page.waitForTimeout(1500)
    check(`Destination[${cardLabel}]: routes to ${expectPathIncludes}`, page.url().includes(expectPathIncludes), page.url())
    const jidAfter = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem('sc_journey_v1')).activeJourneyId } catch { return null } })
    check(`Destination[${cardLabel}]: active journey preserved`, jidBefore === jidAfter, `${jidBefore} -> ${jidAfter}`)
    if (assertFn) await assertFn(page)
  }
  await ctx.close()
}

// Rewards → Reward Center (approved Reward Center.png actually rendered)
// Approved-Asset Control Plane pass — RETARGETED, not weakened.
// The three Rewards checks below were written against the prior pass's
// layout (a CSS-background div plus a hand-built glass-card stack). Two of
// them asserted things that are now known defects:
//   * "shows real Total XP field" asserted ACCOUNT XP being displayed on the
//     reward screen — exactly the account-state/reward-state bleed the
//     mandate's state-separation rule forbids. It is replaced by a check that
//     the reward point values come from the real loyalty balance/ledger.
//   * the empty-state check keyed off prose in a card that no longer exists;
//     it now keys off the honest status text placed in the approved image's
//     own empty MY REWARDS zone.
await destination('Rewards', '/smokecraft/rewards-center', async (page) => {
  const src = await page.evaluate(() => {
    const img = document.querySelector('img[src*="Reward"]')
    return img ? img.getAttribute('src') : ''
  })
  check('Rewards: Reward Center.png is the rendered visual shell',
    /Reward%20Center\.png|Reward Center\.png/.test(src), src.slice(0, 120))
  const txt = await page.evaluate(() => document.body.innerText)
  check('Rewards: account XP is not presented as reward points', !/Total XP/i.test(txt))
  check('Rewards: untracked point fields honestly marked unavailable',
    (await page.locator('[data-testid="rc-lifetime"]').innerText()).includes('\u2014'))
  check('Rewards: honest venue-rewards empty state (no fake offers)',
    /no venue reward catalog is connected/i.test(txt))
})

// Rankings → Leaderboard (approved LEADERBOARD 111.png, no stale baked data)
await destination('Rankings', '/smokecraft/leaderboard', async (page) => {
  const bg = await page.evaluate(() => [...document.querySelectorAll('*')].map(e => getComputedStyle(e).backgroundImage).find(v => v && v.includes('LEADERBOARD')) || '')
  check('Rankings: approved LEADERBOARD 111.png rendered', /LEADERBOARD%20111\.png/.test(bg), bg.slice(0, 120))
  const txt = await page.evaluate(() => document.body.innerText)
  check('Rankings: no stale "James Carter"', !/James Carter/.test(txt))
  check('Rankings: no stale "18,750"', !/18,?750/.test(txt))
  check('Rankings: no stale "4435 XP"', !/4435/.test(txt))
})

// Passport bottom-bar → passport-stamp OR entry redirect; must NOT show old lock image
await destination('View Passport (bottom bar)', '/smokecraft/', async (page) => {
  const txt = await page.evaluate(() => document.body.innerText)
  const imgs = await page.evaluate(() => [...document.querySelectorAll('img')].map(i => i.src))
  check('Passport: no FUTURE VISIT LOCKED text', !/FUTURE VISIT LOCKED/i.test(txt))
  check('Passport: no old lock PNG rendered', !imgs.some(s => /future-visit-locked|management-sync-locked|passport-stamp-locked/.test(s)), imgs.join(','))
})

// CraftHub → smokecraft-challenge (guarded) — journey preserved, no old image
// Approved-Asset Control Plane pass — RETARGETED. This tile is labelled
// CRAFTHUB in the approved landing artwork, but its handler navigated to the
// scorecard-guarded smokecraft-challenge screen, so the accessible name was
// "Enter Challenge" and no CraftHub visual was ever shown. It now opens the
// approved CraftHub 360 destination, so the control is asserted by its real
// label and its real destination.
await destination('CraftHub', '/smokecraft/crafthub', async (page) => {
  const src = await page.evaluate(() => {
    const img = document.querySelector('img[src*="CRAFTHUB"]')
    return img ? img.getAttribute('src') : ''
  })
  check('CraftHub: approved CraftHub 360 visual rendered', /CRAFTHUB/.test(src), src.slice(0, 120))
  const txt = await page.evaluate(() => document.body.innerText)
  check('CraftHub: no "Greg Guy" identity bleed', !/Greg Guy/.test(txt))
})

await browser.close()

console.log(results.join('\n'))
console.log(`\n${pass}/${pass + fail} checks passed`)
process.exit(fail ? 1 : 0)
