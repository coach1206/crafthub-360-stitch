import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'

const GOLD     = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.70)'
const DARK     = '#0a0603'
const BORDER   = 'rgba(233,193,118,0.18)'
const DIM      = 'rgba(229,226,225,0.55)'
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

const inputStyle = {
  display: 'block',
  width: '100%',
  background: 'rgba(10,6,3,0.88)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  fontFamily: 'Georgia, serif',
  color: '#e5e2e1',
  boxSizing: 'border-box',
  outline: 'none',
  WebkitAppearance: 'none',
  minHeight: 44,
}

const labelStyle = {
  display: 'block',
  fontSize: 10,
  fontWeight: 700,
  color: GOLD_DIM,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  marginBottom: 4,
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
    if (!form.fullName.trim()) e.fullName = 'Required'
    if (!form.experienceLevel) e.experienceLevel = 'Select your level'
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
        alt="SmokeCraft Identity — Let's Get To Know You"
        classification="DECORATIVE_BACKGROUND"
      />

      {/* Compact form panel — sits above the NavBar, does not cover the portrait or upper artwork */}
      <div style={{
        position: 'fixed',
        bottom: 110,
        left: 0,
        right: 0,
        zIndex: 400,
        padding: '0 12px',
        pointerEvents: 'none',
        maxHeight: '52vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{
          pointerEvents: 'auto',
          background: 'rgba(5,3,1,0.95)',
          border: `1px solid ${BORDER}`,
          borderRadius: 14,
          padding: 'clamp(12px,2vw,18px) clamp(12px,3vw,22px)',
          maxWidth: 520,
          margin: '0 auto',
          boxSizing: 'border-box',
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
            Begin Your Journey — Tell Us About You
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Full Name + Preferred Name */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px' }}>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text"
                  placeholder="First & Last Name"
                  value={form.fullName}
                  onChange={e => set('fullName', e.target.value)}
                  style={{ ...inputStyle, borderColor: errors.fullName ? '#e05a5a' : BORDER }}
                  autoComplete="name"
                />
                {errors.fullName && <div style={{ color: '#e05a5a', fontSize: 10, marginTop: 2 }}>{errors.fullName}</div>}
              </div>
              <div style={{ flex: '1 1 120px' }}>
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

            {/* Experience Level */}
            <div>
              <label style={labelStyle}>Cigar Experience Level *</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
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
                        border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.28)'}`,
                        borderRadius: 20,
                        padding: '8px 12px',
                        minHeight: 44,
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: 'Georgia, serif',
                        cursor: 'pointer',
                        touchAction: 'manipulation',
                      }}
                    >
                      {l.label}
                    </button>
                  )
                })}
              </div>
              {errors.experienceLevel && <div style={{ color: '#e05a5a', fontSize: 10, marginTop: 2 }}>{errors.experienceLevel}</div>}
            </div>

            {/* What Excites You Most */}
            <div>
              <label style={labelStyle}>What Excites You Most</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {FOCUS_AREAS.map(f => {
                  const active = form.focusArea === f.id
                  return (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => { triggerHaptic('light'); set('focusArea', f.id) }}
                      style={{
                        background: active ? 'rgba(233,193,118,0.15)' : 'transparent',
                        color: active ? GOLD : GOLD_DIM,
                        border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.22)'}`,
                        borderRadius: 20,
                        padding: '8px 12px',
                        minHeight: 44,
                        fontSize: 12,
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

            {/* Optional: Email + Country in collapsed row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px' }}>
                <label style={labelStyle}>Email (optional)</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  style={inputStyle}
                  autoComplete="email"
                />
              </div>
              <div style={{ flex: '1 1 130px' }}>
                <label style={labelStyle}>Country (optional)</label>
                <select
                  value={form.country}
                  onChange={e => set('country', e.target.value)}
                  style={{ ...inputStyle, color: form.country ? '#e5e2e1' : DIM }}
                >
                  <option value="">Select…</option>
                  {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {canResume && (
            <div style={{ marginTop: 8, textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => navigate(currentAllowed.route)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: GOLD_DIM,
                  fontSize: 12,
                  fontFamily: 'Georgia, serif',
                  cursor: 'pointer',
                  padding: '4px 0',
                  textDecoration: 'underline',
                  touchAction: 'manipulation',
                }}
              >
                Continue Previous Session →
              </button>
            </div>
          )}
        </div>
      </div>

      <SmokeCraftNavBar
        primary="Begin My Journey →"
        onPrimary={handleBegin}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
