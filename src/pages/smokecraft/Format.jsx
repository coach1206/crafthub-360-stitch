import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import {
  SmokeCraftBottomNav,
  SmokeCraftPremiumHeader,
} from '../../components/smokecraft/SmokeCraftPremium.jsx'

const FALLBACK_CIGAR_IMAGE = '/cigar-anatomy.png'

// APPROVED SMOKECRAFT VISUAL ASSETS.
// Do not replace cigar images with cartoon placeholders, fake cigar strips, or flat illustrations.
// Per-format shape photos (/assets/smokecraft/cigars/*.jpg) do not exist in the repo yet, so every
// FORMATS entry below is explicitly flagged hasPhoto: false. This flag — not a browser onError race —
// decides which visual renders, so the fallback panel is always intentional and never a blank/broken
// image while the per-shape photo request resolves.

function CigarImage({ image, hasPhoto, name, height = '80px' }) {
  if (hasPhoto && image) {
    return (
      <img
        src={image}
        alt={name}
        style={{ width: '100%', height, objectFit: 'contain', objectPosition: 'center', display: 'block' }}
      />
    )
  }
  return <CigarFallbackPanel name={name} height={height} />
}

// Shape-specific crop/scale treatments so all 6 fallback panels — sharing the same
// cigar-anatomy.png source — read as distinct shapes rather than duplicated thumbnails.
const SHAPE_TREATMENTS = {
  robusto:   { scale: 1.55, posY: '46%', label: 'Short & Thick' },
  toro:      { scale: 1.25, posY: '50%', label: 'Long & Balanced' },
  churchill: { scale: 1.05, posY: '50%', label: 'Longest & Slim' },
  corona:    { scale: 1.4,  posY: '54%', label: 'Slim & Classic' },
  gordo:     { scale: 1.7,  posY: '46%', label: 'Thick Ring Gauge' },
  torpedo:   { scale: 1.2,  posY: '42%', label: 'Tapered Figurado' },
}

function CigarFallbackPanel({ name, height }) {
  const key = name.toLowerCase().includes('torpedo') ? 'torpedo' : name.toLowerCase().replace(/[^a-z]/g, '')
  const treatment = SHAPE_TREATMENTS[key] || { scale: 1.3, posY: '50%', label: 'Real photo pending' }
  return (
    <div className="cigar-fallback-panel" style={{ height }}>
      <div
        className="cigar-fallback-panel__art"
        style={{
          backgroundImage: `url(${FALLBACK_CIGAR_IMAGE})`,
          backgroundSize: `${treatment.scale * 100}% auto`,
          backgroundPosition: `center ${treatment.posY}`,
        }}
      />
      <div className="cigar-fallback-panel__rim" aria-hidden="true" />
      <span className="cigar-fallback-panel__badge">{treatment.label}</span>
      <span className="cigar-fallback-panel__pending">Real photo pending</span>
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
          min-height: 296px;
          padding: 22px;
          border-radius: 16px;
          border: 1px solid rgba(233,193,118,0.26);
          background:
            radial-gradient(ellipse at 50% 0%, rgba(233,193,118,0.07), transparent 55%),
            linear-gradient(135deg, rgba(34,23,12,0.92), rgba(9,6,3,0.92));
          color: #f7efe2;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,236,178,0.06);
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .format-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,225,151,0.6);
        }
        .format-card.is-selected {
          border-color: rgba(255,225,151,0.95);
          box-shadow: 0 0 0 1.5px rgba(255,225,151,0.4), 0 0 46px rgba(233,193,118,0.38), 0 26px 56px rgba(0,0,0,0.5), inset 0 0 30px rgba(233,193,118,0.08);
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
          height: 168px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 16px 0 14px;
          border-radius: 12px;
          overflow: hidden;
          background:
            radial-gradient(ellipse at center, rgba(233,193,118,0.12), transparent 65%),
            linear-gradient(135deg, rgba(0,0,0,0.22), rgba(233,193,118,0.04));
        }
        .cigar-fallback-panel {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 10px;
          overflow: hidden;
          background: linear-gradient(160deg, #2a1c0e 0%, #160e06 70%, #0c0703 100%);
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.14);
        }
        .cigar-fallback-panel__art {
          position: absolute;
          inset: 0;
          background-repeat: no-repeat;
          filter: brightness(0.82) saturate(1.05);
          opacity: 0.92;
        }
        .cigar-fallback-panel__rim {
          position: absolute;
          inset: 0;
          border-radius: 10px;
          box-shadow:
            inset 0 0 0 1.5px rgba(233,193,118,0.42),
            inset 0 0 28px rgba(233,193,118,0.16);
          background: radial-gradient(ellipse at 50% 0%, rgba(233,193,118,0.14), transparent 60%);
          pointer-events: none;
        }
        .cigar-fallback-panel__badge {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 2;
          padding: 4px 9px;
          border-radius: 999px;
          background: rgba(10,6,3,0.78);
          border: 1px solid rgba(233,193,118,0.4);
          color: #e9c176;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .cigar-fallback-panel__pending {
          position: absolute;
          bottom: 8px;
          right: 9px;
          z-index: 2;
          color: rgba(233,193,118,0.62);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.1em;
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
          margin: 0 0 6px;
          font-family: "Playfair Display", Georgia, serif;
          color: #f7efe2;
          font-size: 27px;
          line-height: 1.05;
        }
        .format-card p {
          margin: 0 0 12px;
          color: rgba(247,239,226,0.76);
          font-size: 15px;
          line-height: 1.35;
        }
        .format-card__metrics {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 12px;
          color: #e9c176;
          font-size: 13px;
          font-weight: 800;
        }
        .format-card__metrics span {
          display: inline-flex;
          align-items: center;
          gap: 4px;
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
                      <CigarImage image={format.image} hasPhoto={format.hasPhoto} name={format.name} height="100%" />
                    </span>
                    <h2>{format.name}</h2>
                    <p>{format.description}</p>
                    <span className="format-card__metrics">
                      <span><span className="material-symbols-outlined">straighten</span>{format.length}</span>
                      <span><span className="material-symbols-outlined">timer</span>{format.burnTime}</span>
                      <span>{format.strengthBody}</span>
                    </span>
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
                    <CigarImage image={insightFormat.image} hasPhoto={insightFormat.hasPhoto} name={insightFormat.name} height="100%" />
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
