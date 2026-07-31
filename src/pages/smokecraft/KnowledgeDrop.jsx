import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import SmokeCraftLessonInfoButton from '../../components/smokecraft/SmokeCraftLessonInfoButton.jsx'
import { getEducationalEnrichment } from '../../constants/smokecraftEducationalEnrichment.js'
import { TOTAL_SESSIONS, TOTAL_VISITS } from '../../constants/session.js'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const ENRICHMENT_15 = getEducationalEnrichment(15)

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

const TOPICS = [
  {
    id: 'tobacco',
    title: 'Tobacco',
    img: SC_ASSETS.knowledgeDropTobacco,
    body: 'Cigar tobacco is grown from broadleaf, corojo, criollo, and habano seed varieties, each cultivated for a specific role — wrapper, binder, or filler — within the finished blend.',
    quiz: {
      question: 'Which three roles does a cigar’s tobacco leaves typically fill?',
      options: ['Wrapper, Binder, Filler', 'Root, Stem, Leaf', 'Cap, Foot, Band'],
      answer: 0,
    },
  },
  {
    id: 'fermentation',
    title: 'Fermentation',
    img: SC_ASSETS.knowledgeDropFermentation,
    body: 'After harvest, tobacco is stacked in large piles (pilones) where natural heat and moisture trigger fermentation, breaking down ammonia and chlorophyll to develop flavor and reduce harshness.',
    quiz: {
      question: 'What does fermentation primarily reduce in raw tobacco leaf?',
      options: ['Sugar content', 'Ammonia and harshness', 'Leaf color'],
      answer: 1,
    },
  },
  {
    id: 'aging',
    title: 'Aging',
    img: SC_ASSETS.knowledgeDropAging,
    body: 'Rolled cigars are rested for weeks to years in temperature- and humidity-controlled rooms, allowing the blended tobaccos to marry and the flavor profile to smooth and deepen over time.',
    quiz: {
      question: 'What is the primary purpose of aging a rolled cigar?',
      options: ['To dry it out completely', 'To let blended tobaccos marry and smooth', 'To change the wrapper color'],
      answer: 1,
    },
  },
  {
    id: 'factory',
    title: 'Factory Story',
    img: SC_ASSETS.knowledgeDropFactory,
    body: 'Skilled torcedores hand-roll each cigar, bunching filler leaves, applying a binder, then wrapping the finished bunch — a craft passed down through apprenticeship, not automation.',
    quiz: {
      question: 'Who traditionally hand-rolls cigars in a factory?',
      options: ['Torcedores', 'Vintners', 'Curators'],
      answer: 0,
    },
  },
]

const ACTIVITY_KEY = 'knowledge-drop'
const REQUIRED_CHECKPOINTS = TOPICS.map(t => t.id)

