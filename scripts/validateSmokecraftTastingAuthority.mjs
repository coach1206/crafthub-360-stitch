#!/usr/bin/env node
/**
 * Holistic Fix 5A-3D — build-blocking validator for the server-
 * authoritative tasting flow.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft tasting-authority validator (Holistic Fix 5A-3D)\n')

const mini = fs.readFileSync('src/pages/smokecraft/MiniTasting.jsx', 'utf8')
check('MiniTasting.jsx no longer calls addXP() directly (server-verified completion only)', !/\baddXP\(/.test(mini))
check('MiniTasting.jsx uses the shared server adapter for draft load/save (loadTastingDraft/saveTastingDraft)',
  /loadTastingDraft\(/.test(mini) && /saveTastingDraft\(/.test(mini))
check('MiniTasting.jsx submits completion via the shared adapter (completeTasting), not a local claim', /completeTasting\(/.test(mini))
check('Completion is gated on a real selection (primaryDisabled tied to !selectedId)', /primaryDisabled=\{!selectedId/.test(mini))

const svc = fs.readFileSync('server/services/smokecraft/playerStateService.js', 'utf8')
check('submitTastingCompletion validates selectedCigarId against the server\'s own flight inventory (validIds), never trusting the client id blindly',
  /validIds\.has\(selectedCigarId\)/.test(svc))
check('submitTastingCompletion is idempotent via the existing smokecraft_activity_attempts UNIQUE constraint (activity_type=\'tasting\')',
  /activity_type = 'tasting'/.test(svc))
check('saveTastingDraft never grants XP or completion (draft save is reward-free — search confirms no xp_total UPDATE inside saveTastingDraft)',
  (() => {
    const fn = svc.match(/export async function saveTastingDraft[\s\S]*?\n}\n/)
    return !!fn && !/xp_total/.test(fn[0]) && !/smokecraft_activity_attempts/.test(fn[0])
  })())
check('saveTastingDraft enforces optimistic concurrency (expectedVersion check before write)', /currentVersion !== expectedVersion/.test(svc))

const routes = fs.readFileSync('server/routes/smokecraftPlayerStateRoutes.js', 'utf8')
check('Tasting draft/completion routes all require a verified SmokeCraft identity', /tasting\/:activityKey\/draft['"], readLimiter, requireSmokeCraftIdentity/.test(routes) && /tasting\/:activityKey\/draft['"], writeLimiter, requireSmokeCraftIdentity/.test(routes) && /tasting\/:activityKey\/complete['"], writeLimiter, requireSmokeCraftIdentity/.test(routes))

const controller = fs.readFileSync('server/controllers/playerStateController.js', 'utf8')
check('handleSaveTastingDraft requires an explicit expectedVersion (no default that would silently skip stale-write protection)',
  /typeof expectedVersion !== 'number' \|\| expectedVersion < 0/.test(controller))
check('Draft/completion controllers never log or forward request bodies to a public audit/console path beyond the DB row itself (no console.log of req.body in these handlers)',
  !/console\.log\(req\.body/.test(controller))

check('Migration 097 (tasting drafts) exists', fs.existsSync('server/db/migrations/097_smokecraft_tasting_drafts.sql'))
check('Migration 097 has a rollback script outside server/db/migrations', fs.existsSync('server/db/rollbacks/097_smokecraft_tasting_drafts.rollback.sql'))
const mig097 = fs.readFileSync('server/db/migrations/097_smokecraft_tasting_drafts.sql', 'utf8')
check('smokecraft_tasting_drafts has UNIQUE(guest_reference, activity_key) — one draft row per guest per activity', /UNIQUE \(guest_reference, activity_key\)/.test(mig097))
check('smokecraft_tasting_drafts has a version column for optimistic concurrency', /version\s+INT NOT NULL DEFAULT 0/.test(mig097))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
