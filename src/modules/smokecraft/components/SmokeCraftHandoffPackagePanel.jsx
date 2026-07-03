/**
 * SmokeCraftHandoffPackagePanel
 * Shows build sequence, route map, service map, component map, and verify scripts.
 */

function BuildRow({ build }) {
  return (
    <div className="flex items-center gap-2 text-xs py-1 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <span className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 flex items-center justify-center font-medium flex-shrink-0">
        {build.build}
      </span>
      <span className="text-gray-700 dark:text-gray-300 flex-1 min-w-0 truncate">{build.title}</span>
      {build.commit && <span className="font-mono text-gray-400 dark:text-gray-500 text-xs">{build.commit.slice(0, 8)}</span>}
    </div>
  )
}

function ListSection({ title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{title}</h3>
      <div className="border border-gray-100 dark:border-gray-800 rounded p-2 space-y-0.5">
        {items.slice(0, 6).map((item, i) => (
          <div key={i} className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">{item}</div>
        ))}
        {items.length > 6 && <div className="text-xs text-gray-400 dark:text-gray-500">+{items.length - 6} more</div>}
      </div>
    </div>
  )
}

export default function SmokeCraftHandoffPackagePanel({ handoff }) {
  if (!handoff) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        Handoff package not available.
      </div>
    )
  }

  const builds = handoff.buildSequence ?? []

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Handoff Package</h2>
        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          {handoff.handoffStatus ?? 'handoff_ready'}
        </span>
      </div>

      {builds.length > 0 && (
        <>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Build Sequence</h3>
          <div className="border border-gray-100 dark:border-gray-800 rounded p-2">
            {builds.map(b => <BuildRow key={b.build} build={b} />)}
          </div>
        </>
      )}

      <ListSection title="API Routes" items={handoff.apiRouteMap} />
      <ListSection title="Verify Scripts" items={handoff.verifyScriptMap?.map(s => s.script)} />
      <ListSection title="Services" items={handoff.serviceMap} />
    </div>
  )
}
