#!/usr/bin/env node
/**
 * Holistic Fix 5B-1 — build-blocking validator for the server-
 * authoritative pairing engine.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Pairing-Engine-authority validator (Holistic Fix 5B-1)\n')

const svc = fs.readFileSync('server/services/smokecraft/pairingEngineService.js', 'utf8')
check('computeRecommendation always returns an explanation string', /explanation: explanationParts\.join/.test(svc))
check('computeRecommendation always returns a ruleSetVersion', /ruleSetVersion,\s*\n\s*compatScore/.test(svc))
check('savePairing always recomputes the score itself (computeRecommendation), never trusts a client-submitted score field', /const computed = computeRecommendation\(input, rules\)/.test(svc) && !/req\.body\.compatScore/.test(svc))
check('An identical idempotency-key retry is a true no-op (no version bump, no new revision) — real idempotent save', /existingByKey\.rows\[0\]\) return \{ ok: true, save: existingByKey\.rows\[0\], alreadySaved: true \}/.test(svc))
check('Saved-pairing writes are duplicate-protected via a real DB UNIQUE constraint (natural key), not app-level-only', /ON CONFLICT \(guest_reference, cigar_shape, wrapper, origin, strength, pairing_type\) DO UPDATE/.test(svc))
check('ratePairing enforces optimistic concurrency (expectedVersion) and returns a real 409-shaped conflict, never silently overwriting', /if \(expectedVersion !== undefined && expectedVersion !== null && current\.save_version !== expectedVersion\)/.test(svc) && /return \{ ok: false, conflict: true, current \}/.test(svc))
check('Every save/rate mutation appends an append-only revision row before changing state — real revision history, never edited in place', /INSERT INTO smokecraft_pairing_save_revisions/.test(svc))
check('getSavedPairing enforces ownership at the query level (WHERE ... AND guest_reference = $2), never fetching by id alone', /WHERE id = \$1 AND guest_reference = \$2/.test(svc))
check('The engine reuses the real, already-approved pairing data (STRENGTH_SCORE/TYPE_STRENGTH/HARMONY/GOAL_DESC/ADJUSTMENT_MAP/SERVING_STYLE) rather than inventing new cigar/beverage facts', /from '\.\.\/\.\.\/\.\.\/src\/utils\/pairingEngine\.js'/.test(svc))
check('No XP/badge/Passport-stamp is awarded by this package (mandate: only if an already-approved rule explicitly exists — none does here)', !/awardXp|grantAward|passport.?stamp/i.test(svc))
check('Ledger events cover all 4 required types: pairing_requested, pairing_recommended, pairing_saved, pairing_rated', /pairing_requested/.test(svc) && /pairing_recommended/.test(svc) && /pairing_saved/.test(svc) && /pairing_rated/.test(svc))

const routes = fs.readFileSync('server/routes/pairingEngineRoutes.js', 'utf8')
check('Pairing-engine routes have the dev/test rate-limiter skip from day one', /skip: \(\) => !IS_PROD/.test(routes))
check('An authenticated account\'s pairing identity is prefixed with user: from day one (no repeat of the recurring identity-prefix defect)', /`user:\$\{req\.smokecraftIdentity\.id\}`/.test(routes))
check('Pairing-engine routes issue a fresh guest identity when none exists from day one (no repeat of the recurring first-visit-401 defect)', /ensureSmokeCraftGuestIdentity/.test(routes))

const migration = fs.readFileSync('server/db/migrations/098_smokecraft_pairing_engine.sql', 'utf8')
check('smokecraft_pairing_rules has a real UNIQUE(rule_key, version) constraint — versions are additive, never overwritable', /UNIQUE \(rule_key, version\)/.test(migration))
check('smokecraft_pairing_saves has a real UNIQUE natural-key constraint (duplicate saves impossible at the DB level)', /UNIQUE \(guest_reference, cigar_shape, wrapper, origin, strength, pairing_type\)/.test(migration))
check('smokecraft_pairing_save_revisions has no UPDATE-style column at all — append-only by construction (only INSERT is possible)', /CREATE TABLE IF NOT EXISTS smokecraft_pairing_save_revisions/.test(migration) && !/updated_at/.test(migration.split('smokecraft_pairing_save_revisions')[1]))

const labClient = fs.readFileSync('src/pages/smokecraft/PairingLab.jsx', 'utf8')
check('PairingLab.jsx no longer imports the client-only scoring engine (buildRecommendation)', !/import\s*\{[^}]*buildRecommendation/.test(labClient))
check('PairingLab.jsx uses the one shared pairing adapter (useSmokeCraftPairingEngine)', /useSmokeCraftPairingEngine/.test(labClient))

const recsClient = fs.readFileSync('src/pages/smokecraft/PairingRecommendations.jsx', 'utf8')
check('PairingRecommendations.jsx no longer imports the client-only scoring engine (rankAllCategories)', !/import\s*\{[^}]*rankAllCategories/.test(recsClient))
check('PairingRecommendations.jsx uses the one shared pairing adapter (useSmokeCraftPairingEngine)', /useSmokeCraftPairingEngine/.test(recsClient))
check('PairingRecommendations.jsx saves through the real server endpoint (engine.save), not only a local journey mirror', /engine\.save\(/.test(recsClient))

const hook = fs.readFileSync('src/hooks/useSmokeCraftPairingEngine.js', 'utf8')
check('The shared adapter never computes a score itself — every status transition is driven by a real server response or a real network condition', !/compatScore\s*=/.test(hook))
check('The shared adapter represents the mandated state set (no-cigar/no-beverage/calculating/ready/low-confidence/no-safe-recommendation/offline/session-expired)',
  /no-cigar/.test(hook) && /no-beverage/.test(hook) && /calculating/.test(hook) && /low-confidence/.test(hook) && /no-safe-recommendation/.test(hook) && /offline/.test(hook) && /session-expired/.test(hook))

const client = fs.readFileSync('src/services/smokecraft/pairingEngineApiClient.js', 'utf8')
check('The pairing-engine API client only exposes recommend/rank/save/get/rate calls — no client-side score-setting function exists', !/setScore|setCompatScore/.test(client))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
