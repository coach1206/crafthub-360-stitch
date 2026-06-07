import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.07 } } }

const modules = [
  { path: '/smokecraft', img: '/smokecraft.jpg',   label: 'SmokeCraft 360',   sub: 'Cigar & Tobacco Intelligence',   screens: 28 },
  { path: '/pourcraft',  img: '/pourcraft.jpg',    label: 'PourCraft 360',    sub: 'Cocktail Command Center',         screens: 22 },
  { path: '/beercraft',  img: '/beercraft.jpg',    label: 'BeerCraft 360',    sub: 'Brew & Palate Intelligence',      screens: 18 },
  { path: '/winecraft',  img: '/winecraft.jpg',    label: 'WineCraft 360',    sub: 'Cellar Management System',        screens: 24 },
  { path: '/passport',   img: '/passport.jpg',     label: '360 Passport',     sub: 'Member Identity & Access',        screens: 16 },
  { path: '/pos',        img: '/pos3.jpg',         label: 'POS 3 Terminal',   sub: 'Unified Point of Sale',           screens: 14 },
  { path: '/eat',        img: '/eat-command.jpg',  label: 'E.A.T. Command',   sub: 'Venue Intelligence System',       screens: 12 },
]

const stats = [
  ['134', 'Total Screens'],
  ['7',   'Active Modules'],
  ['100%','Sync Status'],
  ['14ms','Cloud Latency'],
]

export default function CraftHub() {
  const navigate = useNavigate()

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      {/* Status */}
      <motion.div variants={FADE} style={{ marginBottom: 40 }}>
        <div className="status-pill">
          <span className="status-dot" />
          All Systems Online — 134 Screens Compiled
        </div>
      </motion.div>

      {/* Hero image + title */}
      <motion.div variants={FADE} style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
          <img src="/crafthub-gold.jpg" alt="CraftHub 360"
            style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%', border: '2px solid rgba(212,175,55,0.5)', boxShadow: '0 0 32px rgba(212,175,55,0.2)' }}
          />
        </div>
        <h1 style={{
          fontFamily: '"Hanken Grotesk", sans-serif',
          fontSize: 'clamp(36px, 4vw, 60px)', fontWeight: 700,
          letterSpacing: '-0.02em', color: '#D4AF37', marginBottom: 12,
        }}>
          CRAFTHUB 360
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: 16, color: '#7A7A7A', maxWidth: 480, margin: '0 auto' }}>
          Full ecosystem dashboard. Seven intelligence modules, 134 screens, one unified production tier.
        </p>
      </motion.div>

      {/* Ecosystem stats */}
      <motion.div variants={FADE} style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16, width: '100%', marginBottom: 48,
      }}>
        {stats.map(([v, l]) => (
          <div key={l} className="glass-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 36, fontWeight: 600,
              color: '#D4AF37', lineHeight: 1, marginBottom: 8,
            }}>{v}</div>
            <div style={{
              fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
              letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7A7A',
            }}>{l}</div>
          </div>
        ))}
      </motion.div>

      {/* Module grid */}
      <motion.div variants={FADE} style={{ width: '100%' }}>
        <div className="section-label" style={{ marginBottom: 20 }}>Module Directory</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {modules.map(({ path, img, label, sub, screens }) => (
            <div key={path}
              className="glass-card module-card"
              onClick={() => navigate(path)}
            >
              <div style={{ overflow: 'hidden', height: 180 }}>
                <img src={img} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ padding: '18px 20px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    fontFamily: '"Hanken Grotesk", sans-serif', fontWeight: 600, fontSize: 16,
                    color: '#E5E2E1', marginBottom: 4,
                  }}>{label}</div>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace', fontSize: 10,
                    color: '#7A7A7A', letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{sub}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                  <div style={{
                    fontFamily: '"JetBrains Mono", monospace', fontWeight: 600,
                    fontSize: 28, color: '#D4AF37', lineHeight: 1,
                  }}>{screens}</div>
                  <div style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>screens</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
