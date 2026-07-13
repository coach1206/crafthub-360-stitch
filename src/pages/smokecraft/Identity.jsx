import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

const GOLD    = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.70)'
const DARK    = '#0a0603'
const PANEL   = 'rgba(5,3,1,0.94)'
const BORDER  = 'rgba(233,193,118,0.18)'
const DIM     = 'rgba(229,226,225,0.55)'
const LS_KEY  = 'sc_identity_v1'

const EXPERIENCE_LEVELS = [
  { id: 'beginner',      label: 'New to Cigars' },
  { id: 'occasional',   label: 'Occasional Smoker' },
  { id: 'enthusiast',   label: 'Regular Enthusiast' },
  { id: 'connoisseur',  label: 'Experienced Connoisseur' },
  { id: 'expert',       label: 'Expert / Sommelier Level' },
]

const FOCUS_AREAS = [
  { id: 'flavor',       label: 'Flavor Discovery' },
  { id: 'pairing',      label: 'Food & Drink Pairing' },
  { id: 'origins',      label: 'Origins & Terroir' },
  { id: 'technique',    label: 'Rolling & Technique' },
  { id: 'collection',   label: 'Building a Collection' },
  { id: 'social',       label: 'Social Experience' },
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

function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY }
  } catch { return { ...EMPTY } }
}

const inputStyle = {
  display: 'block',
  width: '100%',
  background: 'rgba(15,9,4,0.85)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: '12px 14px',
  fontSize: 15,
  fontFamily: 'Georgia, serif',
  color: '#e5e2e1',
  boxSizing: 'border-box',
  outline: 'none',
  WebkitAppearance: 'none',
  minHeight: 44,
}

const labelStyle = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: GOLD_DIM,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: 5,
}

