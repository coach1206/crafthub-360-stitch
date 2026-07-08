/**
 * NOVEE OS — Universal 360 Platform Registry Service
 * contains_secrets: false
 * stores_secrets: false
 * NOVEE OS is the parent operating system for all 360 platforms.
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * No platform is marked production_ready without verified implementation,
 * required documentation, licensing, and integration proof.
 */

import { isDbAvailable } from '../../db/connection.js'

const AREA = 'novee_os_360_platform_registry'

const localFallback = () => ({
  ok: false,
  localPreview: true,
  error: 'database_not_configured',
  area: AREA,
})

export const PLATFORM_TYPES = [
  'core_platform', 'business_platform', 'creator_platform', 'music_platform',
  'agent_platform', 'coaching_platform', 'craft_platform', 'commerce_platform',
  'education_platform', 'management_platform', 'hospitality_platform',
  'entertainment_platform', 'automation_platform', 'intelligence_platform',
  'white_label_platform', 'future_platform',
]

export const DEFAULT_PLATFORMS = [
  {
    platform_key:      'novee_os',
    platform_name:     'NOVEE OS',
    platform_type:     'core_platform',
    platform_category: 'intelligence_platform',
    parent_platform:   'novee_os',
    brand_family:      'NOVEE',
    activation_status: 'active',
    preview_only:      false,
    reserved_only:     false,
    production_ready:  true,
  },
  {
    platform_key:      'agent_x_360',
    platform_name:     'Agent X 360',
    platform_type:     'agent_platform',
    platform_category: 'automation_platform',
    parent_platform:   'novee_os',
    brand_family:      'NOVEE',
    activation_status: 'reserved',
    preview_only:      true,
    reserved_only:     true,
    production_ready:  false,
  },
  {
    platform_key:      'dayone_360',
    platform_name:     'DayOne 360',
    platform_type:     'business_platform',
    platform_category: 'education_platform',
    parent_platform:   'novee_os',
    brand_family:      'NOVEE',
    activation_status: 'reserved',
    preview_only:      true,
    reserved_only:     true,
    production_ready:  false,
  },
  {
    platform_key:      'egomusic_360',
    platform_name:     'EgoMusic 360',
    platform_type:     'music_platform',
    platform_category: 'creator_platform',
    parent_platform:   'novee_os',
    brand_family:      'NOVEE',
    activation_status: 'reserved',
    preview_only:      true,
    reserved_only:     true,
    production_ready:  false,
  },
  {
    platform_key:      'craft_hub_360',
    platform_name:     'CraftHub 360',
    platform_type:     'craft_platform',
    platform_category: 'commerce_platform',
    parent_platform:   'novee_os',
    brand_family:      'CraftHub',
    activation_status: 'active',
    preview_only:      false,
    reserved_only:     false,
    production_ready:  false,
  },
  {
    platform_key:      'smokecraft_360',
    platform_name:     'SmokeCraft 360',
    platform_type:     'craft_platform',
    platform_category: 'hospitality_platform',
    parent_platform:   'novee_os',
    brand_family:      'CraftHub',
    activation_status: 'active',
    preview_only:      false,
    reserved_only:     false,
    production_ready:  false,
  },
  {
    platform_key:      'pourcraft_360',
    platform_name:     'PourCraft 360',
    platform_type:     'craft_platform',
    platform_category: 'hospitality_platform',
    parent_platform:   'novee_os',
    brand_family:      'CraftHub',
    activation_status: 'preview',
    preview_only:      true,
    reserved_only:     false,
    production_ready:  false,
  },
  {
    platform_key:      'beercraft_360',
    platform_name:     'BeerCraft 360',
    platform_type:     'craft_platform',
    platform_category: 'hospitality_platform',
    parent_platform:   'novee_os',
    brand_family:      'CraftHub',
    activation_status: 'preview',
    preview_only:      true,
    reserved_only:     false,
    production_ready:  false,
  },
  {
    platform_key:      'winecraft_360',
    platform_name:     'WineCraft 360',
    platform_type:     'craft_platform',
    platform_category: 'hospitality_platform',
    parent_platform:   'novee_os',
    brand_family:      'CraftHub',
    activation_status: 'preview',
    preview_only:      true,
    reserved_only:     false,
    production_ready:  false,
  },
  {
    platform_key:      'passport_360',
    platform_name:     'Passport 360',
    platform_type:     'commerce_platform',
    platform_category: 'management_platform',
    parent_platform:   'novee_os',
    brand_family:      'NOVEE',
    activation_status: 'active',
    preview_only:      false,
    reserved_only:     false,
    production_ready:  false,
  },
  {
    platform_key:      'pos_360',
    platform_name:     'POS360',
    platform_type:     'commerce_platform',
    platform_category: 'hospitality_platform',
    parent_platform:   'novee_os',
    brand_family:      'NOVEE',
    activation_status: 'active',
    preview_only:      false,
    reserved_only:     false,
    production_ready:  false,
  },
  {
    platform_key:      'eat_360',
    platform_name:     'E.A.T. 360',
    platform_type:     'hospitality_platform',
    platform_category: 'commerce_platform',
    parent_platform:   'novee_os',
    brand_family:      'NOVEE',
    activation_status: 'active',
    preview_only:      false,
    reserved_only:     false,
    production_ready:  false,
  },
  {
    platform_key:      'ambi',
    platform_name:     'AMBI',
    platform_type:     'intelligence_platform',
    platform_category: 'automation_platform',
    parent_platform:   'novee_os',
    brand_family:      'NOVEE',
    activation_status: 'preview',
    preview_only:      true,
    reserved_only:     false,
    production_ready:  false,
  },
  {
    platform_key:      'ai_coaching',
    platform_name:     'AI Coaching',
    platform_type:     'coaching_platform',
    platform_category: 'education_platform',
    parent_platform:   'novee_os',
    brand_family:      'NOVEE',
    activation_status: 'preview',
    preview_only:      true,
    reserved_only:     false,
    production_ready:  false,
  },
]

