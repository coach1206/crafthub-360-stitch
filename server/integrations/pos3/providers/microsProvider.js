/**
 * Oracle MICROS Provider Adapter — Phase 9
 * Adapter is prepared. Credentials not yet configured.
 * All functions return not_configured until MICROS_API_KEY + MICROS_PROPERTY_ID + MICROS_RVC_SEQ are set.
 */

import { isProviderReady } from '../pos3CredentialVault.js'

const PROVIDER = 'micros'
const NC = () => ({ success: false, provider: PROVIDER, mode: 'not_configured', message: 'Provider adapter prepared but credentials are not configured.' })

export const getProviderName        = () => 'Oracle MICROS'
export const getConnectionStatus    = () => ({ ...NC(), liveReady: false, configured: isProviderReady(PROVIDER) })
export const validateCredentials    = NC
export const fetchLocations         = NC
export const fetchMenus             = NC
export const fetchInventory         = NC
export const fetchActiveOrders      = NC
export const fetchOrderById         = (_id) => NC()
export const fetchTables            = NC
export const fetchStaff             = NC
export const pushGuestSignal        = (_p) => NC()
export const pushPairingRecommendation = (_p) => NC()
export const pushUpsellRecommendation  = (_p) => NC()
export const receiveWebhook         = (_p, _h) => NC()
export const normalizeOrder         = (raw) => raw
export const normalizeMenuItem      = (raw) => raw
export const normalizeInventoryItem = (raw) => raw
export const normalizeStaffMember   = (raw) => raw
export const normalizeTable         = (raw) => raw
