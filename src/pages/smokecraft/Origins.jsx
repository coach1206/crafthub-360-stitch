import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { XP_AWARDS } from '../../constants/session.js'
import {
  SmokeCraftBottomNav,
  SmokeCraftPremiumHeader,
} from '../../components/smokecraft/SmokeCraftPremium.jsx'

const SEED_PATHS = [
  {
    id: 'smooth-starter',
    label: 'Smooth Starter',
    desc: 'Gentle introduction with silky, cream-forward genetics.',
    visual: 'radial-gradient(circle at 24% 34%, #f4d68c 0 7%, transparent 8%), radial-gradient(circle at 38% 62%, #d6aa62 0 9%, transparent 10%), linear-gradient(135deg, rgba(244,214,140,0.32), rgba(42,26,10,0.62)), url(/crafthub-gold.jpg)',
    position: '34% 48%',
  },
  {
    id: 'bold-explorer',
    label: 'Bold Explorer',
    desc: 'Robust, full-bodied heirloom strains for the seasoned palate.',
    visual: 'radial-gradient(circle at 74% 32%, rgba(0,0,0,0.52), transparent 20%), linear-gradient(135deg, rgba(26,15,7,0.42), rgba(0,0,0,0.38)), url(/smokecraft.jpg)',
    position: 'center 32%',
  },
  {
    id: 'sweet-finish',
    label: 'Sweet Finish',
    desc: 'Natural sugars preserved through unique high-altitude aging.',
    visual: 'radial-gradient(circle at 28% 56%, rgba(255,222,137,0.72) 0 7%, transparent 8%), radial-gradient(circle at 42% 34%, rgba(202,142,56,0.58) 0 9%, transparent 10%), linear-gradient(135deg, rgba(232,176,73,0.3), rgba(37,19,6,0.66)), url(/background-lounge-airy.jpg)',
    position: 'left bottom',
  },
  {
    id: 'earth-spice',
    label: 'Earth and Spice',
    desc: 'Complex notes of cinnamon, cedar, and mineral soil.',
    visual: 'repeating-linear-gradient(45deg, transparent 0 18px, rgba(230,175,88,0.2) 19px 22px), radial-gradient(circle at 72% 40%, rgba(114,63,24,0.72), transparent 22%), url(/smokecraft.jpg)',
    position: 'right center',
  },
  {
    id: 'luxury-reserve',
    label: 'Luxury Reserve',
    desc: 'A limited hybrid developed for ultra-premium wrappers.',
    visual: 'linear-gradient(135deg, rgba(210,167,82,0.22), rgba(0,0,0,0.42)), url(/crafthub-gold.jpg)',
    position: 'center',
  },
  {
    id: 'rare-leaf',
    label: 'Rare Leaf',
    desc: 'Small-batch cultivation of nearly extinct tobacco varietals.',
    visual: 'radial-gradient(ellipse at 72% 42%, rgba(84,122,54,0.72), transparent 42%), repeating-linear-gradient(118deg, rgba(216,190,111,0.2) 0 2px, transparent 3px 22px), url(/background-lounge-airy.jpg)',
    position: 'right center',
  },
  {
    id: 'social-smoke',
    label: 'Social Smoke',
    desc: 'Light, airy aromatics designed for conversation and ease.',
    visual: 'radial-gradient(ellipse at 32% 32%, rgba(255,255,255,0.22), transparent 34%), radial-gradient(ellipse at 48% 64%, rgba(255,255,255,0.14), transparent 38%), url(/smokecraft.jpg)',
    position: 'left 42%',
  },
  {
    id: 'celebration-smoke',
    label: 'Celebration Smoke',
    desc: 'Festive, dynamic flavors with a long-lasting, memorable finish.',
    visual: 'radial-gradient(circle at 78% 25%, rgba(255,218,132,0.52), transparent 22%), linear-gradient(135deg, rgba(230,164,47,0.24), rgba(0,0,0,0.42)), url(/background-lounge-airy.jpg)',
    position: 'right bottom',
  },
]

