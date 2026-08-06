/**
 * In-process startup-state store (Truth Gate).
 *
 * Avoids a circular import between server/index.js (which performs
 * startup migrations/schema verification) and the diagnostics route/
 * controller (which needs to report their results). index.js writes
 * into this object once at boot; the diagnostics controller reads it.
 * Never holds secrets — only booleans, counts, filenames, and codes.
 */
export const startupState = {
  migration: null,
  schema: null,
  bootedAt: null,
}

export function setStartupState({ migration, schema }) {
  startupState.migration = migration
  startupState.schema = schema
  startupState.bootedAt = new Date().toISOString()
}
