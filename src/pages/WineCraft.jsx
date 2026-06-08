import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreRing from '../components/ScoreRing.jsx'
import AchievementBadge from '../components/AchievementBadge.jsx'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const cellar = [
  { name: 'Opus One 2018',        region: 'Napa Valley', varietal: 'Cab Blend', score: 98, peak: '2028–2040', price: '$320' },
  { name: 'Barolo Riserva 2016',  region: 'Piedmont',    varietal: 'Nebbiolo',  score: 96, peak: '2026–2035', price: '$185' },
  { name: 'Pomerol Reserve 2019', region: 'Bordeaux',    varietal: 'Merlot',    score: 94, peak: '2025–2030', price: '$140' },
  { name: 'Sassicaia 2017',       region: 'Tuscany',     varietal: 'Cab Sauv',  score: 97, peak: '2027–2038', price: '$260' },
]

const regions = [
  { name: 'Napa Valley', pct: 34, color: '#D4AF37' },
  { name: 'Bordeaux',    pct: 25, color: '#B8962E' },
  { name: 'Piedmont',    pct: 23, color: '#A07820' },
  { name: 'Tuscany',     pct: 18, color: '#7A5A10' },
]

const badges = [
  { icon: '🍷', label: 'Sommelier',   earned: true           },
  { icon: '🏰', label: 'Bordeaux',    earned: true, count: 4 },
  { icon: '🕯️', label: 'Cellar Lord', earned: true           },
  { icon: '🥇', label: 'Parker 100',  earned: false          },
]

export default function WineCraft() {
  const navigate = useNavigate()
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* Hero */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 260 }}>
        <img src="/winecraft.jpg" alt="WineCraft"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.0) 30%, rgba(1,1,1,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Cellar Management System</div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 34, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>WineCraft 360</div>
        </div>
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer', zIndex: 2 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#D4AF37' }}>arrow_back</span>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BACK</span>
        </button>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)' }}>
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>142 BOTTLES</span>
          </div>
        </div>
      </motion.div>

      {/* Score + stats */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card-gold" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 28 }}>
          <ScoreRing score={97} label="Avg Rating" size={110} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 18, color: '#E5E2E1', marginBottom: 6 }}>Cellar Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['142','Bottles'],['24','Screens'],['4','Regions'],['97','Avg Pts']].map(([v,l]) => (
                <div key={l} style={{ background: 'rgba(212,175,55,0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(212,175,55,0.12)' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 20, color: '#D4AF37', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Cellar cards — horizontal scroll */}
      <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Cellar Selection — Tap to Decant
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {cellar.map(({ name, region, varietal, score, peak, price }) => (
            <motion.div key={name} whileTap={{ scale: 0.96 }}
              style={{ flexShrink: 0, width: 180, cursor: 'pointer' }}
            >
              <div className="glass-card" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <ScoreRing score={score} label="pts" size={84} strokeWidth={7} />
                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 14, color: '#E5E2E1', marginBottom: 4, lineHeight: 1.2 }}>{name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', marginBottom: 2 }}>{region} · {varietal}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', marginBottom: 8 }}>Peak {peak}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 16, color: '#D4AF37' }}>{price}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Cellar composition rings */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Cellar Composition
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 12 }}>
            {regions.map(({ name, pct, color }) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 8px' }}>
                  <svg width={80} height={80} style={{ transform: 'rotate(-90deg)' }}>
                    <circle cx={40} cy={40} r={34} fill="none" stroke="rgba(122,122,122,0.15)" strokeWidth={6} />
                    <circle cx={40} cy={40} r={34} fill="none" stroke={color} strokeWidth={6}
                      strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * 2 * Math.PI * 34} ${2 * Math.PI * 34}`}
                      style={{ filter: `drop-shadow(0 0 4px ${color}88)` }}
                    />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 14, color }}>{pct}%</span>
                  </div>
                </div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{name}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            WineCraft Achievements
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'space-around' }}>
            {badges.map(b => <AchievementBadge key={b.label} {...b} />)}
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
