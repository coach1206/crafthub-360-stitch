/**
 * pos3ReceiptPersistenceService — dual-mode receipt persistence.
 */

import { isDbAvailable, query } from '../db/connection.js'

const memReceipts = new Map() // receiptId → receipt

function makeReceiptNumber() {
  const n = Math.floor(Math.random() * 900000 + 100000)
  return `RCT-${n}`
}

export async function createReceipt({ orderId, venueId, paymentMethod, subtotalCents, taxCents, serviceFeeCents, tipCents, totalCents, receiptPayload }) {
  const receiptNumber = makeReceiptNumber()

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO pos3_receipts
           (order_id, venue_id, receipt_number, payment_method, subtotal_cents,
            tax_cents, service_fee_cents, tip_cents, total_cents, receipt_payload)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         RETURNING *`,
        [orderId, venueId, receiptNumber, paymentMethod || 'cash',
         subtotalCents || 0, taxCents || 0, serviceFeeCents || 0,
         tipCents || 0, totalCents || 0, JSON.stringify(receiptPayload || {})]
      )
      return { ok: true, receipt: rows[0], storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  const receipt = {
    receipt_id: `rcpt_${Date.now()}`,
    order_id: orderId,
    venue_id: venueId,
    receipt_number: receiptNumber,
    payment_method: paymentMethod || 'cash',
    subtotal_cents: subtotalCents || 0,
    tax_cents: taxCents || 0,
    service_fee_cents: serviceFeeCents || 0,
    tip_cents: tipCents || 0,
    total_cents: totalCents || 0,
    receipt_payload: receiptPayload || {},
    created_at: new Date().toISOString(),
  }
  memReceipts.set(receipt.receipt_id, receipt)
  return { ok: true, receipt, storageMode: 'memory_fallback', localPreview: true }
}

export async function getReceiptByOrderId(orderId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(`SELECT * FROM pos3_receipts WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1`, [orderId])
      if (!rows[0]) return { ok: false, error: 'Receipt not found' }
      return { ok: true, receipt: rows[0], storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }
  const receipt = [...memReceipts.values()].find(r => r.order_id === orderId)
  return receipt
    ? { ok: true, receipt, storageMode: 'memory_fallback', localPreview: true }
    : { ok: false, error: 'Receipt not found', localPreview: true }
}
