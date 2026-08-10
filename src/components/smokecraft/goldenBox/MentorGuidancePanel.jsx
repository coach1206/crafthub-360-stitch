import { useSmokeCraftJourney } from '../../../context/SmokeCraftJourneyContext.jsx'
import MediaSlot from './MediaSlot.jsx'

const GOLD = '#E9C176'
const BORDER = 'rgba(233,193,118,0.28)'

/**
 * Package 2 — mentor directive: dynamically uses the guest's actually
 * selected mentor. Never a hardcoded name/portrait/bio. Shows a neutral
 * unassigned state if no mentor was selected.
 *
 * Compatibility mapping (documented, temporary): `journey.mentor` is set
 * by Mentor.jsx (src/pages/smokecraft/Mentor.jsx:94) as an ARRAY of full
 * mentor records from the approved roster (src/modules/smokecraft/
 * smokeCraftMentors.js), not a single { id, name, imageAssetKey } object
 * as this component originally assumed — a real bug found and fixed this
 * pass. Each roster record already carries a real approved portrait path
 * (`image`, e.g. '/mentors/don-alejandro.jpg') — no SC_ASSETS key exists
 * for mentor portraits, so MediaSlot's `directSrc` prop is used instead
 * of `assetKey`. The primary/first selected mentor (mentors[0]) is shown
 * as Golden Box's guidance voice, since Golden Box needs one mentor
 * persona, not the full multi-mentor list SmokeCraft's other screens use.
 */
export default function MentorGuidancePanel({ guidance }) {
  const { journey } = useSmokeCraftJourney()
  const mentorList = journey?.mentor
  const mentor = Array.isArray(mentorList) ? mentorList[0] : mentorList

  if (!mentor) {
    return (
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, display: 'flex', gap: 12, alignItems: 'center', color: 'rgba(229,226,225,0.6)' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `1px dashed ${BORDER}`, flexShrink: 0 }} aria-hidden="true" />
        <div style={{ fontSize: 13 }}>No mentor selected yet. Visit Mentor Selection to choose a guide for personalized Golden Box guidance.</div>
      </div>
    )
  }

  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 10, padding: 14, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <MediaSlot directSrc={mentor.image} alt={mentor.name} style={{ width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
      <div>
        <div style={{ fontWeight: 700, color: GOLD, fontSize: 14 }}>{mentor.name}</div>
        <div style={{ fontSize: 11, color: 'rgba(229,226,225,0.55)', marginBottom: 6 }}>{mentor.country || mentor.origin || 'Master Mentor'}</div>
        <div style={{ fontSize: 13, color: '#e5e2e1', lineHeight: 1.5 }}>
          {guidance || `${mentor.name.split(' ')[0]} hasn't left specific guidance for this step yet — keep building your blend with what you've learned so far.`}
        </div>
      </div>
    </div>
  )
}
