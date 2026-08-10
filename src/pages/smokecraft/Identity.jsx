import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { VISIT_STRUCTURE } from '../../constants/session.js'
import SmokeCraftHeroCrop from '../../components/smokecraft/SmokeCraftHeroCrop.jsx'
import {
  GOLD,
  GOLD_DIM,
  CREAM,
  BORDER,
  GLASS,
  heroBannerStyle,
  pageShellStyle,
  cardStyle,
  sectionLabelStyle,
} from '../../constants/smokecraftLiveScreenTokens.js'

/**
 * Identity — /smokecraft/identity
 *
 * Live-DOM migration.
 * The previous implementation rendered the complete IDENTY.png production
 * screen as the functional shell and positioned form controls/navigation as
 * percentage-based overlays. That created the two-generation split and made
 * the baked image responsible for layout, labels, cards and navigation.
 *
 * This implementation keeps all behavior in real DOM:
 * - blank-by-default identity form
 * - validation and debounced journey autosave
 * - enroll gate
 * - real semantic navigation
 * - account-level summary cards
 * - responsive tablet-first layout
 *
 * No baked screenshot UI or click hotspot is used by this screen.
 */

const EXPERIENCE_LEVELS = [
  { id: 'beginner', label: 'New to Cigars' },
  { id: 'occasional', label: 'Occasional Smoker' },
  { id: 'enthusiast', label: 'Regular Enthusiast' },
  { id: 'connoisseur', label: 'Experienced Connoisseur' },
  { id: 'expert', label: 'Expert / Sommelier Level' },
]

const FOCUS_AREAS = [
  { id: 'flavor', label: 'Flavor Discovery' },
  { id: 'pairing', label: 'Food & Drink Pairing' },
  { id: 'origins', label: 'Origins & Terroir' },
  { id: 'technique', label: 'Rolling & Technique' },
  { id: 'collection', label: 'Building a Collection' },
  { id: 'social', label: 'Social Experience' },
]

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Mexico', 'Dominican Republic',
  'Cuba', 'Nicaragua', 'Honduras', 'Colombia', 'Brazil', 'France', 'Germany',
  'Italy', 'Spain', 'Japan', 'Australia', 'Singapore', 'UAE', 'Other',
]

const EMPTY = {
  fullName: '',
  email: '',
  preferredName: '',
  birthDate: '',
  country: '',
  experienceLevel: '',
  focusArea: '',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const REGISTERED_ROUTES = new Set(
  VISIT_STRUCTURE.flatMap(v => v.sessions.map(s => s.route)).filter(Boolean)
)

const SESSION_BY_ROUTE = (() => {
  const map = new Map()
  for (const visit of VISIT_STRUCTURE) {
    for (const session of visit.sessions) {
      if (session.route && !map.has(session.route)) map.set(session.route, session)
    }
  }
  return map
})()

const JOURNEY_LINKS = [
  { route: '/smokecraft/identity', label: 'Identity' },
  { route: '/smokecraft/golden-box', label: 'Golden Box' },
  { route: '/smokecraft/mentor-selection', label: 'Mentor' },
  { route: '/smokecraft/pairing-lab', label: 'Pairing Lab' },
  { route: '/smokecraft/humidor-match', label: 'Humidor Match' },
  { route: '/smokecraft/request-purchase', label: 'Request / Purchase' },
  { route: '/smokecraft/cut-toast-light', label: 'Cut, Toast & Light' },
  { route: '/smokecraft/first-third', label: 'First Third' },
]

const inputStyle = {
  width: '100%',
  minHeight: 48,
  boxSizing: 'border-box',
  background: '#0d1420',
  border: `1px solid ${BORDER}`,
  borderRadius: 9,
  color: CREAM,
  fontFamily: 'Georgia, serif',
  fontSize: 'clamp(14px,1.35vw,16px)',
  padding: '0 14px',
  outline: 'none',
  colorScheme: 'dark',
}

function validateForm(form) {
  const errors = {}
  if (!form.fullName.trim()) errors.fullName = 'Full name is required'
  if (!form.experienceLevel) errors.experienceLevel = 'Please select your experience level'
  if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) errors.email = 'Enter a valid email address'
  if (form.birthDate) {
    const date = new Date(form.birthDate)
    const now = new Date()
    if (Number.isNaN(date.getTime()) || date > now) {
      errors.birthDate = 'Enter a valid birth date'
    } else {
      const age = (now - date) / (1000 * 60 * 60 * 24 * 365.25)
      if (age < 13 || age > 120) errors.birthDate = 'Enter a valid birth date'
    }
  }
  return errors
}

