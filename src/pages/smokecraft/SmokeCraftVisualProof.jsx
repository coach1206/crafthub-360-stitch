import { useState } from 'react'

const proofScreens = [
  {
    title: "Entry Gate / Intake",
    asset: "/assets/smokecraft-reference/approved/smokecraft-entry-gate.png",
    source: "public/assets/smokecraft/smokecraft Intake.png",
    phase: "Enroll / Intake entry"
  },
  {
    title: "Discover Your Cigar Profile",
    asset: "/assets/smokecraft-reference/approved/smokecraft-profile-capture.png",
    source: "public/assets/smokecraft/DISOVER YOUR CIGAR PROFILE.png",
    phase: "Profile / Identity screen"
  },
  {
    title: "Seed & Pairing / Soil",
    asset: "/assets/smokecraft-reference/approved/smokecraft-seed-soil.png",
    source: "public/assets/smokecraft/SEED & PARING.png",
    phase: "SeedSoil.jsx"
  },
  {
    title: "Mentor Selection",
    asset: "/assets/smokecraft-reference/approved/smokecraft-mentor-selection.png",
    source: "public/assets/smokecraft/mentor-selection.png",
    phase: "Mentor.jsx"
  },
  {
    title: "Golden Box Rules",
    asset: "/assets/smokecraft-reference/approved/smokecraft-gold-box-rules.png",
    source: "public/assets/smokecraft/golden-box.png",
    phase: "GoldenBox.jsx"
  },
  {
    title: "Humidor Match",
    asset: "/assets/smokecraft-reference/approved/smokecraft-humidor-match.png",
    source: "public/assets/smokecraft/Humidor Match 1.png",
    phase: "HumidorMatch.jsx"
  },
  {
    title: "Cut / Toast / Light",
    asset: "/assets/smokecraft-reference/approved/smokecraft-cut-toast-light.png",
    source: "public/assets/smokecraft/CUT  TOAST, & LIGHT.png",
    phase: "CutToastLight.jsx"
  },
  {
    title: "Request / Purchase Cigar",
    asset: "/assets/smokecraft-reference/approved/smokecraft-request-purchase.png",
    source: "public/assets/smokecraft/request or purchange cigar.png",
    phase: "RequestPurchase.jsx"
  },
  {
    title: "Flavor DNA",
    asset: "/assets/smokecraft-reference/approved/smokecraft-flavor-dna.png",
    source: "public/assets/smokecraft/flavodr dna.png",
    phase: "FlavorDNA.jsx"
  },
  {
    title: "Final Third Tasting",
    asset: "/assets/smokecraft-reference/approved/smokecraft-final-third.png",
    source: "public/assets/smokecraft/final-third-tasting.png",
    phase: "FinalThird.jsx"
  },
  {
    title: "Scorecard / Ranking",
    asset: "/assets/smokecraft-reference/approved/smokecraft-scorecard-ranking.png",
    source: "public/assets/smokecraft/smokecraft-scorecard.png",
    phase: "Scorecard.jsx"
  },
  {
    title: "Passport Stamp / Certified",
    asset: "/assets/smokecraft-reference/approved/smokecraft-passport-stamp.png",
    source: "public/assets/smokecraft/passport-certified-final.png",
    phase: "PassportStamp.jsx"
  },
  {
    title: "Passport Connection",
    asset: "/assets/smokecraft-reference/approved/smokecraft-passport-connection.png",
    source: "public/assets/smokecraft/passport-connection-1.png",
    phase: "Connections.jsx"
  },
  {
    title: "Venue Management Sync",
    asset: "/assets/smokecraft-reference/approved/smokecraft-venue-management-sync.png",
    source: "public/assets/smokecraft/golden-box/venue-management-sync.png",
    phase: "ManagementSync.jsx"
  },
]

const missingScreens = [
  { title: "Shape / Size / Burn", note: "No approved full reference image found" },
  { title: "First Third", note: "Only a 521×119 strip exists — no full reference" },
  { title: "Second Third", note: "flavor-dna.png currently used — may not be Second Third specifically" },
  { title: "Final Review", note: "final-review-bg.jpg (1536×1024) exists — needs visual confirmation" },
]

