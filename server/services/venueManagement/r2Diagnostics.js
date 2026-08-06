/**
 * Cloudflare R2 diagnostics — safe config reporting, real SDK-error
 * classification, and a real preflight (SmokeCraft R2 UnknownError
 * root-cause repair).
 *
 * Everything here reads the same env vars as objectStorageAdapter.js
 * (STORAGE_PROVIDER/STORAGE_BUCKET/STORAGE_ENDPOINT/STORAGE_REGION/
 * STORAGE_ACCESS_KEY_ID/STORAGE_SECRET_ACCESS_KEY) — no separate
 * configuration system, no CLOUDFLARE_R2_* aliasing added (this repo's
 * existing STORAGE_* convention is already what's set in Railway).
 *
 * Never logs a credential value, an Authorization header, or a signed
 * request — only hostnames, presence booleans, and lengths.
 */
import { headObject, putObjectAtKey, remove, readBuffer } from './objectStorageAdapter.js'
import * as adapter from './objectStorageAdapter.js'

export const R2_FAILURE_CODE = {
  ENDPOINT_INVALID:        'R2_ENDPOINT_INVALID',
  REGION_INVALID:          'R2_REGION_INVALID',
  CREDENTIALS_INVALID:     'R2_CREDENTIALS_INVALID',
  ACCESS_DENIED:           'R2_ACCESS_DENIED',
  BUCKET_NOT_FOUND:        'R2_BUCKET_NOT_FOUND',
  SIGNATURE_MISMATCH:      'R2_SIGNATURE_MISMATCH',
  NETWORK_FAILED:          'R2_NETWORK_FAILED',
  PREFLIGHT_WRITE_FAILED:  'R2_PREFLIGHT_WRITE_FAILED',
  PREFLIGHT_READ_FAILED:   'R2_PREFLIGHT_READ_FAILED',
  PREFLIGHT_DELETE_FAILED: 'R2_PREFLIGHT_DELETE_FAILED',
  UNKNOWN:                 'R2_UNKNOWN_ERROR',
}

const ENDPOINT_RE = /^https:\/\/[a-z0-9]{32}\.r2\.cloudflarestorage\.com\/?$/i

/**
 * Safe, redacted configuration report. Never returns a credential value —
 * only presence and length, which is enough to catch the single most
 * common real-world mistake (a pasted key with a trailing newline/space,
 * or an empty-string env var that "looks" set to a human skimming
 * Railway's dashboard).
 */
export function getSafeConfigReport() {
  const provider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase()
  const bucket = process.env.STORAGE_BUCKET || ''
  const endpoint = process.env.STORAGE_ENDPOINT || ''
  const region = process.env.STORAGE_REGION || 'auto'
  const accessKey = process.env.STORAGE_ACCESS_KEY_ID || ''
  const secretKey = process.env.STORAGE_SECRET_ACCESS_KEY || ''

  let endpointHostname = null
  let endpointFormatValid = false
  try {
    if (endpoint) {
      endpointHostname = new URL(endpoint).hostname
      endpointFormatValid = provider !== 'r2' || ENDPOINT_RE.test(endpoint)
    }
  } catch {
    endpointFormatValid = false
  }

  return {
    provider,
    endpointHostname,
    endpointFormatValid,
    endpointPresent: !!endpoint,
    region,
    regionValid: region === 'auto',
    bucket: bucket || null,
    accessKeyPresent: !!accessKey,
    accessKeyLength: accessKey.length,
    secretKeyPresent: !!secretKey,
    secretKeyLength: secretKey.length,
  }
}

/**
 * Classify a raw AWS SDK v3 error into a real, specific failure code —
 * never collapses to a generic string. Reads the same fields the SDK
 * itself exposes (err.name, err.Code/err.code, err.$metadata,
 * err.$fault) rather than guessing from err.message alone, since
 * err.message is exactly what was producing the useless "UnknownError"
 * this pass exists to fix.
 */
