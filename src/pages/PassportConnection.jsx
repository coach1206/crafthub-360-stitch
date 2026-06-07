import { useState } from 'react'
import Card, { ModuleChip, SectionDivider, StatusBadge } from '../components/Card.jsx'

const tiers = [
  { name: 'Founder',   level: 0, perks: ['Grand Lounge Access', 'NFT Key Mint', 'Priority Allocation'], active: true },
  { name: 'Artisan',   level: 1, perks: ['Cellar Tier Access', 'Travel Rewards', 'Session History'],    active: false },
  { name: 'Connoisseur', level: 2, perks: ['Full Module Access', 'Event Priority'],                    active: false },
]

export default function PassportConnection() {
  const [copied, setCopied] = useState(false)

  function copyKey() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div style={{ padding: '4px 16px 16px' }}>
      <div style={{ marginBottom: 12 }}>
        <StatusBadge label="Passport Active" />
      </div>
      <h1 className="font-serif" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>
        <span className="gold-text">Passport</span>
        <span style={{ color: '#fff' }}> Connection</span>
      </h1>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginBottom: 20, lineHeight: 1.6 }}>
        Member identity, NFT access keys, travel tier, and history vault.
      </p>

      {/* Identity card */}
      <Card topAccent style={{ marginBottom: 16, padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #d4af37, #f2ca50)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined fill-icon" style={{ fontSize: 28, color: '#000' }}>person</span>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Founder Member</div>
            <div className="font-caps" style={{ fontSize: 10, color: 'rgba(212,175,55,0.8)', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Level 0 · Authority Real</div>
          </div>
        </div>
        {/* NFT Key */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>NFT ACCESS KEY</div>
            <div className="font-mono" style={{ fontSize: 12, color: '#f2ca50', letterSpacing: '0.08em' }}>CH360-FNDX-7A2E-∞</div>
          </div>
          <button onClick={copyKey} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined fill-icon" style={{ fontSize: 18, color: copied ? '#4caf50' : 'rgba(255,255,255,0.4)' }}>
              {copied ? 'check_circle' : 'content_copy'}
            </span>
          </button>
        </div>
      </Card>

      {/* Modules */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ padding: '16px 20px 20px' }}>
          <SectionDivider label="Module Status" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ModuleChip label="Member Portal" />
            <ModuleChip label="NFT Access Key" />
            <ModuleChip label="History Vault" />
            <ModuleChip label="Travel Tier" />
            <ModuleChip label="Event Access" checked={false} />
            <ModuleChip label="Referral Engine" checked={false} />
          </div>
        </div>
      </Card>

      {/* Tier cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {tiers.map(({ name, level, perks, active }) => (
          <Card key={name} style={{ padding: '14px 16px', border: active ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: active ? '#f2ca50' : '#fff' }}>{name}</div>
                <div className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Level {level}</div>
              </div>
              {active && (
                <span className="font-caps" style={{ fontSize: 9, padding: '3px 10px', borderRadius: 20, background: 'rgba(212,175,55,0.15)', color: '#f2ca50', border: '1px solid rgba(212,175,55,0.3)', letterSpacing: '0.1em' }}>ACTIVE</span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {perks.map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-symbols-outlined fill-icon" style={{ fontSize: 14, color: active ? '#f2ca50' : 'rgba(255,255,255,0.25)' }}>check_circle</span>
                  <span style={{ fontSize: 12, color: active ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.35)' }}>{p}</span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