const SOIL_PATHS = [
  {
    id: 'mexican-san-andres',
    label: 'Mexican San Andrés',
    subtitle: 'Dark depth',
    desc: 'Volcanic richness with a grounding, earthy core.',
    icon: 'location_on',
    visual: 'radial-gradient(circle at 36% 52%, rgba(65,45,31,0.88), transparent 24%), linear-gradient(135deg, rgba(21,15,10,0.42), rgba(0,0,0,0.5)), url(/crafthub-gold.jpg)',
    position: 'center 58%',
  },
  {
    id: 'brazilian-mata-fina',
    label: 'Brazilian Mata Fina',
    subtitle: 'Natural sweetness',
    desc: 'Nutrient-rich loam for smooth, balanced leaves.',
    icon: 'eco',
    visual: 'radial-gradient(circle at 58% 30%, rgba(65,104,47,0.55), transparent 23%), linear-gradient(135deg, rgba(33,25,14,0.34), rgba(0,0,0,0.48)), url(/background-lounge-airy.jpg)',
    position: 'center 44%',
  },
  {
    id: 'colombian-highland',
    label: 'Colombian experimental profile',
    subtitle: 'Untamed highland minerals',
    desc: 'Innovative micro-terroirs for complex, layered character.',
    icon: 'terrain',
    visual: 'linear-gradient(135deg, rgba(20,51,37,0.24), rgba(0,0,0,0.5)), url(/background-lounge-airy.jpg)',
    position: 'center',
  },
  {
    id: 'nicaraguan-esteli',
    label: 'Nicaraguan Estelí',
    subtitle: 'Bold and structured',
    desc: 'Mineral-dense soil for strength and spice-driven depth.',
    icon: 'shield',
    visual: 'radial-gradient(circle at 42% 50%, rgba(26,20,16,0.8), transparent 30%), linear-gradient(135deg, rgba(54,34,18,0.28), rgba(0,0,0,0.52)), url(/crafthub-gold.jpg)',
    position: '58% 42%',
  },
  {
    id: 'peruvian-valley',
    label: 'Peruvian Valley',
    subtitle: 'Bright and aromatic',
    desc: 'Andean air and stone for lifted complexity.',
    icon: 'psychiatry',
    visual: 'linear-gradient(135deg, rgba(43,75,47,0.24), rgba(0,0,0,0.44)), url(/background-lounge-airy.jpg)',
    position: 'left center',
    compact: true,
  },
  {
    id: 'javanese-island',
    label: 'Javanese Island Blend',
    subtitle: 'Earthy and exotic',
    desc: 'Island soils for rare, exotic undertones.',
    icon: 'forest',
    visual: 'linear-gradient(135deg, rgba(57,82,42,0.24), rgba(0,0,0,0.44)), url(/background-lounge-airy.jpg)',
    position: 'right center',
    compact: true,
  },
]

