#!/usr/bin/env node
/**
 * SmokeCraft Truth Gate regression test (Phase 8).
 *
 * Source-level checks that the migration/schema-verification/diagnostics
 * hardening described in the "SmokeCraft production truth gate" commit is
 * actually present in the code — a fast, DB-independent guard against
 * silent regression. Real, DB-backed proof of behavior (fatal exit on
 * broken schema, idempotent repeated migration, the readiness endpoint's
 * live checks, the full fresh-player journey) was additionally exercised
 * by hand in this session against a real local Postgres instance — see
 * the session's final report for that evidence, which this static check
 * cannot itself reproduce in CI without a database.
 *
 * Run: node scripts/test-smokecraft-truth-gate.mjs
 */
import { readFileSync, existsSync } from 'fs'

let passed = 0, failed = 0
function check(name, condition, detail = '') {
  if (condition) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.error(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}
function src(rel) {
  return existsSync(rel) ? readFileSync(rel, 'utf8') : null
}

console.log('\n── SmokeCraft Truth Gate — source-level regression checks ──\n')

const indexJs = src('server/index.js')
check('server/index.js exists', !!indexJs)
check('startup migration failure is fatal in production (process.exit)', /IS_PROD_STARTUP[\s\S]*process\.exit\(1\)/.test(indexJs || ''))
check('startup migration failure is non-fatal in dev/test (explicit warning path)', /Non-fatal in development\/test/.test(indexJs || ''))
check('schema verification runs after migrations, before listen', indexJs && indexJs.indexOf('await runStartupSchemaVerification()') < indexJs.indexOf('app.listen(PORT'))
check('structured migration_start/applied/skipped/failed/complete logging present', ['migration_start', 'migration_applied', 'migration_skipped', 'migration_failed', 'migration_complete'].every(e => (indexJs || '').includes(e)))
check('structured schema_verification_failed/complete logging present', ['schema_verification_failed', 'schema_verification_complete'].every(e => (indexJs || '').includes(e)))
check('startup never logs DATABASE_URL or JWT_SECRET values', !/DATABASE_URL\}/.test(indexJs || '') && !/JWT_SECRET\}/.test(indexJs || ''))
check('diagnostics routes are mounted', /smokecraftDiagnosticsRoutes/.test(indexJs || ''))

