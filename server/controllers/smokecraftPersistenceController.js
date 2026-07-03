/**
 * SmokeCraft Persistence Controller
 */

import { getRegistrySummary, getAllAreasStatus, getAreaStatus } from '../services/smokecraft/persistence/smokecraftPersistenceRegistry.js'
import { getDatabaseAdapterStatus, getDatabaseWarnings } from '../services/smokecraft/persistence/smokecraftDatabaseAdapter.js'
import { getPersistenceHealthReport, getProductionReadiness } from '../services/smokecraft/persistence/smokecraftPersistenceHealthService.js'
import { getMigrationPlan, createMigrationPlanForArea } from '../services/smokecraft/persistence/smokecraftPersistenceMigrationPlanService.js'
import { getPersistenceAuditLog, logPersistenceEvent, PERSISTENCE_AUDIT_EVENTS } from '../services/smokecraft/persistence/smokecraftPersistenceAuditService.js'

function actorFromReq(req) {
  return { actorId: req.user?.id ?? 'system', actorRole: req.user?.role ?? 'system' }
}

export async function getPersistenceStatus(req, res) {
  try {
    const registry  = getRegistrySummary()
    const health    = getPersistenceHealthReport()
    const readiness = getProductionReadiness()
    await logPersistenceEvent(PERSISTENCE_AUDIT_EVENTS.HEALTH_CHECKED, null)
    res.json({ success: true, registry, health, readiness })
  } catch (err) {
    res.status(500).json({ success: false, error: 'persistence_status_unavailable' })
  }
}

export async function getPersistenceHealth(req, res) {
  try {
    res.json({ success: true, health: getPersistenceHealthReport() })
  } catch {
    res.status(500).json({ success: false, error: 'persistence_health_unavailable' })
  }
}

export async function getPersistenceRegistry(req, res) {
  try {
    res.json({ success: true, areas: getAllAreasStatus(), summary: getRegistrySummary() })
  } catch {
    res.status(500).json({ success: false, error: 'persistence_registry_unavailable' })
  }
}

export async function getPersistenceArea(req, res) {
  try {
    const area = getAreaStatus(req.params.areaId)
    if (!area) return res.status(404).json({ success: false, error: 'area_not_found' })
    await logPersistenceEvent(PERSISTENCE_AUDIT_EVENTS.AREA_REVIEWED, req.params.areaId)
    res.json({ success: true, area })
  } catch {
    res.status(500).json({ success: false, error: 'area_status_unavailable' })
  }
}

export async function getDatabaseStatus(req, res) {
  try {
    const status   = getDatabaseAdapterStatus()
    const warnings = getDatabaseWarnings()
    res.json({ success: true, database: status, warnings })
  } catch {
    res.status(500).json({ success: false, error: 'database_status_unavailable' })
  }
}

export async function getMigrationPlanStatus(req, res) {
  try {
    res.json({ success: true, plan: getMigrationPlan() })
  } catch {
    res.status(500).json({ success: false, error: 'migration_plan_unavailable' })
  }
}

export async function createMigrationPlan(req, res) {
  try {
    const { areaId } = req.body ?? {}
    await logPersistenceEvent(PERSISTENCE_AUDIT_EVENTS.MIGRATION_PLAN_CREATED, areaId ?? null)
    const plan = areaId ? createMigrationPlanForArea(areaId) : getMigrationPlan()
    res.json({ success: true, plan, autoRunEnabled: false, warning: 'Migration plan created for review only. No migration was run automatically.' })
  } catch {
    res.status(500).json({ success: false, error: 'migration_plan_creation_failed' })
  }
}

export async function getPersistenceAudit(req, res) {
  try {
    res.json({ success: true, ...getPersistenceAuditLog() })
  } catch {
    res.status(500).json({ success: false, error: 'persistence_audit_unavailable' })
  }
}