export default function Origins() {
  const navigate = useNavigate()
  const { completeStep, addXP, awardStamp, session } = useGuestSession()
  const [stampVisible, setStampVisible] = useState(false)
  const [selectedSeed, setSelectedSeed] = useState(null)
  const [selectedSoil, setSelectedSoil] = useState(null)
  const stampTimers = useRef([])

  useEffect(() => {
    const alreadyStamped = session.smokecraftStamps?.some(s => s.id === 'seed-soil')
    if (!alreadyStamped) {
      const t1 = setTimeout(() => {
        setStampVisible(true)
        awardStamp('seed-soil', 'origins')
      }, 2500)
      const t2 = setTimeout(() => setStampVisible(false), 8500)
      stampTimers.current = [t1, t2]
    }
    return () => stampTimers.current.forEach(clearTimeout)
  }, [awardStamp, session.smokecraftStamps])

  function handleNext() {
    if (!selectedSeed || !selectedSoil) return
    completeStep('origins')
    addXP(XP_AWARDS.ORIGINS_COMPLETE)
    navigate('/smokecraft/leaves')
  }

  const canContinue = Boolean(selectedSeed && selectedSoil)

  return (
    <div className="smokecraft-origins-page">
      <style>{`
        .smokecraft-origins-page {
          min-height: 100vh;
          background: #050302;
          color: #f5ead7;
          overflow-x: hidden;
          position: relative;
        }
        .smokecraft-origins-bg {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image:
            radial-gradient(ellipse at 8% 28%, rgba(255,255,255,0.13), transparent 24%),
            radial-gradient(circle at 52% 48%, rgba(233,193,118,0.17), transparent 28%),
            linear-gradient(90deg, rgba(5,3,2,0.94), rgba(5,3,2,0.68), rgba(5,3,2,0.94)),
            url(/background-lounge-airy.jpg);
          background-size: cover;
          background-position: center;
          filter: saturate(1.08) contrast(1.12) brightness(0.66);
        }
        .smokecraft-origins-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0,0,0,0.76) 100%);
        }
        .origins-shell {
          position: relative;
          z-index: 2;
          max-width: 1280px;
          margin: 0 auto;
          padding: 96px 32px 154px;
        }
        .origins-intro {
          max-width: 720px;
          margin: 0 auto 28px;
          text-align: center;
          color: rgba(245,234,215,0.74);
          font-size: 16px;
          line-height: 1.55;
        }
        .origins-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 58px minmax(0, 1fr);
          gap: 18px;
          align-items: center;
        }
        .origins-section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
          font-family: "Playfair Display", serif;
          font-size: clamp(30px, 3vw, 42px);
          color: #e9c176;
        }
        .origins-section-title .material-symbols-outlined {
          font-size: 30px;
        }
        .seed-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .seed-card,
        .soil-card {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(233,193,118,0.24);
          border-radius: 12px;
          background: rgba(10,7,4,0.78);
          color: #f5ead7;
          text-align: left;
          cursor: pointer;
          box-shadow: 0 14px 36px rgba(0,0,0,0.34);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .seed-card {
          min-height: 126px;
          display: grid;
          grid-template-columns: 38% 1fr;
        }
        .seed-card:active,
        .soil-card:active {
          transform: scale(0.985);
        }
        .seed-card.is-selected,
        .soil-card.is-selected {
          border-color: rgba(255,232,161,0.96);
          box-shadow: 0 0 0 1px rgba(255,232,161,0.34), 0 0 34px rgba(233,193,118,0.32), 0 18px 46px rgba(0,0,0,0.48);
        }
        .path-visual {
          background-size: cover;
          background-position: center;
          min-height: 100%;
        }
        .seed-card__content,
        .soil-card__content {
          position: relative;
          z-index: 2;
          padding: 18px 18px 16px;
        }
        .seed-card h3,
        .soil-card h3 {
          font-family: "Playfair Display", serif;
          font-size: 18px;
          color: #e9c176;
          margin: 0 0 6px;
          line-height: 1.1;
        }
        .seed-card p,
        .soil-card p {
          margin: 0;
          color: rgba(245,234,215,0.68);
          font-size: 12px;
          line-height: 1.35;
        }
        .path-check {
          position: absolute;
          z-index: 4;
          right: 10px;
          top: 10px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #f0d184, #bf8f36);
          color: #1b1004;
          box-shadow: 0 0 18px rgba(233,193,118,0.42);
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.2s ease;
        }
        .is-selected .path-check {
          opacity: 1;
          transform: scale(1);
        }
        .soil-list {
          display: grid;
          gap: 10px;
        }
        .soil-card {
          min-height: 92px;
          display: grid;
          grid-template-columns: 48% 1fr 54px;
          align-items: stretch;
        }
        .soil-card.is-compact {
          grid-template-columns: 42% 1fr 48px;
        }
        .soil-card__content {
          padding: 14px 14px;
        }
        .soil-card__subtitle {
          display: block;
          margin-bottom: 5px;
          color: #d7a94e;
          font-size: 10px;
          letter-spacing: 0.02em;
        }
        .soil-card__icon {
          display: grid;
          place-items: center;
          color: #e9c176;
        }
        .soil-card__icon span {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(233,193,118,0.42);
          border-radius: 50%;
          background: rgba(233,193,118,0.08);
        }
        .compact-soils {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .connection {
          position: relative;
          height: 560px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .connection::before {
          content: "";
          position: absolute;
          top: 44px;
          bottom: 44px;
          width: 1px;
          border-left: 1px dashed rgba(233,193,118,0.48);
          box-shadow: 0 0 18px rgba(233,193,118,0.28);
        }
        .connection__orb {
          position: relative;
          z-index: 2;
          width: 56px;
          height: 56px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(233,193,118,0.6);
          border-radius: 50%;
          color: #e9c176;
          background: rgba(10,6,3,0.84);
          box-shadow: 0 0 34px rgba(233,193,118,0.28);
        }
        .connection__orb::before,
        .connection__orb::after {
          content: "";
          position: absolute;
          width: 28px;
          height: 1px;
          border-top: 1px dashed rgba(233,193,118,0.5);
          top: 50%;
        }
        .connection__orb::before { right: 100%; }
        .connection__orb::after { left: 100%; }
        .origins-next {
          position: fixed;
          left: 50%;
          bottom: 88px;
          z-index: 80;
          transform: translateX(-50%);
          min-height: 58px;
          min-width: 238px;
          border: 0;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #201300;
          background: linear-gradient(135deg, #f0d184, #c2933f);
          box-shadow: 0 0 34px rgba(233,193,118,0.34);
          font-weight: 800;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: transform 0.2s ease, filter 0.2s ease, opacity 0.2s ease;
        }
        .origins-next:active {
          transform: translateX(-50%) scale(0.98);
        }
        .origins-next:disabled {
          cursor: not-allowed;
          filter: grayscale(0.9);
          opacity: 0.42;
          box-shadow: none;
        }
        .stamp-toast {
          position: fixed;
          right: 24px;
          bottom: 150px;
          z-index: 85;
          max-width: 340px;
          pointer-events: none;
          transition: opacity 0.7s ease, transform 0.7s ease;
        }
        @media (max-width: 980px) {
          .origins-shell { padding: 96px 18px 160px; }
          .origins-grid { grid-template-columns: 1fr; }
          .connection { display: none; }
        }
        @media (max-width: 640px) {
          .seed-grid,
          .compact-soils {
            grid-template-columns: 1fr;
          }
          .seed-card,
          .soil-card,
          .soil-card.is-compact {
            grid-template-columns: 42% 1fr;
          }
          .soil-card__icon {
            position: absolute;
            right: 8px;
            bottom: 8px;
          }
          .origins-next {
            bottom: 92px;
            min-width: min(86vw, 320px);
          }
        }
      `}</style>

      <div className="smokecraft-origins-bg" aria-hidden="true" />

      <SmokeCraftPremiumHeader
        step="Step 5 of 20"
        backTo="/smokecraft/mentor"
        onRightClick={() => navigate('/grand-lounge-ranking')}
      />

      <main className="origins-shell">
        <p className="origins-intro">
          The journey of a masterpiece begins deep within the earth. Explore the synergy between genetic heritage
          and the minerals that breathe life into every leaf.
        </p>

        <div className="origins-grid">
          <section>
            <h1 className="origins-section-title">
              <span className="material-symbols-outlined">grain</span>
              Seed Paths
            </h1>
            <div className="seed-grid">
              {SEED_PATHS.map(seed => {
                const isSelected = selectedSeed === seed.id
                return (
                  <button
                    key={seed.id}
                    type="button"
                    className={`seed-card${isSelected ? ' is-selected' : ''}`}
                    onClick={() => setSelectedSeed(isSelected ? null : seed.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="path-check material-symbols-outlined" aria-hidden="true">check</span>
                    <span
                      className="path-visual"
                      style={{ backgroundImage: seed.visual, backgroundPosition: seed.position }}
                      aria-hidden="true"
                    />
                    <span className="seed-card__content">
                      <h3>{seed.label}</h3>
                      <p>{seed.desc}</p>
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <div className="connection" aria-hidden="true">
            <div className="connection__orb">
              <span className="material-symbols-outlined">eco</span>
            </div>
          </div>

          <section>
            <h2 className="origins-section-title">
              <span className="material-symbols-outlined">landscape</span>
              Soil Paths
            </h2>
            <div className="soil-list">
              {SOIL_PATHS.filter(path => !path.compact).map(soil => {
                const isSelected = selectedSoil === soil.id
                return (
                  <button
                    key={soil.id}
                    type="button"
                    className={`soil-card${isSelected ? ' is-selected' : ''}`}
                    onClick={() => setSelectedSoil(isSelected ? null : soil.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="path-check material-symbols-outlined" aria-hidden="true">check</span>
                    <span
                      className="path-visual"
                      style={{ backgroundImage: soil.visual, backgroundPosition: soil.position }}
                      aria-hidden="true"
                    />
                    <span className="soil-card__content">
                      <h3>{soil.label}</h3>
                      <span className="soil-card__subtitle">{soil.subtitle}</span>
                      <p>{soil.desc}</p>
                    </span>
                    <span className="soil-card__icon" aria-hidden="true">
                      <span className="material-symbols-outlined">{soil.icon}</span>
                    </span>
                  </button>
                )
              })}
              <div className="compact-soils">
                {SOIL_PATHS.filter(path => path.compact).map(soil => {
                  const isSelected = selectedSoil === soil.id
                  return (
                    <button
                      key={soil.id}
                      type="button"
                      className={`soil-card is-compact${isSelected ? ' is-selected' : ''}`}
                      onClick={() => setSelectedSoil(isSelected ? null : soil.id)}
                      aria-pressed={isSelected}
                    >
                      <span className="path-check material-symbols-outlined" aria-hidden="true">check</span>
                      <span
                        className="path-visual"
                        style={{ backgroundImage: soil.visual, backgroundPosition: soil.position }}
                        aria-hidden="true"
                      />
                      <span className="soil-card__content">
                        <h3>{soil.label}</h3>
                        <span className="soil-card__subtitle">{soil.subtitle}</span>
                        <p>{soil.desc}</p>
                      </span>
                      <span className="soil-card__icon" aria-hidden="true">
                        <span className="material-symbols-outlined">{soil.icon}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </section>
        </div>

        <div
          className="stamp-toast"
          style={{ opacity: stampVisible ? 1 : 0, transform: stampVisible ? 'translateY(0)' : 'translateY(38px)' }}
        >
          <div className="smokecraft-glass-panel p-5 rounded-xl flex items-center gap-4 border border-primary/35">
            <div className="w-14 h-14 rounded-full bg-primary text-on-primary flex items-center justify-center stamp-reveal">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            </div>
            <div>
              <h4 className="font-headline-md text-primary leading-tight">Seed and Soil Completion Stamp</h4>
              <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">Added to your Member Passport</p>
            </div>
          </div>
        </div>
      </main>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canContinue}
        className="origins-next"
      >
        <span className="material-symbols-outlined">local_library</span>
        <span>Next: Curation</span>
      </button>

      <SmokeCraftBottomNav active="smokecraft" />
    </div>
  )
}
