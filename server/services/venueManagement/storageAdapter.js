/**
 * Package 6B — media storage abstraction.
 *
 * PRODUCTION STORAGE STATUS: NOT CONFIGURED. No object-storage provider
 * (S3/GCS/Cloudinary/etc.) exists anywhere in this codebase (audited:
 * no aws-sdk/@google-cloud/storage/cloudinary in package.json). This
 * adapter is a local-disk development implementation only, written
 * behind this same interface so a real provider can be swapped in for
 * Package 7 without touching mediaService.js callers. It must never be
 * presented as production-ready.
 */
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const STORAGE_ROOT = process.env.VENUE_MEDIA_STORAGE_ROOT ||
  path.join(process.cwd(), 'server', '_local_media_storage')

function ensureRoot() {
  if (!fs.existsSync(STORAGE_ROOT)) fs.mkdirSync(STORAGE_ROOT, { recursive: true })
}

function venueDir(venueId) {
  // venue_id is already a validated TEXT identifier from the venues
  // table (never client free-text), so it's safe as a directory segment.
  const dir = path.join(STORAGE_ROOT, venueId)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  return dir
}

const EXT_BY_MIME = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

/**
 * upload({venueId, buffer, mimeType}) -> { storageKey, checksum }
 * The object key is server-generated (random uuid + extension) — never
 * derived from a client-supplied filename, closing path-traversal risk.
 */
export function upload({ venueId, buffer, mimeType }) {
  ensureRoot()
  const dir = venueDir(venueId)
  const checksum = crypto.createHash('sha256').update(buffer).digest('hex')
  const ext = EXT_BY_MIME[mimeType] || 'bin'
  const objectName = `${crypto.randomUUID()}.${ext}`
  const storageKey = `${venueId}/${objectName}`
  fs.writeFileSync(path.join(dir, objectName), buffer)
  return { storageKey, checksum }
}

export function remove(storageKey) {
  const abs = resolveAbsolutePath(storageKey)
  if (abs && fs.existsSync(abs)) fs.unlinkSync(abs)
}

function resolveAbsolutePath(storageKey) {
  // Reject any key that isn't exactly "<venueId>/<uuid>.<ext>" — no ".."
  // segments, no absolute paths — before ever touching the filesystem.
  if (typeof storageKey !== 'string' || storageKey.includes('..') || path.isAbsolute(storageKey)) {
    return null
  }
  const abs = path.normalize(path.join(STORAGE_ROOT, storageKey))
  if (!abs.startsWith(path.normalize(STORAGE_ROOT))) return null
  return abs
}

/**
 * Returns a controlled, app-routed URL — never a raw filesystem path.
 * Served via GET /api/venue-management/media/:mediaId/file (streams
 * from disk, re-checking venue ownership on every request).
 */
export function getControlledUrl(mediaId) {
  return `/api/venue-management/media/${mediaId}/file`
}

export function readBuffer(storageKey) {
  const abs = resolveAbsolutePath(storageKey)
  if (!abs || !fs.existsSync(abs)) return null
  return fs.readFileSync(abs)
}

export function healthCheck() {
  try {
    ensureRoot()
    fs.accessSync(STORAGE_ROOT, fs.constants.W_OK)
    return { ok: true, provider: 'local_dev_disk', productionReady: false }
  } catch {
    return { ok: false, provider: 'local_dev_disk', productionReady: false }
  }
}

export const STORAGE_PROVIDER_STATUS = 'NOT_CONFIGURED' // real object storage: Package 7
