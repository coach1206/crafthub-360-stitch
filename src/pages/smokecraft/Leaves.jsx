import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { SmokeCraftBottomNav } from '../../components/smokecraft/SmokeCraftPremium.jsx'

const VARIETIES = [
  {
    id: 'habano-colorado',
    number: '01',
    name: 'Habano Colorado',
    origin: 'Cuba and Nicaragua',
    characteristics: 'Dark colorado wrapper, oily surface, visible vein structure, and resilient hand feel.',
    burn: 'A steady ember rewards a deliberate toast. Watch for the cedar note as the wrapper warms.',
    strength: 4, aroma: 5, body: 4,
    notes: ['Red Pepper', 'Cedar', 'Earth'],
    tasting: "A Havana classic. Silky texture with a pronounced spice bloom on the mid-palate, finishing with red pepper and mature cedar.",
    visual: 'linear-gradient(135deg, rgba(90,42,18,0.24), rgba(0,0,0,0.28)), repeating-linear-gradient(132deg, transparent 0 19px, rgba(236,181,86,0.24) 20px 22px), url(/smokecraft.jpg)',
    position: 'center 34%',
  },
  {
    id: 'corojo-rosado',
    number: '02',
    name: 'Corojo Rosado',
    origin: 'Cuba lineage, Honduras expression',
    characteristics: 'Rosado hue, satin texture, and elegant elasticity that softens bolder fillers.',
    burn: 'Combustion is gentle and even when humidity is balanced; the draw leans creamy and floral.',
    strength: 3, aroma: 4, body: 3,
    notes: ['Floral', 'Sweet', 'Cream'],
    tasting: "Corojo's most celebrated expression opens silky and sweet before delicate floral notes arrive.",
    visual: 'radial-gradient(circle at 48% 46%, rgba(247,196,91,0.34), transparent 26%), repeating-linear-gradient(98deg, transparent 0 21px, rgba(69,37,13,0.32) 22px 25px), url(/crafthub-gold.jpg)',
    position: 'center',
  },
  {
    id: 'criollo-98',
    number: '03',
    name: "Criollo '98",
    origin: 'Estelí, Nicaragua',
    characteristics: 'Firm structure, darker veins, and a pepper-driven profile from mineral-dense soil.',
    burn: 'Draw resistance is intentional; it focuses black pepper, cocoa, and leather through the final third.',
    strength: 5, aroma: 4, body: 5,
    notes: ['Black Pepper', 'Cocoa', 'Leather'],
    tasting: 'A powerhouse leaf with assertive pepper and deep cocoa undertones that intensify with heat.',
    visual: 'linear-gradient(135deg, rgba(86,40,18,0.22), rgba(0,0,0,0.32)), repeating-linear-gradient(23deg, transparent 0 16px, rgba(232,168,77,0.18) 17px 19px), url(/smokecraft.jpg)',
    position: 'right 42%',
  },
  {
    id: 'connecticut-shade',
    number: '04',
    name: 'Connecticut Shade',
    origin: 'Connecticut River Valley, USA',
    characteristics: 'Thin, pale wrapper grown under gauze canopy for softness, cream, and subtle sweetness.',
    burn: 'A mild wrapper that asks for patience; its burn is clean and its draw is forgiving.',
    strength: 1, aroma: 3, body: 2,
    notes: ['Cream', 'Vanilla', 'Hay'],
    tasting: 'Buttery and light with natural sweetness that welcomes new smokers and calms complex fillers.',
    visual: 'radial-gradient(circle at 34% 44%, rgba(210,82,54,0.35), transparent 30%), repeating-linear-gradient(118deg, transparent 0 18px, rgba(242,181,110,0.18) 19px 22px), url(/background-lounge-airy.jpg)',
    position: 'left center',
  },
  {
    id: 'sumatra-maduro',
    number: '05',
    name: 'Sumatra Maduro',
    origin: 'Sumatra, Indonesia',
    characteristics: 'Double-fermented maduro leaf with dark oils, cocoa sweetness, and earthy depth.',
    burn: 'The richer oils require an even light; once awake, it burns smooth with coffee-like persistence.',
    strength: 4, aroma: 3, body: 4,
    notes: ['Dark Chocolate', 'Coffee', 'Earth'],
    tasting: 'Indonesian Sumatra delivers rich cocoa sweetness with an earthy undertone and lingering finish.',
    visual: 'linear-gradient(135deg, rgba(44,23,12,0.25), rgba(0,0,0,0.38)), repeating-linear-gradient(105deg, transparent 0 17px, rgba(180,122,57,0.18) 18px 21px), url(/crafthub-gold.jpg)',
    position: '68% 44%',
  },
  {
    id: 'broadleaf-maduro',
    number: '06',
    name: 'Broadleaf Maduro',
    origin: 'Pennsylvania and Connecticut, USA',
    characteristics: 'Thick, rugged broadleaf with deep fermentation, toothy texture, and natural sweetness.',
    burn: 'A slow, cool burn brings molasses, dried fruit, and oak forward without rushing the smoke.',
    strength: 3, aroma: 4, body: 4,
    notes: ['Molasses', 'Dried Fruit', 'Oak'],
    tasting: 'Deep molasses and dried cherry evolve into a long oaken finish from slow fermentation.',
    visual: 'radial-gradient(ellipse at 78% 38%, rgba(129,68,29,0.38), transparent 30%), repeating-linear-gradient(12deg, transparent 0 11px, rgba(235,173,91,0.2) 12px 14px), url(/background-lounge-airy.jpg)',
    position: 'right bottom',
  },
]

