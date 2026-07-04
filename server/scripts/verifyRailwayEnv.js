/**
 * verifyRailwayEnv.js
 * Diagnose Railway environment variable and database connection state.
 *
 * SAFETY RULES:
 *   - Never prints DATABASE_URL value.
 *   - Never prints passwords, tokens, or secrets.
 *   - Prints only: presence/absence, URL shape validity, hostname label only.
 *   - Safe to run in production Railway Console.
 */

import { URL } from 'node:url'

const SEP = '─'.repeat(55)

console.log('\n' + SEP)
console.log('  NOVEE OS — Railway Environment Diagnostic')
console.log(SEP + '\n')

// ── 1. DATABASE_URL presence ──────────────────────────────────────────────────
const raw = process.env.DATABASE_URL
const present = !!raw && raw.trim().length > 0
console.log(`DATABASE_URL present:         ${present ? 'YES (value hidden)' : 'NO ← configure in Railway Variables tab'}`)

if (!present) {
  console.log('\n  ✗ DATABASE_URL is not set in this process.')
  console.log('  Fix: Railway dashboard → CRAFTHUB_360 service → Variables tab')
  console.log('       Add variable:  DATABASE_URL = ${{Postgres.DATABASE_URL}}')
  console.log('       (Replace "Postgres" with your actual Railway Postgres service name)')
  console.log('       Then click Redeploy.\n')
  console.log(SEP)
  console.log('  Other variables present:')
  console.log(`    NODE_ENV:   ${process.env.NODE_ENV ?? '(not set)'}`)
  console.log(`    PORT:       ${process.env.PORT ?? '(not set)'}`)
  console.log(SEP + '\n')
  process.exit(0)
}

// ── 2. DATABASE_URL shape validation ─────────────────────────────────────────
let parsedUrl = null
let shapeValid = false
let hostname = null
let protocol = null
let hasUserInfo = false
let hasPath = false
let parseError = null

try {
  parsedUrl = new URL(raw.trim())
  protocol = parsedUrl.protocol
  hostname = parsedUrl.hostname
  hasUserInfo = !!(parsedUrl.username)
  hasPath = parsedUrl.pathname && parsedUrl.pathname.length > 1

  shapeValid = (
    (protocol === 'postgres:' || protocol === 'postgresql:') &&
    hostname.length > 0 &&
    hostname !== 'base' &&
    hostname !== 'localhost' &&   // warn but not invalid in prod
    hasUserInfo &&
    hasPath
  )
} catch (err) {
  parseError = err.message
}

console.log(`DATABASE_URL shape valid:      ${shapeValid ? 'YES' : 'NO ← likely a misconfigured reference'}`)
console.log(`DATABASE_URL protocol:         ${protocol ?? '(could not parse)'}`)
console.log(`DATABASE_URL hostname (only):  ${hostname ?? '(could not parse)'}`)

if (hostname === 'base') {
  console.log('\n  ✗ KNOWN BAD VALUE: hostname is "base".')
  console.log('    This means Railway resolved ${{Postgres.DATABASE_URL}} as a literal string')
  console.log('    because the service name does not match. Common causes:')
  console.log('    1. Your Postgres service in Railway is not named "Postgres" (case-sensitive).')
  console.log('    2. You typed the reference manually and introduced a typo.')
  console.log('    3. You set DATABASE_URL to a string literal instead of a reference.')
  console.log('\n  Fix:')
  console.log('    a. In Railway dashboard, open your Postgres service and note its exact name.')
  console.log('    b. In your CRAFTHUB_360 service Variables tab, delete DATABASE_URL.')
  console.log('    c. Re-add it as:  DATABASE_URL = ${{<ExactServiceName>.DATABASE_URL}}')
  console.log('    d. Click Redeploy.')
}

if (hostname === 'localhost') {
  console.log('\n  ⚠ WARNING: DATABASE_URL points to localhost.')
  console.log('    This will not connect from inside Railway containers.')
  console.log('    Use the Railway internal hostname or DATABASE_URL reference instead.')
}

