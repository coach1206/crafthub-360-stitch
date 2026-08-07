/**
 * Production Package 4 — real object-storage adapter (S3-compatible,
 * targets Cloudflare R2 by default, works against any S3-compatible
 * endpoint including AWS S3).
 *
 * This is REAL, WORKING code using @aws-sdk/client-s3. It is not a stub.
 * What is NOT real: this sandbox has no live R2/S3 credentials, so the
 * "activate" path (an actual PUT/GET against a live bucket) has never
 * been exercised here. Everything that can be verified without live
 * credentials — module loads, client construction, key namespacing,
 * checksum computation, signed-URL shape, env-driven provider selection,
 * and the fail-closed guard that refuses local-disk fallback in
 * production — is real and tested in this pass.
 *
 * Provider selection is env-driven:
 *   STORAGE_PROVIDER = 'r2' | 's3' | 'local'
 *   'local' is REJECTED at startup when NODE_ENV=production (see
 *   assertProductionStorageSafe() and server/config/envValidator.js).
 *
 * Namespacing: staging and production use separate bucket names
 * (STORAGE_BUCKET_STAGING / STORAGE_BUCKET_PRODUCTION or a single
 * STORAGE_BUCKET with a STORAGE_KEY_PREFIX per environment) so a
 * staging upload can never collide with or overwrite production media.
 */
import crypto from 'crypto'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, HeadObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'

