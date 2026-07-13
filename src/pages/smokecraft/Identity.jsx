import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

const GOLD     = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.80)'
const DARK     = '#0a0603'
const BORDER   = 'rgba(233,193,118,0.22)'
const DIM      = 'rgba(229,226,225,0.70)'
const LS_KEY   = 'sc_identity_v1'

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

function loadSaved() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY }
  } catch { return { ...EMPTY } }
}

// All labels at least 15px — readable for ages 40–70
const labelStyle = {
  display: 'block',
  fontSize: 15,
  fontWeight: 600,
  color: GOLD_DIM,
  marginBottom: 6,
  fontFamily: 'Georgia, serif',
  lineHeight: 1.4,
}

// All inputs at least 17px with 52px minimum height
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

export default function Identity() {
  const { awardSessionRewards } = useGuestSession()
  const { currentAllowed } = useSmokeCraftProgress()
  const { setIdentity } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [form, setForm] = useState(loadSaved)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

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
    if (!form.fullName.trim()) e.fullName = 'Full name is required'
    if (!form.experienceLevel) e.experienceLevel = 'Please select your experience level'
    return e
  }

  function handleBegin() {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); triggerHaptic('error'); return }
    if (submitting) return
    setSubmitting(true)
    triggerHaptic('medium')
    try { awardSessionRewards('enroll') } catch (_) {}
    navigate('/smokecraft/golden-box')
  }

  const canResume = currentAllowed?.route
    && currentAllowed.route !== '/smokecraft'
    && currentAllowed.route !== '/smokecraft/identity'

  return (
    <>
      <SmokeCraftAssetScreen
        src="/assets/smokecraft/cropped/discover-profile-bg.jpg"
        alt="SmokeCraft Identity — Begin Your Journey"
        classification="DECORATIVE_BACKGROUND"
      />

      {/*
        Scrollable form panel — fixed from below the portrait area to above the NavBar.
        Content scrolls inside so the NavBar never covers any field.
        top offset exposes the background photography (portrait).
      */}
      <div style={{
        position: 'fixed',
        top: 'clamp(180px, 24vh, 280px)',
        bottom: 110,
        left: 0,
        right: 0,
        zIndex: 400,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        padding: '0 12px 8px',
        pointerEvents: 'none',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(5,3,1,0.96)',
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: 'clamp(18px,3vw,28px) clamp(16px,3vw,28px)',
          maxWidth: 560,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>

          {/* Section heading — 20px, readable */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 700,
              color: GOLD,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
            }}>
              SmokeCraft 360
            </div>
            <div style={{
              fontSize: 'clamp(18px, 2.5vw, 20px)',
              fontFamily: 'Georgia, serif',
              fontWeight: 700,
              color: '#e5e2e1',
              lineHeight: 1.3,
              marginBottom: 6,
            }}>
              Begin Your Journey
            </div>
            <div style={{ fontSize: 15, color: DIM, fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>
              Tell us about yourself so we can personalize your SmokeCraft experience.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Full Name + Preferred Name */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  placeholder="First and Last Name"
                  value={form.fullName}
                  onChange={e => set('fullName', e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.fullName ? '#e05a5a' : BORDER }}
                  autoComplete="name"
                />
                {errors.fullName && (
                  <div style={{ color: '#e05a5a', fontSize: 14, marginTop: 5, lineHeight: 1.4 }}>
                    {errors.fullName}
                  </div>
                )}
              </div>
              <div style={{ flex: '1 1 160px' }}>
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

            {/* Cigar Experience Level */}
            <div>
              <label style={labelStyle}>Cigar Experience Level *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {EXPERIENCE_LEVELS.map(l => {
                  const active = form.experienceLevel === l.id
                  return (
                    <button
                      key={l.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => { triggerHaptic('light'); set('experienceLevel', l.id) }}
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
              {errors.experienceLevel && (
                <div style={{ color: '#e05a5a', fontSize: 14, marginTop: 5, lineHeight: 1.4 }}>
                  {errors.experienceLevel}
                </div>
              )}
            </div>

            {/* What Excites You Most */}
            <div>
              <label style={labelStyle}>What Excites You Most</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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

            {/* Email + Birth Date */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 180px' }}>
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
              <div style={{ flex: '1 1 150px' }}>
                <label style={labelStyle}>Birth Date</label>
                <input
                  type="date"
                  value={form.birthDate}
                  onChange={e => set('birthDate', e.target.value)}
                  style={{ ...inputStyle, colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* Country */}
            <div>
              <label style={labelStyle}>Country</label>
              <select
                value={form.country}
                onChange={e => set('country', e.target.value)}
                style={{ ...inputStyle, color: form.country ? '#e5e2e1' : DIM }}
              >
                <option value="">Select your country...</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

          </div>

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

      <SmokeCraftNavBar
        primary="Begin My Journey"
        onPrimary={handleBegin}
        secondary="Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
