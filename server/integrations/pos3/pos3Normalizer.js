/**
 * POS 3 Normalizer — Phase 9
 * Converts raw provider-specific data into NOVEE OS normalized models.
 * All provider adapters must return data through these normalizers.
 */

/**
 * Normalized Order
 */
export function normalizeOrder(raw, provider) {
  return {
    provider:           provider,
    providerOrderId:    String(raw.id       || raw.orderId    || raw.order_id    || ''),
    venueId:            raw.venueId         || raw.venue_id   || process.env.VENUE_ID || 'novee-grand-lounge',
    locationId:         raw.locationId      || raw.location_id || null,
    tableNumber:        raw.tableNumber     || raw.table_number || raw.table || null,
    seatNumber:         raw.seatNumber      || raw.seat_number  || null,
    staffId:            raw.staffId         || raw.staff_id     || null,
    staffName:          raw.staffName       || raw.staff_name   || null,
    guestSessionId:     raw.guestSessionId  || raw.guest_session_id || null,
    status:             raw.status          || 'open',
    items:              Array.isArray(raw.items) ? raw.items.map(normalizeOrderItem) : [],
    subtotal:           parseFloat(raw.subtotal || 0),
    tax:                parseFloat(raw.tax      || 0),
    total:              parseFloat(raw.total    || raw.subtotal || 0),
    currency:           raw.currency        || 'USD',
    openedAt:           raw.openedAt        || raw.opened_at  || raw.createdAt || new Date().toISOString(),
    updatedAt:          raw.updatedAt       || raw.updated_at || new Date().toISOString(),
  }
}

function normalizeOrderItem(item) {
  return {
    providerItemId: String(item.id || item.itemId || item.item_id || ''),
    name:     item.name      || item.title      || 'Unknown Item',
    quantity: item.quantity  || item.qty        || 1,
    unitPrice: parseFloat(item.unitPrice || item.price || 0),
    total:    parseFloat(item.total     || (item.price * (item.qty || 1)) || 0),
    category: item.category  || item.cat        || null,
    notes:    item.notes     || item.modifiers   || null,
  }
}

/**
 * Normalized Menu Item
 */
export function normalizeMenuItem(raw, provider) {
  return {
    provider:         provider,
    providerItemId:   String(raw.id    || raw.itemId    || raw.item_id || ''),
    name:             raw.name         || raw.title     || 'Unknown Item',
    category:         raw.category     || raw.cat       || null,
    subcategory:      raw.subcategory  || raw.subcat    || null,
    price:            parseFloat(raw.price || 0),
    sku:              raw.sku          || raw.barcode   || null,
    tags:             Array.isArray(raw.tags) ? raw.tags : [],
    allergens:        Array.isArray(raw.allergens) ? raw.allergens : [],
    imageUrl:         raw.imageUrl     || raw.image_url || null,
    available:        raw.available    ?? raw.active    ?? true,
    inventoryCount:   raw.inventoryCount ?? raw.stock  ?? null,
  }
}

/**
 * Normalized Inventory Item
 */
export function normalizeInventoryItem(raw, provider) {
  const stock = parseInt(raw.currentStock ?? raw.current_stock ?? raw.stock ?? 0, 10)
  const threshold = parseInt(raw.lowStockThreshold ?? raw.low_stock_threshold ?? 5, 10)
  return {
    provider:            provider,
    providerItemId:      String(raw.id || raw.itemId || raw.item_id || ''),
    name:                raw.name       || 'Unknown Item',
    category:            raw.category   || null,
    subcategory:         raw.subcategory || null,
    currentStock:        stock,
    lowStockThreshold:   threshold,
    reorderRecommended:  stock <= threshold,
    locationId:          raw.locationId || raw.location_id || null,
    updatedAt:           raw.updatedAt  || new Date().toISOString(),
  }
}

/**
 * Normalized Table
 */
export function normalizeTable(raw, provider) {
  return {
    provider:        provider,
    tableId:         String(raw.id      || raw.tableId  || raw.table_id    || ''),
    tableNumber:     raw.tableNumber    || raw.table_number || raw.number  || raw.id,
    zone:            raw.zone           || raw.section  || raw.area        || 'Main',
    seats:           parseInt(raw.seats || raw.capacity || 2, 10),
    status:          raw.status         || 'available',
    assignedStaffId: raw.assignedStaffId || raw.assigned_staff_id || null,
    activeOrderId:   raw.activeOrderId   || raw.active_order_id   || null,
  }
}

/**
 * Normalized Staff Member
 */
export function normalizeStaffMember(raw, provider) {
  return {
    provider:      provider,
    staffId:       String(raw.id || raw.staffId || raw.staff_id || ''),
    displayName:   raw.displayName || raw.display_name || raw.name || 'Staff',
    role:          raw.role        || raw.position    || 'staff',
    active:        raw.active      ?? raw.onShift     ?? true,
    assignedZone:  raw.assignedZone || raw.zone       || 'Main',
  }
}
