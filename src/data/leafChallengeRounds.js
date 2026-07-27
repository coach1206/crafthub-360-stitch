/**
 * leafChallengeRounds.js
 *
 * The 5-round leaf-identification answer key, extracted from
 * src/pages/smokecraft/LeafChallenge.jsx in Holistic Fix 5A-2 so the
 * server can score a submission against the same real answer key
 * instead of trusting a client-reported score. `order` is the
 * per-round choice set shown to the learner (kept here only for
 * reference/documentation — the server scores solely against
 * `correct`, never re-deriving or trusting a client-submitted score).
 */

export const LEAF_CHALLENGE_ROUNDS = [
  { correct: 'habano-colorado',   order: ['connecticut-shade', 'habano-colorado', 'sumatra-maduro',    'criollo-98']      },
  { correct: 'criollo-98',        order: ['criollo-98',        'broadleaf-maduro', 'corojo-rosado',     'sumatra-maduro']  },
  { correct: 'connecticut-shade', order: ['sumatra-maduro',    'criollo-98',       'connecticut-shade', 'corojo-rosado']   },
  { correct: 'sumatra-maduro',    order: ['habano-colorado',   'sumatra-maduro',   'connecticut-shade', 'broadleaf-maduro']},
  { correct: 'corojo-rosado',     order: ['criollo-98',        'connecticut-shade', 'broadleaf-maduro',  'corojo-rosado']  },
]

export function getLeafChallengeResultsData(score) {
  if (score === 5) return { headline: 'Perfect Palate',    sub: 'You identified every leaf without hesitation. The mark of a true Connoisseur.',      xp: 125, perfect: true }
  if (score >= 3) return { headline: 'Sharp Eye',          sub: 'A strong result. Your botanical instincts are developing into genuine expertise.',   xp: 100, perfect: false }
  if (score >= 1) return { headline: 'A Learning Journey', sub: 'Every expert started here. Return to the study session anytime to sharpen your eye.', xp: 75,  perfect: false }
  return              { headline: 'Keep Studying',          sub: 'The leaves will reveal themselves with time. Review the Leaf Education and try again.', xp: 75,  perfect: false }
}

/** Scores a submitted array of 5 leaf-id answers against the real answer key. Never trusts a client-submitted score. */
export function scoreLeafChallenge(answers) {
  const list = Array.isArray(answers) ? answers : []
  let score = 0
  for (let i = 0; i < LEAF_CHALLENGE_ROUNDS.length; i++) {
    if (list[i] === LEAF_CHALLENGE_ROUNDS[i].correct) score += 1
  }
  const result = getLeafChallengeResultsData(score)
  return { score, total: LEAF_CHALLENGE_ROUNDS.length, xp: result.xp, perfect: result.perfect }
}
