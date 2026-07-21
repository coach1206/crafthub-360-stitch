import { useNavigate } from 'react-router-dom'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import DynamicMentorPanel from '../../components/smokecraft/DynamicMentorPanel.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

// Real category taxonomy taken directly from the approved artwork
// (collection center.png) — Leaf/Cigar/Tool/Lounge/Knowledge/Badge/Reward,
// not the mandate's requested list (Flavor/Seed/Wrapper/Binder/Filler/
// Origin/Vitola/Ring Gauge/Mentor/Passport), which does not match what was
// actually approved and uploaded.
const CATEGORIES = [
  { id: 'leaf', label: 'Leaf Collection' },
  { id: 'cigar', label: 'Cigar Collection' },
  { id: 'tool', label: 'Tool Collection' },
  { id: 'lounge', label: 'Lounge Collection' },
  { id: 'knowledge', label: 'Knowledge Collection' },
  { id: 'badge', label: 'Badge Collection' },
  { id: 'reward', label: 'Reward / Achievement Collection' },
]

export default function CollectionsCenter() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
        <button type="button" onClick={() => { triggerHaptic('light'); navigate('/smokecraft/rewards') }}
          style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>
          ← Back to Rewards
        </button>

        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 16 }}>
          <img src={SC_ASSETS.collectionsCenterBackground} alt="Collections Center" style={{ width: '100%', display: 'block' }} />
        </div>

        <h1 style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: GOLD, margin: '0 0 6px' }}>Collections Center</h1>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)', margin: '0 0 20px' }}>
          Explore, earn, collect, and showcase your journey.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.id} role="group" aria-label={`${cat.label} — no items owned yet`}
              style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: CREAM, marginBottom: 6 }}>{cat.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.45)' }}>0 owned — not yet backend-connected</div>
            </div>
          ))}
        </div>

        <DynamicMentorPanel guidance="Complete lessons and challenges to start unlocking collectible items in each category." />

        <p style={{ fontSize: 11, color: 'rgba(229,226,225,0.35)', marginTop: 20 }}>
          Collection ownership/rarity/earned-date data is not yet backend-connected — this screen shows
          the real approved layout with honest zero-state counts rather than fabricated ownership.
        </p>
      </div>
    </div>
  )
}
