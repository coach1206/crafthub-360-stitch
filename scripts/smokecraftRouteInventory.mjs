#!/usr/bin/env node
// SmokeCraft System Audit — Prompt 1, Part 2.
// Extracts every <Route> nested under the /smokecraft parent group in
// App.jsx programmatically (not hand-transcribed), so the route matrix
// can never silently drift from the actual router.
import { readFileSync, writeFileSync } from 'node:fs'

const src = readFileSync('src/App.jsx', 'utf8')
const lines = src.split('\n')

const startIdx = lines.findIndex(l => l.includes('path="smokecraft"') && l.includes('SmokeCraftJourneyProvider'))
if (startIdx === -1) throw new Error('smokecraft parent route not found')
const startIndent = lines[startIdx].match(/^(\s*)/)[1].length
let endIdx = -1
for (let i = startIdx + 1; i < lines.length; i++) {
  const l = lines[i]
  const m = l.match(/^(\s*)<\/Route>\s*$/)
  if (m && m[1].length === startIndent) { endIdx = i; break }
}
if (endIdx === -1) throw new Error('smokecraft parent route close not found')

const block = lines.slice(startIdx, endIdx + 1)

const routeRe = /<Route\s+(index|path="([^"]*)")[^>]*?element=\{([^\n]*?)\}\s*\/?>/g
const routes = []
const blockText = block.join('\n')
let m
while ((m = routeRe.exec(blockText))) {
  const isIndex = m[1] === 'index'
  const path = isIndex ? '(index)' : m[2]
  const elementRaw = m[3].trim()
  routes.push({ path, isIndex, elementRaw })
}

const lines_out = [
  '# SmokeCraft Route Matrix (Prompt 1 — programmatically generated)',
  '',
  `Generated from \`src/App.jsx\` lines ${startIdx + 1}-${endIdx + 1} (the \`/smokecraft\` parent `
  + 'route group) at commit `d6469504a2a83ab4acfb27e89a25064d505d4d55`. This is a mechanical '
  + 'extraction of every `<Route>` JSX element in that block — not hand-transcribed — so it '
  + 'cannot silently drift from the actual router.',
  '',
  `**Total routes found in the /smokecraft group: ${routes.length}**`,
  '',
  '| # | Path (relative to /smokecraft) | Index route | Element (raw JSX) |',
  '|---|---|---|---|',
  ...routes.map((r, i) => `| ${i + 1} | \`${r.path}\` | ${r.isIndex ? 'yes' : 'no'} | \`${r.elementRaw.replace(/\|/g, '\\|').slice(0, 160)}\` |`),
  '',
  '## Notes',
  '',
  '- This list is every route registered directly under the `/smokecraft` path prefix in the single-page router (`src/App.jsx`). It does not include routes registered under other top-level prefixes (e.g. `/crafthub`, `/passport` at the app root, `/pos3`, `/eat`) which are separate NOVEE OS modules, not part of the SmokeCraft experience.',
  '- Nested sub-groups (e.g. `golden-box`, `passport`, `cart`) are flattened into this same list at their JSX nesting level; their full path is `/smokecraft/<parent>/<child>`.',
  '- `Navigate` elements are redirects/aliases, not real screens — they are included and marked by their `element` column so redirect destinations are traceable.',
  '',
]

writeFileSync('docs/smokecraft/SMOKECRAFT_ROUTE_MATRIX_RAW.md', lines_out.join('\n'))
console.log(`Extracted ${routes.length} routes from src/App.jsx lines ${startIdx + 1}-${endIdx + 1}`)
console.log(JSON.stringify(routes, null, 2))
