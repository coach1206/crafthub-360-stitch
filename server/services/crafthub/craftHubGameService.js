import { getDb } from '../../db/connection.js'

export const ACADEMIES = {
  pourcraft: {
    key: 'pourcraft',
    platformKey: 'pourcraft_360',
    name: 'PourCraft 360',
    lessons: [
      { key: 'pour-foundations', title: 'Pour Foundations', body: ['Measure consistently', 'Balance spirit, sweetness, acidity, dilution'], quiz: [{ q: 'What protects consistency behind the bar?', options: ['Free-pouring everything', 'Measured pours', 'Changing recipes each round'], answer: 1 }] },
      { key: 'classic-builds', title: 'Classic Builds', body: ['Build, shake, stir, and strain with purpose', 'Match technique to texture and dilution'], quiz: [{ q: 'Which technique is normally used when clarity and controlled dilution matter?', options: ['Stirring', 'Blending', 'Dry shaking every drink'], answer: 0 }] },
      { key: 'pairing-service', title: 'Pairing & Service', body: ['Match intensity, sweetness, acidity, aroma, and finish', 'Record guest preference signals'], quiz: [{ q: 'A good pairing should primarily account for?', options: ['Only color', 'Intensity and flavor structure', 'Glass price'], answer: 1 }] },
      { key: 'responsible-pour', title: 'Responsible Pour', body: ['Verify venue policy and age requirements', 'Use measured service and escalation procedures'], quiz: [{ q: 'When service eligibility is uncertain, what is the correct action?', options: ['Guess', 'Follow verification and venue policy', 'Ignore it'], answer: 1 }] },
    ],
  },
  beercraft: {
    key: 'beercraft',
    platformKey: 'beercraft_360',
    name: 'BeerCraft 360',
    lessons: [
      { key: 'beer-style', title: 'Beer Style Fundamentals', body: ['Recognize malt, hop, yeast, and fermentation signals', 'Separate style from brand'], quiz: [{ q: 'Which ingredient most directly contributes bitterness in many beers?', options: ['Hops', 'Water only', 'Glassware'], answer: 0 }] },
      { key: 'draft-quality', title: 'Draft Quality', body: ['Protect temperature, line cleanliness, and pressure', 'Use correct glassware and pour technique'], quiz: [{ q: 'A clean draft system primarily protects?', options: ['Flavor and dispense quality', 'Menu typography', 'Music volume'], answer: 0 }] },
      { key: 'flight-tasting', title: 'Flight Tasting', body: ['Taste from lighter to more intense styles', 'Capture aroma, body, bitterness, and finish'], quiz: [{ q: 'Why sequence a flight from lighter to more intense?', options: ['To reduce palate masking', 'To make pours warmer', 'No reason'], answer: 0 }] },
      { key: 'beer-pairing', title: 'Beer Pairing', body: ['Use contrast, complement, and intensity matching', 'Document preference for future recommendations'], quiz: [{ q: 'Pairing by intensity means?', options: ['Always choose the strongest beer', 'Avoid overwhelming either side', 'Match label colors'], answer: 1 }] },
    ],
  },
  winecraft: {
    key: 'winecraft',
    platformKey: 'winecraft_360',
    name: 'WineCraft 360',
    lessons: [
      { key: 'wine-structure', title: 'Wine Structure', body: ['Read acidity, tannin, alcohol, sweetness, and body', 'Separate structural traits from flavor notes'], quiz: [{ q: 'Tannin is most associated with which sensation?', options: ['Drying/astringency', 'Carbonation only', 'Saltiness'], answer: 0 }] },
      { key: 'tasting-method', title: 'Tasting Method', body: ['Observe, smell, taste, and assess finish', 'Record evidence instead of guessing quality'], quiz: [{ q: 'A structured tasting note should be based on?', options: ['Observed evidence', 'Bottle price alone', 'Popularity'], answer: 0 }] },
      { key: 'service-cellar', title: 'Service & Cellar', body: ['Protect storage temperature and bottle condition', 'Use service temperatures appropriate to style'], quiz: [{ q: 'Wine storage should prioritize?', options: ['Stable suitable conditions', 'Direct sunlight', 'Frequent temperature swings'], answer: 0 }] },
      { key: 'wine-pairing', title: 'Wine Pairing', body: ['Balance acidity, sweetness, tannin, body, and food intensity', 'Capture guest preference signals'], quiz: [{ q: 'When food is very rich, acidity can help by?', options: ['Refreshing the palate', 'Removing aroma', 'Increasing glass weight'], answer: 0 }] },
    ],
  },
}

