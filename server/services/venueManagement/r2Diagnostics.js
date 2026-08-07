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
import { headObject, putObjectAtKey, putObjectMinimal, remove, readBuffer, checkBucketAccess } from './objectStorageAdapter.js'
import * as adapter from './objectStorageAdapter.js'

export const R2_FAILURE_CODE = {
  ENDPOINT_INVALID:        'R2_ENDPOINT_INVALID',
  REGION_INVALID:          'R2_REGION_INVALID',
  CREDENTIALS_INVALID:     'R2_CREDENTIALS_INVALID',
  ACCESS_DENIED:           'R2_ACCESS_DENIED',
  BUCKET_NOT_FOUND:        'R2_BUCKET_NOT_FOUND',
  SIGNATURE_MISMATCH:      'R2_SIGNATURE_MISMATCH',
  NETWORK_FAILED:          'R2_NETWORK_FAILED',
  INVALID_ARGUMENT:        'R2_INVALID_ARGUMENT',
  BUCKET_CHECK_FAILED:     'R2_BUCKET_CHECK_FAILED',
  ADDRESSING_MODE_INVALID: 'R2_ADDRESSING_MODE_INVALID',
  PREFLIGHT_WRITE_FAILED:  'R2_PREFLIGHT_WRITE_FAILED',
  PREFLIGHT_READ_FAILED:   'R2_PREFLIGHT_READ_FAILED',
  PREFLIGHT_DELETE_FAILED: 'R2_PREFLIGHT_DELETE_FAILED',
  UNKNOWN:                 'R2_UNKNOWN_ERROR',
}

const ENDPOINT_RE = /^https:\/\/[a-z0-9]{32}\.r2\.cloudflarestorage\.com\/?$/i

/**
 * Strips anything that looks like a signed-request/auth artifact
 * (Authorization headers, AWS4-HMAC signatures, X-Amz-Signature/
 * X-Amz-Credential query params, access-key-id-shaped tokens) out of a
 * raw provider error message before it's ever logged or returned. R2's
 * InvalidArgument messages normally just name a rejected parameter
 * (e.g. "Header 'x-amz-...' with value '...' not implemented"), which is
 * safe on its own, but this is a defensive second layer, not a trust
 * assumption.
 */
