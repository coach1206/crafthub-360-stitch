import { useState } from 'react'

const diagnosticImages = [
  "/assets/smokecraft-reference/approved/smokecraft-scorecard-ranking.png",
  "/assets/smokecraft-reference/approved/smokecraft-cut-toast-light.png",
  "/assets/smokecraft-reference/approved/smokecraft-humidor-match.png",
  "/assets/smokecraft-reference/approved/smokecraft-request-purchase.png",
  "/assets/smokecraft-reference/approved/smokecraft-seed-soil.png",
  "/assets/smokecraft-reference/approved/smokecraft-flavor-dna.png",
  "/assets/smokecraft-reference/approved/smokecraft-passport-connection.png",
  "/assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png",
  "/assets/smokecraft-reference/approved/smokecraft-gold-box-rules.png",
  "/assets/smokecraft-reference/approved/smokecraft-passport-stamp.png",
]

function DiagCard({ src }) {
  const [status, setStatus] = useState('loading')
  const [dims, setDims] = useState(null)

  return (
    <div style={{ marginBottom: 48, padding: 16, border: '2px solid #333', background: '#111' }}>
      <p style={{ fontFamily: 'monospace', fontSize: 13, color: '#aaa', marginBottom: 8, wordBreak: 'break-all' }}>{src}</p>
      <p style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 10, color: status === 'ok' ? '#4caf50' : status === 'error' ? '#f44336' : '#ff9800' }}>
        Status: {status === 'loading' ? 'Loading…' : status === 'ok' ? `✓ LOADED — ${dims?.w}×${dims?.h}px` : '✗ FAILED TO LOAD'}
      </p>
      <img
        src={src}
        alt={src}
        onLoad={e => { setStatus('ok'); setDims({ w: e.target.naturalWidth, h: e.target.naturalHeight }) }}
        onError={() => setStatus('error')}
        style={{
          width: '100%',
          maxWidth: '900px',
          height: 'auto',
          display: 'block',
          border: '3px solid gold',
        }}
      />
    </div>
  )
}

export default function SmokeCraftImageDiagnostic() {
  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', padding: '32px 24px', color: '#fff' }}>
      <h1 style={{ fontFamily: 'monospace', fontSize: 20, marginBottom: 8, color: '#e9c176' }}>SmokeCraft Image Render Diagnostic</h1>
      <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#666', marginBottom: 32 }}>
        Source: public/assets/smokecraft-reference/approved/ — {diagnosticImages.length} images — no overlays, no opacity, no CSS backgrounds
      </p>
      {diagnosticImages.map(src => (
        <DiagCard key={src} src={src} />
      ))}
    </div>
  )
}
