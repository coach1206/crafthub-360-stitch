import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import XPBar from '../components/XPBar.jsx'
import AchievementBadge from '../components/AchievementBadge.jsx'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } }
const STAGGER = { show: { transition: { staggerChildren: 0.09 } } }

const quickModules = [
  { path: '/smokecraft', img: '/smokecraft.jpg',  label: 'SmokeCraft',  sub: 'Cigar Intelligence'  },
  { path: '/pourcraft',  img: '/pourcraft.jpg',   label: 'PourCraft',   sub: 'Cocktail Command'    },
  { path: '/beercraft',  img: '/beercraft.jpg',   label: 'BeerCraft',   sub: 'Tap & Brew'          },
  { path: '/winecraft',  img: '/winecraft.jpg',   label: 'WineCraft',   sub: 'Cellar Intelligence' },
]

const badges = [
  { icon: '🥃', label: 'First Pour',    earned: true,  count: 12 },
  { icon: '🍺', label: 'Tap Master',    earned: true,  count: 6  },
  { icon: '🍷', label: 'Sommelier',     earned: true              },
  { icon: '🔥', label: 'Smoke Lord',    earned: true,  count: 3  },
  { icon: '⚡', label: 'Speed Order',   earned: false             },
  { icon: '🏆', label: 'Grand Master',  earned: false             },
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* ── Welcome / Member Hero ── */}
      <motion.div variants={FADE} style={{ position: 'relative', overflow: 'hidden' }}>
        <img src="/background-lounge-airy.jpg" alt=""
          style={{ width: '100%', height: 280, objectFit: 'cover', objectPosition: 'center 60%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.1) 0%, rgba(1,1,1,0.85) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 24px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>
            Welcome back
          </div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 36, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>
            Founder Member
          </div>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', letterSpacing: '0.08em' }}>
            CraftHub 360 · Level 12 · Obsidian Tier
          </div>
        </div>
      </motion.div>

      {/* ── XP / Level progression ── */}
      <motion.div variants={FADE} style={{ margin: '0 16px 8px', marginTop: -1 }}>
        <div className="glass-card-gold" style={{ padding: '20px 24px' }}>
          <XPBar current={2400} max={3000} level={12} tierLabel="FOUNDER" tierColor="#D4AF37" />
        </div>
      </motion.div>

      {/* ── Achievement Badges ── */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Achievements Unlocked
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'space-between' }}>
            {badges.map(b => <AchievementBadge key={b.label} {...b} />)}
          </div>
        </div>
      </motion.div>

      {/* ── Quick Module Access ── */}
      <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 4 }}>
          Quick Access
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {quickModules.map(({ path, img, label, sub }) => (
            <motion.div key={path}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(path)}
              style={{ cursor: 'pointer', borderRadius: 12, overflow: 'hidden', position: 'relative', height: 140 }}
            >
              <img src={img} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(1,1,1,0.9) 0%, rgba(1,1,1,0.1) 60%)' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 14px' }}>
                <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 16, color: '#E5E2E1', lineHeight: 1 }}>{label}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>{sub}</div>
              </div>
              {/* Gold border glow */}
              <div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: '1px solid rgba(212,175,55,0.25)', pointerEvents: 'none' }} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── Today's Session ── */}
      <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
        <div className="glass-card" style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
            Today's Session
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
            {[['3','Experiences'],['480','XP Earned'],['94','Avg Score']].map(([v,l]) => (
              <div key={l} style={{ textAlign: 'center', padding: '16px 8px', background: 'rgba(212,175,55,0.05)', borderRadius: 8, border: '1px solid rgba(212,175,55,0.12)' }}>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 32, color: '#D4AF37', lineHeight: 1, marginBottom: 4 }}>{v}</div>
                <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── CTA to full hub ── */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <button className="btn-gold" style={{ width: '100%', height: 60, fontSize: 13 }}
          onClick={() => navigate('/crafthub')}
        >
          EXPLORE ALL 7 MODULES
        </button>
      </motion.div>

    </motion.div>
  )
}
