/**
 * POS 3 Integration Service — CRUD over saved provider configs in
 * localStorage key `pos3:integrations`. Credential values are masked when
 * read back via getIntegrationConfig (raw values stay in storage only).
 */

import { opsGet, opsSet } from '../shared/opsStorage.js'
import { CONNECTION_STATES } from './posIntegrationRegistry.js'

const KEY = 'pos3:integrations'

export function getAllConfigs() { return opsGet(KEY, {}) }
function saveAllConfigs(configs) { opsSet(KEY, configs) }

export function getRawConfig(providerId) {
  const all = getAllConfigs()
  return all[providerId] || null
}

function maskValue(v) {
  if (!v) return v
  const str = String(v)
  if (str.length <= 4) return '****'
  return `${'*'.repeat(str.length - 4)}${str.slice(-4)}`
}

export function maskConfig(config) {
  if (!config) return null
  const masked = { ...config, credentials: {} }
  Object.entries(config.credentials || {}).forEach(([k, v]) => { masked.credentials[k] = maskValue(v) })
  return masked
}

export function upsertConfig(providerId, patch) {
  const all = getAllConfigs()
  const existing = all[providerId] || {
    providerId, credentials: {}, syncOptions: {}, status: CONNECTION_STATES.NOT_CONNECTED,
    createdAt: Date.now(), lastSyncAt: null, syncHistory: [],
  }
  all[providerId] = { ...existing, ...patch, updatedAt: Date.now() }
  saveAllConfigs(all)
  return all[providerId]
}

export function deleteConfig(providerId) {
  const all = getAllConfigs()
  delete all[providerId]
  saveAllConfigs(all)
}

export function appendSyncHistory(providerId, entry) {
  const all = getAllConfigs()
  const cfg = all[providerId]
  if (!cfg) return null
  cfg.syncHistory = [...(cfg.syncHistory || []), entry].slice(-50)
  all[providerId] = cfg
  saveAllConfigs(all)
  return cfg
}
