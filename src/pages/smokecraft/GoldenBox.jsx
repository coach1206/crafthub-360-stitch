import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD   = '#E9C176'
const DARK   = '#0a0603'
const DIM    = 'rgba(229,226,225,0.55)'
const PANEL  = 'rgba(10,6,3,0.96)'
const BORDER = 'rgba(233,193,118,0.22)'
const GREEN  = '#5adb8e'

const LS_KEY = 'sc_golden_box_v1'

// ── The Five Principles ───────────────────────────────────────────────────────
const PRINCIPLES = [
  { num: 'I',   title: 'Presence',   body: 'Give this experience your complete attention. Set aside the world outside.' },
  { num: 'II',  title: 'Respect',    body: 'Honor the craft, the culture, and the leaf that arrived in your hands.' },
  { num: 'III', title: 'Discovery',  body: 'Approach every note with curiosity. There are no wrong answers — only honest ones.' },
  { num: 'IV',  title: 'Patience',   body: 'Allow the smoke to speak at its own pace. Rushing cheats the experience.' },
  { num: 'V',   title: 'Memory',     body: 'Record what you discover. Your Passport grows with every honest observation.' },
]

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Select your experience level' },
  { value: 'new',          label: 'New to cigars' },
  { value: 'occasional',   label: 'Occasional smoker (a few per year)' },
  { value: 'regular',      label: 'Regular smoker (monthly)' },
  { value: 'enthusiast',   label: 'Enthusiast (weekly)' },
  { value: 'connoisseur',  label: 'Connoisseur (daily)' },
]

// ── Persistence ───────────────────────────────────────────────────────────────
const EMPTY = {
  guestName: '', experienceLevel: '', focus: '',
  venueName: '', tableSection: '', partySize: '', specialOccasion: '',
  acknowledged: false, savedAt: null,
}

function load() {
  try {
    const raw = sessionStorage.getItem(LS_KEY) || localStorage.getItem(LS_KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY }
  } catch { return { ...EMPTY } }
}

function save(s) {
  const data = { ...s, savedAt: Date.now() }
  try { sessionStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {}
}

// ── Shared field styles ───────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.07)',
  border: `1px solid ${BORDER}`,
  borderRadius: 8,
  padding: '12px 14px',
  color: '#e5e2e1',
  fontSize: 16,
  fontFamily: 'Georgia, serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block',
  fontSize: 14,
  fontWeight: 600,
  color: GOLD,
  fontFamily: 'Georgia, serif',
  marginBottom: 6,
  letterSpacing: '0.04em',
}

const sectionHeadStyle = {
  fontSize: 11,
  fontWeight: 700,
  color: GOLD,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  marginBottom: 14,
  paddingBottom: 8,
  borderBottom: `1px solid ${BORDER}`,
}

