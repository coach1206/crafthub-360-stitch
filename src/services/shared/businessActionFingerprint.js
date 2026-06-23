/**
 * Business Action Fingerprint — Phase 6E
 * Detects duplicate business actions even when eventId differs (e.g. a
 * retried local write that re-saved a new IndexedDB record for the same
 * real-world action). Built from meaningful business fields only — never
 * random IDs, retry counts, or unbucketed timestamps.
 */

const CREATED_AT_BUCKET_MS = 60 * 1000 // 1-minute bucket, only used where listed below

function bucketTimestamp(value) {
  if (!value) return null
  const ms = typeof value === 'number' ? value : new Date(value).getTime()
  if (Number.isNaN(ms)) return null
  return Math.floor(ms / CREATED_AT_BUCKET_MS)
}

export function normalizeFingerprintValue(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return String(value)
  return String(value).trim().toLowerCase()
}

/**
 * Returns the ordered list of [fieldName, value] pairs that make up the
 * fingerprint for this event's eventType, or null if the eventType has no
 * defined fingerprint coverage.
 */
export function getFingerprintFields(event) {
  if (!event || !event.eventType) return null
  const p = event.payload || {}
  const entry = p.entry || {}
  const ticket = p.ticket || {}
  const command = p.command || {}

  switch (event.eventType) {
    case 'OrderCreated':
      return [
        ['eventType', event.eventType],
        ['orderId', event.entityId || ticket.id],
        ['tableId', ticket.tableId],
        ['deviceId', event.sourceDeviceId],
        ['createdAtBucket', bucketTimestamp(ticket.createdAt)],
      ]
    case 'OrderUpdated':
      return [
        ['eventType', event.eventType],
        ['orderId', event.entityId || ticket.id],
        ['updateType', p.updateType || (ticket.status ? `status:${ticket.status}` : 'items')],
        ['status', ticket.status],
        ['deviceId', event.sourceDeviceId],
      ]
    case 'ORDER_SENT':
      return [
        ['eventType', event.eventType],
        ['orderId', event.entityId || ticket.id],
        ['destination', p.destination || 'stations'],
        ['deviceId', event.sourceDeviceId],
      ]
    case 'OrderClosed':
      return [
        ['eventType', event.eventType],
        ['orderId', event.entityId || ticket.id],
        ['checkoutId', p.checkoutId || p.paymentId || `${ticket.paymentMethod || ''}:${ticket.paidAt || ''}`],
        ['total', p.total ?? ticket.total],
        ['deviceId', event.sourceDeviceId],
      ]

    case 'KitchenAccepted':
    case 'KitchenStarted':
    case 'KitchenReady':
    case 'KitchenCompleted':
    case 'KitchenPartiallyCompleted':
    case 'KitchenCancelled':
      return [
        ['eventType', event.eventType],
        ['ticketId', entry.ticketId || event.entityId],
        ['station', 'kitchen'],
        ['status', entry.status],
        ['transitionAction', p.transitionAction || event.eventType],
        ['staffId', entry.staffId],
      ]

    case 'BarAccepted':
    case 'BarStarted':
    case 'BarReady':
    case 'BarCompleted':
    case 'BarPartiallyCompleted':
    case 'BarCancelled':
      return [
        ['eventType', event.eventType],
        ['ticketId', entry.ticketId || event.entityId],
        ['station', 'bar'],
        ['status', entry.status],
        ['transitionAction', p.transitionAction || event.eventType],
        ['staffId', entry.staffId],
      ]

    case 'HumidorAccepted':
    case 'HumidorPulled':
    case 'HumidorUnavailable':
    case 'HumidorSubstituted':
    case 'HumidorCompleted':
    case 'HumidorPartiallyCompleted':
    case 'HumidorCancelled':
      return [
        ['eventType', event.eventType],
        ['ticketOrItemId', entry.ticketId || entry.itemId || entry.sku || event.entityId],
        ['action', p.transitionAction || event.eventType],
        ['status', entry.status],
        ['staffId', entry.staffId],
      ]

    case 'CONTROL_COMMAND':
    default:
      if (command && (command.id || command.commandType)) {
        return [
          ['eventType', event.eventType],
          ['commandId', command.id || event.entityId],
          ['commandType', command.eventType || command.commandType || event.eventType],
          ['targetSystem', command.targetSystem],
          ['staffId', command.staffId],
        ]
      }
      break
  }

  if (event.eventType === 'SmokeCraftCompleted') {
    return [
      ['eventType', event.eventType],
      ['sessionId', p.sessionId || event.entityId],
      ['userOrGuestId', p.userId || p.guestId],
      ['completionStatus', p.status || 'completed'],
    ]
  }

  if (event.eventType === 'PassportStampAwarded') {
    return [
      ['eventType', event.eventType],
      ['passportId', event.entityId],
      ['stampId', p.stamp?.stampId],
      ['userOrGuestId', p.guestId || p.userId || p.sessionId],
    ]
  }

  // Generic E.A.T. operational commands not caught above but carrying a
  // recognizable command shape.
  if (event.sourceSystem === 'EAT' && (event.entityId || command.id)) {
    return [
      ['eventType', event.eventType],
      ['commandId', command.id || event.entityId],
      ['commandType', command.eventType || command.commandType || event.eventType],
      ['targetSystem', command.targetSystem],
      ['staffId', command.staffId],
    ]
  }

  return null
}

/**
 * Builds a stable fingerprint string from an event's meaningful business
 * fields. Returns null if no meaningful fingerprint can be created (e.g.
 * an eventType with no defined coverage and no recognizable shape).
 */
export function createBusinessActionFingerprint(event) {
  const fields = getFingerprintFields(event)
  if (!fields) return null

  const meaningful = fields.filter(([, value]) => value !== null && value !== undefined && value !== '')
  // Require at least eventType + one real business identifier, otherwise
  // the fingerprint would only encode the event type and create false
  // duplicate matches across unrelated events of the same type.
  if (meaningful.length < 2) return createFallbackFingerprint(event)

  return meaningful
    .map(([key, value]) => `${key}=${normalizeFingerprintValue(value)}`)
    .join('|')
}

/**
 * Last-resort fingerprint when no business-field coverage exists for this
 * eventType. Uses only eventType + entityId (the one field every saved
 * event already carries) — never a random/generated ID. Returns null if
 * even entityId is missing, since eventType alone is not meaningful.
 */
export function createFallbackFingerprint(event) {
  if (!event || !event.eventType || !event.entityId) return null
  return `eventType=${normalizeFingerprintValue(event.eventType)}|entityId=${normalizeFingerprintValue(event.entityId)}`
}
