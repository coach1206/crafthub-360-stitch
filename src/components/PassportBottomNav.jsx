import { useNavigate, useLocation } from 'react-router-dom'
import craftImages from '../lib/craftImages.js'

const TABS = [
  { id:'hub',         label:'Home',        to:'/passport',              img: craftImages.badges.home        },
  { id:'stamps',      label:'Passport',    to:'/passport/stamps',       img: craftImages.badges.passport    },
  { id:'directory',   label:'Directory',   to:'/passport/directory',    img: craftImages.badges.directory   },
  { id:'scan',        label:'Scan',        to:'/passport/scan',         scan: true                          },
  { id:'events',      label:'Events',      to:'/passport/events',       img: craftImages.badges.events      },
  { id:'connections', label:'Connect',     to:'/passport/connections',  img: craftImages.badges.connections },
  { id:'messages',    label:'Messages',    to:'/passport/connections',  img: craftImages.badges.messages    },
  { id:'profile',     label:'Profile',     to:'/passport/profile',      img: craftImages.badges.profile     },
]

const DEFAULT_FALLBACK = craftImages.fallbacks.lounge

export default function PassportBottomNav({ active }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const currentId = active || TABS.find(t => t.to === location.pathname)?.id || 'hub'

  return (
    <nav
      className="fixed bottom-0 w-full z-50 flex items-end"
      style={{
        background: 'rgba(6,4,2,0.97)',
        borderTop: '1px solid rgba(233,193,118,0.15)',
        boxShadow: '0 -4px 32px rgba(0,0,0,0.85)',
        height: 76,
        paddingBottom: 6,
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
              onTouchStart={e => { e.currentTarget.querySelector('.scan-coin').style.transform = 'scale(0.88) translateY(-10px)' }}
              onTouchEnd={e => { e.currentTarget.querySelector('.scan-coin').style.transform = 'scale(1) translateY(-16px)'; navigate(tab.to) }}
              onTouchCancel={e => { e.currentTarget.querySelector('.scan-coin').style.transform = 'scale(1) translateY(-16px)' }}
              className="flex-1 flex flex-col items-center justify-center"
              style={{ minHeight: 76 }}
            >
              <div
                className="scan-coin flex items-center justify-center rounded-full"
                style={{
                  width: 56,
                  height: 56,
                  background: 'linear-gradient(135deg,#8b6914,#e9c176,#f5d98a,#c5a059,#8b6914)',
                  boxShadow: '0 0 24px rgba(233,193,118,0.7), 0 6px 16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.3)',
                  transform: 'translateY(-16px)',
                  transition: 'transform 0.15s ease',
                  border: '2px solid rgba(255,255,255,0.2)',
                  marginBottom: 2,
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 26, color: '#0a0605', fontVariationSettings:"'FILL' 1" }}>qr_code_scanner</span>
              </div>
              <span style={{ fontFamily:'"JetBrains Mono",monospace', fontSize: 8, letterSpacing:'0.14em', textTransform:'uppercase', fontWeight:700, color:'#e9c176', marginTop: -8 }}>Scan</span>
            </button>
          )
        }

        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.to)}
            onTouchStart={e => { e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.transform = 'scale(0.92)' }}
            onTouchEnd={e => { e.currentTarget.style.opacity = ''; e.currentTarget.style.transform = ''; navigate(tab.to) }}
            onTouchCancel={e => { e.currentTarget.style.opacity = ''; e.currentTarget.style.transform = '' }}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 relative transition-all"
            style={{ minHeight: 76 }}
          >
            {/* Image medallion badge */}
            <div
              style={{
                width: isActive ? 38 : 34,
                height: isActive ? 38 : 34,
                borderRadius: '50%',
                overflow: 'hidden',
                border: isActive ? '2px solid rgba(233,193,118,0.9)' : '1.5px solid rgba(255,255,255,0.12)',
                boxShadow: isActive ? '0 0 14px rgba(233,193,118,0.5), 0 2px 8px rgba(0,0,0,0.6)' : '0 2px 6px rgba(0,0,0,0.5)',
                transition: 'all 0.2s',
                flexShrink: 0,
                position: 'relative',
              }}
            >
              <img
                src={tab.img || DEFAULT_FALLBACK}
                alt={tab.label}
                onError={e => { e.currentTarget.src = DEFAULT_FALLBACK }}
                style={{ width:'100%', height:'100%', objectFit:'cover', filter: isActive ? 'none' : 'brightness(0.45) saturate(0.5)' }}
              />
              {/* Active gold overlay shimmer */}
              {isActive && (
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,rgba(233,193,118,0.15),transparent)', borderRadius:'50%' }} />
              )}
            </div>

            <span
              style={{
                fontFamily:'"JetBrains Mono",monospace',
                fontSize: 7.5,
                letterSpacing:'0.1em',
                textTransform:'uppercase',
                fontWeight: 700,
                lineHeight: 1,
                color: isActive ? '#e9c176' : 'rgba(255,255,255,0.28)',
                transition: 'color 0.2s',
              }}
            >
              {tab.label}
            </span>

            {isActive && (
              <div
                style={{
                  position:'absolute',
                  bottom: 4,
                  width: 20,
                  height: 2,
                  borderRadius: 1,
                  background: 'linear-gradient(90deg,transparent,#e9c176,transparent)',
                }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
