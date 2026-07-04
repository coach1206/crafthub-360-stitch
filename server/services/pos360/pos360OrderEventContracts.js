/**
 * POS360 Order Lifecycle — Event Contracts (Phase B.5)
 */

export const ORDER_EVENTS = {
  ORDER_CREATED:              'order.created',
  ORDER_UPDATED:              'order.updated',
  ORDER_STATUS_CHANGED:       'order.status_changed',
  ORDER_CANCELED:             'order.canceled',
  ORDER_VOIDED:               'order.voided',
  ORDER_CLOSED:               'order.closed',
  ORDER_REOPENED:             'order.reopened',

  ITEM_ADDED:                 'order.item.added',
  ITEM_UPDATED:               'order.item.updated',
  ITEM_REMOVED:               'order.item.removed',
  ITEM_VOIDED:                'order.item.voided',
  ITEM_REFIRED:               'order.item.refired',

  COURSE_CREATED:             'order.course.created',
  COURSE_UPDATED:             'order.course.updated',
  COURSE_HELD:                'order.course.held',
  COURSE_FIRED:               'order.course.fired',
  COURSE_SEQUENCED:           'order.course.sequenced',

  TAB_CREATED:                'order.tab.created',
  TAB_UPDATED:                'order.tab.updated',
  TAB_TRANSFERRED:            'order.tab.transferred',
  TAB_MERGED:                 'order.tab.merged',
  TAB_SPLIT:                  'order.tab.split',
  TAB_PAYMENT_PENDING:        'order.tab.payment_pending',

  TABLE_LINKED:               'order.table.linked',
  TABLE_TRANSFERRED:          'order.table.transferred',

  GUEST_LINKED:               'order.guest.linked',

  SMOKECRAFT_LINKED:          'order.smokecraft.linked',
  LOYALTY_LINKED:             'order.loyalty.linked',

  ROUTING_RESOLVED:           'order.routing.resolved',
  ROUTING_FAILED:             'order.routing.failed',
  ROUTED_TO_PRODUCTION:       'order.routed_to_production',
  ITEM_ROUTED_TO_STATION:     'order.item.routed_to_station',

  HOLD_APPLIED:               'order.hold.applied',
  FIRE_EXECUTED:              'order.fire.executed',

  PRODUCTION_TICKET_CREATED:  'order.production_ticket.created',

  SYNC_COMPLETED:             'order.sync.completed',
  SYNC_FAILED:                'order.sync.failed',
}

export const ORDER_TYPES = [
  'dine_in',
  'table_service',
  'bar_tab',
  'cigar_lounge',
  'retail',
  'takeout',
  'delivery_hook',
  'event',
  'private_room',
  'hotel_room',
  'custom',
]

export const ORDER_STATUSES = [
  'draft',
  'open',
  'held',
  'fired',
  'partially_fired',
  'in_production',
  'partially_ready',
  'ready',
  'served',
  'payment_pending',
  'paid',
  'closed',
  'canceled',
  'voided',
  'refunded_hook',
  'sync_pending',
]

export const ORDER_ITEM_STATUSES = [
  'draft',
  'added',
  'held',
  'fired',
  'routed',
  'in_production',
  'ready',
  'served',
  'canceled',
  'voided',
  'refired',
]

export const TAB_TYPES = [
  'table',
  'guest',
  'bar',
  'cigar_lounge',
  'retail',
  'event',
  'custom',
]

export const TAB_STATUSES = [
  'open',
  'held',
  'payment_pending',
  'paid',
  'closed',
  'transferred',
  'merged',
  'voided',
]

export const COURSE_STATUSES = [
  'draft',
  'held',
  'fired',
  'in_production',
  'ready',
  'served',
  'completed',
  'canceled',
]

export const HOLD_FIRE_TYPES = [
  'hold_item',
  'fire_item',
  'hold_order',
  'fire_order',
  'hold_course',
  'fire_course',
  'fire_all_courses',
  'schedule_fire',
  'cancel_hold',
  'manager_override',
  'refire_item',
]
