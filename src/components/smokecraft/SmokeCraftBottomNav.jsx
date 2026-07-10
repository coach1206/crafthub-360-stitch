import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { hapticTap, playClickSound } from '../../utils/scTouch.js'

const NAV_ITEMS = [
  { label: 'SmokeCraft', icon: 'local_fire_department', path: '/smokecraft' },
  { label: 'Rewards',    icon: 'stars',                 path: '/smokecraft/leaderboard' },
  { label: 'Passport',   icon: 'book',                  path: '/passport-connection' },
  { label: 'CraftHub',   icon: 'apps',                  path: '/crafthub' },
]

export default function SmokeCraftBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const handlePress = useCallback((e, path) => {
    const btn = e.currentTarget
    hapticTap('light')
    playClickSound(660, 0.05, 0.05)
    btn.style.transform = 'scale(0.88)'
    btn.style.transition = 'transform 0.08s ease'
    setTimeout(() => {
      btn.style.transform = 'scale(1.04)'
      btn.style.transition = 'transform 0.12s cubic-bezier(0.34,1.56,0.64,1)'
      setTimeout(() => {
        btn.style.transform = 'scale(1)'
        btn.style.transition = 'transform 0.1s ease'
      }, 120)
    }, 80)
    navigate(path)
  }, [navigate])

  return (
    <>
      <style>{`
        .sc-nav-btn:focus-visible {
          outline: 2px solid rgba(233,193,118,0.6);
          outline-offset: -2px;
          border-radius: 8px;
        }
        @media (prefers-reduced-motion: reduce) {
          .sc-nav-btn { transition: none !important; }
        }
      `}</style>
      <nav
        aria-label="SmokeCraft navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          display: 'flex',
          alignItems: 'stretch',
          height: 64,
          background: 'linear-gradient(180deg, rgba(5,3,1,0.88) 0%, rgba(5,3,1,0.98) 100%)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderTop: '1px solid rgba(201,168,76,0.2)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.path ||
            (item.path === '/smokecraft' && pathname.startsWith('/smokecraft') && pathname !== '/smokecraft/leaderboard')
          return (
            <button
              key={item.path}
              className="sc-nav-btn"
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              onPointerDown={e => handlePress(e, item.path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: isActive ? 'rgba(233,193,118,0.06)' : 'transparent',
                borderTop: isActive ? '2px solid rgba(233,193,118,0.6)' : '2px solid transparent',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                cursor: 'pointer',
                padding: '6px 0 4px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
                color: isActive ? 'rgba(233,193,118,1)' : 'rgba(240,230,204,0.38)',
                transition: 'color 0.15s, background 0.15s',
                willChange: 'transform',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 22,
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  transition: 'font-variation-settings 0.15s',
                  lineHeight: 1,
                  filter: isActive ? 'drop-shadow(0 0 4px rgba(233,193,118,0.5))' : 'none',
                }}
              >
                {item.icon}
              </span>
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  fontFamily: 'Georgia, serif',
                  fontWeight: isActive ? 700 : 400,
                  lineHeight: 1,
                }}
              >
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
