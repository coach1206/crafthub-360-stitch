import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Copy, Check, User } from 'lucide-react'

const FADE = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

const tiers = [
  { name: 'Founder',      level: 0, active: true,  perks: ['Grand Lounge Access', 'NFT Key Mint', 'Priority Allocation', 'Obsidian Tier Events'] },
  { name: 'Artisan',      level: 1, active: false, perks: ['Cellar Tier Access', 'Travel Rewards', 'Session History Log'] },
  { name: 'Connoisseur',  level: 2, active: false, perks: ['Full Module Access', 'Event Priority Queue'] },
]

const modules = [
  ['Member Portal',    true ],
  ['NFT Access Key',   true ],
  ['History Vault',    true ],
  ['Travel Tier',      true ],
  ['Event Access',     false],
  ['Referral Engine',  false],
]

const sessions = [
  { label: 'SmokeCraft',  date: 'Jun 5, 2026',  duration: '2h 14m', rating: 96 },
  { label: 'PourCraft',   date: 'Jun 3, 2026',  duration: '1h 42m', rating: 92 },
  { label: 'WineCraft',   date: 'May 30, 2026', duration: '3h 01m', rating: 98 },
  { label: 'EAT Command', date: 'May 28, 2026', duration: '2h 55m', rating: 94 },
]

export default function PassportConnection() {
  const [copied, setCopied] = useState(false)

  function copyKey() { setCopied(true); setTimeout(() => setCopied(false), 2500) }

  return (
    <motion.div className="flex flex-col items-center"
      initial="hidden" animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
    >
      <motion.div variants={FADE} className="status-badge mb-12">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
        </span>
        <span className="font-label text-xs tracking-widest uppercase text-primary">Passport Active — Founder Level 0</span>
      </motion.div>

      <motion.div variants={FADE} className="text-center mb-16">
        <h1 className="text-display-tour gold-foil-text mb-4 leading-tight">PASSPORT</h1>
        <p className="text-body-intro text-on-surface-variant max-w-2xl mx-auto">
          Member identity, NFT access keys, travel tier rewards,
          and complete session history — all in one secure vault.
        </p>
      </motion.div>

      <motion.div variants={FADE} className="grid grid-cols-12 gap-8 w-full mb-8">

        {/* Identity + modules */}
        <div className="col-span-12 md:col-span-5 stitch-card stitch-card-accent flex flex-col gap-6">
          <h3 className="font-label text-sm tracking-widest uppercase text-primary">Member Identity</h3>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#d4af37,#f2ca50)' }}>
              <User size={30} className="text-black" />
            </div>
            <div>
              <div className="font-display text-xl font-semibold text-on-surface">Founder Member</div>
              <div className="font-label text-xs text-primary tracking-widest uppercase mt-1">Level 0 · Authority Real</div>
              <div className="font-label text-xs text-on-surface-variant mt-0.5">Since 2024 · CraftHub 360</div>
            </div>
          </div>

          <div className="obsidian-glass rounded-2xl p-4 border border-primary/25">
            <div className="font-label text-xs text-on-surface-variant tracking-widest uppercase mb-2">NFT Access Key</div>
            <div className="flex items-center justify-between">
              <code className="font-mono text-base text-primary tracking-wider">CH360-FNDX-7A2E-∞</code>
              <button onClick={copyKey} className="transition-colors hover:text-primary text-on-surface-variant">
                {copied ? <Check size={18} className="text-primary" /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div>
            <div className="section-divider">Modules</div>
            <div className="grid grid-cols-2 gap-2">
              {modules.map(([label, done]) => (
                <div key={label} className="module-chip">
                  <span className="text-sm text-on-surface">{label}</span>
                  {done
                    ? <CheckCircle2 size={16} className="text-primary shrink-0" />
                    : <XCircle size={16} className="text-on-surface-variant/30 shrink-0" />
                  }
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tier cards */}
        <div className="col-span-12 md:col-span-7 flex flex-col gap-4">
          <h3 className="font-label text-sm tracking-widest uppercase text-primary">Membership Tiers</h3>
          {tiers.map(({ name, level, active, perks }) => (
            <div key={name} className="stitch-card"
              style={{ border: active ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="font-display text-xl font-semibold mb-1" style={{ color: active ? '#f2ca50' : '#e5e2e1' }}>{name}</div>
                  <div className="font-label text-xs text-on-surface-variant tracking-widest uppercase">Level {level}</div>
                </div>
                {active && (
                  <span className="font-label text-xs tracking-widest uppercase px-4 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary">
                    ACTIVE
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                {perks.map(p => (
                  <div key={p} className="flex items-center gap-2">
                    <CheckCircle2 size={14} style={{ color: active ? '#f2ca50' : 'rgba(255,255,255,0.2)' }} />
                    <span className="text-sm" style={{ color: active ? '#d0c5af' : 'rgba(255,255,255,0.3)' }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* History vault */}
      <motion.div variants={FADE} className="stitch-card w-full">
        <h3 className="font-label text-sm tracking-widest uppercase text-primary mb-8">History Vault — Recent Sessions</h3>
        <div className="grid grid-cols-4 gap-6">
          {sessions.map(({ label, date, duration, rating }) => (
            <div key={label} className="obsidian-glass rounded-2xl p-5 border border-outline-variant/20">
              <div className="font-label text-sm font-semibold text-primary tracking-wider uppercase mb-2">{label}</div>
              <div className="font-label text-xs text-on-surface-variant mb-0.5">{date}</div>
              <div className="font-label text-xs text-on-surface-variant mb-4">{duration}</div>
              <div className="gold-foil-text font-display text-4xl font-bold">{rating}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}
