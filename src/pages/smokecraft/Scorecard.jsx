import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { ArrowBackIcon, ArrowForwardIcon } from '../../components/smokecraft/PremiumIcons.jsx'
import AdvancedScorecardPanel from '../../components/smokecraft/AdvancedScorecardPanel.jsx'
import WinnerCriteriaPanel from '../../components/smokecraft/WinnerCriteriaPanel.jsx'
import { calculateWinnerEligibility, assignWinnerCategory, getPendingWinnerCategories, getLockedWinnerCategories, getWinnerProgress } from '../../services/smokecraft/smokeWinnerService.js'

const CATEGORIES = [
  { id:'appearance',   label:'Appearance',   desc:'Wrapper color, sheen, seam quality' },
  { id:'construction', label:'Construction',  desc:'Draw resistance, ash firmness, burn evenness' },
  { id:'flavor',       label:'Flavor',        desc:'Complexity, balance, evolution across thirds' },
  { id:'overall',      label:'Overall',       desc:'Your complete impression of the experience' },
]
const FILL1 = { fontVariationSettings: "'FILL' 1" }

export default function Scorecard() {
  const navigate = useNavigate()
  const { completeStep, addXP, session, update } = useGuestSession()
  const [scores, setScores] = useState({})
  const [done, setDone] = useState(false)
  const loggedEligibilityRef = useRef(false)

  const total = Object.values(scores).reduce((s, v) => s + v, 0)
  const maxTotal = CATEGORIES.length * 10

  function setScore(id, v) { triggerHaptic('light'); setScores(prev => ({ ...prev, [id]: v })) }

  useEffect(() => {
    if (loggedEligibilityRef.current) return
    loggedEligibilityRef.current = true
    const eligibility = calculateWinnerEligibility(session)
    const earned = assignWinnerCategory(session)
    const pending = getPendingWinnerCategories(session)
    const locked = getLockedWinnerCategories(session)
    const progress = getWinnerProgress(session)
    const now = Date.now()

    update(prev => {
      const existingLog = prev.smokeCraft?.eventLog || []
      const events = [{
        type: 'SMOKECRAFT_WINNER_ELIGIBILITY_UPDATED',
        timestamp: now,
        payload: { progress },
      }]
      if (earned) {
        events.push({ type: 'SMOKECRAFT_WINNER_CATEGORY_ASSIGNED', timestamp: now, payload: { categoryId: earned.id, title: earned.title } })
      }
      return {
        ...prev,
        smokeCraft: {
          ...prev.smokeCraft,
          winnerEligibility: eligibility,
          winnerCategory: earned ? earned.id : null,
          winnerProgress: progress,
          pendingWinnerCategories: pending.map(c => c.id),
          lockedWinnerCategories: locked.map(c => c.id),
          earnedWinnerCategories: eligibility.filter(c => c.earned).map(c => c.id),
          eventLog: [...existingLog, ...events].slice(-50),
        },
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleContinue() {
    if (done) return
    setDone(true)
    triggerHaptic('medium')
    completeStep('scorecard')
    addXP(100)
    navigate('/smokecraft/passport-stamp')
  }

  return (
    <div className="bg-background text-on-surface font-body-md overflow-x-hidden min-h-screen">
      <div className="fixed inset-0 -z-20 bg-background overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage:"url('/assets/smokecraft/cropped/scorecard-bg.jpg')" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background:'linear-gradient(0deg,rgba(19,19,20,0.95) 0%,rgba(19,19,20,0.6) 50%,rgba(19,19,20,0.95) 100%)' }} />
      </div>
      <header className="fixed top-0 left-0 w-full z-50 flex items-center px-6 h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/30 shadow-md gap-4">
        <button className="text-primary p-2 rounded-full hover:bg-surface-variant/50 transition-colors flex items-center justify-center" style={{ minWidth:48,minHeight:48 }} onClick={() => navigate('/smokecraft/final-third')} aria-label="Back"><ArrowBackIcon size={24} /></button>
        <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight">CraftHub 360</h1>
      </header>
      <main className="relative pt-28 pb-36 px-6 max-w-[800px] mx-auto">
        <div className="mb-6 flex items-center gap-3 text-primary/70 font-label-sm text-label-sm uppercase tracking-widest">
          <span>Step 12 of 17</span>
          <div className="flex-1 h-1 rounded-full bg-outline-variant/30"><div className="h-full rounded-full bg-primary" style={{ width:'70.6%' }} /></div>
          <span>Scorecard</span>
        </div>
        <p className="font-label-lg text-label-lg text-primary uppercase tracking-[0.25em] mb-3">SmokeCraft 360</p>
        <h2 className="font-headline-md text-on-surface mb-4" style={{ fontSize:'clamp(26px,4vw,40px)' }}>SmokeCraft Scorecard</h2>

        <AdvancedScorecardPanel session={session} />

        <WinnerCriteriaPanel session={session} />

        <button onClick={() => navigate('/smokecraft/event-challenge')}
          className="w-full flex items-center justify-between gap-3 text-left rounded-2xl border border-primary/30 hover:bg-primary/5 active:scale-[0.99] transition-all duration-300 mb-8"
          style={{ padding:'16px 20px', background:'rgba(233,193,118,0.04)' }}>
          <span>
            <span className="block font-label-lg text-label-lg text-primary uppercase tracking-widest mb-1">Event Challenge</span>
            <span className="block font-body-sm text-body-sm text-on-surface-variant">View your active challenge status, winner category progress, and event log.</span>
          </span>
          <ArrowForwardIcon size={20} />
        </button>

        <div className="rounded-2xl border border-outline-variant/30 p-6 mb-8" style={{ background:'rgba(233,193,118,0.04)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="font-label-lg text-label-lg text-primary uppercase tracking-widest">Total Score</span>
            <span className="font-headline-md text-headline-md text-primary">{total}<span className="text-primary/50 font-normal text-lg"> / {maxTotal}</span></span>
          </div>
          <div className="h-2 rounded-full bg-outline-variant/30">
            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: maxTotal ? `${(total/maxTotal)*100}%` : '0%' }} />
          </div>
        </div>

        <div className="flex flex-col gap-5 mb-12">
          {CATEGORIES.map(cat => (
            <div key={cat.id} className="rounded-2xl border border-outline-variant/20 p-5" style={{ background:'rgba(255,255,255,0.02)' }}>
              <p className="font-label-lg text-label-lg text-on-surface font-semibold mb-1">{cat.label}</p>
              <p className="font-body-md text-body-md text-on-surface-variant mb-4">{cat.desc}</p>
              <div className="flex gap-2 flex-wrap">
                {[1,2,3,4,5,6,7,8,9,10].map(v => {
                  const on = (scores[cat.id] || 0) >= v
                  return (
                    <button key={v} onClick={() => setScore(cat.id, v)}
                      className="sc-tactile w-9 h-9 rounded-lg border font-label-lg text-label-lg transition-all duration-200 active:scale-90"
                      style={{ borderColor: on ? '#e9c176' : 'rgba(255,255,255,0.15)', background: on ? 'rgba(233,193,118,0.2)' : 'transparent', color: on ? '#e9c176' : 'rgba(255,255,255,0.4)', fontSize:13 }}>
                      {v}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={handleContinue}
            className="sc-tactile flex items-center justify-center gap-3 font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:40,background:'linear-gradient(135deg,#e9c176,#c5a059)',color:'#131314',boxShadow:'0 4px 20px rgba(233,193,118,0.3)' }}>
            Passport Stamp <ArrowForwardIcon size={20} />
          </button>
          <button onClick={() => navigate('/smokecraft/final-third')}
            className="flex items-center justify-center gap-3 text-primary font-label-lg text-label-lg uppercase tracking-[0.15em] rounded-xl border border-primary/30 hover:bg-primary/10 active:scale-95 transition-all duration-300"
            style={{ height:64,paddingInline:32 }}>
            <ArrowBackIcon size={20} /> Back
          </button>
        </div>
      </main>
    </div>
  )
}
