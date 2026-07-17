import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { VISIT_STRUCTURE, getRankFromXP } from '../../constants/session.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.80)'
const DARK      = '#0a0603'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const BORDER    = 'rgba(233,193,118,0.22)'
const DIM       = 'rgba(229,226,225,0.70)'
const CREAM     = '#e5e2e1'
const GLASS     = 'rgba(8,10,16,0.86)'

const EXPERIENCE_LEVELS = [
  { id: 'beginner',     label: 'New to Cigars' },
  { id: 'occasional',  label: 'Occasional Smoker' },
  { id: 'enthusiast',  label: 'Regular Enthusiast' },
  { id: 'connoisseur', label: 'Experienced Connoisseur' },
  { id: 'expert',      label: 'Expert / Sommelier Level' },
]

const FOCUS_AREAS = [
  { id: 'flavor',      label: 'Flavor Discovery' },
  { id: 'pairing',    label: 'Food & Drink Pairing' },
  { id: 'origins',    label: 'Origins & Terroir' },
  { id: 'technique',  label: 'Rolling & Technique' },
  { id: 'collection', label: 'Building a Collection' },
  { id: 'social',     label: 'Social Experience' },
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Mexico', 'Dominican Republic',
  'Cuba', 'Nicaragua', 'Honduras', 'Colombia', 'Brazil', 'France', 'Germany',
  'Italy', 'Spain', 'Japan', 'Australia', 'Singapore', 'UAE', 'Other',
]

const EMPTY = {
  fullName: '', email: '', preferredName: '', birthDate: '',
  country: '', experienceLevel: '', focusArea: '',
}

// Deduped, ordered list of the 27 numbered sessions for the journey nav
// panel — VISIT_STRUCTURE lists some sessions more than once (mergedInto
// entries share a route with an earlier session), so this collapses those
// down to one nav row per real screen while preserving session order.
const JOURNEY_NAV_ITEMS = (() => {
  const seen = new Set()
  const items = []
  for (const visit of VISIT_STRUCTURE) {
    for (const s of visit.sessions) {
      if (seen.has(s.route)) continue
      seen.add(s.route)
      items.push(s)
    }
  }
  return items
})()

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const labelStyle = {
  display: 'block',
  fontSize: 15,
  fontWeight: 600,
  color: GOLD_DIM,
  marginBottom: 6,
  fontFamily: 'Georgia, serif',
  lineHeight: 1.4,
}

const inputStyle = {
  display: 'block',
  width: '100%',
  background: 'rgba(10,6,3,0.90)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: '14px 14px',
  fontSize: 17,
  fontFamily: 'Georgia, serif',
  color: '#e5e2e1',
  boxSizing: 'border-box',
  outline: 'none',
  WebkitAppearance: 'none',
  minHeight: 52,
  lineHeight: 1.45,
}

const panelStyle = {
  background: GLASS,
  border: `1px solid ${BORDER}`,
  borderRadius: 12,
  padding: 'clamp(14px,2.2vw,20px)',
}

const panelTitleStyle = {
  margin: '0 0 12px',
  fontSize: 13,
  fontWeight: 700,
  color: GOLD,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  fontFamily: 'Georgia, serif',
}

function validateForm(form) {
  const e = {}
  if (!form.fullName.trim()) e.fullName = 'Full name is required'
  if (!form.experienceLevel) e.experienceLevel = 'Please select your experience level'
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) e.email = 'Enter a valid email address'
  if (form.birthDate) {
    const d = new Date(form.birthDate)
    const now = new Date()
    if (Number.isNaN(d.getTime()) || d > now) {
      e.birthDate = 'Enter a valid birth date'
    } else {
      const age = (now - d) / (1000 * 60 * 60 * 24 * 365.25)
      if (age < 13 || age > 120) e.birthDate = 'Enter a valid birth date'
    }
  }
  return e
}

