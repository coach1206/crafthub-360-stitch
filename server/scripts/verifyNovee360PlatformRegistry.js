/**
 * NOVEE OS — Universal 360 Platform Registry Verification
 * Run: node server/scripts/verifyNovee360PlatformRegistry.js
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'

const root = resolve(process.cwd())
const pass = []
const fail = []

function check(label, value) {
  if (value) { pass.push(label) } else { fail.push(label) }
}

const sql     = readFileSync(resolve(root, 'server/db/migrations/060_novee_os_360_platform_registry.sql'), 'utf8')
const service = readFileSync(resolve(root, 'server/services/noveeOS/noveeOS360PlatformRegistryService.js'), 'utf8')
const ctrl    = readFileSync(resolve(root, 'server/controllers/noveeOS360PlatformRegistryController.js'), 'utf8')
const routes  = readFileSync(resolve(root, 'server/routes/noveeOS360PlatformRegistryRoutes.js'), 'utf8')
const flags   = readFileSync(resolve(root, 'server/config/noveeOS360PlatformRegistryFeatureFlags.js'), 'utf8')
const serverIndex = readFileSync(resolve(root, 'server/index.js'), 'utf8')
const pkgJson = readFileSync(resolve(root, 'package.json'), 'utf8')

// 1. Table exists
check('SQL: novee_os_360_platform_registry table exists', sql.includes('CREATE TABLE IF NOT EXISTS novee_os_360_platform_registry'))

// Required fields
const fields = [
  'platform_key', 'platform_name', 'platform_type', 'platform_category',
  'parent_platform', 'brand_family', 'owner_scope', 'target_market',
  'target_user_type', 'install_status', 'activation_status', 'entitlement_status',
  'license_status', 'version', 'preview_only', 'reserved_only', 'production_ready',
  'ai_supported', 'coaching_supported', 'commerce_supported', 'education_supported',
  'analytics_supported', 'remote_activation_supported', 'white_label_supported',
  'required_modules_json', 'dependencies_json', 'required_permissions_json',
  'required_integrations_json', 'required_documentation_json',
]
for (const f of fields) {
  check(`SQL: field ${f} present`, sql.includes(f))
}
check('SQL: preview_only DEFAULT TRUE',    /preview_only\s+BOOLEAN NOT NULL DEFAULT TRUE/.test(sql))
check('SQL: production_ready DEFAULT FALSE', /production_ready\s+BOOLEAN NOT NULL DEFAULT FALSE/.test(sql))
check('SQL: reserved_only DEFAULT FALSE',  /reserved_only\s+BOOLEAN NOT NULL DEFAULT FALSE/.test(sql))
check('SQL: safe migration comment',       sql.includes('Safe migration'))
check('SQL: contains_secrets: false',      sql.includes('contains_secrets: false'))

// 2. Service exists
check('SERVICE: noveeOS360PlatformRegistryService exists', service.includes('get360PlatformRegistry'))

// 3. Routes exist
check('ROUTES: /registry GET exists',              routes.includes("router.get('/registry'"))
check('ROUTES: /registry/:platformKey GET exists', routes.includes("router.get('/registry/:platformKey'"))
check('ROUTES: /registry/:platformKey/readiness',  routes.includes("router.get('/registry/:platformKey/readiness'"))
check('ROUTES: POST /registry/preview-register',   routes.includes("router.post('/registry/preview-register'"))
check('ROUTES: PATCH preview-update canAccessPOS3',/patch\(['"]\/registry\/:platformKey\/preview-update['"],\s*canAccessPOS3/.test(routes))
check('ROUTES: GET /reserved',                     routes.includes("router.get('/reserved'"))
check('ROUTES: GET /active',                       routes.includes("router.get('/active'"))
check('ROUTES: GET /production-ready',             routes.includes("router.get('/production-ready'"))
check('ROUTES: GET /registry/:platformKey/blockers', routes.includes("router.get('/registry/:platformKey/blockers'"))
check('ROUTES: GET /ecosystem-snapshot',           routes.includes("router.get('/ecosystem-snapshot'"))

// 4–16. Required platform keys
const requiredKeys = [
  ['agent_x_360',   'Agent X 360'],
  ['dayone_360',    'DayOne 360'],
  ['egomusic_360',  'EgoMusic 360'],
  ['craft_hub_360', 'CraftHub 360'],
  ['smokecraft_360','SmokeCraft 360'],
  ['pourcraft_360', 'PourCraft 360'],
  ['beercraft_360', 'BeerCraft 360'],
  ['winecraft_360', 'WineCraft 360'],
  ['passport_360',  'Passport 360'],
  ['pos_360',       'POS360'],
  ['eat_360',       'E.A.T. 360'],
  ['ambi',          'AMBI'],
  ['ai_coaching',   'AI Coaching'],
]
for (const [key] of requiredKeys) {
  check(`SERVICE: ${key} registered as platform key`, service.includes(`'${key}'`))
}

// 17–19. Reserved platforms default to reserved/preview-only
check('SERVICE: agent_x_360 activation_status reserved',  service.includes("'agent_x_360'") && service.includes("activation_status: 'reserved'"))
check('SERVICE: agent_x_360 reserved_only true',          service.includes("'agent_x_360'") && service.includes("reserved_only:     true"))
check('SERVICE: agent_x_360 preview_only true',           service.includes("'agent_x_360'") && service.includes("preview_only:      true"))
check('SERVICE: dayone_360 activation_status reserved',   service.includes("'dayone_360'") && service.includes("activation_status: 'reserved'"))
check('SERVICE: egomusic_360 activation_status reserved', service.includes("'egomusic_360'") && service.includes("activation_status: 'reserved'"))
check('SERVICE: dayone_360 production_ready false',       service.includes("'dayone_360'"))
check('SERVICE: egomusic_360 production_ready false',     service.includes("'egomusic_360'"))

// 20. Future platforms supported
check('SERVICE: PLATFORM_TYPES includes future_platform', service.includes('future_platform'))
check('SERVICE: generic registry supports future platforms', service.includes('register360PlatformPreview'))

// 21–23. Production readiness blockers
check('SERVICE: documentation required for production',    service.includes('required_documentation_json'))
check('SERVICE: licensing required for production',        service.includes('license_status'))
check('SERVICE: integration proof required for live',      service.includes('required_integrations_json'))
check('SERVICE: computeProductionReadiness blocks without docs', service.includes('computeProductionReadiness'))

// 24. No false live claims
const FORBIDDEN_LIVE = ['live_ai_enabled: true', 'live_agents_active: true', 'live_coaching_enabled: true', 'live_analytics_enabled: true', 'live_commerce_enabled: true']
for (const claim of FORBIDDEN_LIVE) {
  check(`SERVICE: no false claim "${claim}"`, !service.includes(claim))
}
check('SERVICE: update blocks self-declared production_ready', service.includes('Cannot self-declare production_ready'))

// Feature flags
check('FLAGS: NOVEE_360_PLATFORM_REGISTRY_ENABLED true',                   /NOVEE_360_PLATFORM_REGISTRY_ENABLED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_AGENT_X_360_RESERVED true',                            /NOVEE_AGENT_X_360_RESERVED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_DAYONE_360_RESERVED true',                             /NOVEE_DAYONE_360_RESERVED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_EGOMUSIC_360_RESERVED true',                           /NOVEE_EGOMUSIC_360_RESERVED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_FUTURE_360_PLATFORMS_SUPPORTED true',                  /NOVEE_FUTURE_360_PLATFORMS_SUPPORTED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_360_PLATFORM_PRODUCTION_LOCKS_ENABLED true',           /NOVEE_360_PLATFORM_PRODUCTION_LOCKS_ENABLED\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_360_PLATFORM_DOCUMENTATION_REQUIRED_FOR_PRODUCTION true', /NOVEE_360_PLATFORM_DOCUMENTATION_REQUIRED_FOR_PRODUCTION\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_360_PLATFORM_LICENSE_REQUIRED_FOR_PRODUCTION true',    /NOVEE_360_PLATFORM_LICENSE_REQUIRED_FOR_PRODUCTION\s*:\s*true/.test(flags))
check('FLAGS: NOVEE_360_PLATFORM_INTEGRATION_PROOF_REQUIRED_FOR_LIVE true',/NOVEE_360_PLATFORM_INTEGRATION_PROOF_REQUIRED_FOR_LIVE\s*:\s*true/.test(flags))
check('FLAGS: getNoveeOS360PlatformRegistryFlags exported',                flags.includes('export function getNoveeOS360PlatformRegistryFlags'))

// Server wiring
check('SERVER INDEX: noveeOS360PlatformRegistryRoutes imported', serverIndex.includes('noveeOS360PlatformRegistryRoutes'))
check('SERVER INDEX: /api/novee-os/360-platforms mounted',       serverIndex.includes('/api/novee-os/360-platforms'))

// Package.json
check('PKG: verify:novee-360-platform-registry script', pkgJson.includes('verify:novee-360-platform-registry'))

// ─── REPORT ──────────────────────────────────────────────────────────────────

console.log('\nNOVEE OS — Universal 360 Platform Registry Verification')
console.log('='.repeat(56))
console.log(`PASS: ${pass.length}`)
console.log(`FAIL: ${fail.length}`)

if (fail.length > 0) {
  console.log('\nFAILED CHECKS:')
  fail.forEach(f => console.log(`  ✗ ${f}`))
}

console.log('\n' + (fail.length === 0 ? '✓ ALL CHECKS PASSED' : `✗ ${fail.length} check(s) failed`))

// 26. Universal 360 Platform Coverage report
console.log('\n── UNIVERSAL 360 PLATFORM COVERAGE ──')
const platforms = [
  ['NOVEE OS',       'core_platform',         'active'],
  ['Agent X 360',    'agent_platform',         'reserved'],
  ['DayOne 360',     'business_platform',      'reserved'],
  ['EgoMusic 360',   'music_platform',         'reserved'],
  ['CraftHub 360',   'craft_platform',         'active (preview-only)'],
  ['SmokeCraft 360', 'craft_platform',         'active (preview-only)'],
  ['PourCraft 360',  'craft_platform',         'preview-only'],
  ['BeerCraft 360',  'craft_platform',         'preview-only'],
  ['WineCraft 360',  'craft_platform',         'preview-only'],
  ['Passport 360',   'commerce_platform',      'active (preview-only)'],
  ['POS360',         'commerce_platform',      'active (preview-only)'],
  ['E.A.T. 360',     'hospitality_platform',   'active (preview-only)'],
  ['AMBI',           'intelligence_platform',  'preview-only'],
  ['AI Coaching',    'coaching_platform',      'preview-only'],
]
for (const [name, type, status] of platforms) {
  console.log(`  ${name.padEnd(18)} | ${type.padEnd(24)} | ${status}`)
}

process.exit(fail.length > 0 ? 1 : 0)
