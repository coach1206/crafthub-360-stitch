import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { getVisitProgress } from '../../constants/session.js'

const ITEMS = [
  { id:'log',     icon:'assignment_turned_in', label:'Submit Session to Venue Log',       desc:'Send your full session summary to the house management system.' },
  { id:'notes',   icon:'share_reviews',        label:'Share Tasting Notes with Staff',    desc:'Let your server and sommelier review your flavor observations.' },
  { id:'manager', icon:'support_agent',        label:'Request Follow-Up from Manager',    desc:'Flag this session for a personal manager follow-up.' },
]
const FILL1 = { fontVariationSettings: "'FILL' 1" }

export default function ManagementSync() {
  const navigate = useNavigate()
  const { session, completeStep, addXP } = useGuestSession()
  const [checked, setChecked] = useState(new Set())
  const [done, setDone] = useState(false)

  function toggle(id) { triggerHaptic('light'); setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n }) }

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('management-sync')
    addXP(25)
    navigate('/smokecraft/session-complete')
  }

  const stepProgress = getVisitProgress(session.completedSteps)

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-8" style={{ backgroundImage:"url('/assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.97) 0%,rgba(19,19,20,0.7) 50%,rgba(19,19,20,0.97) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/connections')} aria-label="Back">arrow_back</button>
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
          <span>Management Sync</span>
        </div>
        <div className="mb-8 rounded-2xl overflow-hidden border border-primary/20 shadow-xl relative" style={{ height: 200 }}>
          <img
            className="w-full h-full object-cover"
            src="/assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png"
            alt="Venue staff reviewing session handoff details"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to right, rgba(19,19,20,0.85) 0%, rgba(19,19,20,0.15) 60%, transparent 100%)' }} />
          <div className="absolute inset-0 flex flex-col justify-center px-6">
            <span className="material-symbols-outlined text-primary mb-2" style={{ fontSize: 28, ...FILL1 }}>sync</span>
            <p className="font-label-sm text-label-sm text-primary uppercase tracking-widest">Venue Handoff</p>
          </div>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-4" style={{ fontSize:'clamp(26px,4vw,40px)' }}>Your Visit Has Been Logged</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10" style={{ maxWidth:560 }}>Your visit has been logged for the venue team. You can optionally share extra details with staff below before closing out.</p>
        <div className="flex flex-col gap-3 mb-12">
          {ITEMS.map(item => {
            const on = checked.has(item.id)
            return (
              <button key={item.id} type="button" onClick={() => toggle(item.id)}
                className="sc-tactile flex items-center gap-5 w-full text-left rounded-2xl border transition-all duration-300 active:scale-[0.98]"
                style={{ padding:'20px 24px', background: on ? 'rgba(233,193,118,0.08)' : 'rgba(255,255,255,0.03)', borderColor: on ? 'rgba(233,193,118,0.4)' : 'rgba(255,255,255,0.08)' }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize:26, ...(on ? FILL1 : {}) }}>{item.icon}</span>
                <div className="flex-1">
                  <p className="font-label-lg text-label-lg text-on-surface font-semibold">{item.label}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">{item.desc}</p>
                </div>
                <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: on ? '#e9c176' : 'rgba(255,255,255,0.2)', background: on ? '#e9c176' : 'transparent' }}>
                  {on && <span className="material-symbols-outlined" style={{ fontSize:14,color:'#131314',...FILL1 }}>check</span>}
                </div>
              </button>
            )
          })}
        </div>
        <div className="flex gap-4">
          <button onClick={handleContinue}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Complete Session <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/connections')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
