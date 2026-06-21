import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const REGIONS = [
  {
    id: 'vuelta', name: 'Vuelta Abajo', country: 'Cuba',
    note: 'The gold standard — silky texture, complex aroma.',
    wrapper: 'Habano Cuban-seed', binder: 'Cuban Criollo', filler: 'Cuban Corojo & Criollo',
    aging: 'Aged 4+ years in cedar', strength: 'Medium-Full',
    craftProfile: 'Hand-rolled by third-generation torcedores using century-old fermentation pits.',
    brandStory: "Vuelta Abajo's red clay soil and humid microclimate have made it the benchmark region tobacco growers worldwide try to imitate.",
  },
  {
    id: 'jalapa', name: 'Jalapa Valley', country: 'Nicaragua',
    note: 'High altitude, bold spice and earth.',
    wrapper: 'Jalapa Habano', binder: 'Nicaraguan Criollo', filler: 'Nicaraguan Ligero & Seco',
    aging: 'Aged 3 years', strength: 'Full',
    craftProfile: 'Grown at high elevation where cool nights slow leaf growth, concentrating oils and spice.',
    brandStory: "Jalapa's volcanic soil and fog-shrouded valley produce some of the most sought-after ligero filler leaf in the world.",
  },
  {
    id: 'esteli', name: 'Estelí', country: 'Nicaragua',
    note: 'Sun-grown Criollo with intense pepper notes.',
    wrapper: 'Estelí Criollo', binder: 'Nicaraguan Habano', filler: 'Nicaraguan Ligero',
    aging: 'Aged 2-3 years', strength: 'Full',
    craftProfile: 'Sun-grown for maximum strength; leaves are pressed and fermented in stacks called pilones.',
    brandStory: "Known as the tobacco capital of Nicaragua, Estelí's mineral-rich valley soil drives intensity into every leaf.",
  },
  {
    id: 'sanandres', name: 'San Andrés', country: 'Mexico',
    note: 'Negro Maduro wrapper, dark cocoa and sweet finish.',
    wrapper: 'San Andrés Negro Maduro', binder: 'Mexican Criollo', filler: 'Mexican Criollo & Nicaraguan blend',
    aging: 'Aged 18-24 months', strength: 'Medium',
    craftProfile: 'Volcanic soil deposits give the wrapper its near-black color and natural sweetness.',
    brandStory: "San Andrés Valley's volcanic ash soil, left by the Los Tuxtlas eruptions, produces the rare negro wrapper prized by maduro blenders.",
  },
]

const SOIL_GROUPS = [
  {
    key: 'atmosphere', label: 'Venue Atmosphere', icon: 'deck',
    options: ['Lounge', 'Patio', 'Poolside', 'Private Room'],
  },
  {
    key: 'pairing', label: 'Drink / Food Pairing', icon: 'local_bar',
    options: ['Whiskey', 'Rum', 'Coffee', 'Red Wine'],
  },
  {
    key: 'music', label: 'Music Vibe', icon: 'music_note',
    options: ['Jazz', 'Acoustic', 'Lo-fi', 'Live Band'],
  },
  {
    key: 'weather', label: 'Weather', icon: 'partly_cloudy_night',
    options: ['Warm Evening', 'Cool Night', 'Rainy', 'Breezy'],
  },
  {
    key: 'social', label: 'Social Setting', icon: 'groups',
    options: ['Solo', 'Date', 'Group', 'Celebration'],
  },
  {
    key: 'mood', label: 'Your Mood', icon: 'mood',
    options: ['Relaxed', 'Celebratory', 'Reflective', 'Adventurous'],
  },
  {
    key: 'theme', label: 'Event Theme', icon: 'event',
    options: ['Casual', 'Formal', 'Outdoor', 'Anniversary'],
  },
]

const FILL1 = { fontVariationSettings: "'FILL' 1" }

function buildPairingExplanation(region, soil) {
  if (!region) return ''
  const bits = []
  bits.push(`A ${region.strength.toLowerCase()}-strength ${region.name} leaf`)
  if (soil.mood) bits.push(`matches a ${soil.mood.toLowerCase()} mood`)
  if (soil.atmosphere) bits.push(`suits a ${soil.atmosphere.toLowerCase()} setting`)
  if (soil.pairing) bits.push(`and pairs naturally with ${soil.pairing.toLowerCase()}`)
  if (soil.social) bits.push(`for a ${soil.social.toLowerCase()} occasion`)
  return bits.join(', ') + '.'
}

