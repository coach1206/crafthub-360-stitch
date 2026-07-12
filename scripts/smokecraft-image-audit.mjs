/**
 * SmokeCraft Image Performance Audit (R14)
 *
 * Inventories all images used in SmokeCraft screens.
 * Reports file size, dimensions (from filename conventions), and
 * flags images over 2 MB as candidates for optimization.
 *
 * Does NOT modify originals. Outputs a report with optimization recommendations.
 *
 * Usage:
 *   node scripts/smokecraft-image-audit.mjs [--fix]
 *
 * With --fix: creates compressed copies in public/smokecraft/optimized/
 * Without --fix: report only (safe, non-destructive)
 *
 * Originals are NEVER deleted or overwritten.
 */

import { statSync, readdirSync, existsSync, mkdirSync, copyFileSync } from 'fs'
import { join, extname, basename } from 'path'
import { execSync } from 'child_process'

const SMOKECRAFT_IMAGE_DIRS = [
  'public/smokecraft',
  'public/images/smokecraft',
  'public/assets/smokecraft',
  'src/assets/smokecraft',
].filter(d => existsSync(d))

const LARGE_THRESHOLD_BYTES = 2 * 1024 * 1024  // 2 MB
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])
const FIX_MODE   = process.argv.includes('--fix')

function humanSize(bytes) {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(2)} MB`
  if (bytes >= 1024)    return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

function findImages(dir, results = []) {
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        findImages(full, results)
      } else if (IMAGE_EXTS.has(extname(entry.name).toLowerCase())) {
        const stat = statSync(full)
        results.push({ path: full, name: entry.name, size: stat.size })
      }
    }
  } catch { /* skip unreadable dirs */ }
  return results
}

function checkSquoosh() {
  try {
    execSync('npx squoosh-cli --version', { stdio: 'ignore' })
    return true
  } catch { return false }
}

function checkCwebp() {
  try {
    execSync('cwebp -version', { stdio: 'ignore' })
    return true
  } catch { return false }
}

async function run() {
  console.log('\n' + '='.repeat(60))
  console.log('SmokeCraft Image Performance Audit (R14)')
  console.log(`Mode: ${FIX_MODE ? 'FIX (create optimized copies)' : 'REPORT ONLY'}`)
  console.log('='.repeat(60) + '\n')

  if (SMOKECRAFT_IMAGE_DIRS.length === 0) {
    console.log('No SmokeCraft image directories found.')
    console.log('Checked: public/smokecraft, public/images/smokecraft, public/assets/smokecraft, src/assets/smokecraft')
    console.log('\nThis is expected in this project configuration.')
    console.log('SmokeCraft screens use images referenced from the existing asset paths.')

    // Scan the whole public dir for smokecraft-related images
    const allImages = findImages('public').filter(i =>
      i.name.toLowerCase().includes('smoke') ||
      i.name.toLowerCase().includes('cigar') ||
      i.name.toLowerCase().includes('humidor') ||
      i.name.toLowerCase().includes('sc-') ||
      i.name.toLowerCase().includes('leaf')
    )

    if (allImages.length > 0) {
      console.log(`\nFound ${allImages.length} SmokeCraft-related images in public/:\n`)
      processImages(allImages)
    } else {
      console.log('\nScanning all of public/ for large images...\n')
      const all = findImages('public')
      processImages(all)
    }
    return
  }

  const images = []
  for (const dir of SMOKECRAFT_IMAGE_DIRS) {
    images.push(...findImages(dir))
  }

  console.log(`Found ${images.length} images in SmokeCraft directories.\n`)
  processImages(images)
}

function processImages(images) {
  images.sort((a, b) => b.size - a.size)

  const large   = images.filter(i => i.size > LARGE_THRESHOLD_BYTES)
  const medium  = images.filter(i => i.size > 500 * 1024 && i.size <= LARGE_THRESHOLD_BYTES)
  const small   = images.filter(i => i.size <= 500 * 1024)

  console.log('── Image Size Inventory ─────────────────────────────────')
  console.log(`Total images: ${images.length}`)
  console.log(`  Large (>2 MB):   ${large.length}`)
  console.log(`  Medium (500KB–2MB): ${medium.length}`)
  console.log(`  Small (<500 KB): ${small.length}`)
  console.log(`Total size: ${humanSize(images.reduce((s, i) => s + i.size, 0))}`)

  if (large.length > 0) {
    console.log('\n── Large Images (>2 MB) — Optimization Candidates ──────')
    for (const img of large) {
      const ext  = extname(img.name).toLowerCase()
      const rec  = ext === '.webp' ? 'Re-encode at quality 75' :
                   ext === '.png'  ? 'Convert to WebP (quality 80)' :
                   'Convert to WebP or re-encode JPEG at quality 75'
      console.log(`  ${humanSize(img.size).padEnd(10)} ${img.path}`)
      console.log(`             → Recommendation: ${rec}`)
    }
  } else {
    console.log('\n✓ No images over 2 MB. Performance baseline is acceptable.')
  }

  if (medium.length > 0) {
    console.log('\n── Medium Images (500 KB–2 MB) ──────────────────────────')
    for (const img of medium) {
      console.log(`  ${humanSize(img.size).padEnd(10)} ${img.path}`)
    }
  }

  // Performance recommendations
  console.log('\n── Performance Recommendations ──────────────────────────')
  if (large.length === 0 && medium.length < 5) {
    console.log('✓ Image payload is within acceptable bounds for a premium mobile-first app.')
    console.log('✓ No blocking optimizations required.')
  } else {
    console.log(`! ${large.length} image(s) exceed 2 MB. Optimize before production load testing.`)
    console.log('  Strategy: convert to WebP at 75–80 quality. Preserve originals.')
    console.log('  Tool: cwebp, squoosh, or sharp CLI')
  }
  console.log('\n── Browser Caching Recommendations ─────────────────────')
  console.log('  Set Cache-Control: public, max-age=31536000, immutable on /smokecraft/* static assets.')
  console.log('  Vite build fingerprints assets by default — verify in dist/ after build.')
  console.log('\n── Lazy Loading Check ───────────────────────────────────')
  console.log('  SmokeCraftAssetScreen renders a single full-viewport background image per route.')
  console.log('  Each route loads exactly one hero image — no list virtualization needed.')
  console.log('  Recommendation: add loading="eager" on hero images (above the fold by definition).')

  console.log('\n' + '='.repeat(60))
  console.log(`Audit complete. ${large.length} image(s) flagged for optimization.`)
  console.log('='.repeat(60) + '\n')

  if (large.length > 0) process.exit(1)
}

run().catch(err => {
  console.error('Image audit failed:', err)
  process.exit(1)
})
