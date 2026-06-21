/**
 * POS 3 Receipt Service — builds and persists receipts for completed
 * payments. Persists to localStorage key `pos3:receipts`.
 */

import { opsGet, opsSet } from '../shared/opsStorage.js'

const RECEIPTS_KEY = 'pos3:receipts'

function uid() {
  return 'RCT-' + Math.floor(100000 + Math.random() * 900000)
}

export function getReceipts() { return opsGet(RECEIPTS_KEY, []) }

function saveReceipts(receipts) { opsSet(RECEIPTS_KEY, receipts) }

/**
 * Build + persist a receipt for a ticket/payment pair.
 * @param {object} ticket - the ticket being paid
 * @param {object} payment - result from paymentService (totals, cashTendered, changeDue, tenderType)
 */
export function buildReceipt(ticket, payment) {
  const receipts = getReceipts()
  const totals = payment.totals || payment.receipt?.totals || { subtotal: 0, tax: 0, tip: 0, total: 0 }
  const receipt = {
    id: uid(),
    ticketId: ticket?.id,
    items: ticket?.items || [],
    subtotal: totals.subtotal,
    tax: totals.tax,
    tip: totals.tip,
    total: totals.total,
    tenderType: payment.tenderType || 'cash',
    cashTendered: payment.cashTendered ?? payment.receipt?.cashTendered ?? null,
    changeDue: payment.changeDue ?? payment.receipt?.changeDue ?? 0,
    paidAt: payment.paidAt || payment.receipt?.paidAt || Date.now(),
    staffId: ticket?.staffId || null,
  }
  receipts.push(receipt)
  saveReceipts(receipts.slice(-500))
  return receipt
}

export function getReceiptsForTicket(ticketId) {
  return getReceipts().filter((r) => r.ticketId === ticketId)
}
