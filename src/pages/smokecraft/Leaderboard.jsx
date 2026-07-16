import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { RANKS, getRankFromXP } from '../../constants/session.js'
import { getLeaderboardSnapshot } from '../../services/smokecraft/smokeLeaderboardService.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

const SCOPES = [
  { id: 'global', label: 'Global' },
  { id: 'venue',  label: 'Venue' },
]
const TIME_RANGES = [
  { id: 'weekly',   label: 'Weekly',   ms: 7 * 24 * 60 * 60 * 1000 },
  { id: 'monthly',  label: 'Monthly',  ms: 30 * 24 * 60 * 60 * 1000 },
  { id: 'all-time', label: 'All Time', ms: null },
]

function initials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('')
}

function formatTimestamp(ts) {
  if (!ts) return null
  try { return new Date(ts).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) } catch { return null }
}

/**
 * Builds the current guest's leaderboard entry from real, already-canonical
 * data only — session (GuestSessionContext) + journey (SmokeCraftJourneyContext).
 * Never fabricates other players; the community board stays honestly empty
 * until a real shared backend exists (see smokeLeaderboardService.js).
 */
function buildCurrentUserEntry(session, journey) {
  const xp = session?.xp || 0
  const tier = getRankFromXP(xp)
  const displayName = journey.identity?.preferredName || session?.profile?.nickname || 'Guest'
  const isAnonymous = displayName === 'Guest'

  const completedJourneys = (journey.previousCompletedJourneys?.length || 0)
    + (session?.completedSteps?.includes('session-complete') ? 1 : 0)

  const passportStamps = journey.passportStamp?.stamped ? 1 : 0

  const achievements = journey.achievements?.earned ? Object.keys(journey.achievements.earned).length : 0

  const kc = session?.smokeCraft?.knowledgeChecks || {}
  const quizEntries = Object.values(kc)
  const quizScore = quizEntries.reduce((sum, q) => sum + (q.score || 0), 0)
  const quizTotal = quizEntries.reduce((sum, q) => sum + (q.total || 0), 0)

  return {
    id: session?.sessionId || 'you',
    isCurrentUser: true,
    displayName,
    isAnonymous,
    xp,
    tier: tier.name,
    tierColor: tier.color,
    completedJourneys,
    passportStamps,
    achievements,
    quizScore,
    quizTotal,
    challengePoints: null, // no real challenge-scoring source exists — honestly absent, never fabricated
    venue: journey.selectedVenue?.name || null,
    lastActivityAt: journey.journeyUpdatedAt || null,
  }
}

