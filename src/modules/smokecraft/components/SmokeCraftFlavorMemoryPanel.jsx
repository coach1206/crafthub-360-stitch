/**
 * SmokeCraftFlavorMemoryPanel
 * Displays Flavor Memory notes captured during the SmokeCraft journey.
 * Flavor Memory is a required journey step — shown clearly to the customer.
 * Shows how Flavor Memory signals inform future pairing recommendations.
 */

function NoteGroup({ label, notes }) {
  if (!notes?.length) return null
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</div>
      <div className="flex flex-wrap gap-1">
        {notes.map((n, i) => (
          <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}

function LikedNotes({ liked = [], disliked = [] }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {liked.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-green-700 dark:text-green-300">Liked</div>
          <div className="flex flex-wrap gap-1">
            {liked.map((n, i) => (
              <span key={i} className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
      {disliked.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-red-600 dark:text-red-400">Disliked</div>
          <div className="flex flex-wrap gap-1">
            {disliked.map((n, i) => (
              <span key={i} className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">
                {n}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SmokeCraftFlavorMemoryPanel({ flavorMemory }) {
  if (!flavorMemory) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        No Flavor Memory recorded yet. Complete the Flavor Memory step in your SmokeCraft journey.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Flavor Memory</h2>
        <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full font-medium">
          Required Journey Step
        </span>
      </div>

      {flavorMemory.phase && (
        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{flavorMemory.phase}</div>
      )}

      <NoteGroup label="Flavor Notes" notes={flavorMemory.flavorNotes} />
      <NoteGroup label="Aroma Notes" notes={flavorMemory.aromaNotes} />
      <NoteGroup label="Burn Notes" notes={flavorMemory.burnNotes} />
      <NoteGroup label="Draw Notes" notes={flavorMemory.drawNotes} />
      <NoteGroup label="Retrohale Notes" notes={flavorMemory.retrohaleNotes} />
      <NoteGroup label="Surprise Notes" notes={flavorMemory.surpriseNotes} />

      <LikedNotes liked={flavorMemory.likedNotes} disliked={flavorMemory.dislikedNotes} />

      <div className="grid grid-cols-2 gap-2 text-xs">
        {flavorMemory.strengthPerception && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2">
            <div className="text-gray-500 dark:text-gray-400">Strength</div>
            <div className="font-medium text-gray-800 dark:text-gray-200">{flavorMemory.strengthPerception}</div>
          </div>
        )}
        {flavorMemory.bodyPerception && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2">
            <div className="text-gray-500 dark:text-gray-400">Body</div>
            <div className="font-medium text-gray-800 dark:text-gray-200">{flavorMemory.bodyPerception}</div>
          </div>
        )}
        {flavorMemory.finishLength && (
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded p-2">
            <div className="text-gray-500 dark:text-gray-400">Finish</div>
            <div className="font-medium text-gray-800 dark:text-gray-200">{flavorMemory.finishLength}</div>
          </div>
        )}
      </div>

      {flavorMemory.memoryTags?.length > 0 && (
        <NoteGroup label="Memory Tags" notes={flavorMemory.memoryTags} />
      )}

      <div className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded p-2">
        These notes inform your SmokeCraft pairing recommendations and taste profile.
      </div>
    </div>
  )
}
