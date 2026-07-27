import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { MENTORS, MAX_MENTOR_SELECTIONS } from '../../modules/smokecraft/smokeCraftMentors.js'

const GOLD      = '#E9C176'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'
const CREAM     = '#e5e2e1'
const DIM       = 'rgba(229,226,225,0.65)'

function MentorCard({ mentor, active, maxed, onToggle }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      aria-label={`${mentor.name} — ${mentor.country} — ${mentor.bio}${active ? ' (selected)' : ''}`}
      aria-pressed={active}
      disabled={maxed}
      onClick={onToggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{
        position: 'relative', textAlign: 'left', background: GLASS,
        border: `1.5px solid ${active ? GOLD : (hover ? 'rgba(233,193,118,0.5)' : BORDER)}`,
        borderRadius: 14, padding: 0, overflow: 'hidden', cursor: maxed ? 'not-allowed' : 'pointer',
        opacity: maxed ? 0.5 : 1, touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent',
        boxShadow: active ? '0 0 0 3px rgba(233,193,118,0.18)' : 'none',
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease',
      }}
    >
      <div style={{ position: 'relative', aspectRatio: '4 / 3', background: '#000' }}>
        <img
          src={mentor.image}
          alt=""
          draggable={false}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute', left: 8, top: 8, fontSize: 10, fontWeight: 700,
          letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD,
          background: 'rgba(6,8,16,0.75)', padding: '3px 8px', borderRadius: 999,
        }}>
          {mentor.country}
        </div>
        <div style={{
          position: 'absolute', right: 8, top: 8, width: 26, height: 26, borderRadius: '50%',
          background: active ? GOLD : 'rgba(6,8,16,0.75)', color: active ? '#0a0603' : GOLD,
          border: `1px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700,
        }} aria-hidden="true">
          {active ? '✓' : '+'}
        </div>
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: CREAM, marginBottom: 4 }}>{mentor.name}</div>
        <div style={{ fontSize: 12, color: DIM, lineHeight: 1.5, marginBottom: 8, minHeight: 36 }}>{mentor.bio}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {mentor.tags.map(tag => (
            <span key={tag} style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
              color: 'rgba(233,193,118,0.85)', border: `1px solid ${BORDER}`, borderRadius: 999,
              padding: '3px 8px',
            }}>{tag}</span>
          ))}
        </div>
      </div>
    </button>
  )
}

export default function Mentor() {
  const { awardSessionRewards, setSelectedMentor } = useGuestSession()
  const { journey, setMentor } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const [selected, setSelected] = useState(() => {
    const saved = journey.mentor
    if (!saved) return []
    if (Array.isArray(saved)) return saved.map(m => m.id)
    return [saved.id]
  })

  // Holistic Fix 5A: closes the disclosed mentor dual-ownership defect
  // (SMOKECRAFT_STATE_OWNERSHIP_MAP.md) — journey.mentor (server-synced
  // via the Holistic Fix 4B journey-snapshot mechanism) is now the SOLE
  // write target for the user's selection. session.selectedMentor still
  // exists as a field (many cross-module consumers outside /smokecraft —
  // NCIE, POS3, staff handoff, EAT analytics, leaderboard — read it and
  // live entirely outside SmokeCraftJourneyProvider's subtree, so it
  // cannot be removed or made to read journey.mentor directly), but it
  // is no longer independently settable from user action: it is now a
  // pure reactive mirror of journey.mentor, updated in the SAME
  // render pass a moment after journey.mentor changes, so the two can
  // never diverge — there is exactly one write path (setMentor) and one
  // derived mirror (setSelectedMentor), not two independent owners.
  useEffect(() => {
    const mentors = MENTORS.filter(m => selected.includes(m.id))
    setMentor(mentors.length ? mentors : null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

  useEffect(() => {
    const first = Array.isArray(journey.mentor) ? journey.mentor[0] : null
    if (first) setSelectedMentor(first.id, first.country)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey.mentor])

  function toggle(id) {
    triggerHaptic('light')
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < MAX_MENTOR_SELECTIONS ? [...prev, id] : prev
    )
  }

  function handleContinue() {
    if (selected.length === 0) return
    triggerHaptic('medium')
    awardSessionRewards('mentor')
    navigate('/smokecraft/seed-soil')
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: `
        radial-gradient(ellipse at 20% -10%, rgba(233,193,118,0.10), transparent 55%),
        radial-gradient(ellipse at 100% 110%, ${WOOD_DIM}, transparent 60%),
        linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)
      `,
      fontFamily: 'Georgia, serif',
    }}>
      <header style={{ padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0', flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(233,193,118,0.6)', letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft Journey
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, fontFamily: 'Georgia, serif' }}>
          Mentor Selection
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: DIM, maxWidth: 560 }}>
          Select up to {MAX_MENTOR_SELECTIONS} master mentors from the world's great tobacco traditions. Each brings a legacy, growing philosophy, and sensory perspective that will shape your SmokeCraft tasting map.
        </p>
        <div style={{ fontSize: 12, color: selected.length > 0 ? GOLD : DIM, marginTop: 8 }}>
          {selected.length} of {MAX_MENTOR_SELECTIONS} selected
        </div>
      </header>

      <main style={{
        flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '16px clamp(16px,4vw,40px) clamp(150px,20vh,190px)',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto', display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14,
        }}>
          {MENTORS.map(mentor => {
            const active = selected.includes(mentor.id)
            const maxed = selected.length >= MAX_MENTOR_SELECTIONS && !active
            return (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                active={active}
                maxed={maxed}
                onToggle={() => toggle(mentor.id)}
              />
            )
          })}
        </div>
      </main>

      <SmokeCraftNavBar
        primary="Continue to Seed & Soil →"
        onPrimary={handleContinue}
        primaryDisabled={selected.length === 0}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </div>
  )
}
