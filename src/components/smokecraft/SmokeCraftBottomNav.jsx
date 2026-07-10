import { useNavigate, useLocation } from 'react-router-dom'

const NAV_ITEMS = [
  { label: 'SmokeCraft', icon: 'local_fire_department', path: '/smokecraft' },
  { label: 'Rewards',    icon: 'stars',                 path: '/smokecraft/leaderboard' },
  { label: 'Passport',   icon: 'book',                  path: '/passport-connection' },
  { label: 'CraftHub',   icon: 'apps',                  path: '/crafthub' },
]

export default function SmokeCraftBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  return (
    <>
      <style>{`
        @keyframes sc-nav-tap { 0%{transform:scale(1)} 40%{transform:scale(0.88)} 100%{transform:scale(1)} }
        .sc-nav-btn:active { animation: sc-nav-tap 0.18s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .sc-nav-btn:active { animation: none; }
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
          background: 'linear-gradient(180deg, rgba(5,3,1,0.82) 0%, rgba(5,3,1,0.97) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(201,168,76,0.18)',
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
              onClick={() => navigate(item.path)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 0 4px',
                touchAction: 'manipulation',
                WebkitTapHighlightColor: 'transparent',
                outline: 'none',
                color: isActive ? 'rgba(233,193,118,1)' : 'rgba(240,230,204,0.38)',
                transition: 'color 0.15s',
              }}
              onFocus={e => { e.currentTarget.style.outline = '2px solid rgba(233,193,118,0.6)'; e.currentTarget.style.outlineOffset = '-2px' }}
              onBlur={e => { e.currentTarget.style.outline = 'none' }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 22,
                  fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                  transition: 'font-variation-settings 0.15s',
                  lineHeight: 1,
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
