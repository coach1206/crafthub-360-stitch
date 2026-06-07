import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/',           icon: 'home',          label: 'Home' },
  { to: '/crafthub',   icon: 'dashboard_customize', label: 'CraftHub' },
  { to: '/smokecraft', icon: 'local_fire_department', label: 'Smoke' },
  { to: '/passport',   icon: 'badge',         label: 'Passport' },
  { to: '/eat',        icon: 'restaurant',    label: 'EAT' },
]

export default function Nav() {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        className="obsidian-glass"
        style={{
          width: '100%',
          maxWidth: 430,
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '8px 4px',
        }}
      >
        {tabs.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 14px',
                  borderRadius: 12,
                  background: isActive ? 'rgba(212,175,55,0.1)' : 'transparent',
                  transition: 'background 0.2s',
                }}
              >
                <span
                  className={`material-symbols-outlined ${isActive ? 'fill-icon' : ''}`}
                  style={{
                    fontSize: 22,
                    color: isActive ? '#f2ca50' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {icon}
                </span>
                <span
                  className="font-caps"
                  style={{
                    fontSize: 9,
                    color: isActive ? '#f2ca50' : 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  {label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
