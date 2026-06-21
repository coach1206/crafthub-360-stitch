/**
 * POS 3 Payment Service — totals math, cash payment completion, and honest
 * "not configured" stubs for card/split payment (matching the existing
 * /pos3/checkout Square/Clover/Toast/Stripe pattern — no faking success).
 */

import { emit, SYSTEMS, STATUS } from '../shared/opsEventBus.js'

const TAX_RATE = 0.085

/** Compute subtotal/tax/tip/total for a ticket. Non-taxable items skip tax. */
export function calcTotals(ticket, tipAmount = 0) {
  const items = (ticket?.items || []).filter((i) => !i.voided)
  const subtotal = items.reduce((s, i) => s + (i.comped ? 0 : i.price * i.qty), 0)
  const taxableSubtotal = items.reduce((s, i) => s + (i.comped ? 0 : (i.taxable !== false ? i.price * i.qty : 0)), 0)
  const tax = taxableSubtotal * TAX_RATE
  const tip = Number(tipAmount) || 0
  const total = subtotal + tax + tip
  return { subtotal, tax, tip, total }
}

export function startPayment(ticketId, method) {
  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'POS_PAYMENT_STARTED',
    commandType: 'POS_PAYMENT_STARTED',
    ticketId,
    provider: method,
    status: STATUS.PENDING,
    payload: { method, timestamp: Date.now() },
  })
  return { ticketId, method, startedAt: Date.now() }
}

/** Completes a cash payment. Returns {success, changeDue, receipt-input}. */
export function completeCashPayment(ticketId, cashTendered, tipAmount = 0, ticket = null) {
  const totals = calcTotals(ticket, tipAmount)
  const tendered = Number(cashTendered) || 0

  if (tendered < totals.total) {
    return {
      success: false,
      changeDue: 0,
      error: 'Cash tendered is less than the total due.',
      totals,
    }
  }

  const changeDue = +(tendered - totals.total).toFixed(2)

  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'POS_PAYMENT_COMPLETED',
    commandType: 'POS_PAYMENT_COMPLETED',
    ticketId,
    tableId: ticket?.tableId,
    sectionId: ticket?.sectionId,
    staffId: ticket?.staffId,
    provider: 'cash',
    status: STATUS.COMPLETED,
    payload: { method: 'cash', totals, cashTendered: tendered, changeDue, timestamp: Date.now() },
  })

  // E.A.T.-facing revenue event — management dashboards read this.
  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'EAT_REVENUE_EVENT_CREATED',
    commandType: 'EAT_REVENUE_EVENT_CREATED',
    ticketId,
    tableId: ticket?.tableId,
    sectionId: ticket?.sectionId,
    staffId: ticket?.staffId,
    provider: 'cash',
    status: STATUS.COMPLETED,
    payload: { totals, method: 'cash', timestamp: Date.now() },
  })

  if (ticket?.staffId) {
    emit({
      sourceSystem: SYSTEMS.POS3,
      targetSystem: SYSTEMS.EAT,
      eventType: 'EAT_STAFF_ACTIVITY_CREATED',
      commandType: 'EAT_STAFF_ACTIVITY_CREATED',
      ticketId,
      staffId: ticket.staffId,
      status: STATUS.COMPLETED,
      payload: { activity: 'completed_payment', method: 'cash', total: totals.total, timestamp: Date.now() },
    })
  }

  return {
    success: true,
    changeDue,
    receipt: { ticketId, totals, cashTendered: tendered, changeDue, paidAt: Date.now() },
  }
}

/** Card payment — honest stub. No processor is configured in this environment. */
export function completeCardPayment(ticketId, provider = 'Square') {
  emit({
    sourceSystem: SYSTEMS.POS3,
    targetSystem: SYSTEMS.EAT,
    eventType: 'POS_PAYMENT_STARTED',
    commandType: 'POS_PAYMENT_STARTED',
    ticketId,
    provider,
    status: STATUS.FAILED,
    payload: { method: 'card', provider, reason: 'not_configured', timestamp: Date.now() },
  })
  return {
    success: false,
    notConfigured: true,
    provider,
    error: `${provider} is not configured in this environment.`,
  }
}

/** Split payment — honest stub, inert "coming soon" option. */
export function completeSplitPayment(ticketId) {
  return {
    success: false,
    notConfigured: true,
    provider: 'split',
    error: 'Split Payment is coming soon — not yet configured in this environment.',
  }
}
