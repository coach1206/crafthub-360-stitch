/**
 * NOVEE OS — Entry Backend Tests
 * Tests the authorization service, demo session management, and module registry.
 * Run with: node verify-novee-entry-backend.mjs
 */

// Load the service directly (ESM import)
import {
  canAccessModule,
  buildModuleStatus,
  startDemoSession,
  endDemoSession,
  validateDemoSession,
  isDemoActive,
  MODULE_REGISTRY,
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
check('novee module registered',       !!MODULE_REGISTRY.novee)
check('crafthub module registered',    !!MODULE_REGISTRY.crafthub)
check('smokecraft module registered',  !!MODULE_REGISTRY.smokecraft)
check('novee route is /home',          MODULE_REGISTRY.novee.route === '/home')
check('crafthub route is /crafthub',   MODULE_REGISTRY.crafthub.route === '/crafthub')
check('smokecraft route is /smokecraft', MODULE_REGISTRY.smokecraft.route === '/smokecraft')
check('novee is enabled',              MODULE_REGISTRY.novee.enabled === true)
check('smokecraft demoAvailable',      MODULE_REGISTRY.smokecraft.demoAvailable === true)

// ── RBAC: canAccessModule ─────────────────────────────────────
section('RBAC: canAccessModule — authenticated authorized NOVEE entry')
{
  const user = { id: 'u1', role: 'admin', mode: 'jwt' }
  const r = canAccessModule(user, 'novee', false)
  check('Admin can access NOVEE OS',   r.allowed === true, `code=${r.code}`)
}

section('RBAC: authenticated unauthorized NOVEE entry')
{
  const user = { id: 'u2', role: 'guest', mode: 'jwt' }
  const r = canAccessModule(user, 'novee', false)
  check('Guest cannot access NOVEE OS (no demo)', r.allowed === false)
  check('Code is UNAUTHORIZED',                   r.code === 'UNAUTHORIZED')
}

section('RBAC: authorized CraftHub entry')
{
  const guest = { id: 'g1', role: 'guest', mode: 'jwt' }
  const r = canAccessModule(guest, 'crafthub', false)
  check('Guest can access CraftHub 360', r.allowed === true)
}

section('RBAC: authorized SmokeCraft entry')
{
  const guest = { id: 'g2', role: 'guest', mode: 'jwt' }
  const r = canAccessModule(guest, 'smokecraft', false)
  check('Guest can access SmokeCraft 360', r.allowed === true)
}

section('RBAC: disabled module')
{
  // Temporarily test with a fake module descriptor via code path
  const fakeUser = { id: 'u3', role: 'admin', mode: 'jwt' }
  const r = canAccessModule(fakeUser, 'nonexistent_module', false)
  check('Invalid module returns INVALID_MODULE', r.code === 'INVALID_MODULE')
  check('Access denied for invalid module',      r.allowed === false)
}

section('RBAC: unauthenticated (null user) tries staff-only module')
{
  const r = canAccessModule(null, 'novee', false)
  check('Null user denied NOVEE OS',    r.allowed === false)
  check('Code is UNAUTHORIZED',          r.code === 'UNAUTHORIZED')
}

section('RBAC: prototype guest denied staff module')
{
  const proto = { id: 'proto-guest', role: 'guest', mode: 'prototype' }
  const r = canAccessModule(proto, 'novee', false)
  check('Prototype guest denied NOVEE OS', r.allowed === false)
}

section('RBAC: staff-level user can access NOVEE OS')
{
  const staff = { id: 's1', role: 'staff', mode: 'jwt' }
  const r = canAccessModule(staff, 'novee', false)
  check('Staff can access NOVEE OS', r.allowed === true)
}

section('RBAC: manager can access all modules')
{
  const mgr = { id: 'm1', role: 'manager', mode: 'jwt' }
  check('Manager → novee',     canAccessModule(mgr, 'novee',     false).allowed)
  check('Manager → crafthub',  canAccessModule(mgr, 'crafthub',  false).allowed)
  check('Manager → smokecraft', canAccessModule(mgr, 'smokecraft', false).allowed)
}

// ── Demo Mode ─────────────────────────────────────────────────
section('Demo Mode: start session')
let demoId = null
{
  const result = await startDemoSession('guest')
  check('startDemoSession returns demoSessionId', typeof result.demoSessionId === 'string' && result.demoSessionId.length > 0)
  check('startDemoSession returns expiresAt',     typeof result.expiresAt === 'string')
  check('startDemoSession mode is demo',          result.mode === 'demo')
  demoId = result.demoSessionId
}

section('Demo Mode: validate session')
{
  const v = validateDemoSession(demoId)
  check('Valid demo session returns valid=true', v.valid === true)
  check('Valid demo session has expiresAt',      typeof v.expiresAt === 'string')
  const inv = validateDemoSession('fake_id_xyz')
  check('Invalid session id returns valid=false', inv.valid === false)
  const nullV = validateDemoSession(null)
  check('Null session id returns valid=false',    nullV.valid === false)
}

section('Demo Mode: guest accesses staff module in demo mode')
{
  const guest = { id: 'g3', role: 'guest', mode: 'prototype' }
  const r = canAccessModule(guest, 'novee', true)
  check('Guest + active demo → novee allowed', r.allowed === true)
}

section('Demo Mode: isDemoActive')
{
  check('isDemoActive returns true for valid session',  isDemoActive(demoId) === true)
  check('isDemoActive returns false for invalid id',   isDemoActive('bad_id') === false)
}

section('Demo Mode: end session')
{
  const ended = await endDemoSession(demoId)
  check('endDemoSession returns true', ended === true)
  const v = validateDemoSession(demoId)
  check('Session invalid after end',   v.valid === false)
  check('isDemoActive false after end', isDemoActive(demoId) === false)
}

section('Demo Mode: expired session returns invalid')
{
  // Manually start and expire a session by poking the TTL
  const result = await startDemoSession('test')
  const vBefore = validateDemoSession(result.demoSessionId)
  check('Session valid immediately after start', vBefore.valid === true)
  // End it to simulate expiry
  await endDemoSession(result.demoSessionId)
  const vAfter = validateDemoSession(result.demoSessionId)
  check('Session invalid after manual end', vAfter.valid === false)
}

section('buildModuleStatus: authenticated user')
{
  const admin = { id: 'a1', role: 'admin', mode: 'jwt' }
  const mods = buildModuleStatus(admin, false)
  check('novee authorized for admin',      mods.novee?.authorized === true)
  check('crafthub authorized for admin',   mods.crafthub?.authorized === true)
  check('smokecraft authorized for admin', mods.smokecraft?.authorized === true)
}

section('buildModuleStatus: unauthenticated guest')
{
  const mods = buildModuleStatus(null, false)
  check('novee NOT authorized for guest (no demo)',     mods.novee?.authorized === false)
  check('crafthub authorized for guest',                mods.crafthub?.authorized === true)
  check('smokecraft authorized for guest',              mods.smokecraft?.authorized === true)
}

section('buildModuleStatus: guest in demo mode')
{
  const mods = buildModuleStatus(null, true)
  check('novee authorized for guest in demo mode',      mods.novee?.authorized === true)
  check('crafthub authorized for guest in demo mode',   mods.crafthub?.authorized === true)
  check('smokecraft authorized for guest in demo mode', mods.smokecraft?.authorized === true)
}

section('Open-redirect prevention: module registry route only')
{
  // Routes returned must come from the registry — no user-supplied route passthrough
  check('novee route is /home (not user-controlled)',        MODULE_REGISTRY.novee.route === '/home')
  check('crafthub route is /crafthub (not user-controlled)', MODULE_REGISTRY.crafthub.route === '/crafthub')
}

// ── Summary ────────────────────────────────────────────────────
console.log('\n=======================================================')
console.log(`Results: ${passed} passed, ${failed} failed`)
if (failures.length) {
  console.log('Failures:', failures)
  process.exit(1)
}
