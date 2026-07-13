import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import SmokeCraftAssetScreen from '../../components/smokecraft/SmokeCraftAssetScreen.jsx'
import SmokeCraftNavBar from '../../components/smokecraft/SmokeCraftNavBar.jsx'
import { useSmokeCraftOrder } from '../../context/SmokeCraftOrderContext.jsx'
import VenueMenuOverlay from '../../components/venue/VenueMenuOverlay.jsx'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'

const GOLD   = '#E9C176'
const DARK   = '#0a0603'
const DIM    = 'rgba(229,226,225,0.55)'
const PANEL  = 'rgba(10,6,3,0.94)'
const BORDER = 'rgba(233,193,118,0.18)'

const ORDERING_PATHS = [
  { id: 'self',  label: 'Self-Order',              desc: 'Place order directly through the app' },
  { id: 'staff', label: 'Request Staff Assistance', desc: 'A team member will come to assist you' },
]

const ADDITIONAL_OPTIONS = [
  { id: 'second_cigar',     label: 'Second Cigar Option' },
  { id: 'alt_pairing',      label: 'Alternate Pairing' },
  { id: 'chocolate',        label: 'Chocolate or Dessert' },
  { id: 'water',            label: 'Water or Refreshment' },
  { id: 'accessories',      label: 'Accessories' },
  { id: 'staff_assistance', label: 'Staff Assistance Note' },
]

function buildFlavorAnalysis(cigar, pairing) {
  if (!cigar || !pairing) return null
  const strength = cigar.strength || ''
  const pair = pairing.primary || ''
  const harmony = strength.toLowerCase().includes('full') && ['Whiskey', 'Espresso', 'Cognac'].some(s => pair.includes(s))
    ? 'High harmony — bold pairings match the cigar\'s intensity without overpowering.'
    : strength.toLowerCase().includes('mild') && ['Coffee', 'Craft Beer', 'Red Wine'].some(s => pair.includes(s))
      ? 'Good harmony — lighter pairing lets the wrapper notes shine.'
      : `${pair} provides a complementary contrast to the ${strength.toLowerCase() || 'selected'} profile.`
  const intensityBalance = `${strength || 'Selected'} cigar · ${pair || 'Selected'} pairing — intensity levels align well.`
  const keyTakeaway = pairing.insight || `${cigar.name} paired with ${pair} creates a cohesive tasting session.`
  return { harmony, intensityBalance, experienceInsight: pairing.flavorHarmony || '', keyTakeaway }
}

function DataRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
      <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', minWidth: 90, flexShrink: 0, paddingTop: 1 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: value ? '#e5e2e1' : DIM, fontFamily: 'Georgia, serif', fontStyle: value ? 'normal' : 'italic' }}>
        {value || '—'}
      </div>
    </div>
  )
}

function SectionHead({ children }) {
  return (
    <div style={{ fontSize: 9, color: GOLD, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6, marginTop: 4 }}>
      {children}
    </div>
  )
}

