import { useState } from 'react'
import Card, { SectionLabel, StatusBadge, ModuleChip, SectionDivider } from '../components/Card.jsx'

const tiers = [
  {
    name: 'Founder', level: 0, active: true,
    perks: ['Grand Lounge Access', 'NFT Key Mint', 'Priority Allocation', 'Obsidian Tier Events'],
  },
  {
    name: 'Artisan', level: 1, active: false,
    perks: ['Cellar Tier Access', 'Travel Rewards', 'Session History Log'],
  },
  {
    name: 'Connoisseur', level: 2, active: false,
    perks: ['Full Module Access', 'Event Priority Queue'],
  },
]

export default function PassportConnection() {
  const [copied, setCopied] = useState(false)

  function copyKey() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      <StatusBadge label="Passport Active — Founder Level 0" />

      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 className="text-display-tour gold-foil-text" style={{ marginBottom: 16 }}>
          PASSPORT
        </h1>
        <p className="text-body-intro text-on-surface-var" style={{ maxWidth: 640, margin: '0 auto' }}>
          Member identity, NFT access keys, travel tier rewards,
          and complete session history — all in one secure vault.
        </p>
      </div>

      <div className="bento-grid">

        {/* Identity card */}
        <div className="col-5">
          <Card accent style={{ height: '100%' }}>
            <SectionLabel>Member Identity</SectionLabel>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, #d4af37, #f2ca50)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span className="material-symbols-outlined icon-fill" style={{ fontSize: 36, color: '#000' }}>person</span>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>Founder Member</div>
                <div className="text-label-caps text-primary" style={{ marginBottom: 2 }}>Level 0 · Authority Real</div>
                <div className="text-label-sm text-on-surface-var">Since 2024 · CraftHub 360</div>
              </div>
            </div>

            {/* NFT Key */}
            <div className="obsidian-glass" style={{ borderRadius: 16, padding: '16px 20px', border: '1px solid rgba(212,175,55,0.25)', marginBottom: 20 }}>
              <div className="text-label-sm text-on-surface-var" style={{ marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.12em' }}>NFT Access Key</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <code style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--primary)', letterSpacing: '0.1em' }}>CH360-FNDX-7A2E-∞</code>
                <button
                  onClick={copyKey}
                  style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', transition: 'color 0.2s', color: copied ? 'var(--primary)' : 'rgba(255,255,255,0.35)' }}
                >
                  <span className="material-symbols-outlined icon-fill">{copied ? 'check_circle' : 'content_copy'}</span>
                </button>
              </div>
            </div>

            {/* Module status */}
            <SectionDivider>Modules</SectionDivider>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <ModuleChip label="Member Portal" />
              <ModuleChip label="NFT Access Key" />
              <ModuleChip label="History Vault" />
              <ModuleChip label="Travel Tier" />
              <ModuleChip label="Event Access"    done={false} />
              <ModuleChip label="Referral Engine" done={false} />
            </div>
          </Card>
        </div>

        {/* Tier cards */}
        <div className="col-7" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SectionLabel>Membership Tiers</SectionLabel>
          {tiers.map(({ name, level, active, perks }) => (
            <Card key={name} style={{
              border: active ? '1px solid rgba(212,175,55,0.4)' : '1px solid rgba(255,255,255,0.1)',
              boxShadow: active ? '0 0 32px rgba(212,175,55,0.08)' : '0 8px 32px 0 rgba(0,0,0,0.8)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 600, color: active ? 'var(--primary)' : 'var(--on-surface)', marginBottom: 2 }}>{name}</div>
                  <div className="text-label-sm text-on-surface-var" style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Level {level}</div>
                </div>
                {active && (
                  <span style={{
                    fontFamily: 'var(--font-label)', fontSize: 11, letterSpacing: '0.12em',
                    textTransform: 'uppercase', padding: '4px 14px', borderRadius: 9999,
                    background: 'rgba(212,175,55,0.15)', color: 'var(--primary)',
                    border: '1px solid rgba(212,175,55,0.3)',
                  }}>
                    ACTIVE
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {perks.map(p => (
                  <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined icon-fill" style={{ fontSize: 16, color: active ? 'var(--primary)' : 'rgba(255,255,255,0.2)' }}>check_circle</span>
                    <span className="text-body-md" style={{ color: active ? 'var(--on-surface-variant)' : 'rgba(255,255,255,0.3)' }}>{p}</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* History vault */}
        <div className="col-12">
          <Card>
            <SectionLabel>History Vault — Recent Sessions</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              {[
                { label: 'SmokeCraft',   date: 'Jun 5, 2026',  duration: '2h 14m', rating: 96 },
                { label: 'PourCraft',    date: 'Jun 3, 2026',  duration: '1h 42m', rating: 92 },
                { label: 'WineCraft',    date: 'May 30, 2026', duration: '3h 01m', rating: 98 },
                { label: 'EAT Command', date: 'May 28, 2026', duration: '2h 55m', rating: 94 },
              ].map(({ label, date, duration, rating }) => (
                <div key={label} className="obsidian-glass" style={{ borderRadius: 16, padding: '20px 24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontFamily: 'var(--font-label)', fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                  <div className="text-label-sm text-on-surface-var" style={{ marginBottom: 2 }}>{date}</div>
                  <div className="text-label-sm text-on-surface-var" style={{ marginBottom: 12 }}>{duration}</div>
                  <div className="gold-foil-text" style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700 }}>{rating}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