export default function GoldenBox() {
  const { awardSessionRewards } = useGuestSession()
  const navigate = useNavigate()
  const [form, setForm] = useState(load)
  const [venueInfoSaved, setVenueInfoSaved] = useState(false)
  const [done, setDone] = useState(false)

  // Restore acknowledged state
  useEffect(() => {
    setForm(load())
  }, [])

  function update(field, value) {
    setForm(prev => {
      const next = { ...prev, [field]: value }
      save(next)
      return next
    })
    setVenueInfoSaved(false)
  }

  function handleSaveVenueInfo() {
    triggerHaptic('light')
    save(form)
    setVenueInfoSaved(true)
    setTimeout(() => setVenueInfoSaved(false), 2500)
  }

  function handleContinue() {
    if (!form.acknowledged || done) return
    setDone(true)
    triggerHaptic('medium')
    save({ ...form, acknowledgedAt: Date.now() })
    awardSessionRewards('golden-box')
    navigate('/smokecraft/mentor-selection')
  }

  return (
    <div
      aria-label="SmokeCraft Golden Box Rules — The Five Principles"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100dvw',
        height: '100dvh',
        backgroundColor: DARK,
        overflowY: 'auto',
        overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Hero image */}
      <div
        aria-hidden="true"
        style={{
          width: '100%',
          height: 'clamp(180px, 32vw, 340px)',
          backgroundImage: 'url(/assets/smokecraft/GOLDEN%20BOX%20RULES.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat',
          flexShrink: 0,
        }}
      />

      {/* Scrollable content */}
      <div
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '0 20px 120px',
        }}
      >
        {/* Title */}
        <div style={{ textAlign: 'center', padding: '28px 0 20px' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: GOLD, marginBottom: 8,
          }}>
            SmokeCraft 360
          </div>
          <h1 style={{
            fontSize: 'clamp(22px, 4vw, 32px)', fontFamily: 'Georgia, serif',
            fontWeight: 700, color: '#e5e2e1', margin: 0, letterSpacing: '0.04em',
          }}>
            The Golden Box
          </h1>
          <p style={{
            fontSize: 16, color: DIM, fontFamily: 'Georgia, serif',
            marginTop: 10, lineHeight: 1.55,
          }}>
            Before your journey begins, commit to five principles that define the SmokeCraft experience.
          </p>
        </div>

        {/* ── Section 1: Principles ─────────────────────────────────────── */}
        <section aria-label="The Five Principles" style={{ marginBottom: 32 }}>
          <div style={sectionHeadStyle}>The Five Principles</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PRINCIPLES.map(p => (
              <div
                key={p.num}
                style={{
                  background: PANEL,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 10,
                  padding: '14px 16px',
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <div style={{
                  minWidth: 32, height: 32, borderRadius: '50%',
                  border: `1.5px solid ${GOLD}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: GOLD,
                  fontFamily: 'Georgia, serif', flexShrink: 0,
                  letterSpacing: '0.04em',
                }}>
                  {p.num}
                </div>
                <div>
                  <div style={{
                    fontSize: 16, fontWeight: 700, color: GOLD,
                    fontFamily: 'Georgia, serif', marginBottom: 4,
                  }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 15, color: 'rgba(229,226,225,0.8)', lineHeight: 1.55 }}>
                    {p.body}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 2: Guest Commitment ───────────────────────────────── */}
        <section aria-label="Guest Commitment" style={{ marginBottom: 32 }}>
          <div style={sectionHeadStyle}>Your Commitment</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label htmlFor="gb-name" style={labelStyle}>
                Name <span style={{ fontWeight: 400, color: DIM }}>(optional)</span>
              </label>
              <input
                id="gb-name"
                type="text"
                value={form.guestName}
                onChange={e => update('guestName', e.target.value)}
                placeholder="Your preferred name"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="gb-exp" style={labelStyle}>
                Experience Level
              </label>
              <select
                id="gb-exp"
                value={form.experienceLevel}
                onChange={e => update('experienceLevel', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {EXPERIENCE_LEVELS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="gb-focus" style={labelStyle}>
                What are you hoping to discover? <span style={{ fontWeight: 400, color: DIM }}>(optional)</span>
              </label>
              <textarea
                id="gb-focus"
                value={form.focus}
                onChange={e => update('focus', e.target.value)}
                placeholder="Flavor notes you're curious about, pairing ideas, a specific cigar profile…"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }}
              />
            </div>
          </div>
        </section>

        {/* ── Section 3: Venue Settings ─────────────────────────────────── */}
        <section aria-label="Venue Settings" style={{ marginBottom: 32 }}>
          <div style={sectionHeadStyle}>Venue &amp; Session Info</div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
              gap: 18,
            }}
          >
            <div>
              <label htmlFor="gb-venue" style={labelStyle}>Venue Name</label>
              <input
                id="gb-venue"
                type="text"
                value={form.venueName}
                onChange={e => update('venueName', e.target.value)}
                placeholder="e.g. Novee Grand Lounge"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="gb-table" style={labelStyle}>
                Table / Section <span style={{ fontWeight: 400, color: DIM }}>(optional)</span>
              </label>
              <input
                id="gb-table"
                type="text"
                value={form.tableSection}
                onChange={e => update('tableSection', e.target.value)}
                placeholder="e.g. Table 4, Lounge A"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="gb-party" style={labelStyle}>
                Party Size <span style={{ fontWeight: 400, color: DIM }}>(optional)</span>
              </label>
              <input
                id="gb-party"
                type="number"
                min="1"
                max="20"
                value={form.partySize}
                onChange={e => update('partySize', e.target.value)}
                placeholder="1"
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="gb-occasion" style={labelStyle}>
                Special Occasion <span style={{ fontWeight: 400, color: DIM }}>(optional)</span>
              </label>
              <input
                id="gb-occasion"
                type="text"
                value={form.specialOccasion}
                onChange={e => update('specialOccasion', e.target.value)}
                placeholder="e.g. Birthday, Anniversary"
                style={inputStyle}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveVenueInfo}
            style={{
              marginTop: 18,
              background: 'transparent',
              color: venueInfoSaved ? GREEN : GOLD,
              border: `1.5px solid ${venueInfoSaved ? GREEN : GOLD}`,
              borderRadius: 24,
              padding: '12px 28px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              touchAction: 'manipulation',
              minHeight: 48,
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            {venueInfoSaved ? '✓ Venue Info Saved' : 'Save Venue Info'}
          </button>
        </section>

        {/* ── Section 4: Acknowledgement ────────────────────────────────── */}
        <section aria-label="Acknowledgement" style={{ marginBottom: 32 }}>
          <div style={sectionHeadStyle}>Your Agreement</div>

          <div style={{
            background: PANEL,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: '16px 18px',
            marginBottom: 18,
          }}>
            <p style={{ fontSize: 15, color: 'rgba(229,226,225,0.8)', lineHeight: 1.6, margin: 0 }}>
              By continuing, I agree to engage with this experience in the spirit of the Five Principles.
              I understand that my observations will be recorded to my SmokeCraft Passport and that
              this is a guided educational journey, not a sales experience.
            </p>
          </div>

          <label
            htmlFor="gb-ack"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              cursor: 'pointer',
              minHeight: 44,
              padding: '6px 0',
            }}
          >
            <input
              id="gb-ack"
              type="checkbox"
              checked={form.acknowledged}
              onChange={e => {
                triggerHaptic('light')
                update('acknowledged', e.target.checked)
              }}
              style={{
                width: 22, height: 22,
                accentColor: GOLD,
                cursor: 'pointer',
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <span style={{
              fontSize: 16,
              fontFamily: 'Georgia, serif',
              color: form.acknowledged ? GOLD : 'rgba(229,226,225,0.8)',
              lineHeight: 1.55,
            }}>
              I acknowledge the Golden Box principles and commit to the SmokeCraft experience
            </span>
          </label>
        </section>

        {/* ── Section 5: Actions ────────────────────────────────────────── */}
        <section aria-label="Actions" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            type="button"
            disabled={!form.acknowledged || done}
            onClick={handleContinue}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 28,
              padding: '18px 24px',
              fontSize: 16,
              fontWeight: 700,
              fontFamily: 'Georgia, serif',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              cursor: form.acknowledged && !done ? 'pointer' : 'not-allowed',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: 56,
              background: form.acknowledged && !done ? GOLD : 'rgba(233,193,118,0.2)',
              color: form.acknowledged && !done ? DARK : 'rgba(10,6,3,0.35)',
              boxShadow: form.acknowledged && !done ? '0 4px 24px rgba(233,193,118,0.45)' : 'none',
              transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
            }}
          >
            {done ? 'Continuing…' : 'Continue to Mentor Selection →'}
          </button>

          <button
            type="button"
            onClick={() => { triggerHaptic('light'); navigate('/smokecraft/enroll') }}
            style={{
              width: '100%',
              border: `1.5px solid rgba(233,193,118,0.3)`,
              borderRadius: 28,
              padding: '14px 24px',
              fontSize: 15,
              fontWeight: 600,
              fontFamily: 'Georgia, serif',
              letterSpacing: '0.04em',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              minHeight: 52,
              background: 'transparent',
              color: GOLD,
            }}
          >
            ← Back to Enroll
          </button>
        </section>
      </div>
    </div>
  )
}
