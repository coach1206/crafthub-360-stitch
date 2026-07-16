import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { getKnowledgeCheckSet, QUESTION_TYPES } from '../../data/knowledgeCheckQuestions.js'
import { getSessionRewards } from '../../constants/smokecraftRewards.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'
const GREEN     = '#7fbf7f'
const RED       = 'rgba(229,170,100,0.9)'

function shuffleSeeded(arr) {
  // Deterministic-enough shuffle for a stable per-mount starting order —
  // not cryptographic, just avoids always presenting items pre-sorted.
  return [...arr].sort(() => 0.5 - Math.random())
}

function isCorrect(question, response) {
  switch (question.type) {
    case QUESTION_TYPES.MULTIPLE_CHOICE:
    case QUESTION_TYPES.TRUE_FALSE:
    case QUESTION_TYPES.IMAGE_ID:
      return response === question.correctAnswer
    case QUESTION_TYPES.MULTI_SELECT: {
      const a = [...(response || [])].sort()
      const b = [...(question.correctAnswers || [])].sort()
      return a.length === b.length && a.every((v, i) => v === b[i])
    }
    case QUESTION_TYPES.ORDERING:
      return Array.isArray(response) && response.length === question.correctOrder.length
        && response.every((v, i) => v === question.correctOrder[i])
    case QUESTION_TYPES.MATCHING:
      return question.pairs.every(p => (response || {})[p.left] === p.right)
    case QUESTION_TYPES.FILL_BLANK:
      return (question.accepted || []).some(a => a.trim().toLowerCase() === (response || '').trim().toLowerCase())
    default:
      return false
  }
}

