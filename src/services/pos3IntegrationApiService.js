/**
 * POS 3 Integration API Service — Phase 9
 * Frontend API calls for POS 3 provider management.
 * Uses existing apiClient.js (credentials: 'include').
 * All functions fail safely if backend is unavailable.
 */

import { apiGet, apiPost } from './apiClient.js'

const BASE = '/api/pos3/providers'

async function safe(fn) {
  try {
    return await fn()
  } catch (err) {
    console.warn('[pos3Api]', err?.message || err)
    return { success: false, message: err?.message || 'Network error', offline: true }
  }
}

export const getPOS3Providers        = ()                    => safe(() => apiGet(BASE))
export const getProviderStatus       = (key)                 => safe(() => apiGet(`${BASE}/${key}/status`))
export const testProviderConnection  = (key)                 => safe(() => apiPost(`${BASE}/${key}/test-connection`))
export const getProviderLocations    = (key)                 => safe(() => apiGet(`${BASE}/${key}/locations`))
export const getProviderMenu         = (key)                 => safe(() => apiGet(`${BASE}/${key}/menu`))
export const getProviderInventory    = (key)                 => safe(() => apiGet(`${BASE}/${key}/inventory`))
export const getActiveOrders         = (key)                 => safe(() => apiGet(`${BASE}/${key}/orders/active`))
export const getOrderById            = (key, orderId)        => safe(() => apiGet(`${BASE}/${key}/orders/${orderId}`))
export const getTables               = (key)                 => safe(() => apiGet(`${BASE}/${key}/tables`))
export const getStaff                = (key)                 => safe(() => apiGet(`${BASE}/${key}/staff`))
export const sendRecommendation      = (key, payload)        => safe(() => apiPost(`${BASE}/${key}/recommendation`, payload))
export const getEATFeed              = (key = 'prototype')   => safe(() => apiGet(`/api/pos3/eat-feed?provider=${key}`))
export const getFounderLicensePanel  = ()                    => safe(() => apiGet('/api/pos3/founder/license'))
