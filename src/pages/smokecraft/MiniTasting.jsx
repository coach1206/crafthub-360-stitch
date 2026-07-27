import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import { getSampleInventory, VENUE_ID } from '../../data/venueInventoryData.js'
import { SESSION_REWARDS } from '../../constants/smokecraftRewards.js'

const GOLD      = '#E9C176'
const GOLD_DIM  = 'rgba(233,193,118,0.55)'
const NAVY      = '#0b0f18'
const NAVY_DEEP = '#060810'
const CREAM     = '#e5e2e1'
const BORDER    = 'rgba(233,193,118,0.22)'
const GLASS     = 'rgba(8,10,16,0.86)'

const PAIRING_CATEGORY_KEYWORDS = {
  Coffee:         ['coffee', 'espresso', 'roast'],
  Rum:            ['rum'],
  Whiskey:        ['bourbon', 'scotch', 'whiskey', 'whisky'],
  Chocolate:      ['chocolate', 'cocoa'],
  'Non-alcoholic': ['tea', 'coffee', 'espresso'],
}

/**
 * Builds "Today's Flight" from the real, already-existing venue inventory
 * sample data (venueInventoryData.js). This module never fabricates cigars —
 * if no cigar inventory exists for the venue, the flight is honestly empty.
 */
function buildFlight() {
  const house = getSampleInventory(VENUE_ID, 'house_cigar')
  const featured = getSampleInventory(VENUE_ID, 'featured_cigar')
  const pool = [...house, ...featured].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  return pool.slice(0, 3).map(item => ({
    id: item.item_id,
    name: item.item_name || null,
    image: item.image_url || null,
    origin: item.cigar_origin || null,
    wrapper: item.cigar_wrapper || null,
    strength: item.cigar_strength || null,
    body: item.cigar_strength || null, // no separate body field exists — strength is the real, honest proxy
    flavorNotes: item.cigar_flavor_notes || null,
    drinkPairings: item.recommended_drink_pairings || null,
    foodPairings: item.recommended_food_pairings || null,
    burnTime: item.cigar_burn_time || null,
    description: item.description || null,
  }))
}

function categorizePairings(flight) {
  const allText = flight
    .flatMap(c => [...(c.drinkPairings || []), ...(c.foodPairings || [])])
    .join(' ')
    .toLowerCase()
  const result = {}
  for (const [category, keywords] of Object.entries(PAIRING_CATEGORY_KEYWORDS)) {
    const match = keywords.some(k => allText.includes(k))
    result[category] = match || null
  }
  return result
}

