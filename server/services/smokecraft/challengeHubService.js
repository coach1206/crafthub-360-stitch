/**
 * Challenge Hub Live State (migration 088). Server-side deterministic
 * instance resolution + evaluation. Never trusts client-submitted
 * progress or completion. Progress is computed from real
 * smokecraft_progression_events rows within the instance's real time
 * window — the same shared event log every prior pass (Filler
 * Arrangement, Skill Tree, Collections) already writes to.
 */
import { getDb } from '../../db/connection.js'
import { recordEvent } from './progressionEventService.js'
import { recordChallengeEvent } from './challengeEventService.js'
import { ensurePlayerStateRow } from './playerStateService.js'

const UNIQUE_VIOLATION = '23505'

export class ChallengeHubError extends Error {
  constructor(code) { super(code); this.code = code }
}

// UTC calendar day / UTC ISO week (Monday start) — the project's existing
// timezone convention (every table uses TIMESTAMPTZ backed by Postgres
// now(), no per-guest timezone system exists anywhere in the codebase).
function currentPeriod(cadence, now = new Date()) {
  if (cadence === 'daily') {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
    return { start, end }
  }
  // weekly — ISO week, Monday 00:00:00 UTC through the following Monday
  const day = now.getUTCDay() // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday))
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
  return { start, end }
}

// Idempotent — same (challenge_key, effective_start) always resolves to
// the same row via the real UNIQUE constraint, never a duplicate created
// per page load or per call.
export async function resolveCurrentInstance(challengeKey, definition) {
  const db = getDb()
  const { start, end } = currentPeriod(definition.cadence)
  const instanceKey = `${challengeKey}-${start.toISOString().slice(0, 10)}`

  const { rows } = await db.query(
    `INSERT INTO smokecraft_challenge_instances (instance_key, challenge_key, effective_start, effective_end)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (instance_key) DO NOTHING
     RETURNING *`,
    [instanceKey, challengeKey, start.toISOString(), end.toISOString()]
  )
  if (rows[0]) return rows[0]
  const { rows: existing } = await db.query(`SELECT * FROM smokecraft_challenge_instances WHERE instance_key = $1`, [instanceKey])
  return existing[0]
}

export async function getDefinitions() {
  const db = getDb()
  const { rows } = await db.query(`SELECT * FROM smokecraft_challenge_definitions WHERE active = true ORDER BY display_order`)
  return rows
}

function computeTimeStatus(instance, serverNow) {
  if (instance.cancelled) return 'cancelled'
  const start = new Date(instance.effective_start)
  const end = new Date(instance.effective_end)
  if (serverNow < start) return 'upcoming'
  if (serverNow >= end) return 'expired'
  return 'active'
}

// Challenge Hub's own bookkeeping events (challenge_started/
// challenge_progress_updated/challenge_completed/challenge_reward_granted/
// challenge_recalculated) must never count as evidence toward a
// challenge's own requirement — otherwise merely starting a challenge
// would trivially satisfy it. Only real lesson/activity events count.
const CHALLENGE_BOOKKEEPING_EVENT_TYPES = [
  'challenge_started', 'challenge_progress_updated', 'challenge_completed',
  'challenge_reward_granted', 'challenge_recalculated',
]

async function evaluateProgress(db, guestReference, definition, instance) {
  const cfg = definition.requirement_config
  if (definition.requirement_type === 'progression_event_in_period' || definition.requirement_type === 'progression_event_breadth_in_period') {
    const { rows } = await db.query(
      `SELECT COUNT(DISTINCT event_type)::int AS c FROM smokecraft_progression_events
       WHERE guest_reference = $1 AND created_at >= $2 AND created_at < $3
         AND NOT (event_type = ANY($4::text[]))`,
      [guestReference, instance.effective_start, instance.effective_end, CHALLENGE_BOOKKEEPING_EVENT_TYPES]
    )
    const threshold = cfg.minDistinctEventTypes || definition.target_value || 1
    return { progress: Math.min(rows[0].c, definition.target_value), met: rows[0].c >= threshold }
  }
  throw new ChallengeHubError(`unknown_requirement_type:${definition.requirement_type}`)
}

