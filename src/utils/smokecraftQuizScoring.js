/**
 * smokecraftQuizScoring.js
 *
 * Pure, dependency-free question-correctness logic — shared verbatim
 * between the client (src/components/smokecraft/KnowledgeCheck.jsx, for
 * immediate per-question visual feedback) and the server
 * (server/services/smokecraft/quizScoringService.js, the only place a
 * quiz result is actually trusted for a reward). Extracted in Holistic
 * Fix 5A-2 so the server never has to trust a client-submitted
 * "correct"/"score" value — it re-derives it from the same rule this
 * file encodes, against the same question data.
 */

export function isQuestionCorrect(question, response) {
  switch (question.type) {
    case 'multiple-choice':
    case 'true-false':
    case 'image-id':
      return response === question.correctAnswer
    case 'multi-select': {
      const a = [...(response || [])].sort()
      const b = [...(question.correctAnswers || [])].sort()
      return a.length === b.length && a.every((v, i) => v === b[i])
    }
    case 'ordering':
      return Array.isArray(response) && Array.isArray(question.correctOrder)
        && response.length === question.correctOrder.length
        && response.every((v, i) => v === question.correctOrder[i])
    case 'matching':
      return Array.isArray(question.pairs)
        && question.pairs.every(p => (response || {})[p.left] === p.right)
    case 'fill-blank':
      return (question.accepted || []).some(a => a.trim().toLowerCase() === String(response || '').trim().toLowerCase())
    default:
      return false
  }
}

/** Scores a full set of responses against a question set. Never trusts a client-submitted score. */
export function scoreQuestionSet(questions, responsesByQuestionId) {
  let score = 0
  const perQuestion = {}
  for (const q of questions) {
    const response = responsesByQuestionId ? responsesByQuestionId[q.id] : undefined
    const correct = isQuestionCorrect(q, response)
    perQuestion[q.id] = { correct }
    if (correct) score += 1
  }
  return { score, total: questions.length, perQuestion }
}
