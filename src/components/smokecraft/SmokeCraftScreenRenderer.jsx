// Canonical Runtime pass — the one renderer that resolves a screenId to its
// manifest entry, its registered component, its data, and its
// previous/continue actions, then renders it. App.jsx routes a migrated
// screen through this wrapper instead of the bare component directly.
//
// Scope note (updated 2026-07): all 27 curriculum screens (and session-1
// Welcome) now route through this renderer via the manifest/registry — the
// full migration is complete (commit 69e419fa). This wrapper is the single
// canonical render path; no curriculum screen component is rendered directly
// from App.jsx anymore.
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

  // Approved-visual-lock markers below: data-visual-source is `user-approved`
  // when this screen has an approved GitHub-sourced asset registered in
  // SC_ASSETS; otherwise the honest `live-component-no-approved-asset` for
  // any screen manifest entry with no assetKey. (This branch was written
  // before session-1 Welcome had a real approved asset wired — it now
  // resolves `user-approved` for Welcome via SC_ASSETS.session1, fixed in
  // an earlier pass; SC-D008 in the defect register documents the stale
  // test assertion this comment used to justify, since corrected.) Every
  // canonical screen is an interactive live component, never a static
  // image-only screen, so data-static-only="false".
  return (
    <div
      data-smokecraft-screen-id={entry.screenId}
      data-smokecraft-component={entry.componentKey}
      data-smokecraft-asset-key={entry.assetKey || ''}
      data-smokecraft-phase={entry.phase ?? ''}
      data-smokecraft-session={entry.sessionNumber ?? ''}
      data-smokecraft-runtime-version={RUNTIME_VERSION}
      data-visual-source={entry.assetKey ? 'user-approved' : 'live-component-no-approved-asset'}
      data-static-only="false"
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
