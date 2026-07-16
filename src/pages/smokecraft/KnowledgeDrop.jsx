import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

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

export default function KnowledgeDrop() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setKnowledgeDrop } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const savedViewed = journey.knowledgeDrop?.viewedTopics || []
  const savedScore  = journey.knowledgeDrop?.quizScore ?? null

  const [topicId, setTopicId]     = useState(null)
  const [viewedTopics, setViewedTopics] = useState(() => new Set(savedViewed))
  const [imgStatus, setImgStatus] = useState('idle') // idle | loading | loaded | error
  const [quizOpen, setQuizOpen]   = useState(false)
  const [quizAnswer, setQuizAnswer] = useState(null)
  const [quizScore, setQuizScore] = useState(savedScore)

  const topic = topicId ? TOPICS.find(t => t.id === topicId) : null
  const allViewed = viewedTopics.size === TOPICS.length

  useEffect(() => {
    if (viewedTopics.size > 0 || quizScore !== null) {
      setKnowledgeDrop({ viewedTopics: Array.from(viewedTopics), quizScore })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedTopics.size, quizScore])

  function selectTopic(id) {
    triggerHaptic('light')
    setTopicId(id)
    setImgStatus('loading')
    setQuizOpen(false)
    setQuizAnswer(null)
    setViewedTopics(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  function submitQuizAnswer(index) {
    triggerHaptic('light')
    setQuizAnswer(index)
    if (index === topic.quiz.answer) {
      setQuizScore(prev => (prev || 0) + 1)
    }
  }

  function handleContinue() {
    awardSessionRewards('knowledge-drop')
    navigate('/smokecraft')
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
                  {quizOpen ? 'Hide Knowledge Check' : 'Take Optional Knowledge Check'}
                </button>

                {quizOpen && (
                  <div style={{ marginTop: 14 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 14, color: CREAM, lineHeight: 1.5 }}>
                      {topic.quiz.question}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {topic.quiz.options.map((opt, i) => {
                        const chosen = quizAnswer === i
                        const correct = quizAnswer !== null && i === topic.quiz.answer
                        return (
                          <button
                            key={opt}
                            type="button"
                            aria-pressed={chosen}
                            disabled={quizAnswer !== null}
                            onClick={() => submitQuizAnswer(i)}
                            style={{
                              textAlign: 'left', minHeight: 44,
                              padding: '10px 14px', borderRadius: 8,
                              border: `1.5px solid ${correct ? GOLD : chosen ? 'rgba(233,193,118,0.5)' : 'rgba(229,226,225,0.2)'}`,
                              background: correct ? 'rgba(233,193,118,0.14)' : 'transparent',
                              color: 'rgba(229,226,225,0.9)',
                              fontFamily: 'Georgia, serif', fontSize: 13,
                              cursor: quizAnswer !== null ? 'default' : 'pointer',
                              outline: 'none',
                            }}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                    {quizAnswer !== null && (
                      <p style={{ margin: '10px 0 0', fontSize: 12, color: quizAnswer === topic.quiz.answer ? GOLD : 'rgba(229,226,225,0.6)' }}>
                        {quizAnswer === topic.quiz.answer ? 'Correct.' : `Not quite — the answer is "${topic.quiz.options[topic.quiz.answer]}".`}
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
        </div>
      </main>

      <SmokeCraftNavBar
        primary="Continue →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </div>
  )
}