function computeProductionReadiness(platform) {
  if (platform.reserved_only) return false
  if (!platform.required_modules_json || platform.required_modules_json.length === 0) return false
  if (!platform.required_documentation_json || platform.required_documentation_json.length === 0) return false
  if (!platform.required_integrations_json || platform.required_integrations_json.length === 0) return false
  if (platform.license_status !== 'licensed') return false
  return Boolean(platform.production_ready)
}

function getBlockers(platform) {
  const blockers = []
  if (platform.reserved_only) blockers.push('Platform is reserved — full implementation required before activation')
  if (platform.preview_only) blockers.push('Platform is preview-only — activation gate not passed')
  if (!platform.production_ready) blockers.push('production_ready is false')
  if (platform.license_status !== 'licensed') blockers.push('License required for production')
  if (!platform.required_modules_json?.length) blockers.push('required_modules_json is empty')
  if (!platform.required_documentation_json?.length) blockers.push('required_documentation_json is empty')
  if (!platform.required_integrations_json?.length) blockers.push('required_integrations_json is empty')
  return blockers
}

export async function get360PlatformRegistry(tenantId, orgId, workspaceId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: AREA, platforms: DEFAULT_PLATFORMS }
  }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('novee_os_360_platform_registry').select('*').orderBy('platform_key')
  return { ok: true, rows }
}

export async function get360PlatformByKey(tenantId, platformKey) {
  if (!isDbAvailable()) {
    const p = DEFAULT_PLATFORMS.find(p => p.platform_key === platformKey)
    return { ok: false, localPreview: true, error: 'database_not_configured', platform: p || null }
  }
  const db = (await import('../../db/connection.js')).default
  const row = await db('novee_os_360_platform_registry').where({ platform_key: platformKey }).first()
  return { ok: true, row: row || null }
}

export async function register360PlatformPreview(tenantId, payload) {
  const safePayload = {
    ...payload,
    production_ready: false,
    preview_only: true,
    parent_platform: payload.parent_platform || 'novee_os',
  }
  if (!isDbAvailable()) return { ...localFallback(), payload: safePayload }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('novee_os_360_platform_registry')
    .insert({ ...safePayload, tenant_id: tenantId })
    .onConflict('platform_key').ignore()
    .returning('*')
  return { ok: true, row: row || null, warning: 'Platform registered in preview mode — not production-ready' }
}

