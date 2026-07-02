import { useState } from 'react'
import NcieScreenEducationLayer from '../../components/ncie/wiring/NcieScreenEducationLayer.jsx'
import NcieTileLearnMoreButton from '../../components/ncie/wiring/NcieTileLearnMoreButton.jsx'
import NcieMentorDrawer from '../../components/ncie/wiring/NcieMentorDrawer.jsx'
import NcieDecisionDrawer from '../../components/ncie/wiring/NcieDecisionDrawer.jsx'
import NcieRecommendationDrawer from '../../components/ncie/wiring/NcieRecommendationDrawer.jsx'
import NcieQuizDrawer from '../../components/ncie/wiring/NcieQuizDrawer.jsx'
import NciePassportMasteryDrawer from '../../components/ncie/wiring/NciePassportMasteryDrawer.jsx'
import NcieScreenStatusDock from '../../components/ncie/wiring/NcieScreenStatusDock.jsx'

const DEMO_GUEST_ID = 'demo_guest_001'
const DEMO_MODULE   = 'smokecraft'

export default function NcieWiringDemo() {
  const [showDock, setShowDock] = useState(true)

  return (
    <NcieScreenEducationLayer moduleId={DEMO_MODULE} screenKey="golden-box" guestId={DEMO_GUEST_ID}>
      <div className="min-h-screen bg-gray-50 p-6 pb-32">
        <div className="max-w-2xl mx-auto space-y-8">

          <div>
            <h1 className="text-2xl font-bold text-gray-900">NCIE Screen Wiring Demo</h1>
            <p className="text-sm text-gray-500 mt-1">
              Phase 11 — Educational tiles and screen adapters wired without modifying protected screens.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded">screen_wiring_ready</span>
              <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded">verified_outline_available</span>
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">protected_screen_not_modified</span>
            </div>
          </div>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Educational Tiles — Learn More</h2>
            <p className="text-xs text-gray-400 mb-4">Tap any tile to open a verified content outline. No live AI required.</p>
            <div className="flex flex-wrap gap-3">
              <NcieTileLearnMoreButton tileId="sc_soil"    craftType={DEMO_MODULE} guestId={DEMO_GUEST_ID} label="Tobacco Soil" />
              <NcieTileLearnMoreButton tileId="sc_wrapper" craftType={DEMO_MODULE} guestId={DEMO_GUEST_ID} label="Wrapper Leaf" />
              <NcieTileLearnMoreButton tileId="sc_flavor"  craftType={DEMO_MODULE} guestId={DEMO_GUEST_ID} label="Flavor Profiles" />
              <NcieTileLearnMoreButton tileId="sc_pairing" craftType={DEMO_MODULE} guestId={DEMO_GUEST_ID} label="Pairing Guide" />
              <NcieTileLearnMoreButton tileId="sc_humidor" craftType={DEMO_MODULE} guestId={DEMO_GUEST_ID} label="Humidor Care" />
            </div>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Mentor</h2>
            <p className="text-xs text-gray-400 mb-4">Choose a mentor and start a guided session. AI personalization requires an active OpenAI key.</p>
            <NcieMentorDrawer moduleId={DEMO_MODULE} guestId={DEMO_GUEST_ID} />
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Decision Guide</h2>
            <p className="text-xs text-gray-400 mb-4">Personalized recommendations based on your learning history and preferences.</p>
            <NcieDecisionDrawer moduleId={DEMO_MODULE} guestProfile={{ experienceLevel: 'beginner', preferredStrength: 'mild' }} />
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Recommendations</h2>
            <p className="text-xs text-gray-400 mb-4">Knowledge-based recommendations. Live inventory not connected (inventory_unavailable).</p>
            <NcieRecommendationDrawer moduleId={DEMO_MODULE} context={{ experienceLevel: 'beginner' }} />
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Knowledge Quiz</h2>
            <p className="text-xs text-gray-400 mb-4">Quiz on a specific topic. Analytics tracked in preview mode (not persisted).</p>
            <NcieQuizDrawer moduleId={DEMO_MODULE} topicId="sc_wrapper" guestId={DEMO_GUEST_ID} />
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-semibold text-gray-800 mb-1">Passport & Mastery</h2>
            <p className="text-xs text-gray-400 mb-4">XP and mastery data preview. Stamp locks are enforced by session.js, not NCIE.</p>
            <NciePassportMasteryDrawer moduleId={DEMO_MODULE} guestId={DEMO_GUEST_ID} />
          </section>

          <section className="bg-gray-100 rounded-2xl p-4 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-700">Protected Screen Status</p>
            <p>SmokeCraftAssetScreen.jsx — <span className="text-amber-600">protected_screen_not_modified</span></p>
            <p>SmokeCraftHotspotLayer.jsx — <span className="text-amber-600">protected_screen_not_modified</span></p>
            <p>SmokeCraftAssetRoute.jsx  — <span className="text-amber-600">protected_screen_not_modified</span></p>
            <p>session.js / VISIT_STRUCTURE — <span className="text-amber-600">protected_screen_not_modified</span></p>
          </section>

          <div className="text-center">
            <button
              onClick={() => setShowDock(v => !v)}
              className="px-4 py-2 min-h-[44px] border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-100"
            >
              {showDock ? 'Hide' : 'Show'} Status Dock
            </button>
          </div>
        </div>
      </div>

      <NcieScreenStatusDock moduleId={DEMO_MODULE} visible={showDock} />
    </NcieScreenEducationLayer>
  )
}
