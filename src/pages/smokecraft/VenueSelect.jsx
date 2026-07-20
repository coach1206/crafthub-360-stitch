import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { useDemoMode } from '../../context/DemoModeContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import TicketTapperSpecialsStrip from '../../components/smokecraft/TicketTapperSpecialsStrip.jsx'
import { fetchTicketTapperSpecials } from '../../services/smokeCraftTicketTapperSpecialsApi.js'
import { getActiveTicketTapperSpecials } from '../../utils/smokeCraftSpecialsEngine.js'
import { smokeCraftTicketTapperSpecialsSeed } from '../../data/smokeCraftTicketTapperSpecials.js'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

// No live venue directory/backend is connected. Previously this screen
// listed sample venue records (src/data/venues.js) as if they were real
// options — per explicit instruction this is now a strict empty state:
// zero venues are ever shown until a real venue backend exists. The venues.js
// sample data file itself is left untouched (still used by an unrelated
// consumer, src/api/passportScanApi.js), only this screen's rendering
// changed to never present it as live venue inventory.
const VENUES = []

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const WOOD_DIM  = 'rgba(122,79,49,0.28)'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

function VenueCrest({ name, selected }) {
  return (
    <div
      aria-hidden="true"
      style={{
        width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
        background: selected ? 'rgba(233,193,118,0.18)' : 'rgba(233,193,118,0.08)',
        border: `1.5px solid ${selected ? GOLD : GOLD_DIM}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, fontWeight: 700, color: selected ? GOLD : 'rgba(229,226,225,0.6)',
      }}
    >
      {name.charAt(0)}
    </div>
  )
}

export default function VenueSelect() {
  const { journey, setSelectedVenue, setLastEntryScreen } = useSmokeCraftJourney()
  const { isDemoMode } = useDemoMode()
  const navigate = useNavigate()

  // Compact Ticket Tapper — real specials for the just-selected venue only.
  // No venue selected (or "skip" chosen) → honest "select a venue" state,
  // never a fallback to a different/default venue's promotions.
  const [tapperSpecials, setTapperSpecials] = useState([])
  const [tapperLocalPreview, setTapperLocalPreview] = useState(false)
  const [tapperUnavailable, setTapperUnavailable] = useState(false)
  const activeVenueId = (journey.selectedVenue && !journey.selectedVenue.skipped) ? journey.selectedVenue.id : null

  useEffect(() => {
    if (!activeVenueId) {
      setTapperSpecials([])
      setTapperLocalPreview(false)
      setTapperUnavailable(false)
      return
    }
    let cancelled = false
    fetchTicketTapperSpecials(activeVenueId).then(res => {
      if (cancelled || !res.ok) return
      if (!res.localPreview) {
        setTapperSpecials(res.specials || [])
        setTapperLocalPreview(false)
        setTapperUnavailable(false)
      } else if (isDemoMode) {
        setTapperSpecials(res.specials || smokeCraftTicketTapperSpecialsSeed.specials)
        setTapperLocalPreview(true)
        setTapperUnavailable(false)
      } else {
        setTapperSpecials([])
        setTapperLocalPreview(false)
        setTapperUnavailable(true)
      }
    })
    return () => { cancelled = true }
  }, [activeVenueId, isDemoMode])

  const tapperActiveSpecials = useMemo(
    () => getActiveTicketTapperSpecials({ specials: tapperSpecials, inventoryItems: [] }),
    [tapperSpecials]
  )

  const [phase, setPhase] = useState('loading') // loading | error | ready
  const [query, setQuery] = useState('')
  const [tierFilter, setTierFilter] = useState(null)
  const [selectedId, setSelectedId] = useState(() =>
    journey.selectedVenue && !journey.selectedVenue.skipped ? journey.selectedVenue.id : null
  )
  const [skipped, setSkipped] = useState(() => !!journey.selectedVenue?.skipped)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saved
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)

  useEffect(() => {
    try { setLastEntryScreen('/smokecraft/venue-select') } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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

  function handleRetry() {
    setPhase('loading')
    setTimeout(() => setPhase('ready'), 200)
  }

  const tiers = useMemo(() => Array.from(new Set(VENUES.map(v => v.tier))).filter(Boolean), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return VENUES.filter(v => {
      const matchesQuery = !q || [v.name, v.city, v.state].some(f => (f || '').toLowerCase().includes(q))
      const matchesTier = !tierFilter || v.tier === tierFilter
      return matchesQuery && matchesTier
    })
  }, [query, tierFilter])

  function handleSelect(venue) {
    triggerHaptic('light')
    setSkipped(false)
    setSelectedId(venue.id)
    setSelectedVenue({ id: venue.id, name: venue.name, city: venue.city, state: venue.state, tier: venue.tier, selectedAt: Date.now() })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  function handleContinueWithoutVenue() {
    triggerHaptic('light')
    setSkipped(true)
    setSelectedId(null)
    setSelectedVenue({ skipped: true, selectedAt: Date.now() })
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  function handleContinue() {
    if (!selectedId && !skipped) return
    navigate('/smokecraft/identity')
  }

  const canContinue = !!selectedId || skipped

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `
        radial-gradient(ellipse at 20% -10%, rgba(233,193,118,0.10), transparent 55%),
        radial-gradient(ellipse at 100% 110%, ${WOOD_DIM}, transparent 60%),
        linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)
      `,
      fontFamily: 'Georgia, serif',
    }}>
      {/* Approved production visual, reused as a decorative header band. */}
      <div
        role="img"
        aria-label="SmokeCraft Venue Selection"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(90px,14vh,140px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.35), rgba(6,8,16,0.92)), url(${SC_ASSETS.venueSelect})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          zIndex: 1,
        }}
      />

      <header style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0',
        zIndex: 3,
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft 360 — Entry
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          Select Venue or Lounge
        </h1>
        {isOffline && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', marginTop: 4 }}>Offline: showing your locally saved data.</div>}
      </header>

      <main style={{
        position: 'absolute', top: 'clamp(120px,16vh,160px)', bottom: 'clamp(120px,16vh,160px)',
        left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch',
        padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
      }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {phase === 'loading' && (
            <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
              <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'sc-spin4 0.9s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading venues…</p>
              <style>{'@keyframes sc-spin4 { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>Something went wrong loading venues.</p>
              <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
                Retry
              </button>
            </div>
          )}

          {phase === 'ready' && (
            <>
              {/* Honest empty-state disclosure — no live venue backend is connected */}
              <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
                <p style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: CREAM }}>
                  No venues connected yet
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.55)', lineHeight: 1.6 }}>
                  Venue selection requires a live venue directory, which is not yet connected in this build. You can continue without selecting a venue, or check back once venues are available.
                </p>
              </div>

              {/* Search + filters — hidden while no live venues exist; the
                  underlying search/filter state and UI are kept (unused
                  while VENUES is empty) so they activate automatically the
                  moment a real venue directory is connected. */}
              {VENUES.length > 0 && (
                <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)' }}>
                  <label style={{ display: 'block', marginBottom: 10 }}>
                    <span style={{ fontSize: 10, color: GOLD_DIM, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Search</span>
                    <input
                      type="text"
                      aria-label="Search venues"
                      placeholder="Search by name or city…"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`, borderRadius: 8, color: CREAM, fontSize: 14, padding: '10px 12px', fontFamily: 'Georgia, serif', outline: 'none' }}
                    />
                  </label>
                  <div role="group" aria-label="Filter by venue type" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button" aria-pressed={!tierFilter}
                      onClick={() => setTierFilter(null)}
                      style={{ padding: '5px 12px', borderRadius: 14, border: `1.5px solid ${!tierFilter ? GOLD : 'rgba(229,226,225,0.25)'}`, background: !tierFilter ? 'rgba(233,193,118,0.15)' : 'transparent', color: !tierFilter ? GOLD : 'rgba(229,226,225,0.7)', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer', outline: 'none' }}
                    >
                      All Types
                    </button>
                    {tiers.map(t => (
                      <button
                        key={t} type="button" aria-pressed={tierFilter === t}
                        onClick={() => setTierFilter(t)}
                        style={{ padding: '5px 12px', borderRadius: 14, border: `1.5px solid ${tierFilter === t ? GOLD : 'rgba(229,226,225,0.25)'}`, background: tierFilter === t ? 'rgba(233,193,118,0.15)' : 'transparent', color: tierFilter === t ? GOLD : 'rgba(229,226,225,0.7)', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer', outline: 'none' }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filtered.map(v => {
                const isSelected = selectedId === v.id
                return (
                  <button
                    key={v.id}
                    type="button"
                    aria-label={`Select ${v.name}${isSelected ? ' (selected)' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => handleSelect(v)}
                    style={{
                      textAlign: 'left', display: 'flex', gap: 14, alignItems: 'center',
                      background: isSelected ? 'rgba(233,193,118,0.10)' : GLASS,
                      border: `1.5px solid ${isSelected ? GOLD : BORDER}`,
                      borderRadius: 12, padding: 'clamp(14px,2.2vw,20px)', cursor: 'pointer', outline: 'none', width: '100%',
                    }}
                  >
                    <VenueCrest name={v.name} selected={isSelected} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: CREAM }}>{v.name}</div>
                      <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.55)', marginTop: 2 }}>{v.address}, {v.city}, {v.state}</div>
                      <div style={{ fontSize: 11, color: GOLD_DIM, marginTop: 4 }}>{v.tier} · Capacity {v.capacity}</div>
                      <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', marginTop: 6 }}>{v.description}</div>
                    </div>
                    {isSelected && <span style={{ fontSize: 12, color: GOLD, flexShrink: 0 }}>✓ Selected</span>}
                  </button>
                )
              })}

              {/* Continue without venue */}
              <button
                type="button"
                aria-pressed={skipped}
                onClick={handleContinueWithoutVenue}
                style={{
                  background: skipped ? 'rgba(233,193,118,0.10)' : 'transparent',
                  border: `1.5px dashed ${skipped ? GOLD : 'rgba(229,226,225,0.3)'}`,
                  borderRadius: 12, padding: '14px 18px', color: skipped ? GOLD : 'rgba(229,226,225,0.6)',
                  fontFamily: 'Georgia, serif', fontSize: 13, cursor: 'pointer', outline: 'none', textAlign: 'center',
                }}
              >
                {skipped ? '✓ Continuing without a venue selected' : 'Continue without venue'}
              </button>

              {saveStatus === 'saved' && <div style={{ fontSize: 12, color: GOLD, textAlign: 'center' }}>✓ Saved</div>}

              <TicketTapperSpecialsStrip
                compact
                specials={tapperActiveSpecials}
                venueId={activeVenueId}
                localPreview={tapperLocalPreview}
                noVenue={!activeVenueId}
                unavailable={tapperUnavailable}
              />
            </>
          )}
        </div>
      </main>

      <SmokeCraftNavBar
        primary="Continue to Personal Dashboard →"
        onPrimary={handleContinue}
        primaryDisabled={!canContinue}
        secondary="← Back"
        onSecondary={() => navigate('/smokecraft/enroll')}
      />
    </div>
  )
}