function ProofImage({ screen, index }) {
  const [broken, setBroken] = useState(false)

  return (
    <div style={{
      background: '#0a0807',
      border: '1px solid #3a2a10',
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #2a1a08',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: '#0d0a06'
      }}>
        <span style={{
          background: '#1a1005',
          color: '#c9a84c',
          fontSize: 11,
          fontWeight: 700,
          padding: '2px 8px',
          borderRadius: 4,
          fontFamily: 'monospace',
          letterSpacing: 1,
          border: '1px solid #3a2810'
        }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <div>
          <div style={{ color: '#f0e8d0', fontSize: 14, fontWeight: 700 }}>{screen.title}</div>
          <div style={{ color: '#8a7050', fontSize: 11 }}>{screen.phase}</div>
        </div>
      </div>

      <div style={{
        background: '#050402',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 320,
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
            <span style={{ color: '#888', fontSize: 11, fontFamily: 'monospace' }}>{screen.asset}</span>
          </div>
        ) : (
          <img
            src={screen.asset}
            alt={screen.title}
            onError={() => setBroken(true)}
            style={{
              maxWidth: '100%',
              maxHeight: 560,
              objectFit: 'contain',
              display: 'block'
            }}
          />
        )}
      </div>

      <div style={{
        padding: '6px 16px 10px',
        borderTop: '1px solid #1a0e04',
        background: '#0a0705'
      }}>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#6a5030' }}>
          OFFICIAL: {screen.asset}
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#4a3820', marginTop: 2 }}>
          SOURCE: {screen.source}
        </div>
      </div>
    </div>
  )
}

export default function SmokeCraftVisualProof() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#06040200',
      backgroundColor: '#070502',
      color: '#e8e0d0',
      fontFamily: 'system-ui, sans-serif',
      padding: '40px 24px'
    }}>
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>
        <div style={{ marginBottom: 40, borderBottom: '1px solid #2a1a08', paddingBottom: 24 }}>
          <div style={{ color: '#c9a84c', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>
            SMOKECRAFT 360 · IMAGE-FIRST VISUAL PROOF
          </div>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: '#f0ead0' }}>
            Approved Reference Images
          </h1>
          <p style={{ margin: '8px 0 0', color: '#7a6040', fontSize: 14 }}>
            {proofScreens.length} approved screens · source: public/assets/smokecraft-reference/approved/ · no CSS recreation
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {proofScreens.map((screen, i) => (
            <ProofImage key={screen.asset} screen={screen} index={i} />
          ))}
        </div>

        {missingScreens.length > 0 && (
          <div style={{
            marginTop: 48,
            background: '#0d0805',
            border: '1px solid #3a1a08',
            borderRadius: 12,
            padding: '24px 28px'
          }}>
            <div style={{ color: '#c9a84c', fontSize: 11, fontWeight: 700, letterSpacing: 2, marginBottom: 16 }}>
              MISSING — NO APPROVED REFERENCE FOUND
            </div>
            {missingScreens.map(s => (
              <div key={s.title} style={{
                display: 'flex',
                gap: 16,
                padding: '10px 0',
                borderBottom: '1px solid #1a0e04'
              }}>
                <span style={{
                  color: '#c0392b',
                  background: '#1a0505',
                  border: '1px solid #c0392b',
                  borderRadius: 4,
                  padding: '2px 8px',
                  fontSize: 11,
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}>MISSING</span>
                <div>
                  <div style={{ color: '#e0d0b0', fontSize: 13, fontWeight: 600 }}>{s.title}</div>
                  <div style={{ color: '#6a5030', fontSize: 12 }}>{s.note}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: 48,
          paddingTop: 24,
          borderTop: '1px solid #2a1a08',
          color: '#3a2810',
          fontSize: 11,
          fontFamily: 'monospace',
          textAlign: 'center'
        }}>
          Source: public/assets/smokecraft-reference/approved/ · Route: /smokecraft-visual-proof · No CSS recreation · No functionality wired
        </div>
      </div>
    </div>
  )
}