export default function Identity() {
  const { awardSessionRewards, session } = useGuestSession()
  const { currentAllowed, isDemoMode, completedSessions, totalSessions, earnedBadges } = useSmokeCraftProgress()
  const { journey, setIdentity } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [phase, setPhase] = useState('loading') // loading | ready
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  const [form, setForm] = useState(() => journey.identity ? { ...EMPTY, ...journey.identity } : { ...EMPTY })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved
  const initialized = useRef(false)

  // Identity shares the guard's Session 2 numeric checkpoint with Enroll, so the
  // guard alone can't tell them apart. Enroll is the authoritative Session 2
  // screen; Identity is only reachable after it, enforced here explicitly.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('enroll')) {
      navigate('/smokecraft/enroll', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const on = () => setIsOffline(false)
    const off = () => setIsOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setPhase('ready'), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    setSaveStatus('saving')
    setIdentity(form)
    const t = setTimeout(() => setSaveStatus('saved'), 300)
    return () => clearTimeout(t)
  }, [form]) // eslint-disable-line react-hooks/exhaustive-deps

  const liveErrors = useMemo(() => validateForm(form), [form])
  const isValid = Object.keys(liveErrors).length === 0

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  function handleBlur(field) {
    setTouched(prev => ({ ...prev, [field]: true }))
    setErrors(liveErrors)
  }

  function handleBegin() {
    const e = validateForm(form)
    setErrors(e)
    setTouched({ fullName: true, experienceLevel: true, email: true, birthDate: true })
    if (Object.keys(e).length > 0) { triggerHaptic('error'); return }
    if (submitting) return
    setSubmitting(true)
    triggerHaptic('medium')
    try { awardSessionRewards('enroll') } catch (_) {}
    navigate('/smokecraft/golden-box')
  }

  const canResume = currentAllowed?.route
    && currentAllowed.route !== '/smokecraft'
    && currentAllowed.route !== '/smokecraft/identity'

  // Journey Progress — real completed-session count from canonical progress state.
  const progressCount = completedSessions?.length || 0
  const progressPct = totalSessions > 0 ? Math.round((progressCount / totalSessions) * 100) : 0

  // Quick Stats — real XP/rank/badges, never fabricated.
  const xp = session?.xp || 0
  const rank = getRankFromXP(xp)
  const badgeCount = earnedBadges?.length ?? session?.badges?.length ?? 0

  // Your Journeys — real archive of previously completed journeys, honest
  // empty state when none exist yet.
  const pastJourneys = journey?.previousCompletedJourneys || []

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
      fontFamily: 'Georgia, serif',
    }}>
      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(14px,2.5vw,24px) clamp(14px,3vw,32px) 0',
        zIndex: 3,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 4 }}>
          SmokeCraft 360 — Personal Dashboard
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(20px,3vw,30px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          Begin Your Journey
        </h1>
        {isOffline && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 4 }}>Offline: showing your locally saved data.</div>}
      </header>

      <main
        tabIndex={-1}
        style={{
          position: 'absolute', top: 'clamp(96px,14vh,140px)', bottom: 'clamp(150px,20vh,190px)',
          left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
          padding: '0 clamp(14px,3vw,32px) 16px', zIndex: 2,
        }}
      >
        {phase === 'loading' ? (
          <div role="status" aria-live="polite" style={{ ...panelStyle, maxWidth: 480, margin: '40px auto', textAlign: 'center' }}>
            <div aria-hidden="true" style={{ width: 26, height: 26, margin: '0 auto 12px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'id-spin 0.9s linear infinite' }} />
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.65)' }}>Loading your dashboard…</p>
            <style>{'@keyframes id-spin { to { transform: rotate(360deg); } }'}</style>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(220px, 300px) 1fr',
            gap: 20,
            alignItems: 'start',
            maxWidth: 1200,
            margin: '0 auto',
          }}
          className="sc-identity-grid"
          >
            <style>{`
              @media (max-width: 767px) {
                .sc-identity-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>

            {/* Left column: decorative portrait + live journey navigation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Approved hero photography, bounded (not full-screen) — purely
                  decorative. IDENTY.png is a full production-screen composite
                  (portrait + baked cards/labels/buttons); the crop below is
                  precisely positioned to show only the clean portrait region
                  of that image (no baked text, card borders, or controls —
                  verified by direct visual inspection of the source asset). */}
              <div
                role="img"
                aria-label="SmokeCraft — Begin Your Journey"
                style={{
                  width: '100%', aspectRatio: '500 / 320', borderRadius: 14,
                  backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.05), rgba(6,8,16,0.45)), url(${SC_ASSETS.identity})`,
                  backgroundSize: 'cover, 334.40% 294.06%',
                  backgroundPosition: 'center, 59.73% 1.61%',
                  backgroundRepeat: 'no-repeat',
                  border: `1px solid ${BORDER}`,
                }}
              />

              <nav aria-label="SmokeCraft journey navigation" style={panelStyle}>
                <h2 style={panelTitleStyle}>Your Journey</h2>
                <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
                  {JOURNEY_NAV_ITEMS.map(item => {
                    const done = completedSessions?.includes(item.session)
                    const isCurrent = currentAllowed?.session === item.session
                    const unlocked = isDemoMode || done || isCurrent
                    return (
                      <li key={item.route}>
                        <button
                          type="button"
                          disabled={!unlocked}
                          onClick={() => unlocked && navigate(item.route)}
                          aria-current={isCurrent ? 'step' : undefined}
                          style={{
                            width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8,
                            background: isCurrent ? 'rgba(233,193,118,0.12)' : 'transparent',
                            border: 'none', borderRadius: 8, padding: '8px 10px',
                            color: unlocked ? (done ? GOLD_DIM : CREAM) : 'rgba(229,226,225,0.30)',
                            fontSize: 12, fontFamily: 'Georgia, serif',
                            cursor: unlocked ? 'pointer' : 'default',
                            minHeight: 40,
                          }}
                        >
                          <span aria-hidden="true" style={{ fontSize: 11, color: GOLD_DIM, width: 22, flexShrink: 0 }}>
                            {done ? '✓' : `S${item.session}`}
                          </span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </nav>
            </div>

            {/* Right column: live stat/progress/insight panels + identity form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {/* Journey Progress panel — real completedSessions/totalSessions */}
                <section aria-label="Journey progress" style={panelStyle}>
                  <h2 style={panelTitleStyle}>Journey Progress</h2>
                  <div style={{ fontSize: 22, fontWeight: 700, color: CREAM }}>{progressCount} / {totalSessions}</div>
                  <div aria-hidden="true" style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', marginTop: 10, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progressPct}%`, background: GOLD, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', marginTop: 6 }}>{progressPct}% complete</div>
                </section>

                {/* Quick Stats panel — real XP/rank/badges */}
                <section aria-label="Quick stats" style={panelStyle}>
                  <h2 style={panelTitleStyle}>Quick Stats</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'rgba(229,226,225,0.75)' }}>
                    <div>XP: <strong style={{ color: GOLD }}>{xp}</strong></div>
                    <div>Rank: <strong style={{ color: CREAM }}>{rank.name}</strong></div>
                    <div>Badges: <strong style={{ color: CREAM }}>{badgeCount}</strong></div>
                  </div>
                </section>

                {/* Insights & Analytics panel — no analytics engine exists yet; honest empty state */}
                <section aria-label="Insights and analytics" style={panelStyle}>
                  <h2 style={panelTitleStyle}>Insights &amp; Analytics</h2>
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(229,226,225,0.45)', lineHeight: 1.6 }}>
                    Not available — no analytics engine is connected in this build.
                  </p>
                </section>

                {/* Your Journeys panel — real archive, honest empty state */}
                <section aria-label="Your journeys" style={panelStyle}>
                  <h2 style={panelTitleStyle}>Your Journeys</h2>
                  {pastJourneys.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 12, color: 'rgba(229,226,225,0.45)', lineHeight: 1.6 }}>
                      No completed journeys yet — this will be your first.
                    </p>
                  ) : (
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {pastJourneys.slice(-3).reverse().map((j, i) => (
                        <li key={j.journeyId || i} style={{ fontSize: 12, color: 'rgba(229,226,225,0.7)' }}>
                          {j.cigarName || 'Completed journey'}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>

              {/* Identity form */}
              <div style={panelStyle}>
                <h2 style={panelTitleStyle}>Your Profile</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px' }}>
                      <label style={labelStyle} htmlFor="id-fullname">Full Name *</label>
                      <input
                        id="id-fullname"
                        type="text"
                        placeholder="First and Last Name"
                        value={form.fullName}
                        onChange={e => set('fullName', e.target.value)}
                        onBlur={() => handleBlur('fullName')}
                        style={{ ...inputStyle, borderColor: touched.fullName && errors.fullName ? '#e05a5a' : BORDER }}
                        autoComplete="name"
                        aria-required="true"
                        aria-invalid={Boolean(touched.fullName && liveErrors.fullName)}
                      />
                      {touched.fullName && liveErrors.fullName && (
                        <div role="alert" style={{ color: '#e05a5a', fontSize: 14, marginTop: 5, lineHeight: 1.4 }}>
                          {liveErrors.fullName}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: '1 1 160px' }}>
                      <label style={labelStyle} htmlFor="id-preferred">Preferred Name</label>
                      <input
                        id="id-preferred"
                        type="text"
                        placeholder="Goes By"
                        value={form.preferredName}
                        onChange={e => set('preferredName', e.target.value)}
                        style={inputStyle}
                        autoComplete="nickname"
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Cigar Experience Level *</label>
                    <div role="group" aria-label="Cigar experience level" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {EXPERIENCE_LEVELS.map(l => {
                        const active = form.experienceLevel === l.id
                        return (
                          <button
                            key={l.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => { triggerHaptic('light'); set('experienceLevel', l.id); setTouched(p => ({ ...p, experienceLevel: true })) }}
                            style={{
                              background: active ? GOLD : 'transparent',
                              color: active ? DARK : GOLD_DIM,
                              border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.32)'}`,
                              borderRadius: 24,
                              padding: '12px 18px',
                              minHeight: 48,
                              fontSize: 15,
                              fontWeight: 600,
                              fontFamily: 'Georgia, serif',
                              cursor: 'pointer',
                              touchAction: 'manipulation',
                              lineHeight: 1.3,
                            }}
                          >
                            {l.label}
                          </button>
                        )
                      })}
                    </div>
                    {touched.experienceLevel && liveErrors.experienceLevel && (
                      <div role="alert" style={{ color: '#e05a5a', fontSize: 14, marginTop: 5, lineHeight: 1.4 }}>
                        {liveErrors.experienceLevel}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>What Excites You Most</label>
                    <div role="group" aria-label="What excites you most" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {FOCUS_AREAS.map(f => {
                        const active = form.focusArea === f.id
                        return (
                          <button
                            key={f.id}
                            type="button"
                            aria-pressed={active}
                            onClick={() => { triggerHaptic('light'); set('focusArea', f.id) }}
                            style={{
                              background: active ? 'rgba(233,193,118,0.18)' : 'transparent',
                              color: active ? GOLD : GOLD_DIM,
                              border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.28)'}`,
                              borderRadius: 24,
                              padding: '12px 18px',
                              minHeight: 48,
                              fontSize: 15,
                              fontFamily: 'Georgia, serif',
                              cursor: 'pointer',
                              touchAction: 'manipulation',
                              lineHeight: 1.3,
                            }}
                          >
                            {f.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 180px' }}>
                      <label style={labelStyle} htmlFor="id-email">Email Address</label>
                      <input
                        id="id-email"
                        type="email"
                        placeholder="your@email.com"
                        value={form.email}
                        onChange={e => set('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                        style={{ ...inputStyle, borderColor: touched.email && errors.email ? '#e05a5a' : BORDER }}
                        autoComplete="email"
                        aria-invalid={Boolean(touched.email && liveErrors.email)}
                      />
                      {touched.email && liveErrors.email && (
                        <div role="alert" style={{ color: '#e05a5a', fontSize: 14, marginTop: 5, lineHeight: 1.4 }}>
                          {liveErrors.email}
                        </div>
                      )}
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                      <label style={labelStyle} htmlFor="id-birthdate">Birth Date</label>
                      <input
                        id="id-birthdate"
                        type="date"
                        value={form.birthDate}
                        onChange={e => set('birthDate', e.target.value)}
                        onBlur={() => handleBlur('birthDate')}
                        style={{ ...inputStyle, colorScheme: 'dark', borderColor: touched.birthDate && errors.birthDate ? '#e05a5a' : BORDER }}
                        aria-invalid={Boolean(touched.birthDate && liveErrors.birthDate)}
                      />
                      {touched.birthDate && liveErrors.birthDate && (
                        <div role="alert" style={{ color: '#e05a5a', fontSize: 14, marginTop: 5, lineHeight: 1.4 }}>
                          {liveErrors.birthDate}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle} htmlFor="id-country">Country</label>
                    <select
                      id="id-country"
                      value={form.country}
                      onChange={e => set('country', e.target.value)}
                      style={{ ...inputStyle, color: form.country ? '#e5e2e1' : DIM }}
                    >
                      <option value="">Select your country...</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                </div>

                {saveStatus === 'saved' && <div style={{ fontSize: 12, color: GOLD, textAlign: 'right', marginTop: 10 }}>✓ Saved</div>}

                {canResume && (
                  <div style={{ marginTop: 18, textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => navigate(currentAllowed.route)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: GOLD_DIM,
                        fontSize: 15,
                        fontFamily: 'Georgia, serif',
                        cursor: 'pointer',
                        padding: '8px 0',
                        textDecoration: 'underline',
                        touchAction: 'manipulation',
                        lineHeight: 1.4,
                      }}
                    >
                      Continue Previous Session
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <SmokeCraftNavBar
        primary="Begin My Journey"
        onPrimary={handleBegin}
        primaryDisabled={!isValid || submitting}
        secondary="Back"
        onSecondary={() => navigate(-1)}
      />
    </div>
  )
}