if (parseError) {
  console.log(`\n  ✗ URL parse error: ${parseError}`)
  console.log('    DATABASE_URL is not a valid URL. Check for extra spaces or quotes.')
}

if (!shapeValid && hostname !== 'base' && hostname !== 'localhost' && !parseError) {
  console.log('\n  ✗ DATABASE_URL does not match expected postgres://user:pass@host/db shape.')
  console.log(`    Protocol: ${protocol ?? 'missing'}`)
  console.log(`    Hostname: ${hostname ?? 'missing'}`)
  console.log(`    Has credentials: ${hasUserInfo}`)
  console.log(`    Has database path: ${hasPath}`)
}

// ── 3. Other env vars ─────────────────────────────────────────────────────────
console.log(`\nNODE_ENV:                      ${process.env.NODE_ENV ?? '(not set — defaults to development)'}`)
console.log(`PORT:                          ${process.env.PORT ?? '(not set — server may use default)'}`)

// ── 4. pg connection test ─────────────────────────────────────────────────────
console.log('\n' + SEP)
console.log('  PostgreSQL Connection Test')
console.log(SEP)

if (!shapeValid) {
  console.log('\n  Skipping connection test — DATABASE_URL shape is invalid.')
  console.log('  Fix the URL first, then re-run: npm run verify:railway-env\n')
  printSummary(false, false)
  process.exit(1)
}

let connected = false
let selectPassed = false

try {
  const pg = (await import('pg')).default
  const client = new pg.Client({
    connectionString: raw.trim(),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  })
  await client.connect()
  connected = true
  console.log('\n  ✓ PostgreSQL connection opened')

  const result = await client.query('SELECT 1 AS ok')
  selectPassed = result.rows[0]?.ok === 1
  if (selectPassed) {
    console.log('  ✓ SELECT 1 succeeded — database is accepting queries')
  } else {
    console.log('  ✗ SELECT 1 returned unexpected result')
  }

  await client.end()
} catch (err) {
  console.log(`\n  ✗ Connection failed: ${err.message}`)
  console.log('\n  Common causes:')
  console.log('    - SSL required: ensure NODE_ENV=production in Railway variables')
  console.log('    - Wrong host: check Railway Postgres service is running')
  console.log('    - Firewall/network: Railway internal networking may require public URL')
  console.log('    - Credentials rotated: delete and re-reference DATABASE_URL in Railway')
}

// ── 5. Summary ────────────────────────────────────────────────────────────────
printSummary(connected, selectPassed)
process.exit(connected && selectPassed ? 0 : 1)

function printSummary(conn, sel) {
  console.log('\n' + SEP)
  console.log('  Summary')
  console.log(SEP)
  console.log(`  DATABASE_URL present:         ${present ? 'YES' : 'NO'}`)
  console.log(`  DATABASE_URL shape valid:      ${shapeValid ? 'YES' : 'NO'}`)
  console.log(`  PostgreSQL connection:         ${conn ? 'OPEN ✓' : 'FAILED ✗'}`)
  console.log(`  SELECT 1:                      ${sel ? 'PASS ✓' : 'FAIL ✗'}`)
  console.log(`  Ready for db:migrate:          ${conn && sel ? 'YES' : 'NO'}`)
  console.log(`  Ready for activation script:   ${conn && sel ? 'YES' : 'NO'}`)
  console.log(`  Phase B safe to begin:         NO — requires SmokeCraft activation proof`)
  console.log(SEP + '\n')

  if (conn && sel) {
    console.log('  Next steps (run in Railway Console):')
    console.log('    npm run db:migrate')
    console.log('    npm run verify:smokecraft-database-activation')
    console.log('\n  Phase B unlocks only when verify:smokecraft-database-activation exits 0')
    console.log('  with Business-critical passed: 8/8 and Infrastructure-critical passed: 3/3\n')
  }
}
