import { Outlet, NavLink } from 'react-router-dom'

const BG_IMG = 'https://lh3.googleusercontent.com/aida/AP1WRLtj5JwkrPxrixCHOG-zYc0I132qSqfPBoOMSk6vfHero4WAiBipQc-lZT7hXU1GpL6px8LH9kYjGodZhH3N8nj4PPbYOxr9GAZPkrO0051iTZg7S8ugdj8Jjhb1Nk1ypTQVWHqE6FAxbE10qnVi4vZsWlx-ERtDmWU97juw1txqVGwGBCCyPBZ0d56Ipsq-2AoFCMCvEkr3KBKpxovN6AFO6VxoRAIzzw3xk5lxCphgeEU6xTGCqGzLaag'

const navTabs = [
  { to: '/',           icon: 'home',                    label: 'Home'      },
  { to: '/crafthub',   icon: 'dashboard_customize',     label: 'CraftHub'  },
  { to: '/smokecraft', icon: 'local_fire_department',   label: 'Smoke'     },
  { to: '/passport',   icon: 'badge',                   label: 'Passport'  },
  { to: '/pos',        icon: 'point_of_sale',           label: 'POS3'      },
  { to: '/eat',        icon: 'restaurant',              label: 'EAT'       },
]

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', overflow: 'hidden' }}>

      {/* ── Atmospheric background ── */}
      <div className="stitch-bg">
        <img src={BG_IMG} alt="" />
        <div className="stitch-bg-overlay" />
      </div>

      {/* ── Fixed top header ── */}
      <header className="stitch-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>
            dashboard_customize
          </span>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: 22, fontWeight: 700,
            letterSpacing: '-0.01em',
            color: 'var(--primary)',
          }}>
            CraftHub 360 Admin
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <nav style={{ display: 'flex', gap: 32 }}>
            {navTabs.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) => `header-nav-link${isActive ? ' active' : ''}`}
              >
                {label}
              </NavLink>
            ))}
          </nav>
          <button
            style={{
              background: 'none', border: 'none',
              padding: 8, borderRadius: '50%',
              display: 'flex', alignItems: 'center',
              color: 'var(--primary)',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212,175,55,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span className="material-symbols-outlined text-primary">settings_suggest</span>
          </button>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="stitch-main page-content" style={{ minHeight: '100vh' }}>
        <Outlet />
      </main>

      {/* ── Bottom nav (always visible for navigation) ── */}
      <footer className="stitch-footer">
        {navTabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </footer>
    </div>
  )
}
