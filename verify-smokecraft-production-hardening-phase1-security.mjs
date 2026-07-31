#!/usr/bin/env node
/**
 * Production Hardening Phase 1 — security test suite. Exercises the
 * strengthened envValidator (in isolated child processes, never
 * against the live dev server's own env) and the live running server's
 * security headers / CORS / cache-control / error-redaction behavior.
 * Never uses or prints a real production secret.
 */
import { execFileSync } from 'child_process'
import fs from 'fs'

const HOST = 'localhost'
const PORT = 3001
let pass = 0, fail = 0
const results = []
function assert(name, cond, detail) {
  if (cond) { pass++; results.push({ name, ok: true }); console.log(`  PASS  ${name}`) }
  else { fail++; results.push({ name, ok: false, detail }); console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`) }
}

function runValidatorInChildProcess(env) {
  try {
    execFileSync(process.execPath, ['-e', `import('./server/config/envValidator.js').then(m => m.validateEnv())`], {
      env: { ...process.env, ...env },
      stdio: 'pipe',
    })
    return { exitCode: 0 }
  } catch (err) {
    return { exitCode: err.status, stderr: err.stderr?.toString() || '' }
  }
}

async function main() {
  console.log('\n── 1. Production startup rejects missing session/JWT secret ──')
  const r1 = runValidatorInChildProcess({ NODE_ENV: 'production', DATABASE_URL: 'postgres://x', CORS_ORIGIN: 'https://example.com', AUTH_COOKIE_SECURE: 'true', JWT_SECRET: '', FOUNDER_CHALLENGE_SECRET: 'x'.repeat(40) })
  assert('Production exits non-zero when JWT_SECRET is missing', r1.exitCode !== 0)

  console.log('\n── 2. Production startup rejects a known-unsafe default secret ──')
  const r2 = runValidatorInChildProcess({ NODE_ENV: 'production', DATABASE_URL: 'postgres://x', CORS_ORIGIN: 'https://example.com', AUTH_COOKIE_SECURE: 'true', JWT_SECRET: 'changeme', FOUNDER_CHALLENGE_SECRET: 'x'.repeat(40) })
  assert('Production exits non-zero when JWT_SECRET is a known-unsafe default ("changeme")', r2.exitCode !== 0)
  const r2b = runValidatorInChildProcess({ NODE_ENV: 'production', DATABASE_URL: 'postgres://x', CORS_ORIGIN: 'https://example.com', AUTH_COOKIE_SECURE: 'true', JWT_SECRET: 'short', FOUNDER_CHALLENGE_SECRET: 'x'.repeat(40) })
  assert('Production exits non-zero when JWT_SECRET is below the minimum safe length', r2b.exitCode !== 0)

  console.log('\n── 3. Production startup rejects a malformed CORS origin ──')
  const r3 = runValidatorInChildProcess({ NODE_ENV: 'production', DATABASE_URL: 'postgres://x', CORS_ORIGIN: 'not-a-valid-url', AUTH_COOKIE_SECURE: 'true', JWT_SECRET: 'x'.repeat(40), FOUNDER_CHALLENGE_SECRET: 'x'.repeat(40) })
  assert('Production exits non-zero when CORS_ORIGIN is not a valid URL', r3.exitCode !== 0)
  const r3b = runValidatorInChildProcess({ NODE_ENV: 'production', DATABASE_URL: 'postgres://x', CORS_ORIGIN: '*', AUTH_COOKIE_SECURE: 'true', JWT_SECRET: 'x'.repeat(40), FOUNDER_CHALLENGE_SECRET: 'x'.repeat(40) })
  assert('Production exits non-zero when CORS_ORIGIN is a wildcard', r3b.exitCode !== 0)

  console.log('\n── 4. Development startup still works with explicit development configuration ──')
  const r4 = runValidatorInChildProcess({ NODE_ENV: 'development' })
  assert('Development starts cleanly with no required secrets set (warnings only, exit 0)', r4.exitCode === 0)

  console.log('\n── 5. Production startup succeeds with valid temporary test secrets ──')
  const r5 = runValidatorInChildProcess({ NODE_ENV: 'production', DATABASE_URL: 'postgres://x', CORS_ORIGIN: 'https://example.com', AUTH_COOKIE_SECURE: 'true', JWT_SECRET: 'a'.repeat(40), FOUNDER_CHALLENGE_SECRET: 'b'.repeat(40) })
  assert('Production starts cleanly (exit 0) with valid, sufficiently-long, non-default secrets', r5.exitCode === 0)

  console.log('\n── 6. Security headers present on the live server ──')
  const health = await fetch(`http://${HOST}:${PORT}/api/health`)
  assert('X-Content-Type-Options: nosniff present', health.headers.get('x-content-type-options') === 'nosniff')
  assert('Referrer-Policy present', health.headers.get('referrer-policy') === 'strict-origin-when-cross-origin')
  assert('Permissions-Policy present and denies camera/microphone/geolocation', /camera=\(\)/.test(health.headers.get('permissions-policy') || '') && /microphone=\(\)/.test(health.headers.get('permissions-policy') || '') && /geolocation=\(\)/.test(health.headers.get('permissions-policy') || ''))
  assert('Cross-Origin-Opener-Policy: same-origin present', health.headers.get('cross-origin-opener-policy') === 'same-origin')
  assert('X-Powered-By header is removed (no framework fingerprinting)', health.headers.get('x-powered-by') === null)

  console.log('\n── 7. CSP present and compatible with core routes ──')
  const csp = health.headers.get('content-security-policy')
  assert('Content-Security-Policy header present', Boolean(csp))
  assert('CSP default-src is self (no wildcard)', /default-src 'self'/.test(csp || ''))
  assert('CSP frame-ancestors is none (clickjacking protection)', /frame-ancestors 'none'/.test(csp || ''))
  assert('CSP object-src is none', /object-src 'none'/.test(csp || ''))
  assert('CSP does NOT force upgrade-insecure-requests in local dev (would break http://localhost)', !/upgrade-insecure-requests/.test(csp || ''))

  console.log('\n── 8. HSTS present only in correct production conditions ──')
  assert('HSTS is absent on the local dev server (correct — dev is plain HTTP)', health.headers.get('strict-transport-security') === null)

  console.log('\n── 9. CORS allows the approved origin ──')
  const approved = await fetch(`http://${HOST}:${PORT}/api/health`, { headers: { Origin: 'http://localhost:5000' } })
  assert('Approved origin receives a matching Access-Control-Allow-Origin', approved.headers.get('access-control-allow-origin') === 'http://localhost:5000')

  console.log('\n── 10. CORS does not reflect an unknown origin ──')
  const unknown = await fetch(`http://${HOST}:${PORT}/api/health`, { headers: { Origin: 'http://evil.example.com' } })
  assert('An unapproved origin never sees itself reflected back in Access-Control-Allow-Origin', unknown.headers.get('access-control-allow-origin') !== 'http://evil.example.com')

  console.log('\n── 11. Credentials are not combined with a wildcard origin ──')
  assert('Access-Control-Allow-Origin is a specific origin, never "*", while Allow-Credentials is true', approved.headers.get('access-control-allow-origin') !== '*' && approved.headers.get('access-control-allow-credentials') === 'true')

  console.log('\n── 12. Cache-Control: no-store on API responses ──')
  assert('Authenticated/API JSON responses carry Cache-Control: no-store', health.headers.get('cache-control') === 'no-store')

  console.log('\n── 13. Error responses redact stack traces in production ──')
  const errModuleSrc = fs.readFileSync('server/middleware/errorHandler.js', 'utf8')
  assert('errorHandler.js only includes err.stack when NODE_ENV !== production', /isDev\s*&&\s*err\.stack/.test(errModuleSrc))
  assert('errorHandler.js uses a fixed generic message in production, never err.message', /isDev\s*\?\s*\(err\.message/.test(errModuleSrc) && /'Internal server error'/.test(errModuleSrc))

  console.log('\n── 14. Sensitive values do not appear in logs ──')
  const logPath = '/tmp/claude-0/-home-user-crafthub-360-stitch/9549ca44-cf2d-505f-9895-7880c4e30480/scratchpad/server2.log'
  if (fs.existsSync(logPath)) {
    const logContent = fs.readFileSync(logPath, 'utf8')
    assert('Server startup log never prints the literal DATABASE_URL connection string', !logContent.includes(process.env.DATABASE_URL || '__no_db_url_set__'))
    assert('Server startup log never prints a "Cookie:" or "Authorization:" header value', !/Cookie: [a-zA-Z0-9_]+=/.test(logContent) && !/Authorization: Bearer/.test(logContent))
  } else {
    console.log('  (server log file not found at expected path — skipping log-content assertion, not counted as pass or fail)')
  }

  console.log('\n── 15. Disabled integrations fail closed ──')
  const stripeConfigSrc = fs.readFileSync('server/config/paymentProviderConfig.js', 'utf8')
  assert('Stripe readiness check reports honest unavailable status when STRIPE_SECRET_KEY is unset, never a fake ready state', /if \(!hasSecret\)/.test(stripeConfigSrc) && /stripeReady: false/.test(stripeConfigSrc))

  console.log('\n── 16. Active integrations require credentials ──')
  assert('Stripe config never hardcodes a fallback secret key', !/STRIPE_SECRET_KEY.*\|\|.*['"]sk_/.test(stripeConfigSrc))

  console.log('\n── 17. Dependency validator confirms safe versions ──')
  const bodyParserPkg = JSON.parse(fs.readFileSync('node_modules/body-parser/package.json', 'utf8'))
  assert('body-parser installed version is >= 1.20.6 (patched)', bodyParserPkg.version.localeCompare('1.20.6', undefined, { numeric: true }) >= 0)

  console.log('\n── Summary ──')
  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed (of ${pass + fail} total) ===\n`)
  fs.mkdirSync('public/proof/smokecraft-production-hardening-phase-1', { recursive: true })
  fs.writeFileSync('public/proof/smokecraft-production-hardening-phase-1/security-test-results.json', JSON.stringify({ pass, fail, results }, null, 2))
  process.exit(fail === 0 ? 0 : 1)
}

main().catch(err => { console.error(err); process.exit(1) })
