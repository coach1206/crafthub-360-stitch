/**
 * POS 3 External Integration Hub — provider catalog. All 13 providers are
 * descriptive metadata only; no real credentials or network calls are ever
 * made (see posSyncService.js for the safe, local-only sync simulation).
 */

export const POS_PROVIDERS = [
  {
    id: 'square', name: 'Square', description: 'Square POS — menu, orders, inventory, staff sync.',
    whatItSyncs: ['Menu & Categories', 'Orders', 'Inventory', 'Staff'],
    requiredCredentialFields: [
      { key: 'applicationId', label: 'Application ID' },
      { key: 'accessToken', label: 'Access Token' },
      { key: 'locationId', label: 'Location ID' },
    ],
  },
  {
    id: 'clover', name: 'Clover', description: 'Clover POS — merchant menu and order sync.',
    whatItSyncs: ['Menu & Categories', 'Orders', 'Payments'],
    requiredCredentialFields: [
      { key: 'merchantId', label: 'Merchant ID' },
      { key: 'accessToken', label: 'Access Token' },
    ],
  },
  {
    id: 'toast', name: 'Toast', description: 'Toast POS — restaurant menu, orders, staff.',
    whatItSyncs: ['Menu & Categories', 'Modifiers', 'Orders', 'Staff'],
    requiredCredentialFields: [
      { key: 'restaurantGuid', label: 'Restaurant GUID' },
      { key: 'clientId', label: 'Client ID' },
      { key: 'clientSecret', label: 'Client Secret' },
    ],
  },
  {
    id: 'lightspeed', name: 'Lightspeed', description: 'Lightspeed Retail/Restaurant — inventory and menu sync.',
    whatItSyncs: ['Menu & Categories', 'Inventory', 'Customers'],
    requiredCredentialFields: [
      { key: 'accountId', label: 'Account ID' },
      { key: 'apiKey', label: 'API Key' },
    ],
  },
  {
    id: 'shopify_pos', name: 'Shopify POS', description: 'Shopify POS — retail product and order sync.',
    whatItSyncs: ['Menu & Categories', 'Inventory', 'Orders', 'Customers'],
    requiredCredentialFields: [
      { key: 'shopDomain', label: 'Shop Domain' },
      { key: 'accessToken', label: 'Access Token' },
    ],
  },
  {
    id: 'stripe_terminal', name: 'Stripe Terminal', description: 'Stripe Terminal — in-person card payment sync.',
    whatItSyncs: ['Payments', 'Orders'],
    requiredCredentialFields: [
      { key: 'secretKey', label: 'Secret Key' },
      { key: 'locationId', label: 'Location ID' },
    ],
  },
  {
    id: 'ncr_aloha', name: 'NCR Aloha', description: 'NCR Aloha POS — full-service restaurant sync.',
    whatItSyncs: ['Menu & Categories', 'Orders', 'Staff', 'Tables & Sections'],
    requiredCredentialFields: [
      { key: 'siteId', label: 'Site ID' },
      { key: 'apiKey', label: 'API Key' },
    ],
  },
  {
    id: 'oracle_micros', name: 'Oracle MICROS', description: 'Oracle MICROS Simphony — enterprise POS sync.',
    whatItSyncs: ['Menu & Categories', 'Orders', 'Inventory'],
    requiredCredentialFields: [
      { key: 'orgId', label: 'Organization ID' },
      { key: 'apiKey', label: 'API Key' },
    ],
  },
  {
    id: 'revel', name: 'Revel Systems', description: 'Revel POS — iPad-based restaurant/retail sync.',
    whatItSyncs: ['Menu & Categories', 'Orders', 'Inventory', 'Staff'],
    requiredCredentialFields: [
      { key: 'apiUrl', label: 'API URL' },
      { key: 'apiKey', label: 'API Key' },
    ],
  },
  {
    id: 'spoton', name: 'SpotOn', description: 'SpotOn POS — restaurant ordering and payments sync.',
    whatItSyncs: ['Menu & Categories', 'Orders', 'Payments'],
    requiredCredentialFields: [
      { key: 'businessId', label: 'Business ID' },
      { key: 'apiKey', label: 'API Key' },
    ],
  },
  {
    id: 'touchbistro', name: 'TouchBistro', description: 'TouchBistro POS — full-service restaurant sync.',
    whatItSyncs: ['Menu & Categories', 'Orders', 'Staff'],
    requiredCredentialFields: [
      { key: 'venueId', label: 'Venue ID' },
      { key: 'apiKey', label: 'API Key' },
    ],
  },
  {
    id: 'manual_csv', name: 'Manual CSV Import', description: 'Upload sample CSV files — no live connection required.',
    whatItSyncs: ['Menu & Categories', 'Inventory', 'Orders'],
    requiredCredentialFields: [
      { key: 'uploadPlaceholder', label: 'CSV File (placeholder — sample data used)' },
    ],
  },
  {
    id: 'custom_api', name: 'Custom API', description: 'Bring your own REST API — configurable base URL and auth header.',
    whatItSyncs: ['Menu & Categories', 'Orders', 'Inventory', 'Staff'],
    requiredCredentialFields: [
      { key: 'baseUrl', label: 'Base URL' },
      { key: 'apiKey', label: 'API Key' },
      { key: 'authHeaderName', label: 'Auth Header Name' },
    ],
  },
]

export function getPosProviders() { return POS_PROVIDERS }
export function getPosProvider(id) { return POS_PROVIDERS.find((p) => p.id === id) || null }
