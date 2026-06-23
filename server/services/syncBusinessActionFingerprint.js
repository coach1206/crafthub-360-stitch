/**
 * Server-side Business Action Fingerprint — Phase 6F.
 * Mirrors src/services/shared/businessActionFingerprint.js field-for-field
 * so a backend-computed fingerprint can be compared against a client one,
 * but operates on the backend's DB-row shape (snake_case columns) rather
 * than the client's camelCase event object.
 */

const CREATED_AT_BUCKET_MS = 60 * 1000

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
 * `row` is a sync_events DB row: { event_type, entity_id, payload, source_device_id }.
 * Field semantics intentionally match the client module exactly.
 */
export function getFingerprintFields(row) {
  if (!row || !row.event_type) return null
  const p = row.payload || {}
  const entry = p.entry || {}
  const ticket = p.ticket || {}
  const command = p.command || {}
  const eventType = row.event_type

  switch (eventType) {
    case 'OrderCreated':
      return [
        ['eventType', eventType],
        ['orderId', row.entity_id || ticket.id],
        ['tableId', ticket.tableId],
        ['deviceId', row.source_device_id],
        ['createdAtBucket', bucketTimestamp(ticket.createdAt)],
      ]
    case 'OrderUpdated':
      return [
        ['eventType', eventType],
        ['orderId', row.entity_id || ticket.id],
        ['updateType', p.updateType || (ticket.status ? `status:${ticket.status}` : 'items')],
        ['status', ticket.status],
        ['deviceId', row.source_device_id],
      ]
    case 'ORDER_SENT':
      return [
        ['eventType', eventType],
        ['orderId', row.entity_id || ticket.id],
        ['destination', p.destination || 'stations'],
        ['deviceId', row.source_device_id],
      ]
    case 'OrderClosed':
      return [
        ['eventType', eventType],
        ['orderId', row.entity_id || ticket.id],
        ['checkoutId', p.checkoutId || p.paymentId || `${ticket.paymentMethod || ''}:${ticket.paidAt || ''}`],
        ['total', p.total ?? ticket.total],
        ['deviceId', row.source_device_id],
      ]

    case 'KitchenAccepted':
    case 'KitchenStarted':
    case 'KitchenReady':
    case 'KitchenCompleted':
    case 'KitchenPartiallyCompleted':
    case 'KitchenCancelled':
      return [
        ['eventType', eventType],
        ['ticketId', entry.ticketId || row.entity_id],
        ['station', 'kitchen'],
        ['status', entry.status],
        ['transitionAction', p.transitionAction || eventType],
        ['staffId', entry.staffId],
      ]

    case 'BarAccepted':
    case 'BarStarted':
    case 'BarReady':
    case 'BarCompleted':
    case 'BarPartiallyCompleted':
    case 'BarCancelled':
      return [
        ['eventType', eventType],
        ['ticketId', entry.ticketId || row.entity_id],
        ['station', 'bar'],
        ['status', entry.status],
        ['transitionAction', p.transitionAction || eventType],
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
        ['eventType', eventType],
        ['ticketOrItemId', entry.ticketId || entry.itemId || entry.sku || row.entity_id],
        ['action', p.transitionAction || eventType],
        ['status', entry.status],
        ['staffId', entry.staffId],
      ]

    case 'CONTROL_COMMAND':
    default:
      if (command && (command.id || command.commandType)) {
        return [
          ['eventType', eventType],
          ['commandId', command.id || row.entity_id],
          ['commandType', command.eventType || command.commandType || eventType],
          ['targetSystem', command.targetSystem],
          ['staffId', command.staffId],
        ]
      }
      break
  }

  if (eventType === 'SmokeCraftCompleted') {
    return [
      ['eventType', eventType],
      ['sessionId', p.sessionId || row.entity_id],
      ['userOrGuestId', p.userId || p.guestId],
      ['completionStatus', p.status || 'completed'],
    ]
  }

  if (eventType === 'PassportStampAwarded') {
    return [
      ['eventType', eventType],
      ['passportId', row.entity_id],
      ['stampId', p.stamp?.stampId],
      ['userOrGuestId', p.guestId || p.userId || p.sessionId],
    ]
  }

  if (row.source_system === 'EAT' && (row.entity_id || command.id)) {
    return [
      ['eventType', eventType],
      ['commandId', command.id || row.entity_id],
      ['commandType', command.eventType || command.commandType || eventType],
      ['targetSystem', command.targetSystem],
      ['staffId', command.staffId],
    ]
  }

  return null
}

export function createBusinessActionFingerprint(row) {
  const fields = getFingerprintFields(row)
  if (!fields) return createFallbackFingerprint(row)

  const meaningful = fields.filter(([, value]) => value !== null && value !== undefined && value !== '')
  if (meaningful.length < 2) return createFallbackFingerprint(row)

  return meaningful
    .map(([key, value]) => `${key}=${normalizeFingerprintValue(value)}`)
    .join('|')
}

export function createFallbackFingerprint(row) {
  if (!row || !row.event_type || !row.entity_id) return null
  return `eventType=${normalizeFingerprintValue(row.event_type)}|entityId=${normalizeFingerprintValue(row.entity_id)}`
}
