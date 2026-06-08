import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreRing from '../components/ScoreRing.jsx'
import AchievementBadge from '../components/AchievementBadge.jsx'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const recipes = [
  { name: 'Old Fashioned',   base: 'Bourbon',  score: 96, abv: 38, style: 'Stirred', emoji: '🥃' },
  { name: 'Negroni',         base: 'Gin',      score: 94, abv: 26, style: 'Stirred', emoji: '🍊' },
  { name: 'Mezcal Sour',     base: 'Mezcal',   score: 91, abv: 18, style: 'Shaken',  emoji: '🌿' },
  { name: 'Gold Daiquiri',   base: 'Rum',      score: 93, abv: 22, style: 'Shaken',  emoji: '🌟' },
  { name: 'Smoke & Mirror',  base: 'Rye',      score: 97, abv: 32, style: 'Custom',  emoji: '🔥' },
]

const badges = [
  { icon: '🥃', label: 'First Pour',   earned: true, count: 12 },
  { icon: '🌿', label: 'Herb Master',  earned: true             },
  { icon: '🍊', label: 'Citrus King',  earned: true, count: 4  },
  { icon: '⚗️', label: 'Alchemist',   earned: false            },
]

export default function PourCraft() {
  const navigate = useNavigate()
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* Hero */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 260 }}>
        <img src="/pourcraft.jpg" alt="PourCraft"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.0) 30%, rgba(1,1,1,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Cocktail Command Center</div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 34, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>PourCraft 360</div>
        </div>
        <button onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/')} style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer', zIndex: 2 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#D4AF37' }}>arrow_back</span>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BACK</span>
        </button>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)' }}>
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BAR LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Score + stats */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card-gold" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 28 }}>
          <ScoreRing score={94} label="Avg Rating" size={110} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 18, color: '#E5E2E1', marginBottom: 6 }}>Cocktail Excellence</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['22','Recipes'],['8','Spirits'],['3','On Draft'],['94%','Accuracy']].map(([v,l]) => (
                <div key={l} style={{ background: 'rgba(212,175,55,0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(212,175,55,0.12)' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 20, color: '#D4AF37', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Recipe cards — horizontal scroll */}
      <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Recipe Index — Tap to Build
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {recipes.map(({ name, base, score, abv, style, emoji }) => (
            <motion.div key={name} whileTap={{ scale: 0.96 }}
              style={{ flexShrink: 0, width: 160, cursor: 'pointer' }}
            >
              <div className="glass-card" style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ fontSize: 36 }}>{emoji}</div>
                <ScoreRing score={score} label="pts" size={80} strokeWidth={6} />
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 14, color: '#E5E2E1', marginBottom: 4, lineHeight: 1.2 }}>{name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A' }}>{base} · {abv}% ABV · {style}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            PourCraft Achievements
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'space-around' }}>
            {badges.map(b => <AchievementBadge key={b.label} {...b} />)}
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
