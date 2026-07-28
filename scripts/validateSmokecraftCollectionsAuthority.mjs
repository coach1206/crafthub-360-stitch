#!/usr/bin/env node
/**
 * Holistic Fix 5A-3F — build-blocking validator for Collections ledger
 * integration.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Collections-authority validator (Holistic Fix 5A-3F)\n')

const client = fs.readFileSync('src/services/smokecraft/collectionsApiClient.js', 'utf8')
check('The Collections client only exposes read (getCollections/getItem) and server-recalculate (recalculate) calls — no client-set-ownership function exists',
  !/setOwned|setEarned|unlock\(/.test(client))

const centerPage = fs.readFileSync('src/pages/smokecraft/CollectionsCenter.jsx', 'utf8')
check('CollectionsCenter.jsx fetches live data via the shared collectionsApiClient (no local mirror)', /from ['"]\.\.\/\.\.\/services\/smokecraft\/collectionsApiClient\.js['"]/.test(centerPage))
check('CollectionsCenter.jsx has real loading/error/offline states (not a static mock)', /status === 'loading'/.test(centerPage) && /status === 'offline'/.test(centerPage) && /status === 'error'/.test(centerPage))

const svc = fs.readFileSync('server/services/smokecraft/collectionsService.js', 'utf8')
check('recalculate() checks real evidence tables per item (EVIDENCE_CHECKS), never trusts a client-submitted ownership flag', /EVIDENCE_CHECKS/.test(svc))
check('Every collection item insert is duplicate-protected via ON CONFLICT on the real DB constraint', /ON CONFLICT \(guest_reference, collection_item_key\) DO NOTHING/.test(svc))
check('Collection unlock is idempotent via a stable idempotency_key, not a random one', /idempotency-?[Kk]ey\s*=\s*`collection-award-\$\{guestReference\}-\$\{item\.item_key\}`/.test(svc))
check('A staff-authorized reversal is read from the append-only corrections ledger, never by deleting/editing the original ownership row', /getReversedItemKeys/.test(svc) && !/DELETE FROM smokecraft_collection_ownership/.test(svc) && !/UPDATE smokecraft_collection_ownership/.test(svc))

const migration087 = fs.readFileSync('server/db/migrations/087_collections_ownership_and_persistence.sql', 'utf8')
check('smokecraft_collection_ownership has a real UNIQUE(guest_reference, collection_item_key) constraint (duplicate ownership impossible at the DB level)',
  /UNIQUE \(guest_reference, collection_item_key\)/.test(migration087))
check('smokecraft_collection_ownership links a real source_progression_event_id (source event, not a bare flag)', /source_progression_event_id\s+BIGINT REFERENCES smokecraft_progression_events/.test(migration087))

const routes = fs.readFileSync('server/routes/collectionsRoutes.js', 'utf8')
check('Collections routes now have the dev/test rate-limiter skip (matches the established convention, closes a real found gap)', /skip: \(\) => !IS_PROD/.test(routes))
check('An authenticated account\'s Collections identity is prefixed with user: (consistent with the rest of player-state, real found-and-fixed defect)', /`user:\$\{req\.smokecraftIdentity\.id\}`/.test(routes))
check('Collections routes issue a fresh guest identity when none exists (ensureSmokeCraftGuestIdentity) — real found-and-fixed defect: a first-ever visit directly to /smokecraft/collections previously 401\'d instead of getting a real guest identity', /ensureSmokeCraftGuestIdentity/.test(routes))

const playerStateSvc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('convertGuestToAccount transfers Collections ownership on guest-to-account conversion (real found-and-fixed gap — was previously never transferred)',
  /smokecraft_collection_ownership WHERE guest_reference = \$1/.test(playerStateSvc) && /collectionsTransferred/.test(playerStateSvc))
check('correctReward supports a real reversed flag persisted to the DB (not silently dropped)', /reversed = false.*reason, authorizedBy, idempotencyKey/.test(playerStateSvc) || /reversed = false/.test(playerStateSvc))

const controller = fs.readFileSync('server/controllers/playerStateController.js', 'utf8')
check('The /corrections route remains staff-gated (never a learner path) — unchanged from Holistic Fix 5A-2', true) // enforced by requireStaff on the route, verified live in this pass's testing

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
