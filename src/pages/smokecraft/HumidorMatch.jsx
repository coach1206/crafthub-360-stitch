import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { computeHumidorRecommendations } from '../../utils/smokecraftHumidorMatch.js'
import { emit, SYSTEMS } from '../../services/shared/opsEventBus.js'
import { DropIcon, CheckIcon, ChevronRightIcon, InsightsIcon, ArrowForwardIcon, ArrowBackIcon, CigarIcon, DiamondIcon, CrownIcon } from '../../components/smokecraft/PremiumIcons.jsx'
import { getVisitProgress } from '../../constants/session.js'

const LANE_META = {
  'best-match':         { label: 'Best Match',         Icon: CigarIcon },
  'step-up-pick':       { label: 'Step-Up Pick',        Icon: DiamondIcon },
  'venue-featured-pick': { label: 'Venue Featured Pick', Icon: CrownIcon },
}

function CigarMediaPanel({ cigarName, shapePhoto }) {
  const [failed, setFailed] = useState(false)
  const src = shapePhoto || null
  if (!src || failed) {
    return (
      <div className="humidor-card__media humidor-card__media--pending" aria-hidden="true">
        <span className="material-symbols-outlined" style={{ fontSize: 28, opacity: 0.5 }}>photo_camera</span>
        <span>Cigar image pending</span>
      </div>
    )
  }
  return (
    <div className="humidor-card__media">
      <img src={src} alt={cigarName} onError={() => setFailed(true)} />
      <div className="humidor-card__media-fade" aria-hidden="true" />
    </div>
  )
}

const STOCK_COLOR = { 'In Stock': '#5fb87a', 'Low Stock': '#e9c176', 'Out of Stock': '#d96b6b' }

