/**
 * pos3AdjustmentService — void/comp/refund/discount persistence.
 * Manager approval is required server-side for all adjustment types.
 */

import { isDbAvailable, query } from '../db/connection.js'
import * as auditService from './auditService.js'

const MANAGER_REQUIRED = ['void', 'comp', 'refund', 'discount']
const memAdjustments = new Map()

function makeAdjId() { return `adj_${Date.now()}_${Math.random().toString(36).slice(2,6)}` }

export async function createAdjustment({ orderId, orderItemId, adjustmentType, amountCents, reason, requestedByUserId }) {
  if (!MANAGER_REQUIRED.includes(adjustmentType)) {
    return { ok: false, error: `Invalid adjustment type: ${adjustmentType}` }
  }

  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `INSERT INTO pos3_adjustments
           (order_id, order_item_id, adjustment_type, amount_cents, reason, requested_by_user_id, status)
         VALUES ($1,$2,$3,$4,$5,$6,'pending')
         RETURNING *`,
        [orderId, orderItemId || null, adjustmentType, amountCents || 0, reason || null, requestedByUserId || null]
      )
      await auditService.log({
        action: 'pos3_adjustment_requested',
        entityType: 'pos3_adjustment',
        entityId: rows[0].adjustment_id,
        userId: requestedByUserId || 'unknown',
        details: { adjustmentType, amountCents, orderId },
      })
      return { ok: true, adjustment: rows[0], storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }

  const adj = {
    adjustment_id: makeAdjId(),
    order_id: orderId,
    order_item_id: orderItemId || null,
    adjustment_type: adjustmentType,
    amount_cents: amountCents || 0,
    reason: reason || null,
    requested_by_user_id: requestedByUserId || null,
    approved_by_user_id: null,
    status: 'pending',
    created_at: new Date().toISOString(),
  }
  memAdjustments.set(adj.adjustment_id, adj)
  return { ok: true, adjustment: adj, storageMode: 'memory_fallback', localPreview: true }
}

export async function approveAdjustment(adjustmentId, approvedByUserId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `UPDATE pos3_adjustments SET status='approved', approved_by_user_id=$1, updated_at=NOW() WHERE adjustment_id=$2 RETURNING *`,
        [approvedByUserId, adjustmentId]
      )
      if (!rows[0]) return { ok: false, error: 'Adjustment not found' }
      await auditService.log({
        action: 'pos3_adjustment_approved',
        entityType: 'pos3_adjustment',
        entityId: adjustmentId,
        userId: approvedByUserId,
      })
      return { ok: true, adjustment: rows[0], storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }
  const adj = memAdjustments.get(adjustmentId)
  if (!adj) return { ok: false, error: 'Adjustment not found', localPreview: true }
  adj.status = 'approved'
  adj.approved_by_user_id = approvedByUserId
  return { ok: true, adjustment: adj, storageMode: 'memory_fallback', localPreview: true }
}

export async function getPendingAdjustments(venueId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        `SELECT a.* FROM pos3_adjustments a
         JOIN pos3_orders o ON o.order_id = a.order_id
         WHERE o.venue_id = $1 AND a.status = 'pending' ORDER BY a.created_at DESC`,
        [venueId]
      )
      return { ok: true, adjustments: rows, storageMode: 'postgres' }
    } catch (err) {
      return { ok: false, error: err.message }
    }
  }
  return { ok: true, adjustments: [...memAdjustments.values()].filter(a => a.status === 'pending'), storageMode: 'memory_fallback', localPreview: true }
}
