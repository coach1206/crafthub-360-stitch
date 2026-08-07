/**
 * Package 1 — Golden Box eligibility (Step 7). Reads real progression
 * data (smokecraft_management_sync_journeys, xp_accounts, passport_360_badges,
 * passport_stamps) — never fabricates an eligible state without evaluation.
 */
import { getDb } from '../../db/connection.js'
import { getXpBalance } from './xpService.js'

async function evaluateRule(rule, identity) {
  const db = getDb()
  const config = rule.rule_config || {}
  switch (rule.rule_type) {
    case 'required_sessions': {
      const required = config.sessionIds || []
      if (required.length === 0) return { pass: true, reason: 'no_sessions_required' }
      const { rows } = await db.query(
        `SELECT DISTINCT session_number FROM smokecraft_management_sync_journeys
         WHERE guest_reference = $1 AND status = 'completed'`,
        [identity.guestReference]
      )
      const completed = rows.map(r => r.session_number)
      const missing = required.filter(id => !completed.includes(id))
      return missing.length === 0
        ? { pass: true, reason: 'all_required_sessions_completed' }
        : { pass: false, reason: `missing_sessions:${missing.join(',')}` }
    }
    // UI Handoff Closure gate: a real, direct rule against the actual
    // 27-session spine's own completion ledger
    // (smokecraft_session_completions — the same table
    // playerStateService.js writes on every real session completion),
    // rather than 'required_sessions' above, which reads a separate,
    // optional venue Management Sync journey table that most guests
    // (no real venue selected) never populate at all. Used to require
    // Session 27 ('session-complete') before Golden Box entry.
    case 'required_completion_keys': {
      const required = config.completionKeys || []
      if (required.length === 0) return { pass: true, reason: 'no_completion_keys_required' }
      const { rows } = await db.query(
        `SELECT DISTINCT session_id FROM smokecraft_session_completions WHERE guest_reference = $1`,
        [identity.guestReference]
      )
      const completed = rows.map(r => r.session_id)
      const missing = required.filter(id => !completed.includes(id))
      return missing.length === 0
        ? { pass: true, reason: 'all_required_completion_keys_present' }
        : { pass: false, reason: `missing_completion_keys:${missing.join(',')}` }
    }
    case 'min_xp': {
      const balance = await getXpBalance(identity)
      return balance >= (config.minXp || 0)
        ? { pass: true, reason: `xp_balance_${balance}_meets_minimum` }
        : { pass: false, reason: `xp_balance_${balance}_below_minimum_${config.minXp}` }
    }
    case 'required_badge': {
      if (!identity.guestUuid) return { pass: false, reason: 'no_guest_profile_for_badge_check' }
      const { rows } = await db.query(
        `SELECT 1 FROM passport_360_badges WHERE guest_id = $1 AND badge_id = $2`,
        [identity.guestUuid, config.badgeId]
      )
      return rows.length > 0
        ? { pass: true, reason: 'required_badge_present' }
        : { pass: false, reason: 'required_badge_missing' }
    }
    case 'required_passport_stamp': {
      const { rows } = await db.query(
        `SELECT 1 FROM passport_stamps ps
         JOIN passport_records pr ON pr.passport_id = ps.passport_id
         WHERE pr.guest_reference = $1 AND ps.stamp_id = $2`,
        [identity.guestReference, config.stampId]
      ).catch(() => ({ rows: [] })) // passport_records identity column not guaranteed identical shape; fail closed
      return rows.length > 0
        ? { pass: true, reason: 'required_stamp_present' }
        : { pass: false, reason: 'required_stamp_missing_or_unverifiable' }
    }
    case 'venue_membership': {
      if (!identity.userId) return { pass: false, reason: 'guest_cannot_satisfy_venue_membership' }
      const { rows } = await db.query(
        `SELECT 1 FROM venue_memberships WHERE user_id = $1 AND venue_id = $2 AND status = 'active'`,
        [identity.userId, config.venueId]
      )
      return rows.length > 0
        ? { pass: true, reason: 'active_venue_membership_confirmed' }
        : { pass: false, reason: 'no_active_venue_membership' }
    }
    case 'registration_window': {
      const now = new Date()
      const opens = config.opensAt ? new Date(config.opensAt) : null
      const closes = config.closesAt ? new Date(config.closesAt) : null
      if (opens && now < opens) return { pass: false, reason: 'registration_not_yet_open' }
      if (closes && now > closes) return { pass: false, reason: 'registration_closed' }
      return { pass: true, reason: 'within_registration_window' }
    }
    case 'max_entries': {
      const { rows } = await db.query(
        `SELECT COUNT(*)::int AS c FROM golden_box_entries WHERE competition_id = $1 AND guest_reference = $2`,
        [rule.competition_id, identity.guestReference]
      )
      return rows[0].c < (config.maxEntries ?? 1)
        ? { pass: true, reason: 'under_max_entries' }
        : { pass: false, reason: 'max_entries_reached' }
    }
    case 'admin_approval':
      return { pass: false, reason: 'requires_manual_administrator_approval' }
    case 'min_quiz_score':
      // No quiz-score persistence exists yet (04-DATA-BACKEND-GAP-REGISTRY.md)
      // — fail closed with an honest reason rather than fabricate a pass.
      return { pass: false, reason: 'quiz_score_data_not_available' }
    default:
      return { pass: false, reason: `unknown_rule_type:${rule.rule_type}` }
  }
}

/**
 * Evaluates every eligibility rule for a competition against an identity,
 * persists each result, and returns the overall verdict. Never returns
 * "eligible" without at least one real rule evaluation (competitions with
 * zero rules are eligible-by-design, explicitly reasoned as such).
 */
export async function evaluateEligibility(competitionId, identity) {
  const db = getDb()
  const { rows: rules } = await db.query(
    `SELECT * FROM golden_box_eligibility_rules WHERE competition_id = $1`,
    [competitionId]
  )

  const results = []
  for (const rule of rules) {
    const outcome = await evaluateRule({ ...rule, competition_id: competitionId }, identity)
    const { rows: saved } = await db.query(
      `INSERT INTO golden_box_eligibility_results
         (competition_id, user_id, guest_reference, eligibility_rule_id, result, reason, source_snapshot)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [competitionId, identity.userId || null, identity.guestReference || null, rule.id,
       outcome.pass ? 'eligible' : 'ineligible', outcome.reason, JSON.stringify({ ruleType: rule.rule_type })]
    )
    results.push(saved[0])
  }

  const overallEligible = rules.length === 0 || results.every(r => r.result === 'eligible')
  return {
    eligible: overallEligible,
    ruleCount: rules.length,
    results,
    reason: rules.length === 0 ? 'no_eligibility_rules_configured_open_entry' : (overallEligible ? 'all_rules_passed' : 'one_or_more_rules_failed'),
  }
}

export async function getLatestEligibility(competitionId, identity) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM golden_box_eligibility_results
     WHERE competition_id = $1 AND (user_id = $2 OR guest_reference = $3)
     ORDER BY evaluated_at DESC`,
    [competitionId, identity.userId || null, identity.guestReference || null]
  )
  return rows
}
