import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const taps = [
  { name: 'Barrel Stout',   style: 'Imperial Stout',  abv: '11.2%', ibu: 65, status: 'Pouring' },
  { name: 'Gold Haze',      style: 'New England IPA', abv: '6.8%',  ibu: 42, status: 'Pouring' },
  { name: 'Amber Protocol', style: 'Amber Ale',       abv: '5.4%',  ibu: 32, status: 'Pouring' },
  { name: 'Obsidian Lager', style: 'Munich Dunkel',   abv: '4.9%',  ibu: 18, status: 'Low Keg' },
]

const modules = [
  ['Tap Manager',     true ], ['Brew Log',       true ],
  ['Ferment Tracker', true ], ['Hop Index',      true ],
  ['Grain Bill',      true ], ['ABV Calculator', true ],
  ['Yeast Library',   false], ['Water Profile',  false],
]

export default function BeerCraft() {
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div variants={FADE} style={{ marginBottom: 40 }}>
        <div className="status-pill"><span className="status-dot" />Tap Room Active — 4 Live Taps</div>
      </motion.div>

      <motion.div variants={FADE} style={{ width: '100%', marginBottom: 32 }}>
        <img src="/beercraft.jpg" alt="BeerCraft" className="hero-banner" style={{ height: 320, objectPosition: 'center 50%' }} />
      </motion.div>

      <motion.div variants={FADE} style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 'clamp(36px,4vw,56px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#D4AF37', marginBottom: 12 }}>
          BEERCRAFT 360
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: 16, color: '#7A7A7A', maxWidth: 520, margin: '0 auto' }}>
          Brew intelligence — tap management, fermentation tracking, grain bill analytics, and full lifecycle from mash to glass.
        </p>
      </motion.div>

      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, width: '100%', marginBottom: 24 }}>
        {[['18','Recipes'],['4','Live Taps'],['6.8%','Avg ABV'],['39','Avg IBU']].map(([v,l]) => (
          <div key={l} className="glass-card" style={{ padding: '24px 20px', textAlign: 'center' }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 36, fontWeight: 600, color: '#D4AF37', lineHeight: 1, marginBottom: 8 }}>{v}</div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A7A7A' }}>{l}</div>
          </div>
        ))}
      </motion.div>

      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, width: '100%' }}>
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
          <div className="section-label">Live Taps</div>
          {taps.map(({ name, style, abv, ibu, status }) => (
            <div key={name} className="data-row">
              <div>
                <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 15, color: '#E5E2E1' }}>{name}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', marginTop: 2 }}>{style} · {abv} ABV · {ibu} IBU</div>
              </div>
              <span style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 3,
                background: status === 'Pouring' ? 'rgba(212,175,55,0.1)' : 'rgba(255,80,80,0.08)',
                color: status === 'Pouring' ? '#D4AF37' : '#C06060',
                border: `1px solid ${status === 'Pouring' ? 'rgba(212,175,55,0.3)' : 'rgba(200,80,80,0.25)'}`,
              }}>{status}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
