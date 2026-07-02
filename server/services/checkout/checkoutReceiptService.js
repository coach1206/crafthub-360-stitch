/**
 * Checkout Receipt Service
 * Builds receipt previews. Does not claim finalized receipts, tax collection, or payment capture.
 */

import { v4 as uuidv4 } from 'uuid'

const RECEIPT_STORE = new Map()

function now() { return new Date().toISOString() }

export function buildLineItemReceiptRows(cartItems = []) {
  return cartItems.map(item => ({
    cart_item_id:        item.cart_item_id,
    item_name:           item.item_name,
    item_category:       item.item_category ?? 'general',
    quantity:            item.quantity,
    unit_amount:         item.unit_amount,
    line_subtotal_amount: item.line_subtotal_amount,
    fulfillment_owner:   item.fulfillment_owner ?? 'venue',
    availability_status: item.availability_status ?? 'availability_required',
    approval_status:     item.approval_status ?? 'approval_required',
    tax_category:        item.tax_category ?? null,
  }))
}

export function buildFeeBreakdown(cartPayload = {}, paymentPreview = null) {
  const subtotal = cartPayload.subtotal_amount ?? 0
  const feeAmount = paymentPreview?.feeAmountCents ?? cartPayload.fee_amount ?? 0
  return {
    subtotalCents:     subtotal,
    feeAmountCents:    feeAmount,
    feeBreakdown:      paymentPreview?.feeBreakdown ?? null,
    paymentStatus:     'payment_confirmation_required',
    feeNote:           'Fee amounts are previews only. Payment capture requires live Stripe integration.',
  }
}

export function buildTotalsBreakdown(cartPayload = {}, taxPreview = null, paymentPreview = null) {
  const subtotal = cartPayload.subtotal_amount ?? 0
  const fee = paymentPreview?.feeAmountCents ?? cartPayload.fee_amount ?? 0
  const tax = taxPreview?.taxAmountCents ?? cartPayload.tax_amount ?? 0
  const total = subtotal + fee + tax

  if (subtotal < 0 || fee < 0 || tax < 0)
    return { ok: false, error: 'negative amounts are rejected' }

  return {
    ok:              true,
    subtotalCents:   subtotal,
    feeAmountCents:  fee,
    taxAmountCents:  tax,
    totalCents:      total,
    taxStatus:       'tax_preview',
    paymentStatus:   'payment_confirmation_required',
    totalsNote:      'Totals are previews. Tax is estimated and not legally collected. Payment is not captured.',
  }
}

export function buildReadinessDisclosures(checkoutPreview = {}) {
  const disclosures = []
  if (checkoutPreview.paymentStatus === 'payment_confirmation_required')
    disclosures.push({ type: 'payment_confirmation_required', message: 'Payment has not been captured. A live Stripe integration is required.' })
  if (checkoutPreview.taxStatus === 'tax_preview_required' || checkoutPreview.taxStatus === 'tax_preview')
    disclosures.push({ type: 'tax_preview_required', message: 'Tax amount is an estimate only. Legal tax compliance requires verified configuration.' })
  if (checkoutPreview.posStatus === 'pos_sync_pending')
    disclosures.push({ type: 'pos_sync_pending', message: 'POS sync is pending. Order has not been sent to a live POS system.' })
  if (checkoutPreview.kdsStatus === 'kds_routing_pending')
    disclosures.push({ type: 'kds_routing_pending', message: 'KDS routing is pending. No live kitchen, bar, or station has been notified.' })
  if (checkoutPreview.inventoryStatus === 'inventory_unavailable')
    disclosures.push({ type: 'inventory_unavailable', message: 'Inventory is not connected. Availability cannot be confirmed.' })
  if (checkoutPreview.orderStatus === 'order_submission_preview')
    disclosures.push({ type: 'order_submission_preview', message: 'Order has not been submitted to a live system.' })
  return disclosures
}

export function buildReceiptPreview(cartPayload = {}, checkoutPreview = {}) {
  const items = cartPayload.items ?? []
  const lineItems = buildLineItemReceiptRows(items)
  const totals = buildTotalsBreakdown(cartPayload, checkoutPreview.taxPreview, checkoutPreview.paymentPreview)
  const fees = buildFeeBreakdown(cartPayload, checkoutPreview.paymentPreview)
  const disclosures = buildReadinessDisclosures(checkoutPreview)

  const receiptPreviewId = uuidv4()
  const receipt = {
    receipt_preview_id: receiptPreviewId,
    cart_id:            cartPayload.cart_id,
    venue_id:           cartPayload.venue_id,
    order_id:           checkoutPreview.orderId ?? null,
    receipt_status:     'receipt_preview',
    subtotal_amount:    totals.subtotalCents ?? 0,
    fee_amount:         totals.feeAmountCents ?? 0,
    tax_amount:         totals.taxAmountCents ?? 0,
    total_amount:       totals.totalCents ?? 0,
    payment_status:     'payment_confirmation_required',
    tax_status:         'tax_preview_required',
    order_status:       checkoutPreview.orderStatus ?? 'order_submission_preview',
    receipt_snapshot: {
      lineItems,
      totals,
      fees,
      disclosures,
      paymentPreview:  checkoutPreview.paymentPreview ?? null,
      taxPreview:      checkoutPreview.taxPreview ?? null,
      kdsPreview:      checkoutPreview.kdsPreview ?? null,
      posStatus:       checkoutPreview.posStatus ?? 'pos_sync_pending',
    },
    created_at: now(),
    updated_at: now(),
  }
  RECEIPT_STORE.set(receiptPreviewId, receipt)
  return {
    ok:              true,
    receiptPreview:  receipt,
    receiptStatus:   'receipt_preview',
    disclosures,
    persistenceStatus: process.env.DATABASE_URL ? 'database_required' : 'not_persisted',
  }
}

export function getReceiptPreview(cartId) {
  for (const r of RECEIPT_STORE.values()) {
    if (r.cart_id === cartId) return { ok: true, receiptPreview: r, receiptStatus: r.receipt_status }
  }
  return { ok: false, receiptStatus: 'receipt_not_found', cartId }
}

export function formatReceiptPreviewForCustomer(receiptPreview) {
  if (!receiptPreview) return null
  const snap = receiptPreview.receipt_snapshot ?? {}
  return {
    receiptPreviewId: receiptPreview.receipt_preview_id,
    receiptStatus:    receiptPreview.receipt_status,
    items:            snap.lineItems ?? [],
    subtotal:         receiptPreview.subtotal_amount,
    fees:             receiptPreview.fee_amount,
    estimatedTax:     receiptPreview.tax_amount,
    estimatedTotal:   receiptPreview.total_amount,
    paymentStatus:    receiptPreview.payment_status,
    taxStatus:        receiptPreview.tax_status,
    orderStatus:      receiptPreview.order_status,
    disclosures:      snap.disclosures ?? [],
    previewNote:      'This receipt is a preview only. No payment has been captured and no tax has been collected.',
  }
}