function DotBar({ value, max = 5 }) {
  return (
    <span className="leaf-dotbar" aria-label={`${value} out of ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? 'is-filled' : ''} />
      ))}
    </span>
  )
}

function LeafCard({ leaf, index, mounted, isStudied, onStudy }) {
  const [flipped, setFlipped] = useState(false)

  function showBack() {
    setFlipped(true)
    onStudy(leaf.id)
  }

  function toggleCard() {
    if (flipped) setFlipped(false)
    else showBack()
  }

  return (
    <article
      className={`leaf-study-card${flipped ? ' is-flipped' : ''}${isStudied ? ' is-studied' : ''}`}
      style={{ transitionDelay: `${index * 70}ms`, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(18px)' }}
    >
      {isStudied && (
        <span className="leaf-studied-badge">
          <span className="material-symbols-outlined">check</span>
          Studied
        </span>
      )}
      <div className="leaf-study-card__inner">
        <button className="leaf-study-card__face leaf-study-card__front" type="button" onClick={toggleCard} aria-label={`Study ${leaf.name}`}>
          <span className="leaf-study-card__number">{leaf.number}</span>
          <span
            className="leaf-study-card__image"
            style={{ backgroundImage: leaf.visual, backgroundPosition: leaf.position }}
            aria-hidden="true"
          />
          <span className="leaf-study-card__body">
            <strong>{leaf.name}</strong>
            <span className="leaf-ratings">
              <span><em>Strength</em><DotBar value={leaf.strength} /></span>
              <span><em>Aroma</em><DotBar value={leaf.aroma} /></span>
              <span><em>Body</em><DotBar value={leaf.body} /></span>
            </span>
            <span className="leaf-tags">
              {leaf.notes.map(note => <span key={note}>{note}</span>)}
            </span>
            <span className="leaf-study-button" onClick={(event) => { event.stopPropagation(); showBack() }}>
              Study Back
              <span className="material-symbols-outlined">flip</span>
            </span>
          </span>
        </button>

        <div className="leaf-study-card__face leaf-study-card__back">
          <div>
            <span className="leaf-back-kicker">Master Sommelier Profile</span>
            <h3>{leaf.name}</h3>
            <dl>
              <div><dt>Origin / Region</dt><dd>{leaf.origin}</dd></div>
              <div><dt>Wrapper Characteristics</dt><dd>{leaf.characteristics}</dd></div>
              <div><dt>Tasting Note</dt><dd>{leaf.tasting}</dd></div>
              <div><dt>Burn / Draw Note</dt><dd>{leaf.burn}</dd></div>
            </dl>
          </div>
          <button type="button" onClick={() => setFlipped(false)}>
            <span className="material-symbols-outlined">flip_to_front</span>
            Return to Front
          </button>
        </div>
      </div>
    </article>
  )
}

export default function Leaves() {
  const navigate = useNavigate()
  const { addXP, completeStep } = useGuestSession()

  const [mounted, setMounted] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [studied, setStudied] = useState(() => new Set())

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80)
    return () => clearTimeout(t)
  }, [])

  function markStudied(id) {
    setStudied(prev => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  function handleReady() {
    if (accepted || studied.size < VARIETIES.length) return
    setAccepted(true)
    addXP(75)
    completeStep('leaves')
    setTimeout(() => navigate('/smokecraft/leaf-challenge'), 400)
  }

  const ready = studied.size === VARIETIES.length

  return (
    <div className="leaf-education-page">
      <style>{`
        .leaf-education-page {
          min-height: 100vh;
          background: #050302;
          color: #f5ead7;
          overflow-x: hidden;
          position: relative;
          padding-bottom: 116px;
        }
        .leaf-education-page::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image:
            radial-gradient(ellipse at 7% 30%, rgba(255,255,255,0.16), transparent 24%),
            radial-gradient(ellipse at 95% 34%, rgba(255,255,255,0.12), transparent 23%),
            radial-gradient(circle at 50% 30%, rgba(233,193,118,0.12), transparent 32%),
            linear-gradient(90deg, rgba(5,3,2,0.94), rgba(5,3,2,0.62), rgba(5,3,2,0.94)),
            url(/background-lounge-airy.jpg);
          background-size: cover;
          background-position: center;
          filter: saturate(1.08) contrast(1.12) brightness(0.62);
        }
        .leaf-education-page::after {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background: radial-gradient(ellipse at center, transparent 0%, transparent 56%, rgba(0,0,0,0.76) 100%);
        }
        .leaf-header {
          position: fixed;
          z-index: 60;
          top: 0;
          left: 0;
          right: 0;
          min-height: 66px;
          display: grid;
          grid-template-columns: 230px 1fr 270px;
          align-items: center;
          gap: 18px;
          padding: 0 22px;
          border-bottom: 1px solid rgba(233,193,118,0.25);
          background: rgba(8,5,2,0.9);
          backdrop-filter: blur(14px);
        }
        .leaf-header__brand,
        .leaf-header__actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .leaf-header__actions {
          justify-content: flex-end;
        }
        .leaf-header button {
          cursor: pointer;
        }
        .leaf-back {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 1px solid rgba(233,193,118,0.38);
          display: grid;
          place-items: center;
          color: #e9c176;
          background: rgba(233,193,118,0.08);
        }
        .leaf-brand {
          font-family: "Playfair Display", serif;
          font-size: 20px;
          font-weight: 700;
          color: #e9c176;
        }
        .leaf-progress {
          min-width: 0;
        }
        .leaf-progress__labels {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 9px;
          color: #e9c176;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.18em;
        }
        .leaf-progress__label {
          color: rgba(233,193,118,0.76);
          font-style: italic;
          letter-spacing: 0.08em;
          text-transform: none;
        }
        .leaf-progress__bar {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 7px;
        }
        .leaf-progress__bar span {
          height: 4px;
          border-radius: 999px;
          background: rgba(255,255,255,0.12);
        }
        .leaf-progress__bar span.is-filled {
          background: linear-gradient(90deg, #c2933f, #f0d184);
          box-shadow: 0 0 10px rgba(233,193,118,0.42);
        }
        .leaf-lounge {
          min-height: 42px;
          border: 0;
          background: transparent;
          color: #e9c176;
          font-weight: 700;
          letter-spacing: 0.1em;
        }
        .leaf-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          overflow: hidden;
          border: 1px solid rgba(233,193,118,0.55);
          background: rgba(233,193,118,0.1);
        }
        .leaf-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .leaf-main {
          position: relative;
          z-index: 2;
          max-width: 1200px;
          margin: 0 auto;
          padding: 102px 28px 34px;
        }
        .leaf-hero {
          display: grid;
          grid-template-columns: 0.78fr 1fr;
          gap: 46px;
          align-items: end;
          margin-bottom: 22px;
        }
        .leaf-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #d7a94e;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.28em;
          margin-bottom: 12px;
        }
        .leaf-eyebrow::before,
        .leaf-eyebrow::after {
          content: "";
          width: 34px;
          height: 1px;
          background: rgba(233,193,118,0.58);
        }
        .leaf-hero h1 {
          margin: 0;
          font-family: "Playfair Display", serif;
          font-size: clamp(42px, 6vw, 72px);
          line-height: 0.95;
          font-weight: 650;
          color: #f7efe2;
        }
        .leaf-hero h1 em {
          color: #e9c176;
          font-style: italic;
        }
        .leaf-hero p {
          margin: 0;
          color: rgba(245,234,215,0.76);
          font-size: 15px;
          line-height: 1.58;
        }
        .leaf-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
          margin-bottom: 22px;
        }
        .leaf-study-card {
          position: relative;
          min-height: 260px;
          perspective: 1200px;
          transition: opacity 0.55s ease, transform 0.55s ease;
        }
        .leaf-study-card__inner {
          position: absolute;
          inset: 0;
          transform-style: preserve-3d;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .leaf-study-card.is-flipped .leaf-study-card__inner {
          transform: rotateY(180deg);
        }
        .leaf-study-card__face {
          position: absolute;
          inset: 0;
          width: 100%;
          border: 1px solid rgba(233,193,118,0.34);
          border-radius: 12px;
          overflow: hidden;
          color: #f5ead7;
          text-align: left;
          background: linear-gradient(180deg, rgba(18,14,10,0.94), rgba(7,5,3,0.92));
          box-shadow: 0 16px 38px rgba(0,0,0,0.36);
          backface-visibility: hidden;
        }
        .leaf-study-card.is-studied .leaf-study-card__face {
          border-color: rgba(233,193,118,0.62);
          box-shadow: 0 0 0 1px rgba(233,193,118,0.16), 0 0 26px rgba(233,193,118,0.16), 0 16px 38px rgba(0,0,0,0.38);
        }
        .leaf-study-card__front {
          cursor: pointer;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .leaf-study-card__back {
          transform: rotateY(180deg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background:
            radial-gradient(circle at 100% 100%, rgba(233,193,118,0.12), transparent 34%),
            linear-gradient(155deg, #2a180c, #0b0603);
        }
        .leaf-study-card__number {
          position: absolute;
          z-index: 4;
          left: 13px;
          top: 12px;
          min-width: 38px;
          height: 24px;
          border: 1px solid rgba(233,193,118,0.72);
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: #f0d184;
          background: rgba(8,5,2,0.72);
          font-size: 11px;
          font-weight: 800;
        }
        .leaf-study-card__image {
          height: 118px;
          background-size: cover;
          background-position: center;
        }
        .leaf-study-card__body {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 13px 16px 14px;
          background: linear-gradient(180deg, rgba(10,8,6,0.72), rgba(7,5,3,0.96));
        }
        .leaf-study-card strong {
          display: block;
          font-family: "Playfair Display", serif;
          font-size: 20px;
          font-weight: 500;
          color: #f5ead7;
          margin-bottom: 8px;
        }
        .leaf-ratings {
          display: grid;
          gap: 4px;
          margin-bottom: 8px;
        }
        .leaf-ratings > span {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .leaf-ratings em {
          width: 74px;
          color: rgba(245,234,215,0.72);
          font-style: normal;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .leaf-dotbar {
          display: inline-flex;
          gap: 5px;
        }
        .leaf-dotbar span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.14);
        }
        .leaf-dotbar span.is-filled {
          background: #d9a851;
          box-shadow: 0 0 8px rgba(233,193,118,0.34);
        }
        .leaf-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: auto;
        }
        .leaf-tags span {
          border: 1px solid rgba(233,193,118,0.24);
          border-radius: 999px;
          padding: 5px 8px;
          color: rgba(245,234,215,0.78);
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .leaf-study-button {
          min-height: 36px;
          margin-top: 10px;
          border: 1px solid rgba(233,193,118,0.34);
          border-radius: 7px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #e9c176;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          background: rgba(233,193,118,0.05);
        }
        .leaf-study-button .material-symbols-outlined {
          font-size: 15px;
        }
        .leaf-studied-badge {
          position: absolute;
          right: 10px;
          top: 10px;
          z-index: 8;
          min-height: 28px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 0 9px;
          color: #1b1004;
          background: linear-gradient(135deg, #f0d184, #bd903c);
          box-shadow: 0 0 18px rgba(233,193,118,0.35);
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .leaf-studied-badge .material-symbols-outlined {
          font-size: 14px;
        }
        .leaf-back-kicker {
          display: block;
          margin-bottom: 8px;
          color: #e9c176;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.18em;
        }
        .leaf-study-card__back h3 {
          margin: 0 0 10px;
          font-family: "Playfair Display", serif;
          color: #f0d184;
          font-size: 21px;
        }
        .leaf-study-card__back dl {
          display: grid;
          gap: 8px;
          margin: 0;
        }
        .leaf-study-card__back dt {
          color: rgba(233,193,118,0.74);
          font-size: 9px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .leaf-study-card__back dd {
          margin: 2px 0 0;
          color: rgba(245,234,215,0.78);
          font-size: 12px;
          line-height: 1.35;
        }
        .leaf-study-card__back button {
          min-height: 42px;
          border: 1px solid rgba(233,193,118,0.34);
          border-radius: 9px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #e9c176;
          background: rgba(233,193,118,0.07);
          cursor: pointer;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.1em;
          font-size: 11px;
        }
        .leaf-challenge-panel {
          display: grid;
          grid-template-columns: 80px 1fr 270px;
          gap: 24px;
          align-items: center;
          border: 1px solid rgba(233,193,118,0.32);
          border-radius: 12px;
          padding: 22px 28px;
          background: linear-gradient(135deg, rgba(16,12,8,0.9), rgba(7,5,3,0.86));
          box-shadow: 0 18px 44px rgba(0,0,0,0.36);
        }
        .leaf-challenge-icon {
          width: 66px;
          height: 66px;
          border: 1px solid rgba(233,193,118,0.42);
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #e9c176;
          background: rgba(233,193,118,0.08);
        }
        .leaf-challenge-icon span {
          font-size: 34px;
        }
        .leaf-challenge-panel h2 {
          margin: 0 0 6px;
          color: #e9c176;
          font-family: "Playfair Display", serif;
          font-size: 26px;
        }
        .leaf-challenge-panel p {
          margin: 0;
          color: rgba(245,234,215,0.76);
          font-size: 15px;
          line-height: 1.45;
        }
        .leaf-ready-wrap {
          border-left: 1px solid rgba(233,193,118,0.22);
          padding-left: 24px;
          text-align: center;
        }
        .leaf-ready {
          width: 100%;
          min-height: 58px;
          border: 0;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          color: #201300;
          background: linear-gradient(135deg, #f0d184, #c2933f);
          box-shadow: 0 0 34px rgba(233,193,118,0.36);
          cursor: pointer;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: 0.18em;
        }
        .leaf-ready:disabled {
          cursor: not-allowed;
          filter: grayscale(0.9);
          opacity: 0.46;
          box-shadow: none;
        }
        .leaf-ready-meta {
          margin-top: 9px;
          color: rgba(245,234,215,0.52);
          font-size: 11px;
        }
        @media (max-width: 980px) {
          .leaf-header {
            grid-template-columns: 1fr;
            gap: 8px;
            padding: 10px 16px;
          }
          .leaf-header__actions {
            position: absolute;
            right: 14px;
            top: 10px;
          }
          .leaf-progress {
            margin-right: 150px;
          }
          .leaf-main {
            padding: 132px 18px 30px;
          }
          .leaf-hero {
            grid-template-columns: 1fr;
            gap: 14px;
          }
          .leaf-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .leaf-challenge-panel {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .leaf-challenge-icon {
            margin: 0 auto;
          }
          .leaf-ready-wrap {
            border-left: 0;
            border-top: 1px solid rgba(233,193,118,0.22);
            padding: 20px 0 0;
          }
        }
        @media (max-width: 640px) {
          .leaf-brand {
            font-size: 17px;
          }
          .leaf-lounge {
            display: none;
          }
          .leaf-avatar {
            width: 38px;
            height: 38px;
          }
          .leaf-progress {
            margin-right: 54px;
          }
          .leaf-grid {
            grid-template-columns: 1fr;
          }
          .leaf-study-card {
            min-height: 300px;
          }
          .leaf-hero h1 {
            font-size: 46px;
          }
        }
      `}</style>

      <header className="leaf-header">
        <div className="leaf-header__brand">
          <button className="leaf-back material-symbols-outlined" onClick={() => navigate('/smokecraft/origins')} aria-label="Back to seed and soil">
            arrow_back
          </button>
          <span className="material-symbols-outlined text-[#e9c176]">eco</span>
          <span className="leaf-brand">CraftHub 360</span>
        </div>

        <div className="leaf-progress">
          <div className="leaf-progress__labels">
            <span>Step 6 of 12</span>
            <span className="leaf-progress__label">Leaf Education</span>
          </div>
          <div className="leaf-progress__bar" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <span key={i} className={i < 6 ? 'is-filled' : ''} />)}
          </div>
        </div>

        <div className="leaf-header__actions">
          <button className="leaf-lounge" onClick={() => navigate('/grand-lounge-ranking')}>Grand Lounge</button>
          <button className="leaf-avatar" onClick={() => navigate('/passport')} aria-label="Open passport">
            <img src="/passport.jpg" alt="" />
          </button>
        </div>
      </header>

      <main className="leaf-main">
        <section className="leaf-hero">
          <div>
            <div className="leaf-eyebrow">The Study Session</div>
            <h1>Know Your <em>Leaves</em></h1>
          </div>
          <p>
            Master blenders identify tobacco by sight, texture, and origin before a single leaf is rolled.
            Study these six varieties - flip each card to unlock the Master Sommelier's tasting note.
            The recognition challenge follows.
          </p>
        </section>

        <section className="leaf-grid" aria-label="Leaf education cards">
          {VARIETIES.map((leaf, index) => (
            <LeafCard
              key={leaf.id}
              leaf={leaf}
              index={index}
              mounted={mounted}
              isStudied={studied.has(leaf.id)}
              onStudy={markStudied}
            />
          ))}
        </section>

        <section className="leaf-challenge-panel">
          <div className="leaf-challenge-icon">
            <span className="material-symbols-outlined">quiz</span>
          </div>
          <div>
            <h2>Ready for the Challenge?</h2>
            <p>
              Flip each card to review the full profile before you proceed. The recognition challenge will test your ability
              to identify each variety by sight alone - 5 rounds, no retakes.
            </p>
          </div>
          <div className="leaf-ready-wrap">
            <button className="leaf-ready" onClick={handleReady} disabled={!ready || accepted}>
              <span className="material-symbols-outlined">{accepted ? 'check_circle' : 'eco'}</span>
              {accepted ? 'Entering...' : "I'm Ready"}
            </button>
            <div className="leaf-ready-meta">
              {ready ? '+75 XP · Unlocks Leaf Challenge' : `${studied.size} / ${VARIETIES.length} leaves studied`}
            </div>
          </div>
        </section>
      </main>

      <SmokeCraftBottomNav active="smokecraft" />
    </div>
  )
}
