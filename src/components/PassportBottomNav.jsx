import { useNavigate, useLocation } from 'react-router-dom'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const TABS = [
  { id: 'hub',       icon: 'home',            label: 'Home',      to: '/passport'            },
  { id: 'stamps',    icon: 'menu_book',        label: 'Passport',  to: '/passport/stamps'     },
  { id: 'directory', icon: 'contacts',         label: 'Directory', to: '/passport/directory'  },
  { id: 'scan',      icon: 'qr_code_scanner',  label: 'Scan',      to: '/passport/scan', scan: true },
  { id: 'events',    icon: 'event',            label: 'Events',    to: '/passport/events'     },
  { id: 'connections', icon: 'hub',            label: 'Connect',   to: '/passport/connections'},
  { id: 'profile',   icon: 'person',           label: 'Profile',   to: '/passport/profile'    },
]

export default function PassportBottomNav({ active }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const currentId = active || TABS.find(t => t.to === location.pathname)?.id || 'hub'

  return (
    <nav
      className="fixed bottom-0 w-full z-50 flex items-end border-t"
      style={{
        background: 'rgba(8,5,2,0.96)',
        borderColor: 'rgba(233,193,118,0.18)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.7)',
        height: 76,
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
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.92) translateY(-6px)'}
              onTouchEnd={e => { e.currentTarget.style.transform = 'translateY(-10px)'; navigate(tab.to) }}
              onTouchCancel={e => e.currentTarget.style.transform = 'translateY(-10px)'}
              className="flex-1 flex flex-col items-center justify-center relative"
              style={{ minHeight: 72 }}
            >
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 54,
                  height: 54,
                  background: 'linear-gradient(135deg, #e9c176, #c5a059)',
                  boxShadow: '0 0 24px rgba(233,193,118,0.55), 0 4px 12px rgba(0,0,0,0.5)',
                  transform: 'translateY(-10px)',
                  marginBottom: 2,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#0a0605', ...FILL1 }}>{tab.icon}</span>
              </div>
              <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: '#e9c176', marginTop: -8 }}>{tab.label}</span>
            </button>
          )
        }
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.to)}
            onTouchStart={e => e.currentTarget.style.opacity = '0.6'}
            onTouchEnd={e => { e.currentTarget.style.opacity = ''; navigate(tab.to) }}
            onTouchCancel={e => e.currentTarget.style.opacity = ''}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90 relative"
            style={{ minHeight: 72, opacity: isActive ? 1 : 0.45 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22, color: isActive ? '#e9c176' : 'rgba(255,255,255,0.6)', ...(isActive ? FILL1 : {}) }}>{tab.icon}</span>
            <span className="text-[9px] uppercase tracking-wider font-bold" style={{ color: isActive ? '#e9c176' : 'rgba(255,255,255,0.4)' }}>{tab.label}</span>
            {isActive && <div className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: '#e9c176' }} />}
          </button>
        )
      })}
    </nav>
  )
}
