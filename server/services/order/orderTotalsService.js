/**
 * Order Totals and Validation Service
 * Integer cents only. No rounding leakage.
 */

export function validateLineItems(orderPayload) {
  const errors = []
  const items = orderPayload?.lineItems ?? []
  if (!items.length) { errors.push({ field: 'lineItems', reason: 'line_items_required' }); return { ok: false, errors } }
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if ((item.quantity ?? 0) <= 0)     errors.push({ field: `lineItems[${i}].quantity`, reason: 'invalid_quantity' })
    if ((item.unitAmount ?? 0) < 0)    errors.push({ field: `lineItems[${i}].unitAmount`, reason: 'negative_amount' })
    if (!item.itemName)                errors.push({ field: `lineItems[${i}].itemName`, reason: 'item_name_required' })
  }
  return { ok: errors.length === 0, errors }
}

export function validateVenueItems(orderPayload) {
  const venueItems = (orderPayload?.lineItems ?? []).filter(li => !li.partnerId)
  const errors = venueItems.flatMap((item, i) =>
    (item.quantity ?? 0) <= 0 ? [{ field: `venueItem[${i}].quantity`, reason: 'invalid_quantity' }] : []
  )
  return { ok: errors.length === 0, errors, venueItemCount: venueItems.length }
}

export function validatePartnerItems(orderPayload) {
  const partnerItems = (orderPayload?.lineItems ?? []).filter(li => li.partnerId)
  const errors = []
  for (let i = 0; i < partnerItems.length; i++) {
    const item = partnerItems[i]
    if (!item.partnerId)                errors.push({ field: `partnerItem[${i}].partnerId`, reason: 'partner_id_required' })
    if ((item.quantity ?? 0) <= 0)     errors.push({ field: `partnerItem[${i}].quantity`, reason: 'invalid_quantity' })
    if ((item.unitAmount ?? 0) < 0)    errors.push({ field: `partnerItem[${i}].unitAmount`, reason: 'negative_amount' })
  }
  return { ok: errors.length === 0, errors, partnerItemCount: partnerItems.length }
}

export function buildOrderTotals(orderPayload) {
  const items = orderPayload?.lineItems ?? []
  const fees  = orderPayload?.fees ?? []

  let subtotalCents = 0
  const lineItemResults = items.map(item => {
    const lineTotal = (item.quantity ?? 0) * (item.unitAmount ?? 0)
    subtotalCents += lineTotal
    return { ...item, lineSubtotalAmount: lineTotal }
  })

  let feeCents = 0
  for (const fee of fees) { feeCents += fee.amountCents ?? 0 }

  const taxCents    = orderPayload?.taxAmountCents ?? 0
  const totalCents  = subtotalCents + feeCents + taxCents

  return {
    ok: true,
    lineItems:       lineItemResults,
    subtotalAmount:  subtotalCents,
    feeAmount:       feeCents,
    taxAmount:       taxCents,
    totalAmount:     totalCents,
    currency:        'usd',
    taxStatus:       'tax_preview_required',
    paymentStatus:   'payment_confirmation_required',
  }
}

export function validateOrderAmounts(orderPayload) {
  const errors = []
  const subtotal = orderPayload?.subtotalAmount ?? 0
  const fees     = orderPayload?.feeAmount ?? 0
  const tax      = orderPayload?.taxAmount ?? 0
  const total    = orderPayload?.totalAmount ?? 0

  if (subtotal < 0) errors.push({ field: 'subtotalAmount', reason: 'negative_amount' })
  if (fees < 0)     errors.push({ field: 'feeAmount',      reason: 'negative_amount' })
  if (tax < 0)      errors.push({ field: 'taxAmount',      reason: 'negative_amount' })
  if (total !== subtotal + fees + tax) {
    errors.push({ field: 'totalAmount', reason: 'total_mismatch', expected: subtotal + fees + tax, received: total })
  }
  return { ok: errors.length === 0, errors }
}

export function validateOrderTotals(orderPayload) {
  const lineValidation   = validateLineItems(orderPayload)
  const amountValidation = validateOrderAmounts(orderPayload)
  const errors = [...lineValidation.errors, ...amountValidation.errors]
  return { ok: errors.length === 0, errors }
}

export function attachTaxPreviewToOrder(orderPayload, taxPreview) {
  return {
    ...orderPayload,
    taxAmount:   taxPreview?.totalTaxCents ?? 0,
    taxStatus:   taxPreview?.overallTaxStatus ?? 'tax_preview_required',
    taxPreview:  taxPreview ?? null,
    totalAmount: (orderPayload.subtotalAmount ?? 0) + (orderPayload.feeAmount ?? 0) + (taxPreview?.totalTaxCents ?? 0),
  }
}

export function attachMoneyBridgePreviewToOrder(orderPayload, paymentPreview) {
  return {
    ...orderPayload,
    paymentStatus:   'payment_confirmation_required',
    paymentPreview:  paymentPreview ?? null,
    settlementStatus: 'settlement_pending_preview',
    moneyBridgeStatus: paymentPreview?.moneyBridgeStatus ?? 'preview_only',
  }
}
