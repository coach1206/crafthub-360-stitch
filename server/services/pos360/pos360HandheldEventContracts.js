/**
 * POS360 Handheld Device Suite — Event Contracts (Phase B.3)
 * All event type constants. Nothing is hardcoded to a single venue.
 */

export const HANDHELD_EVENTS = {
  // Device lifecycle
  DEVICE_REGISTERED:              'handheld.device.registered',
  DEVICE_UPDATED:                 'handheld.device.updated',
  DEVICE_DISABLED:                'handheld.device.disabled',
  SESSION_STARTED:                'handheld.session.started',
  SESSION_ENDED:                  'handheld.session.ended',
  DIAGNOSTICS_RECORDED:           'handheld.diagnostics.recorded',

  // Sync
  SYNC_STARTED:                   'handheld.sync.started',
  SYNC_COMPLETED:                 'handheld.sync.completed',
  SYNC_FAILED:                    'handheld.sync.failed',
  OFFLINE_DETECTED:               'handheld.offline.detected',
  ONLINE_RESTORED:                'handheld.online.restored',
  OFFLINE_ACTION_QUEUED:          'handheld.offline_action.queued',
  OFFLINE_ACTION_REPLAYED:        'handheld.offline_action.replayed',

  // Notifications
  NOTIFICATION_CREATED:           'handheld.notification.created',
  NOTIFICATION_READ:              'handheld.notification.read',

  // Table
  TABLE_OPENED:                   'handheld.table.opened',
  TABLE_STATUS_CHANGED:           'handheld.table.status_changed',

  // Orders
  ORDER_CREATED:                  'handheld.order.created',
  ORDER_UPDATED:                  'handheld.order.updated',
  ORDER_ITEM_ADDED:               'handheld.order.item_added',
  ORDER_ITEM_REMOVED:             'handheld.order.item_removed',
  ORDER_SENT_TO_STATION:          'handheld.order.sent_to_station',

  // Payments
  PAYMENT_STARTED:                'handheld.payment.started',
  PAYMENT_TIP_SELECTED:           'handheld.payment.tip_selected',
  PAYMENT_SIGNATURE_CAPTURED:     'handheld.payment.signature_captured',
  RECEIPT_SENT:                   'handheld.receipt.sent',

  // Guests
  GUEST_ATTACHED:                 'handheld.guest.attached',

  // SmokeCraft / E.A.T.
  SMOKECRAFT_CONTEXT_LOADED:      'handheld.smokecraft.context_loaded',
  EAT_RECOMMENDATIONS_LOADED:     'handheld.eat.recommendations_loaded',

  // Manager approvals
  MANAGER_APPROVAL_REQUESTED:     'handheld.manager_approval.requested',
  MANAGER_APPROVAL_APPROVED:      'handheld.manager_approval.approved',
  MANAGER_APPROVAL_DENIED:        'handheld.manager_approval.denied',

  // Emergency
  EMERGENCY_MODE_ACTIVATED:       'handheld.emergency_mode.activated',
  EMERGENCY_MODE_DEACTIVATED:     'handheld.emergency_mode.deactivated',
}

export const DEVICE_TYPES = [
  'handheld',
  'tablet',
  'desktop',
  'kiosk',
  'manager_station',
  'kitchen_display',
  'bar_display',
  'humidor_display',
]

export const SYNC_STATUSES = {
  STARTED:   'started',
  COMPLETED: 'completed',
  FAILED:    'failed',
  PARTIAL:   'partial',
}

export const APPROVAL_TYPES = [
  'discount',
  'void',
  'refund',
  'override',
  'table_transfer',
  'manual_price',
]

export const NOTIFICATION_TYPES = {
  INFO:               'info',
  WARNING:            'warning',
  ALERT:              'alert',
  URGENT:             'urgent',
  MANAGER_REQUEST:    'manager_request',
  EAT_RECOMMENDATION: 'eat_recommendation',
}

export const OFFLINE_ACTION_TYPES = [
  'order.create',
  'order.update',
  'order.item_add',
  'table.status_change',
  'payment.start',
  'guest.attach',
  'sync.manual',
]

export const PAYMENT_METHODS = [
  'credit_card',
  'debit_card',
  'apple_pay',
  'google_pay',
  'tap_to_pay',
  'gift_card',
  'house_account',
  'split',
]
