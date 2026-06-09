/**
 * Access Requests Controller — Phase 10 (Auth v2)
 * Handles Request Access form submissions.
 * Creates both an access_requests record and an admin_inbox item.
 *
 * POST /api/access-requests — public, no auth required
 */

import { isDbAvailable, query } from '../db/connection.js'
import { ok, fail, serverError } from '../utils/response.js'
import crypto from 'crypto'

const VALID_ROLES = ['staff', 'manager', 'human_mentor', 'developer', 'passport_member', 'admin']

// ── POST /api/access-requests ─────────────────────────────────
export async function submitAccessRequest(req, res) {
  try {
    const {
      requesterName,
      requesterEmail,
      currentRole    = 'guest',
      requestedRole,
      requestedRoute = null,
      reason         = null,
    } = req.body || {}

    if (!requesterEmail) return fail(res, 'Email is required')
    if (!requestedRole)  return fail(res, 'Requested access level is required')
    if (!VALID_ROLES.includes(requestedRole)) {
      return fail(res, `Invalid access level. Must be one of: ${VALID_ROLES.join(', ')}`)
    }

    const requestId = crypto.randomUUID()
    const requesterId = req.user?.id || null

    // Determine escalation level
    const escalatedTo = ['admin', 'founder_level_0', 'developer'].includes(requestedRole)
      ? 'founder'
      : 'admin'

    if (!isDbAvailable()) {
      return ok(res, {
        requestId,
        status:    'pending',
        message:   'Access request submitted. An administrator will review your request.',
        mode:      'prototype',
      }, 201)
    }

    // Create access request record
    await query(
      `INSERT INTO access_requests
         (request_id, requester_id, requester_email, requester_name,
          current_role, requested_role, requested_route, reason, escalated_to)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        requestId,
        requesterId,
        requesterEmail.toLowerCase().trim(),
        requesterName?.trim() || null,
        currentRole,
        requestedRole,
        requestedRoute || null,
        reason?.trim() || null,
        escalatedTo,
      ]
    )

    // Create admin inbox item
    const priority = ['developer', 'admin'].includes(requestedRole) ? 'high' : 'normal'
    const inboxId  = crypto.randomUUID()
    await query(
      `INSERT INTO admin_inbox
         (inbox_id, item_type, reference_id, title, summary, priority, assigned_to)
       VALUES ($1,'access_request',$2,$3,$4,$5,$6)`,
      [
        inboxId,
        requestId,
        `Access Request — ${requestedRole.replace(/_/g, ' ').toUpperCase()}`,
        `${requesterName || requesterEmail} has requested ${requestedRole} access${requestedRoute ? ` for ${requestedRoute}` : ''}.`,
        priority,
        escalatedTo === 'founder' ? 'founder' : 'admin',
      ]
    )

    return ok(res, {
      requestId,
      status:  'pending',
      message: 'Access request submitted successfully. An administrator will review your request within 24 hours.',
    }, 201)
  } catch (err) {
    serverError(res, err, 'submitAccessRequest')
  }
}

// ── GET /api/access-requests — admin+ only ────────────────────
export async function getAccessRequests(req, res) {
  try {
    const { status = 'pending', limit = 50 } = req.query

    if (!isDbAvailable()) {
      return ok(res, { requests: [], mode: 'prototype' })
    }

    const validStatuses = ['pending', 'approved', 'denied', 'escalated', 'all']
    const safeStatus    = validStatuses.includes(status) ? status : 'pending'

    const sql = safeStatus === 'all'
      ? `SELECT * FROM access_requests ORDER BY created_at DESC LIMIT $1`
      : `SELECT * FROM access_requests WHERE status=$1 ORDER BY created_at DESC LIMIT $2`

    const params = safeStatus === 'all' ? [parseInt(limit, 10)] : [safeStatus, parseInt(limit, 10)]
    const result = await query(sql, params)

    ok(res, { requests: result.rows, count: result.rows.length })
  } catch (err) {
    serverError(res, err, 'getAccessRequests')
  }
}

// ── POST /api/access-requests/:requestId/approve ─────────────
export async function approveAccessRequest(req, res) {
  try {
    const { requestId } = req.params
    const { notes }     = req.body || {}

    if (!isDbAvailable()) return ok(res, { approved: true, mode: 'prototype' })

    await query(
      `UPDATE access_requests
       SET status='approved', reviewed_by=$1, reviewed_at=NOW(), review_notes=$2, updated_at=NOW()
       WHERE request_id=$3`,
      [req.user?.id, notes || null, requestId]
    )

    // Update inbox item
    await query(
      `UPDATE admin_inbox SET status='actioned', actioned_by=$1, actioned_at=NOW(), updated_at=NOW()
       WHERE reference_id=$2`,
      [req.user?.id, requestId]
    )

    ok(res, { approved: true, requestId })
  } catch (err) {
    serverError(res, err, 'approveAccessRequest')
  }
}

// ── POST /api/access-requests/:requestId/deny ────────────────
export async function denyAccessRequest(req, res) {
  try {
    const { requestId } = req.params
    const { notes }     = req.body || {}

    if (!isDbAvailable()) return ok(res, { denied: true, mode: 'prototype' })

    await query(
      `UPDATE access_requests
       SET status='denied', reviewed_by=$1, reviewed_at=NOW(), review_notes=$2, updated_at=NOW()
       WHERE request_id=$3`,
      [req.user?.id, notes || null, requestId]
    )

    await query(
      `UPDATE admin_inbox SET status='actioned', actioned_by=$1, actioned_at=NOW(), updated_at=NOW()
       WHERE reference_id=$2`,
      [req.user?.id, requestId]
    )

    ok(res, { denied: true, requestId })
  } catch (err) {
    serverError(res, err, 'denyAccessRequest')
  }
}
