import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'

const GOLD = 'linear-gradient(135deg,#8b6914,#e9c176,#f5d98a,#c5a059,#8b6914)'

function getPerformance(score) {
  if (score === 5) return { title: 'Master Leaf Eye',        copy: 'You identified all 5 leaf profiles perfectly. A rare achievement — the eye of a true master blender.', xp: 125 }
  if (score === 4) return { title: 'Aficionado Level',       copy: 'You identified 4 out of 5 leaf profiles. Exceptional botanical instincts. Near-master recognition.',       xp: 100 }
  if (score === 3) return { title: 'Developing Connoisseur', copy: 'You identified 3 out of 5 leaf profiles. Your botanical eye is sharpening. Keep studying the details.',    xp: 100 }
  if (score === 2) return { title: 'A Learning Journey',     copy: 'You identified 2 out of 5 leaf profiles. Every master blender starts by training the eye. Review the study deck, sharpen your recognition, and continue your cultivation journey.', xp: 75 }
  if (score === 1) return { title: 'Novice Recognition',     copy: 'You identified 1 out of 5 leaf profiles. The leaves reveal themselves with practice. Return to the study deck and try again.', xp: 75 }
  return               { title: 'Start With The Leaf',       copy: 'The leaf study deck awaits. Every expert started at zero. Begin your recognition journey today.',          xp: 75 }
}

function playStampReveal() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(330, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(165, ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.14, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.6)
  } catch (_) {}
}
function triggerHapticPulse() {
  try { navigator.vibrate?.([30, 15, 60]) } catch (_) {}
}

