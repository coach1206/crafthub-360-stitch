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
    visualClass: 'seed-visual-smooth',
  },
  {
    id: 'bold-explorer',
    label: 'Bold Explorer',
    desc: 'Robust, full-bodied heirloom strains for the seasoned palate.',
    visualClass: 'seed-visual-bold',
  },
  {
    id: 'sweet-finish',
    label: 'Sweet Finish',
    desc: 'Natural sugars preserved through unique high-altitude aging.',
    visualClass: 'seed-visual-sweet',
  },
  {
    id: 'earth-spice',
    label: 'Earth and Spice',
    desc: 'Complex notes of cinnamon, cedar, and mineral soil.',
    visualClass: 'seed-visual-earth',
  },
  {
    id: 'luxury-reserve',
    label: 'Luxury Reserve',
    desc: 'A limited hybrid developed for ultra-premium wrappers.',
    visualClass: 'seed-visual-luxury',
  },
  {
    id: 'rare-leaf',
    label: 'Rare Leaf',
    desc: 'Small-batch cultivation of nearly extinct tobacco varietals.',
    visualClass: 'seed-visual-rare',
  },
  {
    id: 'social-smoke',
    label: 'Social Smoke',
    desc: 'Light, airy aromatics designed for conversation and ease.',
    visualClass: 'seed-visual-social',
  },
  {
    id: 'celebration-smoke',
    label: 'Celebration Smoke',
    desc: 'Festive, dynamic flavors with a long-lasting, memorable finish.',
    visualClass: 'seed-visual-celebration',
  },
]

