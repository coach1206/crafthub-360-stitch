/**
 * SmokeCraftOrderModeSelector
 * Allows selection between customer self-order and staff-assisted order.
 * Clearly explains each mode to the customer.
 */

const MODES = [
  {
    id: 'customer_self_order',
    label: 'Order Directly',
    description: 'Submit your request directly. Staff will be notified.',
    icon: '🛒',
  },
  {
    id: 'staff_assisted_order',
    label: 'Request Staff Assistance',
    description: 'Send your request to your waitress or server for help selecting and ordering.',
    icon: '🤝',
  },
]

export default function SmokeCraftOrderModeSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">How would you like to order?</h3>
      <div className="grid gap-2 sm:grid-cols-2">
        {MODES.map(mode => (
          <button
            key={mode.id}
            onClick={() => onChange?.(mode.id)}
            className={`text-left rounded-lg border p-3 transition-colors ${
              value === mode.id
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-400'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{mode.icon}</span>
              <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{mode.label}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{mode.description}</p>
          </button>
        ))}
      </div>
      {value && (
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
          orderMode: {value}
        </p>
      )}
    </div>
  )
}
