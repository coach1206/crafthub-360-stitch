import { Outlet, NavLink } from 'react-router-dom'
import { Settings, LayoutDashboard, Home, Flame, Badge, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import { motion } from 'framer-motion'

const BG_IMG = 'https://lh3.googleusercontent.com/aida/AP1WRLtj5JwkrPxrixCHOG-zYc0I132qSqfPBoOMSk6vfHero4WAiBipQc-lZT7hXU1GpL6px8LH9kYjGodZhH3N8nj4PPbYOxr9GAZPkrO0051iTZg7S8ugdj8Jjhb1Nk1ypTQVWHqE6FAxbE10qnVi4vZsWlx-ERtDmWU97juw1txqVGwGBCCyPBZ0d56Ipsq-2AoFCMCvEkr3KBKpxovN6AFO6VxoRAIzzw3xk5lxCphgeEU6xTGCqGzLaag'

const headerLinks = [
  { to: '/',           label: 'Home'     },
  { to: '/crafthub',   label: 'CraftHub' },
  { to: '/smokecraft', label: 'Smoke'    },
  { to: '/passport',   label: 'Passport' },
  { to: '/pos',        label: 'POS3'     },
  { to: '/eat',        label: 'EAT'      },
]

const navTabs = [
  { to: '/',           Icon: Home,              label: 'Home'     },
  { to: '/crafthub',   Icon: LayoutDashboard,   label: 'CraftHub' },
  { to: '/smokecraft', Icon: Flame,             label: 'Smoke'    },
  { to: '/passport',   Icon: Badge,             label: 'Passport' },
  { to: '/pos',        Icon: ShoppingCart,      label: 'POS3'     },
  { to: '/eat',        Icon: UtensilsCrossed,   label: 'EAT'      },
]

export default function Layout() {
  return (
    <div className="min-h-screen bg-background text-on-background overflow-x-hidden font-body">

      {/* Atmospheric background */}
      <div className="fixed inset-0 z-0">
        <img
          src={BG_IMG}
          alt=""
          className="w-full h-full object-cover opacity-60 blur-sm"
          style={{ transform: 'scale(1.05)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/90" />
      </div>

      {/* Fixed top header */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 h-20 border-b border-outline-variant/30"
        style={{ background: 'rgba(19,19,19,0.8)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
      >
        <div className="flex items-center gap-3">
          <LayoutDashboard className="text-primary" size={26} />
          <span className="font-display text-xl font-bold tracking-tight text-primary">
            CraftHub 360 Admin
          </span>
        </div>

        <div className="flex items-center gap-8">
          <nav className="hidden md:flex items-center gap-8">
            {headerLinks.map(({ to, label }) => (
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
          <button className="p-2 rounded-full text-primary transition-colors hover:bg-primary/10">
            <Settings size={22} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 w-full max-w-screen-xl mx-auto px-16 pt-28 pb-32 min-h-screen no-scroll overflow-y-auto">
        <Outlet />
      </main>

      {/* Bottom nav bar */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 pb-4 pt-2 border-t border-outline-variant/20 rounded-t-xl"
        style={{ background: 'rgba(42,42,42,0.92)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)' }}
      >
        {navTabs.map(({ to, Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </footer>
    </div>
  )
}
