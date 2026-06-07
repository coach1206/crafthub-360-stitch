import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const cellar = [
  { name: 'Opus One 2018',        region: 'Napa Valley', varietal: 'Cabernet Blend', score: 98, peak: '2028–2040' },
  { name: 'Barolo Riserva 2016',  region: 'Piedmont',    varietal: 'Nebbiolo',       score: 96, peak: '2026–2035' },
  { name: 'Pomerol Reserve 2019', region: 'Bordeaux',    varietal: 'Merlot',         score: 94, peak: '2025–2030' },
  { name: 'Sassicaia 2017',       region: 'Tuscany',     varietal: 'Cabernet Sauv',  score: 97, peak: '2027–2038' },
]

const modules = [
  ['Cellar Map',     true ], ['Vintage Tracker', true ],
  ['Peak Window',    true ], ['Provenance Log',  true ],
  ['Decant Timer',   true ], ['Pairing Engine',  true ],
  ['Auction Watch',  false], ['Futures Tracker', false],
]

const regions = [
  { name: 'Napa Valley', pct: 34 },
  { name: 'Bordeaux',    pct: 25 },
  { name: 'Piedmont',    pct: 23 },
  { name: 'Tuscany',     pct: 18 },
]

export default function WineCraft() {
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div variants={FADE} style={{ marginBottom: 40 }}>
        <div className="status-pill"><span className="status-dot" />Cellar Synced — 142 Bottles Logged</div>
      </motion.div>

      <motion.div variants={FADE} style={{ width: '100%', marginBottom: 32 }}>
        <img src="/winecraft.jpg" alt="WineCraft" className="hero-banner" style={{ height: 320, objectPosition: 'center 30%' }} />
      </motion.div>

      <motion.div variants={FADE} style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 'clamp(36px,4vw,56px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#D4AF37', marginBottom: 12 }}>
          WINECRAFT 360
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: 16, color: '#7A7A7A', maxWidth: 520, margin: '0 auto' }}>
          Cellar management — provenance tracking, peak drinking windows, vintage intelligence, and the art of the perfect decant.
        </p>
      </motion.div>

      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, width: '100%', marginBottom: 24 }}>
        {[['24','Screens'],['142','Bottles'],['97','Avg Score'],['4','Regions']].map(([v,l]) => (
          <div key={l} className="glass-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 36, fontWeight: 600, color: '#D4AF37', lineHeight: 1, marginBottom: 8 }}>{v}</div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7A7A' }}>{l}</div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, width: '100%', marginBottom: 24 }}>
        <div className="glass-card" style={{ padding: 28 }}>
          <div className="section-label">Module Status</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {modules.map(([label, done]) => (
              <div key={label} className="module-chip">
                <span style={{ fontFamily: 'Inter', fontSize: 13, color: '#E5E2E1' }}>{label}</span>
                {done ? <CheckCircle2 size={14} style={{ color: '#D4AF37', flexShrink: 0 }} /> : <XCircle size={14} style={{ color: 'rgba(122,122,122,0.3)', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card-gold" style={{ padding: 28 }}>
          <div className="section-label">Cellar Selection</div>
          {cellar.map(({ name, region, varietal, score, peak }) => (
            <div key={name} className="data-row">
              <div>
                <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 15, color: '#E5E2E1' }}>{name}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', marginTop: 2 }}>{region} · {varietal} · Peak {peak}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 32, fontWeight: 600, color: '#D4AF37', lineHeight: 1 }}>{score}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>pts</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Region breakdown */}
      <motion.div variants={FADE} className="glass-card" style={{ width: '100%', padding: 32 }}>
        <div className="section-label">Cellar Composition by Region</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 32 }}>
          {regions.map(({ name, pct }) => (
            <div key={name} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 40, color: '#D4AF37', lineHeight: 1, marginBottom: 6 }}>{pct}%</div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#E5E2E1', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{name}</div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
