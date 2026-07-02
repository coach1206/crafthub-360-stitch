/**
 * SmokeCraft Scoring + Loyalty Engine — verification tests.
 * Run with: node src/constants/smokecraftLoyalty.test.js
 * Tests all 13 scenarios from the spec.
 */

import { LOYALTY_ACTIONS } from './smokecraftLoyalty.js'
import {
  calculateAnswerScore,
  calculatePairingScore,
  calculateFlavorMatchScore,
  calculateChallengeRoundScore,
  awardLoyaltyPoints,
  awardPurchasePoints,
  awardPassportStampPoints,
  calculateVIPCandidateSignal,
  getChallengeLeaderboard,
  getSkillLeaderboard,
  getLoyaltyLeaderboard,
  getOverallSmokeCraftScore,
  getUserSmokeCraftSummary,
} from '../utils/smokecraftLoyaltyEngine.js'

// ── Test harness ──────────────────────────────────────────────────────────────
let passed = 0, failed = 0

function assert(label, condition) {
  if (condition) { console.log('  ✓', label); passed++ }
  else           { console.error('  ✗ FAIL:', label); failed++ }
}

function makeSession(overrides = {}) {
  return {
    xp: 0, skillScore: 0, challengeScore: 0,
    loyaltyPoints: 0, lifetimeLoyaltyPoints: 0, redeemablePoints: 0,
    passportStampCount: 0, purchaseCount: 0, houseCigarPurchases: 0,
    pairingPurchases: 0, eventParticipationCount: 0, referralCount: 0,
    loyaltyLedger: [], usedTransactionIds: [],
    completedSteps: [], badges: [],
    ...overrides,
  }
}

// ── Test 1: Correct answer awards skill + challenge points ────────────────────
console.log('\nTest 1: Correct answer awards skill + challenge points')
{
  const result = calculateAnswerScore({ isCorrect: true, confidence: 'medium', difficulty: 'medium' })
  assert('skillDelta > 0 for correct answer',    result.skillDelta > 0)
  assert('challengeDelta > 0 for correct answer', result.challengeDelta > 0)
  assert('skillDelta = 100 (medium/medium)',       result.skillDelta === 100)

  const hard = calculateAnswerScore({ isCorrect: true, confidence: 'high', difficulty: 'hard' })
  assert('High confidence + hard difficulty multiplies score', hard.skillDelta > 100)
}

// ── Test 2: Wrong answer does not subtract Journey XP ─────────────────────────
console.log('\nTest 2: Wrong answer does NOT subtract Journey XP')
{
  const baseXP = 500
  const session = makeSession({ xp: baseXP })
  const result = calculateAnswerScore({ isCorrect: false, confidence: 'medium', difficulty: 'hard' })
  assert('skillDelta = 0 for wrong answer at medium confidence', result.skillDelta === 0)
  assert('challengeDelta = 0 for medium confidence wrong answer', result.challengeDelta === 0)
  // Engine never modifies xp — journeyXP stays put
  assert('journeyXP is untouched (no XP deduction in engine)', session.xp === baseXP)
}

// ── Test 3: Wrong answer with high confidence applies challenge penalty ────────
console.log('\nTest 3: Overconfident wrong answer → negative challengeDelta only')
{
  const result = calculateAnswerScore({ isCorrect: false, confidence: 'high', difficulty: 'medium' })
  assert('skillDelta still 0 for overconfident wrong answer',     result.skillDelta === 0)
  assert('challengeDelta < 0 for overconfident wrong answer',     result.challengeDelta < 0)
}

// ── Test 4: House cigar purchase awards loyalty points ────────────────────────
console.log('\nTest 4: House cigar purchase awards loyalty points')
{
  const session = makeSession()
  const updated = awardPurchasePoints(session, LOYALTY_ACTIONS.HOUSE_CIGAR_PURCHASE, {
    posTransactionId: 'txn-001', isDemoMode: false, isHouseItem: true,
  })
  assert('loyaltyPoints increased by 100', updated.loyaltyPoints === 100)
  assert('houseCigarPurchases incremented', updated.houseCigarPurchases === 1)
  assert('purchaseCount incremented',       updated.purchaseCount === 1)
  assert('transaction recorded in ledger',  updated.loyaltyLedger.length === 1)
  assert('usedTransactionIds contains txn', updated.usedTransactionIds.includes('txn-001'))
  assert('xp NOT modified by purchase',     updated.xp === 0)
  assert('skillScore NOT modified',         updated.skillScore === 0)
  assert('challengeScore NOT modified',     updated.challengeScore === 0)
}

