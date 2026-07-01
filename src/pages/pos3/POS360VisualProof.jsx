import { useState } from 'react'

const proofScreens = [
  {
    title: "CraftHub 360 Landing Page",
    asset: "/assets/pos360-reference/crafthub-360-landing-page.png"
  },
  {
    title: "Choose Destination",
    asset: "/assets/pos360-reference/choose-destination.png"
  },
  {
    title: "Unlock POS360",
    asset: "/assets/pos360-reference/unlock-pos-360.png"
  },
  {
    title: "Manager Access Interface",
    asset: "/assets/pos360-reference/manager-access-interface.png"
  },
  {
    title: "Module Deployment",
    asset: "/assets/pos360-reference/module-deployment.png"
  }
]

function ProofImage({ screen, index }) {
  const [broken, setBroken] = useState(false)

  return (
    <div style={{
      background: '#0a0a0f',
      border: '1px solid #2a2a3a',
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #2a2a3a',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        <span style={{
          background: '#1a1a2e',
          color: '#c9a84c',
          fontSize: 11,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 4,
          fontFamily: 'monospace',
          letterSpacing: 1
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <span style={{ color: '#e8e0d0', fontSize: 14, fontWeight: 600 }}>
          {screen.title}
        </span>
      </div>

      <div style={{
        background: '#050508',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 360,
        position: 'relative'
      }}>
        {broken ? (
          <div style={{
            color: '#c0392b',
            background: '#1a0505',
            border: '1px solid #c0392b',
            borderRadius: 8,
            padding: '16px 24px',
            fontSize: 13,
            textAlign: 'center'
          }}>
            ⚠ Image not found<br />
            <span style={{ color: '#888', fontSize: 11, fontFamily: 'monospace' }}>
              {screen.asset}
            </span>
          </div>
        ) : (
          <img
            src={screen.asset}
            alt={screen.title}
            onError={() => setBroken(true)}
            style={{
              maxWidth: '100%',
              maxHeight: 540,
              objectFit: 'contain',
              display: 'block'
            }}
          />
        )}
      </div>

      <div style={{
        padding: '8px 16px',
        borderTop: '1px solid #1a1a2a',
        fontFamily: 'monospace',
        fontSize: 11,
        color: '#555'
      }}>
        {screen.asset}
      </div>
    </div>
  )
}

export default function POS360VisualProof() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#06060c',
      color: '#e8e0d0',
      fontFamily: 'system-ui, sans-serif',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div style={{ marginBottom: 40, borderBottom: '1px solid #2a2a3a', paddingBottom: 24 }}>
          <div style={{ color: '#c9a84c', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
            POS360 · VISUAL PROOF
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#f0ead8' }}>
            Official Reference Images
          </h1>
          <p style={{ margin: '8px 0 0', color: '#888', fontSize: 14 }}>
            {proofScreens.length} screens — image-first build reference only. No CSS recreation.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {proofScreens.map((screen, i) => (
            <ProofImage key={screen.asset} screen={screen} index={i} />
          ))}
        </div>

        <div style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid #2a2a3a',
          color: '#444',
          fontSize: 11,
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          Source: public/assets/pos360-reference/ · Route: /pos360-visual-proof
        </div>
      </div>
    </div>
  )
}
