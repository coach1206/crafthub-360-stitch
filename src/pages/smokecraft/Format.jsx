import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import {
  SmokeCraftBottomNav,
  SmokeCraftPremiumHeader,
} from '../../components/smokecraft/SmokeCraftPremium.jsx'
import CigarIntelligencePanel, { WRAPPER_TYPES } from '../../components/smokecraft/CigarIntelligencePanel.jsx'
import SmokeCraftInsightChip from '../../components/smokecraft/SmokeCraftInsightChip.jsx'
import SmokeCraftInsightPanel from '../../components/smokecraft/SmokeCraftInsightPanel.jsx'
import { triggerHaptic } from '../../utils/haptics.js'
import { getVisitProgress } from '../../constants/session.js'

const WRAPPER_FALLBACK_DESCRIPTION = 'More details coming soon for this SmokeCraft wrapper profile.'

// CIGAR PHOTO VISUAL SYSTEM.
// Each format's final customer-facing visual must come from a dedicated product photo at
// format.image (public/assets/smokecraft/cigars/<id>.jpg — see README.md in that folder for the
// shoot requirements). Cropped lounge/humidor backgrounds are never used as the final visual. If
// the dedicated photo is missing, the card shows an honest "photo missing" state naming the exact
// required filename instead of substituting any other image.
function CigarVisual({ format }) {
  const [missing, setMissing] = useState(false)
  const filename = format.image ? format.image.split('/').pop() : null

  if (!format.image || missing) {
    return (
      <div className="cigar-visual cigar-visual--missing">
        <span className="cigar-visual__missing-icon material-symbols-outlined" aria-hidden="true">
          photo_camera
        </span>
        <span className="cigar-visual__missing-title">Required cigar photo missing</span>
        <span className="cigar-visual__missing-file">{filename || 'unknown.jpg'}</span>
      </div>
    )
  }

  return (
    <div className="cigar-visual">
      <img
        className="cigar-visual__photo"
        src={format.image}
        alt={`${format.name} cigar`}
        onError={() => setMissing(true)}
      />
      <div className="cigar-visual__vignette" aria-hidden="true" />
      <div className="cigar-visual__rim" aria-hidden="true" />
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
    category: 'standard-smoke',
    description: 'The perfect balance of time and flavor.',
    tags: ['Balanced', 'Everyday', 'Smooth Draw'],
    xp: 25,
    tip: 'Robusto keeps the session focused: enough ring gauge for smoke volume, short enough to preserve intensity.',
    bestUseCase: 'Everyday smoke, quick relaxation',
    experienceLevel: 'Beginner Friendly',
    flavorImpact: 'Balanced & Approachable',
    taper: false,
    shapeProfile: { badge: 'Short / Thick', label: 'Short · Thick · 50 Ring Gauge', lengthPct: 45, thicknessPx: 16 },
    image: '/assets/smokecraft/cigars/robusto.jpg',
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
    category: 'standard-smoke',
    description: 'A longer, richer smoke with great balance.',
    tags: ['Long Session', 'Rich Draw', 'Balanced'],
    xp: 30,
    tip: 'Toro length lets a blend evolve gradually, making it ideal for pairings that open in stages.',
    bestUseCase: 'Long pairings, evening unwind',
    experienceLevel: 'Beginner–Intermediate',
    flavorImpact: 'Rich & Evolving',
    taper: false,
    shapeProfile: { badge: 'Long / Balanced', label: 'Long · Balanced · 50 Ring Gauge', lengthPct: 85, thicknessPx: 14 },
    image: '/assets/smokecraft/cigars/toro.jpg',
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
    category: 'long-session',
    description: 'Classic length. Refined and consistent.',
    tags: ['Long Session', 'Elegant', 'Cool Burn'],
    xp: 35,
    tip: 'Churchill rewards patience. Its length cools the smoke and gives subtle tobaccos more room to speak.',
    bestUseCase: 'Special occasions, slow lounge sessions',
    experienceLevel: 'Intermediate',
    flavorImpact: 'Refined & Cool',
    taper: false,
    shapeProfile: { badge: 'Longest / Slim', label: 'Longest · Slim · 47 Ring Gauge', lengthPct: 100, thicknessPx: 9 },
    image: '/assets/smokecraft/cigars/churchill.jpg',
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
    category: 'quick-smoke',
    description: 'Timeless and approachable.',
    tags: ['Lighter Draw', 'Classic', 'Quick Smoke'],
    xp: 20,
    tip: 'Corona uses a slimmer ring gauge to concentrate wrapper character and keep the session crisp.',
    bestUseCase: 'Quick smoke, casual moments',
    experienceLevel: 'Beginner Friendly',
    flavorImpact: 'Crisp & Light',
    taper: false,
    shapeProfile: { badge: 'Small / Slim', label: 'Small · Slim · 42 Ring Gauge', lengthPct: 35, thicknessPx: 8 },
    image: '/assets/smokecraft/cigars/corona.jpg',
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
    category: 'vip-slow-burn',
    description: 'Big ring gauge. Bold, cool and satisfying.',
    tags: ['Full Flavor', 'Slow Burn', 'Cool Smoke'],
    xp: 40,
    tip: 'Gordo delivers more filler volume and a cooler burn, so the blend needs structure to avoid becoming soft.',
    bestUseCase: 'Bold relaxation, slow deep sessions',
    experienceLevel: 'Experienced',
    flavorImpact: 'Full & Bold',
    taper: false,
    shapeProfile: { badge: 'Thickest / Big Ring', label: 'Thickest · 60 Ring Gauge', lengthPct: 65, thicknessPx: 20 },
    image: '/assets/smokecraft/cigars/gordo.jpg',
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
    category: 'long-session',
    description: 'Tapered for complexity and intensity.',
    tags: ['Complex', 'Focused Flavor', 'Rich Draw'],
    xp: 45,
    tip: 'A tapered head focuses the draw, making Torpedo formats especially useful for layered, complex blends.',
    bestUseCase: 'Focused tasting, complex blends',
    experienceLevel: 'Experienced',
    flavorImpact: 'Layered & Intense',
    taper: true,
    shapeProfile: { badge: 'Tapered / Pointed', label: 'Tapered · Figurado · 52 Ring Gauge', lengthPct: 78, thicknessPx: 13 },
    image: '/assets/smokecraft/cigars/torpedo-figurado.jpg',
  },
  {
    id: 'lancero',
    name: 'Lancero',
    shape: 'Straight Parejo',
    length: '7½ inches',
    ringGauge: '38',
    drawFeel: 'Tight / Refined',
    burnTime: '90–120 minutes',
    strengthBody: 'Medium',
    bodyScore: 3,
    category: 'vip-slow-burn',
    description: 'Long and slim. A purist’s format that rewards patience.',
    tags: ['Slim', 'Purist', 'Slow Burn'],
    xp: 40,
    tip: 'The thin ring gauge concentrates the wrapper’s influence, making Lancero a true test of a blend’s balance.',
    bestUseCase: 'Quiet, unhurried evenings',
    experienceLevel: 'Experienced',
    flavorImpact: 'Concentrated & Refined',
    taper: false,
    shapeProfile: { badge: 'Longest / Slimmest', label: 'Longest · Slimmest · 38 Ring Gauge', lengthPct: 100, thicknessPx: 7 },
    // TEMPORARY FALLBACK — no dedicated lancero.jpg shoot exists yet. Reusing corona.jpg
    // (the slimmest photo currently in public/assets/smokecraft/cigars/) as a stand-in.
    // Replace with a real Lancero product photo when available; not final.
    // TODO: Replace with licensed Lancero cigar photo.
    image: '/assets/smokecraft/cigars/corona.jpg',
  },
  {
    id: 'belicoso',
    name: 'Belicoso',
    shape: 'Tapered Figurado',
    length: '5½ inches',
    ringGauge: '52',
    drawFeel: 'Focused / Rounded',
    burnTime: '60–75 minutes',
    strengthBody: 'Medium+',
    bodyScore: 4,
    category: 'standard-smoke',
    description: 'A shorter, rounded taper that softens a Torpedo’s intensity.',
    tags: ['Tapered', 'Rounded Cap', 'Rich Draw'],
    xp: 30,
    tip: 'Belicoso’s rounded taper opens the draw earlier than a Torpedo, giving a gentler ramp into full flavor.',
    bestUseCase: 'Evening lounge sessions',
    experienceLevel: 'Intermediate',
    flavorImpact: 'Rounded & Rich',
    taper: true,
    shapeProfile: { badge: 'Tapered / Rounded', label: 'Tapered · Rounded Cap · 52 Ring Gauge', lengthPct: 60, thicknessPx: 14 },
    // TEMPORARY FALLBACK — no dedicated belicoso.jpg shoot exists yet. Reusing the
    // torpedo-figurado.jpg photo since it shares Belicoso's tapered figurado shape.
    // Replace with a real Belicoso product photo when available; not final.
    // TODO: Replace with licensed Belicoso cigar photo.
    image: '/assets/smokecraft/cigars/torpedo-figurado.jpg',
  },
  {
    id: 'perfecto',
    name: 'Perfecto',
    shape: 'Double-Tapered Figurado',
    length: '5 inches',
    ringGauge: '48',
    drawFeel: 'Variable / Complex',
    burnTime: '50–65 minutes',
    strengthBody: 'Medium',
    bodyScore: 3,
    category: 'standard-smoke',
    description: 'Tapered at both ends — a classic shape with a flavor curve that shifts as it burns.',
    tags: ['Double Taper', 'Classic', 'Evolving'],
    xp: 35,
    tip: 'Perfecto’s changing ring gauge along its length means the draw and flavor concentration shift noticeably third to third.',
    bestUseCase: 'Curious tasting, classic appreciation',
    experienceLevel: 'Intermediate',
    flavorImpact: 'Evolving & Complex',
    taper: true,
    shapeProfile: { badge: 'Double Tapered', label: 'Double-Tapered · 48 Ring Gauge', lengthPct: 50, thicknessPx: 13 },
    // TEMPORARY FALLBACK — no dedicated perfecto.jpg shoot exists yet. Reusing
    // churchill.jpg as the closest classic-shape photo currently available.
    // Replace with a real Perfecto product photo when available; not final.
    // TODO: Replace with licensed Perfecto cigar photo.
    image: '/assets/smokecraft/cigars/churchill.jpg',
  },
  {
    id: 'panetela',
    name: 'Panetela',
    shape: 'Straight Parejo',
    length: '6 inches',
    ringGauge: '34',
    drawFeel: 'Light / Brisk',
    burnTime: '45–60 minutes',
    strengthBody: 'Mild–Medium',
    bodyScore: 2,
    category: 'quick-smoke',
    description: 'Slim and long. A brisk, elegant draw for a shorter window.',
    tags: ['Slim', 'Elegant', 'Quick Smoke'],
    xp: 25,
    tip: 'Panetela’s narrow ring gauge burns fast and bright, so a quicker pace suits the format better than slow sipping.',
    bestUseCase: 'Short windows, elegant quick smoke',
    experienceLevel: 'Beginner–Intermediate',
    flavorImpact: 'Brisk & Elegant',
    taper: false,
    shapeProfile: { badge: 'Slim / Long', label: 'Slim · Long · 34 Ring Gauge', lengthPct: 90, thicknessPx: 6 },
    // TEMPORARY FALLBACK — no dedicated panetela.jpg shoot exists yet. Reusing corona.jpg
    // (the slimmest photo currently in public/assets/smokecraft/cigars/) as a stand-in.
    // Replace with a real Panetela product photo when available; not final.
    // TODO: Replace with licensed Panetela cigar photo.
    image: '/assets/smokecraft/cigars/corona.jpg',
  },
]

