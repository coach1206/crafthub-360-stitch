import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import {
  SmokeCraftBottomNav,
  SmokeCraftPremiumHeader,
} from '../../components/smokecraft/SmokeCraftPremium.jsx'

// VITOLA DIAGRAM SYSTEM.
// Real per-shape cigar photographs (/assets/smokecraft/cigars/*.jpg) do not exist in the repo.
// Rather than crop a placeholder photo, each cigar shape is drawn live as an SVG silhouette,
// scaled per-shape by diagram.lengthScale / diagram.ringGaugeScale / diagram.taper. This is the
// primary visual for every card and the Format Insight panel — it never depends on an image load.
function VitolaDiagram({ format }) {
  const { lengthScale, ringGaugeScale, taper } = format.diagram
  const viewW = 220
  const viewH = 88
  const width = 64 + lengthScale * 132
  const height = 18 + ringGaugeScale * 38
  const x = (viewW - width) / 2
  const y = (viewH - height) / 2
  const cap = height / 2
  const gradId = `vitola-wrapper-${format.id}`
  const bandX = x + width * 0.66
  const bandWidth = Math.max(8, width * 0.06)

  const taperedPath = `M ${x + cap * 1.1} ${y + height / 2}
    Q ${x + width * 0.3} ${y} ${x + width * 0.58} ${y}
    L ${x + width - cap} ${y}
    A ${cap} ${cap} 0 0 1 ${x + width - cap} ${y + height}
    L ${x + width * 0.58} ${y + height}
    Q ${x + width * 0.3} ${y + height} ${x + cap * 1.1} ${y + height / 2}
    Z`

  return (
    <div className="vitola-stage">
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="vitola-svg" role="img" aria-label={`${format.name} vitola diagram`}>
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b4322" />
            <stop offset="45%" stopColor="#3c2613" />
            <stop offset="100%" stopColor="#1c1108" />
          </linearGradient>
        </defs>
        <ellipse cx={viewW / 2} cy={viewH / 2} rx={width / 1.55} ry={height * 1.5} fill="rgba(233,193,118,0.12)" />
        {taper ? (
          <path d={taperedPath} fill={`url(#${gradId})`} stroke="rgba(233,193,118,0.5)" strokeWidth="1" />
        ) : (
          <rect x={x} y={y} width={width} height={height} rx={cap} ry={cap} fill={`url(#${gradId})`} stroke="rgba(233,193,118,0.5)" strokeWidth="1" />
        )}
        <rect x={x + width - cap * 0.9} y={y + 2} width={cap * 0.9} height={height - 4} rx={cap * 0.5} fill="rgba(10,6,3,0.65)" />
        <rect x={bandX} y={y - 2} width={bandWidth} height={height + 4} rx="2" fill="#e9c176" opacity="0.9" />
        <rect x={bandX} y={y - 2} width={bandWidth} height="6" rx="2" fill="#fff" opacity="0.25" />
      </svg>
      <span className="vitola-caption">Vitola diagram · Real photo pending</span>
    </div>
  )
}

