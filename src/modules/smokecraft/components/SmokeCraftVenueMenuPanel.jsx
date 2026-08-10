/**
 * SmokeCraftVenueMenuPanel
 * Displays venue menu items for SmokeCraft ordering.
 * Shows honest fallback warning when menu is not live-synced.
 */

export default function SmokeCraftVenueMenuPanel({ menu }) {
  if (!menu) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-500 dark:text-gray-400">
        No venue menu loaded.
      </div>
    )
  }

  const isFallback = menu.menuSource === 'local_fallback' || menu.syncStatus === 'not_connected'

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Venue Menu</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
          isFallback
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
        }`}>
          {isFallback ? 'local_fallback' : 'live_menu'}
        </span>
      </div>

      {isFallback && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          {menu.fallbackNote ?? 'Venue menu is not live-synced. Connect POS360 or E.A.T. for live menu data.'}
        </div>
      )}

      {menu.menuItems && menu.menuItems.length > 0 ? (
        <div className="space-y-2">
          {menu.menuItems.map(item => (
            <div key={item.menuItemId} className="rounded border border-gray-100 dark:border-gray-800 p-3 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">{item.name}</span>
                {item.price != null
                  ? <span className="text-xs text-gray-500 dark:text-gray-400">${item.price}</span>
                  : <span className="text-xs text-gray-400 dark:text-gray-500">price on request</span>
                }
              </div>
              {item.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
              )}
              <div className="flex flex-wrap gap-1">
                {item.cigarPairingTags?.map(t => (
                  <span key={t} className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">🍃 {t}</span>
                ))}
                {item.drinkPairingTags?.map(t => (
                  <span key={t} className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">🥃 {t}</span>
                ))}
              </div>
              <div className="flex gap-2 text-xs">
                {item.customerOrderAllowed
                  ? <span className="text-green-600 dark:text-green-400">Customer can order</span>
                  : <span className="text-amber-600 dark:text-amber-400">Staff required</span>
                }
                <span className="text-gray-400 dark:text-gray-500">· {item.availability}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">No menu items available.</p>
      )}

      <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
        syncStatus: {menu.syncStatus ?? 'unknown'} · source: {menu.menuSource ?? 'unknown'}
      </div>
    </div>
  )
}
