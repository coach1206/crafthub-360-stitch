import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { getRankFromXP } from '../../constants/session.js'
import { PASSPORT_EVENTS } from '../../data/passportEvents.js'
import { getLeaderboardSnapshot } from '../../services/smokecraft/smokeLeaderboardService.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

function eventDate(ev) {
  if (!ev?.mon || !ev?.day || !ev?.year) return null
  const parsed = Date.parse(`${ev.mon} ${ev.day}, ${ev.year} ${ev.time || ''}`)
  return Number.isNaN(parsed) ? null : parsed
}

function formatCountdown(ms) {
  if (ms <= 0) return null
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const mins = Math.floor((ms % 3600000) / 60000)
  return `${days}d ${hours}h ${mins}m`
}

function readImageMetadata(file) {
  if (!file) return null
  return { name: file.name, size: file.size, type: file.type, addedAt: Date.now() }
}

export default function EventChallenge() {
  const navigate = useNavigate()
  const { session, update } = useGuestSession()

  const state = session?.smokeCraft?.eventChallengeModule || {}

  const [phase, setPhase] = useState('loading') // loading | error | ready
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  const [now, setNow] = useState(Date.now())
  const [selectedEventId, setSelectedEventId] = useState(state.lastViewedEventId || null)
  const [joinedIds, setJoinedIds] = useState(state.joinedEventIds || [])
  const [bannerRef, setBannerRef] = useState(state.uploadedBannerRef || null)
  const [sponsorRef, setSponsorRef] = useState(state.uploadedSponsorRef || null)

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

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(t)
  }, [])

  // Real, existing passport events — the only genuine event data source in
  // this codebase. Never fabricated; dates/attendees/venues come straight
  // from passportEvents.js.
  const events = useMemo(() => PASSPORT_EVENTS.map(ev => {
    const targetMs = eventDate(ev)
    const remaining = targetMs != null ? targetMs - now : null
    const expired = remaining != null && remaining <= 0
    return { ...ev, targetMs, remaining, expired }
  }), [now])

  const selectedEvent = events.find(e => e.id === selectedEventId) || null
  const rank = getRankFromXP(session?.xp || 0)

  const snapshot = useMemo(() => getLeaderboardSnapshot(session), [session])

  useEffect(() => {
    if (phase !== 'ready') return
    const cur = session?.smokeCraft?.eventChallengeModule || {}
    if (
      cur.lastViewedEventId === selectedEventId &&
      JSON.stringify(cur.joinedEventIds || []) === JSON.stringify(joinedIds) &&
      cur.uploadedBannerRef === bannerRef &&
      cur.uploadedSponsorRef === sponsorRef
    ) return
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        eventChallengeModule: {
          ...(prev.smokeCraft?.eventChallengeModule || {}),
          lastViewedEventId: selectedEventId,
          joinedEventIds: joinedIds,
          uploadedBannerRef: bannerRef,
          uploadedSponsorRef: sponsorRef,
        },
      },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectedEventId, joinedIds, bannerRef, sponsorRef])

  function handleRetry() {
    setPhase('loading')
    setTimeout(() => setPhase('ready'), 200)
  }

  function handleSelect(id) {
    triggerHaptic('light')
    setSelectedEventId(id)
  }

  function handleJoin(id) {
    if (joinedIds.includes(id)) return
    triggerHaptic('medium')
    setJoinedIds(prev => [...prev, id])
  }

  function handleBannerUpload(e) {
    const meta = readImageMetadata(e.target.files?.[0])
    if (meta) { triggerHaptic('light'); setBannerRef(meta) }
  }

  function handleSponsorUpload(e) {
    const meta = readImageMetadata(e.target.files?.[0])
    if (meta) { triggerHaptic('light'); setSponsorRef(meta) }
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
        aria-label="SmokeCraft Event Challenge — Live Competition"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(90px,14vh,140px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.35), rgba(6,8,16,0.92)), url(${SC_ASSETS.eventChallenge})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          zIndex: 1,
        }}
      />

      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0', zIndex: 3 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft 360 — Supporting Module
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          Event Challenge
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
              <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'ec-spin 0.9s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading events…</p>
              <style>{'@keyframes ec-spin { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>Something went wrong loading events.</p>
              <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
                Retry
              </button>
            </div>
          )}

          {phase === 'ready' && !selectedEvent && (
            <>
              <section aria-label="Your event progress" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rank</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: CREAM }}>{rank.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total Points</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: GOLD }}>Not available</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: GOLD_DIM, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Events Joined</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: CREAM }}>{joinedIds.length}</div>
                </div>
              </section>

              <section aria-label="Events list" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Calendar</h2>
                {events.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.55)' }}>No events available.</p>
                ) : (
                  <div role="list" aria-label="Event calendar" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {events.map(ev => {
                      const isJoined = joinedIds.includes(ev.id)
                      const countdown = ev.remaining != null && !ev.expired ? formatCountdown(ev.remaining) : null
                      return (
                        <div key={ev.id} role="listitem" style={{ border: `1.5px solid ${BORDER}`, borderRadius: 10, padding: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: CREAM }}>{ev.title}</div>
                              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>{ev.venue} — {ev.city}</div>
                              <div style={{ fontSize: 11, color: ev.expired ? 'rgba(229,170,100,0.8)' : GOLD_DIM, marginTop: 2 }}>
                                {ev.expired ? 'Expired' : countdown ? `Starts in ${countdown}` : 'Date not available'}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              <button type="button" onClick={() => handleSelect(ev.id)}
                                style={{ padding: '5px 12px', borderRadius: 12, border: `1.5px solid ${BORDER}`, background: 'transparent', color: 'rgba(229,226,225,0.75)', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer', minHeight: 36 }}>
                                Event Details
                              </button>
                              <button type="button" onClick={() => handleJoin(ev.id)} disabled={isJoined || ev.expired} aria-pressed={isJoined}
                                style={{ padding: '5px 12px', borderRadius: 12, border: `1.5px solid ${isJoined ? GOLD : BORDER}`, background: isJoined ? 'rgba(233,193,118,0.15)' : 'transparent', color: isJoined ? GOLD : 'rgba(229,226,225,0.75)', fontSize: 11, fontFamily: 'Georgia, serif', cursor: isJoined || ev.expired ? 'default' : 'pointer', minHeight: 36, opacity: ev.expired ? 0.5 : 1 }}>
                                {isJoined ? 'Joined' : ev.expired ? 'Expired' : 'Join Event'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {phase === 'ready' && selectedEvent && (
            <>
              {/* Event banner display + upload control */}
              <section aria-label="Event banner" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <div
                  aria-hidden="true"
                  style={{
                    width: '100%', aspectRatio: '16 / 6', borderRadius: 10, marginBottom: 10,
                    backgroundImage: `url(${bannerRef ? SC_ASSETS.eventChallenge : selectedEvent.image})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                  }}
                />
                <label style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)' }}>
                  Replace event banner (stores local file reference only, no upload backend connected):
                  <input type="file" accept="image/*" onChange={handleBannerUpload} aria-label="Upload event banner image" style={{ display: 'block', marginTop: 6, fontSize: 11, color: 'rgba(229,226,225,0.6)' }} />
                </label>
                {bannerRef && <div style={{ fontSize: 10, color: GOLD_DIM, marginTop: 4 }}>Reference stored: {bannerRef.name}</div>}
              </section>

              {/* Sponsor logo display + upload control */}
              <section aria-label="Sponsor logo" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Sponsor</h2>
                <div style={{ fontSize: 12, color: sponsorRef ? CREAM : 'rgba(229,226,225,0.45)', marginBottom: 8 }}>
                  {sponsorRef ? sponsorRef.name : 'No sponsor configured'}
                </div>
                <label style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)' }}>
                  Attach sponsor logo (local reference only):
                  <input type="file" accept="image/*" onChange={handleSponsorUpload} aria-label="Upload sponsor logo image" style={{ display: 'block', marginTop: 6, fontSize: 11, color: 'rgba(229,226,225,0.6)' }} />
                </label>
              </section>

              {/* Event details */}
              <section aria-label="Event details" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700, color: CREAM }}>{selectedEvent.title}</h2>
                <div style={{ fontSize: 12, color: GOLD_DIM, marginBottom: 8 }}>{selectedEvent.category || 'Not available'}</div>
                <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginBottom: 10 }}>{selectedEvent.venue} — {selectedEvent.city}</div>

                <h3 style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 700, color: GOLD_DIM, textTransform: 'uppercase' }}>About This Event</h3>
                <p style={{ margin: '0 0 12px', fontSize: 13, color: 'rgba(229,226,225,0.7)', lineHeight: 1.6 }}>{selectedEvent.description || 'Not available'}</p>

                <div style={{ fontSize: 13, color: selectedEvent.expired ? 'rgba(229,170,100,0.85)' : GOLD, marginBottom: 10 }}>
                  {selectedEvent.expired
                    ? 'This event has passed.'
                    : selectedEvent.remaining != null
                      ? `Countdown: ${formatCountdown(selectedEvent.remaining)}`
                      : 'Countdown not available'}
                </div>

                <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', marginBottom: 10 }}>
                  <div>Grand reward: Not available — no reward catalog configured for this event.</div>
                  <div>Participation rewards: Not available.</div>
                  <div>Points rules: Not available.</div>
                </div>

                <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', marginBottom: 12 }}>
                  Capacity: {selectedEvent.attendees ?? 'Not available'} / {selectedEvent.capacity ?? 'Not available'}
                </div>

                <button
                  type="button" onClick={() => handleJoin(selectedEvent.id)}
                  disabled={joinedIds.includes(selectedEvent.id) || selectedEvent.expired}
                  aria-pressed={joinedIds.includes(selectedEvent.id)}
                  style={{ padding: '10px 20px', borderRadius: 20, border: `1.5px solid ${GOLD}`, background: joinedIds.includes(selectedEvent.id) ? 'rgba(233,193,118,0.15)' : 'transparent', color: GOLD, fontSize: 13, fontFamily: 'Georgia, serif', cursor: joinedIds.includes(selectedEvent.id) || selectedEvent.expired ? 'default' : 'pointer', minHeight: 44 }}
                >
                  {joinedIds.includes(selectedEvent.id) ? 'Joined' : selectedEvent.expired ? 'Expired' : 'Join Event'}
                </button>
              </section>

              {/* Event leaderboard preview — honest boundary, no fabricated rankings */}
              <section aria-label="Event leaderboard preview" style={{ background: 'rgba(233,193,118,0.06)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 12, color: 'rgba(229,226,225,0.55)' }}>
                {snapshot.communityMessage}
              </section>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button" onClick={() => setSelectedEventId(null)}
                  style={{ background: 'transparent', border: `1.5px solid ${BORDER}`, borderRadius: 20, color: 'rgba(229,226,225,0.7)', fontFamily: 'Georgia, serif', fontSize: 12, padding: '8px 18px', cursor: 'pointer', minHeight: 40 }}
                >
                  ← Event Calendar
                </button>
                <button
                  type="button" onClick={() => navigate('/smokecraft/smokecraft-challenge')}
                  style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 12, padding: '8px 18px', cursor: 'pointer', minHeight: 40 }}
                >
                  Back to Challenges
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      <SmokeCraftNavBar
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </div>
  )
}