export default function Identity() {
  const { awardSessionRewards } = useGuestSession()
  const { currentAllowed } = useSmokeCraftProgress()
  const { setIdentity } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [form, setForm] = useState(loadSaved)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Auto-save to localStorage and journey context on change
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(form)) } catch (_) {}
    setIdentity(form)
  }, [form]) // eslint-disable-line react-hooks/exhaustive-deps

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  function validate() {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!form.experienceLevel) e.experienceLevel = 'Select your level'
    return e
  }

  function handleBegin() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    if (submitting) return
    setSubmitting(true)
    triggerHaptic('medium')
    try { awardSessionRewards('enroll') } catch (_) {}
    navigate('/smokecraft/golden-box')
  }

  function handleContinue() {
    triggerHaptic('light')
    const route = currentAllowed?.route
    if (route && route !== '/smokecraft' && route !== '/smokecraft/identity') {
      navigate(route)
    } else {
      try { awardSessionRewards('enroll') } catch (_) {}
      navigate('/smokecraft/golden-box')
    }
  }

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft/IDENTY.png"
      alt="SmokeCraft Identity — Let's Get To Know You"
      classification="LIVE_REACT_PAGE_ARTWORK"
    >
      {/* Scrollable form panel — fits within the approved composition */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}
      >
        <div
          style={{
            background: PANEL,
            borderTop: `1px solid ${BORDER}`,
            padding: 'clamp(16px, 3vw, 28px) clamp(16px, 5vw, 36px) clamp(20px, 4vh, 36px)',
            maxWidth: 560,
            width: '100%',
            margin: '0 auto',
            boxSizing: 'border-box',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
              SmokeCraft 360
            </div>
            <div style={{ fontSize: 'clamp(18px, 3.5vw, 24px)', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#e5e2e1', letterSpacing: '0.04em' }}>
              Let's Get To Know You
            </div>
          </div>

          {/* Form fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Full Name + Preferred Name */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  placeholder="First & Last Name"
                  value={form.fullName}
                  onChange={e => set('fullName', e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.fullName ? '#e05a5a' : BORDER }}
                  autoComplete="name"
                />
                {errors.fullName && <div style={{ color: '#e05a5a', fontSize: 11, marginTop: 3 }}>{errors.fullName}</div>}
              </div>
              <div style={{ flex: '1 1 140px' }}>
                <label style={labelStyle}>Preferred Name</label>
                <input
                  type="text"
                  placeholder="Goes By"
                  value={form.preferredName}
                  onChange={e => set('preferredName', e.target.value)}
                  style={inputStyle}
                  autoComplete="nickname"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                style={inputStyle}
                autoComplete="email"
              />
            </div>

            {/* Birth Date + Country */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 150px' }}>
                <label style={labelStyle}>Birth Date</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={e => set('birthDate', e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                  autoComplete="bday"
                />
              </div>
              <div style={{ flex: '1 1 160px' }}>
                <label style={labelStyle}>Country</label>
                <select
                  value={form.country}
                  onChange={e => set('country', e.target.value)}
                  style={{ ...inputStyle, color: form.country ? '#e5e2e1' : DIM }}
                >
                  <option value="" disabled>Select country</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Cigar Experience Level */}
            <div>
              <label style={labelStyle}>Cigar Experience Level *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {EXPERIENCE_LEVELS.map(l => {
                  const active = form.experienceLevel === l.id
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => { triggerHaptic('light'); set('experienceLevel', l.id) }}
                      style={{
                        background: active ? GOLD : 'transparent',
                        color: active ? DARK : GOLD_DIM,
                        border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.28)'}`,
                        borderRadius: 20,
                        padding: '10px 14px',
                        minHeight: 44,
                        fontSize: 13,
                        fontWeight: 600,
                        fontFamily: 'Georgia, serif',
                        cursor: 'pointer',
                        letterSpacing: '0.03em',
                        touchAction: 'manipulation',
                      }}
                    >
                      {l.label}
                    </button>
                  )
                })}
              </div>
              {errors.experienceLevel && <div style={{ color: '#e05a5a', fontSize: 11, marginTop: 4 }}>{errors.experienceLevel}</div>}
            </div>

            {/* What Excites You Most */}
            <div>
              <label style={labelStyle}>What Excites You Most</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {FOCUS_AREAS.map(f => {
                  const active = form.focusArea === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => { triggerHaptic('light'); set('focusArea', f.id) }}
                      style={{
                        background: active ? 'rgba(233,193,118,0.15)' : 'transparent',
                        color: active ? GOLD : GOLD_DIM,
                        border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.22)'}`,
                        borderRadius: 20,
                        padding: '10px 14px',
                        minHeight: 44,
                        fontSize: 13,
                        fontFamily: 'Georgia, serif',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                      }}
                    >
                      {f.label}
                    </button>
                  )
                })}
              </div>
            </div>

          </div>{/* /form fields */}

          {/* CTAs */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              onClick={handleBegin}
              disabled={submitting}
              style={{
                display: 'block',
                width: '100%',
                background: submitting ? 'rgba(233,193,118,0.25)' : GOLD,
                color: submitting ? 'rgba(10,6,3,0.4)' : DARK,
                border: 'none',
                borderRadius: 28,
                padding: '16px 24px',
                fontSize: 16,
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: submitting ? 'not-allowed' : 'pointer',
                minHeight: 52,
                boxShadow: submitting ? 'none' : '0 4px 20px rgba(233,193,118,0.38)',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Begin My Journey →
            </button>

            {currentAllowed && currentAllowed.route && currentAllowed.route !== '/smokecraft/identity' && (
              <button
                type="button"
                onClick={handleContinue}
                style={{
                  display: 'block',
                  width: '100%',
                  background: 'transparent',
                  color: GOLD,
                  border: `1.5px solid ${GOLD}`,
                  borderRadius: 28,
                  padding: '13px 24px',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'Georgia, serif',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  minHeight: 46,
                  touchAction: 'manipulation',
                }}
              >
                Continue Previous Session →
              </button>
            )}

            <button
              type="button"
              onClick={() => navigate(-1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: DIM,
                fontSize: 14,
                fontFamily: 'Georgia, serif',
                cursor: 'pointer',
                padding: '10px 0',
                textAlign: 'center',
                touchAction: 'manipulation',
              }}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* Desktop-only: covers the printed "NEXT: GOLDEN BOX RULES" zone in IDENTY.png at ≥1024px */}
      <button
        type="button"
        onClick={handleBegin}
        disabled={submitting}
        aria-label="Next: Golden Box Rules"
        className="sc-identity-desktop-next"
        style={{
          position: 'fixed',
          bottom: 52,
          right: 'clamp(16px, 3vw, 40px)',
          zIndex: 410,
          background: submitting ? 'rgba(10,6,3,0.7)' : 'rgba(10,6,3,0.92)',
          color: GOLD,
          border: `1.5px solid ${GOLD}`,
          borderRadius: 8,
          padding: '12px 22px',
          fontSize: 14,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          letterSpacing: '0.06em',
          cursor: submitting ? 'not-allowed' : 'pointer',
          minHeight: 48,
          minWidth: 180,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          display: 'none',
        }}
      >
        Next: Golden Box Rules →
      </button>
      <style>{`@media (min-width: 1024px) { .sc-identity-desktop-next { display: block !important; } }`}</style>
    </SmokeCraftAssetScreen>
  )
}