const rankForXp = xp => xp >= 1200 ? 'Aficionado' : xp >= 700 ? 'Connoisseur' : xp >= 300 ? 'Enthusiast' : 'Novice'
const dbOrThrow = () => {
  const db = getDb()
  if (!db) throw Object.assign(new Error('database_unavailable'), { code: 'database_unavailable' })
  return db
}

export function getAcademy(academyKey) {
  return ACADEMIES[academyKey] || null
}

async function emitEvent(client, { participantRef, academyKey, eventType, entityKey, payload, idempotencyKey }) {
  await client.query(
    `INSERT INTO crafthub_game_events
      (participant_ref, academy_key, event_type, entity_key, payload, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [participantRef, academyKey, eventType, entityKey || null, payload || {}, idempotencyKey]
  )
  await client.query(
    `INSERT INTO novee_os_ecosystem_events
      (source_platform, source_module, participant_ref, event_type, entity_key, payload, idempotency_key)
     VALUES ('craft_hub_360',$1,$2,$3,$4,$5,$6)
     ON CONFLICT (idempotency_key) DO NOTHING`,
    [ACADEMIES[academyKey].platformKey, participantRef, eventType, entityKey || null, payload || {}, `novee:${idempotencyKey}`]
  )
}

async function ensureState(client, participantRef, academyKey) {
  await client.query(
    `INSERT INTO crafthub_game_player_state (participant_ref, academy_key)
     VALUES ($1,$2) ON CONFLICT (participant_ref, academy_key) DO NOTHING`,
    [participantRef, academyKey]
  )
}

export async function getState(participantRef, academyKey) {
  const academy = getAcademy(academyKey)
  if (!academy) return { ok: false, error: 'unknown_academy' }
  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensureState(client, participantRef, academyKey)
    const [state, completions, attempts, awards] = await Promise.all([
      client.query('SELECT * FROM crafthub_game_player_state WHERE participant_ref=$1 AND academy_key=$2', [participantRef, academyKey]),
      client.query('SELECT lesson_key, xp_awarded, completed_at FROM crafthub_game_completions WHERE participant_ref=$1 AND academy_key=$2 ORDER BY completed_at', [participantRef, academyKey]),
      client.query('SELECT lesson_key, score, total, passed, xp_awarded, created_at FROM crafthub_game_quiz_attempts WHERE participant_ref=$1 AND academy_key=$2 ORDER BY created_at', [participantRef, academyKey]),
      client.query('SELECT award_type, award_key, amount, created_at FROM crafthub_game_awards WHERE participant_ref=$1 AND academy_key=$2 ORDER BY created_at', [participantRef, academyKey]),
    ])
    await client.query('COMMIT')
    return { ok: true, academy, state: state.rows[0], completions: completions.rows, attempts: attempts.rows, awards: awards.rows }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally { client.release() }
}

export async function submitQuiz({ participantRef, academyKey, lessonKey, answers, idempotencyKey }) {
  const academy = getAcademy(academyKey)
  const lesson = academy?.lessons.find(l => l.key === lessonKey)
  if (!academy || !lesson) return { ok: false, error: 'unknown_lesson' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }

  const normalized = Array.isArray(answers) ? answers : []
  let score = 0
  lesson.quiz.forEach((q, i) => { if (Number(normalized[i]) === q.answer) score += 1 })
  const total = lesson.quiz.length
  const passed = total > 0 && (score / total) >= 0.70
  const xpAwarded = passed ? (score === total ? 125 : 100) : 0

  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensureState(client, participantRef, academyKey)
    const existing = await client.query(
      'SELECT * FROM crafthub_game_quiz_attempts WHERE participant_ref=$1 AND academy_key=$2 AND lesson_key=$3',
      [participantRef, academyKey, lessonKey]
    )
    if (existing.rows[0]) {
      await client.query('COMMIT')
      return { ok: true, alreadySubmitted: true, attempt: existing.rows[0] }
    }

    const inserted = await client.query(
      `INSERT INTO crafthub_game_quiz_attempts
       (participant_ref, academy_key, lesson_key, answers, score, total, passed, xp_awarded, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [participantRef, academyKey, lessonKey, answers || [], score, total, passed, xpAwarded, idempotencyKey]
    )
    if (xpAwarded > 0) {
      const updated = await client.query(
        `UPDATE crafthub_game_player_state
         SET xp_total=xp_total+$3, updated_at=NOW()
         WHERE participant_ref=$1 AND academy_key=$2 RETURNING xp_total`,
        [participantRef, academyKey, xpAwarded]
      )
      const rank = rankForXp(updated.rows[0].xp_total)
      await client.query(
        'UPDATE crafthub_game_player_state SET rank_label=$3 WHERE participant_ref=$1 AND academy_key=$2',
        [participantRef, academyKey, rank]
      )
    }
    await emitEvent(client, { participantRef, academyKey, eventType: 'quiz.submitted', entityKey: lessonKey, payload: { score, total, passed, xpAwarded }, idempotencyKey: `${idempotencyKey}:event` })
    await client.query('COMMIT')
    return { ok: true, alreadySubmitted: false, attempt: inserted.rows[0] }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    if (e.code === '23505') return submitQuiz({ participantRef, academyKey, lessonKey, answers, idempotencyKey: `${idempotencyKey}:retry` })
    throw e
  } finally { client.release() }
}