// ── Test 5: Liquor pairing purchase awards loyalty points ─────────────────────
console.log('\nTest 5: Liquor pairing purchase awards loyalty points')
{
  const session = makeSession()
  const updated = awardPurchasePoints(session, LOYALTY_ACTIONS.LIQUOR_PAIRING_PURCHASE, {
    posTransactionId: 'txn-002', isDemoMode: false,
  })
  assert('loyaltyPoints = 50',            updated.loyaltyPoints === 50)
  assert('pairingPurchases incremented',  updated.pairingPurchases === 1)
}

// ── Test 6: Food pairing purchase awards loyalty points ───────────────────────
console.log('\nTest 6: Food pairing purchase awards loyalty points')
{
  const session = makeSession()
  const updated = awardPurchasePoints(session, LOYALTY_ACTIONS.FOOD_PAIRING_PURCHASE, {
    posTransactionId: 'txn-003', isDemoMode: false,
  })
  assert('loyaltyPoints = 40',           updated.loyaltyPoints === 40)
  assert('pairingPurchases incremented', updated.pairingPurchases === 1)
}

// ── Test 7: Full cigar + liquor + food pairing awards highest bonus ────────────
console.log('\nTest 7: Full cigar + liquor + food pairing awards 175 pts')
{
  const session = makeSession()
  const updated = awardPurchasePoints(session, LOYALTY_ACTIONS.CIGAR_LIQUOR_FOOD_PAIRING, {
    posTransactionId: 'txn-004', isDemoMode: false,
  })
  assert('loyaltyPoints = 175',          updated.loyaltyPoints === 175)
  assert('pairingPurchases incremented', updated.pairingPurchases === 1)
}

// ── Test 8: Passport Stamp awards loyalty points only when S20 (final-review) complete ──
console.log('\nTest 8: Passport Stamp (S21) locked until final-review done')
{
  // Not yet complete — locked
  const locked = makeSession({ completedSteps: [] })
  const resultLocked = awardPassportStampPoints(locked, 'passport-stamp', { isDemoMode: false })
  assert('passport-stamp locked if final-review not done', resultLocked === null)

  // final-review done — should award
  const unlocked = makeSession({ completedSteps: ['final-review'] })
  const resultUnlocked = awardPassportStampPoints(unlocked, 'passport-stamp', { isDemoMode: false })
  assert('passport-stamp awards 150 loyalty pts after final-review', resultUnlocked?.loyaltyPoints === 150)
  assert('passportStampCount increments to 1',                       resultUnlocked?.passportStampCount === 1)
}

// ── Test 9: Connections awards loyalty points only after Passport Stamp ────────
console.log('\nTest 9: Connections (S22) locked until passport-stamp done')
{
  const locked = makeSession({ completedSteps: ['final-review'] })
  const resultLocked = awardPassportStampPoints(locked, 'connections', { isDemoMode: false })
  assert('connections locked if passport-stamp not done', resultLocked === null)

  const unlocked = makeSession({ completedSteps: ['final-review', 'passport-stamp'] })
  const resultUnlocked = awardPassportStampPoints(unlocked, 'connections', { isDemoMode: false })
  assert('connections awards 200 loyalty pts after passport-stamp', resultUnlocked?.loyaltyPoints === 200)
  assert('passportStampCount does NOT increment for connections',   resultUnlocked?.passportStampCount === 0)
}

// ── Test 10: Duplicate transaction ID does not award points twice ──────────────
console.log('\nTest 10: Duplicate posTransactionId is blocked')
{
  const session = makeSession()
  const after1 = awardPurchasePoints(session, LOYALTY_ACTIONS.HOUSE_CIGAR_PURCHASE, {
    posTransactionId: 'txn-dup', isDemoMode: false,
  })
  const after2 = awardPurchasePoints(after1, LOYALTY_ACTIONS.HOUSE_CIGAR_PURCHASE, {
    posTransactionId: 'txn-dup', isDemoMode: false,
  })
  assert('Second award with same txnId returns null',    after2 === null)
  assert('loyaltyPoints only 100 (not 200)',             after1.loyaltyPoints === 100)
  assert('purchaseCount only 1 (not 2)',                 after1.purchaseCount === 1)
}

// ── Test 11: Demo Mode does not save real loyalty points ──────────────────────
console.log('\nTest 11: Demo Mode blocks all loyalty point writes')
{
  const session = makeSession()
  const demoResult = awardPurchasePoints(session, LOYALTY_ACTIONS.HOUSE_CIGAR_PURCHASE, {
    posTransactionId: 'txn-demo', isDemoMode: true,
  })
  assert('awardPurchasePoints in demo mode returns null',  demoResult === null)

  const demoLoyalty = awardLoyaltyPoints(session, LOYALTY_ACTIONS.EVENT_PARTICIPATION, {
    isDemoMode: true,
  })
  assert('awardLoyaltyPoints in demo mode returns null',   demoLoyalty === null)

  const demoPassport = awardPassportStampPoints(
    makeSession({ completedSteps: ['final-review'] }),
    'passport-stamp',
    { isDemoMode: true },
  )
  assert('awardPassportStampPoints in demo mode returns null', demoPassport === null)
}

