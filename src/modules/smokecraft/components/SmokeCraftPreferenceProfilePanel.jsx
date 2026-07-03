/**
 * SmokeCraftPreferenceProfilePanel
 * Displays the customer taste profile built from SmokeCraft journey signals.
 * Shows honest partial status when data is incomplete.
 */

function ProfileRow({ label, value }) {
  if (!value && value !== 0) return null
  const display = Array.isArray(value) ? value.join(', ') || '—' : String(value)
  return (
    <div className="flex justify-between gap-4 text-xs">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-mono text-gray-800 dark:text-gray-200 text-right max-w-[60%] truncate" title={display}>
        {display || '—'}
      </span>
    </div>
  )
}

function ConfidenceBar({ score }) {
  const pct = Math.round((score ?? 0) * 100)
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-amber-500' : 'bg-gray-400'
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-gray-500 dark:text-gray-400">Profile Confidence</span>
        <span className="font-mono text-gray-700 dark:text-gray-300">{pct}%</span>
      </div>
      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div className={`${color} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function SmokeCraftPreferenceProfilePanel({ tasteProfile }) {
  if (!tasteProfile) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        No preference profile available. Complete more SmokeCraft journey steps to build your profile.
      </div>
    )
  }

  const isPartial = tasteProfile.tasteProfileStatus === 'partial'

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Taste Profile</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          isPartial
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}>
          {tasteProfile.tasteProfileStatus}
        </span>
      </div>

      <ConfidenceBar score={tasteProfile.confidenceScore} />

      <div className="space-y-1">
        <ProfileRow label="Preferred Strength" value={tasteProfile.preferredStrength} />
        <ProfileRow label="Preferred Body" value={tasteProfile.preferredBody} />
        <ProfileRow label="Dominant Flavors" value={tasteProfile.dominantFlavorNotes} />
        <ProfileRow label="Secondary Flavors" value={tasteProfile.secondaryFlavorNotes} />
        <ProfileRow label="Avoid Flavors" value={tasteProfile.avoidFlavorNotes} />
        <ProfileRow label="Wrapper Types" value={tasteProfile.recommendedWrapperTypes} />
        <ProfileRow label="Origins" value={tasteProfile.recommendedOrigins} />
        <ProfileRow label="Drink Affinity" value={tasteProfile.drinkAffinity} />
        <ProfileRow label="Food Affinity" value={tasteProfile.foodAffinity} />
      </div>

      {tasteProfile.mentorInfluence?.applied && (
        <div className="text-xs bg-gray-50 dark:bg-gray-800/50 rounded p-2 space-y-0.5">
          <div className="font-medium text-gray-700 dark:text-gray-300">Mentor Influence</div>
          <div className="text-gray-500 dark:text-gray-400">
            {tasteProfile.mentorInfluence.mentorStyle ?? tasteProfile.mentorInfluence.mentorId}
          </div>
        </div>
      )}

      {tasteProfile.sourceSignals?.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-gray-500 dark:text-gray-400">Signal Sources</div>
          <div className="flex flex-wrap gap-1">
            {tasteProfile.sourceSignals.map(s => (
              <span key={s} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded font-mono">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {isPartial && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          Profile is partial. Complete more journey steps to improve recommendation confidence.
        </div>
      )}
    </div>
  )
}
