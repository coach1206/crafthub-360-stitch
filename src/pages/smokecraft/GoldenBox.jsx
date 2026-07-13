import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'

const GOLD    = '#E9C176'
const GOLD_DIM = 'rgba(233,193,118,0.70)'
const DARK    = '#0a0603'
const PANEL   = 'rgba(5,3,1,0.94)'
const BORDER  = 'rgba(233,193,118,0.18)'
const DIM     = 'rgba(229,226,225,0.55)'
const LS_KEY  = 'sc_golden_box_v1'

const EXPERIENCE_LEVELS = [
  { id: 'beginner',     label: 'New to Cigars' },
  { id: 'occasional',  label: 'Occasional Smoker' },
  { id: 'enthusiast',  label: 'Regular Enthusiast' },
  { id: 'connoisseur', label: 'Experienced Connoisseur' },
  { id: 'expert',      label: 'Expert / Sommelier Level' },
]

const FOCUS_AREAS = [
  { id: 'flavor',     label: 'Flavor Discovery' },
  { id: 'pairing',   label: 'Food & Drink Pairing' },
  { id: 'origins',   label: 'Origins & Terroir' },
  { id: 'technique', label: 'Rolling & Technique' },
  { id: 'collection', label: 'Building a Collection' },
  { id: 'social',    label: 'Social Experience' },
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Mexico', 'Dominican Republic',
  'Cuba', 'Nicaragua', 'Honduras', 'Colombia', 'Brazil', 'France', 'Germany',
  'Italy', 'Spain', 'Japan', 'Australia', 'Singapore', 'UAE', 'Other',
]

const OCCASIONS = [
  'Birthday', 'Anniversary', 'Business Meeting', 'Celebration', 'Date Night',
  'Bachelor Party', 'Reunion', 'Casual Visit', 'Special Occasion', 'Other',
]

const EMPTY = {
  // Guest
  fullName: '', preferredName: '', email: '', birthDate: '', country: '',
  experienceLevel: '', focusArea: '', dietaryNotes: '',
  // Venue
  venueName: '', tableSection: '', serverHost: '', visitDate: '', visitTime: '',
  partySize: '', occasion: '',
  // Agreement
  acknowledged: false,
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

const sectionHeadStyle = {
  fontSize: 12,
  fontWeight: 700,
  color: GOLD,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: `1px solid ${BORDER}`,
}

export default function GoldenBox() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()

  const [form, setForm] = useState(loadSaved)

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(form)) } catch (_) {}
  }, [form])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function handleContinue() {
    if (!form.acknowledged) return
    triggerHaptic('medium')
    try { awardSessionRewards('golden-box') } catch (_) {}
    navigate('/smokecraft/mentor-selection')
  }

  return (
    <SmokeCraftAssetScreen
      src="/assets/smokecraft/GOLDEN BOX RULES.png"
      alt="SmokeCraft Golden Box — The Five Golden Principles"
      classification="LIVE_REACT_PAGE_ARTWORK"
    >
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
            <div style={{ fontSize: 'clamp(18px, 3.5vw, 22px)', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#e5e2e1', letterSpacing: '0.04em' }}>
              Guest & Venue Information
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Guest Information */}
            <div>
              <div style={sectionHeadStyle}>Guest Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <label style={labelStyle}>Full Name</label>
                    <input
                      type="text"
                      placeholder="First & Last Name"
                      value={form.fullName}
                      onChange={e => set('fullName', e.target.value)}
                      style={inputStyle}
                      autoComplete="name"
                    />
                  </div>
                  <div style={{ flex: '1 1 130px' }}>
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

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={labelStyle}>Birth Date</label>
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={e => set('birthDate', e.target.value)}
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                      autoComplete="bday"
                    />
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
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

                <div>
                  <label style={labelStyle}>Cigar Experience Level</label>
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
                </div>

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

                <div>
                  <label style={labelStyle}>Dietary / Accommodation Notes</label>
                  <textarea
                    placeholder="Any dietary restrictions or special accommodations..."
                    value={form.dietaryNotes}
                    onChange={e => set('dietaryNotes', e.target.value)}
                    rows={2}
                    style={{
                      ...inputStyle,
                      resize: 'vertical',
                      minHeight: 64,
                    }}
                  />
                </div>

              </div>
            </div>

            {/* Venue Information */}
            <div>
              <div style={sectionHeadStyle}>Venue Information</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                <div>
                  <label style={labelStyle}>Venue Name</label>
                  <input
                    type="text"
                    placeholder="Lounge or venue name"
                    value={form.venueName}
                    onChange={e => set('venueName', e.target.value)}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 130px' }}>
                    <label style={labelStyle}>Table / Section</label>
                    <input
                      type="text"
                      placeholder="e.g. Table 4, VIP"
                      value={form.tableSection}
                      onChange={e => set('tableSection', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ flex: '1 1 130px' }}>
                    <label style={labelStyle}>Server / Host</label>
                    <input
                      type="text"
                      placeholder="Name"
                      value={form.serverHost}
                      onChange={e => set('serverHost', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 140px' }}>
                    <label style={labelStyle}>Visit Date</label>
                    <input
                      type="date"
                      value={form.visitDate}
                      onChange={e => set('visitDate', e.target.value)}
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={labelStyle}>Time</label>
                    <input
                      type="time"
                      value={form.visitTime}
                      onChange={e => set('visitTime', e.target.value)}
                      style={{ ...inputStyle, colorScheme: 'dark' }}
                    />
                  </div>
                  <div style={{ flex: '1 1 90px' }}>
                    <label style={labelStyle}>Party Size</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      placeholder="1"
                      value={form.partySize}
                      onChange={e => set('partySize', e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Occasion</label>
                  <select
                    value={form.occasion}
                    onChange={e => set('occasion', e.target.value)}
                    style={{ ...inputStyle, color: form.occasion ? '#e5e2e1' : DIM }}
                  >
                    <option value="" disabled>Select occasion</option>
                    {OCCASIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

              </div>
            </div>

            {/* Rule Acknowledgement */}
            <div style={{
              background: 'rgba(233,193,118,0.06)',
              border: `1px solid ${BORDER}`,
              borderRadius: 10,
              padding: '14px 16px',
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={form.acknowledged}
                  onChange={e => { triggerHaptic('light'); set('acknowledged', e.target.checked) }}
                  style={{
                    width: 20,
                    height: 20,
                    accentColor: GOLD,
                    cursor: 'pointer',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <span style={{
                  fontFamily: 'Georgia, serif',
                  fontSize: 14,
                  color: form.acknowledged ? '#e5e2e1' : DIM,
                  lineHeight: 1.5,
                }}>
                  I have read and acknowledge the Golden Box principles. I commit to upholding the SmokeCraft 360 standard of excellence throughout this experience.
                </span>
              </label>
            </div>

          </div>

          {/* CTAs */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              type="button"
              onClick={handleContinue}
              disabled={!form.acknowledged}
              style={{
                display: 'block',
                width: '100%',
                background: form.acknowledged ? GOLD : 'rgba(233,193,118,0.20)',
                color: form.acknowledged ? DARK : 'rgba(10,6,3,0.35)',
                border: 'none',
                borderRadius: 28,
                padding: '16px 24px',
                fontSize: 16,
                fontWeight: 700,
                fontFamily: 'Georgia, serif',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                cursor: form.acknowledged ? 'pointer' : 'not-allowed',
                minHeight: 52,
                boxShadow: form.acknowledged ? '0 4px 20px rgba(233,193,118,0.38)' : 'none',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              Save and Continue →
            </button>

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
    </SmokeCraftAssetScreen>
  )
}
