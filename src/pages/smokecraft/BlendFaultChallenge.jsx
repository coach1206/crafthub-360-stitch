import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import DynamicMentorPanel from '../../components/smokecraft/DynamicMentorPanel.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import * as api from '../../services/smokecraft/blendFaultApiClient.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

export default function BlendFaultChallenge() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | ready | error | offline
  const [assessment, setAssessment] = useState(null)
  const [attempt, setAttempt] = useState(null)
  const [answers, setAnswers] = useState({}) // questionKey -> selected option
  const [stepIndex, setStepIndex] = useState(0)
  const [scored, setScored] = useState(null) // { attempt, answers } after submission
  const [history, setHistory] = useState([])
  const [showHistory, setShowHistory] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  async function load() {
    setStatus('loading')
    const res = await api.getAssessment()
    if (!res.ok) { setStatus(res.error === 'offline' ? 'offline' : 'error'); return }
    setAssessment(res)
    if (res.activeAttempt) {
      setAttempt(res.activeAttempt)
    } else if (res.mostRecentAttempt && res.mostRecentAttempt.status !== 'in_progress') {
      // Re-hydrate the last scored result so it survives a refresh
      // instead of silently disappearing.
      const detail = await api.getAttempt(res.mostRecentAttempt.attemptId)
      if (detail.ok) {
        setAttempt(detail.attempt)
        setScored({ attempt: detail.attempt, answers: detail.answers })
      }
    }
    setStatus('ready')
  }

  useEffect(() => { load() }, [])

  async function handleStart() {
    triggerHaptic('medium')
    const res = await api.startAttempt()
    if (res.ok) {
      setAttempt(res.attempt)
      setAnswers({})
      setStepIndex(0)
      setScored(null)
    }
  }

  function selectAnswer(questionKey, value) {
    triggerHaptic('light')
    setAnswers(prev => ({ ...prev, [questionKey]: value }))
  }

  async function handleSubmit() {
    if (!assessment || !attempt) return
    triggerHaptic('medium')
    setSubmitting(true)
    const payload = assessment.questions.map(q => ({ questionKey: q.questionKey, answer: answers[q.questionKey] }))
    const res = await api.submitAttempt(attempt.attemptId, payload)
    setSubmitting(false)
    if (res.ok) {
      setScored(res)
      setAttempt(res.attempt)
    }
  }

  async function loadHistory() {
    const res = await api.getHistory()
    if (res.ok) { setHistory(res.attempts); setShowHistory(true) }
  }

  const questions = assessment?.questions || []
  const step = questions[stepIndex]
  const isLastStep = stepIndex === questions.length - 1
  const hasAnsweredCurrent = step && !!answers[step.questionKey]
  const isScoredView = attempt && attempt.status !== 'in_progress'

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto', paddingBottom: 100 }}>
        <button type="button" onClick={() => { triggerHaptic('light'); navigate('/smokecraft/challenge-hub') }}
          style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>
          ← Back to Challenge Hub
        </button>

        {isOffline && <div role="status" style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginBottom: 10 }}>Offline — showing your last loaded state.</div>}

        {status === 'loading' && (
          <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
            <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'sc-spin-bf 0.9s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading Blend Fault Identification…</p>
            <style>{'@keyframes sc-spin-bf { to { transform: rotate(360deg); } }'}</style>
          </div>
        )}

        {(status === 'error' || status === 'offline') && (
          <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
            <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>
              {status === 'offline' ? "You're offline — can't load this assessment right now." : 'Something went wrong loading this assessment.'}
            </p>
            <button type="button" onClick={load} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', minHeight: 40 }}>
              Retry
            </button>
          </div>
        )}

        {status === 'ready' && questions.length === 0 && (
          <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
            No Blend Fault Identification questions are configured yet.
          </div>
        )}

        {status === 'ready' && questions.length > 0 && (
          <>
            <h1 style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: GOLD, margin: '0 0 6px' }}>{assessment.title}</h1>
            <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)', margin: '0 0 16px' }}>{assessment.educationalPurpose}</p>

            {!attempt && (
              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 24, textAlign: 'center' }}>
                <p style={{ fontSize: 13, margin: '0 0 14px' }}>{questions.length} questions · Pass threshold {assessment.passThresholdPercent}%</p>
                {assessment.hasPassed && <p style={{ fontSize: 12, color: '#7fd0a3', margin: '0 0 14px' }}>You have already passed this assessment. Starting again begins a new, separate attempt.</p>}
                <button type="button" onClick={handleStart}
                  style={{ minHeight: 48, padding: '12px 24px', borderRadius: 24, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, background: GOLD, color: '#241605' }}>
                  {assessment.attemptCount > 0 ? 'Start New Attempt' : 'Start Assessment'}
                </button>
                {assessment.attemptCount > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <button type="button" onClick={loadHistory} style={{ background: 'transparent', border: 'none', color: 'rgba(229,226,225,0.6)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                      View attempt history
                    </button>
                  </div>
                )}
              </div>
            )}

            {attempt && !isScoredView && step && (
              <>
                <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 16 }}>
                  <img src={SC_ASSETS[step.assetReference]} alt={`Blend Fault Identification — ${step.prompt}`} style={{ width: '100%', display: 'block' }} />
                </div>
                <div style={{ fontSize: 11, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                  Question {stepIndex + 1} of {questions.length}
                </div>
                <h2 style={{ fontSize: 'clamp(16px,2vw,20px)', color: GOLD, margin: '0 0 6px' }}>{step.prompt}</h2>
                <p style={{ fontSize: 12.5, color: 'rgba(229,226,225,0.6)', margin: '0 0 14px' }}>{step.scenarioDescription}</p>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }} role="radiogroup" aria-label={step.prompt}>
                  {step.answerOptions.map(label => {
                    const active = answers[step.questionKey] === label
                    return (
                      <button key={label} type="button" role="radio" aria-checked={active}
                        onClick={() => selectAnswer(step.questionKey, label)}
                        style={{
                          minHeight: 48, padding: '10px 16px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                          border: `1.5px solid ${active ? GOLD : BORDER}`,
                          background: active ? 'rgba(233,193,118,0.14)' : 'transparent',
                          color: active ? GOLD : CREAM,
                        }}>
                        {label}
                      </button>
                    )
                  })}
                </div>

                <button type="button" disabled={!hasAnsweredCurrent || submitting}
                  onClick={() => { triggerHaptic('medium'); isLastStep ? handleSubmit() : setStepIndex(i => i + 1) }}
                  style={{ minHeight: 48, padding: '12px 24px', borderRadius: 24, border: 'none', cursor: (!hasAnsweredCurrent || submitting) ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 700, background: (!hasAnsweredCurrent || submitting) ? 'rgba(233,193,118,0.25)' : GOLD, color: '#241605' }}>
                  {submitting ? 'Scoring…' : isLastStep ? 'Submit My Answers' : 'Continue →'}
                </button>
              </>
            )}

            {attempt && isScoredView && scored && (
              <div style={{ background: GLASS, border: `1px solid ${scored.attempt.passFail === 'passed' ? '#7fd0a3' : 'rgba(229,170,100,0.6)'}`, borderRadius: 12, padding: 24 }}>
                <h2 style={{ fontSize: 18, color: GOLD, margin: '0 0 8px' }}>
                  {scored.attempt.passFail === 'passed' ? 'Assessment Passed' : 'Assessment Not Passed'}
                </h2>
                <p style={{ fontSize: 14, margin: '0 0 4px' }}>Score: {scored.attempt.scoreEarned} / {scored.attempt.scorePossible}</p>
                <p style={{ fontSize: 14, margin: '0 0 16px' }}>Percentage: {scored.attempt.percentage}% (pass threshold {assessment.passThresholdPercent}%)</p>

                <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                  {scored.answers.map(a => (
                    <div key={a.questionKey} style={{ border: `1px solid ${a.isCorrect ? 'rgba(127,208,163,0.4)' : 'rgba(229,170,100,0.4)'}`, borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 11, textTransform: 'uppercase', color: a.isCorrect ? '#7fd0a3' : 'rgba(229,170,100,0.85)', marginBottom: 4 }}>
                        {a.isCorrect ? 'Correct' : 'Incorrect'}
                      </div>
                      <p style={{ fontSize: 12.5, margin: '0 0 4px' }}>Your answer: {a.submittedAnswer}</p>
                      {!a.isCorrect && <p style={{ fontSize: 12.5, margin: '0 0 4px', color: '#7fd0a3' }}>Correct answer: {a.correctAnswer}</p>}
                      <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', margin: '0 0 4px' }}>{a.explanation}</p>
                      <p style={{ fontSize: 11.5, color: 'rgba(233,193,118,0.75)', margin: 0 }}>{a.educationalTakeaway}</p>
                    </div>
                  ))}
                </div>

                <p style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)', margin: '0 0 16px' }}>
                  XP is not yet approved for this assessment — completion is tracked and scored honestly regardless.
                </p>

                <button type="button" onClick={() => { setScored(null); handleStart() }}
                  style={{ minHeight: 48, padding: '12px 24px', borderRadius: 24, border: `1.5px solid ${GOLD}`, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, background: 'transparent', color: GOLD }}>
                  Start New Attempt
                </button>
                <div style={{ marginTop: 12 }}>
                  <button type="button" onClick={loadHistory} style={{ background: 'transparent', border: 'none', color: 'rgba(229,226,225,0.6)', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
                    View attempt history
                  </button>
                </div>
              </div>
            )}

            {showHistory && (
              <div style={{ marginTop: 20, background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18 }}>
                <h3 style={{ fontSize: 14, color: GOLD, margin: '0 0 10px' }}>Attempt History</h3>
                {history.length === 0 && <p style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>No attempts yet.</p>}
                {history.map(h => (
                  <div key={h.attemptId} style={{ fontSize: 12, padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}>
                    Attempt {h.attemptNumber}: {h.status === 'in_progress' ? 'In Progress' : `${h.passFail} (${h.percentage}%)`}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 20 }}>
          <DynamicMentorPanel guidance="A trained eye catches construction faults before they reach the humidor." />
        </div>
      </div>
    </div>
  )
}
