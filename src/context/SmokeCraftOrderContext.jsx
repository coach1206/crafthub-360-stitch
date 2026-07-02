/**
 * SmokeCraftOrderContext — cart, order, and payment state for the guest ordering flow.
 *
 * Handles:
 * - Cart lifecycle (create, add, remove, checkout)
 * - Payment (simulated local-preview or real backend)
 * - Loyalty point award after confirmed payment only
 * - Resume state: saves/restores the SmokeCraft route the guest came from
 * - Table/seat/location capture
 *
 * SAFETY:
 * - Loyalty awarded ONLY after payment success (never on add/checkout)
 * - journeyXP, skillScore, challengeScore are NEVER modified here
 * - paymentIntentId dedup enforced via GuestSessionContext.awardPurchasePoints
 */

import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { useGuestSession } from './GuestSessionContext.jsx'
import { createCart, addItemToCart, removeItemFromCart, getCart, checkoutCart } from '../services/smokecraftCartService.js'
import { confirmPayment, failPayment } from '../services/smokecraftOrderService.js'
import { getVenueMenu } from '../services/venueInventoryService.js'
import { PURCHASE_POINT_RULES, RECOMMENDED_PAIRING_BONUS } from '../data/loyaltyPointRulesClient.js'

const VENUE_ID = 'novee-grand-lounge'

const SmokeCraftOrderContext = createContext(null)