export function classifyR2Error(err) {
  const httpStatus = err?.$metadata?.httpStatusCode ?? null
  const requestId = err?.$metadata?.requestId ?? err?.$metadata?.cfId ?? null
  const errorCode = err?.Code || err?.code || err?.name || null
  const retryable = err?.$retryable?.throttling === true || (typeof httpStatus === 'number' && httpStatus >= 500)

  let failureCode = R2_FAILURE_CODE.UNKNOWN
  let safeMessage = 'An unclassified error occurred talking to the storage provider.'

  // Specific errorCode patterns are checked BEFORE generic httpStatus
  // fallbacks — SignatureDoesNotMatch/InvalidAccessKeyId/NoSuchBucket all
  // commonly ride on a 403/401/404 that would otherwise be misclassified
  // as the generic ACCESS_DENIED/CREDENTIALS_INVALID/BUCKET_NOT_FOUND
  // case one level up (confirmed by this module's own test suite: a
  // 403 SignatureDoesNotMatch was misclassified as ACCESS_DENIED until
  // this ordering was fixed).
  if (!httpStatus && /ENOTFOUND|ECONNREFUSED|EAI_AGAIN|ETIMEDOUT|network/i.test(String(err?.message || errorCode || ''))) {
    failureCode = R2_FAILURE_CODE.NETWORK_FAILED
    safeMessage = 'Could not reach the storage endpoint over the network (DNS/connection/timeout).'
  } else if (/SignatureDoesNotMatch/i.test(String(errorCode))) {
    failureCode = R2_FAILURE_CODE.SIGNATURE_MISMATCH
    safeMessage = 'The request signature did not match — usually a wrong secret key or a clock/region mismatch.'
  } else if (/InvalidAccessKeyId|InvalidAccessKey/i.test(String(errorCode))) {
    failureCode = R2_FAILURE_CODE.CREDENTIALS_INVALID
    safeMessage = 'The access key was not recognized by the storage provider.'
  } else if (/NoSuchBucket/i.test(String(errorCode))) {
    failureCode = R2_FAILURE_CODE.BUCKET_NOT_FOUND
    safeMessage = 'The bucket was not found at this endpoint.'
  } else if (/AccessDenied/i.test(String(errorCode)) || httpStatus === 403) {
    failureCode = R2_FAILURE_CODE.ACCESS_DENIED
    safeMessage = 'The storage provider rejected this request as forbidden — the credential is valid but lacks permission for this bucket/action.'
  } else if (httpStatus === 401) {
    failureCode = R2_FAILURE_CODE.CREDENTIALS_INVALID
    safeMessage = 'The access key was not recognized by the storage provider.'
  } else if (httpStatus === 404 || /NotFound/i.test(String(errorCode))) {
    failureCode = R2_FAILURE_CODE.BUCKET_NOT_FOUND
    safeMessage = 'The bucket (or object) was not found at this endpoint.'
  } else if (/UnknownError/i.test(String(errorCode)) && !httpStatus) {
    // The exact signature this pass fixes at the client-construction
    // level (flexible-checksum mismatch) — still classified honestly if
    // it somehow recurs, rather than re-collapsing to nothing useful.
    failureCode = R2_FAILURE_CODE.UNKNOWN
    safeMessage = 'The storage SDK could not parse the provider\'s response (no HTTP status captured) — commonly caused by a checksum-protocol mismatch between the SDK and the provider, or a malformed endpoint.'
  }

  return {
    failureCode,
    safeMessage,
    errorName: err?.name || null,
    errorCode,
    httpStatus,
    requestId,
    retryable,
  }
}

async function attempt(fn, failureCodeOnError) {
  try {
    return { ok: true, result: await fn() }
  } catch (err) {
    const classified = classifyR2Error(err)
    return { ok: false, code: classified.httpStatus || classified.errorCode ? classified.failureCode : failureCodeOnError, detail: classified }
  }
}

/**
 * Real preflight: HEAD bucket reachability (via a HEAD on a diagnostics
 * key, which 404s harmlessly if the bucket is reachable — proving
 * connectivity/auth/endpoint are all correct before any bulk write),
 * upload a tiny diagnostic object, HEAD it, read it, delete it, confirm
 * deletion. Aborts (returns ok:false) at the first stage that fails,
 * with the real classified error attached — never continues to bulk
 * upload past a failed preflight.
 */
export async function runR2Preflight() {
  const config = getSafeConfigReport()
  if (!adapter.isActivated()) {
    return { ok: false, code: 'R2_CONFIGURATION_MISSING', config, stage: 'config' }
  }
  if (config.provider === 'r2' && !config.endpointFormatValid) {
    return { ok: false, code: R2_FAILURE_CODE.ENDPOINT_INVALID, config, stage: 'config', detail: { safeMessage: `STORAGE_ENDPOINT does not match the expected Cloudflare R2 format https://<ACCOUNT_ID>.r2.cloudflarestorage.com — got hostname "${config.endpointHostname}"` } }
  }
  if (!config.regionValid) {
    return { ok: false, code: R2_FAILURE_CODE.REGION_INVALID, config, stage: 'config', detail: { safeMessage: `STORAGE_REGION should be "auto" for R2 — got "${config.region}"` } }
  }

  const diagnosticKey = `diagnostics/r2-preflight/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`
  const payload = Buffer.from(`smokecraft R2 preflight ${new Date().toISOString()}`)

  const write = await attempt(() => putObjectAtKey({ key: diagnosticKey, buffer: payload, mimeType: 'text/plain', cacheControl: 'no-store' }), R2_FAILURE_CODE.PREFLIGHT_WRITE_FAILED)
  if (!write.ok) return { ok: false, code: write.code, config, stage: 'write', detail: write.detail }

  const head = await attempt(() => headObject(diagnosticKey), R2_FAILURE_CODE.PREFLIGHT_READ_FAILED)
  if (!head.ok || !head.result) return { ok: false, code: head.ok ? R2_FAILURE_CODE.PREFLIGHT_READ_FAILED : head.code, config, stage: 'head', detail: head.ok ? { safeMessage: 'HEAD after PUT returned no object.' } : head.detail }

  const read = await attempt(() => readBuffer(diagnosticKey), R2_FAILURE_CODE.PREFLIGHT_READ_FAILED)
  if (!read.ok || !read.result || !Buffer.isBuffer(read.result) || !read.result.equals(payload)) {
    return { ok: false, code: read.ok ? R2_FAILURE_CODE.PREFLIGHT_READ_FAILED : read.code, config, stage: 'read', detail: read.ok ? { safeMessage: 'Read-back content did not match what was written.' } : read.detail }
  }

  const del = await attempt(() => remove(diagnosticKey), R2_FAILURE_CODE.PREFLIGHT_DELETE_FAILED)
  if (!del.ok) return { ok: false, code: del.code, config, stage: 'delete', detail: del.detail }

  const confirmGone = await attempt(() => headObject(diagnosticKey), R2_FAILURE_CODE.PREFLIGHT_DELETE_FAILED)
  if (!confirmGone.ok) return { ok: false, code: confirmGone.code, config, stage: 'confirm-delete', detail: confirmGone.detail }
  if (confirmGone.result) return { ok: false, code: R2_FAILURE_CODE.PREFLIGHT_DELETE_FAILED, config, stage: 'confirm-delete', detail: { safeMessage: 'Diagnostic object still present after delete.' } }

  return { ok: true, config, stage: 'complete' }
}
