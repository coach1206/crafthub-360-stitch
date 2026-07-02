import { useState } from 'react'
import { getTileMetadata } from '../../../services/ncie/ncieTileAdapter.js'
import NcieLessonViewer from '../NcieLessonViewer.jsx'

export default function NcieTileLearnMoreButton({ tileId, craftType = 'smokecraft', guestId = null, label = null }) {
  const [open, setOpen] = useState(false)
  const tile = getTileMetadata(tileId, craftType)

  if (!tile) return null

  const displayLabel = label ?? tile.learnMoreLabel ?? 'Learn More'

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-3 min-h-[44px] min-w-[44px] bg-amber-50 border border-amber-200 text-amber-800 text-sm font-medium rounded-lg hover:bg-amber-100 active:scale-95 transition-all"
        aria-label={`${displayLabel}: ${tile.tileTitle}`}
      >
        <span className="text-base">📖</span>
        <span>{displayLabel}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-white w-full max-w-2xl rounded-t-2xl p-6 pb-10 max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold text-gray-900">{tile.tileTitle}</p>
                <p className="text-xs text-gray-400 mt-0.5">{tile.lessonStatus ?? 'verified_outline_available'}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-500 text-2xl leading-none p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <NcieLessonViewer
              moduleId={craftType}
              topicId={tileId}
              guestId={guestId}
              onClose={() => setOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