const FORMATS = [
  {
    id: 'robusto',
    name: 'Robusto',
    shape: 'Straight Parejo',
    length: '5 inches',
    ringGauge: '50',
    drawFeel: 'Balanced',
    burnTime: '45–60 minutes',
    strengthBody: 'Medium',
    bodyScore: 3,
    category: 'balanced',
    description: 'The perfect balance of time and flavor.',
    tags: ['Balanced', 'Everyday', 'Smooth Draw'],
    xp: 25,
    tip: 'Robusto keeps the session focused: enough ring gauge for smoke volume, short enough to preserve intensity.',
    bestUseCase: 'Everyday smoke, quick relaxation',
    experienceLevel: 'Beginner Friendly',
    flavorImpact: 'Balanced & Approachable',
    diagram: { lengthScale: 0.32, ringGaugeScale: 0.85, taper: false },
    image: '/assets/smokecraft/cigars/robusto.jpg',
    hasPhoto: false,
  },
  {
    id: 'toro',
    name: 'Toro',
    shape: 'Straight Parejo',
    length: '6 inches',
    ringGauge: '50',
    drawFeel: 'Rich',
    burnTime: '60–75 minutes',
    strengthBody: 'Medium+',
    bodyScore: 4,
    category: 'balanced',
    description: 'A longer, richer smoke with great balance.',
    tags: ['Long Session', 'Rich Draw', 'Balanced'],
    xp: 30,
    tip: 'Toro length lets a blend evolve gradually, making it ideal for pairings that open in stages.',
    bestUseCase: 'Long pairings, evening unwind',
    experienceLevel: 'Beginner–Intermediate',
    flavorImpact: 'Rich & Evolving',
    diagram: { lengthScale: 0.62, ringGaugeScale: 0.62, taper: false },
    image: '/assets/smokecraft/cigars/toro.jpg',
    hasPhoto: false,
  },
  {
    id: 'churchill',
    name: 'Churchill',
    shape: 'Straight Parejo',
    length: '7 inches',
    ringGauge: '47',
    drawFeel: 'Cool / Long',
    burnTime: '75–105 minutes',
    strengthBody: 'Medium',
    bodyScore: 3,
    category: 'long',
    description: 'Classic length. Refined and consistent.',
    tags: ['Long Session', 'Elegant', 'Cool Burn'],
    xp: 35,
    tip: 'Churchill rewards patience. Its length cools the smoke and gives subtle tobaccos more room to speak.',
    bestUseCase: 'Special occasions, slow lounge sessions',
    experienceLevel: 'Intermediate',
    flavorImpact: 'Refined & Cool',
    diagram: { lengthScale: 0.92, ringGaugeScale: 0.46, taper: false },
    image: '/assets/smokecraft/cigars/churchill.jpg',
    hasPhoto: false,
  },
  {
    id: 'corona',
    name: 'Corona',
    shape: 'Straight Parejo',
    length: '5½ inches',
    ringGauge: '42',
    drawFeel: 'Lighter',
    burnTime: '35–50 minutes',
    strengthBody: 'Mild–Medium',
    bodyScore: 2,
    category: 'short',
    description: 'Timeless and approachable.',
    tags: ['Lighter Draw', 'Classic', 'Quick Smoke'],
    xp: 20,
    tip: 'Corona uses a slimmer ring gauge to concentrate wrapper character and keep the session crisp.',
    bestUseCase: 'Quick smoke, casual moments',
    experienceLevel: 'Beginner Friendly',
    flavorImpact: 'Crisp & Light',
    diagram: { lengthScale: 0.42, ringGaugeScale: 0.4, taper: false },
    image: '/assets/smokecraft/cigars/corona.jpg',
    hasPhoto: false,
  },
  {
    id: 'gordo',
    name: 'Gordo',
    shape: 'Straight Parejo',
    length: '6 inches',
    ringGauge: '60',
    drawFeel: 'Full / Slow',
    burnTime: '75–120 minutes',
    strengthBody: 'Full',
    bodyScore: 5,
    category: 'long',
    description: 'Big ring gauge. Bold, cool and satisfying.',
    tags: ['Full Flavor', 'Slow Burn', 'Cool Smoke'],
    xp: 40,
    tip: 'Gordo delivers more filler volume and a cooler burn, so the blend needs structure to avoid becoming soft.',
    bestUseCase: 'Bold relaxation, slow deep sessions',
    experienceLevel: 'Experienced',
    flavorImpact: 'Full & Bold',
    diagram: { lengthScale: 0.55, ringGaugeScale: 1, taper: false },
    image: '/assets/smokecraft/cigars/gordo.jpg',
    hasPhoto: false,
  },
  {
    id: 'torpedo',
    name: 'Torpedo / Figurado',
    shape: 'Tapered Figurado',
    length: '6½ inches',
    ringGauge: '52',
    drawFeel: 'Focused / Complex',
    burnTime: '60–90 minutes',
    strengthBody: 'Medium+',
    bodyScore: 4,
    category: 'long',
    description: 'Tapered for complexity and intensity.',
    tags: ['Complex', 'Focused Flavor', 'Rich Draw'],
    xp: 45,
    tip: 'A tapered head focuses the draw, making Torpedo formats especially useful for layered, complex blends.',
    bestUseCase: 'Focused tasting, complex blends',
    experienceLevel: 'Experienced',
    flavorImpact: 'Layered & Intense',
    diagram: { lengthScale: 0.78, ringGaugeScale: 0.58, taper: true },
    image: '/assets/smokecraft/cigars/torpedo-figurado.jpg',
    hasPhoto: false,
  },
]

