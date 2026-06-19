import { useNavigate } from 'react-router-dom'
import { useDemoMode } from '../context/DemoModeContext.jsx'

// Public NOVEE OS boot screen — the single entry point at "/" and "/boot".
// No timers, no cinematic auto-advance, no role gating: every guest sees
// this immediately and picks where to go. The privileged multi-stage
// cinematic console lives at /boot/console (BootConsole.jsx) and is only
// linked from here for founder/admin/developer/staff sessions.
export default function Boot() {
  const navigate = useNavigate()
  const { enterDemoMode } = useDemoMode()

  function go(to) {
    sessionStorage.setItem('novee_booted', '1')
    navigate(to)
  }

  function handleDemoMode() {
    sessionStorage.setItem('novee_booted', '1')
    enterDemoMode()
    navigate('/home', { replace: true })
  }

  const primaryActions = [
    { label: 'Enter NOVEE OS',       sub: 'Command hub & module grid',     to: '/home',      icon: 'hub' },
    { label: 'Enter CraftHub 360',   sub: 'Guest craft experiences',       to: '/crafthub',  icon: 'chair' },
    { label: 'Enter SmokeCraft 360', sub: 'Guided cigar journey',          to: '/smokecraft', icon: 'smoking_rooms' },
  ]

  return (
    <div
      style={{
        minHeight: '100dvh',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% -10%, rgba(91,143,201,0.18), transparent 55%), radial-gradient(ellipse at 15% 110%, rgba(212,175,55,0.10), transparent 50%), linear-gradient(180deg, #0a0b0d 0%, #131314 50%, #08090a 100%)',
        color: '#EDE8DF',
        fontFamily: '"Hanken Grotesk", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
      }}
    >
      {/* charcoal/glass texture overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
          backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,0.018) 0 1px, transparent 1px 7px)',
        }}
      />
      <div
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.55) 100%)' }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 560, textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
            padding: '6px 16px', borderRadius: 20,
            border: '1px solid rgba(91,143,201,0.4)', background: 'rgba(91,143,201,0.08)',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#5b8fc9', boxShadow: '0 0 8px #5b8fc9' }} />
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#9cc2e8' }}>
            System Ready
          </span>
        </div>

        <h1
          style={{
            fontFamily: '"Playfair Display", serif', fontWeight: 700,
            fontSize: 'clamp(48px, 9vw, 88px)', letterSpacing: '-0.02em', lineHeight: 1,
            margin: '0 0 16px',
            background: 'linear-gradient(135deg, #e9c176 0%, #fff0c4 35%, #d4af37 65%, #b8952a 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            textShadow: '0 0 60px rgba(233,193,118,0.25)',
          }}
        >
          NOVEE OS
        </h1>
        <p
          style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 13, letterSpacing: '0.32em',
            textTransform: 'uppercase', color: 'rgba(156,194,232,0.85)', margin: '0 0 56px',
          }}
        >
          Private Experience Layer
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
          {primaryActions.map(action => (
            <button
              key={action.to}
              onClick={() => go(action.to)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                minHeight: 72, padding: '0 28px', borderRadius: 16,
                border: '1px solid rgba(212,175,55,0.3)',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(91,143,201,0.06))',
                backdropFilter: 'blur(14px)', cursor: 'pointer', transition: 'all 0.2s ease',
                textAlign: 'left', width: '100%',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.65)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.16), rgba(91,143,201,0.1))'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212,175,55,0.08), rgba(91,143,201,0.06))'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <div
                style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  border: '1px solid rgba(212,175,55,0.4)', background: 'rgba(212,175,55,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <span className="material-symbols-outlined" style={{ color: '#e9c176', fontSize: 22 }}>{action.icon}</span>
              </div>
              <div>
                <div style={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: 19, color: '#EDE8DF' }}>{action.label}</div>
                <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 11, letterSpacing: '0.05em', color: 'rgba(156,194,232,0.7)', marginTop: 2 }}>{action.sub}</div>
              </div>
              <span className="material-symbols-outlined" style={{ marginLeft: 'auto', color: 'rgba(212,175,55,0.5)' }}>chevron_right</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleDemoMode}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            minHeight: 48, padding: '0 24px', borderRadius: 24,
            border: '1px solid rgba(91,143,201,0.45)', background: 'rgba(91,143,201,0.08)',
            color: '#9cc2e8', cursor: 'pointer',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 11, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
          Demo Mode
        </button>

        <div style={{ marginTop: 40 }}>
          <button
            onClick={() => navigate('/boot/console')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: '"JetBrains Mono", monospace', fontSize: 9, letterSpacing: '0.16em',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.18)',
            }}
          >
            Founder / Admin Console
          </button>
        </div>
      </div>
    </div>
  )
}
