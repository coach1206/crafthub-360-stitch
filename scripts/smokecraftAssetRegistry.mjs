#!/usr/bin/env node
/**
 * Authoritative asset registry generator for SmokeCraft (Production
 * Closure, Part 6) — machine-readable JSON, distinct from and
 * complementary to the pre-existing scripts/smokecraftAssetInventory.mjs
 * (which generates a human-readable markdown report; this reuses its
 * exact same source-of-truth definition of "actively used" — real
 * cross-reference against src/constants/smokecraftAssets.js's SC_ASSETS
 * map, not a directory-name guess — but outputs the structured registry
 * scripts/smokecraftAssetsSyncR2.mjs needs to run against).
 *
 * Run: node scripts/smokecraftAssetRegistry.mjs
 * Writes: public/proof/smokecraft-asset-registry/registry.json
 *         public/proof/smokecraft-asset-registry/inventory-report.json
 */
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { resolve, relative, extname } from 'path'
import crypto from 'crypto'
import { execSync } from 'child_process'

const ROOT = resolve('.')
const OUT_DIR = resolve('public/proof/smokecraft-asset-registry')
mkdirSync(OUT_DIR, { recursive: true })

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp'])
const SCAN_ROOTS = ['public/assets/smokecraft', 'public/assets/smokecraft-reference']

function classifyByPath(relPath) {
  const p = relPath.toLowerCase()
  if (p.includes('/proof/') || p.includes('browser-proof')) return 'QA_ONLY'
  if (p.includes('smokecraft-reference/rejected')) return 'RETIRED'
  if (p.includes('smokecraft-reference/approved')) return 'APPROVED_SUPPORTING'
  if (p.includes('/incoming-batch') || p.includes('-public-candidates')) return 'REPLACE_WITH_CURRENT'
  if (p.includes('/optimized/') || p.includes('/cropped/')) return 'APPROVED_SUPPORTING'
  if (p.includes('/source/')) return 'ARCHIVE'
  if (p.includes('session-visuals')) return 'APPROVED_SUPPORTING'
  if (/mockup|placeholder|draft|screenshot|sample|\btest\b|\bdemo\b/.test(p)) return 'STATIC_MOCKUP_NOT_FOR_PRODUCTION'
  if (/legacy|deprecated|\bold\b|backup|\bcopy\b/.test(p)) return 'RETIRED'
  return 'APPROVED_SUPPORTING'
}

function walk(dir, out) {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    const full = resolve(dir, entry)
    const st = statSync(full)
    if (st.isDirectory()) { walk(full, out); continue }
    if (!IMAGE_EXT.has(extname(entry).toLowerCase())) continue
    out.push(full)
  }
}

let commitSha = 'unknown'
try { commitSha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim() } catch {}

// Real production-reference map — the same source of truth
// smokecraftAssetInventory.mjs cross-references against.
const { SC_ASSETS } = await import('../src/constants/smokecraftAssets.js')
// Every SC_ASSETS value is a repo-relative public/ path (e.g. either
// '/assets/smokecraft/x.png' under the scanned roots below, OR a root-
// level path like '/smokecraft-visit-complete.png' — confirmed: the
// 'visitComplete' entry lives directly at public/, outside both
// SCAN_ROOTS, which a prior version of this script mis-scanned as a
// "broken reference" when it was really a scan-scope gap, not a missing
// file). Resolve generically as 'public' + the decoded path, not just the
// '/assets/' prefix, so every real reference is found regardless of which
// directory it lives in.
const usageByPath = new Map()
for (const [key, val] of Object.entries(SC_ASSETS)) {
  if (typeof val !== 'string') continue
  const decoded = decodeURIComponent(val.split('?')[0])
  const rel = 'public' + decoded
  if (!usageByPath.has(rel)) usageByPath.set(rel, [])
  usageByPath.get(rel).push(key)
}

