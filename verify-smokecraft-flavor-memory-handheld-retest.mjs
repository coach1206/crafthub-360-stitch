#!/usr/bin/env node
// Targeted, isolated re-verification of a single route/viewport that
// timed out during the 131-route concurrent-load responsive sweep
// (/smokecraft/flavor-memory @ handheld-portrait, 390x844). Reuses
// the exact same measurement logic as
// verify-smokecraft-hf3-responsive-inventory.mjs so the result is
// directly comparable/patchable into the same inventory JSON schema.
import { chromium } from 'playwright'

const BASE = process.env.SC_UI || 'http://localhost:5050'
const EXEC = '/opt/pw-browsers/chromium'

const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } })
const page = await ctx.newPage()
await page.addInitScript(() => {
  const now = Date.now()
  localStorage.setItem('novee_guest_session', JSON.stringify({
    sessionId: 's_flavor_memory_retest', createdAt: now, updatedAt: now, __version: 4,
    profile: { firstName: 'Retest', lastName: 'Tester' },
    completedSteps: ['enroll', 'identity', 'entry', 'humidor-match', 'meet-your-cigar', 'terroir', 'format', 'cut-toast-light', 'lighting-tutorial', 'first-third'],
    xp: 500, rank: 'Apprentice', badges: [], smokecraftStamps: [], mentors: [], favorites: [], pendingOrders: [],
    currentSmokecraftStep: null, latestStampId: null, goldenBoxProgress: null,
    skillScore: 0, challengeScore: 0, loyaltyPoints: 0, lifetimeLoyaltyPoints: 0, redeemablePoints: 0,
    passportStampCount: 0, purchaseCount: 0, houseCigarPurchases: 0, pairingPurchases: 0,
    eventParticipationCount: 0, referralCount: 0, loyaltyLedger: [], usedTransactionIds: [],
  }))
})

let result
const start = Date.now()
try {
  await page.goto(`${BASE}/smokecraft/flavor-memory`, { waitUntil: 'networkidle', timeout: 20000 })
  const elapsed = Date.now() - start
  const bodyEmpty = await page.evaluate(() => document.body.innerText.trim().length === 0)
  const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4)
  result = { ok: true, elapsedMs: elapsed, bodyEmpty, horizontalOverflow }
} catch (err) {
  result = { ok: false, error: String(err.message || err) }
}
console.log(JSON.stringify(result, null, 2))
await browser.close()
process.exit(result.ok ? 0 : 1)
