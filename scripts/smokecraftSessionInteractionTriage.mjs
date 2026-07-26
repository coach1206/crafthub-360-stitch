#!/usr/bin/env node
// SmokeCraft System Audit Prompt 3B, Batch 2 — triage pass.
// For each of the 27 session components, counts real interactive elements
// (<button, onClick=, <input, <select, <textarea, role="slider" etc.) in
// source, cross-referenced against the canonical manifest. This is NOT a
// full click-test of every control (that remains open) — it is a real,
// evidence-based triage to identify which session screens are suspiciously
// control-sparse (likely still static/baked) versus clearly interactive,
// so a further pass can prioritize correctly instead of guessing.
import { readFileSync, existsSync } from 'node:fs'
import { execSync } from 'node:child_process'

const { VISIT_STRUCTURE } = await import('../src/constants/session.js')
const { SMOKECRAFT_SCREEN_MANIFEST } = await import('../src/constants/smokecraftScreenManifest.js')

const registrySrc = readFileSync('src/constants/smokecraftComponentRegistry.js', 'utf8')
function componentFileFor(componentKey) {
  const re = new RegExp(`['"\`]${componentKey}['"\`]\\s*:\\s*([A-Za-z0-9_]+)`)
  const m = registrySrc.match(re)
  if (!m) return null
  const compName = m[1]
  const importRe = new RegExp(`import\\s+${compName}\\s+from\\s+['"]([^'"]+)['"]`)
  const importMatch = registrySrc.match(importRe)
  if (!importMatch) return null
  return importMatch[1].replace('../pages/', 'src/pages/')
}

const spine = []
for (const v of VISIT_STRUCTURE) for (const s of v.sessions) spine.push({ ...s, visit: v.visit })

const rows = []
for (const s of spine) {
  const manifest = SMOKECRAFT_SCREEN_MANIFEST.find(m => m.screenId === `session-${s.session}`)
  const componentKey = manifest?.componentKey
  let file = componentFileFor(componentKey)
  // Fallback: resolve via git grep for the component name in App.jsx imports if registry lookup failed.
  if (!file || !existsSync(file)) {
    try {
      const guess = execSync(`grep -rl "sessionNumber={${s.session}}" src/App.jsx`).toString()
    } catch {}
    file = null
  }
  let counts = null
  if (file && existsSync(file)) {
    const src = readFileSync(file, 'utf8')
    counts = {
      buttons: (src.match(/<button\b/g) || []).length,
      onClick: (src.match(/onClick=/g) || []).length,
      inputs: (src.match(/<input\b/g) || []).length,
      selects: (src.match(/<select\b/g) || []).length,
      textareas: (src.match(/<textarea\b/g) || []).length,
      sliders: (src.match(/type=["']range["']|role=["']slider["']/g) || []).length,
      navigateCalls: (src.match(/navigate\(/g) || []).length,
    }
  }
  const totalInteractive = counts ? counts.buttons + counts.inputs + counts.selects + counts.textareas + counts.sliders : null
  rows.push({ session: s.session, phase: s.visit, id: s.id, route: s.route, mergedInto: s.mergedInto || null, file, counts, totalInteractive })
}

console.log('| S | Phase | Route | File | Buttons | Inputs | Selects | Textareas | Sliders | Total interactive |')
console.log('|---|---|---|---|---|---|---|---|---|---|')
for (const r of rows) {
  if (r.mergedInto) { console.log(`| S${r.session} | ${r.phase} | \`${r.route}\` | (merged into S${r.mergedInto}) | - | - | - | - | - | - |`); continue }
  if (!r.file) { console.log(`| S${r.session} | ${r.phase} | \`${r.route}\` | **UNRESOLVED** | - | - | - | - | - | **?** |`); continue }
  const c = r.counts
  const flag = r.totalInteractive === 0 ? ' **ZERO — INVESTIGATE**' : (r.totalInteractive <= 2 ? ' (low)' : '')
  console.log(`| S${r.session} | ${r.phase} | \`${r.route}\` | \`${r.file}\` | ${c.buttons} | ${c.inputs} | ${c.selects} | ${c.textareas} | ${c.sliders} | ${r.totalInteractive}${flag} |`)
}

const unresolved = rows.filter(r => !r.mergedInto && !r.file)
const zero = rows.filter(r => !r.mergedInto && r.file && r.totalInteractive === 0)
console.error(`\nUnresolved file for: ${unresolved.map(r => `S${r.session}`).join(', ') || '(none)'}`)
console.error(`Zero interactive elements found: ${zero.map(r => `S${r.session}`).join(', ') || '(none)'}`)