const allFiles = []
for (const root of SCAN_ROOTS) walk(resolve(root), allFiles)
// Union in every real SC_ASSETS-referenced file even if it lives outside
// the directory roots above (e.g. public/ root-level files).
for (const rel of usageByPath.keys()) {
  const full = resolve(rel)
  if (existsSync(full) && !allFiles.includes(full)) allFiles.push(full)
}

const registry = []
const inventoryCounts = {}
const checksumIndex = {}

for (const full of allFiles) {
  const relPath = relative(ROOT, full)
  const usedByKeys = usageByPath.get(relPath) || []
  const isReferenced = usedByKeys.length > 0
  const status = isReferenced ? 'ACTIVE_APPROVED' : classifyByPath(relPath)
  inventoryCounts[status] = (inventoryCounts[status] || 0) + 1

  const buffer = readFileSync(full)
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex')
  if (!checksumIndex[checksum]) checksumIndex[checksum] = []
  checksumIndex[checksum].push(relPath)

  const assetId = isReferenced ? `sc-${usedByKeys[0]}` : `sc-file-${checksum.slice(0, 12)}`
  const filename = relPath.split('/').pop()

  registry.push({
    assetId,
    sourceType: 'github-r2',
    repositoryPath: relPath,
    filename,
    gitCommitSha: commitSha,
    checksum,
    hashAlgorithm: 'sha256',
    assetType: 'image',
    routeUsage: usedByKeys,
    componentUsage: [],
    aspectRatio: null, width: null, height: null,
    cropMode: 'contain',
    focalPoint: 'center',
    altText: null,
    approved: status === 'ACTIVE_APPROVED' || status === 'APPROVED_SUPPORTING',
    active: status === 'ACTIVE_APPROVED',
    retired: status === 'RETIRED',
    replacementAssetId: null,
    version: 1,
    r2Bucket: null,
    r2ObjectKey: status === 'ACTIVE_APPROVED' ? `production/smokecraft/image/${assetId}/v1/${checksum.slice(0, 12)}-${filename}` : null,
    r2ETag: null,
    r2VersionId: null,
    r2ContentType: null,
    r2CacheControl: status === 'ACTIVE_APPROVED' ? 'public, max-age=31536000, immutable' : null,
    r2LastSynchronizedAt: null,
    synchronizationStatus: 'not-synchronized',
    synchronizationErrorCode: null,
    fallbackPolicy: 'branded-missing-media',
    classification: status,
  })
}

const duplicateGroups = Object.entries(checksumIndex).filter(([, files]) => files.length > 1)

writeFileSync(resolve(OUT_DIR, 'registry.json'), JSON.stringify(registry, null, 2))

const report = {
  generatedAt: new Date().toISOString(),
  gitCommitSha: commitSha,
  scAssetsMapEntries: Object.keys(SC_ASSETS).length,
  filesScanned: allFiles.length,
  scanRoots: SCAN_ROOTS,
  classificationCounts: inventoryCounts,
  duplicateChecksumGroups: duplicateGroups.length,
  unreferencedScAssetMapEntries: Object.entries(SC_ASSETS)
    .filter(([, val]) => typeof val === 'string')
    .filter(([, val]) => {
      const decoded = 'public' + decodeURIComponent(val.split('?')[0])
      return !allFiles.some(f => relative(ROOT, f) === decoded)
    })
    .map(([key]) => key),
}
writeFileSync(resolve(OUT_DIR, 'inventory-report.json'), JSON.stringify(report, null, 2))

console.log(`Scanned ${allFiles.length} image files. SC_ASSETS map entries: ${report.scAssetsMapEntries}.`)
console.log('Classification counts:', inventoryCounts)
console.log(`Duplicate-checksum groups: ${duplicateGroups.length}`)
if (report.unreferencedScAssetMapEntries.length) console.log(`⚠ Broken SC_ASSETS references (no file on disk): ${report.unreferencedScAssetMapEntries.join(', ')}`)
console.log(`\nRegistry: public/proof/smokecraft-asset-registry/registry.json (${registry.length} entries)`)