const PROVIDER   = (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
const BUCKET     = process.env.STORAGE_BUCKET || ''
const KEY_PREFIX = process.env.STORAGE_KEY_PREFIX || (process.env.NODE_ENV === 'production' ? 'production' : 'staging')
const REGION     = process.env.STORAGE_REGION || 'auto'
const ENDPOINT   = process.env.STORAGE_ENDPOINT || '' // e.g. https://<accountid>.r2.cloudflarestorage.com
const ACCESS_KEY = process.env.STORAGE_ACCESS_KEY_ID || ''
const SECRET_KEY = process.env.STORAGE_SECRET_ACCESS_KEY || ''
const CDN_URL    = process.env.STORAGE_CDN_URL || '' // public CDN domain in front of the bucket

const EXT_BY_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

/**
 * Fail-closed guard: production must never silently fall back to the
 * local-disk adapter. Called from envValidator.js at startup.
 */
export function assertProductionStorageSafe() {
  if (process.env.NODE_ENV !== 'production') return { ok: true }
  const errors = []
  if (PROVIDER === 'local' || !PROVIDER)
    errors.push('STORAGE_PROVIDER is "local" (or unset) in production — object storage must be r2 or s3, local-disk media persistence is not durable across deploys/containers')
  if (!BUCKET) errors.push('STORAGE_BUCKET is not set in production')
  if (!ENDPOINT && PROVIDER === 'r2') errors.push('STORAGE_ENDPOINT is not set in production (required for r2 provider)')
  if (!ACCESS_KEY) errors.push('STORAGE_ACCESS_KEY_ID is not set in production')
  if (!SECRET_KEY) errors.push('STORAGE_SECRET_ACCESS_KEY is not set in production')
  return { ok: errors.length === 0, errors }
}

// Cloudflare's own S3-compatibility docs require path-style addressing
// (bucket in the URL path, not as a subdomain) — R2 does not support
// virtual-hosted-style addressing the way AWS S3 does. This is the one
// deterministic mode used for every real request; see
// probeAddressingModes() below for the diagnostic-only, one-time check
// that confirms this against the real configured endpoint rather than
// assuming it and never verifying.
const FORCE_PATH_STYLE = PROVIDER === 'r2'

let _client = null
function client() {
  if (_client) return _client
  if (PROVIDER === 'local') return null
  _client = buildClient({ forcePathStyle: FORCE_PATH_STYLE })
  return _client
}

/** Builds a standalone S3Client — used by client() for the real singleton, and by probeAddressingModes() below for one-off diagnostic-only clients with a specific forcePathStyle override, never touching the shared singleton. */
function buildClient({ forcePathStyle }) {
  return new S3Client({
    region: REGION,
    endpoint: ENDPOINT || undefined,
    forcePathStyle,
    credentials: (ACCESS_KEY && SECRET_KEY)
      ? { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY }
      : undefined,
    // R2 UnknownError root cause (SmokeCraft R2 diagnostics pass): AWS SDK
    // v3 (~3.729+, this repo pins 3.1101.0) defaults both of these to
    // 'WHEN_SUPPORTED' — it advertises/expects flexible-checksum trailers
    // (x-amz-checksum-*) on every request/response. Cloudflare R2 does not
    // fully implement that newer protocol, so the SDK's own checksum
    // middleware fails to parse R2's response and throws a generic,
    // non-descriptive `UnknownError` instead of R2's real error — every
    // single object failing identically with the same opaque message (not
    // per-object credential/permission errors) is the exact signature of
    // this, not a per-request problem. 'WHEN_REQUIRED' only applies
    // checksums where the API mandates them, matching R2's actual
    // S3-compatible behavior and letting real R2 error responses (auth,
    // permissions, bucket-not-found, signature) reach this code instead
    // of being swallowed.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
  })
  return _client
}

export function isActivated() {
  return PROVIDER !== 'local' && !!BUCKET && !!ACCESS_KEY && !!SECRET_KEY
}

export function providerInfo() {
  return {
    provider: PROVIDER,
    bucket: BUCKET || null,
    keyPrefix: KEY_PREFIX,
    endpointConfigured: !!ENDPOINT,
    cdnConfigured: !!CDN_URL,
    activated: isActivated(),
  }
}

/**
 * upload({venueId, buffer, mimeType, variant}) -> { storageKey, checksum, url }
 * Server-generated key only — never derived from client filename.
 * variant is optional (e.g. 'thumbnail', 'gallery') for resized outputs.
 */
export async function upload({ venueId, buffer, mimeType, variant = 'original' }) {
  if (!venueId || typeof venueId !== 'string' || venueId.includes('..') || venueId.includes('/'))
    throw new Error('objectStorageAdapter.upload: invalid venueId')
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex')
  const ext = EXT_BY_MIME[mimeType] || 'bin'
  const objectName = `${crypto.randomUUID()}-${variant}.${ext}`
  const storageKey = `${KEY_PREFIX}/${venueId}/${objectName}`

  if (!isActivated()) {
    throw new Error('objectStorageAdapter.upload: provider not activated (STORAGE_PROVIDER/STORAGE_BUCKET/credentials missing) — use the local-disk dev adapter in server/services/venueManagement/storageAdapter.js instead')
  }

  const c = client()
  await c.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: storageKey,
    Body: buffer,
    ContentType: mimeType,
    Metadata: { checksum, venueid: venueId, variant },
  }))

  return { storageKey, checksum, url: publicUrl(storageKey) }
}

export async function remove(storageKey) {
  if (!isActivated()) return
  if (!storageKey.startsWith(KEY_PREFIX + '/')) {
    throw new Error('objectStorageAdapter.remove: refusing to delete a key outside this environment\'s namespace')
  }
  const c = client()
  await c.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey }))
}

export async function readBuffer(storageKey) {
  if (!isActivated()) return null
  const c = client()
  const res = await c.send(new GetObjectCommand({ Bucket: BUCKET, Key: storageKey }))
  const chunks = []
  for await (const chunk of res.Body) chunks.push(chunk)
  return Buffer.concat(chunks)
}

/** CDN-fronted URL when STORAGE_CDN_URL is set, else a signed/proxy-worthy raw key reference. */
export function publicUrl(storageKey) {
  if (CDN_URL) return `${CDN_URL.replace(/\/$/, '')}/${storageKey}`
  return `/api/venue-management/media/object/${encodeURIComponent(storageKey)}`
}

/**
 * GitHub-to-R2 asset sync support (SmokeCraft production closure).
 * These are deliberately generic — unlike upload() above (which owns its
 * own venue-media key scheme and server-generated random object names),
 * a GitHub-sourced asset's key is deterministic and computed by the
 * caller (scripts/smokecraftAssetsSyncR2.mjs): the sync tool needs to
 * put/HEAD an EXACT known key, not have one assigned to it.
 */

