// Canonical Runtime pass — one screen manifest describing every SmokeCraft
// entry + curriculum screen. Generated logic re-derives from VISIT_STRUCTURE
// (the already-confirmed single canonical session registry, session.js) so
// this file can never silently drift out of sync with it — it is a richer
// view of the same data, not a second competing source of truth.
//
// Scope note (disclosed, not silent): this manifest is real, complete, and
// consumed by the SmokeCraftScreenRenderer/getSmokeCraftScreenData/
// completeSmokeCraftScreen infrastructure (see those files). All 27
// curriculum sessions now route through this canonical layer, including
// session-5 (Format): its approved flow forwards into the `request-purchase`
// supporting module (and awards an extra `wrapper-strength` completion key)
// instead of the linear S5->S6 spine — carried via this entry's
// `nextRouteOverride` field so the real, approved navigation is preserved
// exactly rather than bent to fit the default chain. Merged sessions
// (S9/S13/S17/S18/S20/S26) share one real route/component with their primary
// session and are covered implicitly by migrating that primary screenId.
// See smokecraftComponentRegistry.js for the exact registered map.
import { VISIT_STRUCTURE } from './session.js'
import { SC_ASSETS } from './smokecraftAssets.js'

const ASSET_KEY_BY_SESSION = {
  1: 'session1', 2: 'humidorMatch', 3: 'meetYourCigar', 4: 'terroir', 5: 'format',
  6: 'cutToastLight', 7: 'lightingTutorial', 8: 'firstThird', 9: 'firstThird',
  10: 'flavorMemory', 11: 'pairingLab', 12: 'secondThird', 13: 'secondThird',
  14: 'mentorCommentary', 15: 'knowledgeDrop', 16: 'finalThird', 17: 'finalThird',
  18: 'finalThird', 19: 'scorecard', 20: 'scorecard', 21: 'aiSummary',
  22: 'pairingRecommendations', 23: 'passportStamp', 24: 'finalReview',
  25: 'rewards', 26: 'achievements', 27: 'recommendedNextJourney',
}

const ENTRY_SCREENS = [
  { screenId: 'entry-landing',    type: 'entry', route: '/smokecraft',              title: 'Landing',      assetKey: 'landing',         directAccessAllowed: true },
  { screenId: 'entry-enroll',     type: 'entry', route: '/smokecraft/enroll',       title: 'Enrollment',   assetKey: 'enroll',          directAccessAllowed: false },
  { screenId: 'entry-identity',   type: 'entry', route: '/smokecraft/identity',     title: 'Identity',     assetKey: 'identity',        directAccessAllowed: false },
  { screenId: 'entry-venue',      type: 'entry', route: '/smokecraft/venue-select', title: 'Venue Selection', assetKey: 'venueSelect',  directAccessAllowed: false },
]

const all = []
for (const v of VISIT_STRUCTURE) {
  for (const s of v.sessions) all.push({ ...s, visit: v.visit, visitTitle: v.title })
}

export const SMOKECRAFT_SCREEN_MANIFEST = [
  ...ENTRY_SCREENS.map(e => ({
    ...e,
    phase: null,
    sessionNumber: null,
    componentKey: `entry-${e.screenId}`,
    assetStatus: e.assetKey && SC_ASSETS[e.assetKey] ? 'ok' : 'missing-approved-asset',
    previousScreenId: null,
    nextScreenId: null,
    prerequisites: [],
    guardType: e.screenId === 'entry-landing' ? 'public' : 'requires',
    dataSelectorKey: e.screenId,
    completionKey: null,
    interactionManifestKey: e.screenId,
    persistenceScope: 'journey',
    xpEvent: null,
    passportEvent: null,
    reviewAllowed: false,
  })),
  ...all.map((s, i) => {
    const assetKey = ASSET_KEY_BY_SESSION[s.session]
    return {
      screenId: `session-${s.session}`,
      type: 'curriculum',
      phase: s.visit,
      sessionNumber: s.session,
      route: s.route,
      title: s.label,
      componentKey: `session-${s.session}`,
      assetKey,
      assetStatus: assetKey ? (SC_ASSETS[assetKey] ? 'ok' : 'missing-on-disk') : 'missing-approved-asset',
      previousScreenId: i > 0 ? `session-${all[i - 1].session}` : 'entry-venue',
      nextScreenId: i < all.length - 1 ? `session-${all[i + 1].session}` : 'supporting-recommended-next-journey',
      prerequisites: i > 0 ? [`session-${all[i - 1].session}`] : ['entry-enroll', 'entry-venue'],
      guardType: 'sessionNumber',
      dataSelectorKey: `session-${s.session}`,
      completionKey: s.id,
      interactionManifestKey: `session-${s.session}`,
      persistenceScope: 'journey',
      xpEvent: `session-${s.session}-complete`,
      passportEvent: s.id === 'passport-stamp' ? 'passport-stamp-claimed' : null,
      mergedInto: s.mergedInto || null,
      sharedComponent: s.sharedComponent || null,
      // Format (S5) approved flow forwards into the Request/Purchase
      // supporting module (SUPPORTING_MODULES, session.js) rather than
      // straight to S6 — a real, approved branch outside the linear spine.
      // Overriding the completion route here (rather than bending the
      // linear nextScreenId chain used for guard/back-nav purposes)
      // preserves that approved navigation exactly.
      nextRouteOverride: s.session === 5 ? '/smokecraft/request-purchase' : null,
      directAccessAllowed: false,
      reviewAllowed: true,
    }
  }),
]

export const TOTAL_MANIFEST_PHASES = VISIT_STRUCTURE.length
export const TOTAL_MANIFEST_SESSIONS = all.length

export function getManifestEntry(screenId) {
  return SMOKECRAFT_SCREEN_MANIFEST.find(m => m.screenId === screenId) || null
}