export default function Leaderboard() {
  const { session, update } = useGuestSession()
  const { journey } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const prefs = session?.smokeCraft?.leaderboardPrefs || {}

  const [phase, setPhase] = useState('loading') // loading | error | ready
  const [scope, setScope] = useState(prefs.scope || 'global')
  const [timeRange, setTimeRange] = useState(prefs.timeRange || 'all-time')
  const [tierFilter, setTierFilter] = useState(prefs.tierFilter ?? null)
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  const [refreshing, setRefreshing] = useState(false)

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

  // Persist filter selections to the existing canonical session record — no
  // new storage key, reusing the same free-form smokeCraft bucket already
  // used elsewhere (e.g. Package O's knowledgeChecks).
  useEffect(() => {
    if (phase !== 'ready') return
    const p = session?.smokeCraft?.leaderboardPrefs
    if (p?.scope === scope && p?.timeRange === timeRange && p?.tierFilter === tierFilter) return
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        leaderboardPrefs: { ...(prev.smokeCraft?.leaderboardPrefs || {}), scope, timeRange, tierFilter },
      },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, scope, timeRange, tierFilter])

  const snapshot = useMemo(() => getLeaderboardSnapshot(session), [session])
  const currentEntry = useMemo(() => buildCurrentUserEntry(session, journey), [session, journey])

  // The only real entries available are the current guest's own — the
  // community board is honestly empty until a shared backend exists
  // (smokeLeaderboardService.js). Filters are applied for real against this
  // one real entry, so a filter can genuinely include or exclude it.
  const allEntries = [currentEntry]

  const filteredEntries = useMemo(() => {
    return allEntries.filter(e => {
      if (scope === 'venue' && !e.venue) return false
      if (tierFilter && e.tier !== tierFilter) return false
      const range = TIME_RANGES.find(r => r.id === timeRange)
      if (range?.ms && e.lastActivityAt) {
        if (Date.now() - e.lastActivityAt > range.ms) return false
      }
      return true
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, tierFilter, timeRange, currentEntry])

  function handleRetry() {
    setPhase('loading')
    setTimeout(() => setPhase('ready'), 200)
  }

  function handleRefresh() {
    triggerHaptic('light')
    setRefreshing(true)
    const now = Date.now()
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        leaderboardPrefs: { ...(prev.smokeCraft?.leaderboardPrefs || {}), lastRefreshedAt: now },
      },
    }))
    setTimeout(() => setRefreshing(false), 400)
  }

  const lastRefreshedAt = session?.smokeCraft?.leaderboardPrefs?.lastRefreshedAt || null
  const isStale = lastRefreshedAt ? (Date.now() - lastRefreshedAt) > (24 * 60 * 60 * 1000) : false

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
      fontFamily: 'Georgia, serif',
    }}>
      {/* Approved production visual, reused as a decorative header band — all
          data below is live React content, never baked into the image. */}
      <div
        role="img"
        aria-label="SmokeCraft Leaderboard — Rankings"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(90px,14vh,140px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.35), rgba(6,8,16,0.92)), url(${SC_ASSETS.leaderboard})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          zIndex: 1,
        }}
      />

      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',
        zIndex: 3,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft 360 — Supporting Module
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          Leaderboard
        </h1>
        {isOffline && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', marginTop: 4 }}>Offline: showing your locally saved data.</div>}
        {!isOffline && isStale && <div style={{ fontSize: 12, color: 'rgba(229,170,100,0.85)', marginTop: 4 }}>Data may be stale — last refreshed {formatTimestamp(lastRefreshedAt)}.</div>}
      </header>

      <main style={{
        position: 'absolute', top: 'clamp(150px,20vh,190px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {phase === 'loading' && (
            <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
              <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'lb-spin 0.9s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading leaderboard…</p>
              <style>{'@keyframes lb-spin { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>Something went wrong loading the leaderboard.</p>
              <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
                Retry
              </button>
            </div>
          )}

          {phase === 'ready' && (
            <>
              {/* Filters */}
              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)' }}>
                <div role="group" aria-label="Leaderboard scope" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {SCOPES.map(s => (
                    <button
                      key={s.id} type="button" aria-pressed={scope === s.id}
                      onClick={() => { triggerHaptic('light'); setScope(s.id) }}
                      style={{ padding: '6px 14px', borderRadius: 14, border: `1.5px solid ${scope === s.id ? GOLD : BORDER}`, background: scope === s.id ? 'rgba(233,193,118,0.15)' : 'transparent', color: scope === s.id ? GOLD : 'rgba(229,226,225,0.7)', fontSize: 12, fontFamily: 'Georgia, serif', cursor: 'pointer' }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <div role="group" aria-label="Leaderboard time range" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  {TIME_RANGES.map(r => (
                    <button
                      key={r.id} type="button" aria-pressed={timeRange === r.id}
                      onClick={() => { triggerHaptic('light'); setTimeRange(r.id) }}
                      style={{ padding: '6px 14px', borderRadius: 14, border: `1.5px solid ${timeRange === r.id ? GOLD : BORDER}`, background: timeRange === r.id ? 'rgba(233,193,118,0.15)' : 'transparent', color: timeRange === r.id ? GOLD : 'rgba(229,226,225,0.7)', fontSize: 12, fontFamily: 'Georgia, serif', cursor: 'pointer' }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div role="group" aria-label="Leaderboard tier filter" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button
                    type="button" aria-pressed={!tierFilter}
                    onClick={() => { triggerHaptic('light'); setTierFilter(null) }}
                    style={{ padding: '6px 14px', borderRadius: 14, border: `1.5px solid ${!tierFilter ? GOLD : BORDER}`, background: !tierFilter ? 'rgba(233,193,118,0.15)' : 'transparent', color: !tierFilter ? GOLD : 'rgba(229,226,225,0.7)', fontSize: 12, fontFamily: 'Georgia, serif', cursor: 'pointer' }}
                  >
                    All Tiers
                  </button>
                  {RANKS.map(r => (
                    <button
                      key={r.name} type="button" aria-pressed={tierFilter === r.name}
                      onClick={() => { triggerHaptic('light'); setTierFilter(r.name) }}
                      style={{ padding: '6px 14px', borderRadius: 14, border: `1.5px solid ${tierFilter === r.name ? GOLD : BORDER}`, background: tierFilter === r.name ? 'rgba(233,193,118,0.15)' : 'transparent', color: tierFilter === r.name ? GOLD : 'rgba(229,226,225,0.7)', fontSize: 12, fontFamily: 'Georgia, serif', cursor: 'pointer' }}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Refresh */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button
                  type="button" onClick={handleRefresh}
                  aria-label="Refresh leaderboard"
                  style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 12, padding: '8px 16px', cursor: 'pointer', outline: 'none', minHeight: 40 }}
                >
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
                {lastRefreshedAt && <span style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)' }}>Last refreshed {formatTimestamp(lastRefreshedAt)}</span>}
              </div>

              {/* Community honest boundary */}
              <div style={{ background: 'rgba(233,193,118,0.06)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'rgba(229,226,225,0.55)' }}>
                {snapshot.communityMessage}
              </div>

              {/* Entries list — scrollable, capped height so the page's own
                  scroll remains the outer boundary (no nested scroll trap). */}
              {filteredEntries.length === 0 ? (
                <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.55)' }}>
                    No entries match the current filters{scope === 'venue' ? ' — select a venue to see venue rankings.' : '.'}
                  </p>
                </div>
              ) : (
                <div role="list" aria-label="Leaderboard rankings" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
                  {filteredEntries.map((e, i) => (
                    <div
                      key={e.id} role="listitem"
                      aria-current={e.isCurrentUser ? 'true' : undefined}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                        background: e.isCurrentUser ? 'rgba(233,193,118,0.12)' : GLASS,
                        border: `1.5px solid ${e.isCurrentUser ? GOLD : BORDER}`, borderRadius: 12,
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 700, color: GOLD_DIM, width: 28, flexShrink: 0 }}>#{i + 1}</div>
                      <div aria-hidden="true" style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'rgba(233,193,118,0.15)', border: `1.5px solid ${GOLD_DIM}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: GOLD }}>
                        {initials(e.displayName)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: CREAM, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {e.displayName}
                          {e.isCurrentUser && <span style={{ fontSize: 10, color: GOLD, border: `1px solid ${GOLD}`, borderRadius: 8, padding: '1px 6px' }}>You</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>
                          {e.tier}{e.venue ? ` · ${e.venue}` : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>{e.xp} XP</div>
                        <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.45)' }}>
                          {e.completedJourneys} journeys · {e.passportStamps} stamps · {e.achievements} achievements
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(229,226,225,0.4)' }}>
                          Quiz: {e.quizTotal > 0 ? `${e.quizScore}/${e.quizTotal}` : 'Not available'} · Challenge: {e.challengePoints ?? 'Not available'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <SmokeCraftNavBar
        primary="Leaderboard"
        onPrimary={() => {}}
        primaryDisabled
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </div>
  )
}
