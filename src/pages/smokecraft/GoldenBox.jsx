import { useState, useEffect } from 'react'
import { smokeCraftAssets } from '../../data/smokecraftAssets.js'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const PHASES = [
  { label: 'Mentor',      icon: 'person'         },
  { label: 'Origins',     icon: 'travel_explore' },
  { label: 'Cultivation', icon: 'nature_people'  },
  { label: 'Blending',    icon: 'science'        },
  { label: 'Identity',    icon: 'diamond'        },
]

const CONTENTS = [
  { icon: 'inventory_2',       label: 'Personalized Vitola Profile',  desc: 'A curated cigar profile built from your flavor DNA and blend choices.'    },
  { icon: 'approval',          label: 'Journey Stamp Collection',     desc: 'Every stamp earned across your SmokeCraft sessions, archived in your Passport.' },
  { icon: 'id_card',           label: 'Cigar Identity Card',          desc: 'A shareable credential revealing your archetype — Diplomat, Scholar, Adventurer, or Señor.' },
  { icon: 'workspace_premium', label: 'Exclusive Lounge Privileges',  desc: 'Priority access, premium humidor reservations, and private sommelier sessions.' },
]

function GoldenBoxHeroImage({ memberName }) {
  const [failed, setFailed] = useState(false)
  if (!failed) {
    return (
      <img
        src={smokeCraftAssets.goldenBoxHero}
        alt="Golden Box"
        onError={() => setFailed(true)}
        style={{ maxWidth: 480, width: '100%', height: 'auto', display: 'block', margin: '0 auto' }}
      />
    )
  }
  return <GoldenTreasureBox memberName={memberName} />
}