export default function RequestPurchase() {
  const { awardSessionRewards, session } = useGuestSession()
  const { journey, setRequestPurchase } = useSmokeCraftJourney()
  const { setResumeRoute } = useSmokeCraftOrder()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [awarded, setAwarded] = useState(false)

  const cigar   = journey.selectedCigar
  const pairing = journey.pairing

  const [orderPath, setOrderPath] = useState(() => journey.requestPurchase?.orderPath || null)
  const [additionalOptions, setAdditionalOptions] = useState(() => journey.requestPurchase?.additionalOptions || [])
  const [specialNotes, setSpecialNotes] = useState(() => journey.requestPurchase?.specialNotes || '')

  const flavorAnalysis = buildFlavorAnalysis(cigar, pairing)

  useEffect(() => {
    setRequestPurchase({ orderPath, additionalOptions, specialNotes, selectedCigar: cigar, selectedPairing: pairing, savedAt: Date.now() })
  }, [orderPath, additionalOptions, specialNotes]) // eslint-disable-line react-hooks/exhaustive-deps

  function toggleOption(id) {
    triggerHaptic('light')
    setAdditionalOptions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const canContinue = !!(cigar && orderPath)

  function handleContinue() {
    if (!canContinue || awarded) return
    setAwarded(true)
    triggerHaptic('medium')
    awardSessionRewards('request-purchase')
    navigate('/smokecraft/cut-toast-light')
  }

  const orderSummary = [
    cigar ? `Cigar: ${cigar.name}` : null,
    pairing ? `Pairing: ${pairing.recommendation}` : null,
    ...additionalOptions.map(id => ADDITIONAL_OPTIONS.find(o => o.id === id)?.label || id),
    orderPath ? `Path: ${ORDERING_PATHS.find(p => p.id === orderPath)?.label || orderPath}` : null,
    specialNotes.trim() ? `Notes: ${specialNotes.trim()}` : null,
  ].filter(Boolean)

  return (
    <>
      <SmokeCraftAssetScreen
        src={SC_ASSETS.requestPurchase}
        alt="SmokeCraft Request Purchase — Choose Your Ordering Path"
        classification="DECORATIVE_BACKGROUND"
      />

      <div style={{
        position: 'fixed', inset: 0,
        overflowY: 'auto', overflowX: 'hidden',
        WebkitOverflowScrolling: 'touch',
        zIndex: 400, pointerEvents: 'none',
      }}>
        <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 100 }}>
          <div style={{
            pointerEvents: 'auto',
            background: PANEL, borderTop: `1px solid ${BORDER}`,
            padding: 'clamp(14px,2.5vw,22px) clamp(14px,4vw,28px)',
            maxWidth: 540, width: '100%', margin: '0 auto', boxSizing: 'border-box',
          }}>

            {/* ── Selected Cigar ─────────────────────────────────────── */}
            <SectionHead>Selected Cigar</SectionHead>
            {cigar ? (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 16, color: '#e5e2e1', fontFamily: 'Georgia, serif', fontWeight: 700, marginBottom: 6 }}>
                  {cigar.name}
                </div>
                <DataRow label="Origin"    value={cigar.origin} />
                <DataRow label="Wrapper"   value={cigar.wrapper} />
                <DataRow label="Strength"  value={cigar.strength} />
                <DataRow label="Body"      value={cigar.body} />
                <DataRow label="Format"    value={cigar.format || journey.format?.label} />
                <DataRow label="Profile"   value={cigar.tastingProfile} />
              </div>
            ) : (
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 12, color: DIM, fontStyle: 'italic' }}>No cigar selected yet.</div>
                <button type="button" onClick={() => navigate('/smokecraft/humidor-match')}
                  style={{ flexShrink: 0, background: 'transparent', border: `1px solid rgba(233,193,118,0.4)`, borderRadius: 16, color: GOLD, fontSize: 11, fontWeight: 600, fontFamily: 'Georgia, serif', cursor: 'pointer', padding: '7px 14px', whiteSpace: 'nowrap' }}>
                  Return to Humidor Match
                </button>
              </div>
            )}

            {/* ── Selected Pairing ───────────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginBottom: 10 }}>
              <SectionHead>Selected Pairing</SectionHead>
              {pairing ? (
                <div>
                  <div style={{ fontSize: 15, color: '#e5e2e1', fontFamily: 'Georgia, serif', fontWeight: 700, marginBottom: 6 }}>
                    {pairing.recommendation}
                  </div>
                  <DataRow label="Flavor Notes" value={pairing.flavorNote} />
                  <DataRow label="Category"     value={pairing.category} />
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 12, color: DIM, fontStyle: 'italic' }}>No pairing selected yet. (Optional)</div>
                  <button type="button" onClick={() => navigate('/smokecraft/pairing-lab')}
                    style={{ flexShrink: 0, background: 'transparent', border: `1px solid rgba(233,193,118,0.4)`, borderRadius: 16, color: GOLD, fontSize: 11, fontWeight: 600, fontFamily: 'Georgia, serif', cursor: 'pointer', padding: '7px 14px', whiteSpace: 'nowrap' }}>
                    Return to Pairing Lab
                  </button>
                </div>
              )}
            </div>

            {/* ── Flavor Analysis ────────────────────────────────────── */}
            {flavorAnalysis && (
              <div style={{ background: 'rgba(233,193,118,0.05)', border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px', marginBottom: 12 }}>
                <SectionHead>Flavor Analysis</SectionHead>
                <DataRow label="Harmony"  value={flavorAnalysis.harmony} />
                <DataRow label="Balance"  value={flavorAnalysis.intensityBalance} />
                {flavorAnalysis.experienceInsight && <DataRow label="Insight"  value={flavorAnalysis.experienceInsight} />}
                <DataRow label="Takeaway" value={flavorAnalysis.keyTakeaway} />
              </div>
            )}

            {/* ── Choose Ordering Path ───────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginBottom: 10 }}>
              <SectionHead>Choose Ordering Path</SectionHead>
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                {ORDERING_PATHS.map(p => {
                  const active = orderPath === p.id
                  return (
                    <button key={p.id} type="button" aria-pressed={active}
                      onClick={() => { triggerHaptic('light'); setOrderPath(prev => prev === p.id ? null : p.id) }}
                      style={{
                        flex: 1, background: active ? GOLD : 'transparent',
                        color: active ? DARK : GOLD,
                        border: `1px solid ${active ? GOLD : 'rgba(233,193,118,0.35)'}`,
                        borderRadius: 10, padding: '12px 10px', minHeight: 44,
                        fontSize: 12, fontWeight: 700, fontFamily: 'Georgia, serif',
                        cursor: 'pointer', textAlign: 'center',
                      }}
                    >
                      <div>{p.label}</div>
                      <div style={{ fontSize: 10, fontWeight: 400, marginTop: 2, opacity: 0.75 }}>{p.desc}</div>
                    </button>
                  )
                })}
              </div>
              {orderPath === 'staff' && (
                <div style={{ fontSize: 10, color: DIM, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(229,226,225,0.12)', borderRadius: 6, padding: '6px 10px' }}>
                  Your assistance request is ready for venue confirmation. A team member will be notified when you tap Continue.
                </div>
              )}
            </div>

            {/* ── Additional Options ─────────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginBottom: 10 }}>
              <SectionHead>Additional Options</SectionHead>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ADDITIONAL_OPTIONS.map(opt => {
                  const active = additionalOptions.includes(opt.id)
                  return (
                    <button key={opt.id} type="button" aria-pressed={active}
                      onClick={() => toggleOption(opt.id)}
                      style={{
                        background: active ? 'rgba(233,193,118,0.15)' : 'transparent',
                        color: active ? GOLD : DIM,
                        border: `1px solid ${active ? GOLD : 'rgba(229,226,225,0.2)'}`,
                        borderRadius: 20, padding: '9px 14px', minHeight: 40,
                        fontSize: 12, fontFamily: 'Georgia, serif', cursor: 'pointer',
                      }}
                    >{opt.label}</button>
                  )
                })}
              </div>
            </div>

            {/* ── Special Notes ──────────────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginBottom: 10 }}>
              <SectionHead>Special Notes</SectionHead>
              <textarea
                value={specialNotes}
                onChange={e => setSpecialNotes(e.target.value)}
                placeholder="Allergies, preferences, seating notes…"
                rows={2}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.05)',
                  border: `1px solid rgba(233,193,118,0.2)`,
                  borderRadius: 8, color: '#e5e2e1', fontSize: 13,
                  padding: '8px 12px', fontFamily: 'Georgia, serif',
                  resize: 'vertical', minHeight: 48,
                }}
              />
            </div>

            {/* ── Purchase Review ────────────────────────────────────── */}
            <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 10, marginBottom: 10 }}>
              <SectionHead>Purchase Review</SectionHead>
              {orderSummary.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {orderSummary.map((line, i) => (
                    <div key={i} style={{ fontSize: 12, color: '#e5e2e1', fontFamily: 'Georgia, serif' }}>· {line}</div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: DIM, fontStyle: 'italic' }}>
                  Your order summary will appear here as you make selections above.
                </div>
              )}
            </div>

            {/* ── View Venue Menu ────────────────────────────────────── */}
            <button type="button" onClick={() => { setResumeRoute('/smokecraft/request-purchase'); setMenuOpen(true) }}
              style={{
                width: '100%', background: 'transparent', color: GOLD,
                border: `1px solid rgba(233,193,118,0.4)`, borderRadius: 22,
                padding: '10px 20px', fontSize: 13, fontWeight: 700,
                fontFamily: 'Georgia, serif', letterSpacing: '0.06em',
                cursor: 'pointer', marginBottom: 8,
              }}
            >
              View Venue Menu &amp; Order
            </button>

            {!canContinue && (
              <div style={{ fontSize: 11, color: DIM, textAlign: 'center', padding: '2px 0' }}>
                {!cigar ? '← Return to Humidor Match to select a cigar first.' : 'Choose an ordering path above to continue.'}
              </div>
            )}
          </div>
        </div>
      </div>

      <SmokeCraftNavBar
        primary={canContinue ? 'Continue to Cut, Toast & Light →' : 'Select cigar + ordering path to continue'}
        onPrimary={handleContinue}
        secondary="← Back"
        onSecondary={() => navigate(-1)}
      />

      <VenueMenuOverlay
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        guestSessionId={session?.sessionId}
        tableNumber="SmokeCraft"
        source="customer_self_order"
      />
    </>
  )
}
