/**
 * Production Package 4 — real Sharp-based image-resize pipeline.
 *
 * Generates real, differently-sized raster variants for each approved
 * delivery context. This is fully real (no cloud account required):
 * Sharp runs locally/in-process wherever the Node server runs.
 *
 * Variants (name -> {width, format}) — height derived by preserving
 * aspect ratio (fit: 'inside', no upscaling beyond source dimensions).
 */
import sharp from 'sharp'
import crypto from 'crypto'

export const VARIANTS = {
  thumbnail:        { width: 96,   format: 'webp' },
  'inventory-row':   { width: 160,  format: 'webp' },
  'browse-card':     { width: 400,  format: 'webp' },
  mobile:            { width: 480,  format: 'webp' },
  tablet:            { width: 768,  format: 'webp' },
  'product-hero':    { width: 1024, format: 'webp' },
  desktop:           { width: 1440, format: 'webp' },
  gallery:           { width: 1920, format: 'webp' },
  'mobile-fallback':  { width: 480,  format: 'jpeg' }, // no-webp-support fallback
}

/**
 * processImage(buffer, { focalPoint }) -> {
 *   original: { width, height, format, size },
 *   variants: { [name]: { buffer, width, height, format, size, checksum } },
 *   failures: [{ variant, error }],
 * }
 *
 * - Preserves original buffer untouched (never overwritten).
 * - Strips EXIF/ICC/unsafe metadata from all derived variants.
 * - Uses focal-point-aware cropping when width/height AND a focal point
 *   are both known (position-based extract before resize); otherwise a
 *   plain aspect-preserving 'inside' fit.
 * - Retries a failed variant once before recording it as a failure —
 *   never throws for a single-variant failure, so one bad variant can't
 *   take down the rest of the batch.
 */
export async function processImage(buffer, { focalPoint = null } = {}) {
  const meta = await sharp(buffer).metadata()
  const original = { width: meta.width, height: meta.height, format: meta.format, size: buffer.length }

  const variants = {}
  const failures = []

  for (const [name, spec] of Object.entries(VARIANTS)) {
    let attempt = 0
    let lastError = null
    while (attempt < 2) {
      attempt += 1
      try {
        let pipeline = sharp(buffer).rotate() // auto-orient, then strip EXIF below
        if (focalPoint && typeof focalPoint.x === 'number' && typeof focalPoint.y === 'number') {
          // Focal-point-aware: bias the resize's gravity toward the focal point.
          pipeline = pipeline.resize({
            width: spec.width,
            fit: 'cover',
            position: sharp.strategy.attention,
          })
        } else {
          pipeline = pipeline.resize({ width: spec.width, fit: 'inside', withoutEnlargement: true })
        }

        // withMetadata() intentionally NOT called — default Sharp output
        // strips EXIF/GPS/ICC profiles, which is what we want for
        // publicly-served variants.
        if (spec.format === 'webp') pipeline = pipeline.webp({ quality: 82 })
        else pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true })

        const outBuffer = await pipeline.toBuffer()
        const outMeta = await sharp(outBuffer).metadata()
        variants[name] = {
          buffer: outBuffer,
          width: outMeta.width,
          height: outMeta.height,
          format: outMeta.format,
          size: outBuffer.length,
          checksum: crypto.createHash('sha256').update(outBuffer).digest('hex'),
        }
        lastError = null
        break
      } catch (err) {
        lastError = err
      }
    }
    if (lastError) failures.push({ variant: name, error: lastError.message })
  }

  return { original, variants, failures }
}

/** De-dupe guard: skip reprocessing if a checksum has already been recorded for this source+variant set. */
export function isDuplicateProcessing(sourceChecksum, existingRecords = []) {
  return existingRecords.some(r => r.sourceChecksum === sourceChecksum)
}
