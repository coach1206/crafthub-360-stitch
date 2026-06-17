import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const ACTIONS = [
  { id:'share-stamp',     icon:'share',            label:'Share Your Passport Stamp',      desc:'Send your SmokeCraft 360 certification to guests at the table.' },
  { id:'exchange-card',   icon:'contact_page',     label:'Exchange Contact Card',           desc:'Share your digital lounge card with fellow members.' },
  { id:'scan-qr',         icon:'qr_code_scanner',  label:'Scan Guest QR Code',             desc:'Connect with another guest by scanning their 360 Passport QR.' },
  { id:'join-leaderboard',icon:'leaderboard',      label:'Join the Grand Lounge Ranking',  desc:'Enter your session score into tonight\'s leaderboard.' },
  { id:'follow-venue',    icon:'store',            label:'Follow This Venue',              desc:'Stay connected to this lounge for future events and releases.' },
  { id:'mentor-rec',      icon:'recommend',        label:'Save Mentor Recommendation',     desc:'Bookmark your mentor\'s cigar and pairing suggestions.' },
  { id:'cigar-circle',    icon:'groups',           label:'Join the Cigar Circle',          desc:'Connect with the private member circle from tonight\'s session.' },
]
const FILL1 = { fontVariationSettings: "'FILL' 1" }

export default function Connections() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [done, setDone] = useState(new Set())
  const [proceeded, setProceeded] = useState(false)

  function toggle(id) { triggerHaptic('light'); setDone(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  function handleContinue() {
    if (proceeded) return
    setProceeded(true)
    triggerHaptic('medium')
    completeStep('connections')
    addXP(50)
    navigate('/smokecraft/management-sync')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage:"url('/background-lounge-airy.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/passport-stamp')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <span>Step 15 of 17</span>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:'88.2%' }} /></div>
          <span>360 Connections</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-4" style={{ fontSize:'clamp(26px,4vw,40px)' }}>360 Passport Connections</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10" style={{ maxWidth:560 }}>Complete any connections you want to make before leaving the lounge. Each action deepens your membership and grows your 360 network.</p>
        <div className="flex flex-col gap-3 mb-12">
          {ACTIONS.map(a => {
            const on = done.has(a.id)
            return (
              <button key={a.id} type="button" onClick={() => toggle(a.id)}
                className="flex items-center gap-5 w-full text-left rounded-2xl border transition-all duration-300 active:scale-[0.98]"
                style={{ padding:'20px 24px', background: on ? 'rgba(233,193,118,0.08)' : 'rgba(255,255,255,0.03)', borderColor: on ? 'rgba(233,193,118,0.4)' : 'rgba(255,255,255,0.08)' }}>
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300" style={{ background: on ? 'rgba(233,193,118,0.15)' : 'rgba(255,255,255,0.05)' }}>
                  <span className="material-symbols-outlined text-primary" style={{ fontSize:22, ...(on ? FILL1 : {}) }}>{a.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-1">{a.label}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">{a.desc}</p>
                </div>
                <div className="flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ borderColor: on ? '#e9c176' : 'rgba(255,255,255,0.2)', background: on ? '#e9c176' : 'transparent' }}>
                  {on && <span className="material-symbols-outlined" style={{ fontSize:14,color:'#131314',...FILL1 }}>check</span>}
                </div>
              </button>
            )
          })}
        </div>
        <div className="flex gap-4">
          <button onClick={handleContinue}
            className="flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/passport-stamp')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
