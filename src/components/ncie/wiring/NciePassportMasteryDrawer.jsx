import { useEffect } from 'react'
import { useNciePassportMastery } from '../../../hooks/ncie/useNciePassportMastery.js'

export default function NciePassportMasteryDrawer({ moduleId = 'smokecraft', guestId = null, onClose = null }) {
  const {
    profile,
    isOpen,
    loadProfile,
    openDrawer,
    closeDrawer,
    readiness,
    passportStatus,
    masteryStatus,
    passportNote,
  } = useNciePassportMastery(moduleId)

  useEffect(() => {
    if (isOpen && guestId) loadProfile(guestId)
  }, [isOpen, guestId, loadProfile])

  const handleClose = () => { closeDrawer(); onClose?.() }

  return (
    <>
      {!isOpen && (
        <button
          onClick={openDrawer}
          className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 active:scale-95 transition-all"
          aria-label="View Passport & Mastery"
        >
          <span>🛂</span>
          <span>My Passport</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={handleClose}>
          <div
            className="bg-white w-full max-w-2xl rounded-t-2xl p-6 pb-10 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">SmokeCraft Passport & Mastery</p>
                <p className="text-xs text-gray-400 mt-0.5">{passportStatus} · {masteryStatus}</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 text-2xl leading-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              {passportNote}
            </div>

            {profile ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-yellow-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-yellow-700">{profile.craftXP ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Craft XP</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl text-center">
                    <p className="text-2xl font-bold text-amber-700">{profile.globalXP ?? 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Global XP</p>
                  </div>
                </div>

                {profile.craftLevel && (
                  <div className="p-4 border border-yellow-200 rounded-xl">
                    <p className="text-sm text-gray-600">Current Level</p>
                    <p className="font-semibold text-gray-900 mt-0.5 capitalize">{profile.craftLevel.replace(/_/g, ' ')}</p>
                  </div>
                )}

                {profile.masteryPercent != null && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Mastery Progress</span>
                      <span>{profile.masteryPercent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-yellow-500 h-3 rounded-full transition-all"
                        style={{ width: `${profile.masteryPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                <p>Passport data not loaded.</p>
                <p className="text-xs mt-1">{readiness?.masteryReadiness ?? masteryStatus}</p>
                {guestId && (
                  <button
                    onClick={() => loadProfile(guestId)}
                    className="mt-4 px-4 py-2 min-h-[44px] border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50"
                  >
                    Load Profile
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
