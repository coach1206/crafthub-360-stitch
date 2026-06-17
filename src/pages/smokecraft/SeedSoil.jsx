import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const REGIONS = [
  { id: 'vuelta',    name: 'Vuelta Abajo',  country: 'Cuba',      note: 'The gold standard — silky texture, complex aroma.' },
  { id: 'jalapa',    name: 'Jalapa Valley', country: 'Nicaragua', note: 'High altitude, bold spice and earth.' },
  { id: 'esteli',    name: 'Estelí',        country: 'Nicaragua', note: 'Sun-grown Criollo with intense pepper notes.' },
  { id: 'sanandres', name: 'San Andrés',    country: 'Mexico',    note: 'Negro Maduro wrapper, dark cocoa and sweet finish.' },
]

const FILL1 = { fontVariationSettings: "'FILL' 1" }

export default function SeedSoil() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('seed-soil')
    addXP(100)
    navigate('/smokecraft/mentor')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/smokecraft.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/format')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <span>Step 5 of 17</span>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:'29.4%' }} /></div>
          <span>Seed &amp; Soil</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-4" style={{ fontSize:'clamp(26px,4vw,40px)' }}>Seed &amp; Soil Pairing</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-10" style={{ maxWidth:560 }}>Select the tobacco growing region that defines the character of tonight's cigar.</p>
        <div className="flex flex-col gap-3 mb-12">
          {REGIONS.map(r => {
            const on = selected === r.id
            return (
              <button key={r.id} type="button" onClick={() => { triggerHaptic('light'); setSelected(r.id) }}
                className="flex items-center gap-5 w-full text-left rounded-2xl border transition-all duration-300 active:scale-[0.98]"
                style={{ padding:'20px 24px', background: on ? 'rgba(233,193,118,0.08)' : 'rgba(255,255,255,0.03)', borderColor: on ? 'rgba(233,193,118,0.4)' : 'rgba(255,255,255,0.08)' }}>
                <span className="material-symbols-outlined text-primary" style={{ fontSize:28, ...(on ? FILL1 : {}) }}>nature_people</span>
                <div className="flex-1">
                  <p className="font-label-lg text-label-lg text-on-surface font-semibold">{r.name} <span className="text-primary/60 font-normal">— {r.country}</span></p>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">{r.note}</p>
                </div>
                {on && <span className="material-symbols-outlined text-primary" style={FILL1}>check_circle</span>}
              </button>
            )
          })}
        </div>
        <div className="flex gap-4">
          <button onClick={handleContinue} disabled={!selected}
            className="flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 disabled:opacity-40"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/format')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
