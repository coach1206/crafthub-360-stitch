#!/usr/bin/env node
/**
 * GitHub-to-R2 sync command for SmokeCraft's authoritative asset registry
 * (Production Closure, Part 7). GitHub stays the source of truth and
 * rollback history; this only pushes ACTIVE_APPROVED registry entries to
 * the R2 production bucket via the existing S3-compatible adapter
 * (server/services/venueManagement/objectStorageAdapter.js — extended
 * this pass with headObject()/putObjectAtKey() for exactly this use,
 * nothing else in that file changed).
 *
 * Usage:
 *   node scripts/smokecraftAssetsSyncR2.mjs --dry-run
 *   node scripts/smokecraftAssetsSyncR2.mjs --upload-missing
 *   node scripts/smokecraftAssetsSyncR2.mjs --replace-changed
 *   node scripts/smokecraftAssetsSyncR2.mjs --verify-only
 *   node scripts/smokecraftAssetsSyncR2.mjs --report
 *
 * Reads public/proof/smokecraft-asset-registry/registry.json (generate
 * first via `node scripts/smokecraftAssetRegistry.mjs`). Only
 * classification === 'ACTIVE_APPROVED' entries are ever selected —
 * RETIRED/QA_ONLY/STATIC_MOCKUP_NOT_FOR_PRODUCTION/etc. are never
 * eligible, matching Part 5's exclusion requirement.
 *
 * --dry-run needs no live credentials (file existence + checksum
 * recompute + key generation only). Every other mode calls the real R2
 * adapter and will throw a clear "provider not activated" error if
 * STORAGE_PROVIDER/STORAGE_BUCKET/credentials aren't set — it will NOT
 * silently no-op and claim success.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import crypto from 'crypto'
import 'dotenv/config'

const REGISTRY_PATH = resolve('public/proof/smokecraft-asset-registry/registry.json')
const OUT_DIR = resolve('public/proof/smokecraft-asset-registry')
mkdirSync(OUT_DIR, { recursive: true })

const args = process.argv.slice(2)
const mode = args.find(a => a.startsWith('--')) || '--dry-run'

if (!existsSync(REGISTRY_PATH)) {
  console.error(`Registry not found at ${REGISTRY_PATH} — run \`node scripts/smokecraftAssetRegistry.mjs\` first.`)
  process.exit(1)
}

const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'))
const candidates = registry.filter(r => r.classification === 'ACTIVE_APPROVED')

console.log(`── SmokeCraft GitHub-to-R2 sync (${mode}) ──`)
console.log(`Registry entries: ${registry.length}. ACTIVE_APPROVED candidates: ${candidates.length}.\n`)

const results = { mode, generatedAt: new Date().toISOString(), scanned: candidates.length, missing: 0, uploaded: 0, skippedIdentical: 0, replaced: 0, failed: 0, verified: 0, entries: [] }

function contentType(filename) {
  if (filename.endsWith('.png')) return 'image/png'
  if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) return 'image/jpeg'
  if (filename.endsWith('.webp')) return 'image/webp'
  if (filename.endsWith('.svg')) return 'image/svg+xml'
  return 'application/octet-stream'
}

async function main() {
  let adapter = null
  let diagnostics = null
  if (mode !== '--dry-run') {
    adapter = await import('../server/services/venueManagement/objectStorageAdapter.js')
    diagnostics = await import('../server/services/venueManagement/r2Diagnostics.js')
    const info = adapter.providerInfo()
    console.log('Provider info:', info)
    if (!info.activated && mode !== '--report') {
      console.error(`\n✖ R2 not activated (STORAGE_PROVIDER/STORAGE_BUCKET/credentials missing or STORAGE_PROVIDER=local). Cannot run mode ${mode} against a live bucket. Re-run with --dry-run, or set real credentials.`)
      process.exit(1)
    }

    // Real R2 preflight before ANY bulk upload/replace — the exact gate
    // that would have caught the UnknownError root cause (an SDK/R2
    // checksum-protocol mismatch, see objectStorageAdapter.js) before it
    // burned through all 81 objects identically. --verify-only and
    // --report don't write, so they skip this gate.
    if (mode === '--upload-missing' || mode === '--replace-changed') {
      console.log('\n── R2 preflight (write/read/delete a tiny diagnostic object) ──')
      const preflight = await diagnostics.runR2Preflight()
      if (!preflight.ok) {
        console.error(`\n✖ R2 preflight FAILED at stage "${preflight.stage}"${preflight.operation ? ` (operation: ${preflight.operation})` : ''} — aborting before any bulk upload.`)
        console.error(`  Code: ${preflight.code}`)
        if (preflight.requestArgs) console.error(`  Request args (safe): ${JSON.stringify(preflight.requestArgs, null, 2)}`)
        console.error(`  Detail: ${JSON.stringify(preflight.detail, null, 2)}`)
        console.error(`  Safe config: ${JSON.stringify(preflight.config, null, 2)}`)
        process.exit(1)
      }
      console.log('  OK — preflight write/HEAD/read/delete/confirm-delete all succeeded. Proceeding with bulk sync.\n')
    }
  }

  for (const entry of candidates) {
    const filePath = resolve(entry.repositoryPath)
    if (!existsSync(filePath)) {
      results.missing++
      results.entries.push({ assetId: entry.assetId, status: 'MISSING_FILE', repositoryPath: entry.repositoryPath })
      console.log(`  MISSING  ${entry.assetId} — ${entry.repositoryPath} does not exist on disk`)
      continue
    }
    const buffer = readFileSync(filePath)
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex')
    const checksumMatchesRegistry = checksum === entry.checksum
    const objectKey = entry.r2ObjectKey || `production/smokecraft/image/${entry.assetId}/v${entry.version}/${checksum.slice(0, 12)}-${entry.filename}`

    if (mode === '--dry-run' || mode === '--report') {
      results.entries.push({ assetId: entry.assetId, status: 'CANDIDATE', repositoryPath: entry.repositoryPath, checksum, checksumMatchesRegistry, objectKey })
      console.log(`  ${checksumMatchesRegistry ? 'OK' : 'CHECKSUM-DRIFT'}  ${entry.assetId} -> ${objectKey}`)
      continue
    }

    if (mode === '--verify-only') {
      const head = await adapter.headObject(objectKey)
      const ok = !!head
      results.verified += ok ? 1 : 0
      results.entries.push({ assetId: entry.assetId, status: ok ? 'VERIFIED' : 'R2_OBJECT_MISSING', objectKey })
      console.log(`  ${ok ? 'VERIFIED' : 'MISSING-IN-R2'}  ${entry.assetId} -> ${objectKey}`)
      continue
    }

    // --upload-missing / --replace-changed
    try {
      const existing = await adapter.headObject(objectKey)
      if (existing) {
        if (mode === '--upload-missing') {
          results.skippedIdentical++
          results.entries.push({ assetId: entry.assetId, status: 'SKIPPED_IDENTICAL', objectKey })
          console.log(`  SKIP     ${entry.assetId} — already present at ${objectKey}`)
          continue
        }
        // --replace-changed: only replace if checksum actually differs from what R2 has (metadata.checksum)
        if (existing.metadata?.checksum === checksum) {
          results.skippedIdentical++
          results.entries.push({ assetId: entry.assetId, status: 'SKIPPED_IDENTICAL', objectKey })
          console.log(`  SKIP     ${entry.assetId} — R2 object checksum already matches`)
          continue
        }
      }
      const put = await adapter.putObjectAtKey({ key: objectKey, buffer, mimeType: contentType(entry.filename), cacheControl: entry.r2CacheControl, metadata: { assetId: entry.assetId, sourceGitCommitSha: entry.gitCommitSha } })
      const verifyHead = await adapter.headObject(objectKey)
      if (!verifyHead) throw new Error('post-upload HEAD verification failed — object not found immediately after PUT')
      results[existing ? 'replaced' : 'uploaded']++
      results.verified++
      results.entries.push({ assetId: entry.assetId, status: existing ? 'REPLACED' : 'UPLOADED', objectKey, etag: put.etag, checksum })
      console.log(`  ${existing ? 'REPLACED' : 'UPLOADED'} ${entry.assetId} -> ${objectKey} (etag ${put.etag})`)
    } catch (err) {
      results.failed++
      // Real classification, not err.message alone — err.message is
      // exactly what was collapsing every one of the 81 failures into
      // the same useless "UnknownError" string. Capture everything the
      // SDK actually exposes (error name/code, HTTP status, request ID,
      // retryable) without ever printing a credential or signed request.
      const classified = diagnostics.classifyR2Error(err)
      results.entries.push({
        assetId: entry.assetId, status: 'FAILED', objectKey,
        failureCode: classified.failureCode,
        safeMessage: classified.safeMessage,
        errorName: classified.errorName,
        errorCode: classified.errorCode,
        httpStatus: classified.httpStatus,
        requestId: classified.requestId,
        retryable: classified.retryable,
      })
      console.log(`  FAILED   ${entry.assetId} — [${classified.failureCode}] ${classified.safeMessage} (name=${classified.errorName} code=${classified.errorCode} httpStatus=${classified.httpStatus} requestId=${classified.requestId} retryable=${classified.retryable})`)
    }
  }

  writeFileSync(resolve(OUT_DIR, 'sync-report.json'), JSON.stringify(results, null, 2))
  console.log(`\nScanned: ${results.scanned}  Missing: ${results.missing}  Uploaded: ${results.uploaded}  Replaced: ${results.replaced}  Skipped-identical: ${results.skippedIdentical}  Verified: ${results.verified}  Failed: ${results.failed}`)
  console.log(`Report: public/proof/smokecraft-asset-registry/sync-report.json`)
  if (results.failed > 0) process.exit(1)
}

main().catch(e => { console.error(e); process.exit(1) })
