#!/usr/bin/env node
/**
 * Real, local proof that the Sharp-based image-resize pipeline produces
 * genuine differently-sized output files. Not a mock — runs Sharp
 * against a real repo image and writes real files to
 * public/proof/.../image-variants/.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { processImage } from '../server/services/venueManagement/imageResizePipeline.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public/proof/smokecraft-production-infrastructure-deployment/image-variants')
const SOURCE = path.join(ROOT, 'cigar-shape-size.png')

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })
  const buffer = fs.readFileSync(SOURCE)
  console.log(`Source: ${SOURCE} (${buffer.length} bytes)`)

  const result = await processImage(buffer, { focalPoint: { x: 0.5, y: 0.4 } })
  console.log(`Original: ${result.original.width}x${result.original.height} ${result.original.format}`)

  const report = { source: 'cigar-shape-size.png', original: result.original, variants: {}, failures: result.failures }

  for (const [name, v] of Object.entries(result.variants)) {
    const outPath = path.join(OUT_DIR, `${name}.${v.format}`)
    fs.writeFileSync(outPath, v.buffer)
    report.variants[name] = { width: v.width, height: v.height, format: v.format, size: v.size, checksum: v.checksum, file: `image-variants/${name}.${v.format}` }
    console.log(`  ${name.padEnd(16)} ${String(v.width).padStart(5)}x${String(v.height).padEnd(5)} ${v.format.padEnd(5)} ${v.size} bytes  sha256:${v.checksum.slice(0, 12)}`)
  }

  if (result.failures.length) {
    console.log('FAILURES:', result.failures)
  }

  fs.writeFileSync(
    path.join(OUT_DIR, '..', 'image-resize-pipeline-report.json'),
    JSON.stringify(report, null, 2)
  )

  const variantCount = Object.keys(result.variants).length
  const expectedCount = 9
  if (variantCount !== expectedCount || result.failures.length > 0) {
    console.error(`FAIL: expected ${expectedCount} variants with 0 failures, got ${variantCount} variants, ${result.failures.length} failures`)
    process.exit(1)
  }
  console.log(`\nPASS: ${variantCount}/${expectedCount} variants generated, 0 failures. Real files written to ${OUT_DIR}`)
}

main().catch(err => { console.error(err); process.exit(1) })