export async function update360PlatformPreview(tenantId, platformKey, updatePayload) {
  const safePayload = { ...updatePayload, updated_at: new Date() }
  if (safePayload.production_ready === true) {
    safePayload.production_ready = false
    safePayload._production_ready_blocked = 'Cannot self-declare production_ready — requires verified implementation, documentation, licensing, and integration proof'
  }
  if (!isDbAvailable()) return { ...localFallback(), platform_key: platformKey }
  const db = (await import('../../db/connection.js')).default
  const [row] = await db('novee_os_360_platform_registry')
    .where({ platform_key: platformKey })
    .update(safePayload)
    .returning('*')
  return { ok: true, row: row || null }
}

export async function get360PlatformReadiness(tenantId, platformKey) {
  const p = DEFAULT_PLATFORMS.find(p => p.platform_key === platformKey)
  if (!isDbAvailable()) {
    return {
      ok: false,
      localPreview: true,
      platform_key: platformKey,
      production_ready: false,
      blockers: getBlockers(p || { reserved_only: true, preview_only: true, production_ready: false, license_status: 'unlicensed' }),
    }
  }
  const db = (await import('../../db/connection.js')).default
  const row = await db('novee_os_360_platform_registry').where({ platform_key: platformKey }).first()
  const platform = row || p || {}
  return {
    ok: true,
    platform_key: platformKey,
    production_ready: computeProductionReadiness(platform),
    blockers: getBlockers(platform),
    row,
  }
}

export async function getReserved360Platforms(tenantId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, platforms: DEFAULT_PLATFORMS.filter(p => p.reserved_only || p.activation_status === 'reserved') }
  }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('novee_os_360_platform_registry').where({ reserved_only: true }).orWhere({ activation_status: 'reserved' }).select('*')
  return { ok: true, rows }
}

export async function getActive360Platforms(tenantId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, platforms: DEFAULT_PLATFORMS.filter(p => p.activation_status === 'active') }
  }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('novee_os_360_platform_registry').where({ activation_status: 'active' }).select('*')
  return { ok: true, rows }
}

export async function getProductionReady360Platforms(tenantId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, platforms: DEFAULT_PLATFORMS.filter(p => p.production_ready === true) }
  }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('novee_os_360_platform_registry').where({ production_ready: true }).select('*')
  return { ok: true, rows }
}

export async function get360PlatformBlockers(tenantId, platformKey) {
  const p = DEFAULT_PLATFORMS.find(p => p.platform_key === platformKey)
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, platform_key: platformKey, blockers: getBlockers(p || { reserved_only: true, preview_only: true }) }
  }
  const db = (await import('../../db/connection.js')).default
  const row = await db('novee_os_360_platform_registry').where({ platform_key: platformKey }).first()
  return { ok: true, platform_key: platformKey, blockers: getBlockers(row || p || {}) }
}

export async function build360EcosystemSnapshot(tenantId) {
  const snapshot = DEFAULT_PLATFORMS.map(p => ({
    platform_key:      p.platform_key,
    platform_name:     p.platform_name,
    platform_type:     p.platform_type,
    activation_status: p.activation_status,
    preview_only:      p.preview_only,
    reserved_only:     p.reserved_only,
    production_ready:  p.production_ready,
    parent_platform:   p.parent_platform,
  }))

  if (!isDbAvailable()) {
    return {
      ok: false,
      localPreview: true,
      area: AREA,
      platforms: snapshot,
      total: snapshot.length,
      active: snapshot.filter(p => p.activation_status === 'active').length,
      reserved: snapshot.filter(p => p.reserved_only || p.activation_status === 'reserved').length,
      production_ready: 0,
      note: 'Ecosystem snapshot from defaults — database not configured',
    }
  }
  const db = (await import('../../db/connection.js')).default
  const rows = await db('novee_os_360_platform_registry').select('*').orderBy('platform_key')
  return {
    ok: true,
    platforms: rows,
    total: rows.length,
    active: rows.filter(r => r.activation_status === 'active').length,
    reserved: rows.filter(r => r.reserved_only || r.activation_status === 'reserved').length,
    production_ready: rows.filter(r => r.production_ready).length,
  }
}