function GoldenTreasureBox({ memberName = 'Julian Sterling' }) {
  return (
    <div className="golden-box-stage" aria-hidden="true">
      <div className="golden-box-rays" />
      <div className="golden-box-smoke golden-box-smoke-left" />
      <div className="golden-box-smoke golden-box-smoke-right" />
      <div className="golden-box-table-glow" />

      <div className="mahogany-humidor">
        <div className="mahogany-humidor-lid">
          <div className="mahogany-lid-interior">
            <div className="mahogany-brand-mark">
              <span className="material-symbols-outlined">shield_person</span>
              <strong>CRAFTHUB 360</strong>
              <small>Private SmokeCraft Reserve</small>
            </div>
          </div>
          <span className="mahogany-hinge mahogany-hinge-left" />
          <span className="mahogany-hinge mahogany-hinge-right" />
        </div>

        <div className="mahogany-humidor-tray">
          <div className="mahogany-cigar-bed">
            {Array.from({ length: 8 }, (_, index) => (
              <span key={index} className={`mahogany-cigar mahogany-cigar-${index + 1}`}>
                <i />
              </span>
            ))}
          </div>
          <div className="mahogany-humidor-front">
            <div className="mahogany-nameplate">
              <small>Reserved For</small>
              <strong>{memberName}</strong>
            </div>
            <div className="mahogany-lock">
              <span className="mahogany-keyhole" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GoldenBox() {
  const navigate = useNavigate()
  const { session, addXP, addBadge, completeStep } = useGuestSession()

  const [revealed, setRevealed]         = useState(false)
  const [contentsOpen, setContentsOpen] = useState(false)
  const [accepted, setAccepted]         = useState(false)
  const displayName = session?.profile?.nickname || session?.profile?.firstName || session?.leaderboard?.displayName || 'Julian Sterling'

  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 120)
    return () => clearTimeout(t)
  }, [])

  function handleAccept() {
    if (accepted) return
    setAccepted(true)
    triggerHaptic('success')
    addXP(25)
    addBadge({ id: 'golden-box-invitation', name: 'Golden Invitation', icon: 'inventory_2' })
    completeStep('golden-box')
    setTimeout(() => navigate('/smokecraft/humidor-match'), 600)
  }

  const FILL1 = { fontVariationSettings: "'FILL' 1" }

  return (
    <div className="golden-box-page min-h-screen text-on-surface font-body-md overflow-hidden flex flex-col items-center relative">

      {/* ── Atmospheric Background ───────────────────────────── */}
      <div className="fixed inset-0 -z-10 golden-box-bg">
        <div className="golden-box-lounge-silhouette" />
        <div className="golden-box-bg-vignette" />
      </div>

      {/* ── Amber Spotlight ──────────────────────────────────── */}
      <div className="fixed inset-0 -z-10 pointer-events-none golden-box-ambient" />

      {/* ── Ambient Smoke Wisps ──────────────────────────────── */}
      <div className="fixed top-8 left-[8%] w-[520px] h-[420px] -z-10 pointer-events-none animated-smoke golden-box-page-smoke" />
      <div className="fixed bottom-0 right-[7%] w-[500px] h-[420px] -z-10 pointer-events-none animated-smoke golden-box-page-smoke golden-box-page-smoke-alt" />

      {/* ── Minimal Header ───────────────────────────────────── */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin h-20">
        <div className="flex items-center gap-3">
          <button
            className="material-symbols-outlined text-primary p-2 rounded-full hover:bg-primary/10 active:bg-primary/20 transition-colors duration-300"
            style={{ minWidth: 48, minHeight: 48 }}
            onClick={() => navigate('/smokecraft/mentor')}
            aria-label="Back to Mentor Selection"
          >arrow_back</button>
          <span className="material-symbols-outlined text-primary text-[22px]" style={FILL1}>shield_person</span>
          <span className="font-headline-md text-[18px] font-bold text-primary tracking-tighter">CRAFTHUB 360</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="font-label-lg text-label-lg text-primary leading-none">Julian Sterling</p>
            <p className="text-[10px] text-on-surface-variant uppercase tracking-[0.15em] mt-0.5">SmokeCraft Session</p>
          </div>
          <div className="w-9 h-9 rounded-full border border-primary/30 overflow-hidden">
            <img
              alt="Member"
              className="w-full h-full object-cover"
              src="/passport.jpg"
            />
          </div>
        </div>
      </header>

      {/* ── Main Stage ───────────────────────────────────────── */}
      <main className="w-full max-w-[1080px] mx-auto px-gutter flex flex-col items-center text-center gap-7 pt-24 pb-16">

        {/* Box Illustration */}
        <div
          className={`transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '0ms' }}
        >
          <GoldenBoxHeroImage memberName={displayName} />
        </div>

        {/* Headline Block */}
        <div
          className={`space-y-4 transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '200ms' }}
        >
          <p className="golden-box-kicker font-label-lg text-label-lg text-primary/80 uppercase tracking-[0.35em]">A Promise of Craft</p>
          <h1 className="golden-box-title font-headline-xl text-headline-xl text-on-surface" style={{ fontFamily: '"Playfair Display", serif' }}>
            Your Golden Box Awaits
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-[560px] mx-auto leading-relaxed">
            Inside is a reward curated entirely around you — your palate, your story, your craft. Complete the SmokeCraft journey to earn the right to open it.
          </p>
        </div>

        {/* 5-Phase Lock Tracker */}
        <div
          className={`w-full transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '380ms' }}
        >
          <p className="font-label-sm text-label-sm text-primary/80 uppercase tracking-[0.24em] mb-5">Five Phases to Unlock</p>
          <div className="golden-phase-track">
            {PHASES.map(({ label, icon }, index) => (
              <div key={label} className="golden-phase-item group">
                <div className="golden-phase-orb">
                  <span className="material-symbols-outlined text-[24px] text-primary">{icon}</span>
                </div>
                <span className="golden-phase-number">{index + 1}</span>
                <span className="golden-phase-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What's Inside Accordion */}
        <div
          className={`w-full transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '520ms' }}
        >
          <button
            onClick={() => setContentsOpen(o => !o)}
            className="flex items-center gap-2 mx-auto text-primary/80 hover:text-primary transition-colors font-label-sm text-label-sm uppercase tracking-[0.15em]"
          >
            <span className="material-symbols-outlined text-[16px]">{contentsOpen ? 'expand_less' : 'expand_more'}</span>
            {"What's inside?"}
          </button>
          <div
            className="overflow-hidden transition-all duration-500 ease-in-out"
            style={{ maxHeight: contentsOpen ? '360px' : '0px', opacity: contentsOpen ? 1 : 0 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 text-left">
              {CONTENTS.map(({ icon, label, desc }) => (
                <div key={label} className="golden-content-card p-4 rounded-xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-primary text-[18px]" style={FILL1}>{icon}</span>
                  </div>
                  <div>
                    <p className="font-label-lg text-label-lg text-primary mb-0.5">{label}</p>
                    <p className="font-label-sm text-[11px] text-on-surface-variant leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className={`w-full space-y-4 transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{ transitionDelay: '640ms' }}
        >
          <button
            onClick={handleAccept}
            disabled={accepted}
            className="w-full group relative py-5 px-8 rounded-xl gold-foil overflow-hidden transition-all duration-300 hover:shadow-[0_0_50px_rgba(233,193,118,0.35)] active:scale-[0.98] disabled:opacity-60"
          >
            <div className="absolute inset-0 bg-white/15 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            <div className="relative flex items-center justify-center gap-3">
              <span className="material-symbols-outlined text-on-primary" style={FILL1}>
                {accepted ? 'check_circle' : 'inventory_2'}
              </span>
              <span className="font-headline-md text-headline-md text-on-primary font-bold tracking-tight">
                {accepted ? 'Challenge Accepted' : 'Accept the Challenge'}
              </span>
            </div>
          </button>
          <p className="font-label-sm text-[11px] text-on-surface-variant/50">
            +25 XP · Golden Invitation Badge · Unlocks the SmokeCraft Journey
          </p>
        </div>

      </main>
      <style>{`
        .golden-box-page {
          min-height: max(820px, 100dvh);
          background: #030201;
        }

        .golden-box-bg {
          background:
            radial-gradient(ellipse at 50% 10%, rgba(255,207,99,0.42) 0%, rgba(177,101,18,0.18) 28%, transparent 58%),
            radial-gradient(ellipse at 12% 58%, rgba(167,92,32,0.26) 0%, rgba(44,20,6,0.28) 24%, transparent 40%),
            radial-gradient(ellipse at 88% 50%, rgba(255,205,113,0.2) 0%, rgba(48,23,8,0.32) 22%, transparent 38%),
            linear-gradient(180deg, rgba(28,12,3,0.9) 0%, rgba(8,4,2,0.94) 74%, #020101 100%),
            url(/background-lounge-airy.jpg);
          background-size: cover;
          background-position: center;
          filter: saturate(1.16) contrast(1.1) brightness(0.88);
        }

        .golden-box-lounge-silhouette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 13% 70%, rgba(117,55,18,0.38) 0%, rgba(20,9,4,0.24) 22%, transparent 36%),
            radial-gradient(ellipse at 86% 66%, rgba(178,94,28,0.32) 0%, rgba(20,9,4,0.34) 22%, transparent 36%),
            radial-gradient(ellipse at 94% 12%, rgba(223,164,67,0.2) 0%, transparent 25%),
            linear-gradient(90deg, rgba(0,0,0,0.62), transparent 26%, transparent 72%, rgba(0,0,0,0.68));
          opacity: 0.95;
        }

        .golden-box-bg-vignette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 50% 34%, transparent 0%, rgba(0,0,0,0.16) 50%, rgba(0,0,0,0.78) 100%),
            linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.18) 42%, rgba(0,0,0,0.78) 100%);
        }

        .golden-box-ambient {
          background:
            conic-gradient(from 178deg at 50% 0%, transparent 0deg, rgba(255,217,111,0.12) 12deg, transparent 26deg, rgba(255,192,70,0.12) 38deg, transparent 54deg),
            radial-gradient(ellipse 44% 34% at 50% 18%, rgba(255,219,120,0.42), transparent 64%),
            radial-gradient(ellipse 62% 48% at 50% 60%, rgba(151,77,18,0.28), transparent 72%);
        }

        .golden-box-page-smoke {
          background:
            radial-gradient(ellipse at 35% 40%, rgba(255,255,255,0.12), transparent 24%),
            radial-gradient(ellipse at 62% 54%, rgba(233,193,118,0.08), transparent 42%);
          filter: blur(18px);
          opacity: 0.56;
        }

        .golden-box-page-smoke-alt {
          opacity: 0.48;
          animation-delay: -7s;
        }

        .golden-box-stage {
          position: relative;
          width: min(820px, 94vw);
          height: clamp(330px, 43vw, 500px);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0;
          isolation: isolate;
        }

        .golden-box-rays {
          position: absolute;
          top: -22%;
          left: 50%;
          width: 72%;
          height: 86%;
          transform: translateX(-50%);
          background:
            conic-gradient(from 160deg at 50% 0%, transparent 0deg, rgba(255,229,134,0.24) 14deg, transparent 28deg, rgba(255,204,76,0.18) 40deg, transparent 56deg),
            radial-gradient(ellipse at 50% 0%, rgba(255,243,184,0.58), transparent 58%);
          filter: blur(1px);
          opacity: 0.86;
          mix-blend-mode: screen;
          z-index: 0;
        }

        .golden-box-smoke {
          position: absolute;
          width: 44%;
          height: 50%;
          top: 28%;
          background:
            radial-gradient(ellipse at 30% 48%, rgba(255,255,255,0.13), transparent 28%),
            radial-gradient(ellipse at 65% 34%, rgba(233,193,118,0.09), transparent 36%);
          filter: blur(14px);
          opacity: 0.62;
          z-index: 1;
        }

        .golden-box-smoke-left {
          left: 0;
        }

        .golden-box-smoke-right {
          right: 0;
          transform: scaleX(-1);
        }

        .golden-box-table-glow {
          position: absolute;
          bottom: 13%;
          left: 50%;
          width: 84%;
          height: 22%;
          transform: translateX(-50%);
          border-radius: 999px;
          background: radial-gradient(ellipse at center, rgba(255,190,70,0.42), rgba(118,62,14,0.18) 42%, transparent 72%);
          filter: blur(13px);
          z-index: 1;
        }

        .mahogany-humidor {
          position: relative;
          width: clamp(330px, 72vw, 720px);
          height: clamp(260px, 39vw, 430px);
          transform: perspective(980px) rotateX(2deg);
          filter: drop-shadow(0 42px 48px rgba(0,0,0,0.76)) drop-shadow(0 0 58px rgba(255,177,60,0.22));
          z-index: 3;
        }

        .mahogany-humidor-lid {
          position: absolute;
          left: 8%;
          top: 2%;
          width: 84%;
          height: 48%;
          transform: perspective(900px) rotateX(58deg) translateY(-18%);
          transform-origin: bottom center;
          border-radius: 13px 13px 4px 4px;
          border: 2px solid rgba(243,189,85,0.78);
          background:
            linear-gradient(105deg, rgba(255,255,255,0.16), transparent 18%, rgba(255,220,128,0.1) 50%, transparent 82%),
            repeating-linear-gradient(92deg, rgba(255,225,159,0.08) 0 2px, transparent 2px 28px),
            linear-gradient(135deg, #6f2d0d 0%, #321004 34%, #8a4316 62%, #260b03 100%);
          box-shadow:
            inset 0 2px 0 rgba(255,232,164,0.34),
            inset 0 -22px 38px rgba(16,5,1,0.6),
            0 0 42px rgba(255,177,60,0.2);
          overflow: hidden;
        }

        .mahogany-lid-interior {
          position: absolute;
          inset: 8% 8% 15%;
          border-radius: 10px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,220,127,0.36);
          background:
            radial-gradient(circle at 50% 36%, rgba(255,201,82,0.16), transparent 32%),
            repeating-linear-gradient(0deg, rgba(255,218,143,0.07) 0 2px, transparent 2px 22px),
            linear-gradient(135deg, #441708, #1a0803 58%, #5d260b);
        }

        .mahogany-brand-mark {
          display: grid;
          place-items: center;
          gap: 5px;
          color: #f2d184;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          text-shadow: 0 0 16px rgba(242,209,132,0.36);
        }

        .mahogany-brand-mark .material-symbols-outlined {
          font-size: 34px;
          color: #f2d184;
        }

        .mahogany-brand-mark strong {
          font-family: "Playfair Display", serif;
          font-size: clamp(18px, 2.1vw, 28px);
        }

        .mahogany-brand-mark small {
          font-family: "JetBrains Mono", monospace;
          font-size: clamp(8px, 1vw, 11px);
          color: rgba(242,209,132,0.74);
        }

        .mahogany-hinge {
          position: absolute;
          bottom: -5px;
          width: 64px;
          height: 12px;
          border-radius: 999px;
          background: linear-gradient(90deg, #6a350a, #ffe18a, #b36d17, #4b2105);
          border: 1px solid rgba(255,226,138,0.74);
          box-shadow: 0 0 14px rgba(255,196,73,0.32);
        }

        .mahogany-hinge-left { left: 17%; }
        .mahogany-hinge-right { right: 17%; }

        .mahogany-humidor-tray {
          position: absolute;
          left: 3%;
          right: 3%;
          bottom: 1%;
          height: 60%;
          transform: perspective(780px) rotateX(-5deg);
        }

        .mahogany-cigar-bed {
          position: absolute;
          left: 7%;
          right: 7%;
          top: 0;
          height: 55%;
          border-radius: 12px 12px 3px 3px;
          border: 1px solid rgba(243,189,85,0.42);
          background:
            radial-gradient(ellipse at 50% 5%, rgba(255,224,138,0.18), transparent 42%),
            linear-gradient(180deg, rgba(28,9,2,0.42), rgba(7,2,1,0.7)),
            repeating-linear-gradient(90deg, #2d1105 0 36px, #421907 37px 71px);
          box-shadow: inset 0 18px 30px rgba(0,0,0,0.58);
          overflow: hidden;
        }

        .mahogany-cigar {
          position: absolute;
          width: 15%;
          height: 82%;
          top: 11%;
          border-radius: 999px;
          transform: rotate(90deg);
          background:
            radial-gradient(circle at 22% 48%, rgba(255,233,173,0.35), transparent 10%),
            repeating-linear-gradient(108deg, rgba(255,231,174,0.08) 0 7px, rgba(44,18,7,0.16) 8px 14px),
            linear-gradient(90deg, #4a210e, #9f5f2c 20%, #6a3217 52%, #c0803e 72%, #381608);
          box-shadow: inset 0 2px 8px rgba(255,235,184,0.18), inset 0 -6px 8px rgba(0,0,0,0.34), 0 9px 12px rgba(0,0,0,0.38);
        }

        .mahogany-cigar i {
          position: absolute;
          left: 48%;
          top: -5px;
          width: 18px;
          height: calc(100% + 10px);
          border-radius: 3px;
          background: linear-gradient(90deg, rgba(59,27,8,0.88), rgba(236,199,117,0.95), rgba(78,39,12,0.92));
          border: 1px solid rgba(255,224,148,0.48);
        }

        .mahogany-cigar-1 { left: 6%; }
        .mahogany-cigar-2 { left: 16%; top: 15%; }
        .mahogany-cigar-3 { left: 27%; }
        .mahogany-cigar-4 { left: 38%; top: 15%; }
        .mahogany-cigar-5 { left: 49%; }
        .mahogany-cigar-6 { left: 60%; top: 15%; }
        .mahogany-cigar-7 { left: 71%; }
        .mahogany-cigar-8 { left: 82%; top: 15%; }

        .mahogany-humidor-front {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 62%;
          border-radius: 6px 6px 16px 16px;
          border: 2px solid rgba(243,189,85,0.68);
          background:
            linear-gradient(105deg, rgba(255,255,255,0.13), transparent 20%, rgba(255,215,122,0.08) 46%, transparent 82%),
            repeating-linear-gradient(0deg, rgba(255,225,159,0.08) 0 2px, transparent 2px 24px),
            linear-gradient(145deg, #6d2c0d 0%, #2a0c03 44%, #8b4213 78%, #230802 100%);
          box-shadow:
            inset 0 2px 0 rgba(255,232,164,0.28),
            inset 0 -28px 42px rgba(13,4,1,0.62),
            0 0 30px rgba(255,177,60,0.16);
          overflow: hidden;
        }

        .mahogany-humidor-front::before,
        .mahogany-humidor-front::after {
          content: "";
          position: absolute;
          top: 16%;
          bottom: 16%;
          width: 27%;
          border: 1px solid rgba(255,222,127,0.22);
          border-radius: 7px;
          background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(36,11,3,0.08));
        }

        .mahogany-humidor-front::before { left: 8%; }
        .mahogany-humidor-front::after { right: 8%; }

        .mahogany-nameplate {
          position: absolute;
          left: 50%;
          top: 18%;
          min-width: 190px;
          transform: translateX(-50%);
          padding: 8px 20px;
          border-radius: 999px;
          display: grid;
          gap: 1px;
          place-items: center;
          z-index: 4;
          color: #1b0d02;
          background: linear-gradient(135deg, #ffe296, #bd812e 62%, #805014);
          border: 1px solid rgba(255,239,171,0.82);
          box-shadow: 0 0 24px rgba(255,196,73,0.28), inset 0 1px 0 rgba(255,255,230,0.54);
        }

        .mahogany-nameplate small {
          font-family: "JetBrains Mono", monospace;
          font-size: 8px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .mahogany-nameplate strong {
          font-family: "Playfair Display", serif;
          font-size: clamp(14px, 1.6vw, 18px);
          color: #1b0d02;
        }

        .mahogany-lock {
          position: absolute;
          left: 50%;
          bottom: 12%;
          width: 64px;
          height: 58px;
          transform: translateX(-50%);
          border-radius: 7px 7px 14px 14px;
          background: linear-gradient(160deg, #ffe28a, #b66d19 52%, #4a1b04);
          border: 1px solid rgba(255,241,176,0.8);
          box-shadow:
            inset 0 1px 0 rgba(255,255,225,0.5),
            0 0 24px rgba(255,194,75,0.38),
            0 10px 18px rgba(0,0,0,0.35);
          z-index: 4;
        }

        .mahogany-keyhole {
          position: absolute;
          left: 50%;
          top: 30%;
          width: 14px;
          height: 14px;
          transform: translateX(-50%);
          border-radius: 999px 999px 45% 45%;
          background: #160804;
          box-shadow: 0 16px 0 -4px #160804;
        }

        .golden-box-kicker::before,
        .golden-box-kicker::after {
          content: "✧";
          margin: 0 12px;
          color: rgba(233,193,118,0.72);
        }

        .golden-box-title {
          font-size: clamp(34px, 6vw, 58px);
          line-height: 1.05;
          text-shadow: 0 0 38px rgba(0,0,0,0.82), 0 0 24px rgba(233,193,118,0.2);
        }

        .golden-phase-track {
          position: relative;
          display: grid;
          grid-template-columns: repeat(5, minmax(72px, 1fr));
          gap: 8px;
          max-width: 580px;
          margin: 0 auto;
        }

        .golden-phase-track::before {
          content: "";
          position: absolute;
          left: 9%;
          right: 9%;
          top: 31px;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(233,193,118,0.64), transparent);
          box-shadow: 0 0 14px rgba(233,193,118,0.38);
        }

        .golden-phase-item {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          z-index: 1;
        }

        .golden-phase-orb {
          width: 62px;
          height: 62px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(circle at 45% 35%, rgba(255,226,138,0.2), rgba(32,16,6,0.92) 62%),
            linear-gradient(160deg, rgba(233,193,118,0.18), rgba(0,0,0,0.28));
          border: 1px solid rgba(233,193,118,0.68);
          box-shadow:
            0 0 26px rgba(233,193,118,0.2),
            inset 0 1px 0 rgba(255,255,220,0.18);
        }

        .golden-phase-number {
          font-family: "JetBrains Mono", monospace;
          font-size: 13px;
          font-weight: 900;
          color: #e9c176;
          line-height: 1;
        }

        .golden-phase-label {
          font-family: "JetBrains Mono", monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(229,226,227,0.7);
        }

        .golden-content-card {
          background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(28,16,8,0.64));
          border: 1px solid rgba(233,193,118,0.2);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 18px 36px rgba(0,0,0,0.28);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        @media (max-width: 720px) {
          .golden-box-page {
            min-height: max(900px, 100dvh);
          }
          .golden-box-stage {
            height: 245px;
            margin-top: 24px;
          }
          .golden-phase-track {
            grid-template-columns: repeat(5, minmax(48px, 1fr));
            gap: 4px;
          }
          .golden-phase-track::before {
            top: 25px;
            left: 11%;
            right: 11%;
          }
          .golden-phase-orb {
            width: 50px;
            height: 50px;
          }
          .golden-phase-orb .material-symbols-outlined {
            font-size: 20px !important;
          }
          .golden-phase-label {
            font-size: 8px;
            letter-spacing: 0.05em;
          }
        }
      `}</style>
    </div>
  )
}
