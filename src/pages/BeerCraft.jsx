import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import ScoreRing from '../components/ScoreRing.jsx'
import AchievementBadge from '../components/AchievementBadge.jsx'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const taps = [
  { name: 'Barrel Stout',    style: 'Imperial Stout',   abv: 11.2, ibu: 65, fill: 78, score: 95, emoji: '🖤' },
  { name: 'Gold Haze IPA',   style: 'NEIPA',            abv: 6.8,  ibu: 42, fill: 62, score: 93, emoji: '🌟' },
  { name: 'Amber Protocol',  style: 'Amber Ale',        abv: 5.4,  ibu: 32, fill: 45, score: 90, emoji: '🍂' },
  { name: 'Obsidian Lager',  style: 'Munich Dunkel',    abv: 4.9,  ibu: 18, fill: 20, score: 88, emoji: '🌑' },
]

const badges = [
  { icon: '🍺', label: 'Tap Master',    earned: true, count: 6 },
  { icon: '🌿', label: 'Hop Scholar',   earned: true           },
  { icon: '🖤', label: 'Stout Master',  earned: true, count: 2 },
  { icon: '🧪', label: 'Brew Lab',      earned: false          },
]

export default function BeerCraft() {
  const navigate = useNavigate()
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* Hero */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 260 }}>
        <img src="/beercraft.jpg" alt="BeerCraft"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.0) 30%, rgba(1,1,1,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Tap Room Intelligence</div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 34, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>BeerCraft 360</div>
        </div>
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)', cursor: 'pointer', zIndex: 2 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#D4AF37' }}>arrow_back</span>
          <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>BACK</span>
        </button>
        <div style={{ position: 'absolute', top: 16, right: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(1,1,1,0.7)', backdropFilter: 'blur(8px)', padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,175,55,0.3)' }}>
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase' }}>4 TAPS LIVE</span>
          </div>
        </div>
      </motion.div>

      {/* Score + stats */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card-gold" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 28 }}>
          <ScoreRing score={92} label="Avg Rating" size={110} />
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 18, color: '#E5E2E1', marginBottom: 6 }}>Tap Room Status</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[['4','Live Taps'],['18','Recipes'],['6.8%','Avg ABV'],['39','Avg IBU']].map(([v,l]) => (
                <div key={l} style={{ background: 'rgba(212,175,55,0.06)', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(212,175,55,0.12)' }}>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 20, color: '#D4AF37', lineHeight: 1 }}>{v}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tap cards with fill visualization */}
      <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Live Taps — Keg Level
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {taps.map(({ name, style, abv, ibu, fill, score, emoji }) => (
            <motion.div key={name} whileTap={{ scale: 0.97 }}>
              <div className="glass-card" style={{ padding: 20, cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 28 }}>{emoji}</span>
                  <ScoreRing score={score} label="pts" size={64} strokeWidth={5} />
                </div>
                <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 16, color: '#E5E2E1', marginBottom: 2 }}>{name}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.06em', marginBottom: 12 }}>{style} · {abv}% · {ibu} IBU</div>
                {/* Keg fill bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 9999, background: 'rgba(122,122,122,0.15)', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${fill}%`,
                      borderRadius: 9999,
                      background: fill > 50 ? 'linear-gradient(90deg, #D4AF3799, #D4AF37)' : fill > 25 ? 'linear-gradient(90deg, #C88B3A99, #C88B3A)' : 'linear-gradient(90deg, #C0606099, #C06060)',
                      boxShadow: `0 0 6px ${fill > 50 ? '#D4AF3788' : fill > 25 ? '#C88B3A88' : '#C0606088'}`,
                    }} />
                  </div>
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, fontWeight: 600, color: fill > 50 ? '#D4AF37' : fill > 25 ? '#C88B3A' : '#C06060', flexShrink: 0 }}>{fill}%</span>
                </div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', marginTop: 4, letterSpacing: '0.06em' }}>Keg remaining</div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            BeerCraft Achievements
          </div>
          <div style={{ display: 'flex', gap: 20, justifyContent: 'space-around' }}>
            {badges.map(b => <AchievementBadge key={b.label} {...b} />)}
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