const CHIP_FALLBACK_DESCRIPTION = 'More details coming soon for this SmokeCraft profile tag.'

// Descriptive copy for draw-feel / session tags shown on each card. Anything
// not listed here falls back to CHIP_FALLBACK_DESCRIPTION rather than showing
// nothing or a fake explanation.
const TAG_DESCRIPTIONS = {
  'Balanced':       'An even draw and burn with no single note dominating — a safe, versatile choice.',
  'Everyday':       'Sized and paced for a regular smoke, not reserved for special occasions.',
  'Smooth Draw':    'Low resistance pulling air through the cigar, for an easy, relaxed pull.',
  'Rich Draw':      'A fuller-bodied pull that carries more smoke and flavor per draw.',
  'Long Session':   'Built for an extended sit — expect 60+ minutes of evolving flavor.',
  'Lighter Draw':   'An easy, airy pull suited to shorter or more casual smokes.',
  'Classic':        'A traditional shape and profile with a long, proven track record.',
  'Quick Smoke':    'A shorter format built for a focused 30–45 minute window.',
  'Full Flavor':    'Bigger ring gauge, more filler volume, and a bolder flavor delivery.',
  'Slow Burn':      'Burns cooler and longer, giving the blend more time to develop.',
  'Cool Smoke':     'A wider ring gauge keeps the burn temperature lower and the smoke smoother.',
  'Complex':        'Flavor shifts and layers noticeably from first third to last.',
  'Focused Flavor': 'A tapered head concentrates the draw, sharpening flavor delivery.',
  'Elegant':        'A refined, slimmer profile favored for its poise as much as its taste.',
  'Cool Burn':      'Extra length gives smoke more room to cool before it reaches the palate.',
  'Tapered':        'A narrowing head shapes and focuses the draw compared to a straight cut.',
  'Rounded Cap':    'A gentler taper than a torpedo, easing into full flavor sooner.',
  'Double Taper':   'Tapered at both ends, so ring gauge — and flavor concentration — shifts as it burns.',
  'Evolving':       'Flavor intentionally changes shape across the smoke rather than staying flat.',
  'Slim':           'A narrower ring gauge concentrates wrapper character for a more intense profile.',
  'Purist':         'A traditionalist’s format that rewards patience over convenience.',
}

