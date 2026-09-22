/**
 * Epos Now provider adapter.
 * Safe-by-default: exposes the standard POS3 adapter contract and remains
 * not_configured until venue credentials are supplied.
 */
import { isProviderReady } from '../pos3CredentialVault.js'

const PROVIDER = 'epos_now'
const NC = () => ({ success:false, provider:PROVIDER, mode:'not_configured', message:'Epos Now adapter is installed but credentials are not configured.' })

export const getProviderName = () => 'Epos Now'
export const getConnectionStatus = () => ({ ...NC(), configured:isProviderReady(PROVIDER), liveReady:false })
export const validateCredentials = NC
export const fetchLocations = NC
export const fetchMenus = NC
export const fetchInventory = NC
export const fetchActiveOrders = NC
export const fetchOrderById = (_id) => NC()
export const fetchTables = NC
export const fetchStaff = NC
export const pushGuestSignal = (_p) => NC()
export const pushPairingRecommendation = (_p) => NC()
export const pushUpsellRecommendation = (_p) => NC()
export const receiveWebhook = (_p,_h) => NC()
export const normalizeOrder = raw => raw
export const normalizeMenuItem = raw => raw
export const normalizeInventoryItem = raw => raw
export const normalizeStaffMember = raw => raw
export const normalizeTable = raw => raw
