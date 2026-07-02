import { useState } from 'react'
import { useNcieAnalytics } from '../../../hooks/ncie/useNcieAnalytics.js'
import NcieQuizWidget from '../NcieQuizWidget.jsx'

export default function NcieQuizDrawer({ moduleId = 'smokecraft', topicId = null, guestId = null, onClose = null }) {
  const [isOpen, setIsOpen] = useState(false)
  const { trackQuizStarted, trackQuizCompleted, analyticsStatus } = useNcieAnalytics(moduleId, guestId)

  const handleOpen = () => {
    setIsOpen(true)
    trackQuizStarted({ topicId, trigger: 'quiz_drawer' })
  }

  const handleClose = () => {
    setIsOpen(false)
    onClose?.()
  }

  const handleComplete = (result) => {
    trackQuizCompleted({ topicId, score: result?.score, trigger: 'quiz_drawer' })
    setTimeout(handleClose, 1200)
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="flex items-center gap-2 px-4 py-3 min-h-[44px] bg-sky-600 text-white text-sm font-medium rounded-lg hover:bg-sky-700 active:scale-95 transition-all"
          aria-label="Take Quiz"
        >
          <span>🧠</span>
          <span>Quick Quiz</span>
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
                <p className="font-semibold text-gray-900">Craft Quiz</p>
                <p className="text-xs text-gray-400 mt-0.5">quiz_preview · {analyticsStatus}</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-500 text-2xl leading-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <NcieQuizWidget
              moduleId={moduleId}
              topicId={topicId}
              guestId={guestId}
              onComplete={handleComplete}
            />
          </div>
        </div>
      )}
    </>
  )
}
