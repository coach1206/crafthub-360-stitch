import { SCORE_CATEGORIES, MAX_TOTAL_SCORE } from './smokecraftScoring.js'

// Phase 5 — Gold Box Rules. Real, honest rulebook content for the SmokeCraft
// 360 challenge. Every scoring/badge figure below is read directly from
// smokecraftScoring.js (the real Phase 11 evaluator) rather than invented —
// this module only formats that data into rule-card copy plus the
// etiquette/compliance/event/purchase text the audit found missing.

export const GOLD_BOX_RULE_VERSION = '1.0'

export const SCORING_OVERVIEW = {
  maxTotalScore: MAX_TOTAL_SCORE,
  categories: SCORE_CATEGORIES.map(c => ({ id: c.id, label: c.label, maxPoints: c.maxPoints, phase: c.phase })),
  note: 'Points are awarded only for steps you actually complete in this session — nothing is pre-filled or simulated.',
}

export const BADGE_OVERVIEW = {
  note: 'Badges unlock honestly as you complete real protocol steps. Your live badge list is on the Scorecard.',
  examples: [
    'Gold Box Finisher — unlocked the moment you accept these rules.',
    'Mentor Approved, Seed & Soil Explorer, Pairing Pro, and others unlock later in the journey as you complete each phase.',
  ],
}

export const PASSPORT_STAMP_OVERVIEW = {
  note: 'A Passport Stamp is earned once your tasting notes and final review are submitted (Phase 12). It records your real selections — cigar, wrapper, strength, and origin — not placeholder data.',
}

export const COMPLETED_SESSION_DEFINITION =
  'A SmokeCraft session is considered "completed" once you have a captured profile, a selected cigar format, a Seed & Soil pairing, mentor selections, accepted these Gold Box Rules, recorded tasting notes for all three thirds, and submitted a final scorecard review.'

export const EVENT_CHALLENGE_RULES = [
  'Event Challenge standings are calculated only from scoring you actually earn during this session — no scores are pre-set or boosted.',
  'Leaderboard position can change in real time as other guests complete their sessions.',
  'Staff may award a recognized prize for top standings at venue discretion; this app does not process or guarantee any prize fulfillment.',
]

export const LOUNGE_ETIQUETTE_RULES = [
  'Follow staff instructions on cigar handling, cutting, and lighting at all times.',
  'Be mindful of smoke and space for other guests in shared lounge seating.',
  'Treat mentors and staff with respect — they are volunteering their expertise for your experience.',
  'Dispose of ash and cigar remnants only in provided ashtrays.',
]

export const NO_FAKE_SCORING_RULE =
  'No score, badge, or stamp in this app can be manually edited, granted, or inflated outside of completing the real corresponding step. If a step is not finished, that category honestly shows 0 points or "pending" — nothing is faked to look complete.'

export const AGE_COMPLIANCE_RULE =
  'Cigar tasting requires guests to confirm they meet the venue\'s legal minimum age, as captured during profile enrollment (Phase 1). This app records that confirmation for session purposes only — it does not perform legal age verification or claim to satisfy any regulatory requirement.'

export const VENUE_COMPLIANCE_RULE =
  'Participation is subject to the physical venue\'s own house rules and applicable local law, which this app does not enforce or guarantee compliance with. Staff retain final authority over conduct in the lounge.'

export const PURCHASE_RULES = [
  'Any cigar purchase or POS ticket addition referenced during this challenge is requested through staff, not completed automatically by this app.',
  'Inventory and pricing shown reflect the local/demo POS3 catalog snapshot and may not match the final ticket staff prepares for you.',
  'No payment is processed and no order is finalized from within SmokeCraft.',
]

export const BACKEND_PENDING_NOTE =
  'Accept Rules, View Scoring, and Start Session are recorded in your local session only. Cross-device sync, staff notifications, and POS ticket creation referenced in these rules are Backend Pending — not yet wired to a live server.'