function QuestionBody({ question, response, setResponse, submitted }) {
  const disabled = submitted

  if (question.type === QUESTION_TYPES.MULTIPLE_CHOICE || question.type === QUESTION_TYPES.TRUE_FALSE || question.type === QUESTION_TYPES.IMAGE_ID) {
    return (
      <div role="radiogroup" aria-label={question.prompt} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.choices.map(c => {
          const active = response === c.id
          const showCorrect = submitted && c.id === question.correctAnswer
          const showWrong = submitted && active && c.id !== question.correctAnswer
          return (
            <button
              key={c.id} type="button" role="radio" aria-checked={active}
              disabled={disabled}
              onClick={() => { triggerHaptic('light'); setResponse(c.id) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${showCorrect ? GREEN : showWrong ? RED : active ? GOLD : BORDER}`,
                background: active ? 'rgba(233,193,118,0.1)' : 'transparent',
                color: CREAM, fontFamily: 'Georgia, serif', fontSize: 13,
                cursor: disabled ? 'default' : 'pointer', outline: 'none', minHeight: 44,
              }}
            >
              {question.type === QUESTION_TYPES.IMAGE_ID && (
                <span aria-hidden="true" style={{
                  width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                  background: c.swatch || 'rgba(233,193,118,0.2)',
                  border: `1px solid ${BORDER}`,
                }} />
              )}
              <span>{c.label}</span>
              {showCorrect && <span aria-hidden="true" style={{ marginLeft: 'auto', color: GREEN }}>✓</span>}
              {showWrong && <span aria-hidden="true" style={{ marginLeft: 'auto', color: RED }}>✗</span>}
            </button>
          )
        })}
      </div>
    )
  }

  if (question.type === QUESTION_TYPES.MULTI_SELECT) {
    const selected = response || []
    return (
      <div role="group" aria-label={question.prompt} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {question.choices.map(c => {
          const active = selected.includes(c.id)
          const isRight = (question.correctAnswers || []).includes(c.id)
          const showState = submitted && ((active && isRight) ? 'right' : (active && !isRight) ? 'wrong' : (!active && isRight) ? 'missed' : null)
          return (
            <button
              key={c.id} type="button" role="checkbox" aria-checked={active}
              disabled={disabled}
              onClick={() => { triggerHaptic('light'); setResponse(active ? selected.filter(x => x !== c.id) : [...selected, c.id]) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${showState === 'right' ? GREEN : showState === 'wrong' ? RED : showState === 'missed' ? GOLD_DIM : active ? GOLD : BORDER}`,
                background: active ? 'rgba(233,193,118,0.1)' : 'transparent',
                color: CREAM, fontFamily: 'Georgia, serif', fontSize: 13,
                cursor: disabled ? 'default' : 'pointer', outline: 'none', minHeight: 44,
              }}
            >
              <span aria-hidden="true">{active ? '☑' : '☐'}</span>
              <span>{c.label}</span>
            </button>
          )
        })}
      </div>
    )
  }

  if (question.type === QUESTION_TYPES.ORDERING) {
    const order = response || question.items
    function move(i, dir) {
      if (disabled) return
      const next = [...order]
      const j = i + dir
      if (j < 0 || j >= next.length) return
      ;[next[i], next[j]] = [next[j], next[i]]
      setResponse(next)
    }
    return (
      <ol aria-label={question.prompt} style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {order.map((item, i) => (
          <li key={item} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
            border: `1.5px solid ${BORDER}`, borderRadius: 10, color: CREAM, fontSize: 13,
          }}>
            <span style={{ color: GOLD_DIM, width: 18 }}>{i + 1}.</span>
            <span style={{ flex: 1 }}>{item}</span>
            <button type="button" aria-label={`Move "${item}" up`} disabled={disabled || i === 0} onClick={() => move(i, -1)}
              style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 6, color: GOLD, cursor: disabled ? 'default' : 'pointer', minWidth: 32, minHeight: 32 }}>↑</button>
            <button type="button" aria-label={`Move "${item}" down`} disabled={disabled || i === order.length - 1} onClick={() => move(i, 1)}
              style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 6, color: GOLD, cursor: disabled ? 'default' : 'pointer', minWidth: 32, minHeight: 32 }}>↓</button>
          </li>
        ))}
      </ol>
    )
  }

  if (question.type === QUESTION_TYPES.MATCHING) {
    const pairs = response || {}
    const [pendingLeft, setPendingLeft] = useState(null)
    const rightOptions = question.pairs.map(p => p.right)
    return (
      <div aria-label={question.prompt} style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {question.pairs.map(p => (
            <button
              key={p.left} type="button" disabled={disabled}
              aria-pressed={pendingLeft === p.left}
              onClick={() => setPendingLeft(p.left)}
              style={{
                padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                border: `1.5px solid ${pairs[p.left] ? GOLD : pendingLeft === p.left ? GOLD_DIM : BORDER}`,
                background: pendingLeft === p.left ? 'rgba(233,193,118,0.12)' : 'transparent',
                color: CREAM, fontSize: 12, fontFamily: 'Georgia, serif', cursor: disabled ? 'default' : 'pointer',
              }}
            >
              {p.left}{pairs[p.left] ? ` → ${pairs[p.left]}` : ''}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rightOptions.map(r => (
            <button
              key={r} type="button" disabled={disabled || !pendingLeft}
              onClick={() => { setResponse({ ...pairs, [pendingLeft]: r }); setPendingLeft(null) }}
              style={{
                padding: '8px 10px', borderRadius: 8, textAlign: 'left',
                border: `1.5px solid ${BORDER}`, background: 'transparent',
                color: 'rgba(229,226,225,0.75)', fontSize: 12, fontFamily: 'Georgia, serif',
                cursor: (disabled || !pendingLeft) ? 'default' : 'pointer', opacity: (disabled || !pendingLeft) ? 0.5 : 1,
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (question.type === QUESTION_TYPES.FILL_BLANK) {
    return (
      <label style={{ display: 'block' }}>
        <span style={{ display: 'block', fontSize: 11, color: GOLD_DIM, marginBottom: 4 }}>Your answer</span>
        <input
          type="text" disabled={disabled} value={response || ''}
          onChange={e => setResponse(e.target.value)}
          aria-label="Fill in the blank answer"
          style={{
            width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${BORDER}`, borderRadius: 8, color: CREAM, fontSize: 14,
            padding: '10px 12px', fontFamily: 'Georgia, serif', outline: 'none',
          }}
        />
      </label>
    )
  }

  return null
}

function hasResponse(question, response) {
  switch (question.type) {
    case QUESTION_TYPES.MULTI_SELECT: return (response || []).length > 0
    case QUESTION_TYPES.ORDERING: return Array.isArray(response)
    case QUESTION_TYPES.MATCHING: return response && Object.keys(response).length === question.pairs.length
    case QUESTION_TYPES.FILL_BLANK: return !!(response || '').trim()
    default: return response != null
  }
}

/**
 * Reusable Knowledge Check / Text Quiz module (Package O).
 *
 * Props:
 *   moduleId          — key into KNOWLEDGE_CHECK_SETS (src/data/knowledgeCheckQuestions.js)
 *   allowSkip         — whether Skip is offered per-question (default true)
 *   completionStepId  — optional existing SESSION_REWARDS id; XP is only ever
 *                        awarded via the existing awardSessionRewards() rule
 *                        for this id — never a fabricated quiz-specific amount,
 *                        and never awarded if no such rule already exists.
 *   onComplete(result) — optional callback fired once, on first completion.
 */
export default function KnowledgeCheck({ moduleId, allowSkip = true, completionStepId, onComplete }) {
  const { session, update, addXP } = useGuestSession()
  const set = useMemo(() => getKnowledgeCheckSet(moduleId), [moduleId])

  const [phase, setPhase] = useState('loading') // loading | error | in-progress | completed
  const [order, setOrder] = useState([])
  const [index, setIndex] = useState(0)
  const [response, setResponse] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [results, setResults] = useState({}) // { [questionId]: { correct, skipped } }
  const [retryCount, setRetryCount] = useState(0)

  const stored = session?.smokeCraft?.knowledgeChecks?.[moduleId] || null
  const xpRule = completionStepId ? getSessionRewards(completionStepId) : null
  // Tracks whether XP has already been awarded for this module (from a prior
  // persisted completion, or from a completion earlier in this mount) so a
  // Retry-and-recomplete never awards the same existing rule's XP twice.
  const xpAwardedRef = useRef(!!stored?.completedAt)

  useEffect(() => {
    try {
      if (!set) { setPhase('error'); return }
      if (stored?.completedAt) {
        setPhase('completed')
        return
      }
      const t = setTimeout(() => {
        setOrder(shuffleSeeded(set.questions.map(q => q.id)))
        setPhase('in-progress')
      }, 150)
      return () => clearTimeout(t)
    } catch {
      setPhase('error')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId])

  function handleRetry() {
    setPhase('loading')
    setResults({})
    setIndex(0)
    setResponse(null)
    setSubmitted(false)
    setRetryCount(c => c + 1)
    setTimeout(() => {
      setOrder(shuffleSeeded(set.questions.map(q => q.id)))
      setPhase('in-progress')
    }, 150)
  }

  const currentQuestion = set?.questions.find(q => q.id === order[index]) || null

  function handleSubmitAnswer() {
    if (!currentQuestion) return
    triggerHaptic(isCorrect(currentQuestion, response) ? 'medium' : 'light')
    setSubmitted(true)
    setResults(prev => ({ ...prev, [currentQuestion.id]: { correct: isCorrect(currentQuestion, response), skipped: false } }))
  }

  function handleRetryQuestion() {
    setSubmitted(false)
    setResponse(null)
  }

  const finishQuiz = useCallback((finalResults) => {
    const total = set.questions.length
    const score = Object.values(finalResults).filter(r => r.correct).length
    const skippedCount = Object.values(finalResults).filter(r => r.skipped).length
    const completedAt = Date.now()

    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        knowledgeChecks: {
          ...(prev.smokeCraft?.knowledgeChecks || {}),
          [moduleId]: { score, total, skippedCount, retryCount, completedAt },
        },
      },
    }))

    // Reuses an existing SESSION_REWARDS XP value verbatim when the caller
    // points this Knowledge Check at a real, already-configured rule — never
    // a fabricated quiz-specific amount, and never awarded more than once
    // (guarded by xpAwardedRef, independent of the numbered session's own
    // completedSteps ledger, so completing a quiz never falsely marks an
    // unrelated spine session as complete).
    if (xpRule && !xpAwardedRef.current) {
      addXP(xpRule.xp)
      xpAwardedRef.current = true
    }

    setPhase('completed')
    if (onComplete) onComplete({ score, total, skippedCount })
  }, [set, moduleId, retryCount, xpRule, addXP, update, onComplete])

  function goNext() {
    const nextResults = submitted ? results : { ...results, [currentQuestion.id]: { correct: false, skipped: true } }
    if (!submitted) setResults(nextResults)
    if (index + 1 >= order.length) {
      finishQuiz(nextResults)
      return
    }
    setIndex(i => i + 1)
    setResponse(null)
    setSubmitted(false)
  }

  function handleSkip() {
    triggerHaptic('light')
    const nextResults = { ...results, [currentQuestion.id]: { correct: false, skipped: true } }
    setResults(nextResults)
    if (index + 1 >= order.length) {
      finishQuiz(nextResults)
      return
    }
    setIndex(i => i + 1)
    setResponse(null)
    setSubmitted(false)
  }

  if (phase === 'loading') {
    return (
      <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <div aria-hidden="true" style={{ width: 24, height: 24, margin: '0 auto 10px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'kc-spin 0.9s linear infinite' }} />
        <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.7)' }}>Loading Knowledge Check…</p>
        <style>{'@keyframes kc-spin { to { transform: rotate(360deg); } }'}</style>
      </div>
    )
  }

  if (phase === 'error' || !set) {
    return (
      <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
        <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(229,170,100,0.9)' }}>
          {set ? 'Something went wrong loading this Knowledge Check.' : `No Knowledge Check is configured for "${moduleId}" yet.`}
        </p>
        {set && (
          <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
            Retry
          </button>
        )}
      </div>
    )
  }

  if (phase === 'completed') {
    const summary = stored?.completedAt ? stored : { score: Object.values(results).filter(r => r.correct).length, total: set.questions.length, skippedCount: Object.values(results).filter(r => r.skipped).length }
    return (
      <div data-testid="knowledge-check-completed" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>{set.title} — Complete</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: CREAM, marginBottom: 6 }}>{summary.score}/{summary.total} correct</div>
        {summary.skippedCount > 0 && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginBottom: 6 }}>{summary.skippedCount} question{summary.skippedCount === 1 ? '' : 's'} skipped</div>}
        <div style={{ fontSize: 12, color: xpRule ? GOLD : 'rgba(229,226,225,0.4)', marginBottom: 14, fontStyle: xpRule ? 'normal' : 'italic' }}>
          {xpRule ? `+${xpRule.xp} XP earned` : 'No XP configured for this Knowledge Check yet.'}
        </div>
        <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
          Retry Quiz
        </button>
      </div>
    )
  }

  // in-progress
  const progressPct = Math.round(((index) / order.length) * 100)
  return (
    <div data-testid="knowledge-check" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>{set.title}</div>
      <div role="progressbar" aria-valuenow={index + 1} aria-valuemin={1} aria-valuemax={order.length} aria-label="Knowledge Check progress" style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', marginBottom: 4 }}>Question {index + 1} of {order.length}</div>
        <div style={{ height: 4, background: 'rgba(233,193,118,0.15)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: GOLD, borderRadius: 2 }} />
        </div>
      </div>

      <p style={{ fontSize: 15, color: CREAM, marginBottom: 14 }}>{currentQuestion.prompt}</p>

      <QuestionBody question={currentQuestion} response={response} setResponse={setResponse} submitted={submitted} />

      {submitted && (
        <div role="status" aria-live="polite" style={{ marginTop: 14, padding: 12, borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: `1px solid ${isCorrect(currentQuestion, response) ? GREEN : RED}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: isCorrect(currentQuestion, response) ? GREEN : RED, marginBottom: 4 }}>
            {isCorrect(currentQuestion, response) ? 'Correct' : 'Not quite'}
          </div>
          <p style={{ margin: '0 0 4px', fontSize: 12, color: 'rgba(229,226,225,0.8)' }}>{currentQuestion.explanation}</p>
          {currentQuestion.reference && <p style={{ margin: 0, fontSize: 11, color: GOLD_DIM }}>{currentQuestion.reference}</p>}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
        {!submitted && (
          <button
            type="button" disabled={!hasResponse(currentQuestion, response)}
            onClick={handleSubmitAnswer}
            style={{
              background: hasResponse(currentQuestion, response) ? GOLD : 'rgba(233,193,118,0.2)',
              border: 'none', borderRadius: 20, color: '#0a0603', fontFamily: 'Georgia, serif',
              fontWeight: 700, fontSize: 13, padding: '10px 18px',
              cursor: hasResponse(currentQuestion, response) ? 'pointer' : 'not-allowed', outline: 'none', minHeight: 44,
            }}
          >
            Submit Answer
          </button>
        )}
        {submitted && !isCorrect(currentQuestion, response) && (
          <button type="button" onClick={handleRetryQuestion} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '10px 18px', cursor: 'pointer', outline: 'none', minHeight: 44 }}>
            Retry Question
          </button>
        )}
        {submitted && (
          <button type="button" onClick={goNext} style={{ background: GOLD, border: 'none', borderRadius: 20, color: '#0a0603', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 13, padding: '10px 18px', cursor: 'pointer', outline: 'none', minHeight: 44 }}>
            {index + 1 >= order.length ? 'Finish' : 'Next →'}
          </button>
        )}
        {!submitted && allowSkip && (
          <button type="button" onClick={handleSkip} style={{ background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 20, color: 'rgba(229,226,225,0.6)', fontFamily: 'Georgia, serif', fontSize: 12, padding: '10px 16px', cursor: 'pointer', outline: 'none', minHeight: 44 }}>
            Skip
          </button>
        )}
      </div>
    </div>
  )
}