const SOIL_PATHS = [
  {
    id: 'mexican-san-andres',
    label: 'Mexican San Andrés',
    subtitle: 'Dark depth',
    desc: 'Volcanic richness with a grounding, earthy core.',
    icon: 'location_on',
    visualClass: 'soil-visual-mexico',
  },
  {
    id: 'brazilian-mata-fina',
    label: 'Brazilian Mata Fina',
    subtitle: 'Natural sweetness',
    desc: 'Nutrient-rich loam for smooth, balanced leaves.',
    icon: 'eco',
    visualClass: 'soil-visual-brazil',
  },
  {
    id: 'colombian-highland',
    label: 'Colombian experimental profile',
    subtitle: 'Untamed highland minerals',
    desc: 'Innovative micro-terroirs for complex, layered character.',
    icon: 'terrain',
    visualClass: 'soil-visual-colombia',
  },
  {
    id: 'nicaraguan-esteli',
    label: 'Nicaraguan Estelí',
    subtitle: 'Bold and structured',
    desc: 'Mineral-dense soil for strength and spice-driven depth.',
    icon: 'shield',
    visualClass: 'soil-visual-nicaragua',
  },
  {
    id: 'peruvian-valley',
    label: 'Peruvian Valley',
    subtitle: 'Bright and aromatic',
    desc: 'Andean air and stone for lifted complexity.',
    icon: 'psychiatry',
    visualClass: 'soil-visual-peru',
    compact: true,
  },
  {
    id: 'javanese-island',
    label: 'Javanese Island Blend',
    subtitle: 'Earthy and exotic',
    desc: 'Island soils for rare, exotic undertones.',
    icon: 'forest',
    visualClass: 'soil-visual-java',
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
    const seed = SEED_PATHS.find(path => path.id === selectedSeed)
    const soil = SOIL_PATHS.find(path => path.id === selectedSoil)
    const curation = {
      seedId: selectedSeed,
      seedLabel: seed?.label || 'Selected Seed Path',
      seedDesc: seed?.desc || '',
      soilId: selectedSoil,
      soilLabel: soil?.label || 'Selected Soil Path',
      soilSubtitle: soil?.subtitle || '',
      soilDesc: soil?.desc || '',
    }
    window.sessionStorage?.setItem('smokecraft-curation-selection', JSON.stringify(curation))
    completeStep('origins')
    addXP(XP_AWARDS.ORIGINS_COMPLETE)
    navigate('/smokecraft/curation', { state: curation })
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
            url(/assets/smokecraft/cropped/connections-bg.jpg);
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
          position: relative;
          background-size: cover;
          background-position: center;
          min-height: 100%;
        }
        .path-visual::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 28% 26%, rgba(255,232,161,0.22), transparent 22%),
            linear-gradient(135deg, rgba(233,193,118,0.12), rgba(0,0,0,0.36));
          mix-blend-mode: screen;
        }
        .path-visual::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0.42));
        }
        .seed-visual-smooth { background-image: radial-gradient(circle at 32% 32%, #eed49a 0 9%, transparent 10%), radial-gradient(circle at 56% 58%, #c9954e 0 9%, transparent 10%), linear-gradient(135deg, #6d4b22, #130b04); }
        .seed-visual-bold { background-image: radial-gradient(circle at 62% 42%, #1b0d06 0 12%, transparent 13%), radial-gradient(circle at 38% 64%, #4a2612 0 10%, transparent 11%), linear-gradient(135deg, #3b2413, #070403); }
        .seed-visual-sweet { background-image: radial-gradient(circle at 31% 63%, #f0d184 0 10%, transparent 11%), radial-gradient(circle at 60% 28%, #b8792d 0 11%, transparent 12%), linear-gradient(135deg, #7c481d, #150805); }
        .seed-visual-earth { background-image: repeating-linear-gradient(48deg, transparent 0 16px, rgba(236,181,86,0.2) 17px 20px), radial-gradient(circle at 70% 50%, #74411e 0 22%, transparent 23%), linear-gradient(135deg, #473019, #0a0503); }
        .seed-visual-luxury { background-image: repeating-linear-gradient(118deg, transparent 0 22px, rgba(236,181,86,0.2) 23px 26px), linear-gradient(135deg, #9f7a35, #1a1005 58%, #060302); }
        .seed-visual-rare { background-image: radial-gradient(ellipse at 70% 42%, #5f7c3b 0 30%, transparent 31%), repeating-linear-gradient(120deg, transparent 0 18px, rgba(222,194,116,0.18) 19px 21px), linear-gradient(135deg, #293619, #070403); }
        .seed-visual-social { background-image: radial-gradient(ellipse at 35% 32%, rgba(255,255,255,0.36), transparent 26%), radial-gradient(ellipse at 56% 62%, rgba(255,255,255,0.18), transparent 28%), linear-gradient(135deg, #402b17, #070403); }
        .seed-visual-celebration { background-image: radial-gradient(circle at 72% 24%, rgba(255,224,150,0.72), transparent 18%), radial-gradient(circle at 42% 58%, #71411e 0 20%, transparent 21%), linear-gradient(135deg, #6c3b16, #080403); }
        .soil-visual-mexico { background-image: radial-gradient(circle at 32% 58%, #6a4931 0 22%, transparent 23%), repeating-linear-gradient(12deg, #20160f 0 10px, #332215 11px 18px, #100906 19px 26px); }
        .soil-visual-brazil { background-image: radial-gradient(circle at 56% 28%, #58833c 0 18%, transparent 19%), repeating-linear-gradient(18deg, #15100a 0 12px, #322416 13px 22px, #0b0704 23px 31px); }
        .soil-visual-colombia { background-image: linear-gradient(145deg, rgba(55,87,59,0.72), rgba(0,0,0,0.3)), linear-gradient(24deg, transparent 0 42%, #314d35 43% 55%, transparent 56%), linear-gradient(150deg, #1c301f, #080503); }
        .soil-visual-nicaragua { background-image: radial-gradient(circle at 42% 54%, #1d1712 0 25%, transparent 26%), repeating-linear-gradient(18deg, #0f0905 0 10px, #2d1e13 11px 20px, #080403 21px 28px); }
        .soil-visual-peru { background-image: linear-gradient(145deg, rgba(84,112,62,0.58), rgba(0,0,0,0.36)), linear-gradient(28deg, transparent 0 38%, #405d35 39% 54%, transparent 55%), linear-gradient(150deg, #22361f, #080503); }
        .soil-visual-java { background-image: radial-gradient(circle at 66% 28%, #5a773b 0 20%, transparent 21%), linear-gradient(145deg, #263d22, #080503); }
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
        .origins-cta-panel {
          margin: 26px auto 0;
          max-width: 760px;
          border: 1px solid rgba(233,193,118,0.28);
          border-radius: 18px;
          padding: 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          background: linear-gradient(135deg, rgba(18,13,8,0.92), rgba(7,5,3,0.88));
          box-shadow: 0 18px 46px rgba(0,0,0,0.32);
        }
        .origins-cta-panel p {
          margin: 0;
          color: rgba(245,234,215,0.7);
          font-size: 13px;
          line-height: 1.45;
        }
        .origins-next {
          flex-shrink: 0;
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
          transform: scale(0.98);
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
          .origins-shell { padding: 96px 18px 140px; }
          .origins-grid { grid-template-columns: 1fr; }
          .connection { display: none; }
          .origins-cta-panel { align-items: stretch; flex-direction: column; }
          .origins-next { width: 100%; }
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
        }
      `}</style>

      <div className="smokecraft-origins-bg" aria-hidden="true" />

      <SmokeCraftPremiumHeader
        step="Step 6 of 20"
        backTo="/smokecraft/format"
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
                      className={`path-visual ${seed.visualClass}`}
                      aria-hidden="true"
                    />
                    <div className="seed-card__content">
                      <h3>{seed.label}</h3>
                      <p>{seed.desc}</p>
                    </div>
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
                      className={`path-visual ${soil.visualClass}`}
                      aria-hidden="true"
                    />
                    <div className="soil-card__content">
                      <h3>{soil.label}</h3>
                      <span className="soil-card__subtitle">{soil.subtitle}</span>
                      <p>{soil.desc}</p>
                    </div>
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
                        className={`path-visual ${soil.visualClass}`}
                        aria-hidden="true"
                      />
                      <div className="soil-card__content">
                        <h3>{soil.label}</h3>
                        <span className="soil-card__subtitle">{soil.subtitle}</span>
                        <p>{soil.desc}</p>
                      </div>
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

        <section className="origins-cta-panel">
          <p>
            Select one seed path and one soil path to build your curation profile. Your choices will shape the next
            SmokeCraft learning step.
          </p>
          <button
            type="button"
            onClick={handleNext}
            disabled={!canContinue}
            className="origins-next"
          >
            <span className="material-symbols-outlined">local_library</span>
            <span>Next: Curation</span>
          </button>
        </section>

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

      <SmokeCraftBottomNav active="smokecraft" />
    </div>
  )
}
