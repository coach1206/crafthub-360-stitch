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
    {
      // The real bug this pass fixes: InvalidArgument was previously
      // unclassified and fell through to R2_UNKNOWN_ERROR.
      name: 'malformed bucket / key / unsupported checksum / ACL / metadata — InvalidArgument (400)',
      err: { name: 'InvalidArgument', Code: 'InvalidArgument', message: "Header 'x-amz-acl' with value 'public-read' not implemented", $metadata: { httpStatusCode: 400, requestId: null } },
      expectCode: R2_FAILURE_CODE.INVALID_ARGUMENT,
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

  // InvalidArgument's safe message surfaces the provider's own parameter
  // description (useful for real repair), with credential-shaped
  // substrings stripped as a defensive measure.
  const invalidArgErr = classifyR2Error({
    name: 'InvalidArgument', Code: 'InvalidArgument',
    message: "Header 'x-amz-storage-class' with value 'GLACIER' not implemented. Authorization: AWS4-HMAC-SHA256 Credential=fakekey/20260101/auto/s3/aws4_request",
    $metadata: { httpStatusCode: 400, requestId: null },
  })
  check('InvalidArgument classified correctly', invalidArgErr.failureCode === R2_FAILURE_CODE.INVALID_ARGUMENT)
  check('InvalidArgument safe message names the rejected parameter', /x-amz-storage-class/.test(invalidArgErr.safeMessage))
  check('InvalidArgument safe message never contains a raw AWS4-HMAC signature', !/AWS4-HMAC-SHA256\s+Credential=fakekey/.test(invalidArgErr.safeMessage))
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

// ── Mocked S3-compatible server: exercises the REAL S3Client + adapter +
// r2Diagnostics preflight end-to-end (not just classifyR2Error unit
// checks above) against realistic S3 XML error/success responses —
// without needing live R2 credentials. ─────────────────────────────────
{
  const http = await import('http')
  const objects = new Map() // key -> Buffer, simulates bucket state

  function s3Error(code, message, status) {
    return { status, body: `<?xml version="1.0" encoding="UTF-8"?><Error><Code>${code}</Code><Message>${message}</Message><RequestId></RequestId></Error>` }
  }

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost')
    const path = decodeURIComponent(url.pathname)
    // Path-style: /<bucket>/<key...>
    const [, bucket, ...keyParts] = path.split('/')
    const key = keyParts.join('/')

    let chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => {
      const body = Buffer.concat(chunks)

      const KNOWN_BUCKETS = new Set(['crafthub360-production', 'unclassified-headbucket-bucket'])
      // Scenario switches, driven by the object key so each test case is isolated.
      if (!KNOWN_BUCKETS.has(bucket)) {
        const { status, body: xml } = s3Error('NoSuchBucket', 'The specified bucket does not exist', 404)
        res.writeHead(status, { 'Content-Type': 'application/xml' }); res.end(xml); return
      }
      if (key.includes('malformed-key%00') || key.includes('\x00')) {
        const { status, body: xml } = s3Error('InvalidArgument', "Invalid key: contains a null byte", 400)
        res.writeHead(status, { 'Content-Type': 'application/xml' }); res.end(xml); return
      }
      if (req.method === 'HEAD' && keyParts.length === 0) {
        if (bucket === 'unclassified-headbucket-bucket') {
          // Simulates the real AWS-SDK-v3-vs-R2 failure this pass fixes:
          // HeadBucket gets no parseable S3-shaped response at all (no
          // status line reaches the SDK as a real HTTP response) — an
          // abrupt socket destroy is the most faithful way to produce a
          // genuinely unclassified error (no $metadata, no XML <Code>)
          // through a real Node HTTP client, exactly like the real
          // opaque failure this bucket-check repair targets.
          req.socket.destroy()
          return
        }
        // HeadBucket
        res.writeHead(200); res.end(); return
      }
      // ListObjectsV2 — any bucket-level GET (no object key) is a list call, never an object read. AWS SDK path-style requests may or may not include a trailing slash, so check the joined key, not keyParts.length.
      if (req.method === 'GET' && key === '') {
        res.writeHead(200, { 'Content-Type': 'application/xml' })
        res.end('<?xml version="1.0" encoding="UTF-8"?><ListBucketResult><Name>' + bucket + '</Name><KeyCount>0</KeyCount></ListBucketResult>')
        return
      }
      if (req.method === 'PUT') {
        if (req.headers['x-amz-acl']) {
          const { status, body: xml } = s3Error('InvalidArgument', "Header 'x-amz-acl' with value 'public-read' not implemented", 400)
          res.writeHead(status, { 'Content-Type': 'application/xml' }); res.end(xml); return
        }
        if (req.headers['x-amz-storage-class']) {
          const { status, body: xml } = s3Error('InvalidArgument', "Header 'x-amz-storage-class' with value 'GLACIER' not implemented", 400)
          res.writeHead(status, { 'Content-Type': 'application/xml' }); res.end(xml); return
        }
        if (req.headers['x-amz-sdk-checksum-algorithm'] || req.headers['x-amz-checksum-crc32']) {
          const { status, body: xml } = s3Error('InvalidArgument', 'Unsupported checksum algorithm', 400)
          res.writeHead(status, { 'Content-Type': 'application/xml' }); res.end(xml); return
        }
        const badMetaHeader = Object.keys(req.headers).find(h => h.startsWith('x-amz-meta-') && /[^\x20-\x7e]/.test(req.headers[h] || ''))
        if (badMetaHeader) {
          const { status, body: xml } = s3Error('InvalidArgument', `Invalid metadata header ${badMetaHeader}`, 400)
          res.writeHead(status, { 'Content-Type': 'application/xml' }); res.end(xml); return
        }
        objects.set(key, body)
        res.writeHead(200, { ETag: '"mock-etag"' }); res.end(); return
      }
      if (req.method === 'HEAD') {
        if (!objects.has(key)) { res.writeHead(404); res.end(); return }
        res.writeHead(200, { 'Content-Length': String(objects.get(key).length), 'Content-Type': 'text/plain' }); res.end(); return
      }
      if (req.method === 'GET') {
        if (!objects.has(key)) { const { status, body: xml } = s3Error('NoSuchKey', 'The specified key does not exist', 404); res.writeHead(status, { 'Content-Type': 'application/xml' }); res.end(xml); return }
        res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end(objects.get(key)); return
      }
      if (req.method === 'DELETE') {
        objects.delete(key)
        res.writeHead(204); res.end(); return
      }
      res.writeHead(501); res.end()
    })
  })

  await new Promise(r => server.listen(0, '127.0.0.1', r))
  const port = server.address().port
  const mockEndpoint = `http://127.0.0.1:${port}`

  const savedEnv = { ...process.env }
  function setMockEnv(bucket = 'crafthub360-production') {
    Object.assign(process.env, {
      STORAGE_PROVIDER: 'r2',
      STORAGE_BUCKET: bucket,
      STORAGE_ENDPOINT: mockEndpoint,
      STORAGE_REGION: 'auto',
      STORAGE_ACCESS_KEY_ID: 'mock-access-key',
      STORAGE_SECRET_ACCESS_KEY: 'mock-secret-key',
    })
  }

  // Successful minimal preflight — full real round trip through the real
  // S3Client, adapter, and r2Diagnostics against the mock server.
  {
    setMockEnv()
    // getSafeConfigReport's endpointFormatValid check requires the real
    // R2 hostname shape; the mock server can't satisfy that, so this
    // exercises everything else (bucket-check through metadata-write)
    // by calling the adapter functions directly rather than the
    // endpoint-format-gated runR2Preflight() wrapper.
    const adapter = await import(pathToFileURL(resolve('server/services/venueManagement/objectStorageAdapter.js')).href + `?t=${Date.now()}`)
    let threw = null
    let putResult, headResult, readResult
    try {
      // Namespaced under this environment's real keyPrefix — remove()
      // correctly refuses to delete a key outside it (see the real bug
      // this exact mismatch caused in r2Diagnostics.js's own preflight,
      // fixed alongside this test).
      const prefixedKey = `${adapter.providerInfo().keyPrefix}/diagnostics/test-success/file.txt`
      putResult = await adapter.putObjectMinimal({ key: prefixedKey, buffer: Buffer.from('hello'), mimeType: 'text/plain' })
      headResult = await adapter.headObject(prefixedKey)
      readResult = await adapter.readBuffer(prefixedKey)
      await adapter.remove(prefixedKey)
    } catch (e) { threw = e }
    check('successful minimal R2 preflight: PutObject/HeadObject/GetObject/DeleteObject all succeed against a real S3-compatible server', !threw && !!putResult?.etag && !!headResult && readResult?.toString() === 'hello', threw ? String(threw) : '')
  }

  // Malformed bucket -> NoSuchBucket -> classified as R2_BUCKET_NOT_FOUND.
  {
    setMockEnv('wrong-bucket-name')
    const adapter = await import(pathToFileURL(resolve('server/services/venueManagement/objectStorageAdapter.js')).href + `?t=${Date.now()}`)
    const { classifyR2Error, R2_FAILURE_CODE } = await freshImport()
    let classified = null
    try { await adapter.putObjectMinimal({ key: 'diagnostics/test/x.txt', buffer: Buffer.from('x'), mimeType: 'text/plain' }) }
    catch (e) { classified = classifyR2Error(e) }
    check('malformed bucket -> real NoSuchBucket error classified correctly', classified?.failureCode === R2_FAILURE_CODE.BUCKET_NOT_FOUND, JSON.stringify(classified))
  }

  // Unsupported ACL -> InvalidArgument -> R2_INVALID_ARGUMENT, with the operation identified.
  {
    setMockEnv()
    const S3 = await import('@aws-sdk/client-s3')
    const rawClient = new S3.S3Client({ region: 'auto', endpoint: mockEndpoint, forcePathStyle: true, credentials: { accessKeyId: 'x', secretAccessKey: 'y' }, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' })
    const { classifyR2Error, R2_FAILURE_CODE } = await freshImport()
    let classified = null
    try {
      await rawClient.send(new S3.PutObjectCommand({ Bucket: 'crafthub360-production', Key: 'diagnostics/test-acl/x.txt', Body: Buffer.from('x'), ACL: 'public-read' }))
    } catch (e) { classified = classifyR2Error(e) }
    check('unsupported ACL -> real InvalidArgument (400) error classified as R2_INVALID_ARGUMENT, not R2_UNKNOWN_ERROR', classified?.failureCode === R2_FAILURE_CODE.INVALID_ARGUMENT, JSON.stringify(classified))
  }

  // Unsupported storage class -> InvalidArgument.
  {
    setMockEnv()
    const S3 = await import('@aws-sdk/client-s3')
    const rawClient = new S3.S3Client({ region: 'auto', endpoint: mockEndpoint, forcePathStyle: true, credentials: { accessKeyId: 'x', secretAccessKey: 'y' }, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' })
    const { classifyR2Error, R2_FAILURE_CODE } = await freshImport()
    let classified = null
    try {
      await rawClient.send(new S3.PutObjectCommand({ Bucket: 'crafthub360-production', Key: 'diagnostics/test-storageclass/x.txt', Body: Buffer.from('x'), StorageClass: 'GLACIER' }))
    } catch (e) { classified = classifyR2Error(e) }
    check('unsupported StorageClass -> real InvalidArgument (400) error classified as R2_INVALID_ARGUMENT', classified?.failureCode === R2_FAILURE_CODE.INVALID_ARGUMENT, JSON.stringify(classified))
  }

  // Invalid metadata (non-ASCII header value) -> InvalidArgument.
  {
    setMockEnv()
    const S3 = await import('@aws-sdk/client-s3')
    const rawClient = new S3.S3Client({ region: 'auto', endpoint: mockEndpoint, forcePathStyle: true, credentials: { accessKeyId: 'x', secretAccessKey: 'y' }, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' })
    const { classifyR2Error, R2_FAILURE_CODE } = await freshImport()
    let classified = null
    try {
      await rawClient.send(new S3.PutObjectCommand({ Bucket: 'crafthub360-production', Key: 'diagnostics/test-metadata/x.txt', Body: Buffer.from('x'), Metadata: { note: 'café-ümläut-not-ascii' } }))
    } catch (e) { classified = classifyR2Error(e) }
    check('invalid (non-ASCII) metadata value -> real InvalidArgument (400) error classified as R2_INVALID_ARGUMENT', classified?.failureCode === R2_FAILURE_CODE.INVALID_ARGUMENT, JSON.stringify(classified))
  }

  // Operation-level failure reporting (runR2Preflight): objectStorageAdapter.js
  // computes its env-derived config once at module load (correct real-
  // production behavior — env doesn't change while a container runs),
  // so exercising this with a DIFFERENT env than earlier tests in this
  // same process needs a genuinely fresh process, exactly like the
  // bulk-abort-after-failed-preflight check below already does.
  {
    const { execSync } = await import('child_process')
    const { writeFileSync, unlinkSync } = await import('fs')
    const tmpScript = resolve('scripts/_tmp_preflight_probe.mjs')
    writeFileSync(tmpScript, `
      import { runR2Preflight } from '../server/services/venueManagement/r2Diagnostics.js'
      const result = await runR2Preflight()
      console.log(JSON.stringify(result))
    `)
    let output = ''
    try {
      output = execSync(`node ${tmpScript}`, {
        encoding: 'utf8',
        env: { ...process.env, STORAGE_PROVIDER: 'r2', STORAGE_BUCKET: 'another-wrong-bucket', STORAGE_ENDPOINT: mockEndpoint, STORAGE_REGION: 'auto', STORAGE_ACCESS_KEY_ID: 'mock-access-key', STORAGE_SECRET_ACCESS_KEY: 'mock-secret-key' },
      })
    } catch (e) { output = (e.stdout || '') + (e.stderr || '') } finally { try { unlinkSync(tmpScript) } catch {} }
    let result = null
    try { result = JSON.parse(output.trim().split('\n').pop()) } catch {}
    // endpointFormatValid fails first against a mock (non-R2-shaped)
    // endpoint — confirms the config stage reports correctly and
    // identifies itself as a config-level problem, not a silent/generic
    // failure, in a genuinely fresh process (matching real deployment
    // module-load behavior).
    check('preflight against a non-R2-shaped endpoint correctly identifies the config stage (never silently passes)', result?.ok === false && result?.stage === 'config' && result?.code === 'R2_ENDPOINT_INVALID', JSON.stringify(result))
  }

  // ── R2 bucket-check repair: HeadBucket unclassified -> ListObjectsV2 fallback ──
  {
    setMockEnv('unclassified-headbucket-bucket')
    const adapter = await import(pathToFileURL(resolve('server/services/venueManagement/objectStorageAdapter.js')).href + `?t=${Date.now()}`)
    const result = await adapter.checkBucketAccess()
    check(
      'HeadBucket unclassified failure correctly falls back to ListObjectsV2, which succeeds',
      result.ok === true && result.method === 'ListObjectsV2 (HeadBucket fallback)' && !!result.headBucketFailure,
      JSON.stringify(result)
    )
  }

  // ── Real bucket-not-found surfaces correctly through the ListObjectsV2 fallback (HeadBucket errors carry no body by HTTP HEAD semantics, so the fallback's body-bearing error is what's trusted for classification) ──
  {
    setMockEnv('wrong-bucket-name')
    const adapter = await import(pathToFileURL(resolve('server/services/venueManagement/objectStorageAdapter.js')).href + `?t=${Date.now()}`)
    const result = await adapter.checkBucketAccess()
    check(
      'bucket-not-found surfaces correctly through the ListObjectsV2 fallback with the real NoSuchBucket classification',
      result.ok === false && result.method === 'ListObjectsV2 (HeadBucket fallback)' && result.errorCode === 'NoSuchBucket' && !!result.headBucketFailure,
      JSON.stringify(result)
    )
  }

  // ── Successful complete preflight sequence against the mock server ──
  // Exercises every real step (bucket-check through metadata-write) via
  // direct adapter calls — runR2Preflight() itself can't be used here
  // since its config gate requires the real
  // https://<32-char-id>.r2.cloudflarestorage.com hostname shape, which
  // no local mock server can ever satisfy; that gate is exercised
  // separately above ("non-R2-shaped endpoint" test).
  {
    setMockEnv('crafthub360-production')
    const adapter = await import(pathToFileURL(resolve('server/services/venueManagement/objectStorageAdapter.js')).href + `?t=${Date.now()}`)
    let threw = null
    const results = {}
    try {
      results.bucketCheck = await adapter.checkBucketAccess()
      const key = `${adapter.providerInfo().keyPrefix}/diagnostics/test-full-sequence/file.txt`
      const payload = Buffer.from('full sequence test')
      results.write = await adapter.putObjectMinimal({ key, buffer: payload, mimeType: 'text/plain' })
      results.head = await adapter.headObject(key)
      results.read = await adapter.readBuffer(key)
      await adapter.remove(key)
      results.confirmDelete = await adapter.headObject(key)
      const metaKey = `${adapter.providerInfo().keyPrefix}/diagnostics/test-full-sequence/meta.txt`
      results.metadataWrite = await adapter.putObjectAtKey({ key: metaKey, buffer: payload, mimeType: 'text/plain', cacheControl: 'no-store', metadata: { preflight: 'true' } })
      await adapter.remove(metaKey)
    } catch (e) { threw = e }
    check(
      'successful complete preflight sequence (bucket-check through metadata-write) against a real S3-compatible mock server',
      !threw
        && results.bucketCheck?.ok === true
        && !!results.write?.etag
        && !!results.head
        && results.read?.toString() === 'full sequence test'
        && results.confirmDelete === null
        && !!results.metadataWrite?.etag,
      threw ? String(threw) : JSON.stringify(results)
    )
  }

  // ── Addressing-mode probe: path-style succeeds against this path-style-only mock (virtual-hosted-style would resolve to a different, non-existent hostname and fail here — expected, this mock only understands path-style requests) ──
  {
    setMockEnv('crafthub360-production')
    const adapter = await import(pathToFileURL(resolve('server/services/venueManagement/objectStorageAdapter.js')).href + `?t=${Date.now()}`)
    const probe = await adapter.probeAddressingModes()
    check('addressing-mode probe: path-style succeeds against the real mock endpoint', probe.pathStyle?.ok === true, JSON.stringify(probe.pathStyle))
    check('addressing-mode probe reports the selected production mode (path-style, per Cloudflare R2 requirements)', probe.selectedMode === 'path-style')
  }

  // ── Secret redaction: checkBucketAccess()/probeAddressingModes() safe fields never contain the real access key or secret ──
  {
    setMockEnv('crafthub360-production')
    const adapter = await import(pathToFileURL(resolve('server/services/venueManagement/objectStorageAdapter.js')).href + `?t=${Date.now()}`)
    const result = await adapter.checkBucketAccess()
    const serialized = JSON.stringify(result)
    check('checkBucketAccess() result never contains the configured access key', serialized.indexOf('mock-access-key') === -1)
    check('checkBucketAccess() result never contains the configured secret key', serialized.indexOf('mock-secret-key') === -1)
  }

  process.env = savedEnv
  server.close()
}

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) process.exit(1)