export default function LeafChallengeResult() {
  const navigate        = useNavigate()
  const { session }     = useGuestSession()
  const stampSoundFired = useRef(false)

  // Read saved result from sessionStorage
  const saved       = JSON.parse(sessionStorage.getItem('leafChallengeResult') || '{}')
  const score       = saved.score       ?? 2
  const total       = saved.total       ?? 5
  const { title, copy, xp } = getPerformance(score)

  // Animation states
  const [ringPct,    setRingPct]    = useState(0)   // 0-1
  const [showTitle,  setShowTitle]  = useState(false)
  const [showAwards, setShowAwards] = useState(false)
  const [showBadge,  setShowBadge]  = useState(false)
  const [showStamp,  setShowStamp]  = useState(false)
  const [showRecap,  setShowRecap]  = useState(false)
  const [showBtns,   setShowBtns]   = useState(false)
  const [stampPressed, setStampPressed] = useState(false)
  const [passportOpen, setPassportOpen] = useState(false)

  useEffect(() => {
    // Cascade reveal
    const timers = [
      setTimeout(() => setRingPct(score / total), 200),
      setTimeout(() => setShowTitle(true),         900),
      setTimeout(() => setShowAwards(true),       1300),
      setTimeout(() => setShowBadge(true),        1700),
      setTimeout(() => {
        setShowStamp(true)
        setTimeout(() => setStampPressed(true), 400)
        if (!stampSoundFired.current) {
          stampSoundFired.current = true
          playStampReveal()
          triggerHapticPulse()
        }
      }, 2100),
      setTimeout(() => setShowRecap(true),        2600),
      setTimeout(() => setShowBtns(true),         3000),
    ]
    return () => timers.forEach(clearTimeout)
  }, [score, total])

  const circumference = 327
  const dashOffset    = circumference * (1 - ringPct)

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#080503',
      fontFamily: '"Hanken Grotesk", sans-serif',
      color: '#EDE8DF',
      overflowX: 'hidden',
      position: 'relative',
    }}>

      {/* ── Cinematic lounge background ────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <img
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQvi01dyiQOaL3eFq6x6nNewuibQg39rgwH-Wr9YWWkCJPOL1c-bOW_JmToKrMdlQhuQPCPfLNuVZiJZiU7osW7IauYsUlFVhIkW53MmLW0ci9MRPZoTbcEzVdngrAsUHb2ilp8j4izE7XtzxUlgiMcc1l6foE7PkPOCc8b906Fj3sH-KyWg60C6klgSwpWqQSbMIxAMdG1ZWNxuslbsXwT-CpDQ3QwFaKqedknrQW_LxVRGI61hDwy9jOE9SS3ixRuiVUo-dzuts"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(8,5,3,0.90) 0%, rgba(8,5,3,0.80) 50%, rgba(8,5,3,0.95) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 50% at 50% 30%, rgba(212,175,55,0.07) 0%, transparent 60%)' }} />
      </div>

      {/* Smoke drifts */}
      {[
        { w: 600, l: '-10%', t: '5%',  dur: '10s', op: 0.12 },
        { w: 400, l: '60%',  t: '30%', dur: '13s', op: 0.09 },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'fixed', left: s.l, top: s.t,
          width: s.w, height: s.w, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.2) 0%, transparent 70%)',
          filter: 'blur(60px)', opacity: s.op, pointerEvents: 'none', zIndex: 1,
          animation: `smokeDrift ${s.dur} ease-in-out ${i * 1.5}s infinite alternate`,
        }} />
      ))}

      {/* ── Header ─────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px',
        background: 'rgba(8,5,3,0.82)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(212,175,55,0.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/smokecraft/leaves')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D4AF37', display: 'flex', alignItems: 'center', padding: 8 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          </button>
          <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#D4AF37' }}>CraftHub 360</span>
        </div>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#6A5A40', letterSpacing: '0.18em', textTransform: 'uppercase' }}>
          Leaf Challenge Complete
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.25)', overflow: 'hidden' }}>
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────── */}
      <main style={{ position: 'relative', zIndex: 10, paddingTop: 88, paddingBottom: 48, maxWidth: 680, margin: '0 auto', padding: '88px 24px 56px' }}>

        {/* Page title */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>
            Know Your Leaves · SmokeCraft 360
          </div>
          <h1 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(28px,5vw,40px)', fontWeight: 700, color: '#EDE8DF', letterSpacing: '-0.02em' }}>
            Leaf Challenge Complete
          </h1>
        </div>

        {/* ── Score Ring ──────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', width: 200, height: 200 }}>
            {/* Outer glow */}
            <div style={{
              position: 'absolute', inset: -16, borderRadius: '50%',
              background: 'radial-gradient(ellipse, rgba(212,175,55,0.14) 0%, transparent 65%)',
              animation: ringPct > 0 ? 'glowPulse 2s ease-in-out infinite alternate' : 'none',
            }} />
            {/* Gold particle shimmer ring */}
            <div style={{
              position: 'absolute', inset: -4, borderRadius: '50%',
              border: '1px solid rgba(212,175,55,0.12)',
            }} />
            <svg viewBox="0 0 200 200" style={{ width: 200, height: 200, transform: 'rotate(-90deg)', display: 'block' }}>
              {/* Track */}
              <circle cx="100" cy="100" r="52" fill="none"
                stroke="rgba(212,175,55,0.10)" strokeWidth="10" />
              {/* Score arc */}
              <circle cx="100" cy="100" r="52" fill="none"
                stroke="url(#scoreGold)" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{
                  transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
                  filter: score === total ? 'drop-shadow(0 0 10px rgba(212,175,55,0.7))' : 'drop-shadow(0 0 4px rgba(212,175,55,0.3))',
                }}
              />
              <defs>
                <linearGradient id="scoreGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%"   stopColor="#8b6914" />
                  <stop offset="50%"  stopColor="#e9c176" />
                  <stop offset="100%" stopColor="#f5d98a" />
                </linearGradient>
              </defs>
            </svg>
            {/* Score text */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 42, fontWeight: 700, color: '#D4AF37', lineHeight: 1 }}>
                {score}<span style={{ fontSize: 22, color: 'rgba(212,175,55,0.55)' }}>/{total}</span>
              </div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#6A5A40', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: 6 }}>
                Leaf Recognition Score
              </div>
            </div>
          </div>
        </div>

        {/* Performance title */}
        <div style={{
          textAlign: 'center', marginBottom: 36,
          opacity: showTitle ? 1 : 0,
          transform: showTitle ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 700, color: score >= 4 ? '#D4AF37' : '#EDE8DF', marginBottom: 12 }}>
            {title}
          </h2>
          <p style={{ fontSize: 14, color: '#7A6A50', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>{copy}</p>
        </div>

        {/* ── Awards Card ─────────────────────────────────── */}
        <div style={{
          borderRadius: 18, border: '1px solid rgba(212,175,55,0.22)',
          background: 'rgba(14,10,5,0.85)', backdropFilter: 'blur(20px)',
          padding: '28px 28px 22px',
          marginBottom: 20,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(212,175,55,0.06)',
          opacity: showAwards ? 1 : 0,
          transform: showAwards ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 22 }}>
            Awards Earned This Round
          </div>

          {/* XP Reward */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              border: '2px solid rgba(212,175,55,0.45)',
              boxShadow: '0 0 16px rgba(212,175,55,0.2)',
              background: 'linear-gradient(135deg,#3D2B0A,#6A4A10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <img
                src="https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=120&auto=format&fit=crop&q=80"
                alt="XP coin"
                style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'luminosity', opacity: 0.9 }}
                onError={e => { e.target.style.display='none' }}
              />
            </div>
            <div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 20, fontWeight: 700, color: '#D4AF37', marginBottom: 3 }}>+{xp} XP</div>
              <div style={{ fontSize: 12, color: '#7A6A50' }}>Participation and completion reward</div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(212,175,55,0.08)', marginBottom: 18 }} />

          {/* Botanist Badge — reveals with shimmer */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18, marginBottom: 18,
            opacity: showBadge ? 1 : 0,
            transform: showBadge ? 'translateX(0)' : 'translateX(-16px)',
            transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              border: '2px solid rgba(212,175,55,0.4)',
              position: 'relative',
              boxShadow: showBadge ? '0 0 20px rgba(212,175,55,0.25)' : 'none',
              transition: 'box-shadow 0.8s ease 0.3s',
            }}>
              <img
                src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=120&auto=format&fit=crop&q=80"
                alt="Botanist Badge"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => { e.target.style.display='none' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(8,5,2,0.2)' }} />
              {/* Shimmer sweep */}
              {showBadge && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(105deg, transparent 30%, rgba(212,175,55,0.5) 50%, transparent 70%)',
                  animation: 'shimmerSweep 0.8s ease 0.2s 1 forwards',
                  opacity: 0,
                }} />
              )}
            </div>
            <div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
                New Badge Unlocked
              </div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: '#EDE8DF', marginBottom: 3 }}>Botanist Badge</div>
              <div style={{ fontSize: 12, color: '#7A6A50' }}>Awarded for completing the Know Your Leaves challenge</div>
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(212,175,55,0.08)', marginBottom: 18 }} />

          {/* Passport Stamp — press-down animation */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18,
            opacity: showStamp ? 1 : 0,
            transform: showStamp ? 'translateX(0)' : 'translateX(-16px)',
            transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
              border: '2px solid rgba(212,175,55,0.4)',
              background: 'linear-gradient(160deg,#1A0D04,#2D1A0A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: stampPressed ? '0 0 20px rgba(212,175,55,0.3), inset 0 1px 3px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.4)',
              transform: stampPressed ? 'scale(0.92)' : 'scale(1)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 7, color: '#D4AF37', letterSpacing: '0.1em', lineHeight: 1.4 }}>SC360</div>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#D4AF37', fontVariationSettings: "'FILL' 1" }}>approval</span>
              </div>
            </div>
            <div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>
                Passport Stamp Earned
              </div>
              <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, fontWeight: 700, color: '#EDE8DF', marginBottom: 3 }}>Leaf Recognition Stamp</div>
              <div style={{ fontSize: 12, color: '#7A6A50' }}>Added to your SmokeCraft 360 Passport</div>
            </div>
          </div>
        </div>

        {/* ── Challenge Recap ─────────────────────────────── */}
        <div style={{
          borderRadius: 16, border: '1px solid rgba(212,175,55,0.15)',
          background: 'rgba(14,10,5,0.75)', backdropFilter: 'blur(16px)',
          padding: '22px 24px', marginBottom: 28,
          opacity: showRecap ? 1 : 0,
          transform: showRecap ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18 }}>
            Challenge Recap
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10 }}>
            {[
              { label: 'Leaves Studied',    value: '6'     },
              { label: 'Questions',          value: `${total}`   },
              { label: 'Correct',            value: `${score}`   },
              { label: 'XP Earned',          value: `+${xp}` },
              { label: 'Passport Progress',  value: '+1 Stamp'   },
            ].map(stat => (
              <div key={stat.label} style={{
                borderRadius: 10, border: '1px solid rgba(212,175,55,0.12)',
                background: 'rgba(212,175,55,0.04)',
                padding: '14px 8px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: '"Playfair Display",serif', fontSize: 18, fontWeight: 700, color: '#D4AF37', marginBottom: 4 }}>{stat.value}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#5A4A30', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.4 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA Buttons ─────────────────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          opacity: showBtns ? 1 : 0,
          transform: showBtns ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s cubic-bezier(0.4,0,0.2,1)',
        }}>
          {/* Primary */}
          <button
            onClick={() => navigate('/smokecraft/cultivation')}
            style={{
              width: '100%', height: 60, borderRadius: 12, border: 'none',
              background: GOLD, color: '#0A0705',
              fontFamily: '"JetBrains Mono",monospace', fontSize: 12, fontWeight: 900,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              cursor: 'pointer', boxShadow: '0 0 28px rgba(212,175,55,0.3)',
              transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Continue to Cultivation
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
          </button>

          {/* Secondary row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <button
              onClick={() => navigate('/smokecraft/leaves')}
              style={{
                height: 54, borderRadius: 12,
                background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.3)',
                color: '#D4AF37',
                fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.06)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
              Review Leaves Again
            </button>
            <button
              onClick={() => setPassportOpen(true)}
              style={{
                height: 54, borderRadius: 12,
                background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.3)',
                color: '#D4AF37',
                fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: 'pointer', transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(212,175,55,0.06)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>menu_book</span>
              View Passport Stamp
            </button>
          </div>
        </div>
      </main>

      {/* ── Passport Stamp Modal ──────────────────────────── */}
      {passportOpen && (
        <div onClick={() => setPassportOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%', maxWidth: 420,
            borderRadius: 20, border: '1px solid rgba(212,175,55,0.28)',
            background: 'rgba(14,10,5,0.97)',
            padding: '36px 32px', textAlign: 'center',
            boxShadow: '0 40px 120px rgba(0,0,0,0.7)',
          }}>
            {/* Stamp graphic */}
            <div style={{
              width: 120, height: 120, borderRadius: '50%', margin: '0 auto 24px',
              border: '3px solid rgba(212,175,55,0.5)',
              background: 'linear-gradient(160deg,#1A0D04,#2D1A0A)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(212,175,55,0.2), inset 0 2px 4px rgba(0,0,0,0.4)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1px dashed rgba(212,175,55,0.3)' }} />
              <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#D4AF37', fontVariationSettings: "'FILL' 1", position: 'relative', zIndex: 1 }}>eco</span>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 6, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.12em', textAlign: 'center', position: 'relative', zIndex: 1, lineHeight: 1.6 }}>
                SC 360
              </div>
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: 'rgba(212,175,55,0.6)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
              360 Passport · Stamp Earned
            </div>
            <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 22, fontWeight: 700, color: '#D4AF37', marginBottom: 10 }}>
              Leaf Recognition Stamp
            </h3>
            <div style={{ fontSize: 11, color: '#5A4A30', lineHeight: 1.8, marginBottom: 6 }}>
              SMOKECRAFT 360 · LEAF RECOGNITION<br />
              360 PASSPORT CONNECTIONS<br />
              POWERED BY NOVEE OS
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => navigate('/passport')}
                style={{ flex: 1, height: 48, borderRadius: 10, border: 'none', background: GOLD, color: '#0A0705', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
              >View Passport</button>
              <button
                onClick={() => setPassportOpen(false)}
                style={{ flex: 1, height: 48, borderRadius: 10, background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.25)', color: '#D4AF37', fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer' }}
              >Close</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes smokeDrift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(25px,-40px) scale(1.15); }
        }
        @keyframes glowPulse {
          from { opacity: 0.5; transform: scale(0.96); }
          to   { opacity: 1;   transform: scale(1.04); }
        }
        @keyframes shimmerSweep {
          0%   { transform: translateX(-100%); opacity: 0; }
          30%  { opacity: 1; }
          100% { transform: translateX(100%);  opacity: 0; }
        }
        @media (max-width: 480px) {
          .recap-grid { grid-template-columns: repeat(3,1fr) !important; }
        }
      `}</style>
    </div>
  )
}
