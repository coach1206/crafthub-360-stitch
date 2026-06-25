import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { LeafIcon, CheckIcon, ArrowForwardIcon, ArrowBackIcon, DeckIcon, GlassIcon, MusicIcon, WeatherIcon, GroupsIcon, MoodIcon, EventIcon, FlaskIcon } from '../../components/smokecraft/PremiumIcons.jsx'
import PairingScorePanel from '../../components/smokecraft/PairingScorePanel.jsx'
import UniqueBlendPanel from '../../components/smokecraft/UniqueBlendPanel.jsx'
import { calculatePairingScore, applyKeptWarningPenalty } from '../../services/smokecraft/smokePairingScoreService.js'
import { createBlendSignature, calculateUniquenessScore } from '../../services/smokecraft/smokeUniquenessService.js'

const REGIONS = [
  {
    id: 'vuelta', name: 'Vuelta Abajo', country: 'Cuba', accent: '#c5a059',
    note: 'The gold standard — silky texture, complex aroma.',
    wrapper: 'Habano Cuban-seed', binder: 'Cuban Criollo', filler: 'Cuban Corojo & Criollo',
    aging: 'Aged 4+ years in cedar', strength: 'Medium-Full',
    craftProfile: 'Hand-rolled by third-generation torcedores using century-old fermentation pits.',
    brandStory: "Vuelta Abajo's red clay soil and humid microclimate have made it the benchmark region tobacco growers worldwide try to imitate.",
  },
  {
    id: 'jalapa', name: 'Jalapa Valley', country: 'Nicaragua', accent: '#8d6b3a',
    note: 'High altitude, bold spice and earth.',
    wrapper: 'Jalapa Habano', binder: 'Nicaraguan Criollo', filler: 'Nicaraguan Ligero & Seco',
    aging: 'Aged 3 years', strength: 'Full',
    craftProfile: 'Grown at high elevation where cool nights slow leaf growth, concentrating oils and spice.',
    brandStory: "Jalapa's volcanic soil and fog-shrouded valley produce some of the most sought-after ligero filler leaf in the world.",
  },
  {
    id: 'esteli', name: 'Estelí', country: 'Nicaragua', accent: '#a8632f',
    note: 'Sun-grown Criollo with intense pepper notes.',
    wrapper: 'Estelí Criollo', binder: 'Nicaraguan Habano', filler: 'Nicaraguan Ligero',
    aging: 'Aged 2-3 years', strength: 'Full',
    craftProfile: 'Sun-grown for maximum strength; leaves are pressed and fermented in stacks called pilones.',
    brandStory: "Known as the tobacco capital of Nicaragua, Estelí's mineral-rich valley soil drives intensity into every leaf.",
  },
  {
    id: 'sanandres', name: 'San Andrés', country: 'Mexico', accent: '#5c4226',
    note: 'Negro Maduro wrapper, dark cocoa and sweet finish.',
    wrapper: 'San Andrés Negro Maduro', binder: 'Mexican Criollo', filler: 'Mexican Criollo & Nicaraguan blend',
    aging: 'Aged 18-24 months', strength: 'Medium',
    craftProfile: 'Volcanic soil deposits give the wrapper its near-black color and natural sweetness.',
    brandStory: "San Andrés Valley's volcanic ash soil, left by the Los Tuxtlas eruptions, produces the rare negro wrapper prized by maduro blenders.",
  },
]

