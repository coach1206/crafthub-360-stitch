/**
 * EPRL — Environment and Persistence Health Controller
 * Extends the existing /api/health route with EPRL sub-routes.
 */

import {
  buildEnvironmentReadinessReport,
  buildDatabaseReadinessReport,
  buildPersistenceModeReport,
  buildSafeFallbackReport,
} from '../services/environment/environmentReadinessService.js'
import {
  getDatabaseConnectionStatus,
  getDatabaseUrlRedacted,
} from '../db/databaseConnectionManager.js'
import { buildMigrationReadinessReport } from '../db/migrationReadinessService.js'
import { buildSchemaReadinessReport } from '../db/schemaReadinessService.js'
import { buildPersistenceModeResponse } from '../services/persistence/persistenceModeService.js'
import { buildDeploymentReadinessReport } from '../services/deployment/deploymentReadinessService.js'
import { getInventoryPersistenceReadiness } from '../services/inventory/inventoryPersistenceService.js'
import { getPurchaseOrderPersistenceReadiness } from '../services/reorder/purchaseOrderPersistenceService.js'
import { getOperationalSyncReadiness } from '../services/sync/operationalSyncEventService.js'

const ts = () => new Date().toISOString()

export function handleEPRLEnvironment(req, res) {
  res.json({ ...buildEnvironmentReadinessReport(), service: 'environment', timestamp: ts() })
}

export function handleEPRLDatabase(req, res) {
  const conn = getDatabaseConnectionStatus()
  const db   = buildDatabaseReadinessReport()
  res.json({
    status:      conn.status,
    service:     'database',
    connection:  conn,
    database:    db,
    redacted:    getDatabaseUrlRedacted(),
    degradedMode: db.degradedMode,
    databaseRequired: db.databaseRequired,
    timestamp:   ts(),
  })
}

export async function handleEPRLMigrations(req, res) {
  const report = await buildMigrationReadinessReport(null)
  res.json({ ...report, service: 'migrations', timestamp: ts() })
}

export async function handleEPRLSchema(req, res) {
  const report = await buildSchemaReadinessReport(null)
  res.json({ ...report, service: 'schema', timestamp: ts() })
}

export function handleEPRLPersistence(req, res) {
  const mode     = buildPersistenceModeResponse()
  const fallback = buildSafeFallbackReport()
  res.json({
    status:      mode.persistenceMode,
    service:     'persistence',
    persistence: mode,
    fallback,
    degradedMode: mode.degradedMode,
    timestamp:   ts(),
  })
}

export function handleEPRLInventory(req, res) {
  const r = getInventoryPersistenceReadiness('health-check')
  res.json({
    status:       r.persistenceStatus ?? 'in_memory_only',
    service:      'inventory',
    readiness:    r,
    degradedMode: r.degradedMode,
    timestamp:    ts(),
  })
}

export function handleEPRLReorder(req, res) {
  const r = getPurchaseOrderPersistenceReadiness('health-check')
  res.json({
    status:              r.persistenceStatus ?? 'in_memory_only',
    service:             'reorder',
    readiness:           r,
    degradedMode:        r.degradedMode,
    externalSyncNotLive: true,
    reorderNotSubmitted: true,
    vendorApiRequired:   true,
    timestamp:           ts(),
  })
}

export function handleEPRLEAT(req, res) {
  res.json({
    status:          'ok',
    service:         'eat',
    hooksAvailable:  true,
    degradedMode:    !process.env.DATABASE_URL,
    persistenceMode: process.env.DATABASE_URL ? 'real_database' : 'in_memory_only',
    timestamp:       ts(),
  })
}

export function handleEPRLPOS360(req, res) {
  res.json({
    status:              process.env.DATABASE_URL ? 'ok' : 'degraded',
    service:             'pos360',
    degradedMode:        !process.env.DATABASE_URL,
    persistenceMode:     process.env.DATABASE_URL ? 'real_database' : 'in_memory_only',
    externalSyncNotLive: true,
    externalPOSRequired: true,
    timestamp:           ts(),
  })
}

export function handleEPRLNCIE(req, res) {
  res.json({
    status:          'ok',
    service:         'ncie',
    degradedMode:    !process.env.DATABASE_URL,
    persistenceMode: process.env.DATABASE_URL ? 'real_database' : 'in_memory_only',
    timestamp:       ts(),
  })
}

export function handleDeploymentReadiness(req, res) {
  res.json({ ...buildDeploymentReadinessReport(), service: 'deployment', timestamp: ts() })
}