export default function MiniTasting() {
  const { session, update, addXP } = useGuestSession()
  const navigate = useNavigate()

  const state = session?.smokeCraft?.miniTasting || {}

  const [phase, setPhase] = useState('loading') // loading | error | ready
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false)
  const [selectedId, setSelectedId] = useState(state.selectedCigarId || null)
  const [compareIds, setCompareIds] = useState(state.compareIds || [])
  const [started, setStarted] = useState(Boolean(state.startedAt))

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

  const flight = useMemo(() => buildFlight(), [])
  const pairingCategories = useMemo(() => categorizePairings(flight), [flight])
  const selectedCigar = flight.find(c => c.id === selectedId) || null

  const xpRule = SESSION_REWARDS['mini-tasting-module'] || null

  // Persist selection/comparison/completion into the existing canonical
  // session record — no new storage key, same smokeCraft bucket pattern
  // used by Packages O and P.
  useEffect(() => {
    if (phase !== 'ready') return
    const cur = session?.smokeCraft?.miniTasting || {}
    if (cur.selectedCigarId === selectedId && JSON.stringify(cur.compareIds || []) === JSON.stringify(compareIds)) return
    update(prev => ({
      ...prev,
      smokeCraft: {
        ...prev.smokeCraft,
        miniTasting: { ...(prev.smokeCraft?.miniTasting || {}), selectedCigarId: selectedId, compareIds },
      },
    }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, selectedId, compareIds])

  function handleRetry() {
    setPhase('loading')
    setTimeout(() => setPhase('ready'), 200)
  }

  function handleSelect(id) {
    triggerHaptic('light')
    setSelectedId(id)
  }

  function toggleCompare(id) {
    triggerHaptic('light')
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleBegin() {
    triggerHaptic('medium')
    setStarted(true)
    const now = Date.now()
    update(prev => {
      const already = prev.smokeCraft?.miniTasting?.completedAt
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          miniTasting: { ...(prev.smokeCraft?.miniTasting || {}), startedAt: now, completedAt: already || now },
        },
      }
    })
    if (xpRule?.xp) addXP(xpRule.xp, 'mini-tasting-begin')
  }

  const compareCigars = compareIds.map(id => flight.find(c => c.id === id)).filter(Boolean)

  return (
    <div style={{
      position: 'fixed', inset: 0, overflow: 'hidden',
      background: `linear-gradient(180deg, ${NAVY} 0%, ${NAVY_DEEP} 100%)`,
      fontFamily: 'Georgia, serif',
    }}>
      {/* Approved production visual, reused as-is as a decorative header band. */}
      <div
        role="img"
        aria-label="SmokeCraft Mini Tasting — Comparative Evaluation"
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 'clamp(90px,14vh,140px)',
          backgroundImage: `linear-gradient(180deg, rgba(6,8,16,0.35), rgba(6,8,16,0.92)), url(${SC_ASSETS.miniTasting})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
          zIndex: 1,
        }}
      />

      <header style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 'clamp(16px,3vw,28px) clamp(16px,4vw,40px) 0', zIndex: 3 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: GOLD_DIM, letterSpacing: '0.24em', textTransform: 'uppercase', marginBottom: 6 }}>
          SmokeCraft 360 — Supporting Module
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(22px,3.4vw,34px)', fontWeight: 700, color: CREAM, letterSpacing: '0.01em', lineHeight: 1.15 }}>
          Mini Tasting
        </h1>
        {isOffline && <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.6)', marginTop: 4 }}>Offline: showing your locally saved data.</div>}
      </header>

      <main
        tabIndex={-1}
        style={{
          position: 'absolute', top: 'clamp(150px,20vh,190px)', bottom: 'clamp(120px,16vh,160px)',
          left: 0, right: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain',
          padding: '0 clamp(16px,4vw,40px)', zIndex: 2,
        }}
      >
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 24 }}>

          {phase === 'loading' && (
            <div role="status" aria-live="polite" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(28px,5vw,44px)', textAlign: 'center' }}>
              <div aria-hidden="true" style={{ width: 28, height: 28, margin: '0 auto 14px', borderRadius: '50%', border: `3px solid ${BORDER}`, borderTopColor: GOLD, animation: 'mt-spin 0.9s linear infinite' }} />
              <p style={{ margin: 0, fontSize: 14, color: 'rgba(229,226,225,0.7)' }}>Loading tasting flight…</p>
              <style>{'@keyframes mt-spin { to { transform: rotate(360deg); } }'}</style>
            </div>
          )}

          {phase === 'error' && (
            <div style={{ background: GLASS, border: '1px solid rgba(229,170,100,0.4)', borderRadius: 12, padding: 'clamp(24px,4vw,40px)', textAlign: 'center' }}>
              <p style={{ margin: '0 0 14px', fontSize: 14, color: 'rgba(229,170,100,0.9)' }}>Something went wrong loading the tasting flight.</p>
              <button type="button" onClick={handleRetry} style={{ background: 'transparent', border: `1.5px solid ${GOLD}`, borderRadius: 20, color: GOLD, fontFamily: 'Georgia, serif', fontSize: 13, padding: '8px 18px', cursor: 'pointer', outline: 'none', minHeight: 40 }}>
                Retry
              </button>
            </div>
          )}

          {phase === 'ready' && (
            <>
              {/* Today's Flight */}
              <section aria-label="Today's Flight" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Today's Flight</h2>
                {flight.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.6)' }}>No tasting flight available.</p>
                ) : (
                  <div role="list" aria-label="Three cigars" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                    {flight.map(cigar => {
                      const isSelected = selectedId === cigar.id
                      const isComparing = compareIds.includes(cigar.id)
                      return (
                        <div
                          key={cigar.id}
                          role="listitem"
                          style={{
                            border: `1.5px solid ${isSelected ? GOLD : BORDER}`, borderRadius: 12, padding: 12,
                            background: isSelected ? 'rgba(233,193,118,0.12)' : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div
                            aria-hidden="true"
                            style={{
                              width: '100%', aspectRatio: '4 / 3', borderRadius: 8, marginBottom: 8,
                              backgroundImage: cigar.image ? `url(${cigar.image})` : `linear-gradient(135deg, rgba(233,193,118,0.18), rgba(233,193,118,0.04))`,
                              backgroundSize: 'cover', backgroundPosition: 'center',
                            }}
                          />
                          <div style={{ fontSize: 13, fontWeight: 700, color: CREAM, marginBottom: 6 }}>{cigar.name || 'Not available'}</div>
                          <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)', lineHeight: 1.6 }}>
                            <div>Origin: {cigar.origin || 'Not available'}</div>
                            <div>Wrapper: {cigar.wrapper || 'Not available'}</div>
                            <div>Strength: {cigar.strength || 'Not available'}</div>
                            <div>Body: {cigar.body || 'Not available'}</div>
                            <div>Flavor: {cigar.flavorNotes?.length ? cigar.flavorNotes.join(', ') : 'Not available'}</div>
                            <div>Pairings: {cigar.drinkPairings?.length ? cigar.drinkPairings.join(', ') : 'Not available'}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                            <button
                              type="button" aria-pressed={isSelected}
                              onClick={() => handleSelect(cigar.id)}
                              style={{ flex: 1, padding: '6px 10px', borderRadius: 12, border: `1.5px solid ${isSelected ? GOLD : BORDER}`, background: isSelected ? 'rgba(233,193,118,0.15)' : 'transparent', color: isSelected ? GOLD : 'rgba(229,226,225,0.7)', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer' }}
                            >
                              {isSelected ? 'Selected' : 'Select'}
                            </button>
                            <button
                              type="button" aria-pressed={isComparing}
                              aria-label={`${isComparing ? 'Remove' : 'Add'} ${cigar.name || 'this cigar'} to comparison`}
                              onClick={() => toggleCompare(cigar.id)}
                              style={{ flex: 1, padding: '6px 10px', borderRadius: 12, border: `1.5px solid ${isComparing ? GOLD : BORDER}`, background: isComparing ? 'rgba(233,193,118,0.15)' : 'transparent', color: isComparing ? GOLD : 'rgba(229,226,225,0.7)', fontSize: 11, fontFamily: 'Georgia, serif', cursor: 'pointer' }}
                            >
                              {isComparing ? 'In Compare' : 'Compare'}
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Selection detail */}
              {selectedCigar && (
                <section aria-label="Selected cigar detail" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                  <h2 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: GOLD }}>{selectedCigar.name}</h2>
                  <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(229,226,225,0.65)', lineHeight: 1.6 }}>
                    {selectedCigar.description || 'Not available'}
                  </p>
                  <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>
                    Flavor notes: {selectedCigar.flavorNotes?.length ? selectedCigar.flavorNotes.join(', ') : 'Not available'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)' }}>
                    Pairing notes: {selectedCigar.drinkPairings?.length ? selectedCigar.drinkPairings.join(', ') : 'Not available'}
                  </div>
                </section>
              )}

              {/* Comparison panel */}
              <section aria-label="Comparison panel" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Comparison</h2>
                {compareCigars.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 13, color: 'rgba(229,226,225,0.55)' }}>Select up to three cigars above to compare.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '6px 8px', color: 'rgba(229,226,225,0.5)', fontWeight: 400 }}>Attribute</th>
                          {compareCigars.map(c => (
                            <th key={c.id} style={{ textAlign: 'left', padding: '6px 8px', color: CREAM }}>{c.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {[
                          ['Strength', c => c.strength],
                          ['Body', c => c.body],
                          ['Flavor', c => c.flavorNotes?.length ? c.flavorNotes.join(', ') : null],
                          ['Finish', () => null],
                          ['Construction', () => null],
                          ['Burn', c => c.burnTime],
                          ['Draw', () => null],
                        ].map(([label, getter]) => (
                          <tr key={label} style={{ borderTop: `1px solid ${BORDER}` }}>
                            <td style={{ padding: '6px 8px', color: 'rgba(229,226,225,0.5)' }}>{label}</td>
                            {compareCigars.map(c => (
                              <td key={c.id} style={{ padding: '6px 8px', color: 'rgba(229,226,225,0.75)' }}>{getter(c) || 'Not available'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Pairing panel */}
              <section aria-label="Pairing recommendations" style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 'clamp(16px,3vw,24px)' }}>
                <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: GOLD, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Recommended Pairings</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {Object.entries(pairingCategories).map(([category, match]) => (
                    <div key={category} style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
                      <span style={{ color: GOLD_DIM }}>{category}: </span>
                      <span style={{ color: match ? CREAM : 'rgba(229,226,225,0.4)' }}>{match ? 'Available' : 'Not available'}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* XP disclosure */}
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.4)', textAlign: 'center' }}>
                {xpRule?.xp ? `Completing this tasting awards ${xpRule.xp} XP.` : 'No XP configured'}
              </div>
            </>
          )}
        </div>
      </main>

      <SmokeCraftNavBar
        primary={started ? 'Tasting Started ✓' : 'Begin Mini Tasting'}
        primaryDisabled={started}
        onPrimary={handleBegin}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </div>
  )
}
