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

  const [round,           setRound]           = useState(0)
  const [score,           setScore]           = useState(0)
  const [selectedId,      setSelectedId]      = useState(null)
  const [answered,        setAnswered]        = useState(false)
  const [cardMounted,     setCardMounted]     = useState(false)
  const [submitting,      setSubmitting]      = useState(false)

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
    if (answered || submitting) return
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
        // Final round — award session XP/badge/stamp then route to calculating screen
        const finalScore = isCorrect ? score + 1 : score
        const xpAmt      = finalScore === 5 ? 125 : finalScore >= 3 ? 100 : 75

        addXP(xpAmt)
        addBadge({ id: 'botanist', name: 'Botanist Badge', icon: 'nature' })
        if (finalScore === 5) addBadge({ id: 'leaf-scholar', name: 'Leaf Scholar', icon: 'eco' })
        awardStamp('leaf-recognition', 'leaf-challenge')
        completeStep('leaf-challenge')

        // Persist result for the result screen
        sessionStorage.setItem('leafChallengeResult', JSON.stringify({
          score:      finalScore,
          total:      ROUNDS.length,
          xpEarned:   xpAmt,
          badgeEarned: 'Botanist Badge',
          stampEarned: 'Leaf Recognition Stamp',
        }))

        setSubmitting(true)
        setTimeout(() => navigate('/smokecraft/leaf-challenge-calculating'), 600)
      }
    }, 2000)
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }
  const currentRound = ROUNDS[round]

  /* ── CHALLENGE PHASE ────────────────────────────────────── */
  const challengeLeaf    = LEAVES[currentRound.correct]
  const optionLeaves     = currentRound.order.map(id => LEAVES[id])
  const correctId        = currentRound.correct

  return (
    <div
      className="min-h-screen bg-background text-on-surface font-body-md flex flex-col relative overflow-hidden"
      style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-linen.png')" }}
    >
      {/* Submitting overlay — fades in on final answer */}
      {submitting && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(8,5,2,0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 20,
          animation: 'fadeInOverlay 0.5s ease forwards',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#D4AF37', fontVariationSettings: "'FILL' 1", animation: 'leafSpin 1s linear infinite' }}>eco</span>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#D4AF37', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            Recording your result…
          </div>
        </div>
      )}

      {/* Tighter amber spotlight for drama */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{ background: 'radial-gradient(ellipse 50% 55% at 50% 40%, rgba(233,193,118,0.11) 0%, transparent 65%)' }}
      />

      <style>{`
        @keyframes fadeInOverlay { from { opacity: 0 } to { opacity: 1 } }
        @keyframes leafSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
      `}</style>

      {/* Top App Bar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-gutter h-20 bg-surface-container/80 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} className="material-symbols-outlined text-primary p-2 hover:bg-surface-variant/50 transition-colors rounded-full active:scale-95">arrow_back</button>
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