export default function KnowledgeDrop({ onBack, onComplete } = {}) {
  const { awardSessionRewards, session, loadTastingDraft, saveTastingDraft, submitSelectionAttempt } = useGuestSession()
  const { isDemoMode } = useSmokeCraftProgress()
  const { journey, setKnowledgeDrop } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // Mentor Commentary (now built — Package I) must be completed first,
  // per the locked flow: Construction Check/Flavor Evolution -> Mentor
  // Commentary -> Knowledge Drop. Mirrors the Identity/Enroll and
  // cut-toast-light/lighting-tutorial sequential-gate pattern.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('mentor-commentary')) {
      navigate('/smokecraft/mentor-commentary', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Mark this screen as the guest's active position for Resume, exactly like
  // LightingTutorial.jsx's dedicated sessionStorage flag (Package E).
  useEffect(() => {
    try { sessionStorage.setItem('sc_active_screen', '/smokecraft/knowledge-drop') } catch {}
    return () => {
      try {
        if (sessionStorage.getItem('sc_active_screen') === '/smokecraft/knowledge-drop') {
          sessionStorage.removeItem('sc_active_screen')
        }
      } catch {}
    }
  }, [])

  const savedViewed = journey.knowledgeDrop?.viewedTopics || []
  const savedScore  = journey.knowledgeDrop?.quizScore ?? null

  const [topicId, setTopicId]     = useState(null)
  const [viewedTopics, setViewedTopics] = useState(() => new Set(savedViewed))
  const [imgStatus, setImgStatus] = useState('idle') // idle | loading | loaded | error
  const [quizOpen, setQuizOpen]   = useState(false)
  const [answers, setAnswers]     = useState({}) // { topicId: answerIndex }
  const [quizScore, setQuizScore] = useState(savedScore)

  // Required-Interaction Closure Package D: the optional practice quiz
  // above is now the REQUIRED interaction — the player must answer all
  // 4 topic quizzes and submit a final synthesis (which topic they
  // found most useful) before this session can complete. The server
  // holds its own copy of the answer key (KNOWLEDGE_DROP_ANSWERS,
  // selectionClassificationService.js) and grades independently — the
  // client's local topic.quiz.answer is used only for this immediate
  // in-page practice hint, never trusted for completion.
  const [phase, setPhase] = useState('loading')
  const [synthesis, setSynthesis] = useState(null)
  const [draftVersion, setDraftVersion] = useState(0)
  const [draftLocked, setDraftLocked] = useState(false)
  const [done, setDone] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const topic = topicId ? TOPICS.find(t => t.id === topicId) : null
  const allViewed = viewedTopics.size === TOPICS.length
  const allAnswered = REQUIRED_CHECKPOINTS.every(id => answers[id] !== undefined)

  useEffect(() => {
    let cancelled = false
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (cancelled) return
      if (!result.ok) { setPhase('error'); return }
      const d = result.draftData || {}
      if (d.checkpoints) setAnswers(d.checkpoints)
      if (d.synthesis) setSynthesis(d.synthesis)
      setDraftVersion(result.version || 0)
      setPhase('ready')
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadTastingDraft])

  function handleRetryLoad() {
    setPhase('loading')
    loadTastingDraft(ACTIVITY_KEY).then(result => {
      if (!result.ok) { setPhase('error'); return }
      setPhase('ready')
    })
  }

  useEffect(() => {
    if (viewedTopics.size > 0 || quizScore !== null) {
      setKnowledgeDrop({ viewedTopics: Array.from(viewedTopics), quizScore })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedTopics.size, quizScore])

  useEffect(() => {
    if (phase !== 'ready' || done || draftLocked) return
    const t = setTimeout(() => {
      saveTastingDraft(ACTIVITY_KEY, { checkpoints: answers, synthesis }, draftVersion).then(result => {
        if (result.alreadyCompleted) { setDraftLocked(true); return }
        if (result.conflict) { setDraftVersion(result.current.version); return }
        if (result.ok) setDraftVersion(result.current.version)
      })
    }, 900)
    return () => clearTimeout(t)
  }, [phase, answers, synthesis, done, draftVersion, draftLocked, saveTastingDraft])

  function selectTopic(id) {
    triggerHaptic('light')
    setTopicId(id)
    setImgStatus('loading')
    setQuizOpen(false)
    setFeedback(null)
    setViewedTopics(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  function submitQuizAnswer(index) {
    triggerHaptic('light')
    setAnswers(prev => ({ ...prev, [topic.id]: index }))
    if (index === topic.quiz.answer) {
      setQuizScore(prev => (prev || 0) + 1)
    }
  }

  async function handleContinue() {
    if (done) return
    if (!allAnswered) {
      setFeedback({ message: 'Answer the knowledge check for all 4 topics before continuing.' })
      return
    }
    if (!synthesis) {
      setFeedback({ message: 'Select which topic you found most useful.' })
      return
    }
    setDone(true)
    setKnowledgeDrop({
      viewedTopics: Array.from(viewedTopics),
      quizScore,
      completedAt: journey.knowledgeDrop?.completedAt || Date.now(),
    })

    const result = await submitSelectionAttempt(ACTIVITY_KEY, { checkpoints: answers, synthesis })
    if (!result.ok) {
      setDone(false)
      setFeedback({ message: 'Unable to submit right now. Please try again.' })
      return
    }
    if (!result.data.correct) {
      setDone(false)
      setFeedback({ message: 'One or more answers were incorrect. Review and try again.' })
      return
    }
    if (onComplete) {
      onComplete()
      return
    }
    awardSessionRewards('knowledge-drop')
    navigate('/smokecraft/final-third')
  }

  if (phase === 'loading') {
    return (
      <div role="status" aria-live="polite" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: NAVY_DEEP, color: 'rgba(229,226,225,0.7)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        Loading…
      </div>
    )
  }
  if (phase === 'error') {
    return (
      <div role="alert" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: NAVY_DEEP, color: 'rgba(233,193,118,0.85)', fontFamily: 'Georgia, serif', fontSize: 14 }}>
        <p style={{ margin: 0 }}>Something went wrong loading this session.</p>
        <button type="button" onClick={handleRetryLoad} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
          Retry
        </button>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `
        radial-gradient(ellipse at 20% -10%, rgba(233,193,118,0.10), transparent 55%),
        radial-gradient(ellipse at 100% 110%, ${WOOD_DIM}, transparent 60%),
        linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)
      `,
      fontFamily: 'Georgia, serif',
    }}>
      {/* Approved production visual, reused as a decorative header band —
          the per-topic images below (unchanged) remain the primary visual
          for each topic card. */}
      <div
        role="img"
        aria-label="SmokeCraft Knowledge Drop"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(90px,14vh,140px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.35), rgba(6,8,16,0.92)), url(${SC_ASSETS.knowledgeDrop})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          zIndex: 1,
        }}
      />

      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',
        zIndex: 3,
      }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: GOLD_DIM,
          letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          SmokeCraft 360 — Knowledge Drop
        </div>
        <h1 style={{
          margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700,
          color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15,
        }}>
          {topic ? topic.title : 'Choose a Topic'}
        </h1>

        {/* Live React zone: topic selection */}
        <div
          role="tablist"
          aria-label="Knowledge Drop topics"
          style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}
        >
          {TOPICS.map(t => {
            const active = topicId === t.id
            const viewed = viewedTopics.has(t.id)
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`${t.title}${viewed ? ' (viewed)' : ''}`}
                onClick={() => selectTopic(t.id)}
                style={{
                  minWidth: 44, minHeight: 40,
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1.5px solid ${active ? GOLD : viewed ? 'rgba(233,193,118,0.4)' : 'rgba(229,226,225,0.2)'}`,
                  background: active ? 'rgba(233,193,118,0.12)' : 'transparent',
                  color: active ? GOLD : viewed ? 'rgba(233,193,118,0.75)' : 'rgba(229,226,225,0.7)',
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(11px,1.2vw,13px)',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {viewed ? '✓ ' : ''}{t.title}
              </button>
            )
          })}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 6 }}>
          {viewedTopics.size} of {TOPICS.length} topics viewed{quizScore !== null ? ` · Quiz score: ${quizScore}` : ''}
        </div>
      </header>

      <main style={{
        position: 'absolute', top: 'clamp(160px,22vh,220px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Empty state */}
          {!topic && (
            <div style={{
              background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
              padding: 'clamp(24px,4vw,40px)', textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: 'clamp(14px,1.6vw,16px)', color: 'rgba(229,226,225,0.65)', lineHeight: 1.6 }}>
                Select a topic above to begin learning what shapes every cigar before it reaches you.
              </p>
            </div>
          )}

          {topic && (
            <>
              {/* Replaceable image zone — real load/error state */}
              <div
                aria-label={`${topic.title} reference image`}
                style={{
                  background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
                  minHeight: 'clamp(160px,26vh,260px)', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {imgStatus === 'error' ? (
                  <div style={{ padding: 24, textAlign: 'center' }}>
                    <span style={{ fontSize: 28, color: GOLD_DIM }} aria-hidden="true">⚠</span>
                    <p style={{ margin: '8px 0 0', fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>
                      Image unavailable for {topic.title}
                    </p>
                  </div>
                ) : (
                  <img
                    key={topic.id}
                    src={topic.img}
                    alt={`${topic.title} — Knowledge Drop`}
                    onLoad={() => setImgStatus('loaded')}
                    onError={() => setImgStatus('error')}
                    style={{
                      width: '100%', height: '100%', maxHeight: 320,
                      objectFit: 'cover', display: 'block',
                      opacity: imgStatus === 'loaded' ? 1 : 0.15,
                      transition: 'opacity 0.25s',
                    }}
                  />
                )}
                {imgStatus === 'loading' && (
                  <div aria-live="polite" style={{
                    position: 'absolute', fontSize: 12, color: 'rgba(229,226,225,0.5)',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>
                    Loading…
                  </div>
                )}
              </div>

              {/* Educational detail panel */}
              <div style={{
                background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: 'clamp(16px,2.4vw,24px)',
              }}>
                <p style={{
                  margin: 0, fontSize: 'clamp(15px,1.7vw,18px)', lineHeight: 1.65,
                  color: CREAM,
                }}>
                  {topic.body}
                </p>
              </div>

              {/* Optional knowledge check */}
              <div style={{
                background: 'rgba(233,193,118,0.05)', border: `1px solid ${BORDER}`, borderRadius: 12,
                padding: 'clamp(14px,2vw,20px)',
              }}>
                <button
                  type="button"
                  aria-expanded={quizOpen}
                  onClick={() => { triggerHaptic('light'); setQuizOpen(o => !o) }}
                  style={{
                    background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20,
                    color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13,
                    padding: '8px 16px', cursor: 'pointer', outline: 'none',
                    minHeight: 40,
                  }}
                >
                  {quizOpen ? 'Hide Knowledge Check' : `Required Knowledge Check${answers[topic.id] !== undefined ? ' ✓' : ''}`}
                </button>

                {quizOpen && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 14, color: CREAM, lineHeight: 1.5 }}>
                      {topic.quiz.question}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {topic.quiz.options.map((opt, i) => {
                        const answered = answers[topic.id]
                        const chosen = answered === i
                        const correct = answered !== undefined && i === topic.quiz.answer
                        return (
                          <button
                            key={opt}
                            type="button"
                            aria-pressed={chosen}
                            disabled={answered !== undefined}
                            onClick={() => submitQuizAnswer(i)}
                            style={{
                              textAlign: 'left', minHeight: 44,
                              padding: '10px 14px', borderRadius: 8,
                              border: `1.5px solid ${correct ? GOLD : chosen ? 'rgba(233,193,118,0.5)' : 'rgba(229,226,225,0.2)'}`,
                              background: correct ? 'rgba(233,193,118,0.14)' : 'transparent',
                              color: 'rgba(229,226,225,0.9)',
                              fontFamily: 'Georgia, serif', fontSize: 13,
                              cursor: answered !== undefined ? 'default' : 'pointer',
                              outline: 'none',
                            }}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                    {answers[topic.id] !== undefined && (
                      <p style={{ margin: '10px 0 0', fontSize: 12, color: answers[topic.id] === topic.quiz.answer ? GOLD : 'rgba(229,226,225,0.6)' }}>
                        {answers[topic.id] === topic.quiz.answer ? 'Correct.' : `Not quite — the answer is "${topic.quiz.options[topic.quiz.answer]}".`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Completed state — real completion tracking, no fake XP */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 12, color: allViewed ? GOLD : 'rgba(229,226,225,0.4)',
          }}>
            <span aria-hidden="true">{allViewed ? '✓' : '○'}</span>
            <span>{allViewed ? 'All Knowledge Drop topics reviewed' : `${TOPICS.length - viewedTopics.size} topic${TOPICS.length - viewedTopics.size === 1 ? '' : 's'} remaining`}</span>
          </div>

          {allAnswered && (
            <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2vw,20px)' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>
                Required: Which topic did you find most useful?
              </div>
              <div role="radiogroup" aria-label="Most useful topic" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {TOPICS.map(t => {
                  const active = synthesis === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      aria-label={t.title}
                      onClick={() => { triggerHaptic('light'); setFeedback(null); setSynthesis(t.id) }}
                      style={{
                        minHeight: 44, padding: '8px 16px', borderRadius: 20,
                        border: `1.5px solid ${active ? GOLD : 'rgba(229,226,225,0.25)'}`,
                        background: active ? 'rgba(233,193,118,0.14)' : 'transparent',
                        color: active ? GOLD : 'rgba(229,226,225,0.75)',
                        fontFamily: 'Georgia, serif', fontSize: 13, cursor: 'pointer', outline: 'none',
                      }}
                    >
                      {t.title}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {feedback && (
            <div role="alert" style={{ background: 'rgba(120,20,20,0.9)', border: '1px solid rgba(255,150,150,0.5)', borderRadius: 8, padding: '8px 14px', color: '#ffdada', fontSize: 13, fontFamily: 'Georgia, serif' }}>
              {feedback.message}
            </div>
          )}
        </div>
      </main>

      <SmokeCraftLessonInfoButton
        sessionNumber={15} totalSessions={TOTAL_SESSIONS} phase={3} totalPhases={TOTAL_VISITS}
        title="Knowledge Drop" whyItMatters={ENRICHMENT_15?.whyItMatters} goldenBox={ENRICHMENT_15?.goldenBox}
      />

      <SmokeCraftNavBar
        primary={done ? 'Checking…' : 'Continue →'}
        onPrimary={handleContinue}
        primaryDisabled={done}
        secondary="← Back"
        onSecondary={onBack || (() => navigate('/smokecraft/mentor-commentary'))}
      />
    </div>
  )
}
