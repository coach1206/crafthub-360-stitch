import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Copy, Check } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } }
const STAGGER = { show: { transition: { staggerChildren: 0.08 } } }

const tiers = [
  { name: 'Founder',     level: 0, active: true,  perks: ['Grand Lounge Access', 'NFT Key Mint', 'Priority Allocation', 'Obsidian Tier Events'] },
  { name: 'Artisan',     level: 1, active: false,  perks: ['Cellar Tier Access', 'Travel Rewards', 'Session History Log'] },
  { name: 'Connoisseur', level: 2, active: false,  perks: ['Full Module Access', 'Event Priority Queue'] },
]

const modules = [
  ['Member Portal',   true ], ['NFT Access Key',  true ],
  ['History Vault',   true ], ['Travel Tier',     true ],
  ['Event Access',    false], ['Referral Engine', false],
]

const sessions = [
  { label: 'SmokeCraft',  date: 'Jun 5',  rating: 96 },
  { label: 'PourCraft',   date: 'Jun 3',  rating: 92 },
  { label: 'WineCraft',   date: 'May 30', rating: 98 },
  { label: 'EAT Command', date: 'May 28', rating: 94 },
]

export default function PassportConnection() {
  const [copied, setCopied] = useState(false)
  function copy() { setCopied(true); setTimeout(() => setCopied(false), 2500) }

  return (
    <motion.div initial="hidden" animate="show" variants={STAGGER}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <motion.div variants={FADE} style={{ marginBottom: 40 }}>
        <div className="status-pill"><span className="status-dot" />Passport Active — Founder Level 0</div>
      </motion.div>

      <motion.div variants={FADE} style={{ width: '100%', marginBottom: 32 }}>
        <img src="/passport.jpg" alt="360 Passport" className="hero-banner" style={{ height: 320, objectPosition: 'center 40%' }} />
      </motion.div>

      <motion.div variants={FADE} style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontSize: 'clamp(36px,4vw,56px)', fontWeight: 700, letterSpacing: '-0.02em', color: '#D4AF37', marginBottom: 12 }}>
          360 PASSPORT
        </h1>
        <p style={{ fontFamily: 'Inter', fontSize: 16, color: '#7A7A7A', maxWidth: 520, margin: '0 auto' }}>
          Member identity, NFC access keys, travel tier rewards, and complete session history — all in one secure vault.
        </p>
      </motion.div>

      <motion.div variants={FADE} style={{ display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 24, width: '100%', marginBottom: 24 }}>

        {/* Identity card */}
        <div className="glass-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="section-label">Member Identity</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #D4AF37, #B8962E)',
              border: '2px solid rgba(212,175,55,0.4)',
              boxShadow: '0 0 16px rgba(212,175,55,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 700, fontSize: 22, color: '#010101',
            }}>F</div>
            <div>
              <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 16, color: '#E5E2E1' }}>Founder Member</div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>Level 0 · Authority Real</div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', marginTop: 2 }}>Since 2024 · CraftHub 360</div>
            </div>
          </div>

          {/* NFC Key */}
          <div className="glass-card" style={{ padding: '14px 16px' }}>
            <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>NFC Access Key</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <code style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 15, color: '#D4AF37', letterSpacing: '0.06em' }}>CH360-FNDX-7A2E-∞</code>
              <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#D4AF37' : '#7A7A7A', transition: 'color 0.15s', padding: 4 }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Modules */}
          <div>
            <div className="section-label">Modules</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {modules.map(([label, done]) => (
                <div key={label} className="module-chip">
                  <span style={{ fontFamily: 'Inter', fontSize: 12, color: '#E5E2E1' }}>{label}</span>
                  {done ? <CheckCircle2 size={13} style={{ color: '#D4AF37', flexShrink: 0 }} /> : <XCircle size={13} style={{ color: 'rgba(122,122,122,0.3)', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Membership tiers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="section-label" style={{ marginBottom: 4 }}>Membership Tiers</div>
          {tiers.map(({ name, level, active, perks }) => (
            <div key={name}
              className={active ? 'glass-card-gold' : 'glass-card'}
              style={{ padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: '"Hanken Grotesk",sans-serif', fontWeight: 600, fontSize: 18, color: active ? '#D4AF37' : '#E5E2E1', marginBottom: 2 }}>{name}</div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#7A7A7A', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Level {level}</div>
                </div>
                {active && (
                  <span style={{
                    fontFamily: '"JetBrains Mono",monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '4px 12px', borderRadius: 3,
                    background: 'rgba(212,175,55,0.12)', color: '#D4AF37',
                    border: '1px solid rgba(212,175,55,0.35)',
                  }}>Active</span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
                {perks.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={12} style={{ color: active ? '#D4AF37' : 'rgba(122,122,122,0.3)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'Inter', fontSize: 13, color: active ? '#A09A8E' : 'rgba(255,255,255,0.2)' }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* History vault */}
      <motion.div variants={FADE} className="glass-card" style={{ width: '100%', padding: 28 }}>
        <div className="section-label">History Vault — Recent Sessions</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {sessions.map(({ label, date, rating }) => (
            <div key={label} className="glass-card" style={{ padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 10, color: '#D4AF37', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 11, color: '#7A7A7A', marginBottom: 16 }}>{date}</div>
              <div style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600, fontSize: 40, color: '#D4AF37', lineHeight: 1 }}>{rating}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
