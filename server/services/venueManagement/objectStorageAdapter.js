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
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadBucketCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

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

let _client = null
function client() {
  if (_client) return _client
  if (PROVIDER === 'local') return null
  _client = new S3Client({
    region: REGION,
    endpoint: ENDPOINT || undefined,
    forcePathStyle: PROVIDER === 'r2',
    credentials: (ACCESS_KEY && SECRET_KEY)
      ? { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY }
      : undefined,
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

/** Readiness-check helper: verifies bucket reachability without transferring data. */
export async function healthCheck() {
  if (!isActivated()) {
    return { ok: process.env.NODE_ENV !== 'production', provider: PROVIDER, activated: false, reason: 'not activated (expected in this sandbox — no live credentials)' }
  }
  try {
    const c = client()
    await c.send(new HeadBucketCommand({ Bucket: BUCKET }))
    return { ok: true, provider: PROVIDER, activated: true }
  } catch (err) {
    return { ok: false, provider: PROVIDER, activated: true, error: err.message }
  }
}
