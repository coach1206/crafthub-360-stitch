import { NavLink } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import {
  Home, LayoutGrid, Flame, GlassWater, Beer, Wine,
  BadgeCheck, ShoppingCart, UtensilsCrossed,
} from 'lucide-react'

const tabs = [
  { to: '/',           Icon: Home,             label: 'Home'     },
  { to: '/crafthub',   Icon: LayoutGrid,       label: 'Hub'      },
  { to: '/smokecraft', Icon: Flame,            label: 'Smoke'    },
  { to: '/pourcraft',  Icon: GlassWater,       label: 'Pour'     },
  { to: '/beercraft',  Icon: Beer,             label: 'Beer'     },
  { to: '/winecraft',  Icon: Wine,             label: 'Wine'     },
  { to: '/passport',   Icon: BadgeCheck,       label: 'Pass'     },
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
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.28 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(1,1,1,0.6) 0%, rgba(1,1,1,0.2) 50%, rgba(1,1,1,0.9) 100%)',
        }} />
      </div>

      {/* Compact header */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 56,
        background: 'rgba(1,1,1,0.8)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(212,175,55,0.12)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/crafthub-gold.jpg" alt="CraftHub 360"
            style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: '50%', border: '1.5px solid rgba(212,175,55,0.5)' }}
          />
          <span style={{
            fontFamily: '"Hanken Grotesk", sans-serif',
            fontWeight: 700, fontSize: 15, color: '#D4AF37', letterSpacing: '-0.01em',
          }}>CraftHub 360</span>
        </div>

        {/* Live pulse indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="status-dot" />
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            LIVE
          </span>
        </div>
      </header>

      {/* Main scrollable content */}
      <main style={{
        position: 'relative', zIndex: 10,
        paddingTop: 56,
        paddingBottom: 88,
        minHeight: '100vh',
      }}>
        <Outlet />
      </main>

      {/* Bottom tab bar — large touch targets */}
      <footer style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(1,1,1,0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(122,122,122,0.15)',
        display: 'flex', justifyContent: 'space-around', alignItems: 'center',
        height: 80,
      }}>
        {tabs.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `bottom-tab${isActive ? ' active' : ''}`}
            style={{ minWidth: 56 }}
          >
            <Icon size={24} />
            <span style={{ fontSize: 9, letterSpacing: '0.08em' }}>{label}</span>
          </NavLink>
        ))}
      </footer>
    </div>
  )
}
