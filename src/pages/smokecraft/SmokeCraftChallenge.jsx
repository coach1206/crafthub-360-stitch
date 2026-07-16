import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { getRankFromXP } from '../../constants/session.js'
import { calculateWinnerEligibility, getTopEligibleCategory, getWinnerProgress } from '../../services/smokecraft/smokeWinnerService.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

// Real status labels from smokeWinnerService.js — never fabricated. Maps the
// service's honest status vocabulary onto the required screen states.
const STATUS_DISPLAY = {
  earned:        { label: 'Completed',  color: '#7fdc9a' },
  eligible:      { label: 'In Progress', color: GOLD },
  close:         { label: 'In Progress', color: GOLD },
  partial:       { label: 'In Progress', color: 'rgba(229,226,225,0.7)' },
  pending:       { label: 'Not Started', color: 'rgba(229,226,225,0.4)' },
  locked:        { label: 'Locked',      color: 'rgba(229,170,100,0.7)' },
  not_qualified: { label: 'Not Started', color: 'rgba(229,226,225,0.4)' },
}

export default function SmokeCraftChallenge() {
  const navigate = useNavigate()
  const { session, update, awardSessionRewards } = useGuestSession()

  const state = session?.smokeCraft?.smokeCraftChallengeModule || {}

  const [phase, setPhase] = useState('loading') // loading | error | ready
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  const [selectedCategoryId, setSelectedCategoryId] = useState(state.selectedCategoryId || null)
  const [joinedIds, setJoinedIds] = useState(state.joinedCategoryIds || [])
  const [viewMode, setViewMode] = useState(null) // null | 'progress' | 'rewards'
  const [started, setStarted] = useState(Boolean(state.startedAt))

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    try {
      const t = setTimeout(() => setPhase('ready'), 200)
      return () => clearTimeout(t)
    } catch {
      setPhase('error')
    }
  }, [])

  // All categories, progress, and eligibility come from the real, already-
  // verified winner-category engine — evaluated live against this session's
  // actual data. Never a fabricated list of challenges.
  const categories = useMemo(() => calculateWinnerEligibility(session), [session])
  const featured = useMemo(() => getTopEligibleCategory(session), [session])
  const progressSummary = useMemo(() => getWinnerProgress(session), [session])
  const rank = getRankFromXP(session?.xp || 0)
  const xp = session?.xp || 0

  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || null

  useEffect(() => {
    if (phase !== 'ready') return
    const cur = session?.smokeCraft?.smokeCraftChallengeModule || {}
    if (cur.selectedCategoryId === selectedCategoryId && JSON.stringify(cur.joinedCategoryIds || []) === JSON.stringify(joinedIds)) return
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        smokeCraftChallengeModule: { ...(prev.smokeCraft?.smokeCraftChallengeModule || {}), selectedCategoryId, joinedCategoryIds: joinedIds },
      },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectedCategoryId, joinedIds])

  function handleRetry() {
    setPhase('loading')
    setTimeout(() => setPhase('ready'), 200)
  }

  function handleJoin(id) {
    if (joinedIds.includes(id)) return
    triggerHaptic('light')
    setJoinedIds(prev => [...prev, id])
  }

  function handleSelect(id) {
    triggerHaptic('light')
    setSelectedCategoryId(id)
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        smokeCraftChallengeModule: { ...(prev.smokeCraft?.smokeCraftChallengeModule || {}), lastViewedCategoryId: id },
      },
    }))
  }

  // "Start Challenge" preserves the pre-existing journey-flow behavior of
  // this supporting module (award its configured session reward and advance
  // to Second Humidor Match) — unchanged from before this package.
  function handleStartChallenge() {
    if (started) return
    setStarted(true)
    triggerHaptic('medium')
    awardSessionRewards('smokecraft-challenge')
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        smokeCraftChallengeModule: { ...(prev.smokeCraft?.smokeCraftChallengeModule || {}), startedAt: Date.now() },
      },
    }))
    navigate('/smokecraft/second-humidor-match')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
      fontFamily: 'Georgia, serif',
    }}>
      {/* Approved production visual, reused as-is as a decorative header band. */}
      <div
        role="img"
        aria-label="SmokeCraft Challenge — Advanced Cigar Recognition"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(90px,14vh,140px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.35), rgba(6,8,16,0.92)), url(${SC_ASSETS.smokecraftChallenge})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          zIndex: 1,
        }}
      />

      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0', zIndex: 3 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft 360 — Supporting Module
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          SmokeCraft Challenge
        </h1>
        {isOffline && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', marginTop: 4 }}>Offline: showing your locally saved data.</div>}
      </header>

      <main
        tabIndex={-1}
        style={{
          position: 'absolute', top: 'clamp(150px,20vh,190px)', bottom: 'clamp(120px,16vh,160px)',
          left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
          padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
        }}
      >
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>

          {phase === 'loading' && (
            <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
              <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'sc-spin 0.9s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading challenges…</p>
              <style>{'@keyframes sc-spin { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>Something went wrong loading the challenge board.</p>
              <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
                Retry
              </button>
            </div>
          )}

          {phase === 'ready' && (
            <>
              {/* User progress summary — Rank / XP / progress counts, all live */}
              <section aria-label="Your challenge progress" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rank</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: CREAM }}>{rank.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>XP Earned</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{xp} XP</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Completed</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: CREAM }}>{progressSummary.earnedCount} / {progressSummary.totalCategories}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>In Progress</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: CREAM }}>{progressSummary.eligibleCount}</div>
                </div>
              </section>

              {/* Featured challenge — the guest's real top-eligible category */}
              <section aria-label="Featured challenge" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 10px', fontSize: 16, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Featured Challenge</h2>
                {featured ? (
                  <>
                    <div style={{ fontSize: 15, fontWeight: 700, color: CREAM, marginBottom: 4 }}>{featured.title}</div>
                    <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(229,226,225,0.6)', lineHeight: 1.6 }}>{featured.description}</p>
                    <div style={{ fontSize: 11, color: STATUS_DISPLAY[featured.status]?.color || CREAM }}>{STATUS_DISPLAY[featured.status]?.label || featured.statusLabel}</div>
                  </>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.55)' }}>No featured challenge available yet — complete more of the SmokeCraft protocol to unlock one.</p>
                )}
              </section>

              {/* Challenge categories — all real, live status per category */}
              <section aria-label="Challenge categories" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Challenge Categories</h2>
                {categories.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.55)' }}>No challenges available.</p>
                ) : (
                  <div role="list" aria-label="Challenge list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {categories.map(cat => {
                      const isSelected = selectedCategoryId === cat.id
                      const isJoined = joinedIds.includes(cat.id)
                      const display = STATUS_DISPLAY[cat.status] || STATUS_DISPLAY.pending
                      return (
                        <div
                          key={cat.id} role="listitem"
                          style={{ border: `1.5px solid ${isSelected ? GOLD : BORDER}`, borderRadius: 10, padding: 12, background: isSelected ? 'rgba(233,193,118,0.1)' : 'rgba(255,255,255,0.02)' }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: CREAM }}>{cat.title}</div>
                              <div style={{ fontSize: 11, color: display.color, marginTop: 2 }}>{isJoined ? 'Joined' : display.label}</div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <button type="button" onClick={() => handleSelect(cat.id)} aria-pressed={isSelected}
                                style={{ padding: '5px 12px', borderRadius: 12, border: `1.5px solid ${BORDER}`, background: 'transparent', color: 'rgba(229,226,225,0.75)', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 36 }}>
                                {isSelected ? 'Viewing' : 'View'}
                              </button>
                              <button type="button" onClick={() => handleJoin(cat.id)} disabled={isJoined} aria-pressed={isJoined}
                                style={{ padding: '5px 12px', borderRadius: 12, border: `1.5px solid ${isJoined ? GOLD : BORDER}`, background: isJoined ? 'rgba(233,193,118,0.15)' : 'transparent', color: isJoined ? GOLD : 'rgba(229,226,225,0.75)', fontSize: 11, fontFamily: 'Georgia, serif', cursor: isJoined ? 'default' : 'pointer', minHeight: 36 }}>
                                {isJoined ? 'Joined' : 'Join Challenge'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Selected challenge detail — rules, progress, rewards */}
              {selectedCategory && (
                <section aria-label="Selected challenge detail" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                  <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: GOLD }}>{selectedCategory.title}</h2>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(229,226,225,0.65)', lineHeight: 1.6 }}>{selectedCategory.description}</p>

                  <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', marginBottom: 10 }}>
                    <div>Challenge rules: qualifies once {selectedCategory.requiredScores.join(', ')} meet real thresholds — never estimated.</div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                    <button type="button" onClick={() => setViewMode(viewMode === 'progress' ? null : 'progress')} aria-pressed={viewMode === 'progress'}
                      style={{ padding: '6px 14px', borderRadius: 14, border: `1.5px solid ${viewMode === 'progress' ? GOLD : BORDER}`, background: viewMode === 'progress' ? 'rgba(233,193,118,0.15)' : 'transparent', color: viewMode === 'progress' ? GOLD : 'rgba(229,226,225,0.7)', fontSize: 12, fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 36 }}>
                      View Progress
                    </button>
                    <button type="button" onClick={() => setViewMode(viewMode === 'rewards' ? null : 'rewards')} aria-pressed={viewMode === 'rewards'}
                      style={{ padding: '6px 14px', borderRadius: 14, border: `1.5px solid ${viewMode === 'rewards' ? GOLD : BORDER}`, background: viewMode === 'rewards' ? 'rgba(233,193,118,0.15)' : 'transparent', color: viewMode === 'rewards' ? GOLD : 'rgba(229,226,225,0.7)', fontSize: 12, fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 36 }}>
                      View Rewards
                    </button>
                  </div>

                  {viewMode === 'progress' && (
                    <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)' }}>
                      Current progress: {selectedCategory.currentProgress ?? 'Not available'} — {selectedCategory.reason}
                      <div style={{ marginTop: 4, color: 'rgba(229,226,225,0.5)' }}>Next step: {selectedCategory.nextAction}</div>
                    </div>
                  )}
                  {viewMode === 'rewards' && (
                    <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)' }}>
                      Grand reward: Not available — no reward catalog is configured for this challenge yet.
                      <div style={{ marginTop: 4 }}>Participation rewards: Not available.</div>
                    </div>
                  )}
                </section>
              )}

              {/* Live events — no real challenge-events backend exists yet */}
              <section aria-label="Live events" style={{ background: 'rgba(233,193,118,0.06)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'rgba(229,226,225,0.55)' }}>
                No backend connected — live, scheduled SmokeCraft Challenge events require a real events service. This is the documented integration seam.
              </section>
            </>
          )}
        </div>
      </main>

      <SmokeCraftNavBar
        primary={started ? 'Continuing…' : 'Start Challenge →'}
        onPrimary={handleStartChallenge}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </div>
  )
}
