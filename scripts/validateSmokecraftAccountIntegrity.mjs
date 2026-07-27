// Holistic Fix 4B — build-blocking validator for account identity, guest
// conversion, and journey-snapshot sync. Static/source checks only (no
// live DB/browser dependency), same pattern as
// validateSmokecraftPlayerStateIntegrity.mjs.
import fs from 'node:fs'

let fail = 0
function check(name, cond, detail = '') {
  if (cond) { console.log(`  OK    ${name}`) }
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('── SmokeCraft account-integrity validator (Holistic Fix 4B)\n')

// 1. Required docs exist.
check('docs/smokecraft/SMOKECRAFT_GUEST_ACCOUNT_MERGE_POLICY.md exists', fs.existsSync('docs/smokecraft/SMOKECRAFT_GUEST_ACCOUNT_MERGE_POLICY.md'))

// 2. Migrations + rollbacks exist, rollback not auto-runnable.
check('migration 094 exists', fs.existsSync('server/db/migrations/094_smokecraft_guest_conversion_and_journey_snapshot.sql'))
check('migration 094 has a rollback script', fs.existsSync('server/db/rollbacks/094_smokecraft_guest_conversion_and_journey_snapshot.rollback.sql'))
check('rollback file does not live inside server/db/migrations', !fs.existsSync('server/db/migrations/094_smokecraft_guest_conversion_and_journey_snapshot.rollback.sql'))

const migration094 = fs.readFileSync('server/db/migrations/094_smokecraft_guest_conversion_and_journey_snapshot.sql', 'utf8')
check('smokecraft_guest_conversions has UNIQUE(guest_reference) — a guest can convert at most once, ever', /guest_reference\s+TEXT NOT NULL UNIQUE/.test(migration094))
check('smokecraft_player_state gains journey_version for optimistic concurrency', /journey_version INT NOT NULL DEFAULT 0/.test(migration094))

// 3. Conversion service: never trusts a client-supplied guest reference,
//    is a real transaction, and enforces the merge policy's XP-recompute
//    rule (not blind addition).
const service = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('convertGuestToAccount recomputes XP from merged rows (SUM), never adds guest.xp + account.xp directly', /COALESCE\(SUM\(xp_awarded\), 0\)/.test(service) && !/xp_total\s*\+\s*guestXp/.test(service))
check('convertGuestToAccount checks smokecraft_guest_conversions for an existing row before converting (idempotent)', /SELECT \* FROM smokecraft_guest_conversions WHERE guest_reference = \$1/.test(service))
check('saveJourneySnapshot rejects a stale expectedVersion with a conflict result rather than silently overwriting', /currentVersion !== expectedVersion/.test(service) && /conflict: true/.test(service))

// 4. Controller: conversion requires BOTH a real account (req.user) and
//    a server-verified guest cookie (req.smokecraftGuestCookieIdentity)
//    — never a client-supplied guest reference in the body.
const controller = fs.readFileSync('server/controllers/playerStateController.js', 'utf8')
check('handleConvertGuest requires req.user.role === passport_member (a real authenticated account)', /req\.user\.role !== 'passport_member'/.test(controller))
check('handleConvertGuest requires req.smokecraftGuestCookieIdentity (server-verified cookie), never a client-supplied guest id', /req\.smokecraftGuestCookieIdentity/.test(controller) && !/req\.body\.guestReference/.test(controller) && !/req\.body\.guestId/.test(controller))
check('handleSaveJourneySnapshot requires a numeric expectedVersion from the client (optimistic-concurrency contract)', /typeof expectedVersion !== 'number'/.test(controller))

// 5. Account service: reuses the existing proven auth primitives —
//    never invents new hashing/JWT logic.
const accountService = fs.readFileSync('server/services/smokecraft/accountService.js', 'utf8')
check('accountService reuses authService.hashPin/verifyPin (bcrypt) rather than inventing new hashing', /authService\.hashPin/.test(accountService) && /authService\.verifyPin/.test(accountService))
check('accountService reuses authService.createJwtForUser/createAuthSession (existing session infra)', /authService\.createJwtForUser/.test(accountService) && /authService\.createAuthSession/.test(accountService))
check('accountService reuses the existing lockout pattern (lockUserIfNeeded) rather than inventing new lockout logic', /authService\.lockUserIfNeeded/.test(accountService))
check('no raw/plaintext password or PIN is ever logged or returned outside the dev-only response path', !/console\.log\([^)]*pin\b/i.test(accountService))
check('devDeliveryPin (dev-only PIN exposure) is gated on NODE_ENV, never unconditional', fs.readFileSync('server/controllers/smokecraftAccountController.js', 'utf8').includes("isProd ? undefined : "))

// 6. No authentication secrets appear in client-shipped code.
const clientFiles = [
  'src/pages/smokecraft/Account.jsx',
  'src/services/smokecraft/stateAdapter.js',
  'src/services/smokecraft/playerStateApiClient.js',
]
for (const f of clientFiles) {
  if (!fs.existsSync(f)) continue
  const src = fs.readFileSync(f, 'utf8')
  check(`${f} contains no JWT_SECRET / hardcoded credential / bcrypt hash literal`, !/JWT_SECRET|SALT_ROUNDS|bcrypt\.hash|\$2[aby]\$/.test(src))
}

// 7. Client adapter wired into the shared journey context (not bypassed
//    by direct localStorage-only writes for the migrated fields).
const journeyContext = fs.readFileSync('src/context/SmokeCraftJourneyContext.jsx', 'utf8')
check('SmokeCraftJourneyContext imports and uses the shared stateAdapter (not bypassing it)', /import \* as stateAdapter from/.test(journeyContext) && /stateAdapter\.save\(/.test(journeyContext) && /stateAdapter\.load\(/.test(journeyContext))

// 8. Routes mounted.
const serverIndex = fs.readFileSync('server/index.js', 'utf8')
check('smokecraftAccountRoutes is mounted', /app\.use\('\/api\/smokecraft\/account', smokecraftAccountRoutes\)/.test(serverIndex))
const routes = fs.readFileSync('server/routes/smokecraftPlayerStateRoutes.js', 'utf8')
check('convert-guest route is mounted', /router\.post\('\/convert-guest'/.test(routes))
check('journey-snapshot GET/PUT routes are mounted', /router\.get\('\/journey-snapshot'/.test(routes) && /router\.put\('\/journey-snapshot'/.test(routes))

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) process.exit(1)