// Descriptive copy for the per-card stat values (Length, Ring Gauge, Burn
// Time, Draw Feel, Strength/Body, Flavor Impact, Best Use Case, Experience
// Level). These explain what the stat means in general, not the specific
// value — the value itself is shown in the chip detail panel separately.
const FACT_DESCRIPTIONS = {
  'Length':           'The physical length of the cigar from foot to cap — a major factor in total smoke time.',
  'Ring Gauge':       'Diameter measured in 64ths of an inch. Wider ring gauges burn cooler and slower.',
  'Burn Time':        'The typical total smoke time for this format under normal pacing — sometimes called "smoke time."',
  'Draw Feel':        'How much resistance you feel pulling smoke through the cigar — from smooth to rich and full.',
  'Strength / Body':  'How intense and full the smoke feels on the palate, from mild to full-bodied.',
  'Flavor Impact':    'The character and intensity of the flavor profile this format is known for.',
  'Best Use Case':    'The moment or pairing this format is best suited for — quick smoke, lounge session, or special occasion.',
  'Experience Level': 'How approachable this format is for a newer smoker versus an experienced one.',
}

function slugify(label) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

/** Builds the structured chip objects for a format's tag pills + fact stats. */
function buildChipsForFormat(format) {
  const tagChips = (format.tags || []).map((tag) => ({
    id: `${format.id}-tag-${slugify(tag)}`,
    label: tag.toUpperCase(),
    category: 'Draw Feel',
    description: TAG_DESCRIPTIONS[tag] || CHIP_FALLBACK_DESCRIPTION,
  }))

  const factChips = [
    { key: 'length', label: 'Length', value: format.length },
    { key: 'ringGauge', label: 'Ring Gauge', value: format.ringGauge },
    { key: 'burnTime', label: 'Burn Time', value: format.burnTime },
    { key: 'drawFeel', label: 'Draw Feel', value: format.drawFeel },
    { key: 'strengthBody', label: 'Strength / Body', value: format.strengthBody },
    { key: 'flavorImpact', label: 'Flavor Impact', value: format.flavorImpact },
    { key: 'bestUseCase', label: 'Best Use Case', value: format.bestUseCase },
    { key: 'experienceLevel', label: 'Experience Level', value: format.experienceLevel },
  ].map((fact) => ({
    id: `${format.id}-fact-${fact.key}`,
    label: fact.label.toUpperCase(),
    category: 'Cigar Profile',
    description: FACT_DESCRIPTIONS[fact.label] || CHIP_FALLBACK_DESCRIPTION,
    value: fact.value,
  }))

  return { tagChips, factChips }
}

