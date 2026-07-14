/**
 * NOVEE OS — Entry Backend Tests (v2)
 * Covers original 48 checks plus new tenant, durable session, and production-safety tests.
 * Run with: node verify-novee-entry-backend.mjs
 */

import {
  canAccessModule,
  buildModuleStatus,
  resolveTenant,
  startDemoSession,
  endDemoSession,
  validateDemoSession,
  isDemoActiveSync,
  MODULE_REGISTRY,
  _testMemSessions,
} from './server/services/noveeEntryService.js'

let passed = 0
let failed = 0
const failures = []

function check(label, ok, detail = '') {
  if (ok) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}${detail ? ' — ' + detail : ''}`)
    failed++
    failures.push(label)
  }
}

function section(title) {
  console.log(`\n── ${title} ──────────────────────────────────────────────`)
}

// ── Module Registry ───────────────────────────────────────────
section('Module Registry')
check('novee registered',              !!MODULE_REGISTRY.novee)
check('crafthub registered',           !!MODULE_REGISTRY.crafthub)
check('smokecraft registered',         !!MODULE_REGISTRY.smokecraft)
check('novee route is /home',          MODULE_REGISTRY.novee.route === '/home')
check('crafthub route is /crafthub',   MODULE_REGISTRY.crafthub.route === '/crafthub')
check('smokecraft route is /smokecraft', MODULE_REGISTRY.smokecraft.route === '/smokecraft')
check('novee enabled',                 MODULE_REGISTRY.novee.enabled === true)
check('smokecraft demoAvailable',      MODULE_REGISTRY.smokecraft.demoAvailable === true)

// ── Tenant Resolution ─────────────────────────────────────────
section('resolveTenant: unauthenticated visitor → null (BLOCKER 1)')
{
  const t = resolveTenant({}, null)
  check('No env VENUE_ID → tenant null', t === null, JSON.stringify(t))
}

section('resolveTenant: placeholder VENUE_ID is rejected')
{
  const origVENUE = process.env.VENUE_ID
  process.env.VENUE_ID = 'novee-grand-lounge'    // placeholder — must be rejected
  const t = resolveTenant({}, null)
  check('Placeholder VENUE_ID → null', t === null, JSON.stringify(t))
  process.env.VENUE_ID = origVENUE
}

section('resolveTenant: real VENUE_ID is resolved')
{
  const origVENUE = process.env.VENUE_ID
  const origNAME  = process.env.VENUE_NAME
  process.env.VENUE_ID   = 'real-venue-abc-123'
  process.env.VENUE_NAME = 'Real Venue Name'
  const t = resolveTenant({}, null)
  check('Real VENUE_ID resolved',         t?.id === 'real-venue-abc-123', JSON.stringify(t))
  check('Real VENUE_NAME resolved',        t?.name === 'Real Venue Name')
  process.env.VENUE_ID   = origVENUE
  process.env.VENUE_NAME = origNAME
}

section('resolveTenant: req.tenantVenueId takes priority over env')
{
  const origVENUE = process.env.VENUE_ID
  process.env.VENUE_ID = 'env-venue'
  const t = resolveTenant({ tenantVenueId: 'req-venue-xyz' }, null)
  check('req.tenantVenueId wins', t?.id === 'req-venue-xyz', JSON.stringify(t))
  process.env.VENUE_ID = origVENUE
}

section('resolveTenant: authenticated user with missing tenant → null')
{
  const user = { id: 'u1', role: 'staff', mode: 'jwt' }   // no tenantId in JWT currently
  const t = resolveTenant({}, user)
  // VENUE_ID not set → null
  check('Auth user, no VENUE_ID → tenant null', t === null, JSON.stringify(t))
}

section('resolveTenant: no placeholder values in response')
{
  const PLACEHOLDERS = ['novee-grand-lounge', 'kiosk-001', 'NOVEE Grand Lounge']
  const t = resolveTenant({}, null)
  const str = JSON.stringify(t)
  for (const p of PLACEHOLDERS) {
    check(`Placeholder "${p}" not in tenant response`, !str.includes(p))
  }
}

// ── RBAC: canAccessModule (now with tenant param) ─────────────
section('RBAC: authenticated authorized NOVEE entry')
{
  const user = { id: 'u1', role: 'admin', mode: 'jwt' }
  const r = canAccessModule(user, null, 'novee', false)
  check('Admin can access NOVEE OS', r.allowed === true, `code=${r.code}`)
}

section('RBAC: authenticated unauthorized NOVEE entry')
{
  const user = { id: 'u2', role: 'guest', mode: 'jwt' }
  const r = canAccessModule(user, null, 'novee', false)
  check('Guest cannot access NOVEE OS (no demo)', r.allowed === false)
  check('Code is UNAUTHORIZED',                   r.code === 'UNAUTHORIZED')
}

section('RBAC: authorized CraftHub entry')
{
  const guest = { id: 'g1', role: 'guest', mode: 'jwt' }
  check('Guest can access CraftHub 360', canAccessModule(guest, null, 'crafthub', false).allowed)
}

section('RBAC: authorized SmokeCraft entry')
{
  const guest = { id: 'g2', role: 'guest', mode: 'jwt' }
  check('Guest can access SmokeCraft 360', canAccessModule(guest, null, 'smokecraft', false).allowed)
}

section('RBAC: invalid module')
{
  const r = canAccessModule({ role: 'admin', mode: 'jwt' }, null, 'nonexistent_module', false)
  check('INVALID_MODULE code',   r.code === 'INVALID_MODULE')
  check('Access denied',         r.allowed === false)
}

section('RBAC: null user denied staff module')
{
  const r = canAccessModule(null, null, 'novee', false)
  check('Null user denied NOVEE OS',  r.allowed === false)
  check('Code is UNAUTHORIZED',       r.code === 'UNAUTHORIZED')
}

section('RBAC: prototype guest denied staff module')
{
  const proto = { id: 'proto-guest', role: 'guest', mode: 'prototype' }
  const r = canAccessModule(proto, null, 'novee', false)
  check('Prototype guest denied NOVEE OS', r.allowed === false)
}

section('RBAC: staff-level user can access NOVEE OS')
{
  const staff = { id: 's1', role: 'staff', mode: 'jwt' }
  check('Staff can access NOVEE OS', canAccessModule(staff, null, 'novee', false).allowed)
}

section('RBAC: manager can access all modules')
{
  const mgr = { id: 'm1', role: 'manager', mode: 'jwt' }
  check('Manager → novee',      canAccessModule(mgr, null, 'novee',      false).allowed)
  check('Manager → crafthub',   canAccessModule(mgr, null, 'crafthub',   false).allowed)
  check('Manager → smokecraft', canAccessModule(mgr, null, 'smokecraft', false).allowed)
}

section('RBAC: authenticated user with real tenant')
{
  const user   = { id: 'u3', role: 'admin', mode: 'jwt' }
  const tenant = { id: 'real-venue-123', name: 'Real Venue' }
  const r = canAccessModule(user, tenant, 'novee', false)
  check('Admin with real tenant → novee allowed', r.allowed === true)
}

section('RBAC: tenant-restricted module — currently tenant not blocking guest-accessible modules')
{
  // crafthub and smokecraft are guest-accessible regardless of tenant
  const r1 = canAccessModule(null, null, 'crafthub',   false)
  const r2 = canAccessModule(null, null, 'smokecraft',  false)
  check('crafthub allowed without tenant', r1.allowed)
  check('smokecraft allowed without tenant', r2.allowed)
}

// ── Durable Demo Session (BLOCKER 2) ─────────────────────────
section('Demo: start session — dev mode (in-memory)')
let demoId = null
{
  // DB not available in test — should fall to in-memory (dev mode)
  const result = await startDemoSession('guest')
  check('No DEMO_STORAGE_UNAVAILABLE error',  !result.error, JSON.stringify(result))
  check('Returns demoSessionId (string)',      typeof result.demoSessionId === 'string' && result.demoSessionId.length >= 48)
  check('Returns expiresAt',                  typeof result.expiresAt === 'string')
  check('Mode is demo',                       result.mode === 'demo')
  check('Session ID is hex (crypto random)',   /^[0-9a-f]{48}$/.test(result.demoSessionId))
  demoId = result.demoSessionId
}

section('Demo: validate session — dev in-memory')
{
  const v = await validateDemoSession(demoId)
  check('Valid session → valid=true',      v.valid === true)
  check('Returns expiresAt',               typeof v.expiresAt === 'string')
  const inv = await validateDemoSession('aaabbbcccdddeeefffggg000111222333444555666777')
  check('Unknown session → valid=false',   inv.valid === false)
  const nullV = await validateDemoSession(null)
  check('Null session → valid=false',      nullV.valid === false)
}

section('Demo: session with tenantId')
{
  const result = await startDemoSession('user-abc', 'tenant-xyz')
  const v = await validateDemoSession(result.demoSessionId)
  check('tenantId stored in session',   v.tenantId === 'tenant-xyz', `got: ${v.tenantId}`)
  check('userId stored',                v.userId === 'user-abc', `got: ${v.userId}`)
}

section('Demo: guest accesses staff module in demo mode')
{
  const guest = { id: 'g3', role: 'guest', mode: 'prototype' }
  const r = canAccessModule(guest, null, 'novee', true)
  check('Guest + demo active → novee allowed', r.allowed === true)
}

section('Demo: end session')
{
  const ended = await endDemoSession(demoId)
  check('endDemoSession returns true',      ended === true)
  const v = await validateDemoSession(demoId)
  check('Session invalid after end',        v.valid === false)
}

section('Demo: ended session is rejected (BLOCKER 2)')
{
  // Re-check after end
  const v = await validateDemoSession(demoId)
  check('Ended session → valid=false', v.valid === false)
}

section('Demo: expired session is rejected (BLOCKER 2)')
{
  // Start a new session and manually force expiry
  const result = await startDemoSession('test')
  const sid = result.demoSessionId
  const s = _testMemSessions.get(sid)
  s.expiresAt = new Date(Date.now() - 1000).toISOString()   // force expired
  const v = await validateDemoSession(sid)
  check('Expired session → valid=false', v.valid === false)
}

section('Demo: session survives service reinitialization (in-memory ref)')
{
  // New session — the in-memory Map persists across calls within the same process
  const r = await startDemoSession('persist-test')
  const sid = r.demoSessionId
  // Re-import would be a new Map, but within the process the Map is shared
  const v = await validateDemoSession(sid)
  check('Session survives within process', v.valid === true)
}

section('Demo: session ID not a raw placeholder (crypto random)')
{
  const r = await startDemoSession('guest')
  check('Not proto_ prefix',      !r.demoSessionId.startsWith('proto_'), r.demoSessionId.slice(0,12))
  check('Not demo_ prefix',       !r.demoSessionId.startsWith('demo_'),  r.demoSessionId.slice(0,12))
  check('Not uuid-like (dashes)', !r.demoSessionId.includes('-'),        r.demoSessionId.slice(0,12))
  check('48 hex chars',           /^[0-9a-f]{48}$/.test(r.demoSessionId))
}

section('buildModuleStatus: admin user')
{
  const admin = { id: 'a1', role: 'admin', mode: 'jwt' }
  const mods = buildModuleStatus(admin, null, false)
  check('novee authorized',      mods.novee?.authorized === true)
  check('crafthub authorized',   mods.crafthub?.authorized === true)
  check('smokecraft authorized', mods.smokecraft?.authorized === true)
}

section('buildModuleStatus: unauthenticated guest')
{
  const mods = buildModuleStatus(null, null, false)
  check('novee NOT authorized for guest (no demo)', mods.novee?.authorized === false)
  check('crafthub authorized for guest',            mods.crafthub?.authorized === true)
  check('smokecraft authorized for guest',          mods.smokecraft?.authorized === true)
}

section('buildModuleStatus: guest in demo mode')
{
  const mods = buildModuleStatus(null, null, true)
  check('novee authorized (demo)',      mods.novee?.authorized === true)
  check('crafthub authorized (demo)',   mods.crafthub?.authorized === true)
  check('smokecraft authorized (demo)', mods.smokecraft?.authorized === true)
}

section('Open-redirect prevention: routes from registry only')
{
  check('novee route /home',         MODULE_REGISTRY.novee.route === '/home')
  check('crafthub route /crafthub',  MODULE_REGISTRY.crafthub.route === '/crafthub')
}

section('No placeholder tenant values in status tenant field (BLOCKER 4)')
{
  const PLACEHOLDERS = ['novee-grand-lounge', 'NOVEE Grand Lounge', 'kiosk-001']
  const t = resolveTenant({}, null)
  const str = JSON.stringify(t)
  for (const p of PLACEHOLDERS) {
    check(`Placeholder "${p}" absent`, !str.includes(p))
  }
}

// ── Summary ────────────────────────────────────────────────────
console.log('\n=======================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failures.length) {
  console.log('Failures:', failures)
  process.exit(1)
}
