#!/usr/bin/env node
// Builds the master contact-sheet(s) for the SmokeCraft owner visual audit.
// Pure image composition (sharp) over the already-captured real screenshots
// — no new content, no substitutions.
import sharp from 'sharp'
import { readFileSync, readdirSync, writeFileSync } from 'fs'

const DIR = 'public/proof/smokecraft-owner-visual-audit'
const manifest = JSON.parse(readFileSync(`${DIR}/sequence-manifest.json`, 'utf8'))
const files = readdirSync(DIR).filter(f => /^\d{3}-.*\.png$/.test(f)).sort()

const THUMB_W = 480
const THUMB_H = 300 // 1440x900 -> scaled preserving aspect (480x300)
const LABEL_H = 34
const PAD = 10
const COLS = 4
const PER_SHEET = 12 // 3 rows x 4 cols per sheet -> legible thumbnails

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

    const label = `#${String(entry.n).padStart(3, '0')}  S:${entry.session ?? '-'}  ${entry.name}`.slice(0, 62)
    const labelSvg = `<svg width="${THUMB_W}" height="${LABEL_H}">
      <rect width="100%" height="100%" fill="#0b0d14"/>
      <text x="4" y="22" font-family="monospace" font-size="14" fill="#E9C176">${label.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>
    </svg>`
    composites.push({ input: Buffer.from(labelSvg), left: x, top: y + THUMB_H })

    // border
    const borderSvg = `<svg width="${THUMB_W+4}" height="${THUMB_H+LABEL_H+4}">
      <rect x="1" y="1" width="${THUMB_W+2}" height="${THUMB_H+LABEL_H+2}" fill="none" stroke="rgba(233,193,118,0.45)" stroke-width="2"/>
    </svg>`
    composites.push({ input: Buffer.from(borderSvg), left: x - 2, top: y - 2 })
  }

  const titleSvg = `<svg width="${width}" height="60">
    <rect width="100%" height="100%" fill="#060810"/>
    <text x="20" y="38" font-family="monospace" font-size="26" fill="#E9C176">SMOKECRAFT FULL GAME VISUAL AUDIT — Sheet ${sheetIndex} of ${totalSheets}</text>
  </svg>`

  const base = sharp({ create: { width, height, channels: 3, background: '#060810' } })
  const out = totalSheets > 1
    ? `${DIR}/SMOKECRAFT_FULL_GAME_VISUAL_AUDIT_${String(sheetIndex).padStart(2, '0')}.png`
    : `${DIR}/SMOKECRAFT_FULL_GAME_VISUAL_AUDIT.png`

  await base
    .composite([{ input: Buffer.from(titleSvg), left: 0, top: 0 }, ...composites])
    .png()
    .toFile(out)
  return out
}

async function main() {
  const sheets = []
  for (let i = 0; i < manifest.length; i += PER_SHEET) sheets.push(manifest.slice(i, i + PER_SHEET))
  const outputs = []
  for (let s = 0; s < sheets.length; s++) {
    const out = await buildSheet(sheets[s], s + 1, sheets.length)
    outputs.push(out)
    console.log(`Wrote ${out} (${sheets[s].length} thumbnails)`)
  }
  writeFileSync(`${DIR}/contact-sheet-manifest.json`, JSON.stringify({ totalSheets: sheets.length, outputs }, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
