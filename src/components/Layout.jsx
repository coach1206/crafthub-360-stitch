import { NavLink } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import {
  Home, LayoutGrid, Flame, GlassWater, Beer, Wine,
  BadgeCheck, ShoppingCart, UtensilsCrossed, Settings,
} from 'lucide-react'

const headerLinks = [
  { to: '/',           label: 'Home'      },
  { to: '/crafthub',   label: 'CraftHub'  },
  { to: '/smokecraft', label: 'Smoke'     },
  { to: '/pourcraft',  label: 'Pour'      },
  { to: '/beercraft',  label: 'Beer'      },
  { to: '/winecraft',  label: 'Wine'      },
  { to: '/passport',   label: 'Passport'  },
  { to: '/pos',        label: 'POS3'      },
  { to: '/eat',        label: 'EAT'       },
]

const tabs = [
  { to: '/',           Icon: Home,             label: 'Home'     },
  { to: '/crafthub',   Icon: LayoutGrid,       label: 'CraftHub' },
  { to: '/smokecraft', Icon: Flame,            label: 'Smoke'    },
  { to: '/passport',   Icon: BadgeCheck,       label: 'Passport' },
  { to: '/pos',        Icon: ShoppingCart,     label: 'POS3'     },
  { to: '/eat',        Icon: UtensilsCrossed,  label: 'EAT'      },
]

export default function Layout() {
  return (
    <div style={{ minHeight: '100vh', background: '#010101', color: '#E5E2E1', overflowX: 'hidden' }}>

      {/* Fixed full-bleed background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <img
          src="/background-lounge-airy.jpg"
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(1,1,1,0.55) 0%, rgba(1,1,1,0.3) 40%, rgba(1,1,1,0.85) 100%)',
        }} />
      </div>

      {/* Fixed top header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 64,
        background: 'rgba(1,1,1,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(122,122,122,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/crafthub-gold.jpg" alt="CraftHub 360"
            style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '50%', border: '1px solid rgba(212,175,55,0.4)' }}
          />
          <span style={{
            fontFamily: '"Hanken Grotesk", sans-serif',
            fontWeight: 700, fontSize: 16,
            color: '#D4AF37', letterSpacing: '-0.01em',
          }}>
            CraftHub 360
          </span>
        </div>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {headerLinks.map(({ to, label }) => (
            <NavLink
              key={to} to={to} end={to === '/'}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="btn-ghost" style={{ height: 32, padding: '0 12px' }}>
          <Settings size={14} />
        </button>
      </header>

      {/* Scrollable content */}
      <main style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1440, margin: '0 auto',
        padding: '104px 40px 120px',
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>

      {/* Fixed bottom tab bar */}
      <footer style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(1,1,1,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(122,122,122,0.12)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        padding: '10px 0 14px',
      }}>
        {tabs.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </footer>
    </div>
  )
}