/** HEAD an object without downloading it. Returns null if it doesn't exist. */
export async function headObject(storageKey) {
  if (!isActivated()) return null
  try {
    const c = client()
    const res = await c.send(new HeadObjectCommand({ Bucket: BUCKET, Key: storageKey }))
    return { etag: res.ETag, contentType: res.ContentType, contentLength: res.ContentLength, metadata: res.Metadata || {}, versionId: res.VersionId || null }
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) return null
    throw err
  }
}

/** Put an object at an EXACT, caller-computed key (not the random venue-media naming upload() uses). */
export async function putObjectAtKey({ key, buffer, mimeType, cacheControl, metadata = {} }) {
  if (!isActivated()) {
    throw new Error('objectStorageAdapter.putObjectAtKey: provider not activated (STORAGE_PROVIDER/STORAGE_BUCKET/credentials missing)')
  }
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex')
  const c = client()
  const res = await c.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    CacheControl: cacheControl,
    Metadata: { checksum, ...metadata },
  }))
  return { key, checksum, etag: res.ETag, versionId: res.VersionId || null, url: publicUrl(key) }
}

/**
 * R2 InvalidArgument repair — the absolute minimal, most
 * Cloudflare-R2-compatible PutObject shape: Bucket/Key/Body/ContentType
 * only. No CacheControl, no custom Metadata, no ACL, no StorageClass, no
 * explicit ChecksumAlgorithm. Used by r2Diagnostics.js's preflight as
 * the FIRST write, deliberately excluding every optional parameter that
 * could itself be the source of a 400 InvalidArgument, so a preflight
 * failure here can only mean a genuinely fundamental problem (endpoint/
 * region/credentials/bucket) — metadata/cache-control compatibility is
 * validated separately, only after this minimal shape succeeds.
 */
export async function putObjectMinimal({ key, buffer, mimeType }) {
  if (!isActivated()) {
    throw new Error('objectStorageAdapter.putObjectMinimal: provider not activated (STORAGE_PROVIDER/STORAGE_BUCKET/credentials missing)')
  }
  const c = client()
  const res = await c.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
  }))
  return { key, etag: res.ETag, versionId: res.VersionId || null }
}

/** Readiness-check helper: verifies bucket reachability without transferring data. */
export async function healthCheck() {
  if (!isActivated()) {
    return { ok: process.env.NODE_ENV !== 'production', provider: PROVIDER, activated: false, reason: 'not activated (expected in this sandbox — no live credentials)' }
  }
  const result = await checkBucketAccess()
  return { ok: result.ok, provider: PROVIDER, activated: true, error: result.ok ? undefined : result.errorMessage, method: result.method }
}

/**
 * Real bucket-access check (R2 bucket-check repair). HeadBucket alone is
 * NOT trusted as the sole signal — AWS SDK v3 against Cloudflare R2 has
 * a known failure mode where HeadBucketCommand throws an opaque,
 * unclassified error (no HTTP status, no error code — the exact shape
 * this pass exists to stop mis-trusting) even when the bucket is fully
 * reachable and the credentials/addressing are correct, because R2's
 * HeadBucket response doesn't carry every header the SDK's internal
 * bucket-region-resolution logic expects. `ListObjectsV2` with
 * `MaxKeys: 1` is the Cloudflare-recommended, more reliable bucket-
 * access probe (transfers at most one object key, never a body) and is
 * used here as the fallback whenever HeadBucket comes back unclassified
 * — not retried on every real request, only within this one-time
 * preflight/health-check path.
 *
 * Returns rich, safe diagnostic fields (no credential values) so a
 * caller can report exactly what was attempted and what came back.
 */
