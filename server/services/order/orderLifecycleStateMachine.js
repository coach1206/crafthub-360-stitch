/**
 * Order Lifecycle State Machine
 * Defines valid order states and allowed transitions.
 */

const ORDER_STATES = {
  ORDER_DRAFT:        'order_draft',
  ORDER_PENDING:      'order_pending',
  ORDER_SUBMITTED:    'order_submitted',
  ORDER_ACCEPTED:     'order_accepted',
  ORDER_ROUTED:       'order_routed',
  ORDER_PREPARING:    'order_preparing',
  ORDER_READY:        'order_ready',
  ORDER_COMPLETED:    'order_completed',
  ORDER_CANCELLED:    'order_cancelled',
  ORDER_REJECTED:     'order_rejected',
  ORDER_FAILED:       'order_failed',
  REFUND_PENDING:     'refund_pending',
  PARTIALLY_REFUNDED: 'partially_refunded',
  ORDER_REFUNDED:     'order_refunded',
}

// Defines what states each status can transition TO
const VALID_TRANSITIONS = {
  order_draft:        ['order_pending', 'order_cancelled'],
  order_pending:      ['order_submitted', 'order_cancelled'],
  order_submitted:    ['order_accepted', 'order_rejected', 'order_cancelled'],
  order_accepted:     ['order_routed', 'order_cancelled', 'order_failed'],
  order_routed:       ['order_preparing', 'order_cancelled', 'order_failed'],
  order_preparing:    ['order_ready', 'order_cancelled', 'order_failed'],
  order_ready:        ['order_completed', 'order_cancelled'],
  order_completed:    ['refund_pending'],
  order_cancelled:    [],
  order_rejected:     [],
  order_failed:       ['order_pending'],
  refund_pending:     ['partially_refunded', 'order_refunded'],
  partially_refunded: ['refund_pending', 'order_refunded'],
  order_refunded:     [],
}

const TERMINAL_STATES = new Set(['order_completed', 'order_cancelled', 'order_rejected', 'order_refunded'])
const REFUND_STATES   = new Set(['refund_pending', 'partially_refunded', 'order_refunded'])

export function getValidOrderStates() {
  return { ...ORDER_STATES }
}

export function getValidTransitions() {
  return { ...VALID_TRANSITIONS }
}

export function canTransitionOrder(fromStatus, toStatus) {
  const allowed = VALID_TRANSITIONS[fromStatus]
  if (!allowed) return false
  return allowed.includes(toStatus)
}

export function validateOrderTransition(fromStatus, toStatus) {
  if (!fromStatus || !toStatus) {
    return { valid: false, reason: 'invalid_transition', message: 'fromStatus and toStatus are required.' }
  }
  if (!VALID_TRANSITIONS[fromStatus]) {
    return { valid: false, reason: 'invalid_transition', message: `Unknown status: ${fromStatus}` }
  }
  if (!canTransitionOrder(fromStatus, toStatus)) {
    return {
      valid: false,
      reason: 'invalid_transition',
      message: `Cannot transition from ${fromStatus} to ${toStatus}.`,
      allowedTargets: VALID_TRANSITIONS[fromStatus] ?? [],
    }
  }
  return { valid: true, reason: 'transition_allowed' }
}

export function getNextAllowedStatuses(currentStatus) {
  return VALID_TRANSITIONS[currentStatus] ?? []
}

export function isTerminalOrderStatus(status) {
  return TERMINAL_STATES.has(status)
}

export function isRefundStatus(status) {
  return REFUND_STATES.has(status)
}

export function buildTransitionResult(fromStatus, toStatus, actorContext = {}) {
  const validation = validateOrderTransition(fromStatus, toStatus)
  if (!validation.valid) {
    return {
      ok: false,
      transitioned: false,
      fromStatus,
      toStatus,
      reason: validation.reason,
      message: validation.message,
      allowedTargets: validation.allowedTargets ?? [],
    }
  }
  return {
    ok: true,
    transitioned: true,
    fromStatus,
    toStatus,
    reason: 'transition_allowed',
    actorId:   actorContext.actorId   ?? null,
    actorRole: actorContext.actorRole ?? null,
    transitionedAt: new Date().toISOString(),
    isTerminal: isTerminalOrderStatus(toStatus),
    isRefund:   isRefundStatus(toStatus),
  }
}
