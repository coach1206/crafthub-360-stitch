/**
 * SmokeCraft Persistence Migration Plan Service
 * Creates migration plans. Does NOT run migrations automatically.
 * Does NOT drop or alter existing data.
 */

import { isDbAvailable } from '../../../db/connection.js'
import { PERSISTENCE_AREAS } from './smokecraftPersistenceRegistry.js'
import { randomUUID } from 'node:crypto'

const MIGRATION_PLANS = PERSISTENCE_AREAS
  .filter(id => !['final_qa_records', 'handoff_records'].includes(id))
  .map(areaId => ({
    areaId,
    sourceMode:        'memory_fallback',
    targetMode:        'database_verified',
    requiresSchema:    true,
    requiresBackfill:  false,
    requiresValidation: true,
    riskLevel:         'low',
    estimatedSteps:    ['apply_migration_029', 'verify_table_exists', 'verify_read_write', 'update_registry'],
    blockedReasons:    [],
    migrationFile:     '029_smokecraft_persistence_hardening.sql',
  }))

export function getMigrationPlan() {
  const dbUp = isDbAvailable()
  return {
    migrationPlanId:  `smokecraft-migration-plan-${Date.now()}`,
    version:          '1.0.0-phase-a',
    migrationFile:    'server/db/migrations/029_smokecraft_persistence_hardening.sql',
    safeToRun:        false,
    safeToRunReason:  'Migration must be reviewed and applied manually by a database administrator. This plan documents the required steps only.',
    databaseConfigured: dbUp,
    autoRunEnabled:   false,
    areas: MIGRATION_PLANS.map(plan => ({
      ...plan,
      migrationPlanId: randomUUID(),
      safeToRun:       false,
      createdAt:       new Date().toISOString(),
    })),
    instructions: [
      '1. Review server/db/migrations/029_smokecraft_persistence_hardening.sql',
      '2. Ensure DATABASE_URL is configured in production environment',
      '3. Run: npm run db:migrate',
      '4. Verify each SmokeCraft table was created successfully',
      '5. Do NOT run this migration if DATABASE_URL is not set',
      '6. All statements use CREATE TABLE IF NOT EXISTS — safe to re-run',
      '7. No existing data is dropped or altered',
    ],
    createdAt: new Date().toISOString(),
  }
}

export function createMigrationPlanForArea(areaId) {
  const plan = MIGRATION_PLANS.find(p => p.areaId === areaId)
  if (!plan) return { error: 'area_not_found', areaId }
  return {
    ...plan,
    migrationPlanId: randomUUID(),
    safeToRun:       false,
    createdAt:       new Date().toISOString(),
  }
}
