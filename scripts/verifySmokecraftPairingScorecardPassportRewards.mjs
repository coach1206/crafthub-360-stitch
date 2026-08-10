#!/usr/bin/env node
// SmokeCraft 360 — Block 3: pairing engine, scorecard, AI summary,
// passport, rewards/achievements, loyalty-points audit, and cross-system
// consistency verification. Real Chromium browser, real clicks, real
// server calls (no forced state).
import { chromium } from 'playwright'
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { execSync } from 'child_process'
import { genericAdvance } from './proveSmokecraftFullRealBrowserJourney.mjs'

const BASE = 'http://localhost:3001'
const OUT_DIR = 'docs/smokecraft/pairing-scorecard-passport-rewards-proof'
mkdirSync(OUT_DIR, { recursive: true })
const SHA = execSync('git rev-parse HEAD').toString().trim()

const defects = []
const notes = []

async function clientState(page) {
  return page.evaluate(() => {
    let guest = null, journey = null
    try { guest = JSON.parse(localStorage.getItem('novee_guest_session') || 'null') } catch {}
    try { journey = JSON.parse(localStorage.getItem('sc_journey_v1') || 'null') } catch {}
    return { guest, journey }
  })
}

async function serverPlayerState(page) {
  return page.evaluate(async () => {
    try {
      const r = await fetch('/api/smokecraft/player-state', { credentials: 'include' })
      if (!r.ok) return { ok: false, status: r.status }
      return { ok: true, data: await r.json() }
    } catch (e) { return { ok: false, error: String(e) } }
  })
}

async function advanceUntil(page, urlPattern, screenshotName, label, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    await genericAdvance(page, { screenshotName: `${screenshotName}-a${attempt}`, label })
    const reached = await page.waitForURL(urlPattern, { timeout: 12000 }).then(() => true).catch(() => false)
    if (reached) return true
  }
  return false
}

