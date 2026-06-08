import { useNavigate, useLocation } from 'react-router-dom'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const TABS = [
  { id: 'hub',         icon: 'home',            label: 'Home',       to: '/passport'             },
  { id: 'stamps',      icon: 'menu_book',        label: 'Passport',   to: '/passport/stamps'      },
  { id: 'directory',   icon: 'contacts',         label: 'Directory',  to: '/passport/directory'   },
  { id: 'scan',        icon: 'qr_code_scanner',  label: 'Scan',       to: '/passport/scan', scan: true },
  { id: 'events',      icon: 'event',            label: 'Events',     to: '/passport/events'      },
  { id: 'connections', icon: 'hub',              label: 'Connections',to: '/passport/connections' },
  { id: 'messages',    icon: 'chat_bubble',      label: 'Messages',   to: '/passport/connections' },
  { id: 'profile',     icon: 'person',           label: 'Profile',    to: '/passport/profile'     },
]

export default function PassportBottomNav({ active }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const currentId = active || TABS.find(t => t.to === location.pathname)?.id || 'hub'

  return (
    <nav
      className="fixed bottom-0 w-full z-50 flex items-end border-t"
      style={{
        background: 'rgba(6,4,2,0.97)',
        borderColor: 'rgba(233,193,118,0.2)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.8)',
        height: 72,
        paddingBottom: 4,
        backdropFilter: 'blur(20px)',
      }}
    >
      {TABS.map(tab => {
        const isActive = currentId === tab.id
        if (tab.scan) {
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.to)}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.9) translateY(-8px)'}
              onTouchEnd={e => { e.currentTarget.style.transform = 'translateY(-12px)'; navigate(tab.to) }}
              onTouchCancel={e => e.currentTarget.style.transform = 'translateY(-12px)'}
              className="flex-1 flex flex-col items-center justify-center"
              style={{ minHeight: 72 }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 52,
                  height: 52,
                  background: 'linear-gradient(135deg,#e9c176,#c5a059)',
                  boxShadow: '0 0 20px rgba(233,193,118,0.6),0 4px 12px rgba(0,0,0,0.6)',
                  transform: 'translateY(-12px)',
                  marginBottom: 2,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#0a0605', ...FILL1 }}>{tab.icon}</span>
              </div>
              <span className="text-[8px] uppercase tracking-wider font-bold" style={{ color: '#e9c176', marginTop: -10 }}>{tab.label}</span>
            </button>
          )
        }
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.to)}
            onTouchStart={e => e.currentTarget.style.opacity = '0.55'}
            onTouchEnd={e => { e.currentTarget.style.opacity = ''; navigate(tab.to) }}
            onTouchCancel={e => e.currentTarget.style.opacity = ''}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all active:scale-90 relative"
            style={{ minHeight: 72, opacity: isActive ? 1 : 0.42 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: isActive ? '#e9c176' : 'rgba(255,255,255,0.65)', ...(isActive ? FILL1 : {}) }}>{tab.icon}</span>
            <span className="text-[8px] uppercase tracking-wider font-bold leading-none" style={{ color: isActive ? '#e9c176' : 'rgba(255,255,255,0.4)' }}>{tab.label}</span>
            {isActive && <div className="absolute bottom-1.5 w-1 h-1 rounded-full" style={{ background: '#e9c176' }} />}
          </button>
        )
      })}
    </nav>
  )
}
