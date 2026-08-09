import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftScreenShell from '../../components/smokecraft/SmokeCraftScreenShell.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import {
  GOLD, GOLD_DIM, CREAM, BORDER, GLASS,
  heroBannerStyle, pageShellStyle, cardStyle, sectionLabelStyle,
} from '../../constants/smokecraftLiveScreenTokens.js'

/**
 * Request / Purchase — /smokecraft/request-purchase (supporting)
 *
 * TWO-GENERATION MIGRATION — replaces SmokeCraftScreenShell
 * mode="image-shell" (2 ordering-path hotspots positioned over baked
 * artwork, plus two real-DOM panels already floating on top of it) with
 * the shared live-DOM card system. No decorative image is used, matching
 * the Format/Thirds/Scorecard precedent.
 *
 * All logic preserved verbatim: togglePath/toggleAddon, the
 * setRequestPurchase autosave effect, handleSaveDraft, handleContinue.
 */

const ORDERING_PATHS = [
  { id: 'self',  label: 'Self-Order',              icon: '🧾', desc: "Order directly from tonight's cigar menu on your own." },
  { id: 'staff', label: 'Request Staff Assistance', icon: '🙋', desc: 'A staff member will come help finalize your order.' },
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

  const whyThisMatch = cigar
    ? (cigar.strength === 'Full' || cigar.strength === 'Medium-Full'
        ? 'Bold strength calls for a rich complement — dark chocolate or aged spirit pairs clean and balances the pepper.'
        : cigar.strength === 'Mild' || cigar.strength === 'Mild-Medium'
        ? 'Lighter body allows delicate pairings to shine — cream, honey notes, or a smooth coffee enhance without overpowering.'
        : 'A medium-strength profile pairs versatile — coffee, chocolate, or a smooth whiskey all make strong matches.')
    : null

  return (
    <SmokeCraftScreenShell mode="live" status="ready">
      <div style={pageShellStyle}>
        <div style={heroBannerStyle}>
          <div aria-hidden="true" style={{ fontSize: 40 }}>🛎️</div>
          <div>
            <div style={{ fontSize: 11, color: GOLD_DIM, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>SmokeCraft 360 — Request / Purchase</div>
            <h1 style={{ margin: '4px 0 6px', color: CREAM, fontSize: 'clamp(26px,3.4vw,36px)' }}>Choose Your Ordering Path</h1>
            <p style={{ margin: 0, maxWidth: 760, color: 'rgba(229,226,225,.68)', lineHeight: 1.55, fontSize: 'clamp(13px,1.4vw,16px)' }}>
              Ready to finalize your selection? Order it yourself or ask a staff member to help you place it.
            </p>
          </div>
        </div>

        <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
          <div style={sectionLabelStyle}>Ordering Path</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginTop: 12 }}>
            {ORDERING_PATHS.map(zone => {
              const active = orderPath === zone.id
              return (
                <button
                  key={zone.id}
                  type="button"
                  aria-label={`${zone.label}${active ? ' (selected)' : ''}`}
                  aria-pressed={active}
                  onClick={() => togglePath(zone.id)}
                  style={{
                    minHeight: 110, padding: 16, textAlign: 'left', borderRadius: 12,
                    border: `1px solid ${active ? GOLD : BORDER}`,
                    background: active ? 'rgba(233,193,118,.12)' : GLASS,
                    color: CREAM, cursor: 'pointer', fontFamily: 'Georgia, serif',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 22 }} aria-hidden="true">{zone.icon}</span>
                    {active && <span style={{ color: GOLD, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ color: GOLD, fontWeight: 700, marginTop: 10, fontSize: 15 }}>{zone.label}</div>
                  <p style={{ margin: '6px 0 0', color: 'rgba(229,226,225,.58)', fontSize: 12.5, lineHeight: 1.4 }}>{zone.desc}</p>
                </button>
              )
            })}
          </div>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>Your Selection</div>
            {cigar ? (
              <>
                <div style={{ fontSize: 16, color: GOLD, fontWeight: 700, marginTop: 8 }}>{cigar.name}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(229,226,225,0.65)', marginTop: 6 }}>Origin: {cigar.origin}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(229,226,225,0.65)' }}>Wrapper: {cigar.wrapper}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(229,226,225,0.65)' }}>Strength: {cigar.strength}</div>
                {cigar.tastingProfile && (
                  <div style={{ fontSize: 12, color: 'rgba(229,226,225,0.5)', fontStyle: 'italic', marginTop: 8 }}>{cigar.tastingProfile}</div>
                )}
              </>
            ) : (
              <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.35)', fontStyle: 'italic', marginTop: 8 }}>No cigar selected yet</div>
            )}

            {pairing && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <div style={sectionLabelStyle}>Recommended Pairing</div>
                <div style={{ fontSize: 13, color: GOLD }}>
                  {typeof pairing === 'object' ? (pairing.pairingType || pairing.label || JSON.stringify(pairing)) : pairing}
                </div>
              </div>
            )}

            {cigar && whyThisMatch && (
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                <div style={sectionLabelStyle}>Why This Match Works</div>
                <div style={{ fontSize: 12.5, color: 'rgba(229,226,225,0.6)', lineHeight: 1.5 }}>{whyThisMatch}</div>
              </div>
            )}
          </section>

          <section style={{ ...cardStyle, padding: 'clamp(18px,2.4vw,26px)' }}>
            <div style={sectionLabelStyle}>Add to Your Order</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
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
                      display: 'flex', alignItems: 'center', gap: 10, minHeight: 44,
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      border: `1px solid ${active ? GOLD : BORDER}`,
                      background: active ? 'rgba(233,193,118,0.08)' : 'transparent',
                      cursor: 'pointer', outline: 'none', textAlign: 'left',
                    }}
                  >
                    <span style={{
                      width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                      border: `1.5px solid ${active ? GOLD : BORDER}`,
                      background: active ? 'rgba(233,193,118,0.15)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {active && <span style={{ fontSize: 11, color: GOLD, lineHeight: 1 }}>✓</span>}
                    </span>
                    <span style={{ fontSize: 13, color: active ? GOLD : CREAM, fontFamily: 'Georgia, serif' }}>{opt.label}</span>
                  </button>
                )
              })}
            </div>

            <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
              <div style={sectionLabelStyle}>Special Notes</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Preferences, restrictions, or special requests…"
                aria-label="Special notes for your order"
                rows={3}
                style={{
                  width: '100%', boxSizing: 'border-box', marginTop: 8,
                  background: '#0d1420', border: `1px solid ${BORDER}`,
                  borderRadius: 8, padding: 10, color: CREAM,
                  fontSize: 13, fontFamily: 'Georgia, serif', lineHeight: 1.5,
                  resize: 'vertical', outline: 'none',
                }}
              />
              <button
                type="button"
                aria-label="Save draft"
                onClick={handleSaveDraft}
                style={{
                  marginTop: 10, minHeight: 36, padding: '6px 14px', borderRadius: 8,
                  border: `1px solid ${saveStatus === 'saved' ? GOLD : BORDER}`,
                  background: 'transparent',
                  color: saveStatus === 'saved' ? GOLD : 'rgba(229,226,225,0.55)',
                  fontSize: 12, fontFamily: 'Georgia, serif', cursor: 'pointer',
                }}
              >
                {saveStatus === 'saved' ? '✓ Draft Saved' : 'Save Draft'}
              </button>
            </div>
          </section>
        </div>

        <div style={{ height: 90 }} aria-hidden="true" />
      </div>

      <SmokeCraftNavBar
        primary="Continue to Cut, Toast & Light →"
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />
    </SmokeCraftScreenShell>
  )
}