export function SmokeCraftOrderProvider({ children }) {
  const { session, awardPurchasePoints } = useGuestSession()

  // Cart state
  const [cart, setCart] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [cartLoading, setCartLoading] = useState(false)

  // Order state
  const [order, setOrder] = useState(null)
  const [orderStatus, setOrderStatus] = useState(null)

  // Location state
  const [location, setLocation] = useState({ tableId: null, tableName: '', seatNumber: '', sectionName: '', patioZone: '', loungeZone: '', barSeat: '', serverId: '' })

  // Menu state
  const [menuItems, setMenuItems] = useState([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [menuLocalPreview, setMenuLocalPreview] = useState(false)
  const [menuNotice, setMenuNotice] = useState(null)

  // Payment state
  const [paymentStatus, setPaymentStatus] = useState(null) // null | 'pending' | 'success' | 'failed' | 'cancelled'
  const [receipt, setReceipt] = useState(null)

  // Resume route (where the guest came from in SmokeCraft)
  const resumeRouteRef = useRef(null)
  const [resumeRoute, setResumeRouteState] = useState(null)

  const setResumeRoute = useCallback((route) => {
    resumeRouteRef.current = route
    setResumeRouteState(route)
    try { sessionStorage.setItem('sc_order_resume_route', route) } catch {}
  }, [])

  const getResumeRoute = useCallback(() => {
    return resumeRouteRef.current
      || (() => { try { return sessionStorage.getItem('sc_order_resume_route') } catch { return null } })()
      || '/smokecraft'
  }, [])

  // ── Menu ──────────────────────────────────────────────────────
  const loadMenu = useCallback(async (category) => {
    setMenuLoading(true)
    try {
      const result = await getVenueMenu(VENUE_ID, category)
      setMenuItems(result.items || [])
      setMenuLocalPreview(result.localPreview || false)
      setMenuNotice(result.notice || null)
    } finally {
      setMenuLoading(false)
    }
  }, [])

  // ── Cart ──────────────────────────────────────────────────────
  const initCart = useCallback(async () => {
    if (cart) return cart
    setCartLoading(true)
    try {
      const guestSessionId = session?.sessionId || `guest-${Date.now()}`
      const result = await createCart({ guestSessionId, venueId: VENUE_ID, tableId: location.tableId, seatNumber: location.seatNumber })
      if (result?.ok && result.cart) {
        setCart(result.cart)
        return result.cart
      }
    } finally {
      setCartLoading(false)
    }
    return null
  }, [cart, session, location])

  const addToCart = useCallback(async (item, quantity = 1, notes = '') => {
    let activeCart = cart
    if (!activeCart) activeCart = await initCart()
    if (!activeCart) return { ok: false, error: 'Could not create cart' }

    const result = await addItemToCart(activeCart.cart_id, { itemId: item.item_id, quantity, notes })
    if (result?.ok) {
      const updated = await getCart(activeCart.cart_id)
      if (updated?.ok) {
        setCart(updated.cart)
        setCartItems(updated.items || [])
      }
    }
    return result
  }, [cart, initCart])

  const removeFromCart = useCallback(async (cartItemId) => {
    if (!cart) return
    await removeItemFromCart(cart.cart_id, cartItemId)
    const updated = await getCart(cart.cart_id)
    if (updated?.ok) {
      setCart(updated.cart)
      setCartItems(updated.items || [])
    }
  }, [cart])

  const refreshCart = useCallback(async () => {
    if (!cart) return
    const updated = await getCart(cart.cart_id)
    if (updated?.ok) {
      setCart(updated.cart)
      setCartItems(updated.items || [])
    }
  }, [cart])

  // ── Checkout ──────────────────────────────────────────────────
  const startCheckout = useCallback(async ({ tip = 0, serviceCharge = 0, ageVerified = false } = {}) => {
    if (!cart) return { ok: false, error: 'No cart' }
    const result = await checkoutCart(cart.cart_id, { tip, serviceCharge, ageVerified })
    if (result?.ok && result.order) {
      setOrder(result.order)
      setOrderStatus('payment_pending')
    }
    return result
  }, [cart])

  // ── Payment ───────────────────────────────────────────────────
  const processPayment = useCallback(async ({ tenderType = 'card', tip = 0, ageVerified = true } = {}) => {
    setPaymentStatus('pending')

    // If no order yet, do checkout first
    let activeOrder = order
    if (!activeOrder) {
      const chkResult = await startCheckout({ tip, ageVerified })
      if (!chkResult?.ok) {
        setPaymentStatus('failed')
        return chkResult
      }
      activeOrder = chkResult.order
    }

    if (!activeOrder) {
      setPaymentStatus('failed')
      return { ok: false, error: 'No order to pay' }
    }

    // Generate a unique paymentIntentId — local-preview simulated
    const paymentIntentId = `pi_local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const guestSessionId = session?.sessionId || 'guest'

    const result = await confirmPayment(activeOrder.order_id, { paymentIntentId, tenderType, guestSessionId })

    if (result?.ok || result?.order) {
      setPaymentStatus('success')
      setOrder(result.order || activeOrder)
      setOrderStatus('paid')

      // Award loyalty points — ONLY after payment success
      _awardLoyaltyForOrder(cartItems, paymentIntentId, awardPurchasePoints)

      // Build receipt
      const receiptData = {
        orderNumber: activeOrder.order_id,
        items: cartItems,
        subtotal: cart?.subtotal || 0,
        tax: cart?.tax || 0,
        tip,
        serviceCharge: cart?.service_charge || 0,
        discount: cart?.discount || 0,
        total: cart?.total || 0,
        paymentStatus: 'paid',
        tenderType,
        loyaltyPointsEarned: _calcLoyaltyForOrder(cartItems),
        paymentIntentId,
        localPreview: result?.localPreview ?? true,
        notice: result?.localPreview ? 'Local Preview Mode: payment is simulated. No real charge was processed.' : null,
        paidAt: new Date().toISOString(),
      }
      setReceipt(receiptData)
      return { ok: true, receipt: receiptData, order: result.order || activeOrder }
    } else {
      setPaymentStatus('failed')
      await failPayment(activeOrder.order_id, result?.error || 'payment_failed')
      return result || { ok: false, error: 'Payment failed' }
    }
  }, [order, cart, cartItems, session, awardPurchasePoints, startCheckout])

  const cancelPayment = useCallback(async () => {
    if (order) await failPayment(order.order_id, 'user_cancelled')
    setPaymentStatus('cancelled')
    setOrderStatus('cancelled')
  }, [order])

  // ── Reset (after return to SmokeCraft) ────────────────────────
  const resetOrder = useCallback(() => {
    setCart(null)
    setCartItems([])
    setOrder(null)
    setOrderStatus(null)
    setPaymentStatus(null)
    setReceipt(null)
  }, [])

  const value = {
    // Menu
    menuItems, menuLoading, menuLocalPreview, menuNotice, loadMenu,
    // Cart
    cart, cartItems, cartLoading, addToCart, removeFromCart, refreshCart,
    cartSubtotal: cart?.subtotal || 0,
    cartTotal: cart?.total || 0,
    cartTax: cart?.tax || 0,
    cartItemCount: cartItems.reduce((n, i) => n + (i.quantity || 1), 0),
    // Location
    location, setLocation,
    // Checkout
    startCheckout,
    // Payment
    paymentStatus, processPayment, cancelPayment,
    // Order
    order, orderStatus,
    // Receipt
    receipt,
    // Resume route
    setResumeRoute, getResumeRoute,
    // Cleanup
    resetOrder,
    // Venue
    venueId: VENUE_ID,
  }

  return (
    <SmokeCraftOrderContext.Provider value={value}>
      {children}
    </SmokeCraftOrderContext.Provider>
  )
}

export function useSmokeCraftOrder() {
  const ctx = useContext(SmokeCraftOrderContext)
  if (!ctx) throw new Error('useSmokeCraftOrder must be inside <SmokeCraftOrderProvider>')
  return ctx
}

// ── Internal helpers ──────────────────────────────────────────

const POINT_MAP = {
  house_cigar:         100,
  featured_cigar:      75,
  humidor_match:       60,
  liquor:              50,
  cocktail:            50,
  wine:                50,
  beer:                30,
  drink:               30,
  food:                40,
  dinner:              40,
  dessert:             40,
  pairing_bundle:      125,
  full_pairing_bundle: 175,
}

function _calcLoyaltyForOrder(items) {
  return items.reduce((total, item) => {
    const base = POINT_MAP[item.item_category] || 0
    const bonus = item.is_recommended_pairing ? 10 : 0
    return total + (base + bonus) * (item.quantity || 1)
  }, 0)
}

function _awardLoyaltyForOrder(items, paymentIntentId, awardPurchasePoints) {
  // Award per item category, using paymentIntentId for dedup
  for (const item of items) {
    const purchaseType = item.item_category
    awardPurchasePoints(purchaseType, {
      posTransactionId:   paymentIntentId + '_' + item.cart_item_id,
      isHouseItem:        item.is_house_item,
      isRecommendedPairing: item.is_recommended_pairing,
      quantity:           item.quantity || 1,
    })
  }
}
