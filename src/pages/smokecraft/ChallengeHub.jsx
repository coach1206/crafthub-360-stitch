import { useNavigate } from 'react-router-dom'
import { SC_ASSETS } from '../../constants/smokecraftAssets.js'
import DynamicMentorPanel from '../../components/smokecraft/DynamicMentorPanel.jsx'
import { triggerHaptic } from '../../utils/haptics.js'

const GOLD = '#E9C176'
const NAVY = '#0b0f18'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

// The only real, buildable challenge this pass — Blend Fault Identification
// — resolved by visual inspection of the 3 "missing challenge screen"
// images (see smokecraftAssets.js). Listed here as the sole live entry;
// no other daily/weekly challenge content exists yet.
const AVAILABLE_CHALLENGES = [
  { id: 'blend-fault-identification', label: 'Blend Fault Identification', category: 'Daily', route: '/smokecraft/challenges/blend-fault-identification' },
]

export default function ChallengeHub() {
  const navigate = useNavigate()

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'auto', background: NAVY, fontFamily: 'Georgia, serif', color: CREAM }}>
      <div style={{ padding: 'clamp(16px,3vw,32px)', maxWidth: 1100, margin: '0 auto' }}>
        <button type="button" onClick={() => { triggerHaptic('light'); navigate('/smokecraft/rewards') }}
          style={{ background: 'transparent', border: 'none', color: GOLD, cursor: 'pointer', marginBottom: 12, fontFamily: 'inherit' }}>
          ← Back to Rewards
        </button>

        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER}`, marginBottom: 16 }}>
          <img src={SC_ASSETS.challengeHubBackground} alt="Daily and Weekly Challenge Hub" style={{ width: '100%', display: 'block' }} />
        </div>

        <h1 style={{ fontSize: 'clamp(18px,2.4vw,24px)', color: GOLD, margin: '0 0 6px' }}>Daily &amp; Weekly Challenge Hub</h1>
        <p style={{ fontSize: 13, color: 'rgba(229,226,225,0.6)', margin: '0 0 20px' }}>
          Sharpen your eye. Complete challenges to earn XP and badge progress.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12, marginBottom: 20 }}>
          {AVAILABLE_CHALLENGES.map(c => (
            <button key={c.id} type="button"
              onClick={() => { triggerHaptic('light'); navigate(c.route) }}
              aria-label={`Start ${c.label} (${c.category} challenge)`}
              style={{ textAlign: 'left', background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, cursor: 'pointer', color: CREAM, fontFamily: 'inherit', minHeight: 72 }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', color: GOLD, marginBottom: 4 }}>{c.category}</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{c.label}</div>
              <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.5)', marginTop: 4 }}>Available — tap to begin</div>
            </button>
          ))}
          <div role="group" aria-label="More challenges coming soon"
            style={{ background: GLASS, border: `1px dashed ${BORDER}`, borderRadius: 10, padding: 14, opacity: 0.6 }}>
            <div style={{ fontSize: 13, color: 'rgba(229,226,225,0.5)' }}>More daily and weekly challenges coming soon.</div>
          </div>
        </div>

        <DynamicMentorPanel guidance="Each challenge sharpens a real skill you'll use again in the Golden Box." />

        <p style={{ fontSize: 11, color: 'rgba(229,226,225,0.35)', marginTop: 20 }}>
          Streak tracking, XP rewards, badge unlocks, and time-remaining countdowns are not yet
          backend-connected for this hub — this screen shows the real approved layout with one genuinely
          working challenge rather than fabricated progress across many.
        </p>
      </div>
    </div>
  )
}
