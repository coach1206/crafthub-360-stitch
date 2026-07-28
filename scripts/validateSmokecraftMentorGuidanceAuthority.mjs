#!/usr/bin/env node
/**
 * Holistic Fix 5B-2A — build-blocking validator for the server-
 * authoritative, context-aware mentor guidance service.
 */
import fs from 'fs'

let failures = 0
function check(label, cond) {
  if (cond) console.log(`  OK    ${label}`)
  else { console.log(`  FAIL  ${label}`); failures++ }
}

console.log('\n── SmokeCraft Mentor-Guidance-authority validator (Holistic Fix 5B-2A)\n')

const svc = fs.readFileSync('server/services/smokecraft/mentorGuidanceService.js', 'utf8')
check('Mentor identity is looked up from the real, single roster (getMentorById), never trusted as a client-submitted name/country/flag', /getMentorById\(mentorId\)/.test(svc) && /const mentor = getMentorById/.test(svc))
check('An unrecognized mentorId is rejected, never fabricates a mentor identity', /if \(!mentor\) throw new MentorGuidanceError\('mentor_not_selected'\)/.test(svc))
check('Guidance never awards XP, badges, or Passport stamps (mentor guidance is read-only)', !/awardXp|grantAward|passport.?stamp|awardBadge/i.test(svc))
check('Guidance never issues an UPDATE/INSERT against smokecraft_player_state, smokecraft_awards, or any reward table (read-only queries only)', !/UPDATE smokecraft_player_state|INSERT INTO smokecraft_awards|UPDATE smokecraft_awards/i.test(svc))
check('Every real signal query is scoped by guest_reference (never a global/unscoped query that could leak another learner\'s data)', (svc.match(/WHERE guest_reference = \$1/g) || []).length >= 3)
check('The fallback state (no real signal available) is honestly labeled, using the mentor\'s own real roster greeting — never a fabricated achievement', /sourceContext = 'mentor_bio'/.test(svc) && /message = mentor\.greeting/.test(svc))
check('Every response includes message/reason/nextAction/sourceContext/confidence/messageVersion — no unexplained guidance is possible', /reason,\s*\n\s*nextAction,\s*\n\s*sourceContext,\s*\n\s*confidence,\s*\n\s*messageVersion: GUIDANCE_VERSION/.test(svc))

const routes = fs.readFileSync('server/routes/mentorGuidanceRoutes.js', 'utf8')
check('Mentor-guidance routes have the dev/test rate-limiter skip from day one', /skip: \(\) => !IS_PROD/.test(routes))
check('An authenticated account\'s mentor-guidance identity is prefixed with user: from day one', /`user:\$\{req\.smokecraftIdentity\.id\}`/.test(routes))
check('Mentor-guidance routes issue a fresh guest identity when none exists from day one', /ensureSmokeCraftGuestIdentity/.test(routes))

const hook = fs.readFileSync('src/hooks/useSmokeCraftMentorGuidance.js', 'utf8')
check('The shared guidance hook reads the selected mentor from the one canonical source (SmokeCraftJourneyContext.journey.mentor), never a second mentor store', /useSmokeCraftJourney/.test(hook) && /journey\?\.mentor/.test(hook))
check('The shared guidance hook never computes guidance itself — only requests it from the server', !/message\s*[:=]\s*[`'"]/.test(hook))
check('The shared guidance hook represents the mandated state set (no-mentor/loading/ready/unavailable/offline/session-expired)',
  /no-mentor/.test(hook) && /loading/.test(hook) && /unavailable/.test(hook) && /offline/.test(hook) && /session-expired/.test(hook))

const panel = fs.readFileSync('src/components/smokecraft/DynamicMentorPanel.jsx', 'utf8')
check('DynamicMentorPanel uses the one shared mentor-guidance adapter (useSmokeCraftMentorGuidance)', /useSmokeCraftMentorGuidance/.test(panel))

const commentary = fs.readFileSync('src/pages/smokecraft/MentorCommentary.jsx', 'utf8')
check('MentorCommentary.jsx no longer keys guidance off a hardcoded per-mentor-id map that never matched the real roster (real found-and-fixed defect SC-D050)', !/const COMMENTARY = \{/.test(commentary))
check('MentorCommentary.jsx uses the one shared mentor-guidance adapter (useSmokeCraftMentorGuidance)', /useSmokeCraftMentorGuidance/.test(commentary))
check('MentorCommentary.jsx renders real roster fields (mentor.country/mentor.bio), not the nonexistent mentor.origin/mentor.expertise (real found-and-fixed defect)', !/\{mentor\.origin\}/.test(commentary) && !/\{mentor\.expertise\}/.test(commentary) && /\{mentor\.country\}/.test(commentary) && /\{mentor\.bio\}/.test(commentary))

const mentorPage = fs.readFileSync('src/pages/smokecraft/Mentor.jsx', 'utf8')
check('Mentor.jsx retains exactly one write path for the selected mentor (setMentor to SmokeCraftJourneyContext) — no second, competing mentor-selection owner reappeared', /setMentor\(mentors\.length \? mentors : null\)/.test(mentorPage) && (mentorPage.match(/setMentor\(/g) || []).length === 1)

const skillTree = fs.readFileSync('src/pages/smokecraft/SkillTree.jsx', 'utf8')
check('SkillTree.jsx\'s mentor panel uses the shared context-aware guidance service (context prop), not a hardcoded guidance string', /<DynamicMentorPanel context="skill-tree" \/>/.test(skillTree))

console.log(`\n=== RESULT: ${failures === 0 ? 'PASS' : 'FAIL'} (${failures} checks failed) ===\n`)
process.exit(failures === 0 ? 0 : 1)
