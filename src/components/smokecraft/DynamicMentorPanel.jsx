import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import MediaSlot from './goldenBox/MediaSlot.jsx'

const GOLD = '#E9C176'
const CREAM = '#e5e2e1'
const BORDER = 'rgba(233,193,118,0.22)'
const GLASS = 'rgba(8,10,16,0.86)'

// Shared dynamic mentor panel for the new Skill Tree / Collections / Challenge
// Hub screens — reads the real selected mentor from SmokeCraftJourneyContext
// (the same source EntryWorkspace/MentorGuidancePanel already trust), never
// a fixed/baked mentor. Shows an honest "no mentor selected" state instead
// of defaulting to any specific mentor.
export default function DynamicMentorPanel({ guidance }) {
  const { journey } = useSmokeCraftJourney()
  const mentor = Array.isArray(journey?.mentor) ? journey.mentor[0] : null

  return (
    <div style={{ background: GLASS, border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14 }}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(233,193,118,0.55)', marginBottom: 8 }}>Selected Mentor</div>
      {!mentor ? (
        <p style={{ margin: 0, fontSize: 12, color: 'rgba(229,226,225,0.55)' }}>
          No mentor selected yet — choose one from Mentor Selection to receive guidance here.
        </p>
      ) : (
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <MediaSlot directSrc={mentor.image} alt={mentor.name} style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: GOLD, fontSize: 14 }}>{mentor.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.6)', marginBottom: 4 }}>
              {mentor.flag ? `${mentor.flag} ` : ''}{mentor.country || 'Master Mentor'}
            </div>
            {mentor.bio && <p style={{ margin: '0 0 6px', fontSize: 11.5, color: CREAM, lineHeight: 1.5 }}>{mentor.bio}</p>}
            <p style={{ margin: 0, fontSize: 11.5, color: 'rgba(229,226,225,0.7)', fontStyle: 'italic' }}>
              {guidance || `${mentor.name.split(' ')[0]} hasn't left specific guidance for this screen yet.`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
