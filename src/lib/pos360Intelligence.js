/**
 * POS360 Disruptor Engine calculations.
 * Reads real local state from pos3Service.js (tables/tickets/staff) and
 * combines it with the local demo data in pos360DemoData.js for engines
 * that have no backend yet (guest memory, pairing rules, leak thresholds,
 * shift coach, integration health). All functions here operate on real or
 * demo *local* state — none of them call a real backend or AI model.
 */

import { getTables, getTickets, getStaff, ticketTotals } from '../services/pos3/pos3Service.js'
import {
  GUEST_MEMORY, PAIRING_RULES, LEAK_THRESHOLDS, SHIFT_COACH_NOTES, STAFF_PROFILE, BRIDGE_HEALTH,
} from '../data/pos360DemoData.js'

/** Guest Memory Engine — demo guest profile + recommended greeting script for a table, or null if none on file. */
export function getGuestMemory(tableId) {
  return GUEST_MEMORY[tableId] || null
}

/** Table Intelligence Score — 0-100 score + risk/opportunity/action for one table, from real status/guest/ticket data. */
export function calculateTableIntelligenceScore(table) {
  let score = 60
  if (table.status === 'open') score += 20
  if (table.status === 'needsService') score -= 25
  if (table.vip) score += 10
  if (table.guests && table.guests >= 4) score += 5
  score = Math.max(0, Math.min(100, score))

  const risk = table.status === 'needsService' ? 'High' : score < 60 ? 'Medium' : 'Low'
  const guest = getGuestMemory(table.id)
  const opportunity = (table.vip || guest?.vip) ? 'High' : score >= 70 ? 'Medium' : 'Low'
  const action = table.status === 'needsService'
    ? 'Send a server to check in now — this table is flagged for attention.'
    : guest
      ? `Offer ${guest.favoriteDrink || 'their usual drink'}${guest.favoriteCigar ? ` with a ${guest.favoriteCigar} pairing` : ''} and check drink timing.`
      : 'Confirm drink/order timing and watch for an upsell opening.'

  return { score, risk, opportunity, action }
}

/** Staff Ownership Intelligence — table counts, workload, VIP/upsell scores, open revenue per staff member. */
export function calculateStaffOwnership() {
  const tables = getTables()
  const tickets = getTickets()
  return getStaff().map((s) => {
    const owned = tables.filter((t) => t.serverName === s.name)
    const openRevenue = tickets
      .filter((t) => owned.some((o) => o.id === t.tableId) && t.status !== 'paid')
      .reduce((sum, t) => sum + ticketTotals(t).total, 0)
    const profile = STAFF_PROFILE[s.name] || { role: s.role || 'Staff', vipHandlingScore: 70, upsellScore: 70, riskFlags: [] }
    const workload = owned.length >= 4 ? 'High' : owned.length >= 2 ? 'Medium' : 'Low'
    return {
      staffName: s.name, role: profile.role, tableCount: owned.length, workload, openRevenue,
      vipHandlingScore: profile.vipHandlingScore, upsellScore: profile.upsellScore, riskFlags: profile.riskFlags,
    }
  })
}

/** Experience Flow Alerts — derived from real table status + VIP/guest-memory context. */
export function generateExperienceAlerts(tableId = null) {
  const tables = getTables().filter((t) => !tableId || t.id === tableId)
  const alerts = []
  tables.forEach((t) => {
    if (t.status === 'needsService') {
      alerts.push({ tableId: t.id, severity: 'high', message: `${t.name || t.id} flagged "needs attention" — send a server now.` })
    }
    if ((t.vip || getGuestMemory(t.id)?.vip) && t.status !== 'open') {
      alerts.push({ tableId: t.id, severity: 'medium', message: `VIP table ${t.name || t.id} is occupied — confirm white-glove service is active.` })
    }
  })
  return alerts
}

/** Pairing Revenue Engine — pairing suggestions for a ticket's current items, using local rule data. */
export function generatePairingRecommendations(ticket) {
  if (!ticket?.items?.length) return []
  const names = ticket.items.map((i) => i.name)
  return PAIRING_RULES
    .filter((r) => names.includes(r.itemName))
    .map((r) => ({ basedOn: r.itemName, suggest: r.suggest, liftUsd: r.liftUsd, confidencePct: r.confidencePct, reason: r.reason }))
}

/** Revenue Leak Detector — heuristic flags + an estimated-dollar summary from real ticket age + demo thresholds. */
export function detectRevenueLeaks() {
  const now = Date.now()
  const tickets = getTickets().filter((t) => t.status !== 'paid')
  const leaks = []
  tickets.forEach((t) => {
    const ageMin = (now - (t.createdAt || now)) / 60000
    if (ageMin >= LEAK_THRESHOLDS.idleTicketMinutes && t.status === 'open') {
      leaks.push({ ticketId: t.id, tableId: t.tableId, type: 'idle_ticket', ageMin: Math.round(ageMin) })
    }
  })
  const estimatedUsd = leaks.length * LEAK_THRESHOLDS.estimatedLeakPerIdleTicket
  return {
    leaks,
    estimatedUsd,
    priority: leaks.length >= 3 ? 'High' : leaks.length >= 1 ? 'Medium' : 'Low',
    cause: leaks.length ? 'delayed drink service + missed pairing offers' : 'no leaks detected',
    fix: leaks.length ? 'Add bartender/floor support during the next peak window.' : 'No action needed right now.',
  }
}

/** AI Shift Coach — templated local summary; not a real AI/LLM call. */
export function generateShiftCoachSummary() {
  const ownership = calculateStaffOwnership()
  const topPerformer = [...ownership].sort((a, b) => b.openRevenue - a.openRevenue)[0]
  const tables = getTables()
  const highestRevenueTable = topPerformer ? tables.find((t) => t.serverName === topPerformer.staffName) : null
  const alerts = generateExperienceAlerts()
  return {
    topPerformer: topPerformer?.staffName || 'No staff data yet',
    highestRevenueTable: highestRevenueTable ? (highestRevenueTable.name || highestRevenueTable.id) : 'N/A',
    missedOpportunity: alerts.length
      ? `Pairing offers not confirmed on ${alerts.length} flagged table${alerts.length === 1 ? '' : 's'}.`
      : 'No missed-opportunity alerts right now.',
    tomorrowsFix: ownership.some((s) => s.workload === 'High')
      ? 'Pre-assign extra floor support before peak hour — at least one staff member is overloaded.'
      : 'Staffing balance looks healthy — no pre-shift changes needed.',
    note: SHIFT_COACH_NOTES[topPerformer?.staffName] || 'Keep up steady table check-ins this shift.',
  }
}

/** POS360 Bridge Score — composite 0-100 score of real table/staff/ticket health + demo integration metrics. */
export function calculatePOS360BridgeScore() {
  const tables = getTables()
  const tableAvg = tables.length
    ? tables.reduce((sum, t) => sum + calculateTableIntelligenceScore(t).score, 0) / tables.length
    : 0
  const leakPenalty = Math.min(20, detectRevenueLeaks().leaks.length * 4)
  const score = Math.max(0, Math.round(tableAvg - leakPenalty))
  return { score, ...BRIDGE_HEALTH }
}