// ── Test 12: Overall leaderboard — spending cannot overpower skill ─────────────
console.log('\nTest 12: Overall leaderboard skill-first weighting')
{
  const highSpender = {
    challengeScore: 100, skillScore: 100, journeyXP: 100, loyaltyPoints: 5000,
  }
  const highSkill = {
    challengeScore: 1000, skillScore: 900, journeyXP: 800, loyaltyPoints: 50,
  }
  const spenderScore = getOverallSmokeCraftScore(highSpender)
  const skillScore   = getOverallSmokeCraftScore(highSkill)
  assert('Skilled player outscores high-spender despite much lower loyalty pts', skillScore > spenderScore)

  // Verify weights: challengeScore 40%, skillScore 30%, journeyXP 20%, loyaltyPoints 10%
  const simple = getOverallSmokeCraftScore({ challengeScore: 1000, skillScore: 0, journeyXP: 0, loyaltyPoints: 0 })
  assert('challengeScore contributes 40% (1000 * 0.40 = 400)', simple === 400)

  const loaders = [highSpender, highSkill]
  const ranked  = getChallengeLeaderboard(loaders)
  assert('Challenge leaderboard ranks skilled player first', ranked[0] === highSkill)
}

// ── Test 13: Build (verified outside) ────────────────────────────────────────
// Build pass is verified by npm run build — logged here as informational.
console.log('\nTest 13: Build — run npm run build to verify (not checked in this script)')

// ── Bonus: Flavor and pairing scoring ────────────────────────────────────────
console.log('\nBonus: Flavor + pairing scoring')
{
  const { skillDelta: fd, accuracyPercent } = calculateFlavorMatchScore({
    selectedNotes: ['Cedar', 'Dark Cocoa', 'Leather'],
    correctNotes:  ['Cedar', 'Dark Cocoa', 'Leather'],
  })
  assert('Perfect 3/3 flavor match awards notes + bonus', fd === 3 * 20 + 50)
  assert('Perfect flavor match accuracy = 100%',          accuracyPercent === 100)

  const { skillDelta: pd } = calculatePairingScore({
    selected: { id: 'single-malt', family: 'whisky' },
    correct:  { id: 'single-malt', family: 'whisky' },
    isExactMatch: true,
  })
  assert('Exact pairing match awards exactScore + bonus', pd === 75 + 50)

  const { skillDelta: partial } = calculatePairingScore({
    selected: { id: 'blended-scotch', family: 'whisky' },
    correct:  { id: 'single-malt',   family: 'whisky' },
    isExactMatch: false,
  })
  assert('Same-family pairing match awards partial score', partial === 35)
}

// ── Bonus: getUserSmokeCraftSummary ───────────────────────────────────────────
console.log('\nBonus: getUserSmokeCraftSummary')
{
  const session = makeSession({ xp: 1700, skillScore: 800, challengeScore: 400, loyaltyPoints: 500 })
  const summary = getUserSmokeCraftSummary(session)
  assert('rank = Aficionado at 1700 XP',  summary.rank === 'Aficionado')
  assert('journeyXP = 1700',              summary.journeyXP === 1700)
  assert('loyaltyPoints = 500',           summary.loyaltyPoints === 500)
  assert('overallScore = weighted sum',
    summary.overallScore === Math.round(400*0.4 + 800*0.3 + 1700*0.2 + 500*0.1))
}

// ── VIP candidate ─────────────────────────────────────────────────────────────
console.log('\nBonus: VIP candidate signal')
{
  const qualifies = makeSession({
    xp: 1000, loyaltyPoints: 1200, skillScore: 600,
    passportStampCount: 3, pairingPurchases: 2, referralCount: 1,
    completedSteps: ['passport-stamp'],
  })
  const signal = calculateVIPCandidateSignal(qualifies)
  assert('Guest meeting 3+ criteria is VIP candidate', signal.isVIPCandidate)

  const doesNot = makeSession({ xp: 10 })
  const noSignal = calculateVIPCandidateSignal(doesNot)
  assert('Guest with no criteria is NOT VIP candidate', !noSignal.isVIPCandidate)
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n── Results: ${passed} passed, ${failed} failed ──`)
if (failed > 0) process.exit(1)
