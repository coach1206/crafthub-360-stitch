/**
 * EPRL — Persistence Mode Service
 * Central switch determining whether services use real DB or in-memory fallback.
 */

export const PERSISTENCE_MODES = [
  'real_database','in_memory_only','preview_only',
  'degraded_mode','test_mode','database_required',
  'migration_required','schema_required',
]

export function getPersistenceMode() {
  if (process.env.NODE_ENV === 'test') return 'test_mode'
  if (!process.env.DATABASE_URL)       return 'in_memory_only'
  return 'real_database'
}

export function shouldUseDatabasePersistence() {
  return getPersistenceMode() === 'real_database'
}

export function shouldUseInMemoryFallback() {
  return getPersistenceMode() !== 'real_database'
}

export function shouldAllowWritePersistence() {
  return shouldUseDatabasePersistence()
}

export function shouldAllowReadPersistence() {
  return true
}

export function shouldBlockUnsafePersistenceClaim() {
  return !shouldUseDatabasePersistence()
}

export function buildPersistenceModeResponse() {
  const mode = getPersistenceMode()
  return {
    ok:               true,
    persistenceMode:  mode,
    databaseActive:   mode === 'real_database',
    degradedMode:     mode !== 'real_database',
    databaseRequired: mode !== 'real_database',
    canWrite:         mode === 'real_database',
    canRead:          true,
    inMemoryFallback: mode !== 'real_database',
    note:             mode === 'real_database'
                        ? 'Database persistence active'
                        : 'In-memory-only mode — set DATABASE_URL to enable persistence',
  }
}

export function assertNoFakePersistenceClaim(result) {
  if (result?.persistenceStatus === 'persisted' && !shouldUseDatabasePersistence()) {
    throw new Error('Fake persistence claim: persistenceStatus is "persisted" but no database is active')
  }
  return result
}