export default function SeedSoil() {
  const navigate = useNavigate()
  const { completeStep, addXP, update } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [soil, setSoil] = useState({})
  const [done, setDone] = useState(false)

  const region = REGIONS.find(r => r.id === selected) || null
  const soilComplete = SOIL_GROUPS.every(g => soil[g.key])
  const canContinue = Boolean(selected) && soilComplete

  function setSoilValue(key, value) {
    triggerHaptic('light')
    setSoil(prev => ({ ...prev, [key]: prev[key] === value ? undefined : value }))
  }

  function handleContinue() {
    if (done || !canContinue) return
    setDone(true)
    triggerHaptic('medium')
    update(prev => ({
      ...prev,
      smokecraftSeedSoil: { seedRegionId: region.id, soil, pairingExplanation: buildPairingExplanation(region, soil) },
    }))
    completeStep('seed-soil')
    addXP(100)
    navigate('/smokecraft/mentor')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/assets/smokecraft/cropped/cut-toast-light-bg.jpg')" }} />
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
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6" style={{ maxWidth:560 }}>Select the tobacco growing region that defines the character of tonight's cigar (the Seed), then tell us about tonight's setting (the Soil) so we can explain why the pairing works.</p>

        <h3 className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em] mb-3">Seed: Growing Region</h3>
        <div className="flex flex-col gap-3 mb-6">
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

        {region && (
          <div className="mb-10 rounded-2xl border border-outline-variant/20" style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.03)' }}>
            <p className="font-label-md text-label-md text-primary uppercase tracking-[0.15em] mb-3">Seed Profile</p>
            <dl className="grid grid-cols-2 gap-3 font-body-sm text-body-sm text-on-surface-variant">
              <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 11 }}>Wrapper</dt><dd>{region.wrapper}</dd></div>
              <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 11 }}>Binder</dt><dd>{region.binder}</dd></div>
              <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 11 }}>Filler</dt><dd>{region.filler}</dd></div>
              <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 11 }}>Aging</dt><dd>{region.aging}</dd></div>
              <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 11 }}>Strength</dt><dd>{region.strength}</dd></div>
              <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 11 }}>Craft Profile</dt><dd>{region.craftProfile}</dd></div>
            </dl>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-3" style={{ fontStyle: 'italic' }}>{region.brandStory}</p>
          </div>
        )}

        <h3 className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em] mb-3">Soil: Tonight's Setting</h3>
        <div className="flex flex-col gap-5 mb-8">
          {SOIL_GROUPS.map(group => (
            <div key={group.key}>
              <p className="font-label-md text-label-md text-on-surface-variant flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>{group.icon}</span>
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.options.map(opt => {
                  const on = soil[group.key] === opt
                  return (
                    <button key={opt} type="button" onClick={() => setSoilValue(group.key, opt)}
                      className="rounded-full border font-label-sm text-label-sm transition-all duration-200"
                      style={{ padding: '8px 16px', background: on ? 'rgba(233,193,118,0.16)' : 'rgba(255,255,255,0.03)', borderColor: on ? 'rgba(233,193,118,0.5)' : 'rgba(255,255,255,0.08)', color: on ? '#e9c176' : 'inherit' }}>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {region && soilComplete && (
          <div className="mb-10 rounded-2xl border border-primary/30" style={{ padding: '20px 24px', background: 'rgba(233,193,118,0.06)' }}>
            <p className="font-label-md text-label-md text-primary uppercase tracking-[0.15em] mb-2">Why This Pairing Works</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{buildPairingExplanation(region, soil)}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleContinue} disabled={!canContinue}
            className="flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 disabled:opacity-40 w-full sm:w-auto"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <button onClick={() => navigate('/smokecraft/format')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height:64,paddingInline:32 }}>
            <span className="material-symbols-outlined">arrow_back</span> Back
          </button>
        </div>
      </main>
    </div>
  )
}
