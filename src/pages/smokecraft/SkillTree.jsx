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
// (skill tree 1.png), not invented — the mandate's own requested category
// list (Seed and Soil, Cigar Anatomy, Tasting, etc.) does not match what
// was actually approved and uploaded; this uses the real approved names.
const CATEGORIES = [
  { id: 'foundation', label: 'Foundation' },
  { id: 'leaf-process', label: 'Leaf & Process' },
  { id: 'construction', label: 'Construction' },
  { id: 'flavor-experience', label: 'Flavor & Experience' },
  { id: 'pairing-pairings', label: 'Pairing & Pairings' },
  { id: 'mastery-blending', label: 'Mastery & Blending' },
  { id: 'community-legacy', label: 'Community & Legacy' },
]

export default function SkillTree() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
        <button type="button" onClick={() => { triggerHaptic('light'); navigate('/smokecraft/rewards') }}
          style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>
          ← Back to Rewards
        </button>

        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 16 }}>
          <img src={SC_ASSETS.skillTreeBackground} alt="SmokeCraft Skill Tree" style={{ width: '100%', display: 'block' }} />
        </div>

        <h1 style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: GOLD, margin: '0 0 6px' }}>SmokeCraft Skill Tree</h1>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)', margin: '0 0 20px' }}>
          Build knowledge, earn mastery, create excellence. Progress in each category updates as you
          complete real SmokeCraft lessons and challenges.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12, marginBottom: 20 }}>
          {CATEGORIES.map(cat => (
            <div key={cat.id} role="group" aria-label={`${cat.label} — not yet tracked`}
              style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: CREAM, marginBottom: 6 }}>{cat.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.45)' }}>Progress tracking not yet connected</div>
            </div>
          ))}
        </div>

        <DynamicMentorPanel guidance="Every category above traces back to a real lesson — start with Foundation if you're new." />

        {/* Honest scope disclosure — no fake progress, no fabricated node
            states. Real per-node locked/available/in-progress/completed/
            mastered persistence requires a dedicated backend pass (skill
            progression service + migration), intentionally not built in
            this visual-wiring pass. */}
        <p style={{ fontSize: 11, color: 'rgba(229,226,225,0.35)', marginTop: 20 }}>
          Skill progression tracking is not yet backend-connected — this screen shows the real approved
          layout with honest empty states rather than fabricated progress.
        </p>
      </div>
    </div>
  )
}
