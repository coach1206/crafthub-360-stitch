/**
 * SmokeCraft Venue Admin Controller
 * Handles all /api/modules/smokecraft/admin/* routes.
 * Enforces role-based access — customer role is always blocked.
 */

import {
  getAdminDashboardStatus,
  getVenueAdminOverview,
  getVenueStaffQueueView,
  getVenueAnalyticsView,
  getVenueIntegrationsView,
  getVenueAuditView,
  getVenueRewardsSummaryView,
  getVenuePairingsSummaryView,
  getVenueOrdersSummaryView,
  getStaffAssignedOrdersView,
} from '../services/smokecraft/smokecraftAdminDashboardService.js'
import { executeControlAction } from '../services/smokecraft/smokecraftManagementControlService.js'
import { acceptStaffOrder, updateStaffOrderStatus } from '../services/smokecraft/smokecraftStaffOperationsService.js'
import { assertAdminAccess } from '../services/smokecraft/smokecraftVenuePermissionService.js'

function actorFromReq(req) {
  return {
    actorId: req.body?.actorId ?? req.query?.actorId ?? 'unknown',
    role:    req.body?.actorRole ?? req.query?.actorRole ?? 'unknown',
  }
}

export function getAdminStatus(req, res) {
  res.json(getAdminDashboardStatus())
}

export function getVenueOverview(req, res) {
  const { venueId } = req.params
  const actor = actorFromReq(req)
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return res.status(403).json(access)
  res.json(getVenueAdminOverview(venueId, actor))
}

export function getStaffQueue(req, res) {
  const { venueId } = req.params
  const actor = actorFromReq(req)
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return res.status(403).json(access)
  res.json(getVenueStaffQueueView(venueId, actor))
}

export function getAnalytics(req, res) {
  const { venueId } = req.params
  const actor = actorFromReq(req)
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return res.status(403).json(access)
  const dateRange = req.query?.dateRange ?? null
  res.json(getVenueAnalyticsView(venueId, actor, dateRange))
}

export function getIntegrations(req, res) {
  const { venueId } = req.params
  const actor = actorFromReq(req)
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return res.status(403).json(access)
  res.json(getVenueIntegrationsView(venueId, actor))
}

export function getRewardsSummary(req, res) {
  const { venueId } = req.params
  const actor = actorFromReq(req)
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return res.status(403).json(access)
  res.json(getVenueRewardsSummaryView(venueId, actor))
}

export function getPairingsSummary(req, res) {
  const { venueId } = req.params
  const actor = actorFromReq(req)
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return res.status(403).json(access)
  res.json(getVenuePairingsSummaryView(venueId, actor))
}

export function getOrdersSummary(req, res) {
  const { venueId } = req.params
  const actor = actorFromReq(req)
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return res.status(403).json(access)
  res.json(getVenueOrdersSummaryView(venueId, actor))
}

export function getAuditLog(req, res) {
  const { venueId } = req.params
  const actor = actorFromReq(req)
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return res.status(403).json(access)
  res.json(getVenueAuditView(venueId, actor))
}

export function executeControl(req, res) {
  const { venueId } = req.params
  const actor = actorFromReq(req)
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return res.status(403).json(access)
  const { action, payload } = req.body ?? {}
  if (!action) return res.status(400).json({ error: 'action required' })
  const result = executeControlAction({ action, actorId: actor.actorId, actorRole: actor.role, venueId, payload })
  res.json(result)
}

export function getAssignedOrders(req, res) {
  const { staffId } = req.params
  const actor = actorFromReq(req)
  const access = assertAdminAccess(actor.role)
  if (!access.allowed) return res.status(403).json(access)
  res.json(getStaffAssignedOrdersView(staffId, actor))
}