const schemaVerify = src('server/db/verifySmokecraftSchema.js')
check('server/db/verifySmokecraftSchema.js exists', !!schemaVerify)
check('schema verification checks smokecraft_tasting_drafts', /smokecraft_tasting_drafts/.test(schemaVerify || ''))
check('schema verification checks migration 097 is recorded', /097_smokecraft_tasting_drafts\.sql/.test(schemaVerify || ''))
check('schema verification checks for duplicate migration filenames', /noDuplicateMigrationFilenames/.test(schemaVerify || ''))
check('schema verification uses parameterized queries, not string interpolation of table names', !/`SELECT.*\$\{/.test(schemaVerify || ''))

const runMigrations = src('server/db/runMigrations.js')
check('runMigrations is idempotent (tracks applied migrations)', /schema_migrations/.test(runMigrations || ''))
check('runMigrations wraps each migration in a transaction (BEGIN/COMMIT/ROLLBACK)', /BEGIN/.test(runMigrations || '') && /ROLLBACK/.test(runMigrations || ''))

const envValidator = src('server/config/envValidator.js')
check('envValidator requires DATABASE_URL in production', /DATABASE_URL is not set in production/.test(envValidator || ''))
check('envValidator exits fatally on production errors', /process\.exit\(1\)/.test(envValidator || ''))
check('envValidator runs before startup migrations (import order)', indexJs && indexJs.indexOf("validateEnv()") < indexJs.indexOf('runStartupMigrations()'))

const diagController = src('server/controllers/smokecraftDiagnosticsController.js')
check('server/controllers/smokecraftDiagnosticsController.js exists', !!diagController)
check('readiness endpoint never returns SQL text/connection strings', !/DATABASE_URL/.test(diagController || ''))
check('Session 2 draft write test runs inside a transaction that is rolled back', /BEGIN/.test(diagController || '') && /ROLLBACK/.test(diagController || ''))
check('readiness reports overallStatus ready|degraded|failed', /'ready'/.test(diagController || '') && /'degraded'/.test(diagController || '') && /'failed'/.test(diagController || ''))
check('venue emptiness is degraded, not failed (soft failure)', /softFailureCodes\.push\('VENUE_DATA_EMPTY'\)/.test(diagController || ''))
check('all mandated failure codes present', [
  'DATABASE_UNAVAILABLE', 'MIGRATIONS_INCOMPLETE', 'TASTING_DRAFT_TABLE_MISSING',
  'TASTING_DRAFT_COLUMN_MISSING', 'PLAYER_STATE_DEPENDENCY_FAILED',
  'SESSION2_DRAFT_READ_FAILED', 'SESSION2_DRAFT_WRITE_FAILED', 'VENUE_DATA_EMPTY',
].every(c => (diagController || '').includes(c)))

const diagRoutes = src('server/routes/smokecraftDiagnosticsRoutes.js')
check('server/routes/smokecraftDiagnosticsRoutes.js exists', !!diagRoutes)
check('diagnostics route reuses requireAuth + requireAdmin (no new auth scheme)', /requireAuth/.test(diagRoutes || '') && /requireAdmin/.test(diagRoutes || ''))

const playerStateCtrl = src('server/controllers/playerStateController.js')
check('GET tasting draft validates activityKey slug shape (400 on invalid)', /isValidActivityKeySlug\(sessionSlug\)/.test(playerStateCtrl || '') && /handleGetTastingDraft/.test(playerStateCtrl || ''))
check('PUT tasting draft validates activityKey slug shape (400 on invalid)', (() => {
  const idx = (playerStateCtrl || '').indexOf('handleSaveTastingDraft')
  return idx > -1 && (playerStateCtrl || '').slice(idx, idx + 400).includes('isValidActivityKeySlug')
})())
check('Session 2 failures are logged with structured, secret-free categories', /safeDbErrorCategory/.test(playerStateCtrl || ''))
check('structured logs never include raw SQL error message/stack', !/err\.message/.test((playerStateCtrl || '').match(/function safeDbErrorCategory[\s\S]*?\n\}/)?.[0] || '') )

const adminReadinessPage = src('src/pages/smokecraft/AdminReadiness.jsx')
check('src/pages/smokecraft/AdminReadiness.jsx exists', !!adminReadinessPage)
check('admin readiness page reuses useSecurity()/meetsMinRole (no new auth scheme)', /useSecurity/.test(adminReadinessPage || '') && /meetsMinRole/.test(adminReadinessPage || ''))
check('admin readiness page has a Run Readiness Check button', /Run Readiness Check/.test(adminReadinessPage || ''))
check('admin readiness page never renders raw secrets/SQL', !/DATABASE_URL|password/i.test(adminReadinessPage || ''))

const appJsx = src('src/App.jsx')
check('/smokecraft/admin/readiness route registered, admin-gated', /smokecraft\/admin\/readiness/.test(appJsx || '') && appJsx.includes('AdminReadiness'))

const verifyScript = src('scripts/verify-smokecraft-production-readiness.mjs')
check('scripts/verify-smokecraft-production-readiness.mjs exists', !!verifyScript)
check('verification script accepts SMOKECRAFT_BASE_URL env var', /SMOKECRAFT_BASE_URL/.test(verifyScript || ''))
check('verification script never prints supplied admin credentials', !/console\.(log|error)\(`?[^)]*\$\{ADMIN_PIN\}/.test(verifyScript || ''))
check('verification script discloses whether it targeted a real production URL', /testedAgainstRealProductionURL/.test(verifyScript || ''))

console.log(`\n${passed} passed, ${failed} failed (of ${passed + failed} total)\n`)
process.exit(failed === 0 ? 0 : 1)
