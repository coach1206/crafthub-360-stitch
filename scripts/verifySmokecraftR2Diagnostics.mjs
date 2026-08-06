// Verifier for the R2 diagnostics/error-classification/preflight module
// (SmokeCraft R2 UnknownError root-cause repair). Runs in plain Node,
// exercising the real exported functions with constructed fake SDK-error
// objects (shaped exactly like real @aws-sdk/client-s3 v3 errors) and
// real env var mutation — not assertions about source text.
//
// Usage: node scripts/verifySmokecraftR2Diagnostics.mjs

import { pathToFileURL } from 'url'
import { resolve } from 'path'

let fail = 0
function check(name, cond, detail = '') {
  if (cond) console.log(`  OK    ${name}`)
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('── SmokeCraft R2 diagnostics verifier\n')

async function freshImport() {
  const url = pathToFileURL(resolve('server/services/venueManagement/r2Diagnostics.js')).href + `?t=${Date.now()}_${Math.random()}`
  return import(url)
}

// ── classifyR2Error: real AWS SDK v3 error shapes ──────────────────────
{
  const { classifyR2Error, R2_FAILURE_CODE } = await freshImport()

  const cases = [
    {
      name: 'malformed endpoint / no HTTP status captured (checksum-protocol mismatch signature)',
      err: { name: 'UnknownError', message: 'UnknownError' },
      expectCode: R2_FAILURE_CODE.UNKNOWN,
    },
    {
      name: 'wrong region — SignatureDoesNotMatch',
      err: { name: 'SignatureDoesNotMatch', Code: 'SignatureDoesNotMatch', $metadata: { httpStatusCode: 403, requestId: 'req-1' } },
      expectCode: R2_FAILURE_CODE.SIGNATURE_MISMATCH,
    },
    {
      name: 'missing bucket — NoSuchBucket',
      err: { name: 'NoSuchBucket', Code: 'NoSuchBucket', $metadata: { httpStatusCode: 404, requestId: 'req-2' } },
      expectCode: R2_FAILURE_CODE.BUCKET_NOT_FOUND,
    },
    {
      name: 'invalid credentials — InvalidAccessKeyId',
      err: { name: 'InvalidAccessKeyId', Code: 'InvalidAccessKeyId', $metadata: { httpStatusCode: 401, requestId: 'req-3' } },
      expectCode: R2_FAILURE_CODE.CREDENTIALS_INVALID,
    },
    {
      name: 'access denied — AccessDenied',
      err: { name: 'AccessDenied', Code: 'AccessDenied', $metadata: { httpStatusCode: 403, requestId: 'req-4' } },
      expectCode: R2_FAILURE_CODE.ACCESS_DENIED,
    },
    {
      name: 'network failure — ENOTFOUND',
      err: { name: 'Error', message: 'getaddrinfo ENOTFOUND bad.endpoint.example' },
      expectCode: R2_FAILURE_CODE.NETWORK_FAILED,
    },
  ]

  for (const c of cases) {
    const result = classifyR2Error(c.err)
    check(c.name, result.failureCode === c.expectCode, `got ${result.failureCode}, expected ${c.expectCode}`)
  }

  // request ID / http status / retryable are captured, not dropped.
  const withMeta = classifyR2Error({ name: 'AccessDenied', Code: 'AccessDenied', $metadata: { httpStatusCode: 403, requestId: 'req-xyz' } })
  check('captures HTTP status', withMeta.httpStatus === 403)
  check('captures request ID', withMeta.requestId === 'req-xyz')
  check('captures error name/code', withMeta.errorName === 'AccessDenied' && withMeta.errorCode === 'AccessDenied')

  const retryableErr = classifyR2Error({ name: 'InternalError', Code: 'InternalError', $metadata: { httpStatusCode: 500, requestId: 'req-5' } })
  check('5xx classified as retryable', retryableErr.retryable === true)
}

// ── getSafeConfigReport: redaction + endpoint/region validation ────────
{
  const savedEnv = { ...process.env }
  function setEnv(overrides) {
    for (const k of ['STORAGE_PROVIDER', 'STORAGE_BUCKET', 'STORAGE_ENDPOINT', 'STORAGE_REGION', 'STORAGE_ACCESS_KEY_ID', 'STORAGE_SECRET_ACCESS_KEY']) delete process.env[k]
    Object.assign(process.env, overrides)
  }

  // Valid R2 config shape.
  setEnv({
    STORAGE_PROVIDER: 'r2',
    STORAGE_BUCKET: 'crafthub360-production',
    STORAGE_ENDPOINT: 'https://' + 'a'.repeat(32) + '.r2.cloudflarestorage.com',
    STORAGE_REGION: 'auto',
    STORAGE_ACCESS_KEY_ID: 'AKIA-fake-access-key-value',
    STORAGE_SECRET_ACCESS_KEY: 'fake-secret-value-not-real',
  })
  {
    const { getSafeConfigReport } = await freshImport()
    const report = getSafeConfigReport()
    check('valid R2 endpoint format accepted', report.endpointFormatValid === true)
    check('region "auto" accepted as valid', report.regionValid === true)
    check('bucket name reported (not a secret)', report.bucket === 'crafthub360-production')
    check('access key presence reported without value', report.accessKeyPresent === true && report.accessKeyLength > 0)
    check('secret key presence reported without value', report.secretKeyPresent === true && report.secretKeyLength > 0)
    check('report never contains the literal secret value', JSON.stringify(report).indexOf('fake-secret-value-not-real') === -1)
    check('report never contains the literal access key value', JSON.stringify(report).indexOf('AKIA-fake-access-key-value') === -1)
  }

  // Malformed endpoint (public R2.dev URL mistakenly used as the S3 API endpoint).
  setEnv({
    STORAGE_PROVIDER: 'r2',
    STORAGE_BUCKET: 'crafthub360-production',
    STORAGE_ENDPOINT: 'https://pub-1234567890abcdef.r2.dev',
    STORAGE_REGION: 'auto',
    STORAGE_ACCESS_KEY_ID: 'x',
    STORAGE_SECRET_ACCESS_KEY: 'y',
  })
  {
    const { getSafeConfigReport } = await freshImport()
    const report = getSafeConfigReport()
    check('malformed/public endpoint correctly flagged invalid', report.endpointFormatValid === false)
  }

  // Wrong region.
  setEnv({
    STORAGE_PROVIDER: 'r2',
    STORAGE_BUCKET: 'crafthub360-production',
    STORAGE_ENDPOINT: 'https://' + 'a'.repeat(32) + '.r2.cloudflarestorage.com',
    STORAGE_REGION: 'us-east-1',
    STORAGE_ACCESS_KEY_ID: 'x',
    STORAGE_SECRET_ACCESS_KEY: 'y',
  })
  {
    const { getSafeConfigReport } = await freshImport()
    const report = getSafeConfigReport()
    check('non-"auto" region correctly flagged invalid for R2', report.regionValid === false)
  }

  process.env = savedEnv
}

// ── runR2Preflight: aborts cleanly (R2_CONFIGURATION_MISSING) when not activated ──
{
  const savedEnv = { ...process.env }
  delete process.env.STORAGE_PROVIDER
  delete process.env.STORAGE_BUCKET
  delete process.env.STORAGE_ACCESS_KEY_ID
  delete process.env.STORAGE_SECRET_ACCESS_KEY
  const { runR2Preflight, R2_FAILURE_CODE } = await freshImport()
  const result = await runR2Preflight()
  check('preflight reports R2_CONFIGURATION_MISSING (not a crash, not a false pass) when unconfigured', result.ok === false && result.code === 'R2_CONFIGURATION_MISSING')
  check('preflight never claims success without real credentials', result.ok !== true)
  process.env = savedEnv
}

// ── Bulk-sync abort-after-failed-preflight (integration, via the real sync script) ──
{
  const { execSync } = await import('child_process')
  const savedEnv = { ...process.env }
  delete process.env.STORAGE_PROVIDER
  process.env.STORAGE_PROVIDER = 'local' // force not-activated -> the earlier "R2 not activated" gate fires before preflight even runs
  let exitCode = 0
  let output = ''
  try {
    output = execSync('node scripts/smokecraftAssetsSyncR2.mjs --upload-missing', { encoding: 'utf8', stdio: 'pipe' })
  } catch (e) {
    exitCode = e.status
    output = (e.stdout || '') + (e.stderr || '')
  }
  check('bulk --upload-missing exits non-zero when R2 is not activated (never proceeds to upload)', exitCode !== 0)
  check('bulk --upload-missing output shows the real abort message, not a bare crash', /R2 not activated/.test(output))
  check('bulk --upload-missing never reports any UPLOADED/REPLACED entries when aborted', !/UPLOADED|REPLACED/.test(output))
  process.env = savedEnv
}

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) process.exit(1)
