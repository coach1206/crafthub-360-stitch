/**
 * useSmokeCraftOrdering
 * Module-layer hook for SmokeCraft ordering operations.
 * Wraps ordering service with React state management.
 */

import { useState, useCallback } from 'react'
import { createCustomerSelfOrder, createStaffAssistedOrder } from '../services/smokecraftOrderingService.js'

export function useSmokeCraftOrdering() {
  const [orderResult, setOrderResult] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const placeCustomerOrder = useCallback(async (payload) => {
    setIsSubmitting(true)
    try {
      const result = createCustomerSelfOrder(payload)
      setOrderResult(result)
      return result
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  const placeStaffAssistedOrder = useCallback(async (payload) => {
    setIsSubmitting(true)
    try {
      const result = createStaffAssistedOrder(payload)
      setOrderResult(result)
      return result
    } finally {
      setIsSubmitting(false)
    }
  }, [])

  return {
    orderResult,
    isSubmitting,
    placeCustomerOrder,
    placeStaffAssistedOrder,
    pos360Connected: false,
    syncStatus: 'not_connected',
  }
}
