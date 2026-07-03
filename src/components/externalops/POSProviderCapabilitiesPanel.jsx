const PROVIDERS = ['Square','Toast','Clover','Lightspeed','Shopify POS','Stripe Terminal','Custom POS API']

export default function POSProviderCapabilitiesPanel() {
  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 dark:border-gray-700 p-4 space-y-2">
      <p className="font-semibold text-sm">Supported POS Providers</p>
      {PROVIDERS.map(p => (
        <div key={p} className="text-xs flex items-center justify-between border-b dark:border-gray-700 pb-1">
          <span className="text-gray-700 dark:text-gray-300">{p}</span>
          <span className="text-orange-500 text-[10px]">provider_not_configured</span>
        </div>
      ))}
      <p className="text-[10px] text-gray-400">All providers require external_pos_credentials to activate.</p>
    </div>
  )
}
