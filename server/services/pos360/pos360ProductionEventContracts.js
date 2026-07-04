/**
 * POS360 Production Display System — Event Contracts (Phase B.4)
 */

export const PRODUCTION_EVENTS = {
  // Station lifecycle
  STATION_CREATED:          'production.station.created',
  STATION_UPDATED:          'production.station.updated',
  STATION_ACTIVATED:        'production.station.activated',
  STATION_DEACTIVATED:      'production.station.deactivated',
  STATION_DEVICE_ASSIGNED:  'production.station.device_assigned',

  // Tickets
  TICKET_CREATED:           'production.ticket.created',
  TICKET_ROUTED:            'production.ticket.routed',
  TICKET_HELD:              'production.ticket.held',
  TICKET_FIRED:             'production.ticket.fired',
  TICKET_STARTED:           'production.ticket.started',
  TICKET_READY:             'production.ticket.ready',
  TICKET_BUMPED:            'production.ticket.bumped',
  TICKET_COMPLETED:         'production.ticket.completed',
  TICKET_CANCELED:          'production.ticket.canceled',
  TICKET_ESCALATED:         'production.ticket.escalated',

  // Items
  ITEM_CREATED:             'production.item.created',
  ITEM_ROUTED:              'production.item.routed',
  ITEM_HELD:                'production.item.held',
  ITEM_FIRED:               'production.item.fired',
  ITEM_STARTED:             'production.item.started',
  ITEM_READY:               'production.item.ready',
  ITEM_COMPLETED:           'production.item.completed',
  ITEM_REFIRED:             'production.item.refired',
  ITEM_CANCELED:            'production.item.canceled',

  // Routing
  ROUTING_RESOLVED:         'production.routing.resolved',
  ROUTING_OVERRIDE_APPLIED: 'production.routing.override_applied',

  // Display
  DISPLAY_SYNCED:           'production.display.synced',
  DISPLAY_OFFLINE:          'production.display.offline',
  DISPLAY_ONLINE:           'production.display.online',

  // Intelligence
  BOTTLENECK_DETECTED:      'production.station.bottleneck_detected',
  DELAY_WARNING_CREATED:    'production.delay.warning_created',
  SMOKECRAFT_CONTEXT_LOADED:'production.smokecraft.context_loaded',
  EAT_RECOMMENDATIONS_LOADED:'production.eat.recommendations_loaded',

  // Analytics / Sync
  ANALYTICS_RECORDED:       'production.analytics.recorded',
  SYNC_COMPLETED:           'production.sync.completed',
  SYNC_FAILED:              'production.sync.failed',
}

export const STATION_TYPES = [
  'kitchen',
  'bar',
  'humidor',
  'expo',
  'dessert',
  'coffee',
  'retail',
  'merchandise',
  'gift_shop',
  'custom',
]

export const TICKET_STATUSES = [
  'queued',
  'held',
  'fired',
  'in_progress',
  'ready',
  'bumped',
  'completed',
  'canceled',
  'voided',
  'delayed',
  'escalated',
]

export const ITEM_STATUSES = [
  'queued',
  'held',
  'fired',
  'in_progress',
  'ready',
  'completed',
  'canceled',
  'voided',
  'refired',
  'delayed',
]

export const DISPLAY_MODES = [
  'station_view',
  'expo_view',
  'all_stations_view',
  'table_view',
  'order_view',
  'rush_view',
  'delayed_view',
  'completed_view',
  'manager_view',
]

export const HOLD_FIRE_EVENT_TYPES = [
  'hold',
  'fire',
  'hold_course',
  'fire_course',
  'fire_order',
  'delayed_fire',
  'timed_fire',
  'cancel_hold',
  'manager_override',
]
