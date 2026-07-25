import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftProgress } from '../../context/SmokeCraftProgressContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { VISIT_STRUCTURE } from '../../constants/session.js'

/**
 * Identity — /smokecraft/identity  (Entry layer E4, NOT a curriculum session)
 *
 * FINAL APPROVED SHELLS PASS — this file replaces the hand-built two-column
 * CSS dashboard that the immediately-prior pass disclosed as still using the
 * decorative/cropped pattern.
 *
 * What was wrong
 * --------------
 * The approved asset IDENTY.png (1672 x 941) is a complete production screen:
 * its own sidebar, its own "LET'S GET TO KNOW YOU" form with SEVEN empty
 * fields and a BEGIN MY JOURNEY button, its own BACK / "NEXT: GOLDEN BOX
 * RULES" controls, and — critically — a right-hand column of DELIBERATELY
 * BLANK frames (JOURNEY PROGRESS, YOUR QUICK STATS, INSIGHTS & ANALYTICS,
 * YOUR JOURNEYS). It is the single best-prepared asset in the whole set: the
 * owner already exported it with empty value zones.
 *
 * The removed layout used that screen as a `background-size: cover,
 * 334.40% 294.06%` CROP of just the portrait region — i.e. it threw away the
 * entire approved composition and kept a photographic detail as decoration,
 * then rebuilt the form, the journey nav, and four dashboard cards in
 * Claude-authored CSS beneath it.
 *
 * What was removed
 * ----------------
 *   - the cropped `backgroundImage` portrait tile;
 *   - the duplicate "SmokeCraft 360 — Personal Dashboard" eyebrow and the
 *     duplicate "Begin Your Journey" <h1> (the approved image carries its own
 *     "IDENTITY" wordmark);
 *   - the entire generic <main> grid: the hand-built journey <nav> panel and
 *     the four glass-card panels (Journey Progress / Quick Stats / Insights &
 *     Analytics / Your Journeys);
 *   - the SmokeCraftNavBar (the approved image has its own BACK and
 *     "NEXT: GOLDEN BOX RULES" controls).
 *
 * Deliberately NOT re-rendered
 * ----------------------------
 * The mandate for this screen is explicit: remove prior journey history,
 * stale XP, old cigar, dashboard cards, analytics, and preselected options.
 * The approved image's right-hand column is blank BY DESIGN, so the honest
 * conversion is to leave those frames blank rather than to refill them with
 * account-level state on an entry-layer identity form. No XP, no badge count,
 * no rank, no past-journey list and no analytics is rendered on this screen.
 * That is why there is no overlay at all over the right column.
 *
 * Data logic PRESERVED EXACTLY (visual shell only was at fault)
 * ------------------------------------------------------------
 *   - blank-by-default fields (EMPTY) and the `journey.identity` reset fix
 *     from the earlier pass — `useState(() => journey.identity ? {...EMPTY,
 *     ...journey.identity} : {...EMPTY})` is carried over verbatim, so a
 *     reset journey yields empty fields and no name (e.g. "Greg Guy") can
 *     survive from a prior journey;
 *   - the explicit enroll gate (Identity shares the guard's Session 2
 *     checkpoint with Enroll);
 *   - validateForm, live errors, touched-state, aria-invalid/role=alert;
 *   - the debounced autosave through setIdentity;
 *   - awardSessionRewards('enroll') then navigate('/smokecraft/golden-box');
 *   - triggerHaptic on every control; keyboard access via real <button>,
 *     <input> and <select> elements with visible focus rings.
 *
 * No option is preselected: every <select> starts on its empty "" option.
 */

const NAT_W = 1672
const NAT_H = 941

const GOLD   = '#E9C176'
const BORDER = 'rgba(233,193,118,0.32)'

const EXPERIENCE_LEVELS = [
  { id: 'beginner',    label: 'New to Cigars' },
  { id: 'occasional',  label: 'Occasional Smoker' },
  { id: 'enthusiast',  label: 'Regular Enthusiast' },
  { id: 'connoisseur', label: 'Experienced Connoisseur' },
  { id: 'expert',      label: 'Expert / Sommelier Level' },
]

