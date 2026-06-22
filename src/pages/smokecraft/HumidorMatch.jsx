import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { DropIcon, CheckIcon, ChevronRightIcon, InsightsIcon, ArrowForwardIcon, ArrowBackIcon } from '../../components/smokecraft/PremiumIcons.jsx'

const OPTIONS = [
  { id: 'ideal',   label: 'Ideal 70/70',   desc: '70°F / 70% RH — classic storage, balanced draw.', insight: 'Your cigar has been resting at the textbook standard. Expect an even burn and the flavor profile the blender intended.' },
  { id: 'dry',     label: 'Dry Box 62%',   desc: '62% RH — tighter draw, slower burn.',              insight: 'Slightly under-humidified. The draw will feel firmer and the burn rate slower — toast a touch longer before lighting.' },
  { id: 'travel',  label: 'Travel Case',   desc: 'Sealed travel humidor — field conditions.',         insight: 'Storage conditions were not climate-controlled. Inspect the wrapper for dryness before cutting and toast carefully.' },
]

export default function HumidorMatch() {
  const navigate = useNavigate()
  const { completeStep, addXP, setHumidorMatchSelection } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)
  const selectedOption = OPTIONS.find(o => o.id === selected)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    if (selectedOption) setHumidorMatchSelection(selectedOption)
    completeStep('humidor-match')
    addXP(100)
    navigate('/smokecraft/request-purchase')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage:"url('/assets/smokecraft/cropped/humidor-match-bg.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors flex items-center justify-center" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/golden-box')} aria-label="Back"><ArrowBackIcon size={24} /></button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <span>Step 6 of 17</span>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:'35.3%' }} /></div>
          <span>Humidor Match</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-4" style={{ fontSize:'clamp(26px,4vw,40px)' }}>Humidor Match</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6" style={{ maxWidth:560 }}>Confirm your cigar's storage condition before the session begins.</p>
        <div className="rounded-2xl overflow-hidden mb-10 border border-primary/15" style={{ height: 180 }}>
          <img src="/assets/smokecraft/cropped/humidor-match-bg.jpg" alt="Humidor" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.1) brightness(0.85)' }} />
        </div>
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
          <button onClick={handleContinue} disabled={!selected || done}
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
    </div>
  )
}
