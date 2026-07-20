/**
 * Package 6B — manual image validation. No image-processing library exists
 * in this repo (audited: no sharp/multer/file-type in package.json or
 * node_modules), so MIME is sniffed from magic bytes and dimensions parsed
 * directly from PNG/JPEG headers rather than trusting the client-supplied
 * content-type/filename.
 */

const MAX_BYTES = 5 * 1024 * 1024 // 5MB
const MIN_DIMENSION = 32
const MAX_DIMENSION = 6000
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp'])

export function sniffMimeFromBuffer(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return 'image/png'
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg'
  }
  if (buf.length >= 12 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp'
  }
  // Deliberately no SVG/HTML/executable recognition — those are rejected
  // by falling through to null (unrecognized => rejected), never allowed.
  return null
}

function readPngDimensions(buf) {
  // IHDR chunk starts at byte 16: width(4) height(4), big-endian.
  if (buf.length < 24) return null
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

function readJpegDimensions(buf) {
  let offset = 2
  while (offset < buf.length - 9) {
    if (buf[offset] !== 0xff) { offset++; continue }
    const marker = buf[offset + 1]
    // SOF0..SOF3 / SOF5..SOF7 / SOF9..SOF11 / SOF13..SOF15 carry dimensions.
    if ((marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
        (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf)) {
      const height = buf.readUInt16BE(offset + 5)
      const width = buf.readUInt16BE(offset + 7)
      return { width, height }
    }
    const segmentLength = buf.readUInt16BE(offset + 2)
    offset += 2 + segmentLength
  }
  return null
}

function readWebpDimensions(buf) {
  // VP8 (lossy) simple header case; VP8L/VP8X not parsed — treated as
  // "dimensions unknown" and rejected rather than guessed.
  if (buf.length < 30) return null
  const chunkId = buf.toString('ascii', 12, 16)
  if (chunkId === 'VP8 ' && buf[23] === 0x9d && buf[24] === 0x01) {
    const width = buf.readUInt16LE(26) & 0x3fff
    const height = buf.readUInt16LE(28) & 0x3fff
    return { width, height }
  }
  return null
}

/**
 * Validates a raw upload buffer against MIME allowlist, size, and
 * dimension bounds. Returns { ok, mimeType, width, height, error }.
 */
export function validateImageBuffer(buf) {
  if (!Buffer.isBuffer(buf) || buf.length === 0) {
    return { ok: false, error: 'empty_file' }
  }
  if (buf.length > MAX_BYTES) {
    return { ok: false, error: 'file_too_large' }
  }
  const mimeType = sniffMimeFromBuffer(buf)
  if (!mimeType || !ALLOWED_MIME.has(mimeType)) {
    return { ok: false, error: 'unsupported_mime_type' }
  }
  let dims = null
  if (mimeType === 'image/png') dims = readPngDimensions(buf)
  else if (mimeType === 'image/jpeg') dims = readJpegDimensions(buf)
  else if (mimeType === 'image/webp') dims = readWebpDimensions(buf)

  if (!dims || !dims.width || !dims.height) {
    return { ok: false, error: 'unreadable_dimensions' }
  }
  if (dims.width < MIN_DIMENSION || dims.height < MIN_DIMENSION ||
      dims.width > MAX_DIMENSION || dims.height > MAX_DIMENSION) {
    return { ok: false, error: 'invalid_dimensions' }
  }
  return { ok: true, mimeType, width: dims.width, height: dims.height }
}

export function normalizeFilename(original) {
  const base = String(original || 'upload').split(/[/\\]/).pop() // strip any path/traversal
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
  return cleaned || 'upload'
}

export const LIMITS = { MAX_BYTES, MIN_DIMENSION, MAX_DIMENSION, ALLOWED_MIME }
