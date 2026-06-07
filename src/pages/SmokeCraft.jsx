import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const vitolas = [
  { name: 'Robusto',   ring: 50, length: '5"',   rating: 94, country: 'Nicaragua' },
  { name: 'Churchill', ring: 47, length: '7"',   rating: 96, country: 'Dominican' },
  { name: 'Toro',      ring: 52, length: '6"',   rating: 92, country: 'Honduras'  },
  { name: 'Lancero',   ring: 38, length: '7.5"', rating: 97, country: 'Cuba'      },
]

const modules = [
  ['Humidor Entry',        true ], ['Stick Selection',  true ],
  ['Draw Tension',         true ], ['Aging Calculator', true ],
  ['Leaf Provenance',      true ], ['Ash Quality',      true ],
  ['Blind Rating Mode',    false], ['Pairing Engine',   false],
]

const drawStats = [
  { label: 'Perfect Draw', pct: 72 },
  { label: 'Slight Tight', pct: 18 },
  { label: 'Plugged',      pct: 6  },
  { label: 'Too Open',     pct: 4  },
]

export default function SmokeCraft() {
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div variants={FADE} style={{ marginBottom: 40 }}>
        <div className="status-pill"><span className="status-dot" />Humidor Online — 48 Sticks Active</div>
      </motion.div>

      {/* Hero image */}
      <motion.div variants={FADE} style={{ width: '100%', marginBottom: 32 }}>
        <img src="/smokecraft.jpg" alt="SmokeCraft" className="hero-banner" style={{ height: 320, objectPosition: 'center 30%' }} />
      </motion.div>

      <motion.div variants={FADE} style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontFamily: '"Hanken Grotesk", sans-serif', fontSize: 'clamp(36px,4vw,56px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#D4AF37', marginBottom: 12 }}>
          SMOKECRAFT 360
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: 16, color: '#7A7A7A', maxWidth: 520, margin: '0 auto' }}>
          Cigar intelligence module. Aging analytics, draw precision tracking,
          and leaf provenance from seed to smoke.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, width: '100%', marginBottom: 24 }}>
        {[['48','Sticks'],['6','Aging'],['94','Avg Score'],['28','Screens']].map(([v,l]) => (
          <div key={l} className="glass-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 36, fontWeight: 600, color: '#D4AF37', lineHeight: 1, marginBottom: 8 }}>{v}</div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7A7A' }}>{l}</div>
          </div>
        ))}
      </motion.div>

      {/* Bento */}
      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, width: '100%', marginBottom: 24 }}>
        {/* Modules */}
        <div className="glass-card" style={{ padding: 28 }}>
          <div className="section-label">Module Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {modules.map(([label, done]) => (
              <div key={label} className="module-chip">
                <span style={{ fontFamily: 'Inter', fontSize: 13, color: '#E5E2E1' }}>{label}</span>
                {done
                  ? <CheckCircle2 size={14} style={{ color: '#D4AF37', flexShrink: 0 }} />
                  : <XCircle size={14} style={{ color: 'rgba(122,122,122,0.3)', flexShrink: 0 }} />
                }
              </div>
            ))}
          </div>
        </div>

        {/* Vitolas */}
        <div className="glass-card-gold" style={{ padding: 28 }}>
          <div className="section-label">Active Vitolas</div>
          {vitolas.map(({ name, ring, length, rating, country }) => (
            <div key={name} className="data-row">
              <div>
                <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 15, color: '#E5E2E1' }}>{name}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', marginTop: 2 }}>Ring {ring} · {length} · {country}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 32, fontWeight: 600, color: '#D4AF37', lineHeight: 1 }}>{rating}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>pts</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Draw tension */}
      <motion.div variants={FADE} className="glass-card" style={{ width: '100%', padding: 32 }}>
        <div className="section-label">Draw Tension Analytics</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
          {drawStats.map(({ label, pct }, i) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 42,
                color: i === 0 ? '#D4AF37' : i === 1 ? 'rgba(212,175,55,0.55)' : i === 2 ? '#7A4A4A' : '#555',
                lineHeight: 1, marginBottom: 6,
              }}>{pct}%</div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{label}</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: i === 0 ? '#D4AF37' : i === 1 ? 'rgba(212,175,55,0.4)' : i === 2 ? '#7A4A4A' : '#555' }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
