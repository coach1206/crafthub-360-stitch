/**
 * SmokeCraft external-image-URL gate (Production Closure, Part 1).
 *
 * Fails if any SmokeCraft-reachable production data/constants file
 * contains a hardcoded http:// or https:// image URL. Scope is
 * deliberately SmokeCraft-only, not the whole repo — src/lib/craftImages.js
 * still carries external googleusercontent.com URLs for WineCraft/
 * BeerCraft/EAT/POS3 categories (backgrounds, fallbacks, badges, beers,
 * wines, events) that are real, pre-existing, out-of-scope debt for a
 * SmokeCraft-focused pass; this check does not silently touch or hide
 * that — it is intentionally scoped to what SmokeCraft actually renders.
 *
 * Checked (every category actually consumed by a SmokeCraft screen):
 *   - src/constants/smokecraftAssets.js  (SC_ASSETS — every SmokeCraft
 *     background/hotspot image)
 *   - src/lib/craftImages.js `portraits` map only (the category
 *     SmokeCraft's Passport Connections screen renders through
 *     portraitKey — real root cause of the ERR_TUNNEL_CONNECTION_FAILED
 *     browser-proof failure this check exists to prevent recurring)
 *   - src/data/connectionsData.js (SmokeCraft/Passport connections fixture
 *     data)
 */
import { readFileSync } from 'fs'

let fail = 0
function check(name, cond, detail = '') {
  if (cond) console.log(`  OK    ${name}`)
  else { fail++; console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`) }
}

console.log('── SmokeCraft external-image-URL gate\n')

const URL_RE = /https?:\/\/[^\s'"`]+/g

// 1. SC_ASSETS — every value must be a repo-relative path, never a URL.
{
  const src = readFileSync('src/constants/smokecraftAssets.js', 'utf8')
  const matches = [...src.matchAll(/^\s*\w+:\s*(?:`([^`]*)`|'([^']*)')/gm)]
  const external = matches
    .map(m => m[1] || m[2])
    .filter(v => v && /^https?:\/\//.test(v))
  check('SC_ASSETS contains no external image URLs', external.length === 0, external.join(', '))
}

// 2. craftImages.js `portraits` map only — extract just that block.
{
  const src = readFileSync('src/lib/craftImages.js', 'utf8')
  const m = src.match(/portraits:\s*\{([^}]*)\}/s)
  const block = m ? m[1] : ''
  const external = [...block.matchAll(URL_RE)]
  check('craftImages.js `portraits` map (SmokeCraft Passport Connections) contains no external image URLs', external.length === 0, external.map(x => x[0]).join(', '))
}

// 3. connectionsData.js — must not embed any external URL anywhere (fixture people data, no legitimate reason for a hardcoded URL).
{
  const src = readFileSync('src/data/connectionsData.js', 'utf8')
  const external = [...src.matchAll(URL_RE)]
  check('connectionsData.js contains no external image (or any) URLs', external.length === 0, external.map(x => x[0]).join(', '))
}

console.log(`\n=== RESULT: ${fail === 0 ? 'PASS' : 'FAIL'} (${fail} check${fail === 1 ? '' : 's'} failed) ===`)
if (fail > 0) process.exit(1)