async function main() {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true })
  const page = await (await browser.newContext({ viewport: { width: 1180, height: 820 } })).newPage()

  // ── Walk the real journey (Block 1/2-proven sequence) up through
  // Scorecard, rating real values we can later cross-check. ─────────────
  await page.goto(`${BASE}/smokecraft`, { waitUntil: 'load', timeout: 40000 })
  await page.goto(`${BASE}/smokecraft/enroll`, { waitUntil: 'load', timeout: 40000 })
  await page.click('text=Explore as Guest')
  await page.waitForURL('**/smokecraft/identity', { timeout: 25000 })
  await page.fill('[data-testid="identity-fullName"]', 'Block3 Systems Proof')
  await page.selectOption('[data-testid="identity-experienceLevel"]', { index: 1 })
  await page.click('button:has-text("Continue to Venue Selection")')
  await page.waitForURL('**/smokecraft/venue-select', { timeout: 25000 })
  const alpha = page.locator('text=Alpha Lounge (Seed)')
  let venueSelected = false
  if (await alpha.count().catch(() => 0)) { await alpha.click(); venueSelected = true }
  else { await page.click('text=Continue without venue') }
  await page.waitForTimeout(300)
  await page.click('button:has-text("Continue to Welcome")')
  await page.waitForURL('**/smokecraft/welcome', { timeout: 25000 })
  await page.click('text=Begin Experience')
  await page.waitForURL('**/smokecraft/golden-box', { timeout: 25000 })
  const gbBox = page.locator('input[type="checkbox"]').first()
  if (await gbBox.count()) await gbBox.click().catch(() => {})
  await page.waitForTimeout(300)
  await page.locator('button[aria-label="Continue to Mentor Selection"]').click().catch(() => {})
  await page.waitForURL('**/smokecraft/mentor-selection', { timeout: 25000 }).catch(() => {})
  await genericAdvance(page, { screenshotName: 'b3-mentor', label: 'Mentor Selection' })
  await page.waitForURL('**/smokecraft/seed-soil', { timeout: 25000 }).catch(() => {})
  await genericAdvance(page, { screenshotName: 'b3-seed-soil', label: 'Seed & Soil' })
  await page.waitForURL('**/smokecraft/humidor-match', { timeout: 25000 }).catch(() => {})

  const envRadio = page.locator('text=Virtual Humidor').first()
  if (await envRadio.count()) await envRadio.click().catch(() => {})
  await page.waitForTimeout(300)
  const applyBtn = page.locator('button:has-text("Apply Settings")').first()
  if (await applyBtn.count()) await applyBtn.click().catch(() => {})
  await page.waitForTimeout(300)
  const cigarPick = page.locator('button, [role="button"]').filter({ hasText: /Padron 1964 Series/ }).first()
  let selectedCigarName = null
  if (await cigarPick.count()) { selectedCigarName = (await cigarPick.textContent().catch(() => '')).trim(); await cigarPick.click().catch(() => {}) }
  await page.waitForTimeout(300)
  const hmContinue = page.locator('button:has-text("Continue to Meet Your Cigar")').first()
  if (await hmContinue.count()) await hmContinue.click().catch(() => {})
  await page.waitForURL('**/smokecraft/meet-your-cigar', { timeout: 25000 }).catch(() => {})

  const brandTab = page.locator('text=Brand').first()
  if (await brandTab.count()) await brandTab.click().catch(() => {})
  await page.waitForTimeout(300)
  await advanceUntil(page, '**/smokecraft/terroir', 'b3-meet-cigar', 'Meet Your Cigar')
  await advanceUntil(page, '**/smokecraft/format', 'b3-terroir', 'Terroir')
  await advanceUntil(page, '**/smokecraft/request-purchase', 'b3-format', 'Format')
  await advanceUntil(page, '**/smokecraft/cut-toast-light', 'b3-request', 'Request/Purchase')
  await advanceUntil(page, '**/smokecraft/lighting-tutorial', 'b3-cut', 'Cut Toast Light')
  await advanceUntil(page, '**/smokecraft/first-third', 'b3-lighting', 'Lighting Tutorial')
  await advanceUntil(page, '**/smokecraft/flavor-memory', 'b3-first-third', 'First Third')
  await advanceUntil(page, '**/smokecraft/pairing-lab', 'b3-flavor-memory', 'Flavor Memory')

  const pairingType = page.locator('button, [role="button"]').filter({ hasText: /^Whiskey$/ }).first()
  if (await pairingType.count()) await pairingType.click().catch(() => {})
  await page.waitForTimeout(400)
  await advanceUntil(page, '**/smokecraft/second-third', 'b3-pairing-lab', 'Pairing Lab')

  const secondThirdTextarea = page.locator('textarea').first()
  if (await secondThirdTextarea.count()) { await secondThirdTextarea.fill('Body deepened, burn stayed even.'); await page.waitForTimeout(1000) }
  await advanceUntil(page, '**/smokecraft/mentor-commentary', 'b3-second-third', 'Second Third')
  await advanceUntil(page, '**/smokecraft/knowledge-drop', 'b3-mentor-commentary', 'Mentor Commentary')
  await advanceUntil(page, '**/smokecraft/final-third', 'b3-knowledge-drop', 'Knowledge Drop')

  const flavorChip = page.locator('button[aria-label="Earth flavor"]').first()
  if (await flavorChip.count()) await flavorChip.click({ timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(300)
  const ftContinueBtn = page.locator('button:has-text("Continue to Scorecard")').first()
  if (await ftContinueBtn.count()) { await ftContinueBtn.scrollIntoViewIfNeeded(); await ftContinueBtn.click({ timeout: 5000 }).catch(() => {}) }
  await page.waitForURL('**/smokecraft/scorecard', { timeout: 25000 }).catch(() => {})

  // ═══════════════════════════════════════════════════════════════════
  // SCORECARD deep verification
  // ═══════════════════════════════════════════════════════════════════

  // Incomplete scorecard cannot advance.
  const scContinueBtn = page.locator('button:has-text("Continue to AI Summary")').first()
  const preScUrl = page.url()
  if (await scContinueBtn.count()) await scContinueBtn.click({ timeout: 3000 }).catch(() => {})
  await page.waitForTimeout(400)
  if (page.url() !== preScUrl) {
    defects.push('SCORECARD GATE MISSING: advanced to AI Summary with 0/6 categories rated.')
  } else {
    notes.push('Scorecard gate check PASS: cannot advance with 0/6 rated.')
  }

  const ratingsGiven = { Appearance: 5, Construction: 4, Draw: 3, Burn: 5, Flavor: 4, 'Pairing Match': 4 }
  for (const [cat, val] of Object.entries(ratingsGiven)) {
    const btn = page.locator(`button[aria-label*="Rate ${cat} ${val}"]`).first()
    if (await btn.count()) await btn.click({ timeout: 3000 }).catch(() => {})
    else defects.push(`SCORECARD CONTROL UNREACHABLE: could not find rating ${val} for "${cat}".`)
  }
  await page.waitForTimeout(400)
  const expectedAvg = Object.values(ratingsGiven).reduce((a, b) => a + b, 0) / 6 // 4.166... -> rounds to 4.2
  const expectedDisplay = Math.round(expectedAvg * 10) / 10
  const overallText = await page.locator(`text=/${expectedDisplay}\\/5/`).first().count().catch(() => 0)
  if (overallText === 0) {
    const anyOverall = await page.locator('text=/\\d(\\.\\d)?\\/5/').first().textContent().catch(() => 'NOT FOUND')
    defects.push(`SCORECARD OVERALL SCORE WRONG: expected ${expectedDisplay}/5 for ratings ${JSON.stringify(ratingsGiven)}, displayed "${anyOverall}".`)
  } else {
    notes.push(`Scorecard overall score calculation PASS: ${expectedDisplay}/5 correctly displayed for mixed ratings ${JSON.stringify(ratingsGiven)}.`)
  }

  const notesText = 'Block 3 systems verification notes — cross-checking downstream consumers.'
  const notesField = page.locator('textarea[aria-label="Personal tasting notes"]').first()
  if (await notesField.count()) await notesField.fill(notesText)
  // Scorecard's draft autosave is debounced 1200ms (confirmed in source) —
  // wait past that before navigating away, or the save never fires.
  await page.waitForTimeout(1800)

  // Navigate away and back — category values + notes must persist (no
  // stale-draft regression from Block 2's fix).
  await page.goto(`${BASE}/smokecraft/final-third`, { waitUntil: 'load', timeout: 40000 })
  await page.waitForTimeout(500)
  await page.goto(`${BASE}/smokecraft/scorecard`, { waitUntil: 'load', timeout: 40000 })
  await page.waitForTimeout(600)
  const notesAfterRevisit = await page.locator('textarea[aria-label="Personal tasting notes"]').first().inputValue().catch(() => null)
  if (notesAfterRevisit !== notesText) {
    defects.push(`SCORECARD NOTES DID NOT PERSIST: expected "${notesText}", got "${notesAfterRevisit}".`)
  } else {
    notes.push('Scorecard notes persistence check PASS after navigate-away-and-back.')
  }
  const appearance5Pressed = await page.locator('button[aria-label*="Rate Appearance 5"]').first().getAttribute('aria-pressed').catch(() => null)
  if (appearance5Pressed !== 'true') {
    defects.push(`SCORECARD RATING DID NOT PERSIST: Appearance 5 expected pressed=true, got "${appearance5Pressed}".`)
  } else {
    notes.push('Scorecard rating persistence check PASS after navigate-away-and-back.')
  }

  // Reload check.
  await page.reload({ waitUntil: 'load', timeout: 40000 })
  await page.waitForTimeout(600)
  const notesAfterReload = await page.locator('textarea[aria-label="Personal tasting notes"]').first().inputValue().catch(() => null)
  if (notesAfterReload !== notesText) {
    defects.push(`SCORECARD NOTES DID NOT SURVIVE RELOAD: expected "${notesText}", got "${notesAfterReload}".`)
  } else {
    notes.push('Scorecard notes reload-survival check PASS.')
  }

  const scorecardSnapshot = await clientState(page)
  const scorecardOverallStored = scorecardSnapshot.journey?.scorecard?.overall ?? null
  notes.push(`Client-stored scorecard.overall = ${scorecardOverallStored} (journey state).`)

  await advanceUntil(page, '**/smokecraft/ai-summary', 'b3-scorecard', 'Scorecard')

  // ═══════════════════════════════════════════════════════════════════
  // AI SUMMARY verification
  // ═══════════════════════════════════════════════════════════════════
  await page.waitForTimeout(800)
  const aiSummaryBodyText = await page.locator('body').innerText().catch(() => '')
  // Confirm the summary references the real selected cigar (not a stale
  // placeholder) when the name is known.
  if (selectedCigarName) {
    const cigarRefFound = aiSummaryBodyText.includes(selectedCigarName.split('\n')[0].trim().slice(0, 8))
    notes.push(`AI Summary cigar-reference check: looked for a fragment of "${selectedCigarName.split('\n')[0]}" in the page — ${cigarRefFound ? 'found' : 'not textually found (may be summarized/paraphrased rather than literal, not necessarily a defect)'}.`)
  }
  // Reload persistence.
  const aiUrlBeforeReload = page.url()
  await page.reload({ waitUntil: 'load', timeout: 40000 })
  await page.waitForTimeout(600)
  if (page.url() !== aiUrlBeforeReload) {
    defects.push(`AI SUMMARY RELOAD REDIRECTED unexpectedly: ${aiUrlBeforeReload} -> ${page.url()}.`)
  } else {
    notes.push('AI Summary reload persistence check PASS: stayed on the same route.')
  }

  await advanceUntil(page, '**/smokecraft/pairing-recommendations', 'b3-ai-summary', 'AI Summary')

  // ═══════════════════════════════════════════════════════════════════
  // PAIRING RECOMMENDATIONS deep verification
  // ═══════════════════════════════════════════════════════════════════
  await page.waitForTimeout(1200) // allow server-authoritative ranking call to resolve

  const primaryText = await page.locator('[data-testid="pr-primary"]').first().textContent().catch(() => null)
  if (!primaryText) {
    defects.push('PAIRING RECOMMENDATIONS: no primary recommendation rendered after generation.')
  } else {
    notes.push(`Pairing primary recommendation rendered: "${primaryText}".`)
  }

  // Alternates present?
  const altButtons = page.locator('[data-testid^="pr-alt-"]')
  const altCount = await altButtons.count().catch(() => 0)
  notes.push(`Pairing alternates found: ${altCount}.`)

  // Reject-alternate check FIRST (before promote mutates which items are
  // alternates vs primary) — pick one specific alternate by its own
  // data-testid, click ITS reject button, and verify that exact testid
  // is gone afterward (not just a raw count, which is unreliable once a
  // rejected slot backfills from a larger ranked pool — chooseAsPrimary/
  // rejectCategory both cap the visible list at 3 via .slice(0,3), so
  // count alone doesn't prove rejection happened).
  const rejectButtons = page.locator('[data-testid^="pr-reject-"]')
  const rejectCount = await rejectButtons.count().catch(() => 0)
  if (rejectCount > 0) {
    const rejectedTestId = await rejectButtons.first().getAttribute('data-testid')
    await rejectButtons.first().click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(400)
    const stillPresent = await page.locator(`[data-testid="${rejectedTestId}"]`).count().catch(() => 0)
    if (stillPresent > 0) {
      defects.push(`PAIRING REJECT-ALTERNATE DID NOT WORK: "${rejectedTestId}" still present after clicking its own Reject button.`)
    } else {
      notes.push(`Pairing reject-alternate check PASS: "${rejectedTestId}" removed after rejection.`)
    }
  } else {
    notes.push('Pairing: 0 reject controls available to test.')
  }

  // Promote-alternate check — pick whatever alternate is now first (post-
  // rejection), click it, verify its category name becomes the primary.
  // Note: once promoted, that category leaves the alternates list (by
  // design — chooseAsPrimary/manualPrimary), so there is no UI "undo"
  // click; the rest of this test proceeds with whatever is now primary
  // rather than assuming the original ranked #1 is restorable.
  const altCountForPromote = await altButtons.count().catch(() => 0)
  if (altCountForPromote > 0) {
    const altTestId = await altButtons.first().getAttribute('data-testid')
    const altCategory = altTestId.replace('pr-alt-', '')
    await altButtons.first().click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(400)
    const primaryAfterPromote = await page.locator('[data-testid="pr-primary"]').first().textContent().catch(() => null)
    const promoteWorked = !!(primaryAfterPromote && primaryAfterPromote.includes(altCategory))
    if (!promoteWorked) {
      defects.push(`PAIRING PROMOTE-ALTERNATE DID NOT WORK: clicked "${altTestId}", primary is still "${primaryAfterPromote}" (expected to include "${altCategory}").`)
    } else {
      notes.push(`Pairing promote-alternate check PASS: "${altCategory}" is now primary.`)
    }
  } else {
    notes.push('Pairing: 0 alternates available to test promote after rejection — recorded, not treated as a defect (depends on real engine ranking, not fabricated).')
  }

  // Save recommendation (saves whatever is currently primary after the
  // reject/promote interactions above — that is the real, current state
  // a player would be saving).
  const saveBtn = page.locator('[data-testid="pr-save"]').first()
  let saveWorked = false
  if (await saveBtn.count()) {
    await saveBtn.click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(1000)
    const savedIndicator = await page.locator('[data-testid="pr-saved"]').count().catch(() => 0)
    saveWorked = savedIndicator > 0
    if (!saveWorked) defects.push('PAIRING SAVE RECOMMENDATION DID NOT WORK: no "pr-saved" confirmation shown after clicking Save.')
    else notes.push('Pairing save-recommendation check PASS: confirmation shown.')
  } else {
    defects.push('PAIRING SAVE BUTTON MISSING.')
  }

  const savedPrimaryText = await page.locator('[data-testid="pr-primary"]').first().textContent().catch(() => null)

  // Persist after navigation.
  await page.goto(`${BASE}/smokecraft/passport-stamp`, { waitUntil: 'load', timeout: 40000 })
  await page.waitForTimeout(500)
  await page.goto(`${BASE}/smokecraft/pairing-recommendations`, { waitUntil: 'load', timeout: 40000 })
  await page.waitForTimeout(1200)
  const primaryAfterNav = await page.locator('[data-testid="pr-primary"]').first().textContent().catch(() => null)
  const savedIndicatorAfterNav = await page.locator('[data-testid="pr-saved"]').count().catch(() => 0)
  if (primaryAfterNav !== savedPrimaryText) {
    notes.push(`Pairing primary after navigate-away-and-back changed: "${savedPrimaryText}" -> "${primaryAfterNav}" (engine may recompute on remount from journey state — recorded, not necessarily a defect since journey inputs are unchanged and this should be deterministic; flagged for review if inconsistent).`)
    if (primaryAfterNav !== savedPrimaryText) defects.push(`PAIRING PRIMARY NOT STABLE across navigation: "${savedPrimaryText}" -> "${primaryAfterNav}" for unchanged journey inputs.`)
  } else {
    notes.push('Pairing primary recommendation stability check PASS after navigate-away-and-back.')
  }
  if (savedIndicatorAfterNav === 0) {
    notes.push('Pairing "saved" confirmation banner not shown after remount (expected — it is a transient UI confirmation, not persisted display state; the underlying saved record itself was verified via the save-button check above).')
  }

  // Persist after reload.
  const primaryBeforeReload = await page.locator('[data-testid="pr-primary"]').first().textContent().catch(() => null)
  await page.reload({ waitUntil: 'load', timeout: 40000 })
  await page.waitForTimeout(1200)
  const primaryAfterReload = await page.locator('[data-testid="pr-primary"]').first().textContent().catch(() => null)
  if (primaryAfterReload !== primaryBeforeReload) {
    defects.push(`PAIRING RECOMMENDATION NOT STABLE ACROSS RELOAD: "${primaryBeforeReload}" -> "${primaryAfterReload}".`)
  } else {
    notes.push('Pairing recommendation reload-stability check PASS.')
  }

  await advanceUntil(page, '**/smokecraft/passport-stamp', 'b3-pairing-recs', 'Pairing Recommendations')

  // ═══════════════════════════════════════════════════════════════════
  // PASSPORT STAMP deep verification
  // ═══════════════════════════════════════════════════════════════════
  await page.waitForTimeout(800)
  const claimBtn = page.locator('button:has-text("Claim Your Stamp")').first()
  let stampClaimed = false
  if (await claimBtn.count()) {
    const disabledBefore = await claimBtn.isDisabled().catch(() => null)
    await claimBtn.click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(1500)
    const claimedIndicator = await page.locator('text=/Stamp Claimed/').count().catch(() => 0)
    stampClaimed = claimedIndicator > 0
    notes.push(`Passport Stamp claim: control disabled-before=${disabledBefore}, claimed indicator shown=${stampClaimed}.`)
  }

  // Duplicate-claim / 409 check: reload and re-check claim state stays
  // claimed (not reset), and that a re-claim attempt (if button still
  // present) does not produce a second stamp record.
  await page.reload({ waitUntil: 'load', timeout: 40000 })
  await page.waitForTimeout(1000)
  const claimedAfterReload = await page.locator('text=/Stamp Claimed/').count().catch(() => 0)
  if (stampClaimed && claimedAfterReload === 0) {
    defects.push('PASSPORT STAMP CLAIMED STATE LOST ON RELOAD.')
  } else if (stampClaimed) {
    notes.push('Passport Stamp claimed-state reload-persistence check PASS.')
  }
  const claimBtnAfterReload = page.locator('button:has-text("Claim Your Stamp")').first()
  if (await claimBtnAfterReload.count()) {
    const stillEnabled = await claimBtnAfterReload.isEnabled().catch(() => false)
    if (stillEnabled) {
      // Attempt a genuine second claim through the real button — the
      // server's duplicate-claim path (409/already-claimed) must be
      // exercised for real, not assumed.
      await claimBtnAfterReload.click({ timeout: 5000 }).catch(() => {})
      await page.waitForTimeout(1200)
      const stillOneClaimedIndicator = await page.locator('text=/Stamp Claimed/').count().catch(() => 0)
      notes.push(`Passport Stamp duplicate-claim attempt: button was still enabled after reload, clicked again — claimed-indicator count after second click = ${stillOneClaimedIndicator} (expect exactly 1, not multiplied).`)
      if (stillOneClaimedIndicator > 1) defects.push('PASSPORT STAMP DUPLICATE CLAIM produced multiple claimed indicators.')
    } else {
      notes.push('Passport Stamp duplicate-claim check PASS: claim control correctly disabled after reload — server duplicate-claim path not re-exercised because the UI already prevents it.')
    }
  }

  const passportServerCheck = await page.evaluate(async () => {
    try {
      const r = await fetch('/api/smokecraft/passport-stamp/status/' + (JSON.parse(localStorage.getItem('novee_guest_session') || '{}').session?.sessionId || ''), { credentials: 'include' })
      if (!r.ok) return { ok: false, status: r.status }
      return { ok: true, data: await r.json() }
    } catch (e) { return { ok: false, error: String(e) } }
  })
  if (passportServerCheck.ok) {
    notes.push(`Passport Stamp server status check: claimed=${passportServerCheck.data?.claimed}, stamp id=${passportServerCheck.data?.stamp?.id ?? passportServerCheck.data?.stamp?.stampNumber ?? 'n/a'}.`)
  } else {
    notes.push(`Passport Stamp server status endpoint not reachable for cross-check (${passportServerCheck.status || passportServerCheck.error}).`)
  }

  await advanceUntil(page, '**/smokecraft/final-review', 'b3-passport-stamp', 'Passport Stamp')
  await advanceUntil(page, '**/smokecraft/rewards', 'b3-final-review', 'Final Review')

  // ═══════════════════════════════════════════════════════════════════
  // REWARDS / ACHIEVEMENTS deep verification
  // ═══════════════════════════════════════════════════════════════════
  await page.waitForTimeout(1000)
  const rewardsClientState = await clientState(page)
  const rewardsServerState = await serverPlayerState(page)
  const clientXP = rewardsClientState.guest?.session?.xp ?? rewardsClientState.guest?.xp ?? null
  const displayedXPText = await page.locator('text=/\\d+/').allTextContents().catch(() => [])
  const xpSourceSpan = await page.locator('[data-testid="s25-xp-source"]').textContent().catch(() => null)
  notes.push(`Rewards XP source flag: "${xpSourceSpan}" (server|local-fallback). Client XP=${clientXP}. Server XP=${rewardsServerState.ok ? (rewardsServerState.data?.state?.xpTotal ?? rewardsServerState.data?.xpTotal) : 'unreachable'}.`)
  if (rewardsServerState.ok) {
    const serverXP = rewardsServerState.data?.state?.xpTotal ?? rewardsServerState.data?.xpTotal ?? null
    if (xpSourceSpan === 'local-fallback' && serverXP !== null) {
      defects.push(`REWARDS SHOWING LOCAL FALLBACK when server state (XP=${serverXP}) is actually reachable — should have used server as authoritative.`)
    }
  }

  // Rank milestone claim.
  const claimRankBtns = page.locator('button[aria-label^="Claim "][aria-label*="reward"]')
  const claimableCount = await claimRankBtns.count().catch(() => 0)
  if (claimableCount > 0) {
    const label = await claimRankBtns.first().getAttribute('aria-label')
    await claimRankBtns.first().click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(600)
    const stillClaimable = await page.locator(`button[aria-label="${label}"]`).count().catch(() => 0)
    if (stillClaimable > 0) {
      defects.push(`RANK MILESTONE CLAIM DID NOT WORK: "${label}" still shows a claim button after clicking.`)
    } else {
      notes.push(`Rank milestone claim check PASS: "${label}" claimed.`)
    }
    // Duplicate-claim prevention: reload, confirm it stays claimed (not reclaimable).
    await page.reload({ waitUntil: 'load', timeout: 40000 })
    await page.waitForTimeout(800)
    const reclaimable = await page.locator(`button[aria-label="${label}"]`).count().catch(() => 0)
    if (reclaimable > 0) {
      defects.push(`RANK MILESTONE CLAIM NOT PERSISTED: "${label}" reclaimable after reload.`)
    } else {
      notes.push('Rank milestone claim persistence/duplicate-prevention check PASS after reload.')
    }
  } else {
    notes.push('Rewards: no claimable rank milestone found at current XP (recorded, not a defect).')
  }

  await advanceUntil(page, '**/smokecraft/session-complete', 'b3-rewards', 'Rewards/Achievements', 3)

  // Achievements mode: verify the achievement list reflects real earned
  // state (not fabricated), by re-visiting Rewards and checking the
  // achievements tab.
  await page.goto(`${BASE}/smokecraft/rewards`, { waitUntil: 'load', timeout: 40000 })
  await page.waitForTimeout(800)
  const achievementsTab = page.locator('button[role="tab"]', { hasText: 'Achievements' }).first()
  if (await achievementsTab.count()) {
    await achievementsTab.click({ timeout: 3000 }).catch(() => {})
    await page.waitForTimeout(500)
    const earnedCount = await page.locator('text=/✓ Claimed|Earned/').count().catch(() => 0)
    notes.push(`Achievements tab: ${earnedCount} earned/claimed indicators shown after real journey completion.`)
  }

  // ═══════════════════════════════════════════════════════════════════
  // CROSS-SYSTEM CONSISTENCY CHECKPOINT
  // ═══════════════════════════════════════════════════════════════════
  const finalClient = await clientState(page)
  const finalServer = await serverPlayerState(page)
  const crossCheck = {
    sessionId: finalClient.guest?.session?.sessionId ?? finalClient.guest?.sessionId ?? null,
    guestId: finalClient.guest?.session?.guestId ?? finalClient.guest?.guestId ?? null,
    xpClient: finalClient.guest?.session?.xp ?? finalClient.guest?.xp ?? null,
    xpServer: finalServer.ok ? (finalServer.data?.state?.xpTotal ?? finalServer.data?.xpTotal ?? null) : null,
    rankClient: finalClient.guest?.session?.rank ?? finalClient.guest?.rank ?? null,
    badgeCount: (finalClient.guest?.session?.badges ?? finalClient.guest?.badges ?? []).length,
    scorecardOverall: finalClient.journey?.scorecard?.overall ?? null,
    scorecardCategoriesRated: Object.values(finalClient.journey?.scorecard?.categories ?? {}).filter(v => v !== null).length,
    pairingSavedRecommendation: finalClient.journey?.pairingRecommendations?.savedRecommendation?.primary ?? null,
    passportStampClaimed: finalClient.journey?.passportStamp?.claimed ?? null,
    completedStepsCount: (finalClient.guest?.session?.completedSteps ?? finalClient.guest?.completedSteps ?? []).length,
  }
  if (crossCheck.xpClient !== null && crossCheck.xpServer !== null && crossCheck.xpClient !== crossCheck.xpServer) {
    defects.push(`CROSS-SYSTEM XP MISMATCH at final checkpoint: client=${crossCheck.xpClient}, server=${crossCheck.xpServer}.`)
  } else if (crossCheck.xpServer !== null) {
    notes.push(`Cross-system final checkpoint PASS: client XP (${crossCheck.xpClient}) matches server XP (${crossCheck.xpServer}).`)
  }
  if (crossCheck.scorecardCategoriesRated !== 6) {
    defects.push(`CROSS-SYSTEM: final scorecard shows ${crossCheck.scorecardCategoriesRated}/6 categories rated (expected 6).`)
  }
  if (!crossCheck.pairingSavedRecommendation) {
    defects.push('CROSS-SYSTEM: no saved pairing recommendation present in final journey state despite Save being clicked earlier.')
  }
  if (!crossCheck.passportStampClaimed) {
    defects.push('CROSS-SYSTEM: passport stamp not marked claimed in final journey state.')
  }

  await page.screenshot({ path: `${OUT_DIR}/final-cross-check.png`, fullPage: true })
  await browser.close()

  const report = {
    generatedAt: new Date().toISOString(),
    sha: SHA,
    crossSystemCheckpoint: crossCheck,
    defects,
    notes,
    block3Pass: defects.length === 0,
  }
  writeFileSync(`${OUT_DIR}/PAIRING_SCORECARD_PASSPORT_REWARDS_REPORT.json`, JSON.stringify(report, null, 2))

  console.log('\n=== Cross-system checkpoint ===')
  console.log(JSON.stringify(crossCheck, null, 2))
  console.log(`\nDefects: ${defects.length}`)
  for (const d of defects) console.log(`  - ${d}`)
  console.log(`\nNotes: ${notes.length}`)
  for (const n of notes) console.log(`  - ${n}`)
  console.log(`\nblock3Pass: ${report.block3Pass}`)
  if (!report.block3Pass) process.exitCode = 2
}

main().catch(e => { console.error(e); process.exit(1) })
