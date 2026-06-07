import { useState } from 'react'
import Card, { SectionLabel, ManifestRow, StatusBadge } from '../components/Card.jsx'

export default function Home() {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Status badge */}
      <StatusBadge label="System Production Online" />

      {/* Cinematic title */}
      <div style={{ textAlign: 'center', marginBottom: 64 }}>
        <h1 className="text-display-tour gold-foil-text" style={{ marginBottom: 16 }}>
          DEPLOYMENT SUCCESSFUL
        </h1>
        <p className="text-body-intro text-on-surface-var" style={{ maxWidth: 640, margin: '0 auto' }}>
          The CraftHub 360 Ecosystem has been successfully compiled and pushed to the global
          production tier. All design tokens and technical architectures are now live.
        </p>
      </div>

      {/* Bento grid */}
      <div className="bento-grid">

        {/* Sync status card */}
        <div className="col-5">
          <Card accent style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <SectionLabel>Synchronization Status</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 72, fontWeight: 700, color: 'var(--on-surface)', lineHeight: 1 }}>100</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--primary)', marginBottom: 6 }}>%</span>
              </div>
              <div className="progress-track" style={{ marginBottom: 8 }}>
                <div className="progress-fill glow-pulse" style={{ width: '100%' }} />
              </div>
              <p className="text-label-sm text-on-surface-var">All global clusters are currently in sync.</p>
            </div>

            <div style={{ marginTop: 32 }}>
              <div className="obsidian-glass" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 16, border: '1px solid rgba(77,70,53,0.3)' }}>
                <span className="material-symbols-outlined icon-fill text-primary" style={{ fontSize: 36 }}>cloud_done</span>
                <div>
                  <p style={{ fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>Cloud Latency: 14ms</p>
                  <p className="text-label-sm text-on-surface-var">Edge nodes responding globally</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Manifest card */}
        <div className="col-7">
          <Card accent>
            <SectionLabel>Deployment Manifest</SectionLabel>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <ManifestRow label="130+ Orchestrated Screens"       badge="Verified"  />
              <ManifestRow label="Obsidian Glass Design Tokens"    badge="Synced"    />
              <ManifestRow label="NOVEE OS Technical Codex"        badge="Published" />
              <ManifestRow label="1.2 GB Asset Bundle"            badge="Locked"    />
            </ul>
          </Card>
        </div>

      </div>

      {/* GitHub live badge */}
      <div style={{ marginTop: 64, textAlign: 'center' }}>
        <div className="obsidian-glass gold-shimmer" style={{ display: 'inline-flex', alignItems: 'center', gap: 16, border: '1px solid rgba(242,202,80,0.4)', padding: '16px 32px', borderRadius: 16 }}>
          <span className="material-symbols-outlined text-primary">terminal</span>
          <span className="text-label-caps text-on-surface">LIVE ON GITHUB:</span>
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--primary-fixed)', background: 'var(--surface-container-highest)', padding: '4px 12px', borderRadius: 6, letterSpacing: '0.08em' }}>
            github.com/crafthub-360/production-core
          </code>
          <button
            onClick={handleCopy}
            style={{ background: 'none', border: 'none', display: 'flex', color: copied ? 'var(--primary)' : 'var(--on-surface-variant)', transition: 'color 0.2s' }}
          >
            <span className="material-symbols-outlined">{copied ? 'done' : 'content_copy'}</span>
          </button>
        </div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: 80 }}>
        <button className="btn-primary gold-shimmer">
          ENTER PRODUCTION TERMINAL
        </button>
      </div>

    </div>
  )
}
