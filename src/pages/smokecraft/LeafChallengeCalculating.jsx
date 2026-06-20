import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function playStampSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch (_) { /* audio not available */ }
}

function triggerHapticPulse() {
  try { navigator.vibrate?.([40, 20, 80]) } catch (_) { /* not available */ }
}

export default function LeafChallengeCalculating() {
  const navigate  = useNavigate()
  const soundFired = useRef(false)

  useEffect(() => {
    // Fire stamp sound at ~800ms then route
    const soundTimer = setTimeout(() => {
      if (!soundFired.current) {
        soundFired.current = true
        playStampSound()
        triggerHapticPulse()
      }
    }, 800)

    const navTimer = setTimeout(() => {
      navigate('/smokecraft/leaf-challenge-result', { replace: true })
    }, 1600)

    return () => { clearTimeout(soundTimer); clearTimeout(navTimer) }
  }, [navigate])

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#080503',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '"Hanken Grotesk", sans-serif',
    }}>

      {/* ── Smoke layers ─────────────────────────────────── */}
      {[
        { w: 480, h: 480, left: '-8%', top: '10%', dur: '6s', delay: '0s',   opacity: 0.18 },
        { w: 360, h: 360, left: '55%', top: '20%', dur: '8s', delay: '0.4s', opacity: 0.12 },
        { w: 300, h: 300, left: '25%', top: '55%', dur: '7s', delay: '0.2s', opacity: 0.10 },
        { w: 500, h: 500, left: '-5%', top: '45%', dur: '9s', delay: '0.6s', opacity: 0.08 },
      ].map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: s.left, top: s.top,
          width: s.w, height: s.h,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.22) 0%, rgba(120,90,20,0.08) 40%, transparent 70%)',
          filter: 'blur(48px)',
          opacity: s.opacity,
          animation: `smokeDrift ${s.dur} ease-in-out ${s.delay} infinite alternate`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Tobacco leaf texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: "url('/assets/smokecraft/cropped/flavor-dna-bg.jpg')",
        opacity: 0.12, pointerEvents: 'none',
      }} />

      {/* Ambient warm glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(212,175,55,0.07) 0%, transparent 65%)',
      }} />

      {/* ── Center panel ─────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        textAlign: 'center',
        padding: '48px 40px',
        borderRadius: 24,
        border: '1px solid rgba(212,175,55,0.18)',
        background: 'rgba(14,10,5,0.75)',
        backdropFilter: 'blur(28px)',
        maxWidth: 440, width: '90%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(212,175,55,0.06)',
      }}>

        {/* Gold loading ring */}
        <div style={{ position: 'relative', width: 120, height: 120, margin: '0 auto 32px' }}>
          {/* Glow pulse behind ring */}
          <div style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(212,175,55,0.18) 0%, transparent 70%)',
            animation: 'glowPulse 1s ease-in-out infinite alternate',
          }} />

          <svg viewBox="0 0 120 120" style={{ width: 120, height: 120, transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx="60" cy="60" r="52" fill="none"
              stroke="rgba(212,175,55,0.12)" strokeWidth="6" />
            {/* Animated arc */}
            <circle cx="60" cy="60" r="52" fill="none"
              stroke="url(#goldGrad)" strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="327"
              style={{ animation: 'ringFill 1.4s cubic-bezier(0.4,0,0.2,1) forwards' }}
            />
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#8b6914" />
                <stop offset="50%"  stopColor="#e9c176" />
                <stop offset="100%" stopColor="#f5d98a" />
              </linearGradient>
            </defs>
          </svg>

          {/* Embossed leaf center */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="material-symbols-outlined" style={{
              fontSize: 38, color: '#D4AF37', opacity: 0.9,
              fontVariationSettings: "'FILL' 1",
              animation: 'leafPulse 1.4s ease-in-out infinite alternate',
            }}>eco</span>
          </div>
        </div>

        {/* Label */}
        <div style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 9, color: '#D4AF37',
          letterSpacing: '0.22em', textTransform: 'uppercase',
          marginBottom: 14,
          animation: 'fadeIn 0.6s ease 0.2s both',
        }}>
          SmokeCraft 360 · Know Your Leaves
        </div>

        <h2 style={{
          fontFamily: '"Playfair Display", serif',
          fontSize: 26, fontWeight: 700,
          color: '#EDE8DF', lineHeight: 1.25,
          marginBottom: 12,
          animation: 'fadeIn 0.6s ease 0.3s both',
        }}>
          Calculating Your<br />
          <em style={{ color: '#D4AF37' }}>Leaf Eye…</em>
        </h2>

        <p style={{
          fontSize: 14, color: '#7A6A50', lineHeight: 1.65,
          animation: 'fadeIn 0.6s ease 0.5s both',
        }}>
          Reviewing your recognition accuracy and preparing your reward moment.
        </p>

        {/* Dots loader */}
        <div style={{
          display: 'flex', gap: 8, justifyContent: 'center',
          marginTop: 28,
          animation: 'fadeIn 0.4s ease 0.7s both',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'rgba(212,175,55,0.6)',
              animation: `dotBounce 0.9s ease-in-out ${i * 0.2}s infinite alternate`,
            }} />
          ))}
        </div>
      </div>

      {/* Embossed seal background graphic */}
      <div style={{
        position: 'absolute', bottom: '8%', right: '5%',
        width: 180, height: 180, borderRadius: '50%',
        border: '2px solid rgba(212,175,55,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0.4,
      }}>
        <div style={{ width: 140, height: 140, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 60, color: 'rgba(212,175,55,0.15)', fontVariationSettings: "'FILL' 1" }}>eco</span>
        </div>
      </div>

      <style>{`
        @keyframes smokeDrift {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(30px, -50px) scale(1.2); }
        }
        @keyframes ringFill {
          from { stroke-dashoffset: 327; }
          to   { stroke-dashoffset: 0; }
        }
        @keyframes glowPulse {
          from { opacity: 0.4; transform: scale(0.95); }
          to   { opacity: 1;   transform: scale(1.05); }
        }
        @keyframes leafPulse {
          from { opacity: 0.7; transform: scale(0.95); }
          to   { opacity: 1;   transform: scale(1.05); }
        }
        @keyframes dotBounce {
          from { transform: translateY(0);    opacity: 0.4; }
          to   { transform: translateY(-8px); opacity: 1;   }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  )
}