const SOIL_GROUPS = [
  {
    key: 'atmosphere', label: 'Venue Atmosphere', Icon: DeckIcon,
    options: ['Lounge', 'Patio', 'Poolside', 'Private Room'],
  },
  {
    key: 'pairing', label: 'Drink Pairing', Icon: GlassIcon,
    options: ['Whiskey', 'Rum', 'Coffee', 'Red Wine'],
  },
  {
    key: 'food', label: 'Food Pairing', Icon: FlaskIcon,
    options: ['Dark Chocolate', 'Cheese Board', 'Dessert', 'None'],
  },
  {
    key: 'music', label: 'Music Vibe', Icon: MusicIcon,
    options: ['Jazz', 'Acoustic', 'Lo-fi', 'Live Band'],
  },
  {
    key: 'weather', label: 'Weather', Icon: WeatherIcon,
    options: ['Warm Evening', 'Cool Night', 'Rainy', 'Breezy'],
  },
  {
    key: 'social', label: 'Social Setting', Icon: GroupsIcon,
    options: ['Solo', 'Date', 'Group', 'Celebration'],
  },
  {
    key: 'mood', label: 'Your Mood', Icon: MoodIcon,
    options: ['Relaxed', 'Celebratory', 'Reflective', 'Adventurous'],
  },
  {
    key: 'theme', label: 'Event Theme', Icon: EventIcon,
    options: ['Casual', 'Formal', 'Outdoor', 'Anniversary'],
  },
]

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
  const { completeStep, addXP, update, session } = useGuestSession()
  const [selected, setSelected] = useState(null)
  const [soil, setSoil] = useState({})
  const [done, setDone] = useState(false)
  const [warningResolved, setWarningResolved] = useState(null)

  const region = REGIONS.find(r => r.id === selected) || null
  const soilComplete = SOIL_GROUPS.every(g => soil[g.key])
  const canContinue = Boolean(selected) && soilComplete

  const pairingResult = region && soilComplete ? calculatePairingScore({ region, soil }) : null
  const blockedByWarning = Boolean(pairingResult?.warning) && !warningResolved

  const blendSignature = region ? createBlendSignature({
    region, soil,
    format: session?.smokeCraft?.selectedFormat || null,
    mentorId: session?.selectedMentor || null,
  }) : null
  const uniqueness = blendSignature ? calculateUniquenessScore(blendSignature) : null

  function setSoilValue(key, value) {
    triggerHaptic('light')
    setWarningResolved(null)
    setSoil(prev => ({ ...prev, [key]: prev[key] === value ? undefined : value }))
  }

  function logPairingEvent(eventType, payload) {
    update(prev => {
      const existingLog = prev.smokeCraft?.eventLog || []
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          eventLog: [...existingLog, { eventType, timestamp: Date.now(), ...payload }].slice(-50),
        },
      }
    })
  }

  function handleKeepPairing() {
    setWarningResolved('kept')
    triggerHaptic('medium')
    logPairingEvent('SMOKECRAFT_PAIRING_PENALTY_APPLIED', { reason: pairingResult.warning.message })
    logPairingEvent('SMOKECRAFT_POINTS_DEDUCTED', { amount: -50, reason: 'Pairing clash warning ignored' })
    addXP(-50)
  }

  function handleAdjustPairing() {
    setWarningResolved(null)
    triggerHaptic('light')
    setSoil(prev => ({ ...prev, pairing: undefined, food: undefined }))
  }

  function handleAskMentor() {
    setWarningResolved('mentor')
    triggerHaptic('light')
    logPairingEvent('SMOKECRAFT_PAIRING_WARNING_CREATED', { reason: pairingResult.warning.message, resolution: 'ask-mentor' })
  }

  function handleContinue() {
    if (done || !canContinue || blockedByWarning) return
    setDone(true)
    triggerHaptic('medium')
    update(prev => ({
      ...prev,
      smokecraftSeedSoil: { seedRegionId: region.id, soil, pairingExplanation: buildPairingExplanation(region, soil) },
      smokeCraft: {
        ...prev.smokeCraft,
        pairingCombo: { seedRegionId: region.id, ...soil },
        pairingScore: pairingResult.score,
        pairingGrade: pairingResult.grade,
        penalties: warningResolved === 'kept'
          ? [...(prev.smokeCraft?.penalties || []), { reason: 'Pairing clash warning ignored', points: -50, timestamp: Date.now() }]
          : (prev.smokeCraft?.penalties || []),
        uniqueBlendSignature: blendSignature,
        uniquenessScore: uniqueness.score,
        uniquenessCategory: uniqueness.category,
      },
    }))
    logPairingEvent('SMOKECRAFT_PAIRING_COMBO_CREATED', { seedRegionId: region.id, soil })
    logPairingEvent('SMOKECRAFT_PAIRING_SCORE_UPDATED', { score: pairingResult.score, grade: pairingResult.grade })
    logPairingEvent('SMOKECRAFT_UNIQUE_BLEND_SIGNATURE_CREATED', { signature: blendSignature })
    logPairingEvent('SMOKECRAFT_UNIQUENESS_SCORE_UPDATED', { score: uniqueness.score, category: uniqueness.category })
    if (pairingResult.score > 0) addXP(pairingResult.score)
    completeStep('seed-soil')
    addXP(100)
    navigate('/smokecraft/mentor')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      {/* SEED PAIRING CLEAN BG V3 — V2's left-anchored seed-soil-bg.jpg still read flatter and
          less dense than the approved reference at the documented proof viewport (1440x900).
          This pass raises background presence further and compresses vertical rhythm (padding,
          row heights, section margins) across the whole page so the Seed, Soil, Pairing Score,
          and Unique Blend Signature panels are far closer to the reference's first-viewport
          density instead of only showing the Seed region list above the fold. */}
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover" style={{ backgroundImage: "url('/assets/smokecraft/cropped/seed-soil-bg.jpg')", backgroundPosition: 'left center', opacity: 0.8, filter: 'brightness(1.02) saturate(1.35) contrast(1.1)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(90deg,rgba(8,5,3,0.22) 0%,rgba(8,5,3,0.64) 42%,rgba(8,5,3,0.82) 100%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(0deg,rgba(8,5,3,0.92) 0%,rgba(8,5,3,0.24) 18%,rgba(8,5,3,0.24) 82%,rgba(8,5,3,0.92) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-16 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors flex items-center justify-center" style={{ minWidth:40,minHeight:40 }} onClick={() => navigate('/smokecraft/format')} aria-label="Back"><ArrowBackIcon size={20} /></button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight" style={{ fontSize: 18 }}>CraftHub 360</h1>
      </header>
      <main className="relative pt-20 pb-16 px-6 max-w-[1280px] mx-auto">
        <div className="mb-3 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <span>Step 5 of 17</span>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:'29.4%' }} /></div>
          <span>Seed &amp; Soil</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-1">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-2" style={{ fontSize:'clamp(28px,4vw,44px)', fontFamily: '"Playfair Display", Georgia, serif' }}>Seed &amp; Soil Pairing</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-4" style={{ maxWidth:680 }}>Select the tobacco growing region that defines the character of tonight's cigar (the Seed), then tell us about tonight's setting (the Soil) so we can explain why the pairing works.</p>

        <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'minmax(0,1.05fr) minmax(320px,0.95fr)', alignItems: 'start' }}>
        <div
          className="rounded-3xl border border-primary/15 backdrop-blur-xl"
          style={{
            padding: 18,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.12) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
        <h3 className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em] mb-2">Seed: Growing Region</h3>
        <div className="flex flex-col gap-2">
          {REGIONS.map(r => {
            const on = selected === r.id
            return (
              <button key={r.id} type="button" onClick={() => { triggerHaptic('light'); setSelected(r.id) }}
                aria-pressed={on} aria-label={`${r.name}, ${r.country}`}
                className="sc-tactile flex items-center gap-4 w-full text-left rounded-2xl border transition-all duration-300 active:scale-[0.98]"
                style={{
                  padding:'12px 16px', minHeight: 44,
                  borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                  background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                  boxShadow: on ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
                }}>
                <span className="flex items-center justify-center rounded-full shrink-0" style={{ width:38, height:38, background: `${r.accent}26`, border: `1.5px solid ${r.accent}66`, color: r.accent }}>
                  <LeafIcon size={19} />
                </span>
                <div className="flex-1">
                  <p className="font-label-md text-label-md text-on-surface font-semibold">{r.name} <span className="text-primary/60 font-normal">— {r.country}</span></p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant" style={{ marginTop: 2 }}>{r.note}</p>
                </div>
                {on && (
                  <span className="flex items-center justify-center rounded-full shrink-0" style={{ width:18, height:18, background:'#e9c176', color:'#131314' }}>
                    <CheckIcon size={12} />
                  </span>
                )}
              </button>
            )
          })}
        </div>
        </div>

        <div className="rounded-3xl border border-primary/15 backdrop-blur-xl" style={{ padding: '16px 18px', background: 'linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 60%, rgba(0,0,0,0.14) 100%)', boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)', position: 'sticky', top: 84 }}>
          <p className="font-label-md text-label-md text-primary uppercase tracking-[0.15em] mb-2">Seed Profile</p>
          {region ? (
            <>
              <dl className="grid grid-cols-2 gap-2 font-body-sm text-body-sm text-on-surface-variant">
                <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 10 }}>Wrapper</dt><dd>{region.wrapper}</dd></div>
                <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 10 }}>Binder</dt><dd>{region.binder}</dd></div>
                <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 10 }}>Filler</dt><dd>{region.filler}</dd></div>
                <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 10 }}>Aging</dt><dd>{region.aging}</dd></div>
                <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 10 }}>Strength</dt><dd>{region.strength}</dd></div>
                <div><dt className="text-primary/70 uppercase tracking-wide" style={{ fontSize: 10 }}>Craft Profile</dt><dd>{region.craftProfile}</dd></div>
              </dl>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-2" style={{ fontStyle: 'italic' }}>{region.brandStory}</p>
            </>
          ) : (
            <p className="font-body-sm text-body-sm text-on-surface-variant">Select a growing region to see its seed profile here.</p>
          )}
        </div>
        </div>

        <h3 className="font-label-lg text-label-lg text-primary uppercase tracking-[0.2em] mb-2">Soil: Tonight's Setting</h3>
        <div className="rounded-3xl border border-primary/15 backdrop-blur-xl mb-5" style={{ padding: 18, background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)' }}>
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          {SOIL_GROUPS.map(group => (
            <div key={group.key}>
              <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-2 mb-1">
                <span className="text-primary"><group.Icon size={15} /></span>
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map(opt => {
                  const on = soil[group.key] === opt
                  return (
                    <button key={opt} type="button" onClick={() => setSoilValue(group.key, opt)}
                      aria-pressed={on} aria-label={`${group.label}: ${opt}`}
                      className="sc-tactile rounded-full border font-label-sm text-label-sm transition-all duration-300 active:scale-95"
                      style={{
                        padding: '5px 12px', minHeight: 32,
                        borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.15)',
                        background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                        color: on ? '#e9c176' : 'rgba(255,255,255,0.6)',
                        boxShadow: on ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
                      }}>
                      {opt}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
        </div>

        <div className="mb-5 rounded-2xl border border-primary/30 backdrop-blur-xl" style={{ padding: '14px 18px', background: 'linear-gradient(135deg, rgba(233,193,118,0.1), rgba(233,193,118,0.03))', boxShadow: '0 8px 28px rgba(233,193,118,0.12)' }}>
          <p className="font-label-md text-label-md text-primary uppercase tracking-[0.15em] mb-1">Why This Pairing Works</p>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {region && soilComplete
              ? buildPairingExplanation(region, soil)
              : 'Choose a growing region and finish setting tonight’s soil to see why this pairing works.'}
          </p>
        </div>

        {pairingResult ? (
          <PairingScorePanel
            result={pairingResult}
            warningResolved={warningResolved}
            onKeep={handleKeepPairing}
            onAdjust={handleAdjustPairing}
            onAskMentor={handleAskMentor}
          />
        ) : (
          <section className="rounded-2xl border mb-3" style={{ padding: '12px 16px', background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)', borderColor: 'rgba(255,255,255,0.12)' }} aria-label="Pairing Score">
            <p className="font-label-md text-label-md text-primary uppercase tracking-[0.2em] mb-1">Pairing Score</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Complete your seed and soil selections to calculate tonight's pairing score.</p>
          </section>
        )}

        {blendSignature && soilComplete ? (
          <UniqueBlendPanel signature={blendSignature} uniqueness={uniqueness} />
        ) : (
          <section className="rounded-2xl border mb-4" style={{ padding: '12px 16px', background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)', borderColor: 'rgba(255,255,255,0.12)' }} aria-label="Unique Blend Signature">
            <p className="font-label-md text-label-md text-primary uppercase tracking-[0.2em] mb-1">Unique Blend Signature</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Your one-of-a-kind blend signature appears here once your seed and soil pairing is complete.</p>
          </section>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={handleContinue} disabled={!canContinue || blockedByWarning}
            className="flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 disabled:opacity-40 w-full sm:w-auto"
            style={{ height:48,paddingInline:32,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Continue <ArrowForwardIcon size={18} />
          </button>
          <button onClick={() => navigate('/smokecraft/format')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height:48,paddingInline:24 }}>
            <ArrowBackIcon size={18} /> Back
          </button>
        </div>
        <div data-marker="SEED PAIRING CLEAN BG V3" style={{ display: 'none' }} aria-hidden="true" />
      </main>
    </div>
  )
}
