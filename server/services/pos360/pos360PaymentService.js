/**
 * POS360 Payments, Tips, Receipts & Settlement Service (Phase B.7)
 * Falls back gracefully when no database connection is configured. Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import { PAYMENT_EVENTS, PAYMENT_METHODS, PAYMENT_STATUSES, TIP_PRESETS_DEFAULT } from './pos360PaymentEventContracts.js'
import { getSupportedPaymentLanguages } from '../../../src/locales/pos360Payments.js'

const LOCAL_PREVIEW = { ok: false, localPreview: true, error: 'database_not_configured' }

function auditRecord(tenantId, venueId, action, entity, actor, extra = {}) {
  if (!isDbAvailable()) return Promise.resolve()
  return query(
    `INSERT INTO pos360_payment_audit
      (tenant_id, venue_id, entity_type, entity_id, action, actor_id, actor_role,
       payment_id, order_id, check_id, tab_id, device_id, staff_user_id,
       new_value, contains_secrets, exposes_private_data, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,FALSE,FALSE,$15)`,
    [
      tenantId, venueId,
      entity.type, entity.id, action,
      actor?.actorId, actor?.actorRole,
      extra.paymentId, extra.orderId, extra.checkId, extra.tabId,
      extra.deviceId, extra.staffUserId,
      JSON.stringify(extra.newValue ?? {}),
      JSON.stringify(extra.metadata ?? {}),
    ]
  ).catch(() => {})
}

// ── Payment Intents ────────────────────────────────────────────────────────────
export async function createPaymentIntent({
  tenantId, venueId, locationId, orderId, checkId, tabId, deviceId, staffUserId,
  amount, currency = 'USD', idempotencyKey, notes, actorId, actorRole,
}) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'payment_intents' }

  const existing = await query(
    `SELECT id, payment_status FROM pos360_payment_intents WHERE idempotency_key=$1 AND venue_id=$2`,
    [idempotencyKey, venueId]
  )
  if (existing.rows.length) {
    return { ok: true, duplicate: true, intent: existing.rows[0] }
  }

  const r = await query(
    `INSERT INTO pos360_payment_intents
      (tenant_id, venue_id, location_id, order_id, check_id, tab_id, device_id, staff_user_id,
       idempotency_key, amount, currency, payment_status, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'intent_created',$12,$13)
     RETURNING *`,
    [tenantId, venueId, locationId, orderId, checkId, tabId, deviceId, staffUserId,
     idempotencyKey, amount, currency, notes, actorId]
  )
  const intent = r.rows[0]
  await auditRecord(tenantId, venueId, 'create_intent', { type: 'payment_intent', id: intent.id },
    { actorId, actorRole }, { paymentId: intent.id, orderId, newValue: { payment_status: 'intent_created', amount } })
  return { ok: true, intent, note: 'Payment intent created as a placeholder. No money was processed.' }
}

export async function getPaymentIntent({ tenantId, venueId, intentId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'payment_intents' }
  const r = await query(
    `SELECT * FROM pos360_payment_intents WHERE id=$1 AND venue_id=$2 AND is_active=TRUE`,
    [intentId, venueId]
  )
  return { ok: true, intent: r.rows[0] ?? null }
}

export async function cancelPaymentIntent({ tenantId, venueId, intentId, actorId, actorRole }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'payment_intents' }
  await query(
    `UPDATE pos360_payment_intents SET payment_status='canceled', updated_at=NOW(), updated_by=$3 WHERE id=$1 AND venue_id=$2`,
    [intentId, venueId, actorId]
  )
  await auditRecord(tenantId, venueId, 'cancel_intent', { type: 'payment_intent', id: intentId },
    { actorId, actorRole }, { newValue: { payment_status: 'canceled' } })
  return { ok: true }
}

export async function markIntentFailed({ tenantId, venueId, intentId, failureReason, actorId, actorRole }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'payment_intents' }
  await query(
    `UPDATE pos360_payment_intents SET payment_status='failed', failure_reason=$3, updated_at=NOW() WHERE id=$1 AND venue_id=$2`,
    [intentId, venueId, failureReason]
  )
  return { ok: true }
}

export async function markIntentProviderRequired({ tenantId, venueId, intentId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'payment_intents' }
  await query(
    `UPDATE pos360_payment_intents SET payment_status='review_required', updated_at=NOW() WHERE id=$1 AND venue_id=$2`,
    [intentId, venueId]
  )
  return { ok: true, note: 'No payment provider is connected. No money was processed.' }
}

// ── Payments ───────────────────────────────────────────────────────────────────
export async function createPayment({
  tenantId, venueId, locationId, orderId, checkId, tabId, paymentIntentId,
  deviceId, staffUserId, idempotencyKey, amount, amountTendered, currency = 'USD',
  paymentMethod = 'credit_card', providerKey, maskedCard, cardBrand, cardLast4,
  tipAmount = 0, serviceChargeAmount = 0, discountAmount = 0, taxAmount = 0,
  isOffline = false, notes, actorId, actorRole,
}) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'payments' }

  const dup = await query(
    `SELECT id FROM pos360_payments WHERE idempotency_key=$1 AND venue_id=$2`,
    [idempotencyKey, venueId]
  )
  if (dup.rows.length) {
    return { ok: true, duplicate: true, paymentId: dup.rows[0].id }
  }

  const changeDue = amountTendered != null ? Math.max(0, amountTendered - amount) : null
  const balanceDue = amountTendered != null ? Math.max(0, amount - amountTendered) : amount
  const totalCharged = Number(amount) + Number(tipAmount) + Number(serviceChargeAmount)
  const status = isOffline ? 'offline_queued' : 'pending'

  const r = await query(
    `INSERT INTO pos360_payments
      (tenant_id, venue_id, location_id, order_id, check_id, tab_id, payment_intent_id,
       device_id, staff_user_id, idempotency_key, amount, amount_tendered, amount_due,
       change_due, tip_amount, service_charge_amount, discount_amount, tax_amount, total_charged,
       currency, payment_method, payment_status, provider_key, masked_card, card_brand, card_last4,
       is_offline, offline_queued_at, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
     RETURNING *`,
    [tenantId, venueId, locationId, orderId, checkId, tabId, paymentIntentId,
     deviceId, staffUserId, idempotencyKey, amount, amountTendered, balanceDue,
     changeDue, tipAmount, serviceChargeAmount, discountAmount, taxAmount, totalCharged,
     currency, paymentMethod, status, providerKey, maskedCard, cardBrand, cardLast4,
     isOffline, isOffline ? new Date() : null, notes, actorId]
  )
  const payment = r.rows[0]
  await auditRecord(tenantId, venueId, 'create_payment', { type: 'payment', id: payment.id },
    { actorId, actorRole }, { paymentId: payment.id, orderId, newValue: { status, amount, paymentMethod } })
  return { ok: true, payment }
}

export async function getPayment({ tenantId, venueId, paymentId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'payments' }
  const r = await query(
    `SELECT * FROM pos360_payments WHERE id=$1 AND venue_id=$2 AND is_active=TRUE`,
    [paymentId, venueId]
  )
  return { ok: true, payment: r.rows[0] ?? null }
}

export async function listPayments({ tenantId, venueId, orderId, checkId, status, limit = 50 }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'payments', payments: [] }
  let where = `WHERE p.venue_id=$1 AND p.is_active=TRUE`
  const params = [venueId]
  if (orderId) { params.push(orderId); where += ` AND p.order_id=$${params.length}` }
  if (checkId) { params.push(checkId); where += ` AND p.check_id=$${params.length}` }
  if (status)  { params.push(status);  where += ` AND p.payment_status=$${params.length}` }
  const r = await query(
    `SELECT * FROM pos360_payments p ${where} ORDER BY p.created_at DESC LIMIT ${limit}`,
    params
  )
  if (!r.rows.length) return { ok: true, payments: [], message: 'No payments found for this venue.' }
  return { ok: true, payments: r.rows }
}

export async function updatePaymentStatus({ tenantId, venueId, paymentId, status, actorId, actorRole, notes }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'payments' }
  await query(
    `UPDATE pos360_payments SET payment_status=$3, updated_at=NOW(), updated_by=$4, notes=COALESCE($5, notes)
     WHERE id=$1 AND venue_id=$2`,
    [paymentId, venueId, status, actorId, notes]
  )
  await auditRecord(tenantId, venueId, 'update_payment_status', { type: 'payment', id: paymentId },
    { actorId, actorRole }, { paymentId, newValue: { status } })
  return { ok: true }
}

export async function applyPaymentToOrder({ tenantId, venueId, paymentId, orderId, actorId, actorRole }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'payments' }
  await query(
    `UPDATE pos360_payments SET order_id=$3, updated_at=NOW() WHERE id=$1 AND venue_id=$2`,
    [paymentId, venueId, orderId]
  )
  await auditRecord(tenantId, venueId, 'apply_to_order', { type: 'payment', id: paymentId },
    { actorId, actorRole }, { paymentId, orderId })
  return { ok: true }
}

// ── Split Payments ─────────────────────────────────────────────────────────────
export async function createSplitPayment({ tenantId, venueId, orderId, checkId, tabId, deviceId, staffUserId, totalAmount, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'splits' }
  const r = await query(
    `INSERT INTO pos360_payment_splits
      (tenant_id, venue_id, order_id, check_id, tab_id, device_id, staff_user_id,
       total_amount, balance_due, split_status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,'open',$9) RETURNING *`,
    [tenantId, venueId, orderId, checkId, tabId, deviceId, staffUserId, totalAmount, actorId]
  )
  return { ok: true, split: r.rows[0] }
}

export async function addTenderToSplit({ tenantId, venueId, splitId, paymentAmount, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'splits' }
  await query(
    `UPDATE pos360_payment_splits
     SET paid_amount = paid_amount + $3,
         balance_due = GREATEST(0, total_amount - (paid_amount + $3)),
         tender_count = tender_count + 1,
         updated_at = NOW(), updated_by = $4
     WHERE id=$1 AND venue_id=$2`,
    [splitId, venueId, paymentAmount, actorId]
  )
  const r = await query(`SELECT * FROM pos360_payment_splits WHERE id=$1`, [splitId])
  return { ok: true, split: r.rows[0] }
}

export async function getSplitBalance({ tenantId, venueId, splitId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'splits' }
  const r = await query(`SELECT * FROM pos360_payment_splits WHERE id=$1 AND venue_id=$2`, [splitId, venueId])
  return { ok: true, split: r.rows[0] ?? null }
}

export async function completeSplitHook({ tenantId, venueId, splitId, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'splits' }
  await query(
    `UPDATE pos360_payment_splits SET split_status='completed', updated_at=NOW(), updated_by=$3 WHERE id=$1 AND venue_id=$2`,
    [splitId, venueId, actorId]
  )
  return { ok: true }
}

// ── Tips ───────────────────────────────────────────────────────────────────────
export async function setTip({ tenantId, venueId, paymentId, orderId, checkId, tabId, staffUserId, serverUserId, deviceId,
  tipType = 'none', tipPercentage, tipAmount = 0, preTaxBase, postTaxBase, isAutoGratuity = false, isServiceCharge = false,
}) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'tips' }
  const r = await query(
    `INSERT INTO pos360_payment_tips
      (tenant_id, venue_id, payment_id, order_id, check_id, tab_id, staff_user_id, server_user_id, device_id,
       tip_type, tip_percentage, tip_amount, pre_tax_base, post_tax_base, is_auto_gratuity, is_service_charge)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
    [tenantId, venueId, paymentId, orderId, checkId, tabId, staffUserId, serverUserId, deviceId,
     tipType, tipPercentage, tipAmount, preTaxBase, postTaxBase, isAutoGratuity, isServiceCharge]
  )
  return { ok: true, tip: r.rows[0] }
}

export async function updateTip({ tenantId, venueId, tipId, tipAmount, tipPercentage, adjustmentReason, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'tips' }
  await query(
    `UPDATE pos360_payment_tips
     SET tip_amount=$3, tip_percentage=COALESCE($4, tip_percentage),
         adjustment_reason=$5, adjusted_at=NOW(), adjusted_by=$6, updated_at=NOW()
     WHERE id=$1 AND venue_id=$2`,
    [tipId, venueId, tipAmount, tipPercentage, adjustmentReason, actorId]
  )
  return { ok: true }
}

export async function removeTip({ tenantId, venueId, tipId, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'tips' }
  await query(
    `UPDATE pos360_payment_tips SET tip_amount=0, tip_type='none', updated_at=NOW() WHERE id=$1 AND venue_id=$2`,
    [tipId, venueId]
  )
  return { ok: true }
}

export async function calculateTipPresets({ amount, presets = TIP_PRESETS_DEFAULT }) {
  const results = presets.map(p => ({
    percentage: p,
    label: `${p}%`,
    amount: parseFloat((amount * p / 100).toFixed(2)),
  }))
  results.push({ percentage: null, label: 'custom', amount: null })
  results.unshift({ percentage: 0, label: 'no_tip', amount: 0 })
  return { ok: true, presets: results }
}

export async function getTipSummary({ tenantId, venueId, orderId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'tips' }
  const r = await query(
    `SELECT SUM(tip_amount) AS total_tips, COUNT(*) AS tip_count
     FROM pos360_payment_tips WHERE venue_id=$1 AND order_id=$2`,
    [venueId, orderId]
  )
  return { ok: true, summary: r.rows[0] }
}

// ── Signatures ─────────────────────────────────────────────────────────────────
export async function captureSignaturePlaceholder({ tenantId, venueId, paymentId, orderId, deviceId, staffUserId, signatureRef, isOffline = false }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'signatures' }
  const r = await query(
    `INSERT INTO pos360_payment_signatures
      (tenant_id, venue_id, payment_id, order_id, device_id, staff_user_id,
       signature_status, signature_required, signature_ref, is_offline, offline_queued_at, captured_at)
     VALUES ($1,$2,$3,$4,$5,$6,'captured',TRUE,$7,$8,$9,NOW()) RETURNING *`,
    [tenantId, venueId, paymentId, orderId, deviceId, staffUserId,
     signatureRef, isOffline, isOffline ? new Date() : null]
  )
  return { ok: true, signature: r.rows[0] }
}

export async function getSignatureStatus({ tenantId, venueId, paymentId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'signatures' }
  const r = await query(
    `SELECT * FROM pos360_payment_signatures WHERE payment_id=$1 AND venue_id=$2 ORDER BY created_at DESC LIMIT 1`,
    [paymentId, venueId]
  )
  return { ok: true, signature: r.rows[0] ?? null }
}

export async function queueOfflineSignature({ tenantId, venueId, paymentId, orderId, deviceId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'signatures' }
  const r = await query(
    `INSERT INTO pos360_payment_signatures
      (tenant_id, venue_id, payment_id, order_id, device_id, signature_status, is_offline, offline_queued_at)
     VALUES ($1,$2,$3,$4,$5,'pending',TRUE,NOW()) RETURNING *`,
    [tenantId, venueId, paymentId, orderId, deviceId]
  )
  return { ok: true, signature: r.rows[0] }
}

export async function markSignatureSkipped({ tenantId, venueId, paymentId, skippedReason }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'signatures' }
  await query(
    `UPDATE pos360_payment_signatures SET signature_status='skipped', skipped_reason=$3, updated_at=NOW()
     WHERE payment_id=$1 AND venue_id=$2`,
    [paymentId, venueId, skippedReason]
  )
  return { ok: true }
}

// ── Receipts ───────────────────────────────────────────────────────────────────
export async function generateReceiptPreview({ tenantId, venueId, paymentId, orderId, checkId, tabId, deviceId, language = 'en-US',
  subtotal, taxAmount, serviceChargeAmount, discountAmount, tipAmount, totalAmount, paidAmount, balanceDue, maskedCard,
  receiptLines, paymentSummary,
}) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'receipts' }
  const r = await query(
    `INSERT INTO pos360_payment_receipts
      (tenant_id, venue_id, payment_id, order_id, check_id, tab_id, device_id,
       language, receipt_status, preview_generated, subtotal, tax_amount, service_charge_amount,
       discount_amount, tip_amount, total_amount, paid_amount, balance_due, masked_card,
       receipt_lines, payment_summary)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'preview',TRUE,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) RETURNING *`,
    [tenantId, venueId, paymentId, orderId, checkId, tabId, deviceId,
     language, subtotal, taxAmount, serviceChargeAmount, discountAmount, tipAmount,
     totalAmount, paidAmount, balanceDue, maskedCard,
     JSON.stringify(receiptLines ?? []), JSON.stringify(paymentSummary ?? {})]
  )
  return { ok: true, receipt: r.rows[0] }
}

export async function sendEmailReceiptHook({ tenantId, venueId, receiptId, emailAddress, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'receipts' }
  await query(
    `UPDATE pos360_payment_receipts SET email_address=$3, email_queued=TRUE, delivery_method='email', updated_at=NOW()
     WHERE id=$1 AND venue_id=$2`,
    [receiptId, venueId, emailAddress]
  )
  return { ok: true, queued: true, note: 'Email receipt hook queued. No provider connected.' }
}

export async function sendSMSReceiptHook({ tenantId, venueId, receiptId, phoneNumber, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'receipts' }
  await query(
    `UPDATE pos360_payment_receipts SET phone_number=$3, sms_queued=TRUE, delivery_method='sms', updated_at=NOW()
     WHERE id=$1 AND venue_id=$2`,
    [receiptId, venueId, phoneNumber]
  )
  return { ok: true, queued: true, note: 'SMS receipt hook queued. No provider connected.' }
}

export async function printReceiptHook({ tenantId, venueId, receiptId, deviceId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'receipts' }
  await query(
    `UPDATE pos360_payment_receipts SET print_queued=TRUE, delivery_method='print', updated_at=NOW()
     WHERE id=$1 AND venue_id=$2`,
    [receiptId, venueId]
  )
  return { ok: true, queued: true, note: 'Print receipt hook queued. No printer connected.' }
}

// ── Refunds ────────────────────────────────────────────────────────────────────
export async function checkRefundEligibility({ tenantId, venueId, paymentId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'refunds' }
  const r = await query(
    `SELECT id, payment_status, amount FROM pos360_payments WHERE id=$1 AND venue_id=$2`,
    [paymentId, venueId]
  )
  const payment = r.rows[0]
  if (!payment) return { ok: false, eligible: false, reason: 'Payment not found.' }
  const eligible = ['paid', 'partially_paid', 'settled'].includes(payment.payment_status)
  return { ok: true, eligible, paymentStatus: payment.payment_status, amount: payment.amount,
    note: eligible ? null : 'Payment is not in a refundable state.' }
}

export async function createRefundHook({ tenantId, venueId, locationId, paymentId, orderId, checkId, tabId, deviceId, staffUserId,
  idempotencyKey, refundType = 'full', refundAmount, refundReason, serviceRecovery = false, providerKey, actorId, actorRole,
}) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'refunds' }
  const r = await query(
    `INSERT INTO pos360_payment_refunds
      (tenant_id, venue_id, location_id, payment_id, order_id, check_id, tab_id, device_id, staff_user_id,
       idempotency_key, refund_type, refund_amount, refund_status, refund_reason, service_recovery,
       provider_key, requires_manager, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'requested',$13,$14,$15,TRUE,$16) RETURNING *`,
    [tenantId, venueId, locationId, paymentId, orderId, checkId, tabId, deviceId, staffUserId,
     idempotencyKey, refundType, refundAmount, refundReason, serviceRecovery, providerKey, actorId]
  )
  const refund = r.rows[0]
  await auditRecord(tenantId, venueId, 'create_refund', { type: 'refund', id: refund.id },
    { actorId, actorRole }, { paymentId, newValue: { refundType, refundAmount, refundReason } })
  await createEATAlertForPayment({ tenantId, venueId, paymentId, alertType: 'refund_alert',
    title: 'Refund Requested', body: `Refund of ${refundAmount} requested.` })
  return { ok: true, refund, note: 'No real refund was processed. Provider not connected.' }
}

export async function approveRefund({ tenantId, venueId, refundId, managerUserId, actorId, actorRole }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'refunds' }
  await query(
    `UPDATE pos360_payment_refunds
     SET refund_status='approved', manager_user_id=$3, manager_approved_at=NOW(), updated_at=NOW()
     WHERE id=$1 AND venue_id=$2`,
    [refundId, venueId, managerUserId]
  )
  return { ok: true }
}

export async function denyRefund({ tenantId, venueId, refundId, managerUserId, denialReason, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'refunds' }
  await query(
    `UPDATE pos360_payment_refunds
     SET refund_status='denied', manager_user_id=$3, manager_denied_at=NOW(), denial_reason=$4, updated_at=NOW()
     WHERE id=$1 AND venue_id=$2`,
    [refundId, venueId, managerUserId, denialReason]
  )
  return { ok: true }
}

export async function voidPaymentHook({ tenantId, venueId, locationId, paymentId, orderId, deviceId, staffUserId,
  voidType = 'standard', voidReason, isSameDay = false, providerKey, actorId, actorRole,
}) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'voids' }
  const r = await query(
    `INSERT INTO pos360_payment_voids
      (tenant_id, venue_id, location_id, payment_id, order_id, device_id, staff_user_id,
       void_type, void_reason, void_status, is_same_day, provider_key, requires_manager, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'requested',$10,$11,TRUE,$12) RETURNING *`,
    [tenantId, venueId, locationId, paymentId, orderId, deviceId, staffUserId,
     voidType, voidReason, isSameDay, providerKey, actorId]
  )
  const v = r.rows[0]
  await auditRecord(tenantId, venueId, 'void_requested', { type: 'void', id: v.id },
    { actorId, actorRole }, { paymentId, newValue: { voidType, voidReason } })
  await createEATAlertForPayment({ tenantId, venueId, paymentId, alertType: 'void_alert',
    title: 'Void Requested', body: `Payment void requested.` })
  return { ok: true, void: v, note: 'Void hook recorded. No real void was processed without provider.' }
}

export async function approveVoid({ tenantId, venueId, voidId, managerUserId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'voids' }
  await query(
    `UPDATE pos360_payment_voids
     SET void_status='approved', manager_user_id=$3, manager_approved_at=NOW(), updated_at=NOW()
     WHERE id=$1 AND venue_id=$2`,
    [voidId, venueId, managerUserId]
  )
  return { ok: true }
}

export async function getRefundStatus({ tenantId, venueId, refundId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'refunds' }
  const r = await query(
    `SELECT * FROM pos360_payment_refunds WHERE id=$1 AND venue_id=$2`, [refundId, venueId]
  )
  return { ok: true, refund: r.rows[0] ?? null }
}

// ── Settlement ─────────────────────────────────────────────────────────────────
export async function createSettlementBatch({ tenantId, venueId, locationId, deviceId, staffUserId, batchName, isEndOfDay = false, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'settlement' }
  const r = await query(
    `INSERT INTO pos360_payment_settlement_batches
      (tenant_id, venue_id, location_id, device_id, staff_user_id, batch_name, is_end_of_day, batch_status, opened_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'open',NOW(),$8) RETURNING *`,
    [tenantId, venueId, locationId, deviceId, staffUserId, batchName, isEndOfDay, actorId]
  )
  return { ok: true, batch: r.rows[0] }
}

export async function getSettlementBatch({ tenantId, venueId, batchId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'settlement' }
  const r = await query(
    `SELECT * FROM pos360_payment_settlement_batches WHERE id=$1 AND venue_id=$2`, [batchId, venueId]
  )
  return { ok: true, batch: r.rows[0] ?? null }
}

export async function listSettlementBatches({ tenantId, venueId, status, limit = 20 }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'settlement', batches: [] }
  let where = `WHERE venue_id=$1 AND is_active=TRUE`
  const params = [venueId]
  if (status) { params.push(status); where += ` AND batch_status=$${params.length}` }
  const r = await query(
    `SELECT * FROM pos360_payment_settlement_batches ${where} ORDER BY created_at DESC LIMIT ${limit}`, params
  )
  return { ok: true, batches: r.rows }
}

export async function closeSettlementBatchHook({ tenantId, venueId, batchId, actorId, actorRole }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'settlement' }
  const totals = await query(
    `SELECT SUM(amount) AS total_sales, SUM(tip_amount) AS total_tips,
            SUM(CASE WHEN payment_method='cash' THEN amount ELSE 0 END) AS total_cash,
            SUM(CASE WHEN payment_method IN('credit_card','debit_card') THEN amount ELSE 0 END) AS total_card,
            COUNT(*) AS payment_count
     FROM pos360_payments WHERE settlement_batch_id=$1 AND venue_id=$2`,
    [batchId, venueId]
  )
  const t = totals.rows[0]
  await query(
    `UPDATE pos360_payment_settlement_batches
     SET batch_status='closed', closed_at=NOW(), updated_at=NOW(), updated_by=$3,
         total_sales=COALESCE($4,0), total_tips=COALESCE($5,0), total_cash=COALESCE($6,0),
         total_card=COALESCE($7,0), payment_count=COALESCE($8,0)
     WHERE id=$1 AND venue_id=$2`,
    [batchId, venueId, actorId, t.total_sales, t.total_tips, t.total_cash, t.total_card, t.payment_count]
  )
  await createEATAlertForPayment({ tenantId, venueId, alertType: 'settlement_summary',
    title: 'Settlement Batch Closed', body: `Batch closed. Sales: ${t.total_sales}` })
  return { ok: true }
}

export async function getSettlementSummary({ tenantId, venueId, batchId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'settlement' }
  const r = await query(
    `SELECT * FROM pos360_payment_settlement_batches WHERE id=$1 AND venue_id=$2`, [batchId, venueId]
  )
  return { ok: true, summary: r.rows[0] ?? null }
}

export async function getEndOfDayCloseoutHook({ tenantId, venueId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'settlement' }
  const r = await query(
    `SELECT * FROM pos360_payment_settlement_batches WHERE venue_id=$1 AND is_end_of_day=TRUE ORDER BY batch_date DESC LIMIT 1`,
    [venueId]
  )
  return { ok: true, closeout: r.rows[0] ?? null, note: 'End-of-day closeout hook. No settlement provider connected.' }
}

// ── Cash Drawer ────────────────────────────────────────────────────────────────
export async function recordCashPayment({ tenantId, venueId, locationId, deviceId, staffUserId, batchId, orderId, paymentId, amount, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'cash_drawer' }
  const r = await query(
    `INSERT INTO pos360_payment_cash_drawer_events
      (tenant_id, venue_id, location_id, device_id, staff_user_id, settlement_batch_id, order_id, payment_id,
       event_type, amount, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'payment',$9,$10) RETURNING *`,
    [tenantId, venueId, locationId, deviceId, staffUserId, batchId, orderId, paymentId, amount, actorId]
  )
  return { ok: true, event: r.rows[0] }
}

export async function recordPaidIn({ tenantId, venueId, deviceId, staffUserId, amount, notes, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'cash_drawer' }
  const r = await query(
    `INSERT INTO pos360_payment_cash_drawer_events (tenant_id, venue_id, device_id, staff_user_id, event_type, amount, notes, created_by)
     VALUES ($1,$2,$3,$4,'paid_in',$5,$6,$7) RETURNING *`,
    [tenantId, venueId, deviceId, staffUserId, amount, notes, actorId]
  )
  return { ok: true, event: r.rows[0] }
}

export async function recordPaidOut({ tenantId, venueId, deviceId, staffUserId, amount, notes, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'cash_drawer' }
  const r = await query(
    `INSERT INTO pos360_payment_cash_drawer_events (tenant_id, venue_id, device_id, staff_user_id, event_type, amount, notes, created_by)
     VALUES ($1,$2,$3,$4,'paid_out',$5,$6,$7) RETURNING *`,
    [tenantId, venueId, deviceId, staffUserId, amount, notes, actorId]
  )
  return { ok: true, event: r.rows[0] }
}

export async function recordCashDrop({ tenantId, venueId, deviceId, staffUserId, amount, notes, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'cash_drawer' }
  const r = await query(
    `INSERT INTO pos360_payment_cash_drawer_events (tenant_id, venue_id, device_id, staff_user_id, event_type, amount, notes, created_by)
     VALUES ($1,$2,$3,$4,'cash_drop',$5,$6,$7) RETURNING *`,
    [tenantId, venueId, deviceId, staffUserId, amount, notes, actorId]
  )
  return { ok: true, event: r.rows[0] }
}

export async function recordCashOverShort({ tenantId, venueId, deviceId, staffUserId, expectedAmount, actualAmount, varianceReason, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'cash_drawer' }
  const variance = actualAmount - expectedAmount
  const r = await query(
    `INSERT INTO pos360_payment_cash_drawer_events
      (tenant_id, venue_id, device_id, staff_user_id, event_type, amount, expected_amount, actual_amount, variance, variance_reason, requires_manager, created_by)
     VALUES ($1,$2,$3,$4,'over_short',$5,$6,$7,$8,$9,TRUE,$10) RETURNING *`,
    [tenantId, venueId, deviceId, staffUserId, Math.abs(variance), expectedAmount, actualAmount, variance, varianceReason, actorId]
  )
  if (Math.abs(variance) > 0) {
    await createEATAlertForPayment({ tenantId, venueId, alertType: 'cash_drawer_variance',
      title: 'Cash Drawer Variance', body: `Variance of ${variance} detected.` })
  }
  return { ok: true, event: r.rows[0] }
}

export async function getCashDrawerSummary({ tenantId, venueId, deviceId, batchId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'cash_drawer' }
  const params = [venueId]
  let where = `WHERE venue_id=$1`
  if (deviceId) { params.push(deviceId); where += ` AND device_id=$${params.length}` }
  if (batchId)  { params.push(batchId);  where += ` AND settlement_batch_id=$${params.length}` }
  const r = await query(
    `SELECT event_type, SUM(amount) AS total FROM pos360_payment_cash_drawer_events ${where} GROUP BY event_type`, params
  )
  return { ok: true, summary: r.rows }
}

// ── Provider ───────────────────────────────────────────────────────────────────
export async function listPaymentProviders({ tenantId, venueId }) {
  return { ok: true, providers: [], note: 'No payment provider is connected. No money was processed.' }
}

export async function getProviderStatus({ tenantId, venueId, providerKey }) {
  return { ok: true, status: 'not_connected', note: 'No payment provider is connected. No money was processed.' }
}

export async function recordProviderEvent({ tenantId, venueId, paymentId, paymentIntentId, providerKey, eventType, responseCode, responseBody }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'provider_events' }
  const r = await query(
    `INSERT INTO pos360_payment_provider_events
      (tenant_id, venue_id, payment_id, payment_intent_id, provider_key, event_type, event_status, response_code, response_body)
     VALUES ($1,$2,$3,$4,$5,$6,'received',$7,$8) RETURNING *`,
    [tenantId, venueId, paymentId, paymentIntentId, providerKey, eventType, responseCode, JSON.stringify(responseBody ?? {})]
  )
  return { ok: true, event: r.rows[0] }
}

export async function providerDisconnectedHook({ tenantId, venueId, providerKey }) {
  await createEATAlertForPayment({ tenantId, venueId, alertType: 'provider_disconnected',
    title: 'Payment Provider Disconnected', body: `Provider ${providerKey} disconnected.` })
  return { ok: true, note: 'No payment provider is connected. No money was processed.' }
}

// ── Offline ────────────────────────────────────────────────────────────────────
export async function queueOfflinePaymentPlaceholder({ tenantId, venueId, orderId, deviceId, idempotencyKey, amount, paymentMethod, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'offline_payments' }
  const dup = await query(
    `SELECT id FROM pos360_payments WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId]
  )
  if (dup.rows.length) return { ok: true, duplicate: true, message: 'Duplicate payment blocked.' }
  const r = await query(
    `INSERT INTO pos360_payments
      (tenant_id, venue_id, order_id, device_id, idempotency_key, amount, currency, payment_method,
       payment_status, is_offline, offline_queued_at, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'USD',$7,'offline_queued',TRUE,NOW(),$8) RETURNING *`,
    [tenantId, venueId, orderId, deviceId, idempotencyKey, amount, paymentMethod, actorId]
  )
  return { ok: true, payment: r.rows[0], note: 'Offline payment placeholder queued.' }
}

export async function validatePaymentReplay({ tenantId, venueId, idempotencyKey }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'offline_payments' }
  const r = await query(
    `SELECT id, payment_status, idempotency_key FROM pos360_payments WHERE idempotency_key=$1 AND venue_id=$2`,
    [idempotencyKey, venueId]
  )
  return { ok: true, valid: r.rows.length === 0, existing: r.rows[0] ?? null }
}

export async function detectPaymentConflict({ tenantId, venueId, paymentId, orderId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'offline_payments' }
  const r = await query(
    `SELECT id, payment_status FROM pos360_payments WHERE order_id=$1 AND venue_id=$2 AND id<>$3`,
    [orderId, venueId, paymentId]
  )
  const conflict = r.rows.some(p => ['paid', 'authorized_hook'].includes(p.payment_status))
  return { ok: true, conflict, conflictingPayments: r.rows }
}

export async function getOfflinePaymentQueueSummary({ tenantId, venueId, deviceId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'offline_payments' }
  const params = [venueId]
  let where = `WHERE venue_id=$1 AND payment_status='offline_queued'`
  if (deviceId) { params.push(deviceId); where += ` AND device_id=$${params.length}` }
  const r = await query(
    `SELECT COUNT(*) AS count, SUM(amount) AS total FROM pos360_payments ${where}`, params
  )
  const row = r.rows[0]
  if (!row || Number(row.count) === 0) return { ok: true, count: 0, total: 0, message: 'No offline payment actions are queued.' }
  return { ok: true, count: Number(row.count), total: row.total }
}

// ── E.A.T. ─────────────────────────────────────────────────────────────────────
async function createEATAlertForPayment({ tenantId, venueId, paymentId, alertType, title, body, orderId, entityType = 'payment', entityId }) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_payment_eat_alerts
      (tenant_id, venue_id, payment_id, order_id, alert_type, alert_level, title, body, entity_type, entity_id)
     VALUES ($1,$2,$3,$4,$5,'warning',$6,$7,$8,$9)`,
    [tenantId, venueId, paymentId, orderId, alertType, title, body, entityType, entityId ?? paymentId]
  ).catch(() => {})
}

export async function createEATPaymentAlert({ tenantId, venueId, locationId, deviceId, paymentId, orderId, alertType, alertLevel = 'warning', title, body, entityType, entityId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'eat_alerts' }
  const r = await query(
    `INSERT INTO pos360_payment_eat_alerts
      (tenant_id, venue_id, location_id, device_id, payment_id, order_id, alert_type, alert_level, title, body, entity_type, entity_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [tenantId, venueId, locationId, deviceId, paymentId, orderId, alertType, alertLevel, title, body, entityType, entityId]
  )
  return { ok: true, alert: r.rows[0] }
}

export async function listEATPaymentAlerts({ tenantId, venueId, acknowledged, alertType }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'eat_alerts', alerts: [], message: 'E.A.T. payment alerts are not connected yet.' }
  let where = `WHERE venue_id=$1`
  const params = [venueId]
  if (acknowledged !== undefined) { params.push(acknowledged === 'true'); where += ` AND acknowledged=$${params.length}` }
  if (alertType) { params.push(alertType); where += ` AND alert_type=$${params.length}` }
  const r = await query(
    `SELECT * FROM pos360_payment_eat_alerts ${where} ORDER BY created_at DESC LIMIT 50`, params
  )
  if (!r.rows.length) return { ok: true, alerts: [], message: 'E.A.T. payment alerts are not connected yet.' }
  return { ok: true, alerts: r.rows }
}

export async function acknowledgeEATPaymentAlert({ tenantId, venueId, alertId, actorId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'eat_alerts' }
  await query(
    `UPDATE pos360_payment_eat_alerts SET acknowledged=TRUE, acknowledged_by=$3, acknowledged_at=NOW()
     WHERE id=$1 AND venue_id=$2`,
    [alertId, venueId, actorId]
  )
  return { ok: true }
}

export async function getPaymentRiskSummary({ tenantId, venueId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'risk' }
  const r = await query(
    `SELECT review_type, COUNT(*) AS count, review_status FROM pos360_payment_risk_reviews
     WHERE venue_id=$1 GROUP BY review_type, review_status ORDER BY count DESC LIMIT 20`,
    [venueId]
  )
  return { ok: true, risks: r.rows }
}

export async function getRevenueSummaryHook({ tenantId, venueId }) {
  if (!isDbAvailable()) return { ...LOCAL_PREVIEW, area: 'revenue' }
  const r = await query(
    `SELECT payment_method, SUM(amount) AS total, COUNT(*) AS count
     FROM pos360_payments WHERE venue_id=$1 AND payment_status IN('paid','settled')
     GROUP BY payment_method`,
    [venueId]
  )
  return { ok: true, revenue: r.rows, note: 'Revenue summary hook. Real figures require live provider.' }
}

// ── Localization ───────────────────────────────────────────────────────────────
export async function getSupportedPaymentLanguages_svc() {
  return { ok: true, languages: getSupportedPaymentLanguages() }
}

export async function setPaymentLanguagePreference({ tenantId, venueId, deviceId, lang, actorId }) {
  await auditRecord(tenantId, venueId, 'set_language', { type: 'device', id: deviceId },
    { actorId }, { newValue: { lang } })
  return { ok: true, lang, message: 'Language preference saved.' }
}

export async function recordMissingPaymentTranslationKey({ tenantId, venueId, key, lang }) {
  await auditRecord(tenantId, venueId, 'missing_translation', { type: 'translation', id: key },
    {}, { newValue: { key, lang } })
  return { ok: true }
}
