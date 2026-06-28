/**
 * POS360 Disruptor Engine demo/seed data.
 * Local-only placeholders for engines that have no backend yet — guest CRM,
 * pairing rules, leak heuristics, shift-coach notes, integration health.
 * Real table/staff/ticket data still comes from pos3Service.js; this file
 * only adds the extra context those engines need that the seed data doesn't carry.
 */

/** Guest Memory Engine — demo guest profiles keyed by table id. No CRM backend exists yet. */
export const GUEST_MEMORY = {
  T1: {
    name: 'Marcus Webb', vip: true, visits: 14, lastVisit: '7 days ago',
    seatingPref: 'Corner booth', favoriteDrink: 'Macallan 18 neat', favoriteCigar: 'Padron 1964',
    preferredServer: 'Jordan Smith', notes: 'Celebrates anniversary in June.',
    script: 'Welcome back, Marcus. Want your usual Macallan 18 with a Padron pairing?',
  },
  T2: {
    name: 'Dana Reyes', vip: false, visits: 6, lastVisit: '4 days ago',
    seatingPref: 'Patio', favoriteDrink: 'Old Fashioned', favoriteCigar: 'Arturo Fuente Hemingway',
    preferredServer: 'Mara Lopez', notes: 'Allergic to peanuts.',
    script: 'Welcome back, Dana — patio table tonight, and an Old Fashioned to start?',
  },
  T4: {
    name: 'The Whitfield Group', vip: true, visits: 3, lastVisit: '18 days ago',
    seatingPref: 'Private lounge', favoriteDrink: 'Cognac flight', favoriteCigar: 'Cohiba Robusto',
    preferredServer: 'Devon Park', notes: 'Corporate account, usually 4-6 guests.',
    script: 'Welcome back — should we set up the private lounge and the usual cognac flight?',
  },
}

/** Pairing Revenue Engine — demo cigar/drink/food pairing rules. Not derived from real sales data yet. */
export const PAIRING_RULES = [
  { itemName: 'Padron 1964', suggest: 'Macallan 18', reason: 'matches guest history and current venue special', liftUsd: 38, confidencePct: 87 },
  { itemName: 'Old Fashioned', suggest: 'Arturo Fuente Hemingway', reason: 'frequently ordered together this month', liftUsd: 24, confidencePct: 72 },
  { itemName: 'Macallan 18 Year', suggest: 'Padron 1964', reason: 'matches guest history and current venue special', liftUsd: 38, confidencePct: 87 },
  { itemName: 'Negroni', suggest: 'Cohiba Robusto', reason: 'pairs with current happy-hour cigar promo', liftUsd: 19, confidencePct: 64 },
]

/** Revenue Leak Detector — demo heuristic thresholds (minutes/percent), not real POS revenue feed. */
export const LEAK_THRESHOLDS = {
  idleTicketMinutes: 25,
  longTableHoldMinutes: 110,
  lowCheckAvgPct: 0.6,
  estimatedLeakPerIdleTicket: 80,
}

/** AI Shift Coach — demo templated coaching notes per staff name. Not a real AI call. */
export const SHIFT_COACH_NOTES = {
  'Jordan Smith': 'Strong table turn pace tonight — keep checking in on Section A every 20 min.',
  'Mara Lopez': 'Two tables flagged idle over 25 min — prioritize a check-in before drink orders go stale.',
  'Devon Park': 'Bar queue building near peak hour — pull in floor support if it grows past 3 tickets.',
}

/** Staff Ownership Intelligence — demo role/workload metadata not present in POS3_STAFF seed data. */
export const STAFF_PROFILE = {
  'Jordan Smith': { role: 'Floor Supervisor', vipHandlingScore: 92, upsellScore: 81, riskFlags: [] },
  'Mara Lopez':   { role: 'Server', vipHandlingScore: 74, upsellScore: 88, riskFlags: ['2 idle tickets'] },
  'Devon Park':   { role: 'Bartender', vipHandlingScore: 80, upsellScore: 69, riskFlags: [] },
}

/** POS360 Bridge Score Engine — demo integration health metrics. No live provider webhooks exist yet. */
export const BRIDGE_HEALTH = {
  mappingQualityPct: 91,
  webhookDelaySec: 4.2,
  failedJobs24h: 1,
  paymentReconciliationPct: 96,
  tableMappingPct: 88,
  staffMappingPct: 79,
  mode: 'Demo Mode',
}
