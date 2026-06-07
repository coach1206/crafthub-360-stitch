import { Outlet } from 'react-router-dom'
import Nav from './Nav.jsx'

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center' }}>
      {/* Bokeh background */}
      <div className="bokeh-bg">
        <div className="bokeh-blob" style={{ width: 320, height: 320, top: '15%', left: '5%' }} />
        <div className="bokeh-blob" style={{ width: 200, height: 200, top: '55%', left: '70%', opacity: 0.22 }} />
        <div className="bokeh-blob" style={{ width: 260, height: 260, top: '75%', left: '20%', opacity: 0.18 }} />
      </div>

      {/* App shell — mobile-first, max 430px */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 430,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 80,
        }}
      >
        {/* Global top header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px 8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="0"  y="0"  width="12" height="12" rx="2" fill="#d4af37" />
              <rect x="16" y="0"  width="12" height="12" rx="2" fill="#d4af37" opacity="0.6" />
              <rect x="0"  y="16" width="12" height="12" rx="2" fill="#d4af37" opacity="0.6" />
              <rect x="16" y="16" width="12" height="12" rx="2" fill="#d4af37" />
            </svg>
            <div>
              <div
                className="font-caps"
                style={{ fontSize: 8, color: 'rgba(212,175,55,0.6)', textTransform: 'uppercase', letterSpacing: '0.2em', lineHeight: 1 }}
              >
                AUTHORITY REAL
              </div>
              <div className="font-caps" style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
                CraftHub <span style={{ color: '#f2ca50' }}>360</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              className="obsidian-glass"
              style={{ borderRadius: 10, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid rgba(212,175,55,0.2)' }}
            >
              <span className="font-caps" style={{ fontSize: 9, color: 'rgba(212,175,55,0.8)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>FOUNDER</span>
              <span style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />
              <span className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>LEVEL 0</span>
            </div>
            <button
              className="gold-btn"
              style={{ borderRadius: 10, padding: '7px 12px' }}
            >
              <span className="font-caps" style={{ fontSize: 10, fontWeight: 600, color: '#000', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                GRAND LOUNGE
              </span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <div className="page-scroll" style={{ flex: 1, padding: '0 0 8px' }}>
          <Outlet />
        </div>
      </div>

      <Nav />
    </div>
  )
}
