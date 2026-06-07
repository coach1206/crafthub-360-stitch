import { motion } from 'framer-motion'
import XPBar from '../components/XPBar.jsx'
import AchievementBadge from '../components/AchievementBadge.jsx'
import ScoreRing from '../components/ScoreRing.jsx'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const stamps = [
  { module: 'SmokeCraft', emoji: '🔥', date: 'Jun 5',  xp: 480, score: 96 },
  { module: 'PourCraft',  emoji: '🥃', date: 'Jun 3',  xp: 320, score: 94 },
  { module: 'WineCraft',  emoji: '🍷', date: 'May 30', xp: 560, score: 98 },
  { module: 'BeerCraft',  emoji: '🍺', date: 'May 28', xp: 240, score: 91 },
  { module: 'E.A.T.',     emoji: '🍽️', date: 'May 22', xp: 180, score: 89 },
  { module: 'POS3',       emoji: '💳', date: 'May 20', xp: 120, score: 92 },
]

const tiers = [
  { name: 'Connoisseur', level: '01', color: '#7A7A7A', active: false },
  { name: 'Artisan',     level: '02', color: '#C88B3A', active: false },
  { name: 'Founder',     level: '00', color: '#D4AF37', active: true  },
]

const achievements = [
  { icon: '👑', label: 'Founder',     earned: true            },
  { icon: '🏆', label: 'Grand Tour',  earned: true, count: 12 },
  { icon: '⚡', label: 'Speed Pass',  earned: true, count: 3  },
  { icon: '🌟', label: 'Elite',       earned: true            },
  { icon: '🔮', label: 'Obsidian',    earned: true            },
  { icon: '🎯', label: 'Perfect',     earned: false           },
]

export default function PassportConnection() {
  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}>

      {/* Hero */}
      <motion.div variants={FADE} style={{ position: 'relative', height: 260 }}>
        <img src="/passport.jpg" alt="360 Passport"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,1,1,0.0) 30%, rgba(1,1,1,0.95) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 20px 20px' }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>NFC Member Identity</div>
          <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 34, color: '#E5E2E1', letterSpacing: '-0.02em', lineHeight: 1 }}>360 Passport</div>
        </div>
      </motion.div>

      {/* Member card */}
      <motion.div variants={FADE} style={{ margin: '16px 16px 0' }}>
        <div className="glass-card-gold" style={{ padding: '24px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20 }}>
            {/* Avatar */}
            <div style={{
              width: 68, height: 68, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
              border: '2px solid rgba(212,175,55,0.6)',
              boxShadow: '0 0 24px rgba(212,175,55,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 26, color: '#010101',
            }}>F</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 20, color: '#E5E2E1', lineHeight: 1, marginBottom: 4 }}>Founder Member</div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>Level 12 · Obsidian Tier</div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', letterSpacing: '0.06em' }}>CH360-FNDX-7A2E-∞</div>
            </div>
            {/* NFC pulse animation */}
            <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid rgba(212,175,55,0.6)', animation: 'ping-gold 1.8s ease-out infinite' }} />
              <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', border: '2px solid rgba(212,175,55,0.4)', animation: 'ping-gold 1.8s ease-out 0.3s infinite' }} />
              <div style={{ position: 'absolute', inset: 14, borderRadius: '50%', background: '#D4AF37', boxShadow: '0 0 12px rgba(212,175,55,0.6)' }} />
            </div>
          </div>
          <XPBar current={2400} max={3000} level={12} tierLabel="FOUNDER" tierColor="#D4AF37" />
        </div>
      </motion.div>

      {/* Membership tiers */}
      <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Membership Tiers</div>
        <div style={{ display: 'flex', gap: 12 }}>
          {tiers.map(({ name, level, color, active }) => (
            <div key={name} style={{
              flex: 1, padding: '20px 16px', borderRadius: 14, textAlign: 'center',
              background: active ? `linear-gradient(135deg, ${color}18, ${color}08)` : 'rgba(15,15,15,0.6)',
              border: `2px solid ${active ? color + '55' : 'rgba(122,122,122,0.15)'}`,
              backdropFilter: 'blur(20px)',
              boxShadow: active ? `0 0 24px ${color}22` : 'none',
            }}>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 700, fontSize: 24, color, lineHeight: 1, marginBottom: 6 }}>{level}</div>
              <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 14, color: active ? color : '#7A7A7A', marginBottom: 6 }}>{name}</div>
              {active && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: `${color}22`, border: `1px solid ${color}44` }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                  <span style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 8, color, letterSpacing: '0.1em', textTransform: 'uppercase' }}>ACTIVE</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Session stamps */}
      <motion.div variants={FADE} style={{ margin: '20px 16px 0' }}>
        <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Session Stamps — History Vault
        </div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
          {stamps.map(({ module, emoji, date, xp, score }) => (
            <motion.div key={module} whileTap={{ scale: 0.96 }}
              style={{ flexShrink: 0, width: 130, cursor: 'pointer' }}
            >
              <div className="glass-card" style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                {/* Stamp ring */}
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(212,175,55,0.2), rgba(212,175,55,0.05))',
                  border: '2px solid rgba(212,175,55,0.4)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, boxShadow: '0 0 12px rgba(212,175,55,0.15)',
                }}>{emoji}</div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 13, color: '#E5E2E1', marginBottom: 2 }}>{module}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', marginBottom: 6 }}>{date}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 14, color: '#D4AF37' }}>+{xp} XP</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 9, color: '#7A7A7A', marginTop: 2 }}>{score} pts</div>
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
            All Achievements
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'space-around', flexWrap: 'wrap', rowGap: 20 }}>
            {achievements.map(b => <AchievementBadge key={b.label} {...b} />)}
          </div>
        </div>
      </motion.div>

    </motion.div>
  )
}
