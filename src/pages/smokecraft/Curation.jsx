import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SmokeCraftBottomNav, SmokeCraftPremiumHeader } from '../../components/smokecraft/SmokeCraftPremium.jsx'

const FALLBACK_SELECTION = {
  seedLabel: 'Seed Path Pending',
  seedDesc: 'Return to Step 6 to choose the seed genetics that best match your palate.',
  soilLabel: 'Soil Path Pending',
  soilSubtitle: 'Terroir profile',
  soilDesc: 'Return to Step 6 to choose the soil terroir that will shape your curation.',
}

export default function Curation() {
  const navigate = useNavigate()
  const location = useLocation()

  const selection = useMemo(() => {
    if (location.state?.seedLabel && location.state?.soilLabel) return location.state
    try {
      const saved = window.sessionStorage?.getItem('smokecraft-curation-selection')
      return saved ? JSON.parse(saved) : FALLBACK_SELECTION
    } catch {
      return FALLBACK_SELECTION
    }
  }, [location.state])

  const hasSelection = Boolean(selection.seedId && selection.soilId)

  return (
    <div className="smokecraft-curation-page">
      <style>{`
        .smokecraft-curation-page {
          min-height: 100vh;
          background: #050302;
          color: #f5ead7;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 116px;
        }
        .smokecraft-curation-page::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image:
            radial-gradient(circle at 52% 34%, rgba(233,193,118,0.18), transparent 30%),
            linear-gradient(90deg, rgba(5,3,2,0.94), rgba(5,3,2,0.62), rgba(5,3,2,0.94)),
            url(/assets/smokecraft/cropped/flavor-dna-bg.jpg);
          background-size: cover;
          background-position: center;
          filter: brightness(0.62) saturate(1.1) contrast(1.12);
        }
        .curation-shell {
          position: relative;
          z-index: 2;
          max-width: 980px;
          margin: 0 auto;
          padding: 112px 24px 36px;
        }
        .curation-hero {
          text-align: center;
          margin-bottom: 28px;
        }
        .curation-hero span {
          color: #e9c176;
          text-transform: uppercase;
          letter-spacing: 0.28em;
          font-size: 12px;
          font-weight: 800;
        }
        .curation-hero h1 {
          margin: 12px 0 10px;
          font-family: "Playfair Display", serif;
          font-size: clamp(42px, 6vw, 72px);
          color: #f7efe2;
        }
        .curation-hero p {
          max-width: 660px;
          margin: 0 auto;
          color: rgba(245,234,215,0.76);
          line-height: 1.6;
        }
        .curation-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .curation-card {
          border: 1px solid rgba(233,193,118,0.32);
          border-radius: 18px;
          min-height: 250px;
          padding: 24px;
          background:
            radial-gradient(circle at 88% 16%, rgba(233,193,118,0.18), transparent 34%),
            linear-gradient(135deg, rgba(17,12,7,0.92), rgba(7,5,3,0.88));
          box-shadow: 0 18px 46px rgba(0,0,0,0.36);
        }
        .curation-card__icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #201300;
          background: linear-gradient(135deg, #f0d184, #bd903c);
          box-shadow: 0 0 24px rgba(233,193,118,0.28);
          margin-bottom: 18px;
        }
        .curation-card h2 {
          margin: 0 0 8px;
          font-family: "Playfair Display", serif;
          color: #e9c176;
          font-size: 30px;
        }
        .curation-card small {
          display: block;
          margin-bottom: 12px;
          color: #d7a94e;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          font-weight: 800;
        }
        .curation-card p {
          margin: 0;
          color: rgba(245,234,215,0.74);
          line-height: 1.55;
        }
        .curation-actions {
          margin-top: 22px;
          border: 1px solid rgba(233,193,118,0.28);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          background: rgba(8,5,2,0.86);
        }
        .curation-actions button {
          min-height: 56px;
          border-radius: 999px;
          padding: 0 24px;
          cursor: pointer;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .curation-actions__back {
          border: 1px solid rgba(233,193,118,0.36);
          color: #e9c176;
          background: rgba(233,193,118,0.08);
        }
        .curation-actions__next {
          border: 0;
          color: #201300;
          background: linear-gradient(135deg, #f0d184, #c2933f);
          box-shadow: 0 0 30px rgba(233,193,118,0.28);
        }
        @media (max-width: 720px) {
          .curation-grid { grid-template-columns: 1fr; }
          .curation-actions { flex-direction: column; }
        }
      `}</style>

      <SmokeCraftPremiumHeader
        step="Step 6 of 20"
        backTo="/smokecraft/origins"
        onRightClick={() => navigate('/grand-lounge-ranking')}
      />

      <main className="curation-shell">
        <section className="curation-hero">
          <span>SmokeCraft Curation</span>
          <h1>Your Curation Map</h1>
          <p>
            Seed genetics and soil terroir are now paired. Review the profile below, then continue into Leaf Education
            to learn how master blenders identify the leaves that express this foundation.
          </p>
        </section>

        <section className="curation-grid">
          <article className="curation-card">
            <div className="curation-card__icon">
              <span className="material-symbols-outlined">grain</span>
            </div>
            <small>Selected Seed Path</small>
            <h2>{selection.seedLabel}</h2>
            <p>{selection.seedDesc}</p>
          </article>
          <article className="curation-card">
            <div className="curation-card__icon">
              <span className="material-symbols-outlined">landscape</span>
            </div>
            <small>{selection.soilSubtitle || 'Selected Soil Path'}</small>
            <h2>{selection.soilLabel}</h2>
            <p>{selection.soilDesc}</p>
          </article>
        </section>

        <section className="curation-actions">
          <button className="curation-actions__back" onClick={() => navigate('/smokecraft/origins')}>
            {hasSelection ? 'Adjust Selection' : 'Choose Seed & Soil'}
          </button>
          <button className="curation-actions__next" onClick={() => navigate('/smokecraft/leaves')}>
            Continue to Leaf Education
          </button>
        </section>
      </main>

      <SmokeCraftBottomNav active="smokecraft" />
    </div>
  )
}
