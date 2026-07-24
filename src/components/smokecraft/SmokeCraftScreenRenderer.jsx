// Canonical Runtime pass — the one renderer that resolves a screenId to its
// manifest entry, its registered component, its data, and its
// previous/continue actions, then renders it. App.jsx routes a migrated
// screen through this wrapper instead of the bare component directly.
//
// Scope note (disclosed): only 'session-21' is actually routed through
// this component this pass — see 00-FINAL-REPORT.md for why a full
// 27-screen migration was not attempted in one pass.
import { useNavigate } from 'react-router-dom'
import { useGuestSession } from '../../context/GuestSessionContext.jsx'
import { useSmokeCraftJourney } from '../../context/SmokeCraftJourneyContext.jsx'
import { getManifestEntry } from '../../constants/smokecraftScreenManifest.js'
import { getRegisteredComponent } from '../../constants/smokecraftComponentRegistry.js'
import { getSmokeCraftScreenData } from '../../services/smokecraft/smokecraftScreenDataSelector.js'
import { completeSmokeCraftScreen } from '../../services/smokecraft/smokecraftCompletionService.js'
import { getInteractionManifest } from '../../constants/smokecraftInteractionManifest.js'

const RUNTIME_VERSION = '1.0.0-partial'

export default function SmokeCraftScreenRenderer({ screenId }) {
  const navigate = useNavigate()
  const { session, awardSessionRewards } = useGuestSession()
  const { journey } = useSmokeCraftJourney()

  const entry = getManifestEntry(screenId)
  const Component = entry ? getRegisteredComponent(entry.componentKey) : null

  if (!entry || !Component) {
    // Refuse to guess — no silent fallback rendering. A missing manifest
    // entry or unregistered component is a build-time-catchable
    // programming error, not something to paper over at runtime.
    throw new Error(`SmokeCraftScreenRenderer: no canonical screen/component registered for "${screenId}".`)
  }

  const data = getSmokeCraftScreenData(screenId, { session, journey })
  const interactionManifest = getInteractionManifest(screenId)

  function handleBack() {
    const prevEntry = entry.previousScreenId ? getManifestEntry(entry.previousScreenId) : null
    navigate(prevEntry?.route || '/smokecraft')
  }

  function handleComplete() {
    const { nextRoute } = completeSmokeCraftScreen(screenId, { awardSessionRewards, session })
    if (nextRoute) navigate(nextRoute)
  }

  return (
    <div
      data-smokecraft-screen-id={entry.screenId}
      data-smokecraft-component={entry.componentKey}
      data-smokecraft-asset-key={entry.assetKey || ''}
      data-smokecraft-phase={entry.phase ?? ''}
      data-smokecraft-session={entry.sessionNumber ?? ''}
      data-smokecraft-runtime-version={RUNTIME_VERSION}
    >
      <Component
        screenData={data}
        interactionManifest={interactionManifest}
        onBack={handleBack}
        onComplete={handleComplete}
      />
    </div>
  )
}
