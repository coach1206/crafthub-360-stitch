import { Router } from 'express'

const router = Router()
const pairingOrders = []

router.post('/orders', (req, res) => {
  const { guestId, venueId, tableId, sessionId, items, notes } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ ok: false, error: 'Order must include at least one item.' })
  }

  const order = {
    id:        `PAIR-${Date.now()}`,
    guestId:   guestId   || 'guest-demo',
    venueId:   venueId   || 'grand-lounge',
    tableId:   tableId   || null,
    sessionId: sessionId || 'smokecraft-session',
    items: items.map(item => ({
      itemId:      item.id,
      itemName:    item.name,
      category:    item.category,
      destination: item.orderDestination || item.destination,
      price:       Number(item.price || 0),
      quantity:    Number(item.quantity || 1),
      notes:       item.notes || '',
      status:
        (item.orderDestination || item.destination) === 'BAR'      ? 'sent_to_bar'
        : (item.orderDestination || item.destination) === 'HUMIDOR' ? 'sent_to_humidor'
        : (item.orderDestination || item.destination) === 'KITCHEN' ? 'sent_to_kitchen'
        : 'pending',
    })),
    notes:    notes || '',
    subtotal: items.reduce((s, i) => s + Number(i.price || 0) * Number(i.quantity || 1), 0),
    status:   'submitted',
    createdAt: new Date().toISOString(),
  }

  pairingOrders.push(order)

  res.json({
    ok:      true,
    message: 'Pairing order sent to staff.',
    order,
  })
})

router.get('/orders', (_req, res) => {
  res.json({ ok: true, orders: pairingOrders })
})

export default router
