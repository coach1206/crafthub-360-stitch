import express from 'express'

const router = express.Router()
const orders = []

router.post('/pairing-order', (req, res) => {
  const {
    guestId   = 'guest-demo',
    venueId   = 'grand-lounge',
    tableId   = null,
    sessionId = 'smokecraft-session',
    items     = [],
    notes     = '',
  } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'Order must include at least one item.' })
  }

  const order = {
    id: `SC-ORDER-${Date.now()}`,
    guestId,
    venueId,
    tableId,
    sessionId,
    items: items.map(item => ({
      itemId:      item.id,
      itemName:    item.name,
      category:    item.category,
      destination: item.orderDestination,
      price:       Number(item.price || 0),
      quantity:    Number(item.quantity || 1),
      status:
        item.orderDestination === 'BAR'      ? 'sent_to_bar'
        : item.orderDestination === 'HUMIDOR' ? 'sent_to_humidor'
        : item.orderDestination === 'KITCHEN' ? 'sent_to_kitchen'
        : 'sent_to_pos3',
    })),
    notes,
    subtotal: items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1), 0),
    status:   'submitted',
    createdAt: new Date().toISOString(),
  }

  orders.push(order)

  res.json({ ok: true, message: 'Order sent to staff.', order })
})

router.get('/orders', (_req, res) => {
  res.json({ ok: true, orders })
})

export default router
