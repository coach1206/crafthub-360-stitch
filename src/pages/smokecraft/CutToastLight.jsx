import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { getMentorGuidance } from '../../utils/smokecraftMentorTips.js'
import { getVisitProgress } from '../../constants/session.js'
import { ScissorsIcon, FlameIcon, GrillIcon, DropIcon, InsightsIcon, CheckIcon, ArrowForwardIcon, ArrowBackIcon } from '../../components/smokecraft/PremiumIcons.jsx'

const CUT_METHODS = [
  { id: 'straight', label: 'Straight Cut', desc: 'A clean guillotine cut straight across the cap — balanced, the most common choice.' },
  { id: 'v-cut',    label: 'V-Cut',        desc: 'A wedge-shaped notch that concentrates the draw — good for tightly rolled cigars.' },
  { id: 'punch',    label: 'Punch Cut',    desc: 'A small round hole through the cap — slower draw, keeps more of the cap intact.' },
]

const STEPS = [
  { id:'cut',   Icon: ScissorsIcon, label:'Cut the Cap',     desc:'Use your selected cut method — clean, straight across the cap.' },
  { id:'toast', Icon: FlameIcon,    label:'Toast the Foot', desc:'Hold flame 1 inch below the foot. Rotate slowly for 10–15 seconds.' },
  { id:'light', Icon: GrillIcon,    label:'Light Evenly',    desc:'Draw gently while rotating. Ensure the entire foot is lit before tasting.' },
]

const CHECKS = [
  { id: 'drawCheck', Icon: DropIcon,    label: 'Draw Check', desc: 'How freely does the smoke pull through?' },
  { id: 'burnCheck', Icon: FlameIcon,   label: 'Burn Check', desc: 'Is the burn line even all the way around?' },
  { id: 'ashCheck',  Icon: InsightsIcon, label: 'Ash Check',  desc: 'Is the ash holding tight and grey/white, not flaky?' },
]

const XP_BY_COMPLETED_COUNT = { 3: 50, 2: 35, 1: 20, 0: 5 }