function redactProviderMessage(message) {
  if (!message || typeof message !== 'string') return null
  return message
    .replace(/Authorization:\s*\S+/gi, 'Authorization: [redacted]')
    .replace(/AWS4-HMAC-SHA256[^\s,;]*/gi, '[redacted-signature]')
    .replace(/X-Amz-(Signature|Credential|Security-Token)=[^\s&]*/gi, 'X-Amz-$1=[redacted]')
    .slice(0, 300)
}

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
  } else if (/InvalidArgument/i.test(String(errorCode))) {
    // Real fix for the previous collapse-to-UnknownError bug: R2 rejected
    // a specific request parameter (never the SDK failing to parse the
    // response, unlike the earlier checksum-protocol UnknownError case —
    // this one carries a real HTTP status and error code from R2 itself).
    // The provider's own message names which parameter, and R2's
    // InvalidArgument messages describe parameter names/values, not
    // credentials — safe to surface, but still stripped of anything that
    // looks like a signed-request/auth artifact as a defensive measure.
    failureCode = R2_FAILURE_CODE.INVALID_ARGUMENT
    safeMessage = redactProviderMessage(err?.message) || 'The storage provider rejected a request parameter as invalid.'
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
 * Real, step-level preflight — every stage is named and reported
 * individually (client creation is implicit in each step's own attempt;
 * a failure there surfaces as R2_NETWORK_FAILED/credentials on the
 * bucket-check step, the first real network call) so a failure always
 * identifies the EXACT operation that failed, never just "preflight
 * failed": bucket-check -> minimal PutObject -> HeadObject -> GetObject
 * (content-verified) -> DeleteObject -> confirm-delete -> a SEPARATE
 * metadata-carrying PutObject (only attempted after the minimal shape
 * above has already proven basic read/write/delete works, per the
 * requirement that metadata compatibility be validated separately from
 * the baseline operations).
 *
 * The first write deliberately uses putObjectMinimal (Bucket/Key/Body/
 * ContentType only — no CacheControl/Metadata/ACL/StorageClass/explicit
 * checksum) so a failure there can only mean a fundamental problem
 * (endpoint/region/credentials/bucket), not an optional-parameter
 * incompatibility — exactly the class of bug (an R2-incompatible
 * request shape) this repair pass exists to stop guessing about.
 *
 * Aborts (returns ok:false) at the first stage that fails, with the
 * real classified error and the safe argument names actually sent —
 * never continues to bulk upload past a failed preflight.
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

  // Real bug found by this pass's own test suite: remove() refuses to
  // delete any key outside this environment's KEY_PREFIX namespace (a
  // real, correct safety guard against cross-environment deletes) — a
  // diagnostic key that didn't carry that prefix would pass every
  // preflight stage up through delete, then fail there in real
  // production every single time. Every diagnostic key here MUST be
  // namespaced the same way real production keys are.
  const diagnosticKey = `${adapter.providerInfo().keyPrefix}/diagnostics/r2-preflight/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.txt`
  const payload = Buffer.from(`smokecraft R2 preflight ${new Date().toISOString()}`, 'utf8')

  // Every stage name, reported separately whether it passed or the run
  // stopped there — so a diagnose run always shows real step-by-step
  // progress, not just a single pass/fail.
  const ALL_STAGES = ['bucket-check', 'write', 'head', 'read', 'delete', 'confirm-delete', 'metadata-write']
  const steps = []
  function stepOk(stage) { steps.push({ stage, ok: true }) }
  function stepsReport(failedStage) {
    return ALL_STAGES.map(stage => ({ stage, ok: steps.some(s => s.stage === stage), attempted: stage === failedStage || steps.some(s => s.stage === stage) }))
  }

  // 1. Bucket check — first real network call. checkBucketAccess() does
  // NOT trust HeadBucket alone (R2 bucket-check repair): HeadBucket is an
  // HTTP HEAD request, and HEAD responses can never carry a body by HTTP
  // spec — so on ANY failure, the SDK has no XML error body to parse and
  // synthesizes the same low-information shape regardless of the real
  // cause (confirmed via this module's own test suite: even a real,
  // server-sent NoSuchBucket 404 surfaces through HeadBucket as a
  // generic `name: NotFound, message: "UnknownError"`, indistinguishable
  // from a genuinely broken connection). checkBucketAccess() therefore
  // ALWAYS falls back to ListObjectsV2 (MaxKeys:1, Cloudflare's own
  // recommended bucket-access probe) on any HeadBucket failure — a GET,
  // which DOES carry a real, body-bearing S3 error on failure — and
  // trusts ONLY that classification, recording HeadBucket's own
  // (uninformative) result for visibility only.
  const bucketCheck = await attempt(() => checkBucketAccess(), R2_FAILURE_CODE.NETWORK_FAILED)
  if (!bucketCheck.ok) {
    return { ok: false, code: bucketCheck.code, config, stage: 'bucket-check', operation: 'HeadBucket', detail: bucketCheck.detail, steps: stepsReport('bucket-check') }
  }
  const bc = bucketCheck.result
  if (!bc.ok) {
    const classified = classifyR2Error({ name: bc.errorName, Code: bc.errorCode, message: bc.errorMessage, $metadata: { httpStatusCode: bc.httpStatus, requestId: bc.requestId } })
    // A bucket-check failure that classifyR2Error can't pin to anything
    // more specific than UNKNOWN is exactly the class this repair
    // targets — report it as BUCKET_CHECK_FAILED (a real, named code)
    // rather than the generic UNKNOWN one more time.
    const code = classified.failureCode === R2_FAILURE_CODE.UNKNOWN ? R2_FAILURE_CODE.BUCKET_CHECK_FAILED : classified.failureCode
    return {
      ok: false, code, config, stage: 'bucket-check', operation: bc.method,
      requestArgs: { bucket: bc.bucket, endpointHostname: bc.endpointHostname, region: bc.region, forcePathStyle: bc.forcePathStyle, resolvedRequestHostname: bc.resolvedRequestHostname },
      detail: { errorName: bc.errorName, errorCode: bc.errorCode, httpStatus: bc.httpStatus, requestId: bc.requestId, safeMessage: classified.safeMessage, headBucketFailure: bc.headBucketFailure ? { errorCode: bc.headBucketFailure.errorCode, httpStatus: bc.headBucketFailure.httpStatus } : undefined },
      steps: stepsReport('bucket-check'),
    }
  }
  stepOk('bucket-check')

  // 2. Minimal PutObject — Bucket/Key/Body/ContentType ONLY.
  const write = await attempt(
    () => putObjectMinimal({ key: diagnosticKey, buffer: payload, mimeType: 'text/plain' }),
    R2_FAILURE_CODE.PREFLIGHT_WRITE_FAILED
  )
  if (!write.ok) {
    return {
      ok: false, code: write.code, config, stage: 'write', operation: 'PutObject',
      requestArgs: { bucket: config.bucket, key: redactKey(diagnosticKey), contentType: 'text/plain', endpointHostname: config.endpointHostname, region: config.region },
      detail: write.detail,
      steps: stepsReport('write'),
    }
  }
  stepOk('write')

  // 3. HeadObject.
  const head = await attempt(() => headObject(diagnosticKey), R2_FAILURE_CODE.PREFLIGHT_READ_FAILED)
  if (!head.ok || !head.result) return { ok: false, code: head.ok ? R2_FAILURE_CODE.PREFLIGHT_READ_FAILED : head.code, config, stage: 'head', operation: 'HeadObject', detail: head.ok ? { safeMessage: 'HeadObject after PutObject returned no object.' } : head.detail, steps: stepsReport('head') }
  stepOk('head')

  // 4. GetObject — content-verified.
  const read = await attempt(() => readBuffer(diagnosticKey), R2_FAILURE_CODE.PREFLIGHT_READ_FAILED)
  if (!read.ok || !read.result || !Buffer.isBuffer(read.result) || !read.result.equals(payload)) {
    return { ok: false, code: read.ok ? R2_FAILURE_CODE.PREFLIGHT_READ_FAILED : read.code, config, stage: 'read', operation: 'GetObject', detail: read.ok ? { safeMessage: 'Read-back content did not match what was written.' } : read.detail, steps: stepsReport('read') }
  }
  stepOk('read')

  // 5. DeleteObject.
  const del = await attempt(() => remove(diagnosticKey), R2_FAILURE_CODE.PREFLIGHT_DELETE_FAILED)
  if (!del.ok) return { ok: false, code: del.code, config, stage: 'delete', operation: 'DeleteObject', detail: del.detail, steps: stepsReport('delete') }
  stepOk('delete')

  // 6. Confirm deletion.
  const confirmGone = await attempt(() => headObject(diagnosticKey), R2_FAILURE_CODE.PREFLIGHT_DELETE_FAILED)
  if (!confirmGone.ok) return { ok: false, code: confirmGone.code, config, stage: 'confirm-delete', operation: 'HeadObject', detail: confirmGone.detail, steps: stepsReport('confirm-delete') }
  if (confirmGone.result) return { ok: false, code: R2_FAILURE_CODE.PREFLIGHT_DELETE_FAILED, config, stage: 'confirm-delete', operation: 'HeadObject', detail: { safeMessage: 'Diagnostic object still present after delete.' }, steps: stepsReport('confirm-delete') }
  stepOk('confirm-delete')

  // 7. Metadata validation — a SEPARATE PutObject, only attempted after
  // every basic operation above has already succeeded, so a failure here
  // is unambiguously about metadata/cache-control compatibility, not a
  // fundamental connectivity/auth/bucket problem.
  const metaKey = `${adapter.providerInfo().keyPrefix}/diagnostics/r2-preflight/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-meta.txt`
  const metaWrite = await attempt(
    () => putObjectAtKey({ key: metaKey, buffer: payload, mimeType: 'text/plain', cacheControl: 'no-store', metadata: { preflight: 'true' } }),
    R2_FAILURE_CODE.PREFLIGHT_WRITE_FAILED
  )
  if (!metaWrite.ok) {
    return {
      ok: false, code: metaWrite.code, config, stage: 'metadata-write', operation: 'PutObject',
      requestArgs: { bucket: config.bucket, key: redactKey(metaKey), contentType: 'text/plain', cacheControl: 'no-store', metadataKeys: ['checksum', 'preflight'], endpointHostname: config.endpointHostname, region: config.region },
      detail: metaWrite.detail,
      steps: stepsReport('metadata-write'),
    }
  }
  // Best-effort cleanup — not a preflight-failure condition on its own,
  // the basic delete path above already proved DeleteObject works.
  await remove(metaKey).catch(() => {})
  stepOk('metadata-write')

  return { ok: true, config, stage: 'complete', steps: stepsReport(null) }
}

/** Reduces a diagnostic object key to its directory structure and extension, dropping the random/timestamp filename — nothing sensitive in these keys either way, just a safety-by-default habit. */
function redactKey(key) {
  const lastSlash = key.lastIndexOf('/')
  const dir = lastSlash >= 0 ? key.slice(0, lastSlash + 1) : ''
  const ext = key.includes('.') ? key.slice(key.lastIndexOf('.')) : ''
  return `${dir}[redacted]${ext}`
}
