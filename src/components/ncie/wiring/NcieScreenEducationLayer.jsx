import { useNcieScreenEducation } from '../../../hooks/ncie/useNcieScreenEducation.js'
import NcieLessonViewer from '../NcieLessonViewer.jsx'

export default function NcieScreenEducationLayer({ moduleId = 'smokecraft', screenKey = null, guestId = null, children }) {
  const {
    activeTile,
    activeTopic,
    openLearnMore,
    openTopic,
    closeLearnMore,
    closeTopic,
    educationStatus,
    lessonStatus,
    screenWiringStatus,
  } = useNcieScreenEducation(moduleId, screenKey)

  return (
    <div className="ncie-screen-education-layer relative">
      {children}

      {activeTile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={closeLearnMore}>
          <div
            className="bg-white w-full max-w-2xl rounded-t-2xl p-6 pb-10 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-gray-400 uppercase tracking-wide">{lessonStatus}</span>
              <button
                onClick={closeLearnMore}
                className="text-gray-500 text-2xl leading-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <NcieLessonViewer
              moduleId={moduleId}
              topicId={activeTile}
              guestId={guestId}
              onClose={closeLearnMore}
            />
          </div>
        </div>
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="hidden" data-ncie-education-status={educationStatus} data-ncie-screen-wiring={screenWiringStatus} />
      )}
    </div>
  )
}
