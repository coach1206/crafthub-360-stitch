/**
 * Customer Order Status Service
 * Maps backend order lifecycle statuses to customer-friendly language.
 * Does not expose internal secrets or provider error details.
 */

const CUSTOMER_STATUS_MAP = {
  cart_preview:             { label: 'Cart Ready',           description: 'Your cart is ready for checkout.',              nextStep: 'Proceed to checkout.' },
  checkout_preview:         { label: 'Checkout Preview',     description: 'Review your order before submitting.',          nextStep: 'Confirm your order details.' },
  order_submission_preview: { label: 'Order Preview',        description: 'Your order preview is ready.',                  nextStep: 'Submit when ready.' },
  order_pending:            { label: 'Order Pending',        description: 'Your order is being reviewed.',                  nextStep: 'Waiting for confirmation.' },
  order_accepted:           { label: 'Order Accepted',       description: 'Your order has been accepted.',                  nextStep: 'Preparing your order.' },
  order_preparing:          { label: 'Preparing',            description: 'Your order is being prepared.',                  nextStep: 'Your order will be ready soon.' },
  order_ready:              { label: 'Ready',                description: 'Your order is ready for pickup.',               nextStep: 'Pick up your order.' },
  order_completed:          { label: 'Complete',             description: 'Your order is complete.',                       nextStep: null },
  order_cancelled:          { label: 'Cancelled',            description: 'Your order has been cancelled.',                nextStep: 'Contact staff for assistance.' },
  order_rejected:           { label: 'Not Accepted',         description: 'Your order could not be accepted.',             nextStep: 'Please contact staff.' },
  refund_pending:           { label: 'Refund Pending',       description: 'A refund has been requested.',                  nextStep: 'Refund processing time varies.' },
  refund_preview:           { label: 'Refund Preview',       description: 'Refund is in preview mode.',                    nextStep: 'Contact staff for live refund.' },
  staff_handoff_preview:    { label: 'Staff Assist',         description: 'A staff member is reviewing your order.',       nextStep: 'Wait for staff confirmation.' },
  payment_confirmation_required: { label: 'Payment Required', description: 'Payment confirmation is needed.',             nextStep: 'Provide payment to complete order.' },
}

export function getCustomerFacingStatus(orderLifecycleStatus) {
  return CUSTOMER_STATUS_MAP[orderLifecycleStatus] ?? {
    label:       'Processing',
    description: 'Your order status is being updated.',
    nextStep:    'Check back soon.',
  }
}

export async function getCustomerOrderStatus(orderId) {
  if (!orderId) return { ok: false, orderStatus: 'order_not_found', orderId }
  try {
    const { getOrder } = await import('../order/orderLifecycleService.js')
    const result = await getOrder(orderId)
    if (!result?.ok) return { ok: false, orderStatus: 'order_not_found', orderId }
    const customerStatus = getCustomerFacingStatus(result.order?.status ?? 'order_pending')
    return {
      ok:            true,
      orderId,
      customerStatus,
      orderStatus:   result.order?.status ?? 'order_pending',
      displayStatus: customerStatus.label,
      description:   customerStatus.description,
      nextStep:      customerStatus.nextStep,
    }
  } catch {
    return {
      ok:            true,
      orderId,
      orderStatus:   'order_submission_preview',
      displayStatus: 'Preview',
      description:   'Order status is in preview mode.',
      nextStep:      'Order tracking requires active order lifecycle integration.',
    }
  }
}

export async function getCustomerOrderTimeline(orderId) {
  if (!orderId) return { ok: false, orderId }
  try {
    const { getOrderTimeline } = await import('../order/orderLifecycleService.js')
    const result = await getOrderTimeline(orderId)
    return {
      ok:       true,
      orderId,
      timeline: (result?.timeline ?? []).map(e => ({
        status:    e.to_status,
        label:     getCustomerFacingStatus(e.to_status).label,
        timestamp: e.created_at,
      })),
      timelineStatus: 'order_lifecycle_preview',
    }
  } catch {
    return { ok: true, orderId, timeline: [], timelineStatus: 'order_lifecycle_preview' }
  }
}

export function buildCustomerStatusMessage(orderLifecycle = {}) {
  const status = orderLifecycle.status ?? 'order_submission_preview'
  const info = getCustomerFacingStatus(status)
  return {
    statusKey:     status,
    label:         info.label,
    description:   info.description,
    nextStep:      info.nextStep,
    statusMessage: `${info.label}: ${info.description}`,
  }
}

export function getCustomerNextStep(orderLifecycle = {}) {
  return getCustomerFacingStatus(orderLifecycle.status ?? 'order_submission_preview').nextStep
}

export async function getCustomerOrderBlockers(orderId) {
  const blockers = []
  if (!orderId) { blockers.push({ type: 'order_id_required', severity: 'critical' }); return { ok: false, blockers } }
  return { ok: true, orderId, blockers, blockerStatus: 'order_submission_preview' }
}
