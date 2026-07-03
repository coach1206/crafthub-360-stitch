/**
 * SmokeCraftMenuPairingPanel
 * Displays recommended menu items with pairing scores.
 * Shows local_fallback warning when venue menu is not live-connected.
 * Respects availability, staffRequired, and customerOrderAllowed.
 */

function PairingTag({ tag, type = 'default' }) {
  const colorMap = {
    cigar: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    drink: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    food:  'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400',
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  }
  return (
    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${colorMap[type] ?? colorMap.default}`}>
      {tag}
    </span>
  )
}

function MenuItemCard({ item, onAddToOrder }) {
  const isOrderable = item.available && item.customerOrderAllowed !== false
  const needsStaff = item.staffRequired === true

  return (
    <div className={`rounded border p-3 space-y-2 ${
      isOrderable
        ? 'border-gray-200 dark:border-gray-700'
        : 'border-gray-100 dark:border-gray-800 opacity-60'
    }`}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</div>
          {item.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{item.description}</div>
          )}
        </div>
        <div className="text-right shrink-0">
          {item.price != null && (
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              ${typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
            </div>
          )}
          <div className="text-xs text-amber-600 dark:text-amber-400 font-mono">
            {item.score ?? 0}/100
          </div>
        </div>
      </div>

      {/* Pairing tags */}
      {(item.cigarPairingTags?.length > 0 || item.drinkPairingTags?.length > 0 || item.foodPairingTags?.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {(item.cigarPairingTags ?? []).map(t => <PairingTag key={t} tag={t} type="cigar" />)}
          {(item.drinkPairingTags ?? []).map(t => <PairingTag key={t} tag={t} type="drink" />)}
          {(item.foodPairingTags ?? []).map(t => <PairingTag key={t} tag={t} type="food" />)}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {!item.available && (
            <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded">unavailable</span>
          )}
          {needsStaff && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">staff required</span>
          )}
          {!isOrderable && item.available && (
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded">order via staff</span>
          )}
        </div>
        {isOrderable && onAddToOrder && (
          <button
            onClick={() => onAddToOrder({
              menuItemId: item.menuItemId,
              name: item.name,
              pairingRecommendationId: item.pairingRecommendationId,
            })}
            className="text-xs px-3 py-1 rounded border border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
          >
            Add to Order
          </button>
        )}
      </div>
    </div>
  )
}

export default function SmokeCraftMenuPairingPanel({ menuRecommendations, onAddToOrder }) {
  if (!menuRecommendations) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-400 dark:text-gray-500">
        No menu recommendations available.
      </div>
    )
  }

  const { recommendations = [], menuSource, syncStatus, venueMenuBacked, totalScored, message } = menuRecommendations
  const isLocalFallback = menuSource === 'local_fallback' || !venueMenuBacked

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Menu Pairings</h2>
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
          {recommendations.length} of {totalScored ?? recommendations.length}
        </span>
      </div>

      {isLocalFallback && (
        <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded p-2">
          Venue menu is {menuSource ?? 'local_fallback'} — {syncStatus ?? 'not_connected'}. Connect POS360 or E.A.T. for live menu recommendations.
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="text-xs text-gray-400 dark:text-gray-500">
          {message ?? 'No menu items matched the current pairing criteria.'}
        </div>
      ) : (
        <div className="space-y-2">
          {recommendations.map(item => (
            <MenuItemCard
              key={item.menuItemId ?? item.recommendationId}
              item={item}
              onAddToOrder={onAddToOrder}
            />
          ))}
        </div>
      )}

      {!isLocalFallback && (
        <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded p-2">
          Menu sourced from live venue menu ({menuSource}).
        </div>
      )}
    </div>
  )
}