export async function completeLesson({ participantRef, academyKey, lessonKey, idempotencyKey }) {
  const academy = getAcademy(academyKey)
  const lesson = academy?.lessons.find(l => l.key === lessonKey)
  if (!academy || !lesson) return { ok: false, error: 'unknown_lesson' }
  if (!idempotencyKey) return { ok: false, error: 'idempotency_key_required' }

  const db = dbOrThrow()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    await ensureState(client, participantRef, academyKey)
    const passed = await client.query(
      `SELECT 1 FROM crafthub_game_quiz_attempts
       WHERE participant_ref=$1 AND academy_key=$2 AND lesson_key=$3 AND passed=TRUE`,
      [participantRef, academyKey, lessonKey]
    )
    if (!passed.rows.length) {
      await client.query('ROLLBACK')
      return { ok: false, error: 'passing_quiz_required' }
    }

    const existing = await client.query(
      'SELECT * FROM crafthub_game_completions WHERE participant_ref=$1 AND academy_key=$2 AND lesson_key=$3',
      [participantRef, academyKey, lessonKey]
    )
    if (existing.rows[0]) {
      await client.query('COMMIT')
      return { ok: true, alreadyCompleted: true, completion: existing.rows[0] }
    }

    const completionXp = 50
    const inserted = await client.query(
      `INSERT INTO crafthub_game_completions
       (participant_ref, academy_key, lesson_key, xp_awarded, idempotency_key)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [participantRef, academyKey, lessonKey, completionXp, idempotencyKey]
    )
    const state = await client.query(
      `UPDATE crafthub_game_player_state
       SET xp_total=xp_total+$3, updated_at=NOW()
       WHERE participant_ref=$1 AND academy_key=$2 RETURNING xp_total`,
      [participantRef, academyKey, completionXp]
    )
    await client.query(
      'UPDATE crafthub_game_player_state SET rank_label=$3 WHERE participant_ref=$1 AND academy_key=$2',
      [participantRef, academyKey, rankForXp(state.rows[0].xp_total)]
    )
    await client.query(
      `INSERT INTO crafthub_game_awards
       (participant_ref, academy_key, award_type, award_key, idempotency_key)
       VALUES ($1,$2,'badge',$3,$4)
       ON CONFLICT (participant_ref, academy_key, award_type, award_key) DO NOTHING`,
      [participantRef, academyKey, `${lessonKey}-complete`, `${idempotencyKey}:badge`]
    )

    const countResult = await client.query(
      'SELECT COUNT(*)::int AS count FROM crafthub_game_completions WHERE participant_ref=$1 AND academy_key=$2',
      [participantRef, academyKey]
    )
    if (countResult.rows[0].count >= academy.lessons.length) {
      await client.query(
        `INSERT INTO crafthub_game_awards
         (participant_ref, academy_key, award_type, award_key, idempotency_key)
         VALUES ($1,$2,'passport_stamp',$3,$4)
         ON CONFLICT (participant_ref, academy_key, award_type, award_key) DO NOTHING`,
        [participantRef, academyKey, `${academyKey}-academy-complete`, `${idempotencyKey}:academy-stamp`]
      )
    }

    await emitEvent(client, { participantRef, academyKey, eventType: 'lesson.completed', entityKey: lessonKey, payload: { xpAwarded: completionXp }, idempotencyKey: `${idempotencyKey}:event` })
    await client.query('COMMIT')
    return { ok: true, alreadyCompleted: false, completion: inserted.rows[0] }
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    throw e
  } finally { client.release() }
}
