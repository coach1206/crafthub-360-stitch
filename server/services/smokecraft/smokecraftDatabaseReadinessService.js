/**
 * SmokeCraft Database Readiness Service
 * Evaluates database configuration and persistence mode.
 * Does not create destructive migrations. Does not alter production schema.
 * Does not claim production-ready unless fully verified.
 */

import { isDbAvailable } from '../../db/connection.js'
import { isDatabaseUrlPresent } from './smokecraftEnvironmentValidationService.js'

export function hasDatabaseUrl() {
  return isDatabaseUrlPresent()
}

export function getPersistenceMode() {
  if (isDbAvailable()) return 'database'
  if (hasDatabaseUrl()) return 'database_config_detected'
  return 'memory_fallback'
}

export function validateDatabaseConfig() {
  const urlPresent = hasDatabaseUrl()
  const dbAvailable = isDbAvailable()

  if (!urlPresent) {
    return {
      valid:           false,
      databaseConfigured: false,
      persistenceMode: 'memory_fallback',
      productionReady: false,
      message:         'DATABASE_URL is not configured. SmokeCraft is using memory_fallback and is not production-persistent.',
    }
  }

  if (!dbAvailable) {
    return {
      valid:           false,
      databaseConfigured: true,
      persistenceMode: 'database_config_detected',
      productionReady: false,
      message:         'DATABASE_URL is present, but production persistence has not been fully verified.',
    }
  }

  return {
    valid:           true,
    databaseConfigured: true,
    persistenceMode: 'database',
    productionReady: true,
    message:         'Database is configured and available.',
  }
}

export function getDatabaseReadinessStatus() {
  const validation = validateDatabaseConfig()
  return {
    ...validation,
    warnings: buildDatabaseWarnings(validation),
  }
}

export function getPersistenceWarnings(persistenceMode) {
  return buildDatabaseWarnings({ persistenceMode, productionReady: persistenceMode === 'database' })
}

function buildDatabaseWarnings(state) {
  const warnings = []
  if (state.persistenceMode === 'memory_fallback') {
    warnings.push({
      code:    'memory_fallback',
      message: 'DATABASE_URL not set. All SmokeCraft data is in-memory only and will be lost on restart.',
      severity:'critical',
    })
  } else if (state.persistenceMode === 'database_config_detected') {
    warnings.push({
      code:    'database_config_detected',
      message: 'DATABASE_URL detected but persistence not fully verified. Run migrations before claiming production-ready.',
      severity:'warning',
    })
  }
  return warnings
}

export function getProductionPersistenceStatus() {
  const mode = getPersistenceMode()
  return {
    persistenceMode: mode,
    productionReady: mode === 'database',
    note:            mode === 'memory_fallback'
      ? 'Not production-ready. Set DATABASE_URL and run migrations.'
      : mode === 'database_config_detected'
        ? 'DATABASE_URL detected. Verify migration state before production.'
        : 'Database persistence is active.',
  }
}