// Row-locked, transactional completion + idempotent reward grant.
// FOR UPDATE closes the real two-tab/rapid-double-click race that a
// plain SELECT-then-UPDATE could otherwise allow (two concurrent
// requests both reading participation_state as not-yet-completed
// before either commits): the second request's lock acquisition
// blocks until the first commits, then re-reads the now-completed row
// and returns early instead of double-completing or double-rewarding.
// The XP award itself is additionally guarded by a real UNIQUE DB
// constraint (smokecraft_challenge_rewards(guest_reference,
// challenge_instance_key)), not just the row lock — a defense-in-depth
// idempotency guarantee matching the established pattern in
// playerStateService.submitTastingCompletion().
async function completeChallengeAndAward(db, guestReference, definition, instance, progress) {
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: lockedRows } = await client.query(
      `SELECT * FROM smokecraft_challenge_learner_state WHERE guest_reference = $1 AND challenge_instance_key = $2 FOR UPDATE`,
      [guestReference, instance.instance_key]
    )
    const locked = lockedRows[0]
    if (!locked || locked.participation_state === 'completed') {
      await client.query('ROLLBACK')
      return locked || null
    }

    const { event: completedEvent } = await recordEvent({
      guestReference, sourceScreen: 'ChallengeHub', sourceRoute: '/smokecraft/challenge-hub',
      eventType: 'challenge_completed',
      payload: { challengeKey: definition.challenge_key, instanceKey: instance.instance_key },
      idempotencyKey: `challenge-complete-event-${guestReference}-${instance.instance_key}`,
    })

    const { rows: updated } = await client.query(
      `UPDATE smokecraft_challenge_learner_state
       SET participation_state = 'completed', progress_value = $1, completed_at = COALESCE(completed_at, now()),
           completion_source = $2, supporting_progression_event_id = $3, updated_at = now()
       WHERE guest_reference = $4 AND challenge_instance_key = $5
       RETURNING *`,
      [progress, definition.requirement_type, completedEvent.id, guestReference, instance.instance_key]
    )
    const learnerState = updated[0]

    let xpAwarded = 0
    let rewardGranted = false
    if (definition.xp_reward > 0) {
      await ensurePlayerStateRow(client, guestReference, null)
      const idempotencyKey = `challenge-reward-${guestReference}-${instance.instance_key}`
      try {
        const inserted = await client.query(
          `INSERT INTO smokecraft_challenge_rewards (guest_reference, challenge_key, challenge_instance_key, rule_version, xp_awarded, idempotency_key)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [guestReference, definition.challenge_key, instance.instance_key, definition.rule_version, definition.xp_reward, idempotencyKey]
        )
        if (inserted.rows[0]) {
          await client.query(
            `UPDATE smokecraft_player_state SET xp_total = xp_total + $2, last_synced_at = now(), updated_at = now() WHERE guest_reference = $1`,
            [guestReference, definition.xp_reward]
          )
          xpAwarded = definition.xp_reward
          rewardGranted = true
        }
      } catch (err) {
        if (err.code !== UNIQUE_VIOLATION) throw err
        // Already rewarded by a concurrent request — real DB-enforced
        // idempotency, not an error.
      }
    }

    await client.query('COMMIT')

    // Canonical event trail — outside the transaction (matches the
    // established recordEvent()/reward pattern used throughout this
    // codebase), each independently idempotent via its own key.
    const scoreResult = { met: true, progress, targetValue: definition.target_value }
    const rewardResult = { xpAwarded, granted: rewardGranted }
    await recordChallengeEvent({
      guestReference, sourceScreen: 'ChallengeHub', sourceRoute: '/smokecraft/challenge-hub',
      eventType: 'challenge_submitted', challengeId: definition.challenge_key, attemptId: instance.instance_key,
      evidenceReference: completedEvent.id, ruleId: definition.requirement_type, ruleVersion: definition.rule_version,
      idempotencyKey: `challenge-submitted-canonical-${guestReference}-${instance.instance_key}`,
    })
    await recordChallengeEvent({
      guestReference, sourceScreen: 'ChallengeHub', sourceRoute: '/smokecraft/challenge-hub',
      eventType: 'challenge_scored', challengeId: definition.challenge_key, attemptId: instance.instance_key,
      evidenceReference: completedEvent.id, ruleId: definition.requirement_type, ruleVersion: definition.rule_version,
      scoreResult,
      idempotencyKey: `challenge-scored-canonical-${guestReference}-${instance.instance_key}`,
    })
    await recordChallengeEvent({
      guestReference, sourceScreen: 'ChallengeHub', sourceRoute: '/smokecraft/challenge-hub',
      eventType: 'challenge_completed', challengeId: definition.challenge_key, attemptId: instance.instance_key,
      evidenceReference: completedEvent.id, ruleId: definition.requirement_type, ruleVersion: definition.rule_version,
      scoreResult, rewardResult,
      idempotencyKey: `challenge-completed-canonical-${guestReference}-${instance.instance_key}`,
    })

    return learnerState
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

// Full read-model for the hub: resolves both current instances, computes
// real time status and real learner state for each — never trusts
// anything the client sends.
export async function getHub(guestReference) {
  const db = getDb()
  const definitions = await getDefinitions()
  const serverNow = new Date()
  const results = []

  for (const definition of definitions) {
    const instance = await resolveCurrentInstance(definition.challenge_key, definition)
    const timeStatus = computeTimeStatus(instance, serverNow)

    const { rows: stateRows } = await db.query(
      `SELECT * FROM smokecraft_challenge_learner_state WHERE guest_reference = $1 AND challenge_instance_key = $2`,
      [guestReference, instance.instance_key]
    )
    let learnerState = stateRows[0] || null

    let progress = learnerState?.progress_value ?? 0
    let missingRequirements = []

    if (timeStatus === 'active') {
      const evalResult = await evaluateProgress(db, guestReference, definition, instance)
      progress = evalResult.progress
      if (!evalResult.met) missingRequirements = [`Need ${definition.requirement_config.minDistinctEventTypes || definition.target_value} distinct activities this period — currently ${progress}`]

      if (learnerState && learnerState.participation_state !== 'completed' && evalResult.met) {
        const completed = await completeChallengeAndAward(db, guestReference, definition, instance, progress)
        learnerState = completed || learnerState
      } else if (learnerState && learnerState.participation_state !== 'completed') {
        await db.query(
          `UPDATE smokecraft_challenge_learner_state SET progress_value = $1, updated_at = now()
           WHERE guest_reference = $2 AND challenge_instance_key = $3`,
          [progress, guestReference, instance.instance_key]
        )
        learnerState.progress_value = progress
      }
    } else if (timeStatus === 'expired' && learnerState && learnerState.participation_state !== 'completed') {
      await db.query(
        `UPDATE smokecraft_challenge_learner_state SET participation_state = 'expired', updated_at = now()
         WHERE guest_reference = $1 AND challenge_instance_key = $2 AND participation_state != 'completed'`,
        [guestReference, instance.instance_key]
      )
      learnerState.participation_state = 'expired'
    }

    const participationState = learnerState
      ? learnerState.participation_state
      : (timeStatus === 'active' ? 'available' : timeStatus === 'expired' ? 'expired' : 'available')

    results.push({
      definition, instance, timeStatus, learnerState, participationState, progress, missingRequirements,
      serverNow,
    })
  }

  return results
}

// Single-challenge read — reuses the same live evaluation as getHub()
// rather than duplicating the rule engine.
export async function getChallenge(guestReference, challengeKey) {
  const all = await getHub(guestReference)
  const found = all.find(r => r.definition.challenge_key === challengeKey)
  if (!found) throw new ChallengeHubError('challenge_not_found')
  return found
}

// Starting — idempotent, never completes, never awards.
export async function startChallenge(guestReference, challengeKey) {
  const db = getDb()
  const { rows: defRows } = await db.query(`SELECT * FROM smokecraft_challenge_definitions WHERE challenge_key = $1 AND active = true`, [challengeKey])
  const definition = defRows[0]
  if (!definition) throw new ChallengeHubError('challenge_not_found')

  const instance = await resolveCurrentInstance(challengeKey, definition)
  const timeStatus = computeTimeStatus(instance, new Date())
  if (timeStatus !== 'active') throw new ChallengeHubError(`challenge_not_available:${timeStatus}`)

  const idempotencyKey = `challenge-start-${guestReference}-${instance.instance_key}`
  const { rows } = await db.query(
    `INSERT INTO smokecraft_challenge_learner_state
       (guest_reference, challenge_instance_key, participation_state, target_value_snapshot, started_at, idempotency_key)
     VALUES ($1,$2,'in_progress',$3,now(),$4)
     ON CONFLICT (guest_reference, challenge_instance_key) DO UPDATE SET updated_at = now()
     RETURNING *`,
    [guestReference, instance.instance_key, definition.target_value, idempotencyKey]
  )
  await recordEvent({
    guestReference, sourceScreen: 'ChallengeHub', sourceRoute: '/smokecraft/challenge-hub',
    eventType: 'challenge_started',
    payload: { challengeKey, instanceKey: instance.instance_key },
    idempotencyKey: `challenge-start-event-${guestReference}-${instance.instance_key}`,
  })
  await recordChallengeEvent({
    guestReference, sourceScreen: 'ChallengeHub', sourceRoute: '/smokecraft/challenge-hub',
    eventType: 'challenge_started', challengeId: challengeKey, attemptId: instance.instance_key,
    ruleId: definition.requirement_type, ruleVersion: definition.rule_version,
    idempotencyKey: `challenge-started-canonical-${guestReference}-${instance.instance_key}`,
  })
  return rows[0]
}
