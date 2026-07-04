/**
 * pos360ReservationEventContracts.js — Phase B.9
 * Contracts for Reservations, Waitlist, Tables, Private Events & Guest Flow
 */

export const RESERVATION_STATUSES = {
  PENDING:   'pending',
  CONFIRMED: 'confirmed',
  SEATED:    'seated',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW:   'no_show',
  EXPIRED:   'expired',
}

export const WAITLIST_STATUSES = {
  WAITING:   'waiting',
  NOTIFIED:  'notified',
  SEATED:    'seated',
  CANCELLED: 'cancelled',
  NO_SHOW:   'no_show',
  EXPIRED:   'expired',
}

export const TABLE_STATUSES = {
  AVAILABLE:       'available',
  RESERVED:        'reserved',
  OCCUPIED:        'occupied',
  DIRTY:           'dirty',
  CLEANING:        'cleaning',
  BLOCKED:         'blocked',
  OUT_OF_SERVICE:  'out_of_service',
}

export const SECTION_TYPES = {
  DINING:        'dining',
  PATIO:         'patio',
  BAR:           'bar',
  LOUNGE:        'lounge',
  HUMIDOR:       'humidor',
  PRIVATE_ROOM:  'private_room',
  EVENT_SPACE:   'event_space',
  OTHER:         'other',
}

export const RESERVATION_SOURCES = {
  STAFF:      'staff',
  HOST:       'host',
  MANAGER:    'manager',
  GUEST_WEB:  'guest_web',
  KIOSK:      'kiosk',
  PHONE:      'phone',
  API:        'api',
  IMPORTED:   'imported',
  OFFLINE:    'offline',
}

export const PRIVATE_EVENT_STATUSES = {
  INQUIRY:         'inquiry',
  PROPOSED:        'proposed',
  HOLD:            'hold',
  CONFIRMED:       'confirmed',
  DEPOSIT_PENDING: 'deposit_pending',
  DEPOSIT_PAID:    'deposit_paid',
  COMPLETED:       'completed',
  CANCELLED:       'cancelled',
}

export const CONTRACT_STATUSES = {
  NOT_REQUIRED: 'not_required',
  DRAFT:        'draft',
  SENT:         'sent',
  SIGNED:       'signed',
  DECLINED:     'declined',
  EXPIRED:      'expired',
}

export const DEPOSIT_STATUSES = {
  NOT_REQUIRED: 'not_required',
  PENDING:      'pending',
  PAID:         'paid',
  REFUNDED:     'refunded',
  WAIVED:       'waived',
  FAILED:       'failed',
}

export const GUEST_FLOW_EVENT_TYPES = {
  RESERVATION_CREATED:              'reservation_created',
  RESERVATION_CONFIRMED:            'reservation_confirmed',
  RESERVATION_CANCELLED:            'reservation_cancelled',
  RESERVATION_NO_SHOW:              'reservation_no_show',
  GUEST_ARRIVED:                    'guest_arrived',
  GUEST_SEATED:                     'guest_seated',
  GUEST_COMPLETED:                  'guest_completed',
  TABLE_ASSIGNED:                   'table_assigned',
  TABLE_RELEASED:                   'table_released',
  TABLE_STATUS_CHANGED:             'table_status_changed',
  WAITLIST_ADDED:                   'waitlist_added',
  WAITLIST_NOTIFIED:                'waitlist_notified',
  WAITLIST_SEATED:                  'waitlist_seated',
  WAITLIST_CANCELLED:               'waitlist_cancelled',
  PRIVATE_EVENT_INQUIRY_CREATED:    'private_event_inquiry_created',
  PRIVATE_EVENT_HOLD_CREATED:       'private_event_hold_created',
  PRIVATE_EVENT_CONFIRMED:          'private_event_confirmed',
  PRIVATE_EVENT_COMPLETED:          'private_event_completed',
  MANAGER_OVERRIDE_REQUESTED:       'manager_override_requested',
  MANAGER_OVERRIDE_APPROVED:        'manager_override_approved',
  SERVICE_RECOVERY_FLAGGED:         'service_recovery_flagged',
  EAT_INSIGHT_GENERATED_PLACEHOLDER:'eat_insight_generated_placeholder',
  OFFLINE_ACTION_QUEUED:            'offline_action_queued',
  OFFLINE_ACTION_SYNCED:            'offline_action_synced',
}

export const MANAGER_APPROVAL_ACTIONS = {
  OVERBOOKING:                  'overbooking',
  TABLE_CAPACITY_OVERRIDE:      'table_capacity_override',
  WAITLIST_PRIORITY_OVERRIDE:   'waitlist_priority_override',
  PRIVATE_EVENT_DEPOSIT_REVERSAL:'private_event_deposit_reversal',
  BLOCKED_TABLE_ASSIGNMENT:     'blocked_table_assignment',
  NO_SHOW_REVERSAL:             'no_show_reversal',
  CANCELLATION_FEE_WAIVER:      'cancellation_fee_waiver',
}

const _resStatuses    = new Set(Object.values(RESERVATION_STATUSES))
const _waitStatuses   = new Set(Object.values(WAITLIST_STATUSES))
const _tableStatuses  = new Set(Object.values(TABLE_STATUSES))
const _sectionTypes   = new Set(Object.values(SECTION_TYPES))
const _peStatuses     = new Set(Object.values(PRIVATE_EVENT_STATUSES))
const _flowEventTypes = new Set(Object.values(GUEST_FLOW_EVENT_TYPES))

export function isValidReservationStatus(s)   { return _resStatuses.has(s) }
export function isValidWaitlistStatus(s)       { return _waitStatuses.has(s) }
export function isValidTableStatus(s)          { return _tableStatuses.has(s) }
export function isValidSectionType(s)          { return _sectionTypes.has(s) }
export function isValidPrivateEventStatus(s)   { return _peStatuses.has(s) }
export function isValidGuestFlowEventType(s)   { return _flowEventTypes.has(s) }
