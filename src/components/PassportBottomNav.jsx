import { useNavigate, useLocation } from 'react-router-dom'

const FILL1 = { fontVariationSettings: "'FILL' 1" }

const TABS = [
  { id: 'hub',         icon: 'home',         label: 'Hub',        to: '/passport'              },
  { id: 'stamps',      icon: 'menu_book',     label: 'Passport',   to: '/passport/stamps'       },
  { id: 'scan',        icon: 'qr_code_scanner', label: 'Scan',     to: '/passport/scan',  scan: true },
  { id: 'directory',   icon: 'contacts',      label: 'Directory',  to: '/passport/directory'    },
  { id: 'connections', icon: 'hub',           label: 'Connect',    to: '/passport/connections'  },
  { id: 'events',      icon: 'event',         label: 'Events',     to: '/passport/events'       },
  { id: 'benefits',    icon: 'stars',         label: 'Benefits',   to: '/passport/benefits'     },
  { id: 'profile',     icon: 'person',        label: 'Profile',    to: '/passport/profile'      },
]

export default function PassportBottomNav({ active }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const currentId = active || TABS.find(t => t.to === location.pathname)?.id || 'hub'

  return (
    <nav
      className="fixed bottom-0 w-full z-50 backdrop-blur-2xl border-t flex items-end"
      style={{
        background: 'rgba(8,6,4,0.92)',
        borderColor: 'rgba(233,193,118,0.18)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.5)',
        height: 76,
        paddingBottom: 4,
      }}
    >
      {TABS.map(tab => {
        const isActive = currentId === tab.id
        if (tab.scan) {
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.to)}
              onTouchStart={e => e.currentTarget.style.transform = 'scale(0.92)'}
              onTouchEnd={e => { e.currentTarget.style.transform = ''; navigate(tab.to) }}
              className="flex-1 flex flex-col items-center justify-center relative"
              style={{ minHeight: 72 }}
            >
              <div
                className="flex items-center justify-center rounded-full transition-all duration-200"
                style={{
                  width: 52,
                  height: 52,
                  background: 'linear-gradient(135deg, #e9c176, #c5a059)',
                  boxShadow: '0 0 20px rgba(233,193,118,0.5)',
                  marginBottom: 2,
                  transform: 'translateY(-10px)',
                }}
              >
                <span className="material-symbols-outlined text-on-primary" style={{ fontSize: 24, ...FILL1 }}>{tab.icon}</span>
              </div>
              <span className="font-label-sm text-[9px] uppercase tracking-wider" style={{ color: '#e9c176', marginTop: -8 }}>{tab.label}</span>
            </button>
          )
        }
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.to)}
            onTouchStart={e => e.currentTarget.style.opacity = '0.7'}
            onTouchEnd={e => { e.currentTarget.style.opacity = ''; navigate(tab.to) }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90"
            style={{ minHeight: 72, opacity: isActive ? 1 : 0.5 }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22, color: isActive ? '#e9c176' : 'rgba(255,255,255,0.6)', ...(isActive ? FILL1 : {}) }}
            >{tab.icon}</span>
            <span
              className="text-[9px] uppercase tracking-wider font-bold"
              style={{ color: isActive ? '#e9c176' : 'rgba(255,255,255,0.45)' }}
            >{tab.label}</span>
            {isActive && (
              <div className="absolute bottom-1 rounded-full" style={{ width: 4, height: 4, background: '#e9c176' }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}