const SESSION_TYPES = [
  {
    id: 'short',
    label: 'Short Session',
    range: '0–50 min',
    copy: 'Quick pleasure, lighter body.',
  },
  {
    id: 'balanced',
    label: 'Balanced Session',
    range: '50–75 min',
    copy: 'Most versatile. Perfect balance.',
  },
  {
    id: 'long',
    label: 'Long Session',
    range: '75–120+ min',
    copy: 'Slow burn, deeper experience.',
  },
]

const DEFAULT_TIP =
  'A larger ring gauge delivers more smoke and a slower burn. Paired with the right wrapper and filler, the shape defines how the cigar evolves — and how you savor it.'

function Dots({ count }) {
  return (
    <span className="format-dots" aria-label={`${count} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} className={index < count ? 'is-filled' : ''} />
      ))}
    </span>
  )
}

function buildSavedFormat(format) {
  return {
    id: format.id,
    name: format.name,
    shape: format.shape,
    length: format.length,
    ringGauge: format.ringGauge,
    drawFeel: format.drawFeel,
    burnTime: format.burnTime,
    strengthBody: format.strengthBody,
    sessionCategory: format.category,
    tags: format.tags,
    xp: format.xp,
    passportStampReady: 'Format Guide Completed',
  }
}

export default function Format() {
  const navigate = useNavigate()
  const { session, setSmokeCraftFormat, completeStep } = useGuestSession()
  const savedFormatId = session.smokeCraft?.selectedFormat?.id || null
  const [selectedId, setSelectedId] = useState(savedFormatId)
  const [feedback, setFeedback] = useState('')

  const selected = useMemo(
    () => FORMATS.find(format => format.id === selectedId) || null,
    [selectedId]
  )
  const insightFormat = selected || FORMATS[0]
  const isSaved = Boolean(selected && savedFormatId === selected.id)

  function selectFormat(formatId) {
    setSelectedId(formatId)
    setFeedback('')
  }

  function saveFormat() {
    if (!selected) return
    const alreadyAwarded = Boolean(session.smokeCraft?.formatXpAwarded)
    setSmokeCraftFormat(buildSavedFormat(selected), selected.xp)
    completeStep('format')
    setFeedback(alreadyAwarded ? `Format saved · ${selected.name}` : `Format saved · +${selected.xp} XP`)
  }

  function continueNext() {
    if (!selected) return
    if (!isSaved) saveFormat()
    navigate('/smokecraft/seed-soil')
  }

  return (
    <div className="smokecraft-format-page">
      <style>{`
        .smokecraft-format-page {
          min-height: 100vh;
          color: #f7efe2;
          background: #050302;
          position: relative;
          overflow-x: hidden;
          padding-bottom: 160px;
        }
        .smokecraft-format-page::before {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image:
            radial-gradient(circle at 24% 36%, rgba(233,193,118,0.18), transparent 28%),
            radial-gradient(circle at 78% 18%, rgba(255,255,255,0.08), transparent 22%),
            linear-gradient(90deg, rgba(5,3,2,0.98), rgba(5,3,2,0.68), rgba(5,3,2,0.95)),
            url(/assets/smokecraft/cropped/management-sync-bg.jpg);
          background-size: cover;
          background-position: center;
          filter: brightness(0.62) saturate(1.12) contrast(1.1);
        }
        .smokecraft-format-page::after {
          content: "";
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 6% 62%, rgba(255,255,255,0.11), transparent 22%),
            radial-gradient(ellipse at 88% 42%, rgba(255,255,255,0.1), transparent 24%),
            linear-gradient(180deg, rgba(0,0,0,0.16), rgba(0,0,0,0.7));
        }
        .format-shell {
          position: relative;
          z-index: 2;
          max-width: 1320px;
          margin: 0 auto;
          padding: 104px 28px 40px;
        }
        .format-progress {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 18px;
          align-items: center;
          color: #e9c176;
          margin-bottom: 20px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-weight: 900;
        }
        .format-progress__track {
          height: 5px;
          border-radius: 999px;
          background: linear-gradient(90deg, #e9c176 0 42%, rgba(233,193,118,0.24) 42% 100%);
          box-shadow: 0 0 22px rgba(233,193,118,0.18);
        }
        .format-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.75fr) minmax(340px, 0.95fr);
          gap: 18px;
          align-items: start;
        }
        .format-eyebrow {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #e9c176;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 14px;
          font-weight: 900;
          margin-bottom: 10px;
        }
        .format-title {
          margin: 0 0 10px;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(48px, 5vw, 76px);
          line-height: 0.96;
          color: #f7efe2;
        }
        .format-title em {
          color: #e9c176;
          font-style: italic;
        }
        .format-intro {
          max-width: 720px;
          margin: 0 0 22px;
          color: rgba(247,239,226,0.8);
          font-size: 17px;
          line-height: 1.55;
        }
        .format-card-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }
        .format-card {
          position: relative;
          min-height: 420px;
          padding: 22px;
          border-radius: 16px;
          border: 1.5px solid rgba(233,193,118,0.3);
          background:
            radial-gradient(ellipse at 50% 0%, rgba(233,193,118,0.1), transparent 60%),
            linear-gradient(160deg, rgba(58,38,20,0.95), rgba(20,13,7,0.96) 55%, rgba(8,5,3,0.97));
          color: #f7efe2;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.08), inset 0 30px 60px rgba(0,0,0,0.32), 0 18px 40px rgba(0,0,0,0.45);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .format-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,225,151,0.6);
        }
        .format-card.is-selected {
          border-color: rgba(255,225,151,0.95);
          box-shadow: 0 0 0 1.5px rgba(255,225,151,0.45), 0 0 56px rgba(233,193,118,0.42), 0 26px 56px rgba(0,0,0,0.5), inset 0 0 34px rgba(233,193,118,0.1);
        }
        .format-card:active {
          transform: scale(0.985);
        }
        .format-card__number,
        .format-card__check {
          position: absolute;
          top: 12px;
          z-index: 3;
        }
        .format-card__number {
          left: 12px;
          min-width: 30px;
          min-height: 22px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(233,193,118,0.48);
          border-radius: 999px;
          color: #e9c176;
          background: rgba(10,6,3,0.78);
          font-size: 12px;
          font-weight: 900;
        }
        .format-card__check {
          right: 12px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #1d1204;
          background: linear-gradient(135deg, #f0d184, #bd8f39);
          box-shadow: 0 0 20px rgba(233,193,118,0.4);
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.2s ease;
        }
        .format-card.is-selected .format-card__check {
          opacity: 1;
          transform: scale(1);
        }
        .format-card__visual {
          height: 152px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px 0 14px;
          border-radius: 12px;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 50% 100%, rgba(233,193,118,0.16), transparent 60%),
            linear-gradient(180deg, rgba(0,0,0,0.4), rgba(40,26,14,0.42));
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.24), inset 0 10px 26px rgba(0,0,0,0.55);
          transition: box-shadow 0.2s ease;
        }
        .format-card.is-selected .format-card__visual {
          box-shadow: inset 0 0 0 1.5px rgba(255,225,151,0.7), inset 0 0 32px rgba(233,193,118,0.28), 0 0 30px rgba(233,193,118,0.32);
        }
        .vitola-stage {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .vitola-svg {
          width: 92%;
          height: 78%;
        }
        .vitola-caption {
          margin-top: 4px;
          color: rgba(233,193,118,0.6);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .format-missing-note {
          padding: 14px 18px;
          color: rgba(233,193,118,0.55);
          font-size: 11px;
          letter-spacing: 0.04em;
          line-height: 1.6;
        }
        .format-missing-note strong {
          display: block;
          color: rgba(233,193,118,0.78);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .format-card h2 {
          margin: 0 0 2px;
          font-family: "Playfair Display", Georgia, serif;
          color: #f7efe2;
          font-size: 27px;
          line-height: 1.05;
        }
        .format-card__type {
          display: inline-block;
          margin-bottom: 8px;
          color: rgba(233,193,118,0.7);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .format-card p {
          margin: 0 0 12px;
          color: rgba(247,239,226,0.76);
          font-size: 15px;
          line-height: 1.35;
        }
        .format-card__facts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 9px 14px;
          margin-bottom: 12px;
        }
        .format-card__facts div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .format-card__fact-label {
          color: rgba(233,193,118,0.62);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .format-card__fact-value {
          color: #f7efe2;
          font-size: 13px;
          font-weight: 700;
          line-height: 1.25;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .format-card__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 11px;
        }
        .format-card__tags span {
          border: 1px solid rgba(233,193,118,0.24);
          border-radius: 999px;
          padding: 5px 8px;
          color: #e9c176;
          background: rgba(233,193,118,0.08);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .format-side {
          display: grid;
          gap: 12px;
        }
        .format-panel {
          border: 1px solid rgba(233,193,118,0.26);
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(17,12,7,0.92), rgba(7,5,3,0.88));
          box-shadow: 0 18px 42px rgba(0,0,0,0.34);
          overflow: hidden;
        }
        .format-panel__inner {
          padding: 18px;
        }
        .format-panel__label {
          color: #e9c176;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 12px;
        }
        .format-insight {
          display: grid;
          grid-template-columns: 42% 1fr;
          gap: 16px;
          align-items: center;
          min-height: 310px;
        }
        .format-insight__cigar {
          min-height: 240px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          overflow: hidden;
          background:
            radial-gradient(circle at center, rgba(233,193,118,0.14), transparent 62%),
            linear-gradient(135deg, rgba(233,193,118,0.06), rgba(0,0,0,0.18));
        }
        .format-insight h2 {
          margin: 0 0 16px;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 28px;
          color: #f7efe2;
        }
        .format-insight dl {
          margin: 0;
          display: grid;
          gap: 12px;
        }
        .format-insight dt {
          color: #e9c176;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 11px;
          font-weight: 900;
        }
        .format-insight dd {
          margin: 2px 0 0;
          color: rgba(247,239,226,0.86);
          font-size: 16px;
          font-weight: 700;
        }
        .format-dots {
          display: inline-flex;
          gap: 5px;
          vertical-align: middle;
        }
        .format-dots span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: rgba(247,239,226,0.18);
        }
        .format-dots span.is-filled {
          background: #e9c176;
          box-shadow: 0 0 10px rgba(233,193,118,0.34);
        }
        .session-list {
          display: grid;
          gap: 12px;
        }
        .session-row {
          min-height: 84px;
          display: grid;
          grid-template-columns: 52px 1fr;
          gap: 14px;
          align-items: center;
          padding: 16px;
          border: 1px solid rgba(233,193,118,0.18);
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(0,0,0,0.18));
          box-shadow: inset 0 1px 0 rgba(255,236,178,0.05);
        }
        .session-row.is-active {
          border-color: rgba(255,225,151,0.8);
          background: linear-gradient(135deg, rgba(233,193,118,0.16), rgba(233,193,118,0.05));
          box-shadow: 0 0 26px rgba(233,193,118,0.2), inset 0 0 0 1px rgba(255,225,151,0.2);
        }
        .session-row__icon {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #e9c176;
          background: radial-gradient(circle, rgba(233,193,118,0.14), transparent 70%);
          border: 1px solid rgba(233,193,118,0.4);
        }
        .session-row strong {
          display: block;
          color: #e9c176;
          text-transform: uppercase;
          font-size: 14px;
          letter-spacing: 0.1em;
          margin-bottom: 2px;
        }
        .session-row span {
          margin: 0;
          color: rgba(247,239,226,0.55);
          font-size: 12px;
          letter-spacing: 0.04em;
        }
        .session-row p {
          margin: 4px 0 0;
          color: rgba(247,239,226,0.74);
          font-size: 13px;
          line-height: 1.35;
        }
        .format-tip {
          display: grid;
          grid-template-columns: 1fr 130px;
          gap: 12px;
          align-items: center;
        }
        .format-tip p {
          margin: 0;
          color: rgba(247,239,226,0.82);
          font-size: 15px;
          line-height: 1.45;
        }
        .format-tip__image {
          height: 86px;
          border-radius: 10px;
          background:
            radial-gradient(circle at 72% 28%, rgba(233,193,118,0.32), transparent 32%),
            linear-gradient(135deg, rgba(65,33,13,0.92), rgba(6,4,3,0.72)),
            url(/assets/smokecraft/cropped/humidor-match-bg.jpg);
          background-size: cover;
          background-position: center;
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.2);
        }
        .format-cta {
          margin-top: 14px;
          min-height: 138px;
          display: grid;
          grid-template-columns: 250px 1fr auto;
          gap: 22px;
          align-items: center;
          padding: 18px;
        }
        .format-cta__image {
          height: 102px;
          border-radius: 12px;
          background:
            linear-gradient(90deg, rgba(5,3,2,0.1), rgba(5,3,2,0.28)),
            url(/assets/smokecraft/cropped/cut-toast-light-bg.jpg);
          background-size: cover;
          background-position: center;
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.24);
        }
        .format-cta h2 {
          margin: 0 0 8px;
          color: #e9c176;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 31px;
        }
        .format-cta p {
          margin: 0;
          color: rgba(247,239,226,0.78);
          font-size: 16px;
          line-height: 1.45;
        }
        .format-actions {
          display: flex;
          gap: 10px;
          align-items: stretch;
        }
        .format-actions button {
          min-height: 62px;
          border-radius: 10px;
          padding: 0 24px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          white-space: nowrap;
          transition: transform 0.2s ease, opacity 0.2s ease, filter 0.2s ease;
        }
        .format-actions button:active {
          transform: scale(0.98);
        }
        .format-save {
          border: 1px solid rgba(233,193,118,0.54);
          color: #e9c176;
          background: rgba(233,193,118,0.08);
        }
        .format-continue {
          border: 0;
          color: #1d1204;
          min-width: 300px;
          background: linear-gradient(135deg, #f5d789, #c8973f);
          box-shadow: 0 0 32px rgba(233,193,118,0.28);
        }
        .format-actions button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
          filter: grayscale(0.75);
          box-shadow: none;
        }
        .format-feedback {
          margin-top: 10px;
          color: #e9c176;
          font-weight: 900;
          min-height: 22px;
          font-size: 15px;
        }
        @media (max-width: 1120px) {
          .format-layout { grid-template-columns: 1fr; }
          .format-card-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .format-cta { grid-template-columns: 180px 1fr; }
          .format-actions { grid-column: 1 / -1; }
        }
        @media (max-width: 720px) {
          .format-shell { padding: 96px 16px 26px; }
          .format-progress { grid-template-columns: 1fr; gap: 8px; }
          .format-progress__label { text-align: left; }
          .format-card-grid { grid-template-columns: 1fr; }
          .format-insight { grid-template-columns: 1fr; }
          .format-insight__cigar { min-height: 180px; }
          .format-cta { grid-template-columns: 1fr; }
          .format-cta__image { display: none; }
          .format-actions { flex-direction: column; }
          .format-continue { min-width: 0; width: 100%; }
          .format-tip { grid-template-columns: 1fr; }
        }
      `}</style>

      <SmokeCraftPremiumHeader
        step="Step 5 of 20"
        backTo="/smokecraft/enroll"
        onRightClick={() => navigate('/grand-lounge-ranking')}
      />

      <main className="format-shell">
        <div className="format-progress" aria-label="SmokeCraft journey progress">
          <span>Step 5 of 20</span>
          <span className="format-progress__track" aria-hidden="true" />
          <span className="format-progress__label">Shape, Size & Burn Time</span>
        </div>

        <div className="format-layout">
          <section>
            <div className="format-eyebrow">
              <span aria-hidden="true">—</span>
              <span>The Format Guide</span>
            </div>
            <h1 className="format-title">Shape, Size & <em>Burn Time</em></h1>
            <p className="format-intro">
              The shape and size of a cigar shape everything — from how it draws and burns, to the body it delivers and
              the rhythm of your experience. Explore the most iconic formats and find the one that matches your moment.
            </p>

            <div className="format-card-grid" aria-label="Cigar format choices">
              {FORMATS.map((format, index) => {
                const isSelected = selected?.id === format.id
                return (
                  <button
                    key={format.id}
                    type="button"
                    className={`format-card${isSelected ? ' is-selected' : ''}`}
                    onClick={() => selectFormat(format.id)}
                    aria-pressed={isSelected}
                  >
                    <span className="format-card__number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="format-card__check material-symbols-outlined" aria-hidden="true">check</span>
                    <span className="format-card__visual" aria-hidden="true">
                      <VitolaDiagram format={format} />
                    </span>
                    <h2>{format.name}</h2>
                    <span className="format-card__type">{format.shape}</span>
                    <p>{format.description}</p>
                    <div className="format-card__facts">
                      <div>
                        <span className="format-card__fact-label">Length</span>
                        <span className="format-card__fact-value">{format.length}</span>
                      </div>
                      <div>
                        <span className="format-card__fact-label">Ring Gauge</span>
                        <span className="format-card__fact-value">{format.ringGauge}</span>
                      </div>
                      <div>
                        <span className="format-card__fact-label">Burn Time</span>
                        <span className="format-card__fact-value">{format.burnTime}</span>
                      </div>
                      <div>
                        <span className="format-card__fact-label">Draw Feel</span>
                        <span className="format-card__fact-value">{format.drawFeel}</span>
                      </div>
                      <div>
                        <span className="format-card__fact-label">Strength / Body</span>
                        <span className="format-card__fact-value"><Dots count={format.bodyScore} /> {format.strengthBody}</span>
                      </div>
                      <div>
                        <span className="format-card__fact-label">Flavor Impact</span>
                        <span className="format-card__fact-value">{format.flavorImpact}</span>
                      </div>
                      <div>
                        <span className="format-card__fact-label">Best Use Case</span>
                        <span className="format-card__fact-value">{format.bestUseCase}</span>
                      </div>
                      <div>
                        <span className="format-card__fact-label">Experience Level</span>
                        <span className="format-card__fact-value">{format.experienceLevel}</span>
                      </div>
                    </div>
                    <span className="format-card__tags">
                      {format.tags.map(tag => <span key={tag}>{tag}</span>)}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>

          <aside className="format-side" aria-label="Selected format insight">
            <section className="format-panel">
              <div className="format-panel__inner">
                <div className="format-panel__label">Format Insight</div>
                <div className="format-insight">
                  <div className="format-insight__cigar" aria-hidden="true">
                    <VitolaDiagram format={insightFormat} />
                  </div>
                  <div>
                    <h2>{insightFormat.name}</h2>
                    <dl>
                      <div>
                        <dt>Shape</dt>
                        <dd>{insightFormat.shape}</dd>
                      </div>
                      <div>
                        <dt>Length</dt>
                        <dd>{insightFormat.length}</dd>
                      </div>
                      <div>
                        <dt>Ring Gauge</dt>
                        <dd>{insightFormat.ringGauge}</dd>
                      </div>
                      <div>
                        <dt>Draw Feel</dt>
                        <dd>{insightFormat.drawFeel}</dd>
                      </div>
                      <div>
                        <dt>Est. Burn Time</dt>
                        <dd>{insightFormat.burnTime}</dd>
                      </div>
                      <div>
                        <dt>Strength / Body</dt>
                        <dd><Dots count={insightFormat.bodyScore} /> {insightFormat.strengthBody}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            </section>

            <section className="format-panel">
              <div className="format-panel__inner">
                <div className="format-panel__label">Session Comparison</div>
                <div className="session-list">
                  {SESSION_TYPES.map(type => (
                    <article key={type.id} className={`session-row${selected?.category === type.id ? ' is-active' : ''}`}>
                      <span className="session-row__icon material-symbols-outlined" aria-hidden="true">timer</span>
                      <div>
                        <strong>{type.label}</strong>
                        <span>{type.range}</span>
                        <p>{type.copy}</p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="format-panel">
              <div className="format-panel__inner format-tip">
                <div>
                  <div className="format-panel__label">Master Tip</div>
                  <p>{selected?.tip || DEFAULT_TIP}</p>
                </div>
                <div className="format-tip__image" aria-hidden="true" />
              </div>
            </section>

            <section className="format-panel">
              <div className="format-missing-note">
                <strong>Required real photos pending</strong>
                robusto.jpg, toro.jpg, churchill.jpg, corona.jpg, gordo.jpg, torpedo-figurado.jpg
              </div>
            </section>
          </aside>
        </div>

        <section className="format-panel format-cta">
          <div className="format-cta__image" aria-hidden="true" />
          <div>
            <h2>{selected ? `Choose ${selected.name} for your pace.` : 'Choose the format that matches your pace.'}</h2>
            <p>
              Your selection will guide pairings, build recommendations, and shape the rhythm of your SmokeCraft journey.
              {selected && ` This format prepares ${selected.xp} XP and the Format Guide Completed stamp marker.`}
            </p>
            <div className="format-feedback" role="status">{feedback}</div>
          </div>
          <div className="format-actions">
            <button className="format-save" type="button" onClick={saveFormat} disabled={!selected}>
              <span className="material-symbols-outlined">bookmark</span>
              Save Format
            </button>
            <button className="format-continue" type="button" onClick={continueNext} disabled={!selected}>
              Continue to Seed &amp; Soil
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </section>
      </main>

      <SmokeCraftBottomNav active="smokecraft" />
    </div>
  )
}
