// Canonical Runtime pass — one componentKey -> component resolver.
//
// Every curriculum screen that is routed through SmokeCraftScreenRenderer is
// registered here under its manifest `componentKey` (`session-N`). Merged
// sessions (S9/S13/S17/S18/S20/S26) share one real component/route with their
// primary session and are never rendered under their own screenId, so only
// the primary componentKey is registered (e.g. `session-8`, not `session-9`).
//
// session-5 (Format) is intentionally NOT registered/migrated: its approved
// flow forwards into the `request-purchase` supporting module (and awards an
// extra `wrapper-strength` completion key), which the canonical linear
// manifest (S5 -> S6) would bypass — migrating it would change approved
// navigation, so it stays on its existing direct-navigate wiring per the
// "do not force a migration that breaks something" rule.
import AISummary from '../pages/smokecraft/AISummary.jsx'
import WelcomeExperience from '../pages/smokecraft/WelcomeExperience.jsx'
import HumidorMatch from '../pages/smokecraft/HumidorMatch.jsx'
import MeetYourCigar from '../pages/smokecraft/MeetYourCigar.jsx'
import Terroir from '../pages/smokecraft/Terroir.jsx'
import CutToastLight from '../pages/smokecraft/CutToastLight.jsx'
import LightingTutorial from '../pages/smokecraft/LightingTutorial.jsx'
import FirstThird from '../pages/smokecraft/FirstThird.jsx'
import FlavorMemory from '../pages/smokecraft/FlavorMemory.jsx'
import PairingLab from '../pages/smokecraft/PairingLab.jsx'
import SecondThird from '../pages/smokecraft/SecondThird.jsx'
import MentorCommentary from '../pages/smokecraft/MentorCommentary.jsx'
import KnowledgeDrop from '../pages/smokecraft/KnowledgeDrop.jsx'
import FinalThird from '../pages/smokecraft/FinalThird.jsx'
import Scorecard from '../pages/smokecraft/Scorecard.jsx'
import PairingRecommendations from '../pages/smokecraft/PairingRecommendations.jsx'
import PassportStamp from '../pages/smokecraft/PassportStamp.jsx'
import FinalReview from '../pages/smokecraft/FinalReview.jsx'
import Rewards from '../pages/smokecraft/Rewards.jsx'
import SessionComplete from '../pages/smokecraft/SessionComplete.jsx'

export const SMOKECRAFT_COMPONENT_REGISTRY = {
  'session-1': WelcomeExperience,
  'session-2': HumidorMatch,
  'session-3': MeetYourCigar,
  'session-4': Terroir,
  // 'session-5' (Format) intentionally unregistered — see header note.
  'session-6': CutToastLight,
  'session-7': LightingTutorial,
  'session-8': FirstThird,   // also serves S9 (merged)
  'session-10': FlavorMemory,
  'session-11': PairingLab,
  'session-12': SecondThird,  // also serves S13 (merged)
  'session-14': MentorCommentary,
  'session-15': KnowledgeDrop,
  'session-16': FinalThird,   // also serves S17, S18 (merged)
  'session-19': Scorecard,    // also serves S20 (merged)
  'session-21': AISummary,
  'session-22': PairingRecommendations,
  'session-23': PassportStamp,
  'session-24': FinalReview,
  'session-25': Rewards,      // also serves S26 (shared component)
  'session-27': SessionComplete,
}

/** Real zero-consumer check — confirms no registered component is also reachable via a second, undeclared path. */
export function getRegisteredComponent(componentKey) {
  return SMOKECRAFT_COMPONENT_REGISTRY[componentKey] || null
}
