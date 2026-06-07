import { useState } from 'react'
import Card, { ModuleChip, SectionDivider, StatBadge, StatusBadge } from '../components/Card.jsx'

export default function Home() {
  const [pushed, setPushed] = useState(false)
  const [exporting, setExporting] = useState(false)

  function triggerPush() {
    setPushed(false)
    setTimeout(() => setPushed(true), 1100)
    setTimeout(() => setPushed(false), 5000)
  }

  function triggerExport() {
    setExporting(true)
    setTimeout(() => setExporting(false), 2000)
  }

  return (
    <div style={{ padding: '4px 16px 16px' }}>
      {/* Status */}
      <div style={{ marginBottom: 16 }}>
        <StatusBadge label="Production Ready" />
      </div>

      {/* Hero */}
      <h1 className="font-serif" style={{ lineHeight: 1.05, marginBottom: 24 }}>
        <span style={{ display: 'block', fontSize: 48, fontWeight: 700, color: '#fff' }}>Full</span>
        <span style={{ display: 'block', fontSize: 48, fontWeight: 700, color: '#fff' }}>Production</span>
        <span className="gold-text" style={{ display: 'block', fontSize: 48, fontWeight: 700 }}>Export</span>
        <span style={{ display: 'block', fontSize: 48, fontWeight: 700, color: '#fff' }}>Bundle</span>
      </h1>

      {/* Module Ecosystem Card */}
      <Card style={{ marginBottom: 16 }}>
        {/* Card header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="font-caps" style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 2 }}>MODULE</div>
            <div className="font-serif" style={{ fontSize: 22, fontWeight: 600, color: '#fff' }}>Ecosystem</div>
          </div>
          <StatBadge value="134" sub={'Screens\nCompiled'} />
        </div>

        {/* SMOKECRAFT */}
        <div style={{ padding: '16px 20px 8px' }}>
          <SectionDivider label="Smokecraft" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ModuleChip label="Humidor Entry" />
            <ModuleChip label="Stick Selection" />
            <ModuleChip label="Draw Tension Analytics" />
            <ModuleChip label="Aging Calculator" />
            <ModuleChip label="Leaf Provenance" />
            <ModuleChip label="Ash Quality Review" />
          </div>
        </div>

        {/* PASSPORT */}
        <div style={{ padding: '12px 20px 20px' }}>
          <SectionDivider label="Passport" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <ModuleChip label="Member Portal" />
            <ModuleChip label="NFT Access Key" />
            <ModuleChip label="History Vault" />
            <ModuleChip label="Travel Tier" />
          </div>
        </div>
      </Card>

      {/* Code Snippet Card */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,80,80,0.7)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(255,200,50,0.7)' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'rgba(50,200,80,0.7)' }} />
          <span className="font-caps" style={{ marginLeft: 10, fontSize: 10, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            index.html · main_production
          </span>
        </div>
        <div className="font-mono" style={{ padding: '14px 16px', fontSize: 12, lineHeight: 1.8, userSelect: 'none' }}>
          <div><span className="tok-tag">&lt;!DOCTYPE html&gt;</span></div>
          <div><span className="tok-tag">&lt;html</span> <span className="tok-attr">lang</span><span className="tok-brkt">=</span><span className="tok-str">"en"</span> <span className="tok-attr">class</span><span className="tok-brkt">=</span><span className="tok-str">"dark"</span><span className="tok-tag">&gt;</span></div>
          <div>&nbsp;&nbsp;<span className="tok-tag">&lt;head&gt;</span></div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="tok-tag">&lt;meta</span> <span className="tok-attr">charset</span><span className="tok-brkt">=</span><span className="tok-str">"UTF-8"</span> <span className="tok-tag">/&gt;</span></div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="tok-tag">&lt;title&gt;</span><span style={{ color: 'rgba(255,255,255,0.6)' }}>CraftHub 360 Ecosystem</span><span className="tok-tag">&lt;/title&gt;</span></div>
          <div>&nbsp;&nbsp;<span className="tok-tag">&lt;/head&gt;</span></div>
          <div>&nbsp;&nbsp;<span className="tok-tag">&lt;body&gt;</span></div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="tok-tag">&lt;div</span> <span className="tok-attr">id</span><span className="tok-brkt">=</span><span className="tok-str">"app"</span><span className="tok-tag">&gt;</span><span style={{ color: 'rgba(212,175,55,0.7)' }}>{'{{ ECOSYSTEM_ROOT }}'}</span><span className="tok-tag">&lt;/div&gt;</span></div>
          <div>&nbsp;&nbsp;&nbsp;&nbsp;<span className="tok-tag">&lt;script</span> <span className="tok-attr">src</span><span className="tok-brkt">=</span><span className="tok-str">"./main.js"</span><span className="tok-tag">&gt;&lt;/script&gt;</span></div>
          <div>&nbsp;&nbsp;<span className="tok-tag">&lt;/body&gt;</span></div>
          <div><span className="tok-tag">&lt;/html&gt;</span></div>
          <div style={{ marginTop: 8 }} className="tok-cmt">// Dependencies Loaded: 24</div>
        </div>
      </Card>

      {/* Action buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button className="gold-btn" onClick={triggerPush} style={{ borderRadius: 18, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' }}>
          <span style={{ fontSize: 22 }}>🚀</span>
          <div style={{ textAlign: 'left' }}>
            <div className="font-caps" style={{ fontSize: 13, fontWeight: 700, color: '#000', letterSpacing: '0.12em', textTransform: 'uppercase', lineHeight: 1 }}>TRIGGER GITHUB PUSH</div>
            <div className="font-caps" style={{ fontSize: 9, color: 'rgba(0,0,0,0.55)', textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 4 }}>MAIN BRANCH @ PRODUCTION</div>
          </div>
        </button>

        <button
          onClick={triggerExport}
          style={{ borderRadius: 18, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'background 0.2s' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#d4af37" strokeWidth="1.5" opacity="0.5" />
              <path d="M8 12h8M12 8l4 4-4 4" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-caps" style={{ fontSize: 12, fontWeight: 600, color: exporting ? '#f2ca50' : 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {exporting ? 'EXPORTING…' : 'REPLIT DIRECT EXPORT'}
            </span>
          </div>
          <span className="font-caps" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '2px 6px', letterSpacing: '0.1em' }}>LEGACY</span>
        </button>
      </div>

      {/* Push feedback */}
      {pushed && (
        <div className="obsidian-glass" style={{ marginTop: 12, borderRadius: 12, padding: '10px 14px', border: '1px solid rgba(212,175,55,0.3)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="material-symbols-outlined fill-icon" style={{ fontSize: 18, color: '#f2ca50' }}>check_circle</span>
          <span className="font-caps" style={{ fontSize: 11, color: '#f2ca50', letterSpacing: '0.1em' }}>Push triggered → main branch @ production</span>
        </div>
      )}
    </div>
  )
}
