import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const PAIRINGS = [
  { id: 'scotch',   label: 'Single Malt Scotch', desc: 'Smoky, peaty — mirrors a full-bodied cigar.' },
  { id: 'rum',       label: 'Añejo Rum',          desc: 'Sweet caramel notes complement medium wrappers.' },
  { id: 'espresso',  label: 'Dark Espresso',      desc: 'Bitter contrast that sharpens flavor transitions.' },
  { id: 'chocolate', label: 'Dark Chocolate 72%', desc: 'Bittersweet harmony with cocoa-forward tobacco.' },
]

export default function PairingLab() {
  const navigate = useNavigate()
  const { completeStep, addXP } = useGuestSession()
  const [pairing, setPairing] = useState(null)
  const [done, setDone] = useState(false)

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('pairing-lab')
    addXP(75)
    navigate('/smokecraft/humidor-match')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors" style={{ minWidth: 48, minHeight: 48 }} onClick={() => navigate('/smokecraft/seed-soil')} aria-label="Back">arrow_back</button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-20 px-6 sm:px-[6vw] max-w-[1400px] mx-auto">
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360 — Visit 3</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize: 'clamp(26px,4vw,40px)' }}>Pairing Lab</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6" style={{ maxWidth: 560 }}>Experiment with a pairing before your first official cigar match. What would you reach for?</p>
        <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.28)', marginBottom: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.45)' }}>
          <img src="/assets/smokecraft-reference/approved/smokecraft-pairing-lab.png" alt="Pairing Lab" style={{ display: 'block', width: '100%', minHeight: 260, maxHeight: 420, objectFit: 'cover', objectPosition: 'center top' }} />
        </div>

        <div
          className="rounded-3xl border overflow-hidden mb-10"
          style={{
            height: 280,
            borderColor: 'rgba(233,193,118,0.28)',
            background: "url('/assets/smokecraft/cropped/pairing-lab-hero.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: 28,
          }}
        >
          <div
            className="w-full"
            style={{
              background: 'linear-gradient(to top, rgba(10,7,4,0.72) 0%, rgba(10,7,4,0.0) 100%)',
              margin: -28,
              padding: 28,
              paddingTop: 70,
            }}
          >
            <p className="font-label-sm text-label-sm uppercase tracking-[0.25em] mb-1" style={{ color: '#f3d49a', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}>Blend Pairing Guide</p>
            <p className="font-body-md text-[14px] text-white/80" style={{ maxWidth: 560, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>Curated food and drink recommendations tailored to enhance every nuance.</p>
          </div>
        </div>

        <div className="rounded-2xl border mb-10" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)', borderColor: 'rgba(233,193,118,0.2)', padding: 24 }}>
          <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-4">Choose Your Pairing</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {PAIRINGS.map(p => { const on = pairing === p.id; return (
              <button key={p.id} type="button" onClick={() => { triggerHaptic('light'); setPairing(p.id) }}
                className="sc-tactile text-left rounded-2xl border transition-all duration-300 active:scale-[0.98]"
                style={{ padding: 20, background: on ? 'rgba(233,193,118,0.12)' : 'rgba(255,255,255,0.07)', borderColor: on ? 'rgba(233,193,118,0.5)' : 'rgba(233,193,118,0.22)' }}>
                <p className="font-label-lg text-label-lg font-semibold" style={{ color: on ? '#e9c176' : undefined }}>{p.label}</p>
                <p className="font-body-md text-body-md text-on-surface-variant mt-1">{p.desc}</p>
              </button>
            )})}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleContinue}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height: 64, paddingInline: 40, background: 'linear-gradient(135deg,#e9c176,#c5a059)', color: '#131314', boxShadow: '0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/seed-soil')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height: 64, paddingInline: 32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
