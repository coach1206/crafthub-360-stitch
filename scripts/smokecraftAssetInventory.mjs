#!/usr/bin/env node
// SmokeCraft System Audit — Prompt 1, Part 5.
// Inventories every image under the SmokeCraft asset directories on disk,
// cross-referenced against SC_ASSETS usage, real dimensions, and hash —
// computed directly, not hand-transcribed.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { createHash } from 'node:crypto'
import path from 'node:path'

const { SC_ASSETS } = await import('../src/constants/smokecraftAssets.js')

const DIRS = [
  'public/assets/smokecraft',
  'public/assets/smokecraft-reference',
]
const IMG_RE = /\.(png|jpe?g|webp)$/i

function walk(dir, out = []) {
  let entries
  try { entries = readdirSync(dir, { withFileTypes: true }) } catch { return out }
  for (const e of entries) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (IMG_RE.test(e.name)) out.push(p)
  }
  return out
}

const files = DIRS.flatMap(d => walk(d))

// Reverse-map SC_ASSETS values (decoded, without ?v= query) -> keys that use them.
// Generic 'public' + path (not just the '/assets/' prefix) so a root-level
// reference like visitComplete's '/smokecraft-visit-complete.png' resolves
// correctly instead of silently falling outside every walked DIRS root and
// misreporting as unused/missing (confirmed real bug, not a missing file).
const usageByPath = new Map()
for (const [key, val] of Object.entries(SC_ASSETS)) {
  if (typeof val !== 'string') continue
  const decoded = decodeURIComponent(val.split('?')[0])
  const rel = 'public' + decoded
  if (!usageByPath.has(rel)) usageByPath.set(rel, [])
  usageByPath.get(rel).push(key)
}
// Union in any SC_ASSETS-referenced file that lives outside DIRS entirely.
for (const rel of usageByPath.keys()) {
  if (existsSync(rel) && !files.includes(rel)) files.push(rel)
}

function dims(buf) {
  // Minimal PNG/JPEG dimension sniff (no dependency).
  if (buf.length > 24 && buf.toString('latin1', 1, 4) === 'PNG') {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i < buf.length) {
      if (buf[i] !== 0xff) { i++; continue }
      const marker = buf[i + 1]
      if (marker >= 0xc0 && marker <= 0xc3) {
        const h = buf.readUInt16BE(i + 5)
        const w = buf.readUInt16BE(i + 7)
        return { w, h }
      }
      const len = buf.readUInt16BE(i + 2)
      i += 2 + len
    }
  }
  return { w: null, h: null }
}

const byHash = new Map()
const rows = files.map(f => {
  const buf = readFileSync(f)
  const hash = createHash('sha256').update(buf).digest('hex')
  const { w, h } = dims(buf)
  const orientation = w && h ? (w >= h ? 'landscape' : 'portrait') : 'unknown'
  const usedBy = usageByPath.get(f) || []
  if (!byHash.has(hash)) byHash.set(hash, [])
  byHash.get(hash).push(f)
  return { file: f, size: statSync(f).size, w, h, orientation, hash: hash.slice(0, 12), usedBy }
})

const duplicateGroups = [...byHash.entries()].filter(([, fs]) => fs.length > 1)

const activeUsed = rows.filter(r => r.usedBy.length > 0)
const activePortrait = activeUsed.filter(r => r.orientation === 'portrait')
const unused = rows.filter(r => r.usedBy.length === 0)

const out = [
  '# SmokeCraft Asset Inventory (Prompt 1 — programmatically generated)',
  '',
  'Every image file under `public/assets/smokecraft/` and `public/assets/smokecraft-reference/`, '
  + 'with dimensions and SHA-256 hash computed directly from the file on disk, cross-referenced '
  + `against every \`SC_ASSETS\` key that references it. Generated at commit \`d6469504a2a83ab4acfb27e89a25064d505d4d55\`.`,
  '',
  `**Total image files found: ${rows.length}**`,
  `**Files actively referenced by an SC_ASSETS key: ${activeUsed.length}**`,
  `**Files not referenced by any SC_ASSETS key (candidates for legacy/quarantine review): ${unused.length}**`,
  `**Actively-used PORTRAIT assets (candidates for "TABLET ASSET REPAIR REQUIRED"): ${activePortrait.length}**`,
  `**Duplicate-hash groups (identical bytes under different filenames): ${duplicateGroups.length}**`,
  '',
  '## Actively-used assets',
  '',
  '| File | SC_ASSETS key(s) | Width | Height | Orientation | Hash (12) | Size (bytes) |',
  '|---|---|---|---|---|---|---|',
  ...activeUsed.map(r => `| \`${r.file}\` | ${r.usedBy.join(', ')} | ${r.w ?? '?'} | ${r.h ?? '?'} | ${r.orientation}${r.orientation === 'portrait' ? ' — **TABLET ASSET REPAIR REQUIRED**' : ''} | ${r.hash} | ${r.size} |`),
  '',
  '## Duplicate-hash groups (identical file content under different names)',
  '',
  duplicateGroups.length
    ? duplicateGroups.map(([h, fs]) => `- \`${h.slice(0, 12)}\`: ${fs.map(f => `\`${f}\``).join(', ')}`).join('\n')
    : '(none found)',
  '',
  '## Unreferenced files (not used by any SC_ASSETS key — review before quarantine, do not delete blindly)',
  '',
  unused.length
    ? unused.map(r => `- \`${r.file}\` (${r.w ?? '?'}x${r.h ?? '?'}, ${r.orientation})`).join('\n')
    : '(none)',
  '',
]

writeFileSync('docs/smokecraft/SMOKECRAFT_ASSET_INVENTORY.md', out.join('\n'))
console.log(JSON.stringify({
  totalFiles: rows.length,
  activeUsed: activeUsed.length,
  unused: unused.length,
  activePortrait: activePortrait.length,
  duplicateGroups: duplicateGroups.length,
}, null, 2))
