#!/usr/bin/env node
// Builds the master repaired-review contact sheets + bird's-eye index.
import sharp from 'sharp'
import { readFileSync, readdirSync, writeFileSync } from 'fs'

const DIR = 'public/proof/smokecraft-solution-final-audit'
const manifest = JSON.parse(readFileSync(`${DIR}/sequence-manifest.json`, 'utf8'))
const flagsByN = JSON.parse(readFileSync(`${DIR}/flags-by-n.json`, 'utf8'))

const THUMB_W = 400
const THUMB_H = 250
const LABEL_H = 66
const PAD = 8
const COLS = 3
const PER_SHEET = 9

function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;') }

async function buildSheet(entries, sheetIndex, totalSheets) {
  const rows = Math.ceil(entries.length / COLS)
  const cellW = THUMB_W + PAD * 2
  const cellH = THUMB_H + LABEL_H + PAD * 2
  const width = cellW * COLS
  const height = cellH * rows + 60

  const composites = []
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = col * cellW + PAD
    const y = row * cellH + PAD + 60

    const thumbBuf = await sharp(`${DIR}/${entry.filename}`)
      .resize(THUMB_W, THUMB_H, { fit: 'cover', position: 'top' })
      .toBuffer()
    composites.push({ input: thumbBuf, left: x, top: y })

    const f = flagsByN[entry.n] || {}
    const statusColor = f.ownerStatus === 'OWNER_STANDARD_PASS' ? '#7bd88f' : f.ownerStatus === 'OWNER_STANDARD_FAIL' ? '#ff8f8f' : '#E9C176'
    const line1 = `#${String(entry.n).padStart(3, '0')}  PHASE ${entry.phase ?? '-'}  SESSION ${entry.session ?? '-'}`
    const line2 = `${entry.name}${entry.state ? ' (' + entry.state + ')' : ''}`.slice(0, 48)
    const line3 = entry.route
    const line4 = `${f.liveClass || '?'} — ${f.ownerStatus || 'UNCLASSIFIED'}`
    const labelSvg = `<svg width="${THUMB_W}" height="${LABEL_H}">
      <rect width="100%" height="100%" fill="#0b0d14"/>
      <text x="4" y="14" font-family="monospace" font-size="12" fill="#E9C176">${esc(line1)}</text>
      <text x="4" y="28" font-family="monospace" font-size="11" fill="#e5e2e1">${esc(line2)}</text>
      <text x="4" y="41" font-family="monospace" font-size="10" fill="rgba(229,226,225,0.55)">${esc(line3)}</text>
      <text x="4" y="58" font-family="monospace" font-size="12" font-weight="bold" fill="${statusColor}">${esc(line4)}</text>
    </svg>`
    composites.push({ input: Buffer.from(labelSvg), left: x, top: y + THUMB_H })

    const borderSvg = `<svg width="${THUMB_W+4}" height="${THUMB_H+LABEL_H+4}">
      <rect x="1" y="1" width="${THUMB_W+2}" height="${THUMB_H+LABEL_H+2}" fill="none" stroke="rgba(233,193,118,0.45)" stroke-width="2"/>
    </svg>`
    composites.push({ input: Buffer.from(borderSvg), left: x - 2, top: y - 2 })
  }

  const titleSvg = `<svg width="${width}" height="60">
    <rect width="100%" height="100%" fill="#060810"/>
    <text x="20" y="38" font-family="monospace" font-size="24" fill="#E9C176">SMOKECRAFT UNIFIED SYSTEM FINAL — Sheet ${sheetIndex} of ${totalSheets}</text>
  </svg>`

  const base = sharp({ create: { width, height, channels: 3, background: '#060810' } })
  const out = `${DIR}/SMOKECRAFT_UNIFIED_SYSTEM_FINAL_${String(sheetIndex).padStart(2, '0')}.png`
  await base.composite([{ input: Buffer.from(titleSvg), left: 0, top: 0 }, ...composites]).png().toFile(out)
  return out
}

async function buildIndex(entries) {
  const cols = 8
  const tw = 130, th = 82, lh = 14, pad = 3
  const cellW = tw + pad * 2, cellH = th + lh + pad * 2
  const rows = Math.ceil(entries.length / cols)
  const width = cellW * cols
  const height = cellH * rows + 50
  const composites = []
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    const col = i % cols, row = Math.floor(i / cols)
    const x = col * cellW + pad, y = row * cellH + pad + 50
    const thumbBuf = await sharp(`${DIR}/${e.filename}`).resize(tw, th, { fit: 'cover', position: 'top' }).toBuffer()
    composites.push({ input: thumbBuf, left: x, top: y })
    const label = `#${String(e.n).padStart(3, '0')}`
    const svg = `<svg width="${tw}" height="${lh}"><rect width="100%" height="100%" fill="#0b0d14"/><text x="2" y="11" font-family="monospace" font-size="10" fill="#E9C176">${label}</text></svg>`
    composites.push({ input: Buffer.from(svg), left: x, top: y + th })
  }
  const titleSvg = `<svg width="${width}" height="50"><rect width="100%" height="100%" fill="#060810"/><text x="16" y="32" font-family="monospace" font-size="20" fill="#E9C176">SMOKECRAFT UNIFIED SYSTEM FINAL INDEX — 001 -&gt; ${String(entries.length).padStart(3,'0')}</text></svg>`
  const out = `${DIR}/SMOKECRAFT_UNIFIED_SYSTEM_FINAL_INDEX.png`
  await sharp({ create: { width, height, channels: 3, background: '#060810' } })
    .composite([{ input: Buffer.from(titleSvg), left: 0, top: 0 }, ...composites])
    .png().toFile(out)
  return out
}

async function main() {
  const sheets = []
  for (let i = 0; i < manifest.length; i += PER_SHEET) sheets.push(manifest.slice(i, i + PER_SHEET))
  const outputs = []
  for (let s = 0; s < sheets.length; s++) {
    const out = await buildSheet(sheets[s], s + 1, sheets.length)
    outputs.push(out)
    console.log(`Wrote ${out}`)
  }
  const indexOut = await buildIndex(manifest)
  console.log(`Wrote ${indexOut}`)
  writeFileSync(`${DIR}/contact-sheet-manifest.json`, JSON.stringify({ totalSheets: sheets.length, outputs, indexOut }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