export default function Identity() {
  const navigate = useNavigate()
  const { awardSessionRewards, session } = useGuestSession()
  const { currentAllowed, isDemoMode, completedSessions } = useSmokeCraftProgress()
  const { journey, setIdentity } = useSmokeCraftJourney()

  const [form, setForm] = useState(() => journey.identity ? { ...EMPTY, ...journey.identity } : { ...EMPTY })
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle')
  const initialized = useRef(false)

  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('enroll')) {
      navigate('/smokecraft/enroll', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true
      return
    }
    setSaveStatus('saving')
    setIdentity(form)
    const timer = setTimeout(() => setSaveStatus('saved'), 300)
    return () => clearTimeout(timer)
  }, [form]) // eslint-disable-line react-hooks/exhaustive-deps

  const errors = useMemo(() => validateForm(form), [form])

  function set(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
  }

  function handleBegin() {
    setTouched({ fullName: true, experienceLevel: true, email: true, birthDate: true })
    if (Object.keys(errors).length > 0) {
      triggerHaptic('error')
      return
    }
    if (submitting) return
    setSubmitting(true)
    triggerHaptic('medium')
    try { awardSessionRewards('identity') } catch (_) {}
    navigate('/smokecraft/venue-select')
  }

  const firstError = touched.fullName && errors.fullName
    ? errors.fullName
    : touched.experienceLevel && errors.experienceLevel
      ? errors.experienceLevel
      : touched.email && errors.email
        ? errors.email
        : touched.birthDate && errors.birthDate
          ? errors.birthDate
          : null

  function fieldLabel(text, required = false) {
    return (
      <span style={{ display: 'block', marginBottom: 7, fontSize: 12, color: GOLD_DIM, fontWeight: 700, letterSpacing: '0.06em' }}>
        {text}{required ? ' *' : ''}
      </span>
    )
  }

  function textField(field, type, label, required = false) {
    const invalid = Boolean(touched[field] && errors[field])
    return (
      <label style={{ display: 'block' }}>
        {fieldLabel(label, required)}
        <input
          data-testid={`identity-${field}`}
          type={type}
          aria-invalid={invalid}
          aria-required={required ? 'true' : undefined}
          value={form[field]}
          onChange={event => set(field, event.target.value)}
          onBlur={() => setTouched(prev => ({ ...prev, [field]: true }))}
          style={{ ...inputStyle, borderColor: invalid ? '#e05a5a' : BORDER }}
          onFocus={event => { event.currentTarget.style.borderColor = GOLD }}
        />
        {invalid && <span role="alert" style={{ display: 'block', marginTop: 6, color: '#e77878', fontSize: 12 }}>{errors[field]}</span>}
      </label>
    )
  }

  function selectField(field, label, placeholder, options, required = false) {
    const invalid = Boolean(touched[field] && errors[field])
    return (
      <label style={{ display: 'block' }}>
        {fieldLabel(label, required)}
        <select
          data-testid={`identity-${field}`}
          aria-invalid={invalid}
          aria-required={required ? 'true' : undefined}
          value={form[field]}
          onChange={event => { triggerHaptic('light'); set(field, event.target.value) }}
          onBlur={() => setTouched(prev => ({ ...prev, [field]: true }))}
          style={{ ...inputStyle, cursor: 'pointer', borderColor: invalid ? '#e05a5a' : BORDER }}
        >
          <option value="">{placeholder}</option>
          {options.map(option => (
            <option key={option.id ?? option} value={option.id ?? option}>{option.label ?? option}</option>
          ))}
        </select>
        {invalid && <span role="alert" style={{ display: 'block', marginTop: 6, color: '#e77878', fontSize: 12 }}>{errors[field]}</span>}
      </label>
    )
  }

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={pageShellStyle}>
        <SmokeCraftHeroCrop assetKey="identity" label="A guest enjoying a cigar in a lounge setting" bgPosition="56% 10%" bgSize="270%" />
        <div style={heroBannerStyle}>
          <div aria-hidden="true" style={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            border: `1px solid ${BORDER}`,
            background: 'rgba(233,193,118,0.08)',
            color: GOLD,
            fontSize: 26,
            fontWeight: 700,
          }}>I</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              SmokeCraft 360 — Personal Dashboard
            </div>
            <h1 style={{ margin: '4px 0 6px', fontSize: 'clamp(26px,3.4vw,36px)', color: CREAM }}>Identity</h1>
            <p style={{ margin: 0, fontSize: 'clamp(13px,1.4vw,16px)', color: 'rgba(229,226,225,0.68)', lineHeight: 1.55, maxWidth: 720 }}>
              Set up this journey around your experience and interests. Your selections stay editable and are saved as you go.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(280px, .8fr)', gap: 'clamp(16px,2.2vw,24px)', alignItems: 'start' }}>
          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,28px)' }}>
            <div style={sectionLabelStyle}>Let’s get to know you</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))', gap: '18px 16px', marginTop: 16 }}>
              {textField('fullName', 'text', 'Full Name', true)}
              {textField('email', 'email', 'Email Address')}
              {textField('preferredName', 'text', 'Preferred Name')}
              {textField('birthDate', 'date', 'Birth Date')}
              {selectField('country', 'Country', 'Select country', COUNTRIES)}
              {selectField('experienceLevel', 'Cigar Experience Level', 'Select experience level', EXPERIENCE_LEVELS, true)}
              {selectField('focusArea', 'What excites you most?', 'Select focus area', FOCUS_AREAS)}
            </div>

            {/* The page's own "Begin My Journey" button was removed here —
                it duplicated the shared NavBar's primary action below and,
                at smaller tablet viewports, the two fixed/in-flow controls
                visually collided (the NavBar sits at position:fixed bottom:0
                and could partially cover this button once the form grew
                past the viewport height). One real control, not two. */}
            <div role={firstError ? 'alert' : 'status'} aria-live="polite" data-testid="identity-status" style={{ minHeight: 20, marginTop: 16, fontSize: 12.5, color: firstError ? '#e77878' : GOLD }}>
              {firstError || (saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? '✓ Saved' : '')}
            </div>
          </section>

          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <section style={{ ...cardStyle, padding: 18 }}>
              <div style={sectionLabelStyle}>Quick Stats</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 14 }}>
                {[
                  ['XP', session?.xp || 0],
                  ['Badges', session?.stamps?.length || session?.badges?.length || 0],
                  ['Journeys', journey.previousCompletedJourneys?.length || 0],
                ].map(([label, value]) => (
                  <div key={label} style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '12px 8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 'clamp(18px,2vw,24px)', color: GOLD, fontWeight: 700 }}>{value}</div>
                    <div style={{ fontSize: 10.5, color: 'rgba(229,226,225,.52)', marginTop: 4 }}>{label}</div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ ...cardStyle, padding: 18 }}>
              <div style={sectionLabelStyle}>Journey</div>
              <nav aria-label="SmokeCraft journey shortcuts" style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                {JOURNEY_LINKS.filter(item => item.route === '/smokecraft/identity' || REGISTERED_ROUTES.has(item.route)).map(item => {
                  const sessionMeta = SESSION_BY_ROUTE.get(item.route)
                  const done = sessionMeta ? completedSessions?.includes(sessionMeta.session) : false
                  const isCurrent = currentAllowed?.route === item.route
                  const unlocked = item.route === '/smokecraft/identity' || isDemoMode || done || isCurrent
                  return (
                    <button
                      key={item.route}
                      type="button"
                      disabled={!unlocked}
                      aria-current={isCurrent ? 'step' : undefined}
                      onClick={() => { triggerHaptic('light'); navigate(item.route) }}
                      style={{
                        minHeight: 46,
                        width: '100%',
                        textAlign: 'left',
                        padding: '0 13px',
                        borderRadius: 8,
                        border: `1px solid ${isCurrent ? GOLD : BORDER}`,
                        background: isCurrent ? 'rgba(233,193,118,.12)' : GLASS,
                        color: unlocked ? CREAM : 'rgba(229,226,225,.28)',
                        fontFamily: 'Georgia, serif',
                        cursor: unlocked ? 'pointer' : 'not-allowed',
                      }}
                    >
                      {item.label}{done ? '  ✓' : ''}
                    </button>
                  )
                })}
              </nav>
            </section>
          </aside>
        </div>

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftNavBar
        primary={submitting ? 'Opening Journey…' : 'Continue to Venue Selection →'}
        onPrimary={handleBegin}
        secondary="← Back"
        onSecondary={() => { triggerHaptic('light'); navigate('/smokecraft/enroll') }}
      />
    </SmokeCraftScreenShell>
  )
}
