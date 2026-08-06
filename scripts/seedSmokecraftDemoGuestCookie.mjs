// Seeds ONE real, server-authoritative guest identity through all 22
// distinct completion ids (via the same real HTTP completion API proven by
// scripts/verify-smokecraft-full-game-fresh-player.mjs) and a Golden Box
// competition entry, then writes the resulting guest-session cookie to a
// file so scripts/captureSmokecraftViewportTouchProof.mjs can drive a real
// browser through every proof screen (Humidor Match onward, Passport,
// Golden Box) as an authenticated, progressed guest — not a shortcut, and
// not a bypass of any route guard: this walks the exact same real
// completion endpoints a real player would.
import http from 'http'
import fs from 'fs'
import 'dotenv/config'

const HOST = 'localhost', PORT = 3001
const rid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

function makeClient() {
  let cookies = {}
  function request(method, path, body) {
    return new Promise((resolve, reject) => {
      const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
      const data = body !== undefined ? JSON.stringify(body) : null
      const req = http.request({ host: HOST, port: PORT, path, method,
        headers: { 'Content-Type': 'application/json', ...(cookieHeader ? { Cookie: cookieHeader } : {}), ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) },
      }, res => {
        const setCookie = res.headers['set-cookie']
        if (setCookie) for (const c of setCookie) { const [pair] = c.split(';'); const [k, v] = pair.split('='); cookies[k] = v }
        let chunks = ''
        res.on('data', d => chunks += d)
        res.on('end', () => { let parsed = null; try { parsed = JSON.parse(chunks) } catch {}; resolve({ status: res.statusCode, body: parsed }) })
      })
      req.on('error', reject)
      if (data) req.write(data)
      req.end()
    })
  }
  return { get: (p) => request('GET', p), post: (p, b) => request('POST', p, b ?? {}), cookies: () => cookies }
}

async function main() {
  const g = makeClient()
  await g.get('/api/smokecraft/player-state')

  async function complete(id) { await g.post(`/api/smokecraft/player-state/sessions/${id}/complete`, { idempotencyKey: `seed-${id}-${rid()}` }) }

  await complete('entry')
  await g.post('/api/smokecraft/player-state/selection/humidor-match', { idempotencyKey: `seed-sel-hm-${rid()}`, payload: { selectedId: 'virtual_humidor' } })
  await complete('humidor-match')
  await g.post('/api/smokecraft/player-state/selection/meet-your-cigar', { idempotencyKey: `seed-sel-myc-${rid()}`, payload: { checkpoints: { brand: true, blend: true, wrapper: true }, synthesis: 'wrapper' } })
  await complete('meet-your-cigar')
  await g.post('/api/smokecraft/player-state/selection/terroir', { idempotencyKey: `seed-sel-ter-${rid()}`, payload: { checkpoints: { country: true, region: true, soil: true, climate: true, growing: true }, synthesis: 'soil' } })
  await complete('terroir')
  await g.post('/api/smokecraft/player-state/selection/format', { idempotencyKey: `seed-sel-fmt-${rid()}`, payload: { orderedIds: ['corona', 'robusto', 'toro', 'torpedo', 'churchill', 'gordo'] } })
  await complete('format')
  await g.post('/api/smokecraft/player-state/selection/cut-toast-light', { idempotencyKey: `seed-sel-ctl-${rid()}`, payload: { matches: { 'straight-cut': 'full-cap-removal', 'v-cut': 'wedge-channel', 'punch-cut': 'circular-plug' } } })
  await complete('cut-toast-light')
  await complete('lighting-tutorial')
  await g.post('/api/smokecraft/player-state/tasting-observation/first-third', { idempotencyKey: `seed-tob-ft-${rid()}`, notesSelected: ['Aroma Opening', 'Draw Ease'], personalNotes: 'Bright citrus opening.' })
  await complete('first-third')
  await g.post('/api/smokecraft/player-state/selection/flavor-memory', { idempotencyKey: `seed-sel-fm-${rid()}`, payload: { selectedHotspotIds: ['earth', 'cocoa'] } })
  await complete('flavor-memory')
  await g.post('/api/smokecraft/pairing-engine/recommend', { wrapper: 'Maduro', strength: 'Medium', body: 'Full', pairingType: 'Whiskey', flavorNotes: ['Smoky', 'Bold'], pairingGoal: 'Complement' })
  await g.post('/api/smokecraft/pairing-engine/save', { wrapper: 'Maduro', strength: 'Medium', body: 'Full', pairingType: 'Whiskey', flavorNotes: ['Smoky', 'Bold'], pairingGoal: 'Complement', idempotencyKey: `seed-pair-save-${rid()}` })
  await complete('pairing-lab')
  await g.post('/api/smokecraft/player-state/tasting-observation/second-third', { idempotencyKey: `seed-tob-st-${rid()}`, notesSelected: ['Flavor Development', 'Body Evolution'], personalNotes: 'Deepening spice.' })
  await complete('second-third')
  await complete('mentor-commentary')
  await g.post('/api/smokecraft/player-state/selection/knowledge-drop', { idempotencyKey: `seed-sel-kd-${rid()}`, payload: { checkpoints: { tobacco: 0, fermentation: 1, aging: 1, factory: 0 }, synthesis: 'factory' } })
  await complete('knowledge-drop')
  await g.post('/api/smokecraft/player-state/tasting-observation/final-third', { idempotencyKey: `seed-tob-fnt-${rid()}`, notesSelected: ['earth', 'cocoa', 'burn-quality'] })
  await complete('final-third')
  await g.post('/api/smokecraft/player-state/scorecard/submit', { idempotencyKey: `seed-sc-${rid()}`, categories: { appearance: 4, construction: 5, draw: 3, burn: 4, flavor: 5, pairing: 4 }, personalNotes: 'A very good smoke overall.' })
  await complete('scorecard')
  await complete('ai-summary')
  await g.post('/api/smokecraft/pairing-engine/recommend', { wrapper: 'Connecticut', strength: 'Mild', body: 'Medium', pairingType: 'Coffee', flavorNotes: ['Sweet', 'Creamy'], pairingGoal: 'Balance' })
  await complete('pairing-recommendations')
  await g.get('/api/smokecraft/passport-stamp/eligibility')
  await g.post('/api/smokecraft/passport-stamp/claim', {})
  await complete('passport-stamp')
  await complete('final-review')
  await complete('rewards')
  await complete('achievements')
  await complete('session-complete')

  const state = await g.get('/api/smokecraft/player-state')
  console.log('Seeded guest — XP:', state.body?.state?.xpTotal, 'completed:', state.body?.state?.completedSessions?.length)

  const cookies = g.cookies()
  const cookieStr = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ')
  fs.writeFileSync('/tmp/smokecraft_demo_cookie.txt', cookieStr)
  console.log('Cookie written to /tmp/smokecraft_demo_cookie.txt')
}

main().catch(e => { console.error(e); process.exit(1) })
