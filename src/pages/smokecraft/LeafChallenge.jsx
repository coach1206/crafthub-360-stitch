import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'

const LEAVES = {
  'habano-colorado':   { id: 'habano-colorado',   name: 'Habano Colorado',   region: 'Cuba',      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAMxHg5VUIQz2opEFUOvAZaHkGnvXKQ9yDFdsq3RUowHT7ozQeGhkOj4CtmRKiM64Y--LZWrD2SfEqNVNEH5IZUbCwfEJYQpQwwcdMQAeOyCUeYQg-zVwzE-DvSbMRj8Cw_DUs1wIH-vZ_9HgSCJd4UG2wAR0buIJt-vZYQA8hg9avSf8LT23EFKEFs-MFFo7yLtpvTd-wvvXzkeo0sNBrWfsPNQiHid4U8fxXVVtkjV2jsMDW_0AsjU-Q3UH0N9nSdOOHzqSQuD9U' },
  'corojo-rosado':     { id: 'corojo-rosado',     name: 'Corojo Rosado',     region: 'Cuba',      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBxTg65Wt9uZIkpBqyy4dP-yfpAOzZbz2z5ZkV13oVaJ2SAkBidZBFP7grSXlnvgp0rzviZQ5z2QkEdoI5kL1JIAKOIeQwpBh6JQcEGoYgi9hWq5KktjPbu0JFnOgOPJQVxxQ5dzEyYiC6zZsnAzdfCzfC2_n70T7Il7VU5QitXotLyl-tyuOyPD8qOjumx5OXXmnAYMXRe-yumHpuykGEynj_dpEkroC7aiLKuXGRVBObPXsvZ5CI4Og0tcI5Qts4m648an1iWXHk' },
  'criollo-98':        { id: 'criollo-98',        name: "Criollo '98",       region: 'Nicaragua', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-wFKd36V8Kte15q8k8B-07-DyWINrytg3jtB6nOkc55ovBl4NALS6YptCCnVeaf3H0BiZaFZyCPhdpRz6cJuFHWafpHgA0bqZij04ksDjTgbbT5XRZzsSojqvCQVT5O8jsyto4qMMBNy06XdXMxckzv0jbOT8tWEt9Nt1Z6g8UILoCRPg0EX6hSOgzhvRWrHCdvSBENZGQ1W5nkASD5aX019MPiabFOQUvieuxQyNse6-qHGoiBrr39deuAFKC3uxypdFhGZN_8U' },
  'connecticut-shade': { id: 'connecticut-shade', name: 'Connecticut Shade', region: 'USA',       img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBZfnH-MsSB9L3fIvUmuB2jydCCAwvaAMEPJRNZecV6PKAJjHl8HulsTrHI7spXAr_AUXO1qSOOPo_DW4VdixxR-ayV4PnjVm2xiPhwWoFuWAF5PXCEsSlxekHHk-9vi2U4TZZT_qBdTVZ_-asuKsewgotaUAHMpqQqbSTlWGbxa8cyI7OPGMqVK5UT3jPVfaKM9X6uqMaQVfu-wFOCMZ_jY166IMOq2LWncgNMBJG-6FojwRTZejpcpIJ7mK8e1pi_2SjsjN9CTYo' },
  'sumatra-maduro':    { id: 'sumatra-maduro',    name: 'Sumatra Maduro',    region: 'Indonesia', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBktRXv3px18iAdmk-FIbB6ajfhPahwqk9W_JP8Z3CMm5d75I1D5sQYn3y5CtixAGzZo0bWs5yXhZQ8TGcBZxfdlOrRy-X2jzZpEocDLKB-z48LeV4PdnPkWAu1EF0aLxDcp6N-JXmverp_fSYWKdujWH1FrWoLUY1CgVrJguJJeILwvw4JN5SLy70oWxWGRHWFymEXJ3FzmzsY93qIxljsbG1ANTGrbqwoIcmIQ6eUZnCsPhFk08_Z55717Itp90HwmP1ssOO0o' },
  'broadleaf-maduro':  { id: 'broadleaf-maduro',  name: 'Broadleaf Maduro',  region: 'USA',       img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7N47zDRsd9xrna2FHDxZmmuHa9zMDEUx9pMH9OCchjzHa3TdmwiSK8rUNWCu3tQGc-DAewn13cJY0epAJPIuDmMkZDOxrSVbOlyqVToXKvvjL6eG_DDV4N_NgC9R-umyF3Ju6St0MmAbi63vwiC983oWNNS-xjiFcTNM2U0WpVcTXm-UZIbkyIPsqPC1U2cXP_tBIdctZFXNXkmSZml4JE2zbuDf4hyFSqmaSAAOlPQFZcXaAVWIcu0KFWBuNqFEsHk7jQouxUVY' },
}

// 5 rounds: correct leaf + 3 distractors (display order pre-shuffled so correct isn't always first)
const ROUNDS = [
  { correct: 'habano-colorado',   order: ['connecticut-shade', 'habano-colorado', 'sumatra-maduro',    'criollo-98']      },
  { correct: 'criollo-98',        order: ['criollo-98',        'broadleaf-maduro', 'corojo-rosado',     'sumatra-maduro']  },
  { correct: 'connecticut-shade', order: ['sumatra-maduro',    'criollo-98',       'connecticut-shade', 'corojo-rosado']   },
  { correct: 'sumatra-maduro',    order: ['habano-colorado',   'sumatra-maduro',   'connecticut-shade', 'broadleaf-maduro']},
  { correct: 'corojo-rosado',     order: ['criollo-98',        'connecticut-shade', 'broadleaf-maduro',  'corojo-rosado']  },
]

function getResultsData(score) {
  if (score === 5) return { headline: 'Perfect Palate',     sub: 'You identified every leaf without hesitation. The mark of a true Connoisseur.',         xp: 125, perfect: true  }
  if (score >= 3) return { headline: 'Sharp Eye',           sub: 'A strong result. Your botanical instincts are developing into genuine expertise.',        xp: 100, perfect: false }
  if (score >= 1) return { headline: 'A Learning Journey',  sub: 'Every expert started here. Return to the study session anytime to sharpen your eye.',     xp: 75,  perfect: false }
  return              { headline: 'Keep Studying',           sub: 'The leaves will reveal themselves with time. Review the Leaf Education and try again.',   xp: 75,  perfect: false }
}

export default function LeafChallenge() {
  const navigate = useNavigate()
  const { addXP, addBadge, awardStamp, completeStep } = useGuestSession()
  const timerRef = useRef(null)

  const [phase,           setPhase]           = useState('challenge')  // 'challenge' | 'results'
  const [round,           setRound]           = useState(0)
  const [score,           setScore]           = useState(0)
  const [selectedId,      setSelectedId]      = useState(null)
  const [answered,        setAnswered]        = useState(false)
  const [cardMounted,     setCardMounted]     = useState(false)
  const [resultsMounted,  setResultsMounted]  = useState(false)
  const [claimed,         setClaimed]         = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setCardMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  // Re-animate card on each new round
  useEffect(() => {
    if (phase !== 'challenge') return
    setCardMounted(false)
    const t = setTimeout(() => setCardMounted(true), 60)
    return () => clearTimeout(t)
  }, [round])

  function handleAnswer(leafId) {
    if (answered) return
    const currentRound = ROUNDS[round]
    const isCorrect    = leafId === currentRound.correct

    setSelectedId(leafId)
    setAnswered(true)
    if (isCorrect) setScore(s => s + 1)

    timerRef.current = setTimeout(() => {
      if (round < 4) {
        setSelectedId(null)
        setAnswered(false)
        setRound(r => r + 1)
      } else {
        const finalScore = isCorrect ? score + 1 : score
        setPhase('results')
        setTimeout(() => setResultsMounted(true), 120)
        // Award here using finalScore directly
        const xpAmt = finalScore === 5 ? 125 : finalScore >= 3 ? 100 : 75
        addXP(xpAmt)
        addBadge({ id: 'botanist', name: 'Botanist', icon: 'nature' })
        if (finalScore === 5) {
          addBadge({ id: 'leaf-scholar', name: 'Leaf Scholar', icon: 'eco' })
        }
        awardStamp('leaf-recognition', 'leaf-challenge')
        completeStep('leaf-challenge')
      }
    }, 2000)
  }

  function handleContinue() {
    if (claimed) return
    setClaimed(true)
    setTimeout(() => navigate('/smokecraft/cultivation'), 400)
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }
  const currentRound = ROUNDS[round]

  /* ── RESULTS PHASE ──────────────────────────────────────── */
  if (phase === 'results') {
    const { headline, sub, xp, perfect } = getResultsData(score)
    const dashOffset = Math.round(553 * (1 - score / 5))

    return (
      <div className="min-h-screen bg-background text-on-surface font-body-md flex flex-col items-center justify-center px-gutter py-16 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="fixed inset-0 pointer-events-none -z-10"
          style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(233,193,118,0.07) 0%, transparent 70%)' }}
        />

        {/* Perfect score ring pulse */}
        {perfect && (
          <div className="fixed inset-0 pointer-events-none -z-10 flex items-center justify-center">
            <div className="w-96 h-96 rounded-full border border-primary/20 animate-ping-gold" />
          </div>
        )}

        <div
          className={`w-full max-w-xl text-center transition-all duration-700 ease-out ${resultsMounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        >
          {/* Score Gauge */}
          <div className="relative w-44 h-44 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192">
              <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <circle
                cx="96" cy="96" r="88"
                fill="none"
                stroke="#e9c176"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray="553"
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', filter: perfect ? 'drop-shadow(0 0 8px rgba(233,193,118,0.6))' : 'none' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span
                className="text-primary font-bold"
                style={{ fontFamily: '"Playfair Display", serif', fontSize: '40px', lineHeight: 1 }}
              >
                {score}<span className="text-[22px] text-primary/60">/{ROUNDS.length}</span>
              </span>
              <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-[0.2em] mt-1">Score</span>
            </div>
          </div>

          {/* Headline */}
          <h2
            className={`mb-3 ${perfect ? 'text-primary' : 'text-on-surface'}`}
            style={{ fontFamily: '"Playfair Display", serif', fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 600, lineHeight: 1.2 }}
          >
            {headline}
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed mb-10 max-w-md mx-auto">
            {sub}
          </p>

          {/* Awards earned */}
          <div className="glass-panel rounded-2xl p-6 titanium-border mb-8 text-left space-y-4">
            <p className="font-label-sm text-[11px] text-primary uppercase tracking-[0.2em] mb-4">Awards Earned This Round</p>

            {/* XP */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]" style={FILL1}>stars</span>
              </div>
              <div>
                <p className="font-label-lg text-label-lg text-primary">+{xp} XP</p>
                <p className="font-label-sm text-[11px] text-on-surface-variant">
                  {score === 5 ? 'Perfect score bonus' : score >= 3 ? 'Strong performance' : 'Participation award'}
                </p>
              </div>
            </div>

            {/* Leaf Scholar (perfect only) */}
            {perfect && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/30">
                  <span className="material-symbols-outlined text-primary text-[18px]" style={FILL1}>eco</span>
                </div>
                <div>
                  <p className="font-label-lg text-label-lg text-primary">Leaf Scholar Badge</p>
                  <p className="font-label-sm text-[11px] text-on-surface-variant">Awarded for a perfect 5/5 identification</p>
                </div>
              </div>
            )}

            {/* Botanist (always) */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">nature</span>
              </div>
              <div>
                <p className="font-label-lg text-label-lg text-on-surface">Botanist Badge</p>
                <p className="font-label-sm text-[11px] text-on-surface-variant">Awarded for completing the challenge</p>
              </div>
            </div>

            {/* Stamp */}
            <div className="flex items-center gap-4 pt-2 border-t border-outline-variant/20">
              <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-[18px]" style={FILL1}>approval</span>
              </div>
              <div>
                <p className="font-label-lg text-label-lg text-primary">Leaf Recognition Stamp</p>
                <p className="font-label-sm text-[11px] text-on-surface-variant">Added to your SmokeCraft Passport</p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleContinue}
            disabled={claimed}
            className="group relative w-full py-5 rounded-xl gold-foil overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(233,193,118,0.35)] active:scale-[0.98] disabled:opacity-60"
          >
            <div className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <div className="relative flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-on-primary" style={FILL1}>
                {claimed ? 'check_circle' : 'arrow_forward'}
              </span>
              <span className="font-headline-md text-headline-md text-on-primary font-bold tracking-tight">
                {claimed ? 'Continuing…' : 'Continue to Cultivation'}
              </span>
            </div>
          </button>
        </div>
      </div>
    )
  }

  /* ── CHALLENGE PHASE ────────────────────────────────────── */
  const challengeLeaf    = LEAVES[currentRound.correct]
  const optionLeaves     = currentRound.order.map(id => LEAVES[id])
  const correctId        = currentRound.correct

  return (
    <div
      className="min-h-screen bg-background text-on-surface font-body-md flex flex-col relative overflow-hidden"
      style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-linen.png')" }}
    >
      {/* Tighter amber spotlight for drama */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{ background: 'radial-gradient(ellipse 50% 55% at 50% 40%, rgba(233,193,118,0.11) 0%, transparent 65%)' }}
      />

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shield_person</span>
          <h1 className="font-headline-md text-headline-md font-bold text-primary tracking-tight" style={{ fontSize: '18px' }}>CraftHub 360</h1>
        </div>

        {/* Round + Score pill */}
        <div className="glass-panel px-5 py-2 rounded-full titanium-border flex items-center gap-4">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Round <span className="text-primary font-bold">{round + 1}</span> of {ROUNDS.length}
          </span>
          <div className="w-px h-4 bg-outline-variant/40" />
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
            Score <span className="text-primary font-bold">{score}</span>
          </span>
        </div>

        <div className="w-9 h-9 rounded-full border border-primary/30 overflow-hidden">
          <img
            alt="Member"
            className="w-full h-full object-cover"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCq4_EpkSpYVcHVlVxnKXJacUbdRmQWEovF-KvyMHM6dJqnGjPivNcRVqPojva00dcFw-6BVVfhI1gFLcaSclOfplLXr3i6MUVX4P-hkoIEfJTKgiHqRbMzmwdN_3t5yChLEGMio7Do167r-rCSqyVByUbYjQFGK9oISPUctIdJqwIGb-QKw2h3XuvSYjbpmyaRpt-JnoQzW41fw_DgeBRzjFoBukHh9bttmrZSUbJTEq5nRcpGZ410InFTORhNwgbrVX3N9_MH0Bo"
          />
        </div>
      </header>

      {/* Challenge Stage */}
      <main className="flex-1 flex items-center justify-center pt-24 pb-16 px-gutter">
        <div
          className={`w-full max-w-2xl transition-all duration-500 ease-out ${cardMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          {/* Leaf Image Card */}
          <div className="glass-card rounded-2xl overflow-hidden mb-6 shadow-2xl" style={{ border: '1px solid rgba(233,193,118,0.12)' }}>
            {/* Image */}
            <div className="relative h-64 sm:h-72 overflow-hidden">
              <img
                src={challengeLeaf.img}
                alt=""
                className="w-full h-full object-cover"
              />
              {/* Dark gradient + challenge overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-high/90 via-transparent to-surface-container-high/30" />
              {/* Blur vignette to obscure identifying text on image */}
              <div className="absolute inset-0" style={{ backdropFilter: 'none' }} />

              {/* Round badge */}
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 bg-background/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary text-[14px]">eco</span>
                  <span className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-wider">
                    Leaf {round + 1}
                  </span>
                </div>
              </div>

              {/* Answered feedback overlay */}
              {answered && (
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ background: selectedId === correctId ? 'rgba(74,222,128,0.12)' : 'rgba(255,180,171,0.12)' }}
                >
                  <div className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl backdrop-blur-md ${selectedId === correctId ? 'bg-accent-success/10 border border-accent-success/30' : 'bg-error/10 border border-error/30'}`}>
                    <span
                      className="material-symbols-outlined text-5xl"
                      style={{ ...(selectedId === correctId ? { color: '#4ade80' } : { color: '#ffb4ab' }), fontVariationSettings: "'FILL' 1" }}
                    >
                      {selectedId === correctId ? 'check_circle' : 'cancel'}
                    </span>
                    <p className="font-label-lg text-label-lg font-bold" style={{ color: selectedId === correctId ? '#4ade80' : '#ffb4ab' }}>
                      {selectedId === correctId ? 'Correct!' : 'Not Quite'}
                    </p>
                    {selectedId !== correctId && (
                      <p className="font-label-sm text-[11px] text-on-surface-variant">
                        This was <span className="text-primary">{challengeLeaf.name}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Question */}
            <div className="px-6 py-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary/50 text-[18px]">help_outline</span>
              <p
                className="text-on-surface-variant"
                style={{ fontFamily: '"Playfair Display", serif', fontSize: '18px', fontStyle: 'italic' }}
              >
                Which tobacco leaf is this?
              </p>
            </div>
          </div>

          {/* Answer Grid */}
          <div className="grid grid-cols-2 gap-4">
            {optionLeaves.map(leaf => {
              const isSelected  = selectedId === leaf.id
              const isCorrect   = leaf.id === correctId
              const showCorrect = answered && isCorrect
              const showWrong   = answered && isSelected && !isCorrect

              return (
                <button
                  key={leaf.id}
                  onClick={() => handleAnswer(leaf.id)}
                  disabled={answered}
                  className={`
                    relative glass-card rounded-xl p-5 text-left transition-all duration-300 disabled:cursor-default
                    ${!answered ? 'hover:scale-[1.02] hover:border-primary/40 active:scale-[0.98]' : ''}
                    ${showCorrect ? 'ring-2 ring-accent-success' : ''}
                    ${showWrong   ? 'ring-2 ring-error'          : ''}
                  `}
                  style={{
                    background: showCorrect
                      ? 'rgba(74,222,128,0.08)'
                      : showWrong
                        ? 'rgba(255,180,171,0.08)'
                        : undefined,
                  }}
                >
                  {/* Correct tick */}
                  {showCorrect && (
                    <span
                      className="absolute top-3 right-3 material-symbols-outlined text-[18px]"
                      style={{ color: '#4ade80', fontVariationSettings: "'FILL' 1" }}
                    >
                      check_circle
                    </span>
                  )}
                  {/* Wrong X */}
                  {showWrong && (
                    <span
                      className="absolute top-3 right-3 material-symbols-outlined text-[18px]"
                      style={{ color: '#ffb4ab', fontVariationSettings: "'FILL' 1" }}
                    >
                      cancel
                    </span>
                  )}

                  <div className="flex items-start gap-3">
                    {/* Leaf thumbnail */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant/20">
                      <img src={leaf.img} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p
                        className={`leading-tight mb-1 transition-colors ${showCorrect ? 'text-accent-success' : showWrong ? 'text-error' : 'text-on-surface'}`}
                        style={{ fontFamily: '"Playfair Display", serif', fontSize: '15px', fontWeight: 500 }}
                      >
                        {leaf.name}
                      </p>
                      <p className="font-label-sm text-[11px] text-on-surface-variant uppercase tracking-widest">{leaf.region}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Round progress dots */}
          <div className="flex justify-center gap-2 mt-8">
            {ROUNDS.map((_, i) => (
              <div
                key={i}
                className="transition-all duration-300"
                style={{
                  width:        i === round ? '24px' : '8px',
                  height:       '8px',
                  borderRadius: '4px',
                  background:   i < round ? '#e9c176' : i === round ? '#e9c176' : 'rgba(255,255,255,0.15)',
                }}
              />
            ))}
          </div>

        </div>
      </main>
    </div>
  )
}
