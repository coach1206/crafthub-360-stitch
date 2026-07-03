/**
 * LOCC — Owner Control Service
 * Owner/admin-only controls for operational system management.
 * Managers cannot access owner-level controls.
 */

import { v4 as uuidv4 } from 'uuid'
import { assertOwnerRole, assertManagerRole } from './roleSafetyGateway.js'

const dbAvailable = () => !!process.env.DATABASE_URL
const now = () => new Date().toISOString()

const OWNER_ACTION_LOG = new Map()

function logOwnerAction(action, actorContext, details = {}) {
  const id = uuidv4()
  OWNER_ACTION_LOG.set(id, {
    actionId: id, action, actorId: actorContext.actorId,
    actorRole: actorContext.role, details, createdAt: now(),
  })
  return id
}

export function getOwnerControlReadiness(venueId) {
  return {
    ok:                    true,
    venueId,
    ownerControlActive:    true,
    persistenceMode:       dbAvailable() ? 'real_database' : 'in_memory_only',
    degradedMode:          !dbAvailable(),
    databaseRequired:      !dbAvailable(),
    availableControls: [
      'view_system_health',
      'view_deployment_status',
      'view_all_pending_approvals',
      'approve_purchase_orders',
      'reject_purchase_orders',
      'view_audit_trail',
      'export_sync_events',
      'view_vendor_connector_status',
      'view_credential_requirements',
      'view_production_blockers',
      'block_sync_event',
      'escalate_approval',
    ],
    ownerOnlyControls: [
      'override_manager_rejection',
      'force_receiving_confirmation',
      'view_full_credential_requirements',
      'sign_off_on_deployment_readiness',
    ],
  }
}

export function getSystemHealthOverview(venueId, actorContext = {}) {
  const blocked = assertOwnerRole(actorContext.role, 'view_system_health_overview')
  if (blocked) return blocked
  return {
    ok:                    true,
    venueId,
    actorRole:             actorContext.role,
    persistenceMode:       dbAvailable() ? 'real_database' : 'in_memory_only',
    degradedMode:          !dbAvailable(),
    databaseConnected:     dbAvailable(),
    stripeConnected:       !!process.env.STRIPE_SECRET_KEY,
    externalPOSConnected:  false,
    vendorAPIConnected:    false,
    systemsNeedingAttention: [
      !dbAvailable()                     && 'database_required',
      !process.env.STRIPE_SECRET_KEY     && 'stripe_credential_required',
      'external_pos_required',
      'vendor_api_required',
      'distributor_connection_required',
    ].filter(Boolean),
    timestamp: now(),
  }
}

export function getCredentialRequirements(venueId, actorContext = {}) {
  const blocked = assertOwnerRole(actorContext.role, 'view_credential_requirements')
  if (blocked) return blocked
  logOwnerAction('view_credential_requirements', actorContext, { venueId })
  return {
    ok:         true,
    venueId,
    required: [
      {
        credential:   'DATABASE_URL',
        status:        dbAvailable() ? 'present' : 'missing',
        required:      true,
        enablesSystem: 'all_persistence',
        instructions:  'Set DATABASE_URL to a valid PostgreSQL connection string',
      },
      {
        credential:   'STRIPE_SECRET_KEY',
        status:        process.env.STRIPE_SECRET_KEY ? 'present' : 'missing',
        required:      false,
        enablesSystem: 'payment_processing',
        instructions:  'Set in environment variables (never in code)',
      },
      {
        credential:   'STRIPE_WEBHOOK_SECRET',
        status:        process.env.STRIPE_WEBHOOK_SECRET ? 'present' : 'missing',
        required:      false,
        enablesSystem: 'payment_webhook_verification',
        instructions:  'Set in environment variables (never in code)',
      },
      {
        credential:   'VENDOR_API_KEY (per vendor)',
        status:        'not_configured',
        required:      false,
        enablesSystem: 'live_vendor_ordering',
        instructions:  'Configure per vendor in vendor registry (Phase 18+)',
      },
      {
        credential:   'POS_API_KEY (per POS provider)',
        status:        'not_configured',
        required:      false,
        enablesSystem: 'external_pos_sync',
        instructions:  'Configure per POS provider in POS360 settings (Phase 18+)',
      },
    ],
    note: 'Credential values are never returned in API responses — only presence status.',
    timestamp: now(),
  }
}

export function getProductionBlockers(venueId, actorContext = {}) {
  const blocked = assertManagerRole(actorContext.role, 'view_production_blockers')
  if (blocked) return blocked
  const blockers = []
  if (!dbAvailable())                      blockers.push({ key: 'DATABASE_URL',          severity: 'critical', message: 'Required for all data persistence' })
  if (!process.env.STRIPE_SECRET_KEY)     blockers.push({ key: 'STRIPE_SECRET_KEY',      severity: 'high',     message: 'Required for payment processing' })
  if (!process.env.STRIPE_WEBHOOK_SECRET) blockers.push({ key: 'STRIPE_WEBHOOK_SECRET',  severity: 'high',     message: 'Required for webhook verification' })
  blockers.push({ key: 'external_pos_required',            severity: 'medium', message: 'External POS sync not active (Phase 18+)' })
  blockers.push({ key: 'vendor_api_required',              severity: 'medium', message: 'No vendor API connected (Phase 18+)' })
  blockers.push({ key: 'distributor_connection_required',  severity: 'low',    message: 'No distributor linked' })
  blockers.push({ key: 'manufacturer_connection_required', severity: 'low',    message: 'No manufacturer linked' })
  return {
    ok:           blockers.filter(b => b.severity === 'critical').length === 0,
    venueId,
    blockers,
    criticalCount: blockers.filter(b => b.severity === 'critical').length,
    highCount:     blockers.filter(b => b.severity === 'high').length,
    mediumCount:   blockers.filter(b => b.severity === 'medium').length,
    timestamp:     now(),
  }
}

export async function signOffDeploymentReadiness(venueId, actorContext = {}) {
  const blocked = assertOwnerRole(actorContext.role, 'sign_off_deployment_readiness')
  if (blocked) return blocked
  const actionId = logOwnerAction('sign_off_deployment_readiness', actorContext, { venueId })
  const blockers = getProductionBlockers(venueId, actorContext)
  const criticalCount = blockers.criticalCount ?? 0
  return {
    ok:               criticalCount === 0,
    actionId,
    venueId,
    signedOffBy:      actorContext.actorId,
    signedOffRole:    actorContext.role,
    status:           criticalCount === 0 ? 'deployment_signed_off' : 'deployment_blocked',
    criticalBlockers: blockers.blockers?.filter(b => b.severity === 'critical') ?? [],
    note:             criticalCount > 0
                        ? 'Cannot sign off — critical blockers present'
                        : 'Deployment readiness acknowledged by owner. Non-critical items remain.',
    timestamp:        now(),
  }
}

export function getOwnerActionLog(venueId, actorContext = {}) {
  const blocked = assertOwnerRole(actorContext.role, 'view_owner_action_log')
  if (blocked) return blocked
  return {
    ok:      true,
    venueId,
    actions: [...OWNER_ACTION_LOG.values()],
    count:   OWNER_ACTION_LOG.size,
  }
}
