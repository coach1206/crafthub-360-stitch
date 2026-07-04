/**
 * pos360PaymentCloseoutService.js — Phase B.11 Prompt X
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import { getPaymentFlags } from '../../config/pos360PaymentFeatureFlags.js'
import {
  isValidProviderType, isValidTerminalType, isValidTerminalStatus,
  isValidPaymentIntentStatus, isValidTenderType, isValidPaymentStatus,
  isValidTipSelectionType, isValidReceiptFormat, isValidReceiptStatus,
  isValidRefundStatus, isValidVoidStatus, isValidCashDrawerStatus,
  isValidCashDrawerEventType, isValidCloseoutStatus,
  isValidRiskFlagLevel, isValidRiskFlagType,
} from './pos360PaymentContracts.js'

const AREA = 'pos360-payments-closeout'
const LOCAL = (extra = {}) => ({ ok: false, localPreview: true, error: 'database_not_configured', area: AREA, ...extra })

// ── Audit ─────────────────────────────────────────────────────────────────────
async function auditRecord({ venueId, actorId, tenantId, action, entityType, entityId, meta = {}, isFinancial = false }) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_payment_audit
       (venue_id, actor_id, tenant_id, action, entity_type, entity_id, meta,
        contains_secrets, exposes_private_data, exposes_financial_data, stores_card_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,$8,FALSE)`,
    [venueId, actorId, tenantId, action, entityType, entityId, JSON.stringify(meta), isFinancial]
  )
}

// ── Payment provider profiles ─────────────────────────────────────────────────
export async function createProviderProfile({ venueId, actorId, tenantId, providerType, displayName, isActive = false, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidProviderType(providerType)) return { ok: false, error: 'invalid_provider_type' }
  const flags = getPaymentFlags()
  if (!flags.paymentProviderProfilesEnabled) return { ok: false, error: 'feature_disabled', feature: 'paymentProviderProfilesEnabled' }
  const r = await query(
    `INSERT INTO pos360_payment_provider_profiles
       (venue_id, provider_type, display_name, is_active, provider_config_summary, stores_card_data)
     VALUES ($1,$2,$3,$4,$5,FALSE) RETURNING *`,
    [venueId, providerType, displayName, isActive, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_provider_profile', entityType: 'payment_provider_profile', entityId: r.rows[0].id })
  return { ok: true, providerProfile: r.rows[0], note: 'Payment provider is not connected. No charges have been processed.' }
}

export async function listProviderProfiles({ venueId }) {
  if (!isDbAvailable()) return LOCAL({ providerProfiles: [] })
  const r = await query(`SELECT * FROM pos360_payment_provider_profiles WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId])
  return { ok: true, providerProfiles: r.rows, note: 'Payment provider is not connected. No charges have been processed.' }
}

export async function updateProviderProfile({ venueId, actorId, tenantId, providerProfileId, updates }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_payment_provider_profiles SET display_name=COALESCE($1,display_name), is_active=COALESCE($2,is_active), updated_at=NOW() WHERE id=$3 AND venue_id=$4 RETURNING *`,
    [updates.displayName, updates.isActive, providerProfileId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorId, tenantId, action: 'update_provider_profile', entityType: 'payment_provider_profile', entityId: providerProfileId })
  return { ok: true, providerProfile: r.rows[0] }
}

// ── Terminal profiles ─────────────────────────────────────────────────────────
export async function createTerminalProfile({ venueId, actorId, tenantId, terminalType, displayName, terminalStatus = 'active', meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidTerminalType(terminalType)) return { ok: false, error: 'invalid_terminal_type' }
  if (!isValidTerminalStatus(terminalStatus)) return { ok: false, error: 'invalid_terminal_status' }
  const flags = getPaymentFlags()
  if (!flags.terminalProfilesEnabled) return { ok: false, error: 'feature_disabled', feature: 'terminalProfilesEnabled' }
  const r = await query(
    `INSERT INTO pos360_payment_terminal_profiles
       (venue_id, terminal_type, display_name, terminal_status, terminal_meta, stores_card_data)
     VALUES ($1,$2,$3,$4,$5,FALSE) RETURNING *`,
    [venueId, terminalType, displayName, terminalStatus, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_terminal_profile', entityType: 'payment_terminal_profile', entityId: r.rows[0].id })
  return { ok: true, terminalProfile: r.rows[0] }
}

export async function listTerminalProfiles({ venueId }) {
  if (!isDbAvailable()) return LOCAL({ terminalProfiles: [] })
  const r = await query(`SELECT * FROM pos360_payment_terminal_profiles WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId])
  return { ok: true, terminalProfiles: r.rows }
}

export async function updateTerminalStatus({ venueId, actorId, tenantId, terminalProfileId, terminalStatus }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidTerminalStatus(terminalStatus)) return { ok: false, error: 'invalid_terminal_status' }
  const r = await query(
    `UPDATE pos360_payment_terminal_profiles SET terminal_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [terminalStatus, terminalProfileId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorId, tenantId, action: 'update_terminal_status', entityType: 'payment_terminal_profile', entityId: terminalProfileId })
  return { ok: true, terminalProfile: r.rows[0] }
}

// ── Payment intents ───────────────────────────────────────────────────────────
export async function createPaymentIntent({
  venueId, actorId, tenantId, amountCents, currencyCode = 'USD',
  orderId, reservationId, privateEventId, packageSelectionId, depositRecordId, minimumSpendProgressId,
  idempotencyKey, meta = {}
}) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.paymentIntentsEnabled) return { ok: false, error: 'feature_disabled', feature: 'paymentIntentsEnabled' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_payment_intents WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, paymentIntent: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_payment_intents
       (venue_id, amount_cents, currency_code, intent_status,
        order_id, reservation_id, private_event_id, package_selection_id, deposit_record_id, minimum_spend_progress_id,
        idempotency_key, intent_meta, exposes_financial_data)
     VALUES ($1,$2,$3,'draft',$4,$5,$6,$7,$8,$9,$10,$11,TRUE) RETURNING *`,
    [venueId, amountCents, currencyCode, orderId, reservationId, privateEventId, packageSelectionId, depositRecordId, minimumSpendProgressId, idempotencyKey, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_payment_intent', entityType: 'payment_intent', entityId: r.rows[0].id, isFinancial: true })
  return {
    ok: true,
    paymentIntent: r.rows[0],
    note: 'Payment provider is not connected. No charges have been processed. This is a local record only.',
  }
}

export async function listPaymentIntents({ venueId, orderId, reservationId, privateEventId }) {
  if (!isDbAvailable()) return LOCAL({ paymentIntents: [] })
  let q = `SELECT * FROM pos360_payment_intents WHERE venue_id=$1`
  const params = [venueId]
  if (orderId) { params.push(orderId); q += ` AND order_id=$${params.length}` }
  if (reservationId) { params.push(reservationId); q += ` AND reservation_id=$${params.length}` }
  if (privateEventId) { params.push(privateEventId); q += ` AND private_event_id=$${params.length}` }
  q += ` ORDER BY created_at DESC`
  const r = await query(q, params)
  return { ok: true, paymentIntents: r.rows, note: 'Payment provider is not connected. No charges have been processed.' }
}

export async function updatePaymentIntentStatus({ venueId, actorId, tenantId, paymentIntentId, intentStatus }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidPaymentIntentStatus(intentStatus)) return { ok: false, error: 'invalid_intent_status' }
  const r = await query(
    `UPDATE pos360_payment_intents SET intent_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [intentStatus, paymentIntentId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorId, tenantId, action: 'update_payment_intent_status', entityType: 'payment_intent', entityId: paymentIntentId, isFinancial: true })
  return { ok: true, paymentIntent: r.rows[0] }
}

// ── Payment records ───────────────────────────────────────────────────────────
export async function createPaymentRecord({
  venueId, actorId, tenantId, paymentIntentId, tenderType, amountCents, currencyCode = 'USD',
  orderId, reservationId, privateEventId, packageSelectionId, depositRecordId, minimumSpendProgressId,
  idempotencyKey, meta = {}
}) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidTenderType(tenderType)) return { ok: false, error: 'invalid_tender_type' }
  if (idempotencyKey) {
    const dup = await query(`SELECT id FROM pos360_payment_records WHERE idempotency_key=$1 AND venue_id=$2`, [idempotencyKey, venueId])
    if (dup.rows.length) return { ok: true, paymentRecord: dup.rows[0], duplicate: true }
  }
  const r = await query(
    `INSERT INTO pos360_payment_records
       (venue_id, payment_intent_id, tender_type, amount_cents, currency_code, payment_status,
        order_id, reservation_id, private_event_id, package_selection_id, deposit_record_id, minimum_spend_progress_id,
        idempotency_key, payment_meta, exposes_financial_data, stores_card_data)
     VALUES ($1,$2,$3,$4,$5,'pending',$6,$7,$8,$9,$10,$11,$12,$13,TRUE,FALSE) RETURNING *`,
    [venueId, paymentIntentId, tenderType, amountCents, currencyCode, orderId, reservationId, privateEventId, packageSelectionId, depositRecordId, minimumSpendProgressId, idempotencyKey, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_payment_record', entityType: 'payment_record', entityId: r.rows[0].id, isFinancial: true })
  return {
    ok: true,
    paymentRecord: r.rows[0],
    note: 'No payment has been processed. Payment integration is not connected. No card data is stored.',
  }
}

export async function listPaymentRecords({ venueId, paymentIntentId, orderId }) {
  if (!isDbAvailable()) return LOCAL({ paymentRecords: [] })
  let q = `SELECT * FROM pos360_payment_records WHERE venue_id=$1`
  const params = [venueId]
  if (paymentIntentId) { params.push(paymentIntentId); q += ` AND payment_intent_id=$${params.length}` }
  if (orderId) { params.push(orderId); q += ` AND order_id=$${params.length}` }
  q += ` ORDER BY created_at DESC`
  const r = await query(q, params)
  return { ok: true, paymentRecords: r.rows }
}

export async function updatePaymentStatus({ venueId, actorId, tenantId, paymentRecordId, paymentStatus }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidPaymentStatus(paymentStatus)) return { ok: false, error: 'invalid_payment_status' }
  const r = await query(
    `UPDATE pos360_payment_records SET payment_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [paymentStatus, paymentRecordId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await query(
    `INSERT INTO pos360_payment_status_history (venue_id, payment_record_id, payment_status, changed_by) VALUES ($1,$2,$3,$4)`,
    [venueId, paymentRecordId, paymentStatus, actorId]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'update_payment_status', entityType: 'payment_record', entityId: paymentRecordId, isFinancial: true })
  return { ok: true, paymentRecord: r.rows[0] }
}

// ── Split tender ──────────────────────────────────────────────────────────────
export async function createSplitTenderGroup({ venueId, actorId, tenantId, paymentIntentId, totalAmountCents, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.splitTenderEnabled) return { ok: false, error: 'feature_disabled', feature: 'splitTenderEnabled' }
  const r = await query(
    `INSERT INTO pos360_split_tender_groups (venue_id, payment_intent_id, total_amount_cents, split_meta, exposes_financial_data)
     VALUES ($1,$2,$3,$4,TRUE) RETURNING *`,
    [venueId, paymentIntentId, totalAmountCents, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_split_tender_group', entityType: 'split_tender_group', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, splitTenderGroup: r.rows[0] }
}

export async function addPaymentTender({ venueId, actorId, tenantId, splitTenderGroupId, tenderType, amountCents, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidTenderType(tenderType)) return { ok: false, error: 'invalid_tender_type' }
  const r = await query(
    `INSERT INTO pos360_payment_tenders (venue_id, split_tender_group_id, tender_type, amount_cents, tender_meta, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING *`,
    [venueId, splitTenderGroupId, tenderType, amountCents, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'add_payment_tender', entityType: 'payment_tender', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, paymentTender: r.rows[0] }
}

// ── Tips ──────────────────────────────────────────────────────────────────────
export async function createTipRecord({ venueId, actorId, tenantId, paymentRecordId, tipSelectionType, tipAmountCents, serverId, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidTipSelectionType(tipSelectionType)) return { ok: false, error: 'invalid_tip_selection_type' }
  const flags = getPaymentFlags()
  if (!flags.tipSelectionEnabled) return { ok: false, error: 'feature_disabled', feature: 'tipSelectionEnabled' }
  const r = await query(
    `INSERT INTO pos360_tip_records (venue_id, payment_record_id, tip_selection_type, tip_amount_cents, server_id, tip_meta, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE) RETURNING *`,
    [venueId, paymentRecordId, tipSelectionType, tipAmountCents, serverId, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_tip_record', entityType: 'tip_record', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, tipRecord: r.rows[0] }
}

export async function adjustTip({ venueId, actorId, tenantId, tipRecordId, newAmountCents, adjustmentReason }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.tipAdjustmentEnabled) return { ok: false, error: 'feature_disabled', feature: 'tipAdjustmentEnabled' }
  const adj = await query(
    `INSERT INTO pos360_tip_adjustments (venue_id, tip_record_id, adjusted_amount_cents, adjustment_reason, adjusted_by, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,TRUE) RETURNING *`,
    [venueId, tipRecordId, newAmountCents, adjustmentReason, actorId]
  )
  await query(`UPDATE pos360_tip_records SET tip_amount_cents=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3`, [newAmountCents, tipRecordId, venueId])
  await auditRecord({ venueId, actorId, tenantId, action: 'adjust_tip', entityType: 'tip_record', entityId: tipRecordId, isFinancial: true })
  return { ok: true, tipAdjustment: adj.rows[0] }
}

export async function listTipRecords({ venueId, paymentRecordId, serverId }) {
  if (!isDbAvailable()) return LOCAL({ tipRecords: [] })
  let q = `SELECT * FROM pos360_tip_records WHERE venue_id=$1`
  const params = [venueId]
  if (paymentRecordId) { params.push(paymentRecordId); q += ` AND payment_record_id=$${params.length}` }
  if (serverId) { params.push(serverId); q += ` AND server_id=$${params.length}` }
  q += ` ORDER BY created_at DESC`
  const r = await query(q, params)
  return { ok: true, tipRecords: r.rows }
}

// ── Signature metadata ────────────────────────────────────────────────────────
export async function createSignatureRecord({ venueId, actorId, tenantId, paymentRecordId, signatureMethod, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.signatureMetadataEnabled) return { ok: false, error: 'feature_disabled', feature: 'signatureMetadataEnabled' }
  const r = await query(
    `INSERT INTO pos360_signature_records (venue_id, payment_record_id, signature_method, signature_meta, stores_raw_signature, exposes_private_data)
     VALUES ($1,$2,$3,$4,FALSE,TRUE) RETURNING *`,
    [venueId, paymentRecordId, signatureMethod, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_signature_record', entityType: 'signature_record', entityId: r.rows[0].id })
  return {
    ok: true,
    signatureRecord: r.rows[0],
    note: 'No signature image is stored. Signature metadata only.',
  }
}

// ── Receipts ──────────────────────────────────────────────────────────────────
export async function createReceiptRecord({ venueId, actorId, tenantId, paymentRecordId, receiptFormat, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidReceiptFormat(receiptFormat)) return { ok: false, error: 'invalid_receipt_format' }
  const flags = getPaymentFlags()
  if (!flags.receiptGenerationEnabled) return { ok: false, error: 'feature_disabled', feature: 'receiptGenerationEnabled' }
  const r = await query(
    `INSERT INTO pos360_receipt_records (venue_id, payment_record_id, receipt_format, receipt_status, sent_externally, receipt_meta, exposes_private_data)
     VALUES ($1,$2,$3,'generated',FALSE,$4,TRUE) RETURNING *`,
    [venueId, paymentRecordId, receiptFormat, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_receipt_record', entityType: 'receipt_record', entityId: r.rows[0].id })
  return {
    ok: true,
    receiptRecord: r.rows[0],
    note: 'Receipt has not been sent. No email or SMS has been delivered.',
  }
}

export async function updateReceiptStatus({ venueId, actorId, tenantId, receiptRecordId, receiptStatus }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidReceiptStatus(receiptStatus)) return { ok: false, error: 'invalid_receipt_status' }
  const r = await query(
    `UPDATE pos360_receipt_records SET receipt_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [receiptStatus, receiptRecordId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  return { ok: true, receiptRecord: r.rows[0] }
}

export async function logReceiptDeliveryAttempt({ venueId, receiptRecordId, deliveryChannel, attemptStatus, failureReason }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `INSERT INTO pos360_receipt_delivery_attempts (venue_id, receipt_record_id, delivery_channel, attempt_status, failure_reason)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [venueId, receiptRecordId, deliveryChannel, attemptStatus, failureReason]
  )
  return {
    ok: true,
    deliveryAttempt: r.rows[0],
    note: 'Email delivery is not connected. No receipt email has been sent. SMS delivery is not connected. No receipt SMS has been sent.',
  }
}

// ── Refunds ───────────────────────────────────────────────────────────────────
export async function createRefundRequest({ venueId, actorId, tenantId, paymentRecordId, refundAmountCents, refundReason, requiresManagerApproval = true }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.refundWorkflowEnabled) return { ok: false, error: 'feature_disabled', feature: 'refundWorkflowEnabled' }
  if (flags.managerApprovalForRefundsEnabled && requiresManagerApproval) {
    return { ok: false, error: 'manager_approval_required', managerApprovalRequired: true, action: 'refund_payment' }
  }
  const r = await query(
    `INSERT INTO pos360_refund_requests
       (venue_id, payment_record_id, refund_amount_cents, refund_reason, refund_status, requested_by, exposes_financial_data)
     VALUES ($1,$2,$3,$4,'pending',$5,TRUE) RETURNING *`,
    [venueId, paymentRecordId, refundAmountCents, refundReason, actorId]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_refund_request', entityType: 'refund_request', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, refundRequest: r.rows[0] }
}

export async function approveRefund({ venueId, actorId, tenantId, refundRequestId }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_refund_requests SET refund_status='approved', approved_by=$1, approved_at=NOW(), updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [actorId, refundRequestId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorId, tenantId, action: 'approve_refund', entityType: 'refund_request', entityId: refundRequestId, isFinancial: true })
  return { ok: true, refundRequest: r.rows[0] }
}

export async function listRefundRequests({ venueId, paymentRecordId }) {
  if (!isDbAvailable()) return LOCAL({ refundRequests: [] })
  let q = `SELECT * FROM pos360_refund_requests WHERE venue_id=$1`
  const params = [venueId]
  if (paymentRecordId) { params.push(paymentRecordId); q += ` AND payment_record_id=$${params.length}` }
  q += ` ORDER BY created_at DESC`
  const r = await query(q, params)
  return { ok: true, refundRequests: r.rows }
}

// ── Voids ─────────────────────────────────────────────────────────────────────
export async function createVoidRequest({ venueId, actorId, tenantId, paymentRecordId, voidReason, requiresManagerApproval = true }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.voidWorkflowEnabled) return { ok: false, error: 'feature_disabled', feature: 'voidWorkflowEnabled' }
  if (flags.managerApprovalForVoidsEnabled && requiresManagerApproval) {
    return { ok: false, error: 'manager_approval_required', managerApprovalRequired: true, action: 'void_payment' }
  }
  const r = await query(
    `INSERT INTO pos360_void_requests
       (venue_id, payment_record_id, void_reason, void_status, requested_by, exposes_financial_data)
     VALUES ($1,$2,$3,'pending',$4,TRUE) RETURNING *`,
    [venueId, paymentRecordId, voidReason, actorId]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_void_request', entityType: 'void_request', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, voidRequest: r.rows[0] }
}

export async function approveVoid({ venueId, actorId, tenantId, voidRequestId }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_void_requests SET void_status='approved', approved_by=$1, approved_at=NOW(), updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [actorId, voidRequestId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorId, tenantId, action: 'approve_void', entityType: 'void_request', entityId: voidRequestId, isFinancial: true })
  return { ok: true, voidRequest: r.rows[0] }
}

// ── Cash drawer ───────────────────────────────────────────────────────────────
export async function createCashDrawer({ venueId, actorId, tenantId, displayName, locationLabel, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.cashDrawerEnabled) return { ok: false, error: 'feature_disabled', feature: 'cashDrawerEnabled' }
  const r = await query(
    `INSERT INTO pos360_cash_drawers (venue_id, display_name, location_label, drawer_status, drawer_meta, exposes_financial_data)
     VALUES ($1,$2,$3,'closed',$4,TRUE) RETURNING *`,
    [venueId, displayName, locationLabel, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_cash_drawer', entityType: 'cash_drawer', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, cashDrawer: r.rows[0] }
}

export async function listCashDrawers({ venueId }) {
  if (!isDbAvailable()) return LOCAL({ cashDrawers: [] })
  const r = await query(`SELECT * FROM pos360_cash_drawers WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId])
  return { ok: true, cashDrawers: r.rows }
}

export async function createCashDrawerEvent({ venueId, actorId, tenantId, cashDrawerId, eventType, amountCents = 0, note }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidCashDrawerEventType(eventType)) return { ok: false, error: 'invalid_event_type' }
  const r = await query(
    `INSERT INTO pos360_cash_drawer_events (venue_id, cash_drawer_id, event_type, amount_cents, event_note, performed_by, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE) RETURNING *`,
    [venueId, cashDrawerId, eventType, amountCents, note, actorId]
  )
  if (eventType === 'open') {
    await query(`UPDATE pos360_cash_drawers SET drawer_status='open', updated_at=NOW() WHERE id=$1 AND venue_id=$2`, [cashDrawerId, venueId])
  } else if (eventType === 'close') {
    await query(`UPDATE pos360_cash_drawers SET drawer_status='closed', updated_at=NOW() WHERE id=$1 AND venue_id=$2`, [cashDrawerId, venueId])
  }
  await auditRecord({ venueId, actorId, tenantId, action: `cash_drawer_${eventType}`, entityType: 'cash_drawer_event', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, cashDrawerEvent: r.rows[0] }
}

export async function listCashDrawerEvents({ venueId, cashDrawerId }) {
  if (!isDbAvailable()) return LOCAL({ cashDrawerEvents: [] })
  const r = await query(`SELECT * FROM pos360_cash_drawer_events WHERE venue_id=$1 AND cash_drawer_id=$2 ORDER BY created_at DESC`, [venueId, cashDrawerId])
  return { ok: true, cashDrawerEvents: r.rows }
}

// ── Server closeout ───────────────────────────────────────────────────────────
export async function createServerCloseout({ venueId, actorId, tenantId, serverId, closeoutDate, cashTotal, cardTotal, otherTotal, tipTotal, refundTotal, voidTotal, overShortAmount, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.serverCloseoutEnabled) return { ok: false, error: 'feature_disabled', feature: 'serverCloseoutEnabled' }
  const r = await query(
    `INSERT INTO pos360_server_closeouts
       (venue_id, server_id, closeout_date, cash_total_cents, card_total_cents, other_total_cents,
        tip_total_cents, refund_total_cents, void_total_cents, over_short_amount_cents,
        closeout_status, closeout_meta, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'open',$11,TRUE) RETURNING *`,
    [venueId, serverId, closeoutDate, cashTotal, cardTotal, otherTotal, tipTotal, refundTotal, voidTotal, overShortAmount, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_server_closeout', entityType: 'server_closeout', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, serverCloseout: r.rows[0] }
}

export async function listServerCloseouts({ venueId, serverId, closeoutDate }) {
  if (!isDbAvailable()) return LOCAL({ serverCloseouts: [] })
  let q = `SELECT * FROM pos360_server_closeouts WHERE venue_id=$1`
  const params = [venueId]
  if (serverId) { params.push(serverId); q += ` AND server_id=$${params.length}` }
  if (closeoutDate) { params.push(closeoutDate); q += ` AND closeout_date=$${params.length}` }
  q += ` ORDER BY closeout_date DESC, created_at DESC`
  const r = await query(q, params)
  return { ok: true, serverCloseouts: r.rows }
}

export async function approveServerCloseout({ venueId, actorId, tenantId, serverCloseoutId }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_server_closeouts SET closeout_status='manager_approved', manager_approved_by=$1, manager_approved_at=NOW(), updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [actorId, serverCloseoutId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorId, tenantId, action: 'approve_server_closeout', entityType: 'server_closeout', entityId: serverCloseoutId, isFinancial: true })
  return { ok: true, serverCloseout: r.rows[0] }
}

// ── Shift closeout ────────────────────────────────────────────────────────────
export async function createShiftCloseout({ venueId, actorId, tenantId, shiftLabel, closeoutDate, cashTotal, cardTotal, otherTotal, tipTotal, refundTotal, voidTotal, overShortAmount, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.shiftCloseoutEnabled) return { ok: false, error: 'feature_disabled', feature: 'shiftCloseoutEnabled' }
  const r = await query(
    `INSERT INTO pos360_shift_closeouts
       (venue_id, shift_label, closeout_date, cash_total_cents, card_total_cents, other_total_cents,
        tip_total_cents, refund_total_cents, void_total_cents, over_short_amount_cents,
        closeout_status, closeout_meta, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'open',$11,TRUE) RETURNING *`,
    [venueId, shiftLabel, closeoutDate, cashTotal, cardTotal, otherTotal, tipTotal, refundTotal, voidTotal, overShortAmount, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_shift_closeout', entityType: 'shift_closeout', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, shiftCloseout: r.rows[0] }
}

export async function listShiftCloseouts({ venueId, closeoutDate }) {
  if (!isDbAvailable()) return LOCAL({ shiftCloseouts: [] })
  let q = `SELECT * FROM pos360_shift_closeouts WHERE venue_id=$1`
  const params = [venueId]
  if (closeoutDate) { params.push(closeoutDate); q += ` AND closeout_date=$${params.length}` }
  q += ` ORDER BY closeout_date DESC, created_at DESC`
  const r = await query(q, params)
  return { ok: true, shiftCloseouts: r.rows }
}

export async function approveShiftCloseout({ venueId, actorId, tenantId, shiftCloseoutId }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_shift_closeouts SET closeout_status='manager_approved', manager_approved_by=$1, manager_approved_at=NOW(), updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [actorId, shiftCloseoutId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorId, tenantId, action: 'approve_shift_closeout', entityType: 'shift_closeout', entityId: shiftCloseoutId, isFinancial: true })
  return { ok: true, shiftCloseout: r.rows[0] }
}

// ── Daily closeout ────────────────────────────────────────────────────────────
export async function createDailyCloseout({ venueId, actorId, tenantId, closeoutDate, cashTotal, cardTotal, otherTotal, tipTotal, refundTotal, voidTotal, overShortAmount, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.dailyCloseoutEnabled) return { ok: false, error: 'feature_disabled', feature: 'dailyCloseoutEnabled' }
  const r = await query(
    `INSERT INTO pos360_daily_closeouts
       (venue_id, closeout_date, cash_total_cents, card_total_cents, other_total_cents,
        tip_total_cents, refund_total_cents, void_total_cents, over_short_amount_cents,
        closeout_status, closeout_meta, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'open',$10,TRUE) RETURNING *`,
    [venueId, closeoutDate, cashTotal, cardTotal, otherTotal, tipTotal, refundTotal, voidTotal, overShortAmount, JSON.stringify(meta)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_daily_closeout', entityType: 'daily_closeout', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, dailyCloseout: r.rows[0] }
}

export async function listDailyCloseouts({ venueId }) {
  if (!isDbAvailable()) return LOCAL({ dailyCloseouts: [] })
  const r = await query(`SELECT * FROM pos360_daily_closeouts WHERE venue_id=$1 ORDER BY closeout_date DESC`, [venueId])
  return { ok: true, dailyCloseouts: r.rows }
}

export async function approveDailyCloseout({ venueId, actorId, tenantId, dailyCloseoutId }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_daily_closeouts SET closeout_status='manager_approved', manager_approved_by=$1, manager_approved_at=NOW(), updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [actorId, dailyCloseoutId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorId, tenantId, action: 'approve_daily_closeout', entityType: 'daily_closeout', entityId: dailyCloseoutId, isFinancial: true })
  return { ok: true, dailyCloseout: r.rows[0] }
}

// ── Risk flags ────────────────────────────────────────────────────────────────
export async function createRiskFlag({ venueId, actorId, tenantId, paymentRecordId, flagType, flagLevel, flagNote }) {
  if (!isDbAvailable()) return LOCAL()
  if (!isValidRiskFlagType(flagType)) return { ok: false, error: 'invalid_flag_type' }
  if (!isValidRiskFlagLevel(flagLevel)) return { ok: false, error: 'invalid_flag_level' }
  const flags = getPaymentFlags()
  if (!flags.paymentRiskFlagsEnabled) return { ok: false, error: 'feature_disabled', feature: 'paymentRiskFlagsEnabled' }
  const r = await query(
    `INSERT INTO pos360_payment_risk_flags (venue_id, payment_record_id, flag_type, flag_level, flag_note, flagged_by, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,TRUE) RETURNING *`,
    [venueId, paymentRecordId, flagType, flagLevel, flagNote, actorId]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'create_risk_flag', entityType: 'payment_risk_flag', entityId: r.rows[0].id, isFinancial: true })
  return { ok: true, riskFlag: r.rows[0] }
}

export async function listRiskFlags({ venueId, flagLevel }) {
  if (!isDbAvailable()) return LOCAL({ riskFlags: [] })
  let q = `SELECT * FROM pos360_payment_risk_flags WHERE venue_id=$1`
  const params = [venueId]
  if (flagLevel) { params.push(flagLevel); q += ` AND flag_level=$${params.length}` }
  q += ` ORDER BY created_at DESC`
  const r = await query(q, params)
  return { ok: true, riskFlags: r.rows }
}

// ── Revenue insight hooks ─────────────────────────────────────────────────────
export async function createRevenueInsightPlaceholder({ venueId, actorId, tenantId, insightType, meta = {} }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.eatRevenueInsightHooksEnabled) {
    return {
      ok: false, error: 'feature_disabled', feature: 'eatRevenueInsightHooksEnabled',
      note: 'E.A.T. revenue insights are not connected yet.',
    }
  }
  const r = await query(
    `INSERT INTO pos360_payment_revenue_insights (venue_id, insight_type, insight_meta, exposes_financial_data)
     VALUES ($1,$2,$3,TRUE) RETURNING *`,
    [venueId, insightType, JSON.stringify(meta)]
  )
  return { ok: true, revenueInsight: r.rows[0] }
}

export async function listRevenueInsights({ venueId }) {
  if (!isDbAvailable()) return LOCAL({ revenueInsights: [] })
  const r = await query(`SELECT * FROM pos360_payment_revenue_insights WHERE venue_id=$1 ORDER BY created_at DESC`, [venueId])
  return {
    ok: true,
    revenueInsights: r.rows,
    note: 'E.A.T. revenue insights are not connected yet.',
  }
}

// ── Offline queue ─────────────────────────────────────────────────────────────
export async function queueOfflinePaymentAction({ venueId, actorId, tenantId, actionType, payload }) {
  if (!isDbAvailable()) return LOCAL()
  const flags = getPaymentFlags()
  if (!flags.offlinePaymentQueueEnabled) return { ok: false, error: 'feature_disabled', feature: 'offlinePaymentQueueEnabled' }
  const r = await query(
    `INSERT INTO pos360_payment_offline_queue (venue_id, actor_id, action_type, payload, queue_status)
     VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
    [venueId, actorId, actionType, JSON.stringify(payload)]
  )
  await auditRecord({ venueId, actorId, tenantId, action: 'queue_offline_payment_action', entityType: 'payment_offline_queue', entityId: r.rows[0].id })
  return { ok: true, offlineAction: r.rows[0], note: 'Action queued for sync when connection is restored.' }
}

export async function listOfflinePaymentQueue({ venueId }) {
  if (!isDbAvailable()) return LOCAL({ offlineQueue: [] })
  const r = await query(`SELECT * FROM pos360_payment_offline_queue WHERE venue_id=$1 AND queue_status='pending' ORDER BY created_at ASC`, [venueId])
  return { ok: true, offlineQueue: r.rows }
}

export async function markOfflinePaymentActionSynced({ venueId, actorId, tenantId, offlineActionId }) {
  if (!isDbAvailable()) return LOCAL()
  const r = await query(
    `UPDATE pos360_payment_offline_queue SET queue_status='synced', synced_at=NOW(), updated_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [offlineActionId, venueId]
  )
  if (!r.rows.length) return { ok: false, error: 'not_found' }
  await auditRecord({ venueId, actorId, tenantId, action: 'mark_offline_payment_action_synced', entityType: 'payment_offline_queue', entityId: offlineActionId })
  return { ok: true, offlineAction: r.rows[0] }
}
