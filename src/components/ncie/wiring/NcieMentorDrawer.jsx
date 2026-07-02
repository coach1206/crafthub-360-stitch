import { useNcieMentor } from '../../../hooks/ncie/useNcieMentor.js'

export default function NcieMentorDrawer({ moduleId = 'smokecraft', guestId = null, onClose = null }) {
  const {
    mentors,
    selectedMentor,
    activeSession,
    isOpen,
    chooseMentor,
    startSession,
    endSession,
    openDrawer,
    closeDrawer,
    aiStatus,
    aiAvailable,
    mentorStatus,
  } = useNcieMentor(moduleId)

  const handleClose = () => { closeDrawer(); onClose?.() }

  return (
    <>
      {!isOpen && (
        <button
          onClick={openDrawer}
          className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:scale-95 transition-all"
          aria-label="Ask a Mentor"
        >
          <span>🎓</span>
          <span>Ask a Mentor</span>
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
                <p className="font-semibold text-gray-900">SmokeCraft Mentor</p>
                <p className="text-xs text-gray-400 mt-0.5">{mentorStatus} · {aiStatus}</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 text-2xl leading-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {!aiAvailable && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                AI mentor is not active. Mentor guidance is available in preview mode using verified content outlines.
              </div>
            )}

            {!selectedMentor && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Choose your mentor:</p>
                <div className="flex flex-col gap-2">
                  {mentors.map(m => (
                    <button
                      key={m.mentorId}
                      onClick={() => chooseMentor(m.mentorId)}
                      className="flex items-start gap-3 p-4 min-h-[56px] border border-gray-200 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 active:scale-98 transition-all text-left"
                    >
                      <span className="text-2xl mt-0.5">{m.avatar ?? '🎓'}</span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{m.displayName}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{m.specialty}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMentor && !activeSession && (
              <div>
                <div className="flex items-center gap-3 mb-4 p-4 bg-indigo-50 rounded-xl">
                  <span className="text-3xl">{selectedMentor.avatar ?? '🎓'}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedMentor.displayName}</p>
                    <p className="text-xs text-gray-500">{selectedMentor.specialty}</p>
                  </div>
                </div>
                <button
                  onClick={() => startSession(guestId)}
                  className="w-full py-3 min-h-[48px] bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Start Session
                </button>
              </div>
            )}

            {activeSession && (
              <div>
                <div className="mb-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
                  <p className="font-medium text-gray-800 mb-1">Session Active</p>
                  <p className="text-xs text-gray-400">Session ID: {activeSession.sessionId}</p>
                  {!aiAvailable && (
                    <p className="mt-2 text-amber-700">Responses are based on verified content outlines. AI personalization is not active.</p>
                  )}
                </div>
                <button
                  onClick={endSession}
                  className="w-full py-3 min-h-[48px] border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
                >
                  End Session
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