const SESSION_TYPES = [
  {
    id: 'quick-smoke',
    label: 'Quick Smoke',
    range: '0–50 min',
    copy: 'Quick pleasure, lighter body.',
  },
  {
    id: 'standard-smoke',
    label: 'Standard Smoke',
    range: '50–75 min',
    copy: 'Most versatile. Perfect balance.',
  },
  {
    id: 'long-session',
    label: 'Long Session',
    range: '75–105 min',
    copy: 'Slow burn, deeper experience.',
  },
  {
    id: 'vip-slow-burn',
    label: 'VIP Slow Burn',
    range: '105+ min',
    copy: 'The longest format. A full evening, savored slowly.',
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
  // Single shared selection state for every selectable insight on this page
  // (cigar chips, wrapper profiles, session comparisons) instead of one
  // useState per source. Shape: { sourceType, cigarId, cigarName, itemId,
  // itemLabel, itemCategory, itemValue, description }.
  const [selectedInsight, setSelectedInsight] = useState(null)

  function emitInsightSelection(payload) {
    // No dedicated chip/wrapper/session-level recommendation/filter state
    // exists yet in GuestSessionContext (only format-level
    // setSmokeCraftFormat). Avoid inventing a duplicate state system — just
    // surface the selection for now so it's ready to wire into real
    // filtering later.
    if (import.meta.env.DEV) console.debug('[SmokeCraft] insight selected', payload)
  }

  function handleChipSelect(format, chip) {
    const itemId = `${format.id}:${chip.id}`
    setSelectedInsight(prev => (prev?.itemId === itemId ? null : {
      sourceType: 'cigar-chip',
      cigarId: format.id,
      cigarName: format.name,
      itemId,
      itemLabel: chip.label,
      itemCategory: chip.category,
      itemValue: chip.value,
      description: chip.description,
    }))
    emitInsightSelection({
      sourceType: 'cigar-chip',
      cigarId: format.id,
      cigarName: format.name,
      itemId,
      itemLabel: chip.label,
      itemCategory: chip.category,
      itemValue: chip.value,
    })
  }

  function handleWrapperSelect(wrapper) {
    triggerHaptic('light')
    const itemId = `wrapper:${wrapper.id}`
    setSelectedInsight(prev => (prev?.itemId === itemId ? null : {
      sourceType: 'wrapper-profile',
      cigarId: null,
      cigarName: null,
      itemId,
      itemLabel: wrapper.name,
      itemCategory: 'Wrapper',
      itemValue: null,
      description: wrapper.note,
    }))
    emitInsightSelection({ sourceType: 'wrapper-profile', itemId, itemLabel: wrapper.name })
  }

  function handleSessionSelect(sessionType) {
    triggerHaptic('light')
    const itemId = `session:${sessionType.id}`
    setSelectedInsight(prev => (prev?.itemId === itemId ? null : {
      sourceType: 'session-comparison',
      cigarId: null,
      cigarName: null,
      itemId,
      itemLabel: sessionType.label,
      itemCategory: 'Session Length',
      itemValue: sessionType.range,
      description: sessionType.copy,
    }))
    emitInsightSelection({ sourceType: 'session-comparison', itemId, itemLabel: sessionType.label })
  }

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
    navigate('/smokecraft/cigar-gauge-guide')
  }

  const stepProgress = getVisitProgress(session.completedSteps)

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
          padding: 60px 28px 40px;
        }
        .format-progress {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 18px;
          align-items: center;
          color: #e9c176;
          margin-bottom: 8px;
          font-size: 12px;
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
          font-size: 13px;
          font-weight: 900;
          margin-bottom: 6px;
        }
        .format-title {
          margin: 0 0 4px;
          font-family: "Playfair Display", Georgia, serif;
          font-size: clamp(26px, 2.8vw, 38px);
          line-height: 1;
          color: #f7efe2;
        }
        .format-title em {
          color: #e9c176;
          font-style: italic;
        }
        .format-intro {
          max-width: 720px;
          margin: 0 0 8px;
          color: rgba(247,239,226,0.8);
          font-size: 12.5px;
          line-height: 1.35;
        }
        .format-card-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
        }
        .format-card {
          position: relative;
          min-height: 165px;
          padding: 10px;
          border-radius: 12px;
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
        .format-card:focus-visible {
          outline: 2px solid rgba(255,225,151,0.85);
          outline-offset: 3px;
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
          position: relative;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 4px 0 6px;
          border-radius: 8px;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 50% 100%, rgba(233,193,118,0.16), transparent 60%),
            linear-gradient(180deg, rgba(0,0,0,0.4), rgba(40,26,14,0.42));
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.24), inset 0 10px 26px rgba(0,0,0,0.55);
          transition: box-shadow 0.2s ease;
        }
        .format-shape-badge {
          display: inline-block;
          align-self: flex-start;
          margin: 0 0 4px;
          padding: 3px 9px;
          border-radius: 999px;
          background: rgba(10,6,3,0.84);
          border: 1px solid rgba(233,193,118,0.55);
          color: #e9c176;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .format-silhouette {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 6px;
        }
        .format-silhouette__bar {
          flex-shrink: 0;
          display: inline-block;
          background: linear-gradient(90deg, #c8973f, #f0d184);
          border-radius: 999px;
          box-shadow: 0 0 8px rgba(233,193,118,0.3);
        }
        .format-silhouette__bar.is-tapered {
          border-radius: 999px;
          clip-path: polygon(0 12%, 76% 12%, 100% 50%, 76% 88%, 0 88%);
        }
        .format-silhouette__label {
          display: flex;
          flex-direction: column;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: rgba(233,193,118,0.78);
        }
        .format-silhouette__label em {
          font-style: normal;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: rgba(233,193,118,0.42);
        }
        .format-card.is-selected .format-card__visual {
          box-shadow: inset 0 0 0 1.5px rgba(255,225,151,0.7), inset 0 0 32px rgba(233,193,118,0.28), 0 0 30px rgba(233,193,118,0.32);
        }
        .cigar-visual {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 10px;
          overflow: hidden;
          background: #0c0703;
        }
        .cigar-visual__photo {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          filter: saturate(1.12) brightness(0.94) contrast(1.1);
          transition: transform 0.35s ease;
        }
        .cigar-visual--missing {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          text-align: center;
          padding: 10px 14px;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(233,193,118,0.1), transparent 60%),
            linear-gradient(160deg, rgba(40,26,14,0.9), rgba(10,6,3,0.95));
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.22);
        }
        .cigar-visual__missing-icon {
          color: rgba(233,193,118,0.55);
          font-size: 26px;
          margin-bottom: 2px;
        }
        .cigar-visual__missing-title {
          color: rgba(233,193,118,0.85);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .cigar-visual__missing-file {
          color: rgba(247,239,226,0.6);
          font-size: 11px;
          font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        }
        .format-card:hover .cigar-visual__photo,
        .format-insight__cigar:hover .cigar-visual__photo {
          transform: scale(1.04);
        }
        .cigar-visual.is-tapered .cigar-visual__photo {
          clip-path: polygon(6% 50%, 24% 16%, 100% 10%, 100% 90%, 24% 84%);
        }
        .cigar-visual__vignette {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(ellipse at 50% 0%, rgba(233,193,118,0.16), transparent 60%),
            linear-gradient(180deg, rgba(0,0,0,0.08), rgba(0,0,0,0.1) 55%, rgba(5,3,2,0.5));
        }
        .cigar-visual__rim {
          position: absolute;
          inset: 0;
          border-radius: 10px;
          pointer-events: none;
          box-shadow: inset 0 0 0 1.5px rgba(233,193,118,0.4), inset 0 0 24px rgba(233,193,118,0.12);
        }
        .format-card h2 {
          margin: 0 0 2px;
          font-family: "Playfair Display", Georgia, serif;
          color: #f7efe2;
          font-size: 18px;
          line-height: 1.05;
        }
        .format-card__type {
          display: inline-block;
          margin-bottom: 4px;
          color: rgba(233,193,118,0.7);
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .format-card p {
          margin: 0 0 4px;
          color: rgba(247,239,226,0.76);
          font-size: 11px;
          line-height: 1.25;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .format-card__facts {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 2px 6px;
          margin-bottom: 4px;
        }
        .format-card__facts div {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .format-card__fact-label {
          color: rgba(233,193,118,0.62);
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .format-card__fact-value {
          color: #f7efe2;
          font-size: 11px;
          font-weight: 700;
          line-height: 1.2;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .format-card__tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-top: 6px;
        }
        .smokecraft-insight-chip {
          border: 1px solid rgba(233,193,118,0.24);
          border-radius: 999px;
          padding: 4px 8px;
          min-height: 24px;
          color: #e9c176;
          background: rgba(233,193,118,0.08);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          font-family: inherit;
          cursor: pointer;
          transition: transform 0.12s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
        }
        .smokecraft-insight-chip:hover {
          border-color: rgba(255,225,151,0.6);
          background: rgba(233,193,118,0.16);
        }
        .smokecraft-insight-chip:active {
          transform: scale(0.94);
        }
        .smokecraft-insight-chip:focus-visible {
          outline: 2px solid rgba(255,225,151,0.85);
          outline-offset: 2px;
        }
        .smokecraft-insight-chip.is-selected {
          border-color: rgba(255,225,151,0.95);
          background: rgba(233,193,118,0.3);
          color: #fff1d6;
          box-shadow: 0 0 14px rgba(233,193,118,0.55);
        }
        .format-card__fact {
          all: unset;
          display: flex;
          flex-direction: column;
          gap: 1px;
          padding: 3px 4px;
          border-radius: 6px;
          cursor: pointer;
          font-family: inherit;
          text-align: left;
          min-height: 0;
          transition: background 0.18s ease, box-shadow 0.18s ease;
        }
        .format-card__fact:hover {
          background: rgba(233,193,118,0.08);
        }
        .format-card__fact:focus-visible {
          outline: 2px solid rgba(255,225,151,0.85);
          outline-offset: 2px;
        }
        .format-card__fact:active {
          transform: scale(0.97);
        }
        .format-card__fact.is-selected {
          background: rgba(233,193,118,0.16);
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.4);
        }
        .smokecraft-insight-panel {
          margin-top: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid rgba(233,193,118,0.4);
          background: rgba(12,7,3,0.85);
          box-shadow: 0 0 24px rgba(233,193,118,0.18);
          animation: smokecraft-panel-pulse 0.5s ease;
        }
        @keyframes smokecraft-panel-pulse {
          0% { box-shadow: 0 0 0 rgba(233,193,118,0); }
          40% { box-shadow: 0 0 28px rgba(233,193,118,0.4); }
          100% { box-shadow: 0 0 24px rgba(233,193,118,0.18); }
        }
        .smokecraft-insight-panel__header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .smokecraft-insight-panel__eyebrow {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: rgba(233,193,118,0.7);
        }
        .smokecraft-insight-panel__close {
          background: none;
          border: none;
          color: rgba(233,193,118,0.7);
          cursor: pointer;
          padding: 2px;
          line-height: 1;
        }
        .smokecraft-insight-panel__close:hover {
          color: #fff1d6;
        }
        .smokecraft-insight-panel__title {
          margin: 6px 0 2px;
          font-size: 15px;
          color: #f7efe2;
        }
        .smokecraft-insight-panel__value {
          font-size: 13px;
          font-weight: 700;
          color: #e9c176;
          margin-bottom: 4px;
        }
        .smokecraft-insight-panel__description {
          margin: 0;
          font-size: 12.5px;
          line-height: 1.5;
          color: rgba(247,239,226,0.85);
        }
        .format-side {
          display: grid;
          gap: 8px;
        }
        .format-panel {
          border: 1px solid rgba(233,193,118,0.26);
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(17,12,7,0.92), rgba(7,5,3,0.88));
          box-shadow: 0 18px 42px rgba(0,0,0,0.34);
          overflow: hidden;
        }
        .format-panel__inner {
          padding: 12px;
        }
        .format-panel__label {
          color: #e9c176;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          font-size: 11px;
          font-weight: 900;
          margin-bottom: 8px;
        }
        .format-insight {
          display: grid;
          grid-template-columns: 38% 1fr;
          gap: 12px;
          align-items: center;
          min-height: 150px;
        }
        .format-insight__cigar {
          position: relative;
          min-height: 130px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          overflow: hidden;
          background:
            radial-gradient(circle at center, rgba(233,193,118,0.14), transparent 62%),
            linear-gradient(135deg, rgba(233,193,118,0.06), rgba(0,0,0,0.18));
          box-shadow: inset 0 0 0 1.5px rgba(233,193,118,0.32);
        }
        .format-insight__cigar .cigar-visual {
          border-radius: 10px;
        }
        .format-insight__cigar .cigar-visual__photo {
          filter: saturate(1.1) brightness(0.96) contrast(1.08) drop-shadow(0 18px 30px rgba(0,0,0,0.55));
        }
        .format-insight__cigar .cigar-visual--missing {
          width: 100%;
          height: 100%;
        }
        .format-insight h2 {
          margin: 0 0 8px;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 19px;
          color: #f7efe2;
        }
        .format-insight dl {
          margin: 0;
          display: grid;
          gap: 6px;
        }
        .format-insight dt {
          color: #e9c176;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-size: 9px;
          font-weight: 900;
        }
        .format-insight dd {
          margin: 1px 0 0;
          color: rgba(247,239,226,0.86);
          font-size: 12px;
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
          gap: 6px;
        }
        .session-row {
          min-height: 52px;
          display: grid;
          grid-template-columns: 34px 1fr;
          gap: 10px;
          align-items: center;
          padding: 8px 10px;
          border: 1px solid rgba(233,193,118,0.18);
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(255,255,255,0.04), rgba(0,0,0,0.18));
          box-shadow: inset 0 1px 0 rgba(255,236,178,0.05);
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: transform 0.15s ease, border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .session-row:hover {
          border-color: rgba(255,225,151,0.55);
        }
        .session-row:active {
          transform: scale(0.99);
        }
        .session-row:focus-visible {
          outline: 2px solid rgba(255,225,151,0.85);
          outline-offset: 2px;
        }
        .session-row.is-active {
          border-color: rgba(255,225,151,0.8);
          background: linear-gradient(135deg, rgba(233,193,118,0.16), rgba(233,193,118,0.05));
          box-shadow: 0 0 26px rgba(233,193,118,0.2), inset 0 0 0 1px rgba(255,225,151,0.2);
        }
        .session-row.is-picked {
          border-color: rgba(255,225,151,0.95);
          box-shadow: 0 0 30px rgba(233,193,118,0.4), inset 0 0 0 1.5px rgba(255,225,151,0.5);
        }
        .session-row__icon {
          width: 32px;
          height: 32px;
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
          font-size: 12px;
          letter-spacing: 0.1em;
          margin-bottom: 1px;
        }
        .session-row span {
          margin: 0;
          color: rgba(247,239,226,0.55);
          font-size: 10px;
          letter-spacing: 0.04em;
        }
        .session-row p {
          margin: 2px 0 0;
          color: rgba(247,239,226,0.74);
          font-size: 11px;
          line-height: 1.3;
        }
        .format-tip {
          display: grid;
          grid-template-columns: 1fr 100px;
          gap: 10px;
          align-items: center;
        }
        .format-tip p {
          margin: 0;
          color: rgba(247,239,226,0.82);
          font-size: 12.5px;
          line-height: 1.4;
        }
        .format-tip__image {
          height: 58px;
          border-radius: 10px;
          background:
            radial-gradient(circle at 72% 28%, rgba(233,193,118,0.32), transparent 32%),
            linear-gradient(135deg, rgba(65,33,13,0.92), rgba(6,4,3,0.72)),
            url(/assets/smokecraft/cropped/format-master-tip-v2.jpg);
          background-size: cover;
          background-position: center;
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.2);
        }
        .format-cta {
          margin-top: 10px;
          min-height: 92px;
          display: grid;
          grid-template-columns: 170px 1fr auto;
          gap: 16px;
          align-items: center;
          padding: 12px;
        }
        .format-cta__image {
          height: 68px;
          border-radius: 12px;
          background:
            linear-gradient(90deg, rgba(5,3,2,0.1), rgba(5,3,2,0.28)),
            url(/assets/smokecraft/cropped/cut-toast-light-bg.jpg);
          background-size: cover;
          background-position: center;
          box-shadow: inset 0 0 0 1px rgba(233,193,118,0.24);
        }
        .format-cta h2 {
          margin: 0 0 4px;
          color: #e9c176;
          font-family: "Playfair Display", Georgia, serif;
          font-size: 21px;
        }
        .format-cta p {
          margin: 0;
          color: rgba(247,239,226,0.78);
          font-size: 13px;
          line-height: 1.4;
        }
        .format-actions {
          display: flex;
          gap: 8px;
          align-items: stretch;
        }
        .format-actions button {
          min-height: 44px;
          border-radius: 10px;
          padding: 0 18px;
          cursor: pointer;
          font-size: 12px;
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
        .format-shell section[aria-label="Cigar Intelligence"] {
          margin-bottom: 8px !important;
          padding: 8px !important;
        }
        .format-shell section[aria-label="Cigar Intelligence"] .wrapper-profile-card,
        .format-shell section[aria-label="Cigar Intelligence"] [aria-label="Ring Gauge and Vitola Strategy"] > div,
        .format-shell section[aria-label="Cigar Intelligence"] [aria-label="Burn-Time Strategy"] > div {
          min-height: 0 !important;
          padding: 4px 8px !important;
        }
        .format-shell section[aria-label="Cigar Intelligence"] .grid,
        .format-shell section[aria-label="Cigar Intelligence"] .flex.flex-col {
          gap: 4px !important;
        }
        .format-shell section[aria-label="Cigar Intelligence"] .mt-5,
        .format-shell section[aria-label="Cigar Intelligence"] .mb-5 {
          margin-top: 6px !important;
          margin-bottom: 6px !important;
        }
        .format-shell section[aria-label="Cigar Intelligence"] p.font-body-sm,
        .format-shell section[aria-label="Cigar Intelligence"] .wrapper-profile-card p {
          font-size: 10.5px !important;
          line-height: 1.2 !important;
        }
        .format-shell section[aria-label="Cigar Intelligence"] p.font-label-md {
          font-size: 11.5px !important;
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
        step={`Round ${stepProgress.round} of 3 · Visit ${stepProgress.visit} of ${stepProgress.totalVisits} · Session ${stepProgress.session} of ${stepProgress.totalSessions}`}
        backTo="/smokecraft/enroll"
        onRightClick={() => navigate('/grand-lounge-ranking')}
      />

      <main className="format-shell">
        <div className="format-progress" aria-label="SmokeCraft journey progress">
          <span>Round {stepProgress.round} of 3 &middot; Visit {stepProgress.visit} of {stepProgress.totalVisits} &middot; Session {stepProgress.session} of {stepProgress.totalSessions}</span>
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

            <CigarIntelligencePanel
              activeRingGauge={insightFormat.ringGauge}
              selectedWrapperId={selectedInsight?.sourceType === 'wrapper-profile' ? selectedInsight.itemId.replace('wrapper:', '') : null}
              onSelectWrapper={handleWrapperSelect}
            />

            {selectedInsight?.sourceType === 'wrapper-profile' && (
              <SmokeCraftInsightPanel
                cigarName="Wrapper Profile"
                chip={{
                  id: selectedInsight.itemId,
                  label: selectedInsight.itemLabel,
                  category: selectedInsight.itemCategory,
                  value: selectedInsight.itemValue,
                  description: selectedInsight.description,
                }}
                fallbackText={WRAPPER_FALLBACK_DESCRIPTION}
                onClose={() => setSelectedInsight(null)}
              />
            )}

            <div className="format-card-grid" aria-label="Cigar format choices">
              {FORMATS.map((format, index) => {
                const isSelected = selected?.id === format.id
                const { tagChips, factChips } = buildChipsForFormat(format)
                const cardActiveChip = selectedInsight?.sourceType === 'cigar-chip' && selectedInsight.cigarId === format.id
                  ? { id: selectedInsight.itemId, label: selectedInsight.itemLabel, category: selectedInsight.itemCategory, value: selectedInsight.itemValue, description: selectedInsight.description }
                  : null

                function handleCardKeyDown(e) {
                  if (e.target !== e.currentTarget) return
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    selectFormat(format.id)
                  }
                }

                return (
                  <div
                    key={format.id}
                    role="button"
                    tabIndex={0}
                    className={`format-card${isSelected ? ' is-selected' : ''}`}
                    onClick={() => selectFormat(format.id)}
                    onKeyDown={handleCardKeyDown}
                    aria-pressed={isSelected}
                  >
                    <span className="format-card__number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="format-card__check material-symbols-outlined" aria-hidden="true">check</span>
                    <span className="format-card__visual" aria-hidden="true">
                      <CigarVisual format={format} />
                    </span>
                    {format.shapeProfile?.badge && (
                      <span className="format-shape-badge">{format.shapeProfile.badge}</span>
                    )}
                    <h2>{format.name}</h2>
                    <span className="format-card__type">{format.shape}</span>
                    <p>{format.description}</p>
                    <div className="format-card__facts">
                      {factChips.slice(0, 4).map((chip) => {
                        const isChipSelected = cardActiveChip?.id === `${format.id}:${chip.id}`
                        return (
                          <button
                            type="button"
                            key={chip.id}
                            className={`format-card__fact${isChipSelected ? ' is-selected' : ''}`}
                            aria-pressed={isChipSelected}
                            aria-label={`${chip.label}, ${chip.value}`}
                            onClick={(e) => { e.stopPropagation(); handleChipSelect(format, chip) }}
                          >
                            <span className="format-card__fact-label">{chip.label}</span>
                            <span className="format-card__fact-value">
                              {chip.id.endsWith('-strengthBody') && <Dots count={format.bodyScore} />} {chip.value}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                    <span className="format-card__tags">
                      {tagChips.map((chip) => (
                        <SmokeCraftInsightChip
                          key={chip.id}
                          chip={chip}
                          isSelected={cardActiveChip?.id === `${format.id}:${chip.id}`}
                          onSelect={(c) => handleChipSelect(format, c)}
                        />
                      ))}
                    </span>
                    {cardActiveChip && (
                      <SmokeCraftInsightPanel
                        cigarName={format.name}
                        chip={cardActiveChip}
                        onClose={() => setSelectedInsight(null)}
                      />
                    )}
                  </div>
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
                    <CigarVisual format={insightFormat} />
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
                  {SESSION_TYPES.map(type => {
                    const isPicked = selectedInsight?.sourceType === 'session-comparison' && selectedInsight.itemId === `session:${type.id}`
                    const isActive = selected?.category === type.id

                    function handleSessionKeyDown(e) {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSessionSelect(type)
                      }
                    }

                    return (
                      <article
                        key={type.id}
                        role="button"
                        tabIndex={0}
                        className={`session-row${isActive ? ' is-active' : ''}${isPicked ? ' is-picked' : ''}`}
                        onClick={() => handleSessionSelect(type)}
                        onKeyDown={handleSessionKeyDown}
                        aria-pressed={isPicked}
                        aria-label={`${type.label}, ${type.range}`}
                      >
                        <span className="session-row__icon material-symbols-outlined" aria-hidden="true">timer</span>
                        <div>
                          <strong>{type.label}</strong>
                          <span>{type.range}</span>
                          <p>{type.copy}</p>
                        </div>
                      </article>
                    )
                  })}
                </div>
                {selectedInsight?.sourceType === 'session-comparison' && (
                  <SmokeCraftInsightPanel
                    cigarName="Session Comparison"
                    chip={{
                      id: selectedInsight.itemId,
                      label: selectedInsight.itemLabel,
                      category: selectedInsight.itemCategory,
                      value: selectedInsight.itemValue,
                      description: selectedInsight.description,
                    }}
                    onClose={() => setSelectedInsight(null)}
                  />
                )}
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
              Continue to Cigar Gauge Guide
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </section>
        <div data-marker="SHAPE BURN CLEAN BG V2" style={{ display: 'none' }} aria-hidden="true" />
      </main>

      <SmokeCraftBottomNav active="smokecraft" />
    </div>
  )
}
