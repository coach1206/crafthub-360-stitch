import { motion } from 'framer-motion'
import { CheckCircle2, XCircle } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const recipes = [
  { name: 'Old Fashioned',  base: 'Bourbon', style: 'Stirred', abv: '38%', status: 'Ready'  },
  { name: 'Negroni',        base: 'Gin',     style: 'Stirred', abv: '26%', status: 'Ready'  },
  { name: 'Mezcal Sour',    base: 'Mezcal',  style: 'Shaken',  abv: '18%', status: 'Draft'  },
  { name: 'Smoke & Mirror', base: 'Rye',     style: 'Custom',  abv: '32%', status: 'Ready'  },
  { name: 'Gold Daiquiri',  base: 'Rum',     style: 'Shaken',  abv: '22%', status: 'Active' },
]

const modules = [
  ['Recipe Builder', true], ['Spirit Library', true],
  ['Ratio Engine',   true], ['Bitters Index',  true],
  ['Garnish Guide',  true], ['Session Log',    true],
  ['Flavor Map',    false], ['Batch Calc',    false],
]

const isActive = (s) => s === 'Ready' || s === 'Active'

export default function PourCraft() {
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div variants={FADE} style={{ marginBottom: 40 }}>
        <div className="status-pill"><span className="status-dot" />Bar Module Live — 22 Recipes Compiled</div>
      </motion.div>

      <motion.div variants={FADE} style={{ width: '100%', marginBottom: 32 }}>
        <img src="/pourcraft.jpg" alt="PourCraft" className="hero-banner" style={{ height: 320, objectPosition: 'center 40%' }} />
      </motion.div>

      <motion.div variants={FADE} style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 'clamp(36px,4vw,56px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#D4AF37', marginBottom: 12 }}>
          POURCRAFT 360
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: 16, color: '#7A7A7A', maxWidth: 520, margin: '0 auto' }}>
          Cocktail command center. Recipes, ratios, spirit intelligence, and the science of the perfect pour.
        </p>
      </motion.div>

      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, width: '100%', marginBottom: 24 }}>
        {[['22','Recipes'],['8','Spirits'],['3','On Draft'],['5','Active']].map(([v,l]) => (
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
          <div className="section-label">Recipe Index</div>
          {recipes.map(({ name, base, style, abv, status }) => (
            <div key={name} className="data-row">
              <div>
                <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 15, color: '#E5E2E1' }}>{name}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', marginTop: 2 }}>{base} · {style} · {abv} ABV</div>
              </div>
              <span style={{
                fontFamily: '"JetBrains Mono",monospace', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 3,
                background: isActive(status) ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
                color: isActive(status) ? '#D4AF37' : '#7A7A7A',
                border: `1px solid ${isActive(status) ? 'rgba(212,175,55,0.3)' : 'rgba(122,122,122,0.2)'}`,
              }}>{status}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