const FOCUS_AREAS = [
  { id: 'flavor',     label: 'Flavor Discovery' },
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Every route the registry actually declares — a sidebar hotspot is only
// rendered when its route genuinely exists, so this screen can never invent
// a destination.
const REGISTERED_ROUTES = new Set(
  VISIT_STRUCTURE.flatMap(v => v.sessions.map(s => s.route)).filter(Boolean)
)

const SESSION_BY_ROUTE = (() => {
  const m = new Map()
  for (const v of VISIT_STRUCTURE) for (const s of v.sessions) if (s.route && !m.has(s.route)) m.set(s.route, s)
  return m
})()

// The approved image's OWN sidebar items, in its own order, at its own
// coordinates. Each maps to a route the registry already declares.
const SIDEBAR = [
  { route: '/smokecraft/identity',         top: '15.4%' },
  { route: '/smokecraft/golden-box',       top: '23.2%' },
  { route: '/smokecraft/mentor-selection', top: '31.0%' },
  { route: '/smokecraft/pairing-lab',      top: '38.8%' },
  { route: '/smokecraft/humidor-match',    top: '46.6%' },
  { route: '/smokecraft/request-purchase', top: '54.4%' },
  { route: '/smokecraft/cut-toast-light',  top: '62.2%' },
  { route: '/smokecraft/first-third',      top: '70.0%' },
]
const SIDEBAR_ITEM = { left: '0.5%', width: '8.6%', height: '7.0%' }

// The approved form's own seven fields + its BEGIN MY JOURNEY button.
const FIELD_X = { left: '12.3%', width: '23.1%' }
const FIELD_H = '3.4%'
const FIELD_TOP = {
  fullName:        '28.0%',
  email:           '31.9%',
  preferredName:   '35.8%',
  birthDate:       '39.6%',
  country:         '43.6%',
  experienceLevel: '47.5%',
  focusArea:       '51.4%',
}
const BEGIN_BTN = { left: '12.3%', top: '55.7%', width: '23.1%', height: '3.7%' }

// The approved image's own BACK and "NEXT: GOLDEN BOX RULES" controls.
const BACK_BTN = { left: '72.6%', top: '2.3%',  width: '8.0%',  height: '4.5%' }
const NEXT_BTN = { left: '73.1%', top: '94.0%', width: '24.6%', height: '4.6%' }

// Live inputs sit on the image's own empty field slots. Opaque so the baked
// placeholder text underneath can never bleed through the live value.
const INPUT = {
  position: 'absolute',
  background: '#0d1420',
  border: `1px solid ${BORDER}`,
  borderRadius: 6,
  color: '#e5e2e1',
  fontFamily: 'Georgia, serif',
  fontSize: 'clamp(9px,0.95vw,15px)',
  padding: '0 2.2%',
  boxSizing: 'border-box',
  outline: 'none',
  pointerEvents: 'auto',
  WebkitAppearance: 'none',
  colorScheme: 'dark',
}

const HOTSPOT = {
  position: 'absolute',
  background: 'transparent',
  border: '1.5px solid transparent',
  borderRadius: 6,
  cursor: 'pointer',
  pointerEvents: 'auto',
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
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
  const { currentAllowed, isDemoMode, completedSessions } = useSmokeCraftProgress()
  const { journey, setIdentity } = useSmokeCraftJourney()
  const navigate = useNavigate()

  // PRESERVED: blank-by-default + the journey.identity reset fix.
  const [form, setForm] = useState(() => journey.identity ? { ...EMPTY, ...journey.identity } : { ...EMPTY })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved
  const initialized = useRef(false)

  // PRESERVED: Identity shares the guard's Session 2 numeric checkpoint with
  // Enroll, so the guard alone can't tell them apart. Enroll is the
  // authoritative Session 2 screen; Identity is only reachable after it.
  useEffect(() => {
    if (!isDemoMode && !session.completedSteps.includes('enroll')) {
      navigate('/smokecraft/enroll', { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // PRESERVED: debounced autosave through the canonical setIdentity.
  useEffect(() => {
    if (!initialized.current) { initialized.current = true; return }
    setSaveStatus('saving')
    setIdentity(form)
    const t = setTimeout(() => setSaveStatus('saved'), 300)
    return () => clearTimeout(t)
  }, [form]) // eslint-disable-line react-hooks/exhaustive-deps

  const liveErrors = useMemo(() => validateForm(form), [form])

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
    try { awardSessionRewards('identity') } catch (_) {}
    navigate('/smokecraft/venue-select')
  }

  const firstError = touched.fullName && liveErrors.fullName ? liveErrors.fullName
    : touched.experienceLevel && liveErrors.experienceLevel ? liveErrors.experienceLevel
    : touched.email && liveErrors.email ? liveErrors.email
    : touched.birthDate && liveErrors.birthDate ? liveErrors.birthDate
    : null

  function focusRing(e, on) { e.currentTarget.style.borderColor = on ? GOLD : BORDER }
  function hotspotRing(e, on) { e.currentTarget.style.borderColor = on ? GOLD : 'transparent' }

  function textField(field, type, label, top, extra = {}) {
    const invalid = Boolean(touched[field] && liveErrors[field])
    return (
      <input
        id={`id-${field}`}
        data-testid={`identity-${field}`}
        type={type}
        aria-label={label}
        aria-invalid={invalid}
        aria-required={field === 'fullName' ? 'true' : undefined}
        value={form[field]}
        onChange={e => set(field, e.target.value)}
        onBlur={() => handleBlur(field)}
        style={{
          ...INPUT, ...FIELD_X, top, height: FIELD_H,
          borderColor: invalid ? '#e05a5a' : BORDER,
          ...extra,
        }}
        onFocus={e => { if (!invalid) focusRing(e, true) }}
      />
    )
  }

  function selectField(field, label, top, placeholder, options) {
    const invalid = Boolean(touched[field] && liveErrors[field])
    return (
      <select
        id={`id-${field}`}
        data-testid={`identity-${field}`}
        aria-label={label}
        aria-invalid={invalid}
        value={form[field]}
        onChange={e => { triggerHaptic('light'); set(field, e.target.value) }}
        onBlur={() => handleBlur(field)}
        style={{
          ...INPUT, ...FIELD_X, top, height: FIELD_H,
          borderColor: invalid ? '#e05a5a' : BORDER,
          color: form[field] ? '#e5e2e1' : 'rgba(229,226,225,0.55)',
          cursor: 'pointer',
        }}
        onFocus={e => { if (!invalid) focusRing(e, true) }}
      >
        {/* No preselected option — the empty value is always the default. */}
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.id ?? o} value={o.id ?? o}>{o.label ?? o}</option>)}
      </select>
    )
  }

  return (
    <SmokeCraftImageBoundsOverlay
      src={SC_ASSETS.identity}
      naturalW={NAT_W}
      naturalH={NAT_H}
      alt="SmokeCraft 360 — Identity"
      bottomOffset={0}
    >
      {/* Single accessible title — the approved image carries the visible
          "IDENTITY" wordmark, so no duplicate heading is drawn. */}
      <h1 style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
      }}>SmokeCraft 360 — Identity</h1>

      {/* ── The approved form's own seven empty fields, now live ────────── */}
      {textField('fullName',      'text',  'Full Name',                FIELD_TOP.fullName)}
      {textField('email',         'email', 'Email Address',            FIELD_TOP.email)}
      {textField('preferredName', 'text',  'Preferred Name (optional)', FIELD_TOP.preferredName)}
      {textField('birthDate',     'date',  'Birth Date (optional)',    FIELD_TOP.birthDate)}
      {selectField('country',         'Country',               FIELD_TOP.country,         'Country',               COUNTRIES)}
      {selectField('experienceLevel', 'Cigar Experience Level', FIELD_TOP.experienceLevel, 'Cigar Experience Level', EXPERIENCE_LEVELS)}
      {selectField('focusArea',       'What excites you most?', FIELD_TOP.focusArea,       'What excites you most?', FOCUS_AREAS)}

      {/* Validation + save status, in the blank gutter beside the form */}
      <div
        role={firstError ? 'alert' : 'status'}
        aria-live="polite"
        data-testid="identity-status"
        style={{
          position: 'absolute', left: '12.3%', top: '60.0%', width: '23.1%',
          fontFamily: 'Georgia, serif', fontSize: 'clamp(8px,0.8vw,12px)',
          color: firstError ? '#e05a5a' : GOLD, pointerEvents: 'none',
        }}
      >
        {firstError || (saveStatus === 'saved' ? '✓ Saved' : '')}
      </div>

      {/* ── The approved "BEGIN MY JOURNEY" button, now live ────────────── */}
      <button
        type="button"
        data-testid="identity-begin"
        onClick={handleBegin}
        disabled={submitting}
        style={{
          ...HOTSPOT, ...BEGIN_BTN,
          border: '1.5px solid transparent',
        }}
        aria-label="Begin my journey"
        onMouseEnter={e => hotspotRing(e, true)} onMouseLeave={e => hotspotRing(e, false)}
        onFocus={e => hotspotRing(e, true)} onBlur={e => hotspotRing(e, false)}
      />

      {/* ── The approved image's own BACK control ───────────────────────── */}
      <button
        type="button"
        data-testid="identity-back"
        aria-label="Go back"
        onClick={() => { triggerHaptic('light'); navigate('/smokecraft/enroll') }}
        style={{ ...HOTSPOT, ...BACK_BTN }}
        onMouseEnter={e => hotspotRing(e, true)} onMouseLeave={e => hotspotRing(e, false)}
        onFocus={e => hotspotRing(e, true)} onBlur={e => hotspotRing(e, false)}
      />

      {/* ── The approved image's own "NEXT: GOLDEN BOX RULES" control ───── */}
      <button
        type="button"
        data-testid="identity-next"
        aria-label="Continue to Venue Selection"
        onClick={handleBegin}
        style={{ ...HOTSPOT, ...NEXT_BTN }}
        onMouseEnter={e => hotspotRing(e, true)} onMouseLeave={e => hotspotRing(e, false)}
        onFocus={e => hotspotRing(e, true)} onBlur={e => hotspotRing(e, false)}
      />

      {/* ── The approved sidebar's own items, gated by real progress ────── */}
      {SIDEBAR.filter(item => item.route === '/smokecraft/identity' || REGISTERED_ROUTES.has(item.route)).map(item => {
        const s = SESSION_BY_ROUTE.get(item.route)
        const done = s ? completedSessions?.includes(s.session) : false
        const isCurrent = currentAllowed?.route === item.route
        const unlocked = item.route === '/smokecraft/identity' || isDemoMode || done || isCurrent
        if (!unlocked) return null
        return (
          <button
            key={item.route}
            type="button"
            data-testid={`identity-nav-${item.route.split('/').pop()}`}
            aria-label={s?.label || 'Identity'}
            aria-current={isCurrent ? 'step' : undefined}
            onClick={() => { triggerHaptic('light'); navigate(item.route) }}
            style={{ ...HOTSPOT, ...SIDEBAR_ITEM, top: item.top }}
            onMouseEnter={e => hotspotRing(e, true)} onMouseLeave={e => hotspotRing(e, false)}
            onFocus={e => hotspotRing(e, true)} onBlur={e => hotspotRing(e, false)}
          />
        )
      })}

      {/* The approved image's right-hand column (JOURNEY PROGRESS / YOUR QUICK
          STATS / INSIGHTS & ANALYTICS / YOUR JOURNEYS) is intentionally left
          exactly as exported — blank. See this file's header: no XP, rank,
          badge count, analytics or prior-journey history belongs on the
          entry-layer identity form. */}
    </SmokeCraftImageBoundsOverlay>
  )
}
