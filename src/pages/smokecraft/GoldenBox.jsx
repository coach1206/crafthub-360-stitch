import { useState, useEffect } from 'react'
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

function GoldenTreasureBox() {
  return (
    <div className="golden-box-stage" aria-hidden="true">
      <div className="golden-box-rays" />
      <div className="golden-box-smoke golden-box-smoke-left" />
      <div className="golden-box-smoke golden-box-smoke-right" />
      <div className="golden-box-table-glow" />

      <div className="golden-lockbox">
        <div className="golden-lockbox-lid">
          <div className="golden-lockbox-top-plate" />
          <div className="golden-lockbox-highlight" />
          <div className="golden-lockbox-lid-band" />
          <span className="golden-lockbox-rivet golden-lockbox-rivet-a" />
          <span className="golden-lockbox-rivet golden-lockbox-rivet-b" />
          <span className="golden-lockbox-rivet golden-lockbox-rivet-c" />
          <span className="golden-lockbox-rivet golden-lockbox-rivet-d" />
        </div>

        <div className="golden-lockbox-body">
          <div className="golden-lockbox-side golden-lockbox-side-left" />
          <div className="golden-lockbox-side golden-lockbox-side-right" />
          <div className="golden-lockbox-front">
            <div className="golden-lockbox-front-band" />
            <div className="golden-lockbox-panel golden-lockbox-panel-left" />
            <div className="golden-lockbox-panel golden-lockbox-panel-right" />
            <div className="golden-lockbox-lock">
              <span className="golden-lockbox-keyhole" />
            </div>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <span key={i} className={`golden-lockbox-front-rivet golden-lockbox-front-rivet-${i}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GoldenBox() {
  const navigate = useNavigate()
  const { addXP, addBadge, completeStep } = useGuestSession()

  const [revealed, setRevealed]         = useState(false)
  const [contentsOpen, setContentsOpen] = useState(false)
  const [accepted, setAccepted]         = useState(false)

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
    setTimeout(() => navigate('/smokecraft/art'), 600)
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
            onClick={() => navigate('/smokecraft/enroll')}
            aria-label="Back to Enroll"
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
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCq4_EpkSpYVcHVlVxnKXJacUbdRmQWEovF-KvyMHM6dJqnGjPivNcRVqPojva00dcFw-6BVVfhI1gFLcaSclOfplLXr3i6MUVX4P-hkoIEfJTKgiHqRbMzmwdN_3t5yChLEGMio7Do167r-rCSqyVByUbYjQFGK9oISPUctIdJqwIGb-QKw2h3XuvSYjbpmyaRpt-JnoQzW41fw_DgeBRzjFoBukHh9bttmrZSUbJTEq5nRcpGZ410InFTORhNwgbrVX3N9_MH0Bo"
            />
          </div>
        </div>
      </header>

      {/* ── Main Stage ───────────────────────────────────────── */}
      <main className="w-full max-w-[980px] mx-auto px-gutter flex flex-col items-center text-center gap-7 pt-24 pb-16">

        {/* Box Illustration */}
        <div
          className={`transition-all duration-1000 ease-out ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '0ms' }}
        >
          <GoldenTreasureBox />
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
            radial-gradient(ellipse at 50% 7%, rgba(255,198,73,0.34) 0%, rgba(177,101,18,0.12) 26%, transparent 56%),
            radial-gradient(ellipse at 15% 47%, rgba(203,126,43,0.12) 0%, transparent 34%),
            radial-gradient(ellipse at 88% 38%, rgba(255,208,115,0.12) 0%, transparent 30%),
            linear-gradient(180deg, #090502 0%, #030201 74%, #010101 100%);
        }

        .golden-box-lounge-silhouette {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse at 14% 66%, rgba(161,91,27,0.22) 0%, rgba(28,14,5,0.2) 20%, transparent 34%),
            radial-gradient(ellipse at 85% 61%, rgba(145,76,23,0.2) 0%, rgba(20,9,4,0.28) 22%, transparent 34%),
            radial-gradient(ellipse at 94% 12%, rgba(223,164,67,0.14) 0%, transparent 25%),
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
            radial-gradient(ellipse 42% 34% at 50% 21%, rgba(255,219,120,0.36), transparent 64%),
            radial-gradient(ellipse 55% 46% at 50% 58%, rgba(127,69,19,0.22), transparent 72%);
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
          width: min(560px, 90vw);
          height: clamp(245px, 34vw, 350px);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 8px;
          isolation: isolate;
        }

        .golden-box-rays {
          position: absolute;
          top: -22%;
          left: 50%;
          width: 58%;
          height: 74%;
          transform: translateX(-50%);
          background:
            conic-gradient(from 165deg at 50% 0%, transparent 0deg, rgba(255,229,134,0.18) 14deg, transparent 28deg, rgba(255,204,76,0.15) 38deg, transparent 54deg),
            radial-gradient(ellipse at 50% 0%, rgba(255,243,184,0.48), transparent 58%);
          filter: blur(1px);
          opacity: 0.86;
          mix-blend-mode: screen;
          z-index: 0;
        }

        .golden-box-smoke {
          position: absolute;
          width: 40%;
          height: 45%;
          top: 34%;
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
          width: 74%;
          height: 19%;
          transform: translateX(-50%);
          border-radius: 999px;
          background: radial-gradient(ellipse at center, rgba(255,190,70,0.42), rgba(118,62,14,0.18) 42%, transparent 72%);
          filter: blur(13px);
          z-index: 1;
        }

        .golden-lockbox {
          position: relative;
          width: clamp(260px, 48vw, 430px);
          height: clamp(160px, 28vw, 248px);
          transform: perspective(920px) rotateX(3deg);
          filter: drop-shadow(0 32px 42px rgba(0,0,0,0.72)) drop-shadow(0 0 46px rgba(255,190,68,0.24));
          z-index: 3;
        }

        .golden-lockbox-lid {
          position: absolute;
          left: 7%;
          top: 0;
          width: 86%;
          height: 36%;
          transform: skewX(-7deg);
          border-radius: 7px 7px 2px 2px;
          background: linear-gradient(145deg, #fff0a0 0%, #d9982b 28%, #7b3b0b 72%, #2e1303 100%);
          border: 1px solid rgba(255,226,135,0.88);
          box-shadow:
            inset 0 2px 0 rgba(255,255,220,0.66),
            inset 0 -12px 28px rgba(60,22,0,0.5),
            0 0 38px rgba(255,183,48,0.28);
          overflow: hidden;
        }

        .golden-lockbox-top-plate {
          position: absolute;
          inset: 14% 7% 24%;
          border-radius: 4px;
          border: 1px solid rgba(255,241,176,0.36);
          background:
            linear-gradient(90deg, rgba(255,255,255,0.16), transparent 36%, rgba(0,0,0,0.16)),
            repeating-linear-gradient(90deg, rgba(65,28,5,0.18) 0 2px, transparent 2px 28px);
        }

        .golden-lockbox-highlight {
          position: absolute;
          left: 50%;
          top: -44%;
          width: 32%;
          height: 94%;
          transform: translateX(-50%);
          background: radial-gradient(ellipse at center, rgba(255,255,225,0.94), rgba(255,220,92,0.34) 34%, transparent 72%);
          filter: blur(5px);
          mix-blend-mode: screen;
        }

        .golden-lockbox-lid-band {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 14%;
          height: 12%;
          background: linear-gradient(90deg, rgba(64,25,3,0.52), rgba(255,232,126,0.42), rgba(64,25,3,0.52));
          border-top: 1px solid rgba(255,235,151,0.38);
          border-bottom: 1px solid rgba(65,28,5,0.5);
        }

        .golden-lockbox-rivet,
        .golden-lockbox-front-rivet {
          position: absolute;
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: radial-gradient(circle at 34% 30%, #fff3ac, #bd7621 58%, #4a1f05 100%);
          box-shadow: 0 0 10px rgba(255,204,89,0.34);
        }

        .golden-lockbox-rivet-a { left: 8%; top: 24%; }
        .golden-lockbox-rivet-b { right: 8%; top: 24%; }
        .golden-lockbox-rivet-c { left: 8%; bottom: 20%; }
        .golden-lockbox-rivet-d { right: 8%; bottom: 20%; }

        .golden-lockbox-body {
          position: absolute;
          left: 3%;
          right: 3%;
          bottom: 0;
          height: 68%;
          transform: perspective(620px) rotateX(-3deg);
        }

        .golden-lockbox-front {
          position: absolute;
          inset: 0 8%;
          border-radius: 3px 3px 8px 8px;
          background:
            linear-gradient(110deg, rgba(255,255,255,0.22), transparent 22%),
            linear-gradient(160deg, #eaa236 0%, #8f470d 44%, #3a1604 100%);
          border: 1px solid rgba(255,224,128,0.78);
          box-shadow:
            inset 0 1px 0 rgba(255,246,190,0.56),
            inset 0 -22px 34px rgba(30,8,0,0.52),
            0 0 24px rgba(255,174,40,0.16);
          overflow: hidden;
        }

        .golden-lockbox-front::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            repeating-linear-gradient(0deg, rgba(255,242,180,0.06) 0 1px, transparent 1px 23px),
            linear-gradient(90deg, rgba(0,0,0,0.34), transparent 18%, transparent 82%, rgba(0,0,0,0.3));
        }

        .golden-lockbox-side {
          position: absolute;
          top: 7%;
          bottom: 7%;
          width: 13%;
          background: linear-gradient(160deg, #b96018, #3f1704);
          border: 1px solid rgba(255,211,107,0.48);
          filter: brightness(0.82);
        }

        .golden-lockbox-side-left {
          left: 0;
          transform: skewY(8deg);
          border-radius: 4px 0 0 7px;
        }

        .golden-lockbox-side-right {
          right: 0;
          transform: skewY(-8deg);
          border-radius: 0 4px 7px 0;
        }

        .golden-lockbox-front-band {
          position: absolute;
          left: 0;
          right: 0;
          top: 27%;
          height: 16%;
          background: linear-gradient(90deg, rgba(64,25,3,0.62), rgba(255,226,118,0.44), rgba(64,25,3,0.62));
          border-top: 1px solid rgba(255,238,155,0.38);
          border-bottom: 1px solid rgba(61,24,4,0.72);
          z-index: 2;
        }

        .golden-lockbox-panel {
          position: absolute;
          top: 13%;
          bottom: 13%;
          width: 33%;
          border: 1px solid rgba(255,228,130,0.28);
          border-radius: 3px;
          background: linear-gradient(160deg, rgba(255,255,255,0.08), rgba(50,17,2,0.12));
          z-index: 1;
        }

        .golden-lockbox-panel-left { left: 9%; }
        .golden-lockbox-panel-right { right: 9%; }

        .golden-lockbox-lock {
          position: absolute;
          left: 50%;
          top: 36%;
          width: 17%;
          height: 40%;
          transform: translateX(-50%);
          border-radius: 4px 4px 10px 10px;
          background: linear-gradient(160deg, #ffe28a, #b66d19 52%, #4a1b04);
          border: 1px solid rgba(255,241,176,0.8);
          box-shadow:
            inset 0 1px 0 rgba(255,255,225,0.5),
            0 0 24px rgba(255,194,75,0.38),
            0 10px 18px rgba(0,0,0,0.35);
          z-index: 4;
        }

        .golden-lockbox-keyhole {
          position: absolute;
          left: 50%;
          top: 32%;
          width: 14px;
          height: 14px;
          transform: translateX(-50%);
          border-radius: 999px 999px 45% 45%;
          background: #160804;
          box-shadow: 0 16px 0 -4px #160804;
        }

        .golden-lockbox-front-rivet-0 { left: 5%; top: 12%; }
        .golden-lockbox-front-rivet-1 { right: 5%; top: 12%; }
        .golden-lockbox-front-rivet-2 { left: 5%; bottom: 12%; }
        .golden-lockbox-front-rivet-3 { right: 5%; bottom: 12%; }
        .golden-lockbox-front-rivet-4 { left: 28%; top: 36%; }
        .golden-lockbox-front-rivet-5 { right: 28%; top: 36%; }

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
