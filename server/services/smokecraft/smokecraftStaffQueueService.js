/**
 * SmokeCraft Staff Order Queue Service
 * Manages the staff-facing order queue for SmokeCraft ordering.
 *
 * Permission rules:
 *   customer  — create requests, view own orders, cancel own draft/requested
 *   staff     — view queue, accept, update status, attempt POS send
 *   manager   — view all orders, view sync status, view staff activity
 *   platformAdmin — inspect audit, inspect module integration status
 *
 * Customer users cannot access staff queue actions.
 */

import { getOrder, updateOrder, queryOrders } from './smokecraftOrderStore.js'
import { createAuditEntry, AUDIT_EVENTS } from './smokecraftOrderAuditService.js'
import { canSendToPOS, sendSmokeCraftOrderToPOS } from './smokecraftPosBridgeService.js'
import { syncSmokeCraftOrderToEAT, syncSmokeCraftStaffActivityToEAT, EAT_SYNC_EVENTS } from './smokecraftEatSyncBridgeService.js'

const STAFF_ROLES = new Set(['staff', 'bartender', 'server', 'humidor_staff', 'manager', 'owner', 'admin', 'internal_admin'])
const MANAGER_ROLES = new Set(['manager', 'owner', 'admin', 'internal_admin'])

function assertStaffRole(role) {
  if (!STAFF_ROLES.has(role)) {
    throw new Error(`permission_denied: role "${role}" cannot perform staff queue actions`)
  }
}

/**
 * Returns all pending order requests in the staff queue.
 */
export function getStaffQueue(role) {
  assertStaffRole(role)
  return queryOrders(o =>
    ['requested', 'sent_to_staff', 'accepted_by_staff', 'staff_assisting'].includes(o.orderStatus)
  )
}

/**
 * Returns all orders (manager and above only).
 */
export function getAllOrders(role) {
  if (!MANAGER_ROLES.has(role)) {
    throw new Error('permission_denied: manager role required to view all orders')
  }
  return queryOrders(() => true)
}

/**
 * Accepts an order request — moves it from requested/sent_to_staff to accepted_by_staff.
 */
export async function acceptOrder(orderId, staffId, role) {
  assertStaffRole(role)
  const order = await getOrder(orderId)
  if (!order) return { error: 'order_not_found', orderId }

  const prev = order.orderStatus
  const updated = await updateOrder(orderId, {
    orderStatus: 'accepted_by_staff',
    serverId: staffId,
    syncStatus: 'not_connected',
  })

  createAuditEntry({
    orderId, eventType: AUDIT_EVENTS.ACCEPTED_BY_STAFF,
    actorRole: role, actorId: staffId,
    previousStatus: prev, nextStatus: 'accepted_by_staff',
    message: `Order accepted by staff ${staffId}`,
  })

  await syncSmokeCraftOrderToEAT(updated, EAT_SYNC_EVENTS.ACCEPTED_BY_STAFF)
  await syncSmokeCraftStaffActivityToEAT({ eventType: EAT_SYNC_EVENTS.ACCEPTED_BY_STAFF, serverId: staffId })

  return updated
}

/**
 * Updates an order status.
 */
export async function updateOrderStatus(orderId, newStatus, staffId, role, staffNotes = '') {
  assertStaffRole(role)
  const order = await getOrder(orderId)
  if (!order) return { error: 'order_not_found', orderId }

  const prev = order.orderStatus
  const patch = { orderStatus: newStatus, updatedAt: new Date().toISOString() }
  if (staffNotes) patch.staffNotes = staffNotes

  const updated = await updateOrder(orderId, patch)

  createAuditEntry({
    orderId, eventType: AUDIT_EVENTS.STATUS_UPDATED,
    actorRole: role, actorId: staffId,
    previousStatus: prev, nextStatus: newStatus,
    message: `Status updated to ${newStatus} by ${role} ${staffId ?? ''}`,
  })

  await syncSmokeCraftOrderToEAT(updated, EAT_SYNC_EVENTS.STATUS_UPDATED)

  return updated
}

/**
 * Attempts to send an order to POS360.
 * Only moves to sent_to_pos if the POS bridge confirms connected.
 * Otherwise, order stays at accepted_by_staff with not_connected status.
 */
export async function attemptSendToPOS(orderId, staffId, role) {
  assertStaffRole(role)
  const order = await getOrder(orderId)
  if (!order) return { error: 'order_not_found', orderId }

  const posResult = await sendSmokeCraftOrderToPOS(order)

  createAuditEntry({
    orderId, eventType: AUDIT_EVENTS.POS_SEND_ATTEMPTED,
    actorRole: role, actorId: staffId,
    previousStatus: order.orderStatus, nextStatus: posResult.sent ? 'sent_to_pos' : order.orderStatus,
    message: posResult.message,
    syncStatus: posResult.posSyncStatus,
  })

  await syncSmokeCraftOrderToEAT(order, EAT_SYNC_EVENTS.POS_SEND_ATTEMPTED)

  if (posResult.sent) {
    return await updateOrder(orderId, { orderStatus: 'sent_to_pos', posSyncStatus: 'synced' })
  }

  return {
    ...order,
    posSyncStatus: 'not_connected',
    message: posResult.message,
    sent: false,
  }
}

/**
 * Returns a management summary (manager+ only).
 */
export function getManagementSummary(role) {
  if (!MANAGER_ROLES.has(role)) {
    throw new Error('permission_denied: manager role required for management summary')
  }
  const all = queryOrders(() => true)
  return {
    totalOrders: all.length,
    byStatus: all.reduce((acc, o) => {
      acc[o.orderStatus] = (acc[o.orderStatus] ?? 0) + 1
      return acc
    }, {}),
    pos360Connected: canSendToPOS(),
    eatSyncStatus: 'not_connected',
    managementSyncStatus: 'preview_only',
  }
}
