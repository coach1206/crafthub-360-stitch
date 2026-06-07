import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

const FADE = { hidden: { opacity: 0, scale: 0.97 }, show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: 'easeOut' } } }
const STAGGER = { show: { transition: { staggerChildren: 0.07 } } }

const modules = [
  { path: '/smokecraft', img: '/smokecraft.jpg',  label: 'SmokeCraft 360',   tag: 'CIGAR INTELLIGENCE',  screens: 28, active: true  },
  { path: '/pourcraft',  img: '/pourcraft.jpg',   label: 'PourCraft 360',    tag: 'COCKTAIL COMMAND',    screens: 22, active: true  },
  { path: '/beercraft',  img: '/beercraft.jpg',   label: 'BeerCraft 360',    tag: 'TAP & BREW',          screens: 18, active: true  },
  { path: '/winecraft',  img: '/winecraft.jpg',   label: 'WineCraft 360',    tag: 'CELLAR INTELLIGENCE', screens: 24, active: true  },
  { path: '/passport',   img: '/passport.jpg',    label: '360 Passport',     tag: 'NFC MEMBER ACCESS',   screens: 16, active: true  },
  { path: '/pos',        img: '/pos3.jpg',         label: 'POS 3 Terminal',  tag: 'UNIFIED CHECKOUT',    screens: 14, active: true  },
  { path: '/eat',        img: '/eat-command.jpg', label: 'E.A.T. Command',   tag: 'VENUE INTELLIGENCE',  screens: 12, active: true  },
]

export default function CraftHub() {
  const navigate = useNavigate()

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}
      style={{ padding: '24px 16px' }}
    >
      {/* Header */}
      <motion.div variants={FADE} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/crafthub-gold.jpg" alt="CraftHub"
            style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: '50%', border: '2px solid rgba(212,175,55,0.5)', boxShadow: '0 0 20px rgba(212,175,55,0.25)', flexShrink: 0 }}
          />
          <div>
            <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 28, color: '#D4AF37', letterSpacing: '-0.02em', lineHeight: 1 }}>
              CRAFTHUB 360
            </div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>
              7 Modules · 134 Screens · All Systems Live
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats strip */}
      <motion.div variants={FADE} style={{ display: 'flex', gap: 10, marginBottom: 24, overflowX: 'auto', paddingBottom: 4 }}>
        {[['134','Screens'],['7','Modules'],['100%','Sync'],['14ms','Latency']].map(([v,l]) => (
          <div key={l} className="glass-card" style={{ padding: '12px 20px', flexShrink: 0, textAlign: 'center', minWidth: 88 }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 22, color: '#D4AF37', lineHeight: 1, marginBottom: 4 }}>{v}</div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</div>
          </div>
        ))}
      </motion.div>

      {/* Module portal grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {modules.map(({ path, img, label, tag, screens, active }) => (
          <motion.div key={path} variants={FADE}>
            <motion.div
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(path)}
              style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', height: 200 }}
            >
              {/* Image */}
              <img src={img} alt={label}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              {/* Gradient overlay */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(1,1,1,0.95) 0%, rgba(1,1,1,0.3) 60%, transparent 100%)',
              }} />

              {/* Active badge */}
              {active && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)',
                  padding: '4px 10px', borderRadius: 20,
                  border: '1px solid rgba(212,175,55,0.3)',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 6px rgba(212,175,55,0.8)' }} />
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>LIVE</span>
                </div>
              )}

              {/* Screen count badge */}
              <div style={{
                position: 'absolute', top: 12, left: 12,
                background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)',
                padding: '4px 10px', borderRadius: 20,
                border: '1px solid rgba(122,122,122,0.25)',
              }}>
                <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.06em' }}>{screens} screens</span>
              </div>

              {/* Bottom content */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 16px 14px' }}>
                <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 17, color: '#E5E2E1', lineHeight: 1.1, marginBottom: 4 }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{tag}</div>
                  <ChevronRight size={16} style={{ color: '#D4AF37' }} />
                </div>
              </div>

              {/* Gold border */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: 16, border: '1px solid rgba(212,175,55,0.2)', pointerEvents: 'none' }} />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
