#!/usr/bin/env node
/**
 * Seeds real, versioned rows into smokecraft_gameplay_rules (migration
 * 095) from the pre-existing, already-approved constants — never
 * inventing a new value. Idempotent: re-running upserts the same rows
 * (ON CONFLICT (rule_key, version) DO NOTHING — a rule row, once
 * written, is immutable; a real rule change must ship as a NEW version).
 *
 * Run: node scripts/seedSmokecraftGameplayRules.mjs
 */
import { getDb } from '../server/db/connection.js'
import { SESSION_REWARDS, SC_RANKS } from '../src/constants/smokecraftRewards.js'
import { KNOWLEDGE_CHECK_SETS } from '../src/data/knowledgeCheckQuestions.js'
import { getLeafChallengeResultsData } from '../src/data/leafChallengeRounds.js'

const RULE_VERSION = 1

async function upsertRule(db, ruleKey, activityType, definition, explanation) {
  await db.query(
    `INSERT INTO smokecraft_gameplay_rules (rule_key, version, active, activity_type, definition, explanation)
     VALUES ($1, $2, true, $3, $4, $5)
     ON CONFLICT (rule_key, version) DO NOTHING`,
    [ruleKey, RULE_VERSION, activityType, JSON.stringify(definition), explanation]
  )
}

async function main() {
  const db = getDb()
  if (!db) {
    console.log('[seedSmokecraftGameplayRules] No DB connection — nothing seeded.')
    return
  }

  let count = 0

  // Session-completion XP + tied badge/stamp rules (24 sessions).
  for (const [sessionId, entry] of Object.entries(SESSION_REWARDS)) {
    await upsertRule(db, `session-xp:${sessionId}`, 'session_completion', {
      xp: entry.xp,
      badges: (entry.sessionBadges || []).map(b => b.id),
      maxRepeats: 1,
      cooldown: null,
      eligibility: 'reach and complete this session route (server-verified via idempotent completion record)',
    }, `Session "${sessionId}" awards ${entry.xp} XP on first completion, once only.`)
    count++
  }

  // Rank ladder (one rule).
  await upsertRule(db, 'rank-ladder', 'rank', {
    ladder: SC_RANKS.map(r => ({ name: r.name, minXP: r.minXP })),
    demotion: false,
  }, 'Rank is recomputed from xp_total after every XP-affecting mutation; no automatic demotion.')
  count++

  // Quiz scoring rules — one per Knowledge Check module set.
  for (const [moduleId, set] of Object.entries(KNOWLEDGE_CHECK_SETS)) {
    await upsertRule(db, `quiz-scoring:${moduleId}`, 'quiz', {
      questionCount: set.questions.length,
      scoringFormula: 'server re-derives correctness per question from the same answer key the client cannot submit; score = count of correct answers',
      retryBehavior: 'a Retry re-shuffles and re-answers all questions; only the FIRST successful completion of this module ever grants XP (guest+moduleId UNIQUE)',
      maxRepeatXpGrants: 1,
      evidenceRequirement: 'raw per-question responses (never a client-submitted correctness flag or score)',
    }, `Knowledge Check "${moduleId}" is scored server-side against its real answer key; XP is granted once, from the linked session's existing XP rule.`)
    count++
  }

  // Leaf Challenge (Origins module) tiered scoring rule.
  await upsertRule(db, 'leaf-challenge-scoring', 'skill_check', {
    rounds: 5,
    tiers: [
      { minScore: 5, xp: getLeafChallengeResultsData(5).xp, perfect: true },
      { minScore: 3, xp: getLeafChallengeResultsData(3).xp, perfect: false },
      { minScore: 0, xp: getLeafChallengeResultsData(0).xp, perfect: false },
    ],
    badges: ['botanist', 'leaf-scholar (perfect score only)'],
    passportStamp: 'leaf-recognition',
    maxRepeatXpGrants: 1,
    evidenceRequirement: 'the 5 submitted leaf-id answers, scored against the real answer key (src/data/leafChallengeRounds.js) — never a client-submitted score',
  }, 'Leaf Challenge XP/badge/stamp is tiered by a server-verified score (0-5 correct), granted once per guest.')
  count++

  // Named one-time XP activities (Origins module screens).
  const NAMED_XP = {
    'art-observation': 50,
    'available-cigar-selected': 100,
    'cultivation-seed': 50,
    'cultivation-water': 50,
    'leaves-observation': 75,
    'mini-tasting-begin': SESSION_REWARDS['mini-tasting-module']?.xp ?? 75,
    'blend-created': 150,
  }
  for (const [key, xp] of Object.entries(NAMED_XP)) {
    await upsertRule(db, `named-xp:${key}`, 'named_xp', {
      xp, maxRepeats: 1, cooldown: null,
      eligibility: 'reaching and completing this one-time activity (server-verified via idempotent award record)',
    }, `Named activity "${key}" awards ${xp} XP once only.`)
    count++
  }

  // Leaderboard eligibility rule.
  await upsertRule(db, 'leaderboard-eligibility', 'leaderboard', {
    requireXpAbove: 0,
    defaultEligible: true,
    tieBreak: ['xp_total DESC', 'completed_session_count DESC', 'guest_reference ASC'],
  }, 'A guest appears on the leaderboard once xp_total > 0, unless they have explicitly opted out.')
  count++

  console.log(`[seedSmokecraftGameplayRules] Seeded/verified ${count} version-${RULE_VERSION} rule rows.`)
}

main().catch(err => { console.error('[seedSmokecraftGameplayRules] Failed:', err); process.exit(1) })
