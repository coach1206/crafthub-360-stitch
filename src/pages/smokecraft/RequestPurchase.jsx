import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { emit, SYSTEMS } from '../../services/shared/opsEventBus.js'
import { StoreIcon, CigarIcon, CheckIcon, ArrowForwardIcon, ArrowBackIcon } from '../../components/smokecraft/PremiumIcons.jsx'
import { getVisitProgress } from '../../constants/session.js'

const OPTIONS = [
  { id: 'request', Icon: StoreIcon, label: 'Request from Humidor',     desc: 'A staff member will retrieve your selected cigar from the house humidor.', actionType: 'HUMIDOR_REQUEST' },
  { id: 'have',    Icon: CigarIcon, label: 'I Already Have My Cigar',  desc: 'You have your cigar ready. Proceed to cut, toast, and light.',             actionType: 'GUEST_HAS_CIGAR' },
]

export default function RequestPurchase() {
  const navigate = useNavigate()
  const { session, completeStep, addXP, setRequestPurchaseChoice, syncPos3Activity, syncEATActivity } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    const choice = OPTIONS.find(o => o.id === selected)
    if (!choice) return
    setDone(true)
    triggerHaptic('medium')
    setRequestPurchaseChoice(choice)
    if (choice.actionType === 'HUMIDOR_REQUEST') {
      syncPos3Activity()
      syncEATActivity()
      // Emit shared ops-bus events so POS3 + E.A.T. surface this handoff live.
      emit({
        sourceSystem: SYSTEMS.SMOKECRAFT,
        targetSystem: SYSTEMS.POS3,
        eventType:    'POS_HANDOFF_CREATED',
        commandType:  'HUMIDOR_REQUEST',
        payload:      { label: choice.label, desc: choice.desc, channel: 'humidor' },
      })
      emit({
        sourceSystem: SYSTEMS.SMOKECRAFT,
        targetSystem: SYSTEMS.EAT,
        eventType:    'EAT_EVENT_CREATED',
        commandType:  'CIGAR_REQUESTED',
        payload:      { label: choice.label, desc: choice.desc, channel: 'humidor' },
      })
    } else {
      // "I Already Have My Cigar" — SmokeCraft-only signal, no POS3/EAT routing.
      emit({
        sourceSystem: SYSTEMS.SMOKECRAFT,
        targetSystem: SYSTEMS.SMOKECRAFT,
        eventType:    'CIGAR_PROVIDED_BY_GUEST',
        commandType:  'GUEST_HAS_CIGAR',
        payload:      { label: choice.label },
      })
    }
    completeStep('request-purchase')
    addXP(25)
    navigate('/smokecraft/cut-toast-light')
  }

  const stepProgress = getVisitProgress(session.completedSteps)

  return (
    <div className="request-purchase-page text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors flex items-center justify-center" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/humidor-match')} aria-label="Back"><ArrowBackIcon size={24} /></button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <div className="smokecraft-progress-label flex items-center gap-3">
            <span>Round {stepProgress.round} of 3</span>
            <span>Visit {stepProgress.visit} of {stepProgress.totalVisits}</span>
            <span>Session {stepProgress.session} of {stepProgress.totalSessions}</span>
          </div>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:`${(stepProgress.session/24)*100}%` }} /></div>
          <span>Request / Purchase</span>
        </div>

        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-2">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize:'clamp(26px,4vw,40px)', fontFamily: '"Playfair Display", serif' }}>Request or Purchase Cigar</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6" style={{ maxWidth:520 }}>How will you be obtaining your cigar for tonight's session?</p>

        <div className="rounded-2xl border border-primary/15 mb-10" style={{ background: '#0a0a0b', padding: 12 }}>
          <img src="/request-purchase.png" alt="Request or purchase guide" style={{ width: '100%', maxHeight: 460, objectFit: 'contain', display: 'block', margin: '0 auto' }} />
        </div>
        <div className="flex items-start gap-3 mb-6 rounded-2xl border" style={{ padding: '14px 18px', background: 'rgba(233,193,118,0.06)', borderColor: 'rgba(233,193,118,0.25)' }}>
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 20, marginTop: 1 }}>info</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant" style={{ fontSize: 13 }}>This is a local handoff step only — no payment is processed and no order is placed here. Your choice tells the session what to do next.</p>
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
            return (
              <button key={o.id} type="button" onClick={() => { triggerHaptic('light'); setSelected(o.id) }}
                className="sc-tactile flex items-center gap-5 w-full text-left rounded-2xl border transition-all duration-300 active:scale-[0.98]"
                style={{
                  padding: '24px',
                  background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                  borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.08)',
                  boxShadow: on ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
                }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: on ? 'rgba(233,193,118,0.15)' : 'rgba(255,255,255,0.05)', color: '#e9c176' }}>
                  <o.Icon size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-1">{o.label}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">{o.desc}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: on ? '#e9c176' : 'rgba(255,255,255,0.2)', background: on ? '#e9c176' : 'transparent' }}>
                  {on && <CheckIcon size={12} color="#131314" />}
                </div>
              </button>
            )
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleContinue} disabled={!selected || done}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 disabled:opacity-40 w-full sm:w-auto"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <ArrowForwardIcon size={20} />
          </button>
          <button onClick={() => navigate('/smokecraft/humidor-match')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height:64,paddingInline:32 }}>
            <ArrowBackIcon size={20} /> Back
          </button>
        </div>
      </main>
      <style>{`
        .request-purchase-page { background: #0d0d0e; }
      `}</style>
    </div>
  )
}