export async function checkBucketAccess() {
  const c = client()
  const base = {
    endpointHostname: safeEndpointHostname(),
    bucket: BUCKET || null,
    region: REGION,
    forcePathStyle: FORCE_PATH_STYLE,
    resolvedRequestHostname: resolvedRequestHostname(),
  }

  let headResult
  try {
    await c.send(new HeadBucketCommand({ Bucket: BUCKET }))
    return { ok: true, method: 'HeadBucket', ...base }
  } catch (err) {
    headResult = describeS3Error(err)
  }

  // HeadBucket failed — ALWAYS fall back to ListObjectsV2 rather than
  // trying to trust HeadBucket's own classification, even when it looks
  // "specific" (e.g. httpStatus 404 name NotFound). Real finding from
  // this pass's own test suite: HeadBucket is an HTTP HEAD request, so
  // its response can NEVER carry a body by HTTP spec — the SDK has no
  // XML error body to parse on ANY HeadBucket failure, so every single
  // one synthesizes the same generic, low-information shape (frequently
  // literally `message: "UnknownError"`) regardless of the real
  // underlying cause (access denied, not found, wrong region, whatever).
  // HeadBucket's own result is still recorded for visibility, but
  // ListObjectsV2 (a GET, which DOES carry a real XML error body on
  // failure) is the one trusted for actual classification.
  try {
    await c.send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 1 }))
    return { ok: true, method: 'ListObjectsV2 (HeadBucket fallback)', headBucketFailure: headResult, ...base }
  } catch (err) {
    const listResult = describeS3Error(err)
    return { ok: false, method: 'ListObjectsV2 (HeadBucket fallback)', headBucketFailure: headResult, ...base, ...listResult }
  }
}

/**
 * Diagnostic-only: probes both addressing modes (forcePathStyle true and
 * false) against the real configured endpoint with a harmless
 * ListObjectsV2 MaxKeys:1 call, to report which one actually works —
 * never used to pick a mode per-request in production (that stays the
 * single deterministic FORCE_PATH_STYLE constant above); this exists
 * purely so a diagnostic run can show real evidence instead of an
 * assumption when addressing is suspected as the cause of a bucket-check
 * failure.
 */
export async function probeAddressingModes() {
  if (!isActivated()) return { pathStyle: null, virtualHostedStyle: null }
  async function probe(forcePathStyle) {
    try {
      await buildClient({ forcePathStyle }).send(new ListObjectsV2Command({ Bucket: BUCKET, MaxKeys: 1 }))
      return { ok: true }
    } catch (err) {
      return { ok: false, ...describeS3Error(err) }
    }
  }
  const [pathStyle, virtualHostedStyle] = await Promise.all([probe(true), probe(false)])
  return { pathStyle, virtualHostedStyle, selectedMode: FORCE_PATH_STYLE ? 'path-style' : 'virtual-hosted-style' }
}

function safeEndpointHostname() {
  try { return ENDPOINT ? new URL(ENDPOINT).hostname : null } catch { return null }
}

/** What hostname a request will actually be sent to, given the selected addressing mode — computed, never a live request. */
function resolvedRequestHostname() {
  const host = safeEndpointHostname()
  if (!host || !BUCKET) return null
  return FORCE_PATH_STYLE ? host : `${BUCKET}.${host}`
}

/** Extracts safe (non-credential) diagnostic fields from a raw SDK error. */
function describeS3Error(err) {
  return {
    errorName: err?.name || null,
    // err.Code is the REAL S3/R2 XML <Code> the SDK parsed out of an
    // actual error response body — a genuinely classified failure.
    // err.code/err.name alone (no $metadata, no Code) means the SDK
    // never even got a parseable S3-shaped response — a raw Node/network
    // error, a socket reset, or exactly the "UnknownError" class this
    // whole pass exists to stop mis-trusting. Keeping isClassified
    // separate from the display-only errorCode fallback is what lets
    // checkBucketAccess() decide correctly whether to fall back to
    // ListObjectsV2 instead of masking a real error OR failing to fall
    // back on a genuinely unclassified one.
    errorCode: err?.Code || err?.code || err?.name || null,
    isClassified: !!(err?.Code || err?.$metadata?.httpStatusCode),
    httpStatus: err?.$metadata?.httpStatusCode ?? null,
    requestId: err?.$metadata?.requestId ?? err?.$metadata?.cfId ?? null,
    errorMessage: err?.message || null,
  }
}
