import { motion } from 'framer-motion'
import ScoreRing from '../components/ScoreRing.jsx'
import AchievementBadge from '../components/AchievementBadge.jsx'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const vitolas = [
  { name: 'Lancero',      country: '🇨🇺 Cuba',      ring: 38, score: 97, age: '2019', status: 'Peak'   },
  { name: 'Churchill',    country: '🇩🇴 Dominican',  ring: 47, score: 96, age: '2020', status: 'Peak'   },
  { name: 'Robusto',      country: '🇳🇮 Nicaragua',  ring: 50, score: 94, age: '2021', status: 'Ready'  },
  { name: 'Toro',         country: '🇭🇳 Honduras',   ring: 52, score: 92, age: '2022', status: 'Young'  },
  { name: 'Gran Corona',  country: '🇨🇺 Cuba',       ring: 45, score: 98, age: '2017', status: 'Legend' },
]

const badges = [
  { icon: '🔥', label: 'Smoke Lord',    earned: true, count: 3 },
  { icon: '🍂', label: 'Aged Leaf',     earned: true          },
  { icon: '🇨🇺', label: 'Cuba Pure',   earned: true, count: 5 },
  { icon: '💎', label: 'Perfect Draw',  earned: false         },
]

const statusColor = { Peak: '#D4AF37', Ready: '#5A9A5A', Young: '#7A7A7A', Legend: '#F2CA50' }

export default function SmokeCraft() {
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* Hero */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 260 }}>
        <img src="/smokecraft.jpg" alt="SmokeCraft"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.0) 30%, rgba(1,1,1,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Cigar Intelligence Module</div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 34, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>SmokeCraft 360</div>
        </div>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)' }}>
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>48 STICKS ACTIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Score ring + draw stats */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card-gold" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 28 }}>
          <ScoreRing score={95} label="Avg Rating" size={110} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 18, color: '#E5E2E1', marginBottom: 6 }}>Humidor Performance</div>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', marginBottom: 16, lineHeight: 1.6 }}>28 screens · 48 sticks monitored</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['48','Sticks'],['6','Aging'],['28','Screens'],['3','Cuba']].map(([v,l]) => (
                <div key={l} style={{ background: 'rgba(212,175,55,0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(212,175,55,0.12)' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 20, color: '#D4AF37', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Vitola cards — horizontal scroll */}
      <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Active Vitolas — Tap to Select
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {vitolas.map(({ name, country, ring, score, age, status }) => (
            <motion.div key={name} whileTap={{ scale: 0.96 }}
              style={{ flexShrink: 0, width: 160, borderRadius: 14, overflow: 'hidden', cursor: 'pointer' }}
            >
              <div className="glass-card" style={{ padding: '20px 16px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <ScoreRing score={score} label="pts" size={80} strokeWidth={6} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 16, color: '#E5E2E1', marginBottom: 4 }}>{name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', marginBottom: 4 }}>{country}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A' }}>Ring {ring} · {age}</div>
                </div>
                <div style={{
                  padding: '4px 12px', borderRadius: 20,
                  background: `${statusColor[status]}15`,
                  border: `1px solid ${statusColor[status]}44`,
                  fontFamily: '"JetBrains Mono",monospace', fontSize: 9,
                  color: statusColor[status], letterSpacing: '0.1em', textTransform: 'uppercase',
                }}>{status}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Draw tension ring row */}
      <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Draw Tension Analysis
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 16 }}>
            <ScoreRing score={72} max={100} label="Perfect" size={90} strokeWidth={7} />
            <ScoreRing score={18} max={100} label="Slight" size={90} strokeWidth={7} />
            <ScoreRing score={6}  max={100} label="Plugged" size={90} strokeWidth={7} />
            <ScoreRing score={4}  max={100} label="Open"    size={90} strokeWidth={7} />
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            SmokeCraft Achievements
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'space-around' }}>
            {badges.map(b => <AchievementBadge key={b.label} {...b} />)}
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
