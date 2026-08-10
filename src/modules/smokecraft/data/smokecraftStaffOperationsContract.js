/**
 * SmokeCraft Staff Operations Contract
 * Defines staff queue record shapes and order status transitions.
 */

export const STAFF_ORDER_STATUSES = {
  PENDING:           'pending',
  ACCEPTED:          'accepted_by_staff',
  SENT_TO_POS:       'sent_to_pos',
  COMPLETED:         'completed',
  CANCELLED:         'cancelled',
}

export const ORDER_MODES = {
  CUSTOMER_SELF:   'customer_self_order',
  STAFF_ASSISTED:  'staff_assisted_order',
}

export const STAFF_OPERATIONS_CONTRACT_VERSION = '0.1.0'

export function createStaffQueueRecord(overrides = {}) {
  return {
    queueRecordId:     `queue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    venueId:           null,
    staffId:           null,
    orderId:           null,
    orderMode:         ORDER_MODES.CUSTOMER_SELF,
    orderStatus:       STAFF_ORDER_STATUSES.PENDING,
    posSendAttempted:  false,
    posSendStatus:     'not_connected',
    eatSyncStatus:     'not_connected',
    staffNotes:        null,
    handoffStatus:     'pending',
    acceptedAt:        null,
    completedAt:       null,
    cancelledAt:       null,
    createdAt:         new Date().toISOString(),
    updatedAt:         new Date().toISOString(),
    ...overrides,
  }
}

export function createStaffPerformanceSummary(overrides = {}) {
  return {
    staffId:               null,
    venueId:               null,
    totalAssignedOrders:   0,
    acceptedOrders:        0,
    completedOrders:       0,
    cancelledOrders:       0,
    averageHandoffTime:    null,
    posSendAttempts:       0,
    posNotConnectedCount:  0,
    generatedAt:           new Date().toISOString(),
    ...overrides,
  }
}