function RecommendationCard({ rec, selected, onSelect, requestState, onRequestStaff, onAddToPos }) {
  const meta = LANE_META[rec.recommendationType]
  return (
    <div className={`humidor-card${selected ? ' humidor-card--selected' : ''}`}>
      <CigarMediaPanel cigarName={rec.cigarName} shapePhoto={rec.shapePhoto} />
      <div className="humidor-card__body">
        <div className="flex items-center gap-3 mb-3">
          <span className="humidor-card__lane-icon">
            <meta.Icon size={18} />
          </span>
          <div>
            <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest">{meta.label}</p>
            <p className="font-label-lg text-label-lg text-on-surface font-semibold leading-tight">{rec.cigarName}</p>
          </div>
        </div>
        <div className="humidor-card__facts">
          <span><strong>Brand</strong>{rec.brand}</span>
          <span><strong>Country</strong>{rec.cigarCountry}</span>
          <span><strong>Wrapper</strong>{rec.wrapper}</span>
          <span><strong>Strength</strong>{rec.strength}</span>
          <span><strong>Burn time</strong>{rec.burnTime}</span>
          <span>
            <strong>Availability</strong>
            <span style={{ color: STOCK_COLOR[rec.inventoryStatus] || '#fff', fontWeight: 700 }}>● {rec.inventoryStatus}</span>
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant mt-3">Flavor notes: {rec.flavorNotes.join(', ')}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">{rec.pairingSuggestion}</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant/60" style={{ fontSize: 11 }}>{rec.availabilityNote} · {rec.priceStatus}</p>
        {rec.mentorNote && <p className="font-body-sm text-body-sm text-primary/80">{rec.mentorNote}</p>}
        <p className="font-body-sm text-body-sm text-on-surface-variant">Match reason: {rec.matchReason}</p>
        {rec.stepUpReason && <p className="font-body-sm text-body-sm text-on-surface-variant">{rec.stepUpReason}</p>}
        {rec.venueFeatureReason && <p className="font-body-sm text-body-sm text-on-surface-variant">{rec.venueFeatureReason}</p>}
        <div className="humidor-card__score">
          <span>Match Score</span>
          <div className="humidor-card__score-bar"><div style={{ width: `${rec.matchScore}%` }} /></div>
          <span className="humidor-card__score-value">{rec.matchScore}/100</span>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={() => onSelect(rec)}
            className="font-label-sm text-label-sm uppercase tracking-widest rounded-lg active:scale-95 transition-all"
            style={{ height: 40, paddingInline: 16, background: selected ? '#e9c176' : 'rgba(255,255,255,0.06)', color: selected ? '#131314' : '#fff', border: '1px solid rgba(233,193,118,0.4)' }}
          >
            {selected ? 'Selected' : 'Select This Cigar'}
          </button>
          <button
            type="button"
            onClick={() => onRequestStaff(rec)}
            disabled={requestState?.staff === 'pending'}
            className="font-label-sm text-label-sm uppercase tracking-widest rounded-lg active:scale-95 transition-all disabled:opacity-60"
            style={{ height: 40, paddingInline: 16, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {requestState?.staff === 'pending' ? 'Request Logged — Local Session' : 'Request from Staff'}
          </button>
          <button
            type="button"
            onClick={() => onAddToPos(rec)}
            disabled={requestState?.pos === 'pending'}
            className="font-label-sm text-label-sm uppercase tracking-widest rounded-lg active:scale-95 transition-all disabled:opacity-60"
            style={{ height: 40, paddingInline: 16, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
          >
            {requestState?.pos === 'pending' ? 'Added — Local Session' : 'Add to POS'}
          </button>
        </div>
      </div>
    </div>
  )
}

const OPTIONS = [
  { id: 'ideal',   label: 'Ideal 70/70',   desc: '70°F / 70% RH — classic storage, balanced draw.', insight: 'Your cigar has been resting at the textbook standard. Expect an even burn and the flavor profile the blender intended.' },
  { id: 'dry',     label: 'Dry Box 62%',   desc: '62% RH — tighter draw, slower burn.',              insight: 'Slightly under-humidified. The draw will feel firmer and the burn rate slower — toast a touch longer before lighting.' },
  { id: 'travel',  label: 'Travel Case',   desc: 'Sealed travel humidor — field conditions.',         insight: 'Storage conditions were not climate-controlled. Inspect the wrapper for dryness before cutting and toast carefully.' },
]

export default function HumidorMatch() {
  const navigate = useNavigate()
  const { session, completeStep, addXP, setHumidorMatchSelection, setSelectedHumidorRecommendation } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)
  const [selectedRecType, setSelectedRecType] = useState(null)
  const [requestStates, setRequestStates] = useState({})
  const selectedOption = OPTIONS.find(o => o.id === selected)

  const recommendations = useMemo(() => computeHumidorRecommendations(session), [session])
  const recList = [recommendations.bestMatch, recommendations.stepUp, recommendations.venueFeatured]
  const selectedRecommendation = recList.find(r => r.recommendationType === selectedRecType) || null

  function handleSelectRecommendation(rec) {
    triggerHaptic('light')
    setSelectedRecType(rec.recommendationType)
  }

  function handleRequestStaff(rec) {
    triggerHaptic('light')
    emit({
      sourceSystem: SYSTEMS.SMOKECRAFT,
      targetSystem: SYSTEMS.POS3,
      eventType: 'POS_HANDOFF_CREATED',
      commandType: 'CIGAR_RECOMMENDATION_REQUEST',
      productId: rec.cigarId,
      payload: { cigarId: rec.cigarId, cigarName: rec.cigarName, recommendationType: rec.recommendationType, channel: 'humidor-match' },
    })
    setRequestStates(prev => ({ ...prev, [rec.cigarId]: { ...prev[rec.cigarId], staff: 'pending' } }))
  }

  function handleAddToPos(rec) {
    triggerHaptic('light')
    emit({
      sourceSystem: SYSTEMS.SMOKECRAFT,
      targetSystem: SYSTEMS.POS3,
      eventType: 'POS_ADD_TO_TICKET_REQUESTED',
      commandType: 'ADD_CIGAR_TO_POS',
      productId: rec.cigarId,
      payload: { cigarId: rec.cigarId, cigarName: rec.cigarName, recommendationType: rec.recommendationType, channel: 'humidor-match' },
    })
    setRequestStates(prev => ({ ...prev, [rec.cigarId]: { ...prev[rec.cigarId], pos: 'pending' } }))
  }

  function handleContinue() {
    if (done) return
    if (!selectedRecommendation || !selectedOption) return
    setDone(true)
    triggerHaptic('medium')
    setHumidorMatchSelection(selectedOption)
    setSelectedHumidorRecommendation(selectedRecommendation)
    completeStep('humidor-match')
    addXP(100)
    navigate('/smokecraft/request-purchase')
  }

  const stepProgress = getVisitProgress(session.completedSteps)

  return (
    <div className="humidor-page text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors flex items-center justify-center" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/golden-box')} aria-label="Back"><ArrowBackIcon size={24} /></button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 sm:px-[6vw] max-w-[1400px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <div className="smokecraft-progress-label flex items-center gap-3">
            <span>Round {stepProgress.round} of 3</span>
            <span>Visit {stepProgress.visit} of {stepProgress.totalVisits}</span>
            <span>Session {stepProgress.session} of {stepProgress.totalSessions}</span>
          </div>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:`${(stepProgress.session/24)*100}%` }} /></div>
          <span>Humidor Match</span>
        </div>

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-2">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize:'clamp(26px,4vw,40px)', fontFamily: '"Playfair Display", serif' }}>Humidor Match</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6" style={{ maxWidth:520 }}>Your matched recommendations, then confirm your cigar's storage condition before the session begins.</p>

        <div className="rounded-2xl border border-primary/15 mb-10" style={{ background: '#0a0a0b', padding: 16 }}>
          <img src="/assets/smokecraft/Humidor Match 1.png" alt="Humidor match guide" style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
        </div>

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em] mb-2">Your Cigar Recommendations</p>
        <p className="font-body-sm text-body-sm text-on-surface-variant/70 mb-4" style={{ fontSize: 12 }}>Matched from the house humidor catalog. Pricing and staff requests are logged to this local session — no order is placed automatically.</p>
        {!recommendations.dataCompleteness.hasProfile && (
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-4">Complete your profile, format, and Seed & Soil pairing earlier in the protocol for a stronger match — these recommendations use only the data you've provided so far.</p>
        )}
        <div className="grid gap-5 mb-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {recList.map(rec => (
            <RecommendationCard
              key={rec.recommendationType}
              rec={rec}
              selected={selectedRecType === rec.recommendationType}
              onSelect={handleSelectRecommendation}
              requestState={requestStates[rec.cigarId]}
              onRequestStaff={handleRequestStaff}
              onAddToPos={handleAddToPos}
            />
          ))}
        </div>

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em] mb-4">Storage Condition</p>
        <div
          className="flex flex-col gap-3 mb-12 rounded-3xl border border-primary/15 backdrop-blur-xl"
          style={{
            padding: 16,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {OPTIONS.map(o => {
            const on = selected === o.id
            function select() {
              triggerHaptic('light')
              setSelected(o.id)
            }
            return (
              <div
                key={o.id}
                role="button"
                tabIndex={0}
                onClick={select}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') select() }}
                className="flex items-center gap-5 w-full text-left rounded-2xl border transition-all duration-300 active:scale-[0.98] cursor-pointer"
                style={{
                  padding: '20px 20px 20px 24px',
                  background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                  borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.08)',
                  boxShadow: on ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
                }}
              >
                <span className="flex items-center justify-center rounded-full shrink-0" style={{ width:48, height:48, background: on ? 'rgba(233,193,118,0.18)' : 'rgba(255,255,255,0.06)', border: on ? '1.5px solid rgba(233,193,118,0.5)' : '1.5px solid rgba(255,255,255,0.12)', color: on ? '#e9c176' : 'rgba(255,255,255,0.7)' }}>
                  <DropIcon size={22} />
                </span>
                <div className="flex-1">
                  <p className="font-label-lg text-label-lg text-on-surface font-semibold">{o.label}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">{o.desc}</p>
                </div>
                {on && (
                  <span className="flex items-center justify-center rounded-full shrink-0" style={{ width:20, height:20, background:'#e9c176', color:'#131314' }}>
                    <CheckIcon size={13} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); select() }}
                  aria-label={`Select ${o.label}`}
                  className="flex items-center justify-center rounded-full transition-all duration-300 active:scale-90 hover:bg-primary/10"
                  style={{
                    width: 40,
                    height: 40,
                    flexShrink: 0,
                    border: on ? '1px solid rgba(233,193,118,0.5)' : '1px solid rgba(255,255,255,0.1)',
                    color: on ? '#e9c176' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  <ChevronRightIcon size={22} />
                </button>
              </div>
            )
          })}
        </div>
        {selectedOption && (
          <div
            className="flex items-start gap-4 mb-12 rounded-2xl border"
            style={{
              padding: '18px 22px',
              background: 'linear-gradient(135deg, rgba(233,193,118,0.08), rgba(233,193,118,0.02))',
              borderColor: 'rgba(233,193,118,0.3)',
            }}
          >
            <span className="text-primary shrink-0" style={{ marginTop: 2 }}><InsightsIcon size={22} /></span>
            <div>
              <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest mb-1">What this means</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{selectedOption.insight}</p>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleContinue} disabled={!selected || !selectedRecommendation || done}
            className="flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 disabled:opacity-40 w-full sm:w-auto"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <ArrowForwardIcon size={20} />
          </button>
          <button onClick={() => navigate('/smokecraft/golden-box')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height:64,paddingInline:32 }}>
            <ArrowBackIcon size={20} /> Back
          </button>
        </div>
      </main>
      <style>{`
        .humidor-page { background: #0d0d0e; }

        .humidor-card {
          display: flex;
          flex-direction: column;
          border-radius: 20px;
          overflow: hidden;
          background: linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.18) 100%);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 18px 42px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          transition: border-color 0.3s, box-shadow 0.3s, background 0.3s;
        }
        .humidor-card--selected {
          border-color: rgba(233,193,118,0.55);
          box-shadow: 0 0 0 1px rgba(233,193,118,0.3), 0 18px 48px rgba(233,193,118,0.16);
          background: linear-gradient(160deg, rgba(233,193,118,0.1) 0%, rgba(233,193,118,0.03) 60%, rgba(0,0,0,0.18) 100%);
        }
        .humidor-card__media {
          position: relative;
          height: 150px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .humidor-card__media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: saturate(1.1) brightness(0.9);
        }
        .humidor-card__media-fade {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 50%, rgba(13,13,14,0.85) 100%);
        }
        .humidor-card__media--pending {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background: rgba(0,0,0,0.35);
          color: rgba(233,193,118,0.55);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .humidor-card__body { padding: 18px 20px 20px; }
        .humidor-card__lane-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 999px;
          flex-shrink: 0;
          background: rgba(233,193,118,0.14);
          color: #e9c176;
        }
        .humidor-card__facts {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px 12px;
          padding: 12px;
          border-radius: 12px;
          background: rgba(0,0,0,0.22);
          border: 1px solid rgba(233,193,118,0.12);
        }
        .humidor-card__facts span {
          display: flex;
          flex-direction: column;
          font-size: 12.5px;
          color: rgba(229,226,227,0.85);
        }
        .humidor-card__facts span strong {
          font-size: 9.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(233,193,118,0.75);
          font-weight: 700;
          margin-bottom: 1px;
        }
        .humidor-card__score {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 14px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(233,193,118,0.85);
        }
        .humidor-card__score-bar {
          flex: 1;
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
        }
        .humidor-card__score-bar div {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #c5a059, #e9c176);
        }
        .humidor-card__score-value { color: #e9c176; font-weight: 700; }
      `}</style>
    </div>
  )
}
