#!/usr/bin/env node
// SmokeCraft System Audit — Prompt 1/2, Part 2.
// Extracts every <Route> nested under the /smokecraft parent group in
// App.jsx programmatically (not hand-transcribed), tracking real JSX
// nesting depth so full paths (e.g. /smokecraft/golden-box/status) are
// reconstructed correctly rather than flattened incorrectly.
import { readFileSync, writeFileSync } from 'node:fs'

const src = readFileSync('src/App.jsx', 'utf8')
const lines = src.split('\n')

const startIdx = lines.findIndex(l => l.includes('path="smokecraft"') && l.includes('SmokeCraftJourneyProvider'))
if (startIdx === -1) throw new Error('smokecraft parent route not found')
const startIndent = lines[startIdx].match(/^(\s*)/)[1].length
let endIdx = -1
for (let i = startIdx + 1; i < lines.length; i++) {
  const m = lines[i].match(/^(\s*)<\/Route>\s*$/)
  if (m && m[1].length === startIndent) { endIdx = i; break }
}
if (endIdx === -1) throw new Error('smokecraft parent route close not found')

const block = lines.slice(startIdx + 1, endIdx)

// Stack of path segments for currently-open, non-self-closing <Route path="X">
// groups (e.g. "golden-box", "passport"), keyed by their indentation depth.
const stack = [] // { indent, path }
const routes = []

for (const line of block) {
  const indentMatch = line.match(/^(\s*)/)
  const indent = indentMatch[1].length

  // Pop any stack frames whose indent is >= this line's indent (we've
  // dedented past them) EXCEPT when this line itself is the frame's own
  // closing tag (handled below by the closing-tag branch first).
  const closeMatch = line.match(/^(\s*)<\/Route>\s*$/)
  if (closeMatch) {
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop()
    continue
  }

  const routeMatch = line.match(/<Route\s+(index|path="([^"]*)")([^>]*)>/)
  if (!routeMatch) continue

  // Any open group whose indent is >= this line's indent has already been
  // closed by a dedent (routes don't skip closing tags in this codebase's
  // consistent formatting) — pop them first.
  while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop()

  const isIndex = routeMatch[1] === 'index'
  const segment = isIndex ? '' : routeMatch[2]
  const rest = routeMatch[3]
  const isSelfClosing = /\/>\s*$/.test(line) || /element=\{[^}]*\}\s*\/>/.test(line)

  const parentPath = stack.length ? stack[stack.length - 1].path : ''
  const fullPath = isIndex
    ? (parentPath || '(smokecraft index)')
    : [parentPath, segment].filter(Boolean).join('/')

  const elMatch = line.match(/element=\{(.*)/)

  // A line like `<Route path="golden-box">` with no `element=` on it at all
  // is a pure group container — it opens a nested path prefix for the
  // routes indented under it, but registers no page of its own at that URL.
  // (Bug found during Holistic Fix 1: this previously emitted a phantom
  // duplicate route with no real element, inflating the route count and
  // colliding with the group's own real `index` route.) Only push a route
  // entry when this line actually carries an `element=`.
  if (elMatch) {
    const elementRaw = elMatch[1].replace(/\/>\s*$/, '').replace(/\}\s*$/, '')
    routes.push({ fullPath, isIndex, elementRaw: elementRaw.slice(0, 200) })
  }

  if (!isSelfClosing) {
    // This Route opens a nested group (e.g. <Route path="golden-box">).
    stack.push({ indent, path: fullPath })
  }
}

const out = [
  '# SmokeCraft Route Matrix (Prompt 1/2 — programmatically generated, full nested paths)',
  '',
  `Generated from \`src/App.jsx\` lines ${startIdx + 1}-${endIdx + 1} (the \`/smokecraft\` parent `
  + 'route group) at commit `67fe8f9ac872e1b784911da2a92fc15c9edc6ee7`, tracking real JSX nesting '
  + 'depth so full paths are reconstructed correctly (e.g. `golden-box/status` -> '
  + '`/smokecraft/golden-box/status`), not just a flat list of relative path fragments.',
  '',
  `**Total routes found in the /smokecraft group: ${routes.length}**`,
  '',
  '| # | Full path | Index | Element (raw JSX, truncated) |',
  '|---|---|---|---|',
  ...routes.map((r, i) => `| ${i + 1} | \`/smokecraft/${r.fullPath}\` | ${r.isIndex ? 'yes' : 'no'} | \`${r.elementRaw.replace(/\|/g, '\\|')}\` |`),
  '',
]

writeFileSync('docs/smokecraft/SMOKECRAFT_ROUTE_MATRIX_RAW.md', out.join('\n'))
writeFileSync('docs/smokecraft/smokecraft-routes-raw.json', JSON.stringify(routes, null, 2))
console.log(`Extracted ${routes.length} routes (full nested paths) from src/App.jsx lines ${startIdx + 1}-${endIdx + 1}`)
