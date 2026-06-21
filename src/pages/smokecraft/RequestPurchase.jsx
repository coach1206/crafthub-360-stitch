import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const OPTIONS = [
  { id: 'request', icon: 'store',         label: 'Request from Humidor',     desc: 'A staff member will retrieve your selected cigar from the house humidor.', actionType: 'HUMIDOR_REQUEST' },
  { id: 'have',    icon: 'smoking_rooms', label: 'I Already Have My Cigar',  desc: 'You have your cigar ready. Proceed to cut, toast, and light.',             actionType: 'GUEST_HAS_CIGAR' },
]

export default function RequestPurchase() {
  const navigate = useNavigate()
  const { completeStep, addXP, setRequestPurchaseChoice } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    const choice = OPTIONS.find(o => o.id === selected)
    if (!choice) return
    setDone(true)
    triggerHaptic('medium')
    setRequestPurchaseChoice(choice)
    completeStep('request-purchase')
    addXP(25)
    navigate('/smokecraft/cut-toast-light')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage:"url('/assets/smokecraft/cropped/request-purchase-bg.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/humidor-match')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <span>Step 7 of 17</span>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:'41.2%' }} /></div>
          <span>Request / Purchase</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-4" style={{ fontSize:'clamp(26px,4vw,40px)' }}>Request or Purchase Cigar</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10" style={{ maxWidth:560 }}>How will you be obtaining your cigar for tonight's session?</p>
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
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: on ? 'rgba(233,193,118,0.15)' : 'rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined text-primary" style={{ fontSize:22, lineHeight:1, ...(on ? FILL1 : {}) }}>{o.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-1">{o.label}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">{o.desc}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: on ? '#e9c176' : 'rgba(255,255,255,0.2)', background: on ? '#e9c176' : 'transparent' }}>
                  {on && <span className="material-symbols-outlined" style={{ fontSize:12,color:'#131314',...FILL1 }}>check</span>}
                </div>
              </button>
            )
          })}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleContinue} disabled={!selected || done}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 disabled:opacity-40 w-full sm:w-auto"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/humidor-match')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height:64,paddingInline:32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