export default function CutToastLight() {
  const navigate = useNavigate()
  const { session, completeStep, addXP, setCutToastLightProgress } = useGuestSession()
  const [cutMethod, setCutMethod] = useState(null)
  const [checked, setChecked] = useState(new Set())
  const [drawCheck, setDrawCheck] = useState(0)
  const [burnCheck, setBurnCheck] = useState(0)
  const [ashCheck, setAshCheck] = useState(0)
  const [done, setDone] = useState(false)

  const mentorGuidance = getMentorGuidance(session, 'cut-toast-light')

  function toggle(id) {
    triggerHaptic('light')
    setChecked(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function selectCutMethod(id) {
    triggerHaptic('light')
    setCutMethod(id)
  }

  const ratingFor = { drawCheck: [drawCheck, setDrawCheck], burnCheck: [burnCheck, setBurnCheck], ashCheck: [ashCheck, setAshCheck] }

  const canContinue = Boolean(cutMethod) && checked.size > 0

  function handleContinue() {
    if (done || !canContinue) return
    setDone(true)
    triggerHaptic('medium')
    const stepsCompleted = STEPS.filter(s => checked.has(s.id)).map(s => s.id)
    const completedCount = stepsCompleted.length
    const allStepsCompleted = completedCount === STEPS.length
    setCutToastLightProgress({
      stepsCompleted,
      allStepsCompleted,
      completedCount,
      totalSteps: STEPS.length,
      cutMethod,
      drawCheck: drawCheck || null,
      burnCheck: burnCheck || null,
      ashCheck: ashCheck || null,
      mentorTip: mentorGuidance ? mentorGuidance.tip : null,
      mentorName: mentorGuidance ? mentorGuidance.mentorName : null,
    })
    completeStep('cut-toast-light')
    addXP(XP_BY_COMPLETED_COUNT[completedCount])
    navigate('/smokecraft/first-third')
  }

  const stepProgress = getVisitProgress(session.completedSteps)

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage:"url('/assets/smokecraft/cropped/cut-toast-light-bg.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors flex items-center justify-center" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/request-purchase')} aria-label="Back"><ArrowBackIcon size={24} /></button>
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
          <span>Cut, Toast &amp; Light</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-4" style={{ fontSize:'clamp(26px,4vw,40px)' }}>Cut, Toast &amp; Light</h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6" style={{ maxWidth:560 }}>Complete each preparation step before beginning your tasting.</p>
        <div className="rounded-2xl overflow-hidden mb-10 border border-primary/15" style={{ height: 180 }}>
          <img src="/assets/smokecraft/cropped/cut-toast-light-bg.jpg" alt="Cut, toast and light" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(1.1) brightness(0.85)' }} />
        </div>

        {/* Cut Method */}
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-3">Choose Your Cut Method</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          {CUT_METHODS.map(m => {
            const on = cutMethod === m.id
            return (
              <button key={m.id} type="button" onClick={() => selectCutMethod(m.id)}
                className="sc-tactile text-left rounded-2xl border transition-all duration-300 active:scale-[0.98]"
                style={{
                  padding: 16,
                  background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                  borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.08)',
                }}>
                <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-1 flex items-center gap-2">
                  {on && <CheckIcon size={14} color="#e9c176" />} {m.label}
                </p>
                <p className="font-body-md text-[12px] text-on-surface-variant">{m.desc}</p>
              </button>
            )
          })}
        </div>
        {!cutMethod && (
          <p className="font-label-sm text-[11px] text-on-surface-variant/60 mb-8">Select a cut method to see guidance and unlock the checklist below.</p>
        )}
        {cutMethod && <div className="mb-8" />}

        {/* Toast / Light checklist */}
        <div
          className="flex flex-col gap-3 mb-10 rounded-3xl border border-primary/15 backdrop-blur-xl"
          style={{
            padding: 16,
            background: 'linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 60%, rgba(0,0,0,0.1) 100%)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {STEPS.map(s => {
            const on = checked.has(s.id)
            return (
              <button key={s.id} type="button" onClick={() => toggle(s.id)}
                className="sc-tactile flex items-center gap-5 w-full text-left rounded-2xl border transition-all duration-300 active:scale-[0.98]"
                style={{
                  padding: '24px',
                  background: on ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                  borderColor: on ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.08)',
                  boxShadow: on ? '0 0 0 1px rgba(233,193,118,0.25), 0 8px 28px rgba(233,193,118,0.18)' : 'none',
                }}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: on ? 'rgba(233,193,118,0.15)' : 'rgba(255,255,255,0.05)', color: '#e9c176' }}>
                  <s.Icon size={22} />
                </div>
                <div className="flex-1">
                  <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-1">{s.label}</p>
                  <p className="font-body-md text-body-md text-on-surface-variant">{s.desc}</p>
                </div>
                <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: on ? '#e9c176' : 'rgba(255,255,255,0.2)', background: on ? '#e9c176' : 'transparent' }}>
                  {on && <CheckIcon size={12} color="#131314" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Draw / Burn / Ash checks */}
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-widest mb-3">Quality Checks</p>
        <div className="flex flex-col gap-4 mb-10">
          {CHECKS.map(c => {
            const [value, setValue] = ratingFor[c.id]
            return (
              <div key={c.id} className="rounded-2xl border border-primary/15" style={{ padding: 16, background: 'rgba(255,255,255,0.025)' }}>
                <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-1 flex items-center gap-2"><c.Icon size={18} /> {c.label}</p>
                <p className="font-body-md text-[12px] text-on-surface-variant mb-3">{c.desc}</p>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(v => (
                    <button key={v} type="button" onClick={() => { triggerHaptic('light'); setValue(v) }}
                      className="sc-tactile w-10 h-10 rounded-full border-2 font-label-sm text-label-sm transition-all duration-300 active:scale-90"
                      style={{
                        borderColor: value >= v ? 'rgba(233,193,118,0.55)' : 'rgba(255,255,255,0.2)',
                        background: value >= v ? 'linear-gradient(135deg, rgba(233,193,118,0.14), rgba(233,193,118,0.04))' : 'rgba(255,255,255,0.025)',
                        color: value >= v ? '#e9c176' : 'rgba(255,255,255,0.4)',
                      }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Mentor tip */}
        {mentorGuidance && (
          <div className="rounded-2xl border border-primary/20 mb-10" style={{ padding: 16, background: 'rgba(233,193,118,0.06)' }}>
            <p className="font-label-sm text-[11px] text-primary uppercase tracking-widest mb-1">Mentor Tip — {mentorGuidance.mentorName}{mentorGuidance.mentorCountry ? ` (${mentorGuidance.mentorCountry})` : ''}</p>
            <p className="font-body-md text-[13px] text-on-surface-variant leading-relaxed">{mentorGuidance.tip}</p>
          </div>
        )}
        {!mentorGuidance && (
          <p className="font-label-sm text-[11px] text-on-surface-variant/50 mb-10">No mentor selected yet — mentor tips will appear here once you choose a mentor.</p>
        )}

        <p className="font-label-sm text-label-sm text-on-surface-variant/70 mb-4">
          {checked.size}/{STEPS.length} steps completed{!cutMethod ? ' — choose a cut method to begin' : checked.size === 0 ? ' — complete at least one step to continue' : ''}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button onClick={handleContinue} disabled={!canContinue || done}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300 disabled:opacity-40 w-full sm:w-auto"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Begin Tasting <ArrowForwardIcon size={20} />
          </button>
          <button onClick={() => navigate('/smokecraft/request-purchase')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300 w-full sm:w-auto"
            style={{ height:64,paddingInline:32 }}>
            <ArrowBackIcon size={20} /> Back
          </button>
        </div>
      </main>
    </div>
  )
}
