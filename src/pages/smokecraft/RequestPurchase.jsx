import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftImageBoundsOverlay from '../../components/smokecraft/SmokeCraftImageBoundsOverlay.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const NAT_W = 1672
const NAT_H = 941

const GOLD = '#E9C176'
const PANEL = {
  background: 'rgba(5,5,5,0.92)',
  border: '1px solid rgba(233,193,118,0.28)',
  borderRadius: 8,
  position: 'absolute',
  boxSizing: 'border-box',
  fontFamily: 'Georgia, serif',
}

const ORDERING_ZONES = [
  { id: 'self',  label: 'Self-Order',              x: 43.8, y: 68.5, w: 19.0, h: 18.3 },
  { id: 'staff', label: 'Request Staff Assistance', x: 63.6, y: 68.5, w: 19.0, h: 18.3 },
]

const ADDON_OPTS = [
  { id: 'second_cigar',      label: 'Add a Second Cigar' },
  { id: 'alt_pairing',       label: 'Alternate Pairing Option' },
  { id: 'chocolate_dessert', label: 'Chocolate / Dessert Pairing' },
  { id: 'nuts_nonalc',       label: 'Nuts / Non-Alcoholic Option' },
]

export default function RequestPurchase() {
  const { awardSessionRewards } = useGuestSession()
  const { journey, setRequestPurchase } = useSmokeCraftJourney()
  const navigate = useNavigate()

  const cigar   = journey.selectedCigar
  const pairing = journey.pairing

  const [orderPath,  setOrderPath]  = useState(() => journey.requestPurchase?.orderPath || null)
  const [addons,     setAddons]     = useState(() => journey.requestPurchase?.addons || [])
  const [notes,      setNotes]      = useState(() => journey.requestPurchase?.notes || '')
  const [saveStatus, setSaveStatus] = useState('idle')
  const [awarded,    setAwarded]    = useState(false)

  useEffect(() => {
    setRequestPurchase({
      orderPath,
      addons,
      notes,
      selectedCigar: cigar,
      selectedPairing: pairing,
      savedAt: Date.now(),
    })
  }, [orderPath, addons, notes]) // eslint-disable-line react-hooks/exhaustive-deps

  function togglePath(id) {
    triggerHaptic('light')
    setOrderPath(prev => prev === id ? null : id)
  }

  function toggleAddon(id) {
    triggerHaptic('light')
    setAddons(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSaveDraft() {
    // useEffect already persists via setRequestPurchase; confirm immediately
    setSaveStatus('saved')
    triggerHaptic('light')
    setTimeout(() => setSaveStatus('idle'), 2000)
  }

  function handleContinue() {
    if (awarded) return
    setAwarded(true)
    triggerHaptic('medium')
    awardSessionRewards('request-purchase')
    navigate('/smokecraft/cut-toast-light')
  }

  return (
    <>
      <SmokeCraftImageBoundsOverlay
        src={SC_ASSETS.requestPurchase}
        naturalW={NAT_W}
        naturalH={NAT_H}
        alt="SmokeCraft Request Purchase — Choose Your Ordering Path"
      >
        {/* Cigar & pairing recommendation panel — left side */}
        <div style={{
          ...PANEL,
          left: '2%', top: '10%', width: '40%', height: '54%',
          padding: 'clamp(6px,1vw,14px)',
          pointerEvents: 'auto',
        }}>
          <div style={{ fontSize: 'clamp(7px,0.6vw,9px)', color: 'rgba(233,193,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
            Your Selection
          </div>

          {cigar ? (
            <>
              <div style={{ fontSize: 'clamp(9px,0.9vw,12px)', color: GOLD, fontWeight: 700, marginBottom: 4 }}>
                {cigar.name}
              </div>
              <div style={{ fontSize: 'clamp(8px,0.7vw,10px)', color: 'rgba(229,226,225,0.65)', marginBottom: 2 }}>
                Origin: {cigar.origin}
              </div>
              <div style={{ fontSize: 'clamp(8px,0.7vw,10px)', color: 'rgba(229,226,225,0.65)', marginBottom: 2 }}>
                Wrapper: {cigar.wrapper}
              </div>
              <div style={{ fontSize: 'clamp(8px,0.7vw,10px)', color: 'rgba(229,226,225,0.65)', marginBottom: 8 }}>
                Strength: {cigar.strength}
              </div>
              {cigar.tastingProfile && (
                <div style={{ fontSize: 'clamp(7px,0.65vw,9px)', color: 'rgba(229,226,225,0.5)', fontStyle: 'italic', marginBottom: 8 }}>
                  {cigar.tastingProfile}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: 'clamp(8px,0.75vw,10px)', color: 'rgba(229,226,225,0.35)', fontStyle: 'italic', marginBottom: 8 }}>
              No cigar selected yet
            </div>
          )}

          {pairing && (
            <>
              <div style={{ borderTop: '1px solid rgba(233,193,118,0.15)', marginBottom: 6 }} />
              <div style={{ fontSize: 'clamp(7px,0.6vw,9px)', color: 'rgba(233,193,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Recommended Pairing
              </div>
              <div style={{ fontSize: 'clamp(8px,0.75vw,10px)', color: GOLD, marginBottom: 4 }}>
                {typeof pairing === 'object' ? (pairing.pairingType || pairing.label || JSON.stringify(pairing)) : pairing}
              </div>
            </>
          )}

          {cigar && (
            <>
              <div style={{ borderTop: '1px solid rgba(233,193,118,0.15)', marginBottom: 6, marginTop: 4 }} />
              <div style={{ fontSize: 'clamp(7px,0.6vw,9px)', color: 'rgba(233,193,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Why This Match Works
              </div>
              <div style={{ fontSize: 'clamp(7px,0.65vw,9px)', color: 'rgba(229,226,225,0.6)', lineHeight: 1.4 }}>
                {cigar.strength === 'Full' || cigar.strength === 'Medium-Full'
                  ? 'Bold strength calls for a rich complement — dark chocolate or aged spirit pairs clean and balances the pepper.'
                  : cigar.strength === 'Mild' || cigar.strength === 'Mild-Medium'
                  ? 'Lighter body allows delicate pairings to shine — cream, honey notes, or a smooth coffee enhance without overpowering.'
                  : 'A medium-strength profile pairs versatile — coffee, chocolate, or a smooth whiskey all make strong matches.'}
              </div>
            </>
          )}
        </div>

        {/* Add-on options panel — right side */}
        <div style={{
          ...PANEL,
          left: '44%', top: '10%', width: '40%', height: '54%',
          padding: 'clamp(6px,1vw,14px)',
          pointerEvents: 'auto',
        }}>
          <div style={{ fontSize: 'clamp(7px,0.6vw,9px)', color: 'rgba(233,193,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Add to Your Order
          </div>

          {ADDON_OPTS.map(opt => {
            const active = addons.includes(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                aria-label={opt.label}
                aria-pressed={active}
                onClick={() => toggleAddon(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  width: '100%', marginBottom: 6,
                  padding: '4px 6px', borderRadius: 5,
                  border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.22)'}`,
                  background: 'transparent',
                  cursor: 'pointer', outline: 'none',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                  border: `1.5px solid ${active ? GOLD : 'rgba(233,193,118,0.35)'}`,
                  background: active ? 'rgba(233,193,118,0.15)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {active && <span style={{ fontSize: 9, color: GOLD, lineHeight: 1 }}>✓</span>}
                </span>
                <span style={{
                  fontSize: 'clamp(8px,0.72vw,10px)',
                  color: active ? GOLD : 'rgba(229,226,225,0.7)',
                  fontFamily: 'Georgia, serif',
                }}>
                  {opt.label}
                </span>
              </button>
            )
          })}

          <div style={{ borderTop: '1px solid rgba(233,193,118,0.15)', margin: '8px 0 6px' }} />

          <div style={{ fontSize: 'clamp(7px,0.6vw,9px)', color: 'rgba(233,193,118,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
            Special Notes
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Preferences, restrictions, or special requests…"
            aria-label="Special notes for your order"
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(229,226,225,0.04)',
              border: '1px solid rgba(233,193,118,0.2)',
              borderRadius: 4, padding: '4px 6px',
              color: 'rgba(229,226,225,0.82)',
              fontSize: 'clamp(7px,0.65vw,9px)',
              fontFamily: 'Georgia, serif', lineHeight: 1.5,
              resize: 'none', outline: 'none',
            }}
          />
          <button
            type="button"
            aria-label="Save draft"
            onClick={handleSaveDraft}
            style={{
              marginTop: 5, padding: '3px 10px', borderRadius: 4,
              border: `1px solid ${saveStatus === 'saved' ? 'rgba(233,193,118,0.5)' : 'rgba(233,193,118,0.3)'}`,
              background: 'transparent',
              color: saveStatus === 'saved' ? GOLD : 'rgba(229,226,225,0.5)',
              fontSize: 'clamp(7px,0.6vw,9px)', fontFamily: 'Georgia, serif',
              cursor: 'pointer', outline: 'none',
            }}
          >
            {saveStatus === 'saved' ? '✓ Draft Saved' : 'Save Draft'}
          </button>
        </div>

        {/* Ordering path selectors */}
        {ORDERING_ZONES.map(zone => {
          const active = orderPath === zone.id
          return (
            <button
              key={zone.id}
              type="button"
              aria-label={`${zone.label}${active ? ' (selected)' : ''}`}
              aria-pressed={active}
              onClick={() => togglePath(zone.id)}
              style={{
                position: 'absolute',
                left: `${zone.x}%`, top: `${zone.y}%`,
                width: `${zone.w}%`, height: `${zone.h}%`,
                pointerEvents: 'auto',
                background: 'transparent',
                border: `2px solid ${active ? GOLD : 'transparent'}`,
                borderRadius: 4,
                cursor: 'pointer',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            >
              {active && (
                <span style={{
                  position: 'absolute', top: 4, right: 5,
                  fontSize: 'clamp(9px,1.1vw,13px)', fontWeight: 700,
                  color: GOLD, lineHeight: 1, pointerEvents: 'none',
                }}>✓</span>
              )}
            </button>
          )
        })}
      </SmokeCraftImageBoundsOverlay>

      <SmokeCraftNavBar
        primary="Continue to Cut, Toast & Light →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </>
  )
}
