/**
 * POS360 Order Lifecycle, Tabs, Courses & Routing Execution (Phase B.5)
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js'
import { ORDER_EVENTS } from './pos360OrderEventContracts.js'

// ── Audit helper ──────────────────────────────────────────────────────────────
async function auditLog(venueId, tenantId, action, entityType, entityId, orderId, actor, prev, next, extra = {}) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_order_audit
      (tenant_id, venue_id, location_id, order_id, entity_type, entity_id, action,
       actor_id, actor_role, device_id, previous_value, new_value, contains_secrets,
       exposes_private_data, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,FALSE,FALSE,$13)`,
    [tenantId, venueId, extra.locationId ?? null, orderId ?? null,
     entityType, entityId ?? null, action,
     actor?.actorId ?? null, actor?.actorRole ?? null, extra.deviceId ?? null,
     prev ? JSON.stringify(prev) : null, next ? JSON.stringify(next) : null,
     extra.metadata ? JSON.stringify(extra.metadata) : null]
  )
}

async function statusHistory(table, idCol, id, venueId, tenantId, fromStatus, toStatus, actor, reason) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO ${table} (tenant_id, venue_id, ${idCol}, from_status, to_status,
       reason, actor_id, actor_role) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [tenantId, venueId, id, fromStatus ?? null, toStatus, reason ?? null,
     actor?.actorId ?? null, actor?.actorRole ?? null]
  )
}

// ── Orders ────────────────────────────────────────────────────────────────────
export async function createOrder(venueId, tenantId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, order: { id: 'preview-order', venueId, status: 'draft', ...body } }
  }
  const { rows } = await query(
    `INSERT INTO pos360_orders
      (tenant_id, venue_id, location_id, order_type, status, table_id, guest_id,
       staff_user_id, device_id, notes, rush_flag, vip_flag, allergy_flags,
       smokecraft_session_id, loyalty_profile_id, created_by, metadata, audit_context)
     VALUES ($1,$2,$3,$4,'draft',$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [tenantId, venueId, body.locationId ?? null, body.orderType ?? 'dine_in',
     body.tableId ?? null, body.guestId ?? null, actor.actorId ?? null,
     body.deviceId ?? null, body.notes ?? null,
     body.rushFlag ?? false, body.vipFlag ?? false,
     body.allergyFlags ? JSON.stringify(body.allergyFlags) : null,
     body.smokecraftSessionId ?? null, body.loyaltyProfileId ?? null,
     actor.actorId ?? null,
     body.metadata ? JSON.stringify(body.metadata) : null,
     body.auditContext ? JSON.stringify(body.auditContext) : null]
  )
  const order = rows[0]
  await auditLog(venueId, tenantId, ORDER_EVENTS.ORDER_CREATED, 'order', order.id, order.id, actor, null, order)
  return { ok: true, order }
}

export async function getOrder(orderId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const { rows } = await query('SELECT * FROM pos360_orders WHERE id=$1', [orderId])
  if (!rows.length) return { ok: false, error: 'order_not_found' }
  const items = await query('SELECT * FROM pos360_order_items WHERE order_id=$1 AND is_active=TRUE ORDER BY sort_order', [orderId])
  return { ok: true, order: rows[0], items: items.rows }
}

export async function listOrders(venueId, filters = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, orders: [], message: 'No active orders found for this venue.' }
  }
  const conditions = ['venue_id=$1', 'is_active=TRUE']
  const params = [venueId]
  let p = 2
  if (filters.status) { conditions.push(`status=$${p++}`); params.push(filters.status) }
  if (filters.tableId) { conditions.push(`table_id=$${p++}`); params.push(filters.tableId) }
  if (filters.guestId) { conditions.push(`guest_id=$${p++}`); params.push(filters.guestId) }
  if (filters.tabId)   { conditions.push(`tab_id=$${p++}`); params.push(filters.tabId) }
  if (filters.orderType){ conditions.push(`order_type=$${p++}`); params.push(filters.orderType) }
  const { rows } = await query(
    `SELECT * FROM pos360_orders WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 100`,
    params
  )
  return { ok: true, orders: rows }
}

export async function updateOrder(orderId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const prev = await getOrder(orderId)
  const { rows } = await query(
    `UPDATE pos360_orders SET
       notes=$2, rush_flag=COALESCE($3, rush_flag), vip_flag=COALESCE($4, vip_flag),
       allergy_flags=COALESCE($5, allergy_flags), updated_by=$6, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [orderId, body.notes ?? null, body.rushFlag ?? null, body.vipFlag ?? null,
     body.allergyFlags ? JSON.stringify(body.allergyFlags) : null, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'order_not_found' }
  await auditLog(rows[0].venue_id, rows[0].tenant_id, ORDER_EVENTS.ORDER_UPDATED, 'order', orderId, orderId, actor, prev.order, rows[0])
  return { ok: true, order: rows[0] }
}

export async function changeOrderStatus(orderId, newStatus, actor = {}, reason = null) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const prev = await query('SELECT * FROM pos360_orders WHERE id=$1', [orderId])
  if (!prev.rows.length) return { ok: false, error: 'order_not_found' }
  const old = prev.rows[0]
  const { rows } = await query(
    `UPDATE pos360_orders SET status=$2, updated_by=$3, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [orderId, newStatus, actor.actorId ?? null]
  )
  await statusHistory('pos360_order_status_history', 'order_id', orderId,
    old.venue_id, old.tenant_id, old.status, newStatus, actor, reason)
  await auditLog(old.venue_id, old.tenant_id, ORDER_EVENTS.ORDER_STATUS_CHANGED, 'order', orderId, orderId, actor, { status: old.status }, { status: newStatus })
  return { ok: true, order: rows[0] }
}

export async function cancelOrder(orderId, body = {}, actor = {}) {
  return changeOrderStatus(orderId, 'canceled', actor, body.reason)
}

export async function voidOrder(orderId, body = {}, actor = {}) {
  return changeOrderStatus(orderId, 'voided', actor, body.reason)
}

export async function closeOrderHook(orderId, actor = {}) {
  return changeOrderStatus(orderId, 'closed', actor)
}

export async function reopenOrder(orderId, actor = {}) {
  return changeOrderStatus(orderId, 'open', actor, 'reopened')
}

// ── Order items ───────────────────────────────────────────────────────────────
export async function addItemToOrder(orderId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const { rows } = await query(
    `INSERT INTO pos360_order_items
      (tenant_id, venue_id, location_id, order_id, course_id, menu_item_id,
       item_name, item_sku, category_id, station_type, quantity, unit_price_cents,
       total_cents, status, notes, allergy_flags, smokecraft_flags, rush_flag,
       staff_user_id, device_id, sort_order, created_by)
     SELECT tenant_id, venue_id, location_id, $1, $2, $3, $4, $5, $6, $7,
            $8, $9, ($8 * $9), 'added', $10, $11, $12, $13, $14, $15, $16, $17
     FROM pos360_orders WHERE id=$1 RETURNING *`,
    [orderId, body.courseId ?? null, body.menuItemId ?? null,
     body.itemName, body.itemSku ?? null, body.categoryId ?? null,
     body.stationType ?? null, body.quantity ?? 1, body.unitPriceCents ?? 0,
     body.notes ?? null,
     body.allergyFlags ? JSON.stringify(body.allergyFlags) : null,
     body.smokecraftFlags ? JSON.stringify(body.smokecraftFlags) : null,
     body.rushFlag ?? false, actor.actorId ?? null, body.deviceId ?? null,
     body.sortOrder ?? 0, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'order_not_found' }
  const item = rows[0]
  // Recalculate order total
  await query(
    `UPDATE pos360_orders SET
       item_count = (SELECT COUNT(*) FROM pos360_order_items WHERE order_id=$1 AND is_active=TRUE),
       subtotal_cents = (SELECT COALESCE(SUM(total_cents),0) FROM pos360_order_items WHERE order_id=$1 AND is_active=TRUE),
       updated_at = NOW() WHERE id=$1`,
    [orderId]
  )
  await auditLog(item.venue_id, item.tenant_id, ORDER_EVENTS.ITEM_ADDED, 'order_item', item.id, orderId, actor, null, item)
  return { ok: true, item }
}

export async function removeItemFromOrder(orderId, itemId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_items SET is_active=FALSE, updated_at=NOW(), deleted_at=NOW(), updated_by=$2
     WHERE id=$1 AND order_id=$3 RETURNING *`,
    [itemId, actor.actorId ?? null, orderId]
  )
  if (!rows.length) return { ok: false, error: 'item_not_found' }
  const item = rows[0]
  await query(
    `UPDATE pos360_orders SET
       item_count = (SELECT COUNT(*) FROM pos360_order_items WHERE order_id=$1 AND is_active=TRUE),
       subtotal_cents = (SELECT COALESCE(SUM(total_cents),0) FROM pos360_order_items WHERE order_id=$1 AND is_active=TRUE),
       updated_at = NOW() WHERE id=$1`,
    [orderId]
  )
  await auditLog(item.venue_id, item.tenant_id, ORDER_EVENTS.ITEM_REMOVED, 'order_item', itemId, orderId, actor, item, null)
  return { ok: true, item }
}

export async function updateItemQuantity(itemId, quantity, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_items
     SET quantity=$2, total_cents=(unit_price_cents * $2), updated_at=NOW(), updated_by=$3
     WHERE id=$1 RETURNING *`,
    [itemId, quantity, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'item_not_found' }
  return { ok: true, item: rows[0] }
}

export async function updateItemNotes(itemId, notes, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_items SET notes=$2, updated_at=NOW(), updated_by=$3 WHERE id=$1 RETURNING *`,
    [itemId, notes, actor.actorId ?? null]
  )
  return { ok: true, item: rows[0] ?? null }
}

export async function addModifierToItem(orderId, itemId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const order = await query('SELECT tenant_id, venue_id FROM pos360_orders WHERE id=$1', [orderId])
  if (!order.rows.length) return { ok: false, error: 'order_not_found' }
  const { tenant_id, venue_id } = order.rows[0]
  const { rows } = await query(
    `INSERT INTO pos360_order_item_modifiers
      (tenant_id, venue_id, order_id, order_item_id, modifier_id, modifier_name,
       modifier_group, price_delta_cents)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [tenant_id, venue_id, orderId, itemId, body.modifierId ?? null,
     body.modifierName, body.modifierGroup ?? null, body.priceDeltaCents ?? 0]
  )
  return { ok: true, modifier: rows[0] }
}

export async function removeModifierFromItem(modifierId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  await query(`UPDATE pos360_order_item_modifiers SET is_active=FALSE WHERE id=$1`, [modifierId])
  return { ok: true }
}

export async function addAddonToItem(orderId, itemId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const order = await query('SELECT tenant_id, venue_id FROM pos360_orders WHERE id=$1', [orderId])
  if (!order.rows.length) return { ok: false, error: 'order_not_found' }
  const { tenant_id, venue_id } = order.rows[0]
  const { rows } = await query(
    `INSERT INTO pos360_order_item_addons
      (tenant_id, venue_id, order_id, order_item_id, addon_id, addon_name, price_cents)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [tenant_id, venue_id, orderId, itemId, body.addonId ?? null,
     body.addonName, body.priceCents ?? 0]
  )
  return { ok: true, addon: rows[0] }
}

export async function removeAddonFromItem(addonId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  await query(`UPDATE pos360_order_item_addons SET is_active=FALSE WHERE id=$1`, [addonId])
  return { ok: true }
}

export async function voidItem(itemId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_items SET status='voided', updated_at=NOW(), updated_by=$2 WHERE id=$1 RETURNING *`,
    [itemId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'item_not_found' }
  const item = rows[0]
  await statusHistory('pos360_order_item_status_history', 'order_item_id', itemId, item.venue_id, item.tenant_id, item.status, 'voided', actor, body.reason)
  await auditLog(item.venue_id, item.tenant_id, ORDER_EVENTS.ITEM_VOIDED, 'order_item', itemId, item.order_id, actor, { status: item.status }, { status: 'voided' })
  return { ok: true, item }
}

export async function cancelItem(itemId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_items SET status='canceled', updated_at=NOW(), updated_by=$2 WHERE id=$1 RETURNING *`,
    [itemId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'item_not_found' }
  return { ok: true, item: rows[0] }
}

export async function refireItem(itemId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'orders' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_items SET status='refired', routing_resolved=FALSE, updated_at=NOW(), updated_by=$2 WHERE id=$1 RETURNING *`,
    [itemId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'item_not_found' }
  const item = rows[0]
  await auditLog(item.venue_id, item.tenant_id, ORDER_EVENTS.ITEM_REFIRED, 'order_item', itemId, item.order_id, actor, null, { status: 'refired' })
  return { ok: true, item }
}

// ── Courses ───────────────────────────────────────────────────────────────────
export async function createCourse(orderId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'courses' }
  }
  const order = await query('SELECT tenant_id, venue_id, location_id FROM pos360_orders WHERE id=$1', [orderId])
  if (!order.rows.length) return { ok: false, error: 'order_not_found' }
  const { tenant_id, venue_id, location_id } = order.rows[0]
  const { rows } = await query(
    `INSERT INTO pos360_order_courses
      (tenant_id, venue_id, location_id, order_id, course_name, course_label,
       sequence_number, status, station_type, routing_station_id, notes, fire_time,
       staff_user_id, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'draft',$8,$9,$10,$11,$12,$13) RETURNING *`,
    [tenant_id, venue_id, location_id, orderId,
     body.courseName ?? 'Course', body.courseLabel ?? null,
     body.sequenceNumber ?? 1, body.stationType ?? null,
     body.routingStationId ?? null, body.notes ?? null,
     body.fireTime ?? null, actor.actorId ?? null, actor.actorId ?? null]
  )
  await auditLog(venue_id, tenant_id, ORDER_EVENTS.COURSE_CREATED, 'course', rows[0].id, orderId, actor, null, rows[0])
  return { ok: true, course: rows[0] }
}

export async function updateCourse(courseId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'courses' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_courses
     SET course_name=COALESCE($2, course_name), course_label=COALESCE($3, course_label),
         sequence_number=COALESCE($4, sequence_number), notes=COALESCE($5, notes),
         station_type=COALESCE($6, station_type), fire_time=COALESCE($7, fire_time),
         updated_by=$8, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [courseId, body.courseName ?? null, body.courseLabel ?? null,
     body.sequenceNumber ?? null, body.notes ?? null, body.stationType ?? null,
     body.fireTime ?? null, actor.actorId ?? null]
  )
  return { ok: true, course: rows[0] ?? null }
}

export async function assignItemToCourse(itemId, courseId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'courses' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_items SET course_id=$2, updated_at=NOW() WHERE id=$1 RETURNING *`,
    [itemId, courseId]
  )
  return { ok: true, item: rows[0] ?? null }
}

export async function holdCourse(courseId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'courses' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_courses SET status='held', held_at=NOW(), updated_at=NOW(), updated_by=$2
     WHERE id=$1 RETURNING *`,
    [courseId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'course_not_found' }
  const c = rows[0]
  await auditLog(c.venue_id, c.tenant_id, ORDER_EVENTS.COURSE_HELD, 'course', courseId, c.order_id, actor, null, { status: 'held' })
  return { ok: true, course: c }
}

export async function fireCourse(courseId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'courses' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_courses SET status='fired', fired_at=NOW(), updated_at=NOW(), updated_by=$2
     WHERE id=$1 RETURNING *`,
    [courseId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'course_not_found' }
  const c = rows[0]
  // Fire all items in course
  await query(
    `UPDATE pos360_order_items SET status='fired', fired_at=NOW(), updated_at=NOW()
     WHERE course_id=$1 AND status IN ('draft','added','held')`,
    [courseId]
  )
  await auditLog(c.venue_id, c.tenant_id, ORDER_EVENTS.COURSE_FIRED, 'course', courseId, c.order_id, actor, null, { status: 'fired' })
  return { ok: true, course: c }
}

export async function fireAllCourses(orderId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'courses' }
  }
  const { rows: courses } = await query(
    `UPDATE pos360_order_courses SET status='fired', fired_at=NOW(), updated_at=NOW()
     WHERE order_id=$1 AND status IN ('draft','held') RETURNING *`,
    [orderId]
  )
  await query(
    `UPDATE pos360_order_items SET status='fired', fired_at=NOW(), updated_at=NOW()
     WHERE order_id=$1 AND status IN ('draft','added','held')`,
    [orderId]
  )
  return { ok: true, courses }
}

export async function sequenceCourses(orderId, courseSequence = [], actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'courses' }
  }
  for (const { courseId, sequenceNumber } of courseSequence) {
    await query(
      `UPDATE pos360_order_courses SET sequence_number=$2, updated_at=NOW() WHERE id=$1 AND order_id=$3`,
      [courseId, sequenceNumber, orderId]
    )
  }
  const { rows } = await query('SELECT * FROM pos360_order_courses WHERE order_id=$1 ORDER BY sequence_number', [orderId])
  return { ok: true, courses: rows }
}

export async function getCourseStatus(courseId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'courses' }
  }
  const { rows } = await query('SELECT * FROM pos360_order_courses WHERE id=$1', [courseId])
  if (!rows.length) return { ok: false, error: 'course_not_found' }
  const items = await query('SELECT * FROM pos360_order_items WHERE course_id=$1 AND is_active=TRUE', [courseId])
  return { ok: true, course: rows[0], items: items.rows }
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
export async function createTab(venueId, tenantId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, tab: { id: 'preview-tab', venueId, status: 'open', ...body } }
  }
  const { rows } = await query(
    `INSERT INTO pos360_order_tabs
      (tenant_id, venue_id, location_id, tab_type, tab_name, status,
       table_id, guest_id, staff_user_id, device_id, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,'open',$6,$7,$8,$9,$10,$11) RETURNING *`,
    [tenantId, venueId, body.locationId ?? null, body.tabType ?? 'table',
     body.tabName ?? null, body.tableId ?? null, body.guestId ?? null,
     actor.actorId ?? null, body.deviceId ?? null, body.notes ?? null,
     actor.actorId ?? null]
  )
  const tab = rows[0]
  await auditLog(venueId, tenantId, ORDER_EVENTS.TAB_CREATED, 'tab', tab.id, null, actor, null, tab)
  return { ok: true, tab }
}

export async function getTab(tabId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'tabs' }
  }
  const { rows } = await query('SELECT * FROM pos360_order_tabs WHERE id=$1', [tabId])
  if (!rows.length) return { ok: false, error: 'tab_not_found' }
  const links = await query('SELECT * FROM pos360_order_tab_links WHERE tab_id=$1 AND is_active=TRUE', [tabId])
  return { ok: true, tab: rows[0], orderLinks: links.rows }
}

export async function listTabs(venueId, filters = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, tabs: [], message: 'No active tabs.' }
  }
  const conditions = ['venue_id=$1', 'is_active=TRUE']
  const params = [venueId]
  let p = 2
  if (filters.status)  { conditions.push(`status=$${p++}`); params.push(filters.status) }
  if (filters.guestId) { conditions.push(`guest_id=$${p++}`); params.push(filters.guestId) }
  if (filters.tableId) { conditions.push(`table_id=$${p++}`); params.push(filters.tableId) }
  const { rows } = await query(
    `SELECT * FROM pos360_order_tabs WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC LIMIT 100`,
    params
  )
  return { ok: true, tabs: rows }
}

export async function linkOrderToTab(tabId, orderId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'tabs' }
  }
  const tab = await query('SELECT tenant_id, venue_id FROM pos360_order_tabs WHERE id=$1', [tabId])
  if (!tab.rows.length) return { ok: false, error: 'tab_not_found' }
  const { tenant_id, venue_id } = tab.rows[0]
  await query(
    `INSERT INTO pos360_order_tab_links (tenant_id, venue_id, tab_id, order_id) VALUES ($1,$2,$3,$4)
     ON CONFLICT DO NOTHING`,
    [tenant_id, venue_id, tabId, orderId]
  )
  await query(`UPDATE pos360_orders SET tab_id=$2, updated_at=NOW() WHERE id=$1`, [orderId, tabId])
  await query(
    `UPDATE pos360_order_tabs SET order_count = (SELECT COUNT(*) FROM pos360_order_tab_links WHERE tab_id=$1 AND is_active=TRUE), updated_at=NOW() WHERE id=$1`,
    [tabId]
  )
  return { ok: true }
}

export async function transferTab(tabId, targetTabId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'tabs' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_tabs SET transferred_to_tab=$2, status='transferred', updated_at=NOW(), updated_by=$3
     WHERE id=$1 RETURNING *`,
    [tabId, targetTabId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'tab_not_found' }
  // Move all orders to target tab
  await query(`UPDATE pos360_order_tab_links SET tab_id=$2, updated_at=NOW() WHERE tab_id=$1 AND is_active=TRUE`, [tabId, targetTabId])
  await query(`UPDATE pos360_orders SET tab_id=$2, updated_at=NOW() WHERE tab_id=$1`, [tabId, targetTabId])
  await auditLog(rows[0].venue_id, rows[0].tenant_id, ORDER_EVENTS.TAB_TRANSFERRED, 'tab', tabId, null, actor, { tabId }, { targetTabId })
  return { ok: true, tab: rows[0] }
}

export async function mergeTabs(sourceTabId, targetTabId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'tabs' }
  }
  await query(`UPDATE pos360_order_tab_links SET tab_id=$2 WHERE tab_id=$1 AND is_active=TRUE`, [sourceTabId, targetTabId])
  await query(`UPDATE pos360_orders SET tab_id=$2, updated_at=NOW() WHERE tab_id=$1`, [sourceTabId, targetTabId])
  const { rows } = await query(
    `UPDATE pos360_order_tabs SET merged_into_tab=$2, status='merged', is_active=FALSE, updated_at=NOW()
     WHERE id=$1 RETURNING *`,
    [sourceTabId, targetTabId]
  )
  if (!rows.length) return { ok: false, error: 'tab_not_found' }
  await auditLog(rows[0].venue_id, rows[0].tenant_id, ORDER_EVENTS.TAB_MERGED, 'tab', sourceTabId, null, actor, { sourceTabId }, { targetTabId })
  return { ok: true }
}

export async function splitTab(tabId, orderIds = [], actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'tabs' }
  }
  const src = await query('SELECT tenant_id, venue_id FROM pos360_order_tabs WHERE id=$1', [tabId])
  if (!src.rows.length) return { ok: false, error: 'tab_not_found' }
  const { tenant_id, venue_id } = src.rows[0]
  const { rows: newTab } = await query(
    `INSERT INTO pos360_order_tabs (tenant_id, venue_id, tab_type, tab_name, status, created_by)
     VALUES ($1,$2,'table','Split Tab','open',$3) RETURNING *`,
    [tenant_id, venue_id, actor.actorId ?? null]
  )
  for (const oid of orderIds) {
    await query(`UPDATE pos360_order_tab_links SET tab_id=$2 WHERE order_id=$1 AND tab_id=$3 AND is_active=TRUE`, [oid, newTab[0].id, tabId])
    await query(`UPDATE pos360_orders SET tab_id=$2, updated_at=NOW() WHERE id=$1`, [oid, newTab[0].id])
  }
  await auditLog(venue_id, tenant_id, ORDER_EVENTS.TAB_SPLIT, 'tab', tabId, null, actor, { tabId }, { newTabId: newTab[0].id })
  return { ok: true, newTab: newTab[0] }
}

export async function markTabPaymentPending(tabId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'tabs' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_tabs SET status='payment_pending', payment_pending_at=NOW(), updated_at=NOW(), updated_by=$2
     WHERE id=$1 RETURNING *`,
    [tabId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'tab_not_found' }
  await auditLog(rows[0].venue_id, rows[0].tenant_id, ORDER_EVENTS.TAB_PAYMENT_PENDING, 'tab', tabId, null, actor, null, { status: 'payment_pending' })
  return { ok: true, tab: rows[0] }
}

export async function closeTabHook(tabId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'tabs' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_tabs SET status='closed', closed_at=NOW(), updated_at=NOW(), updated_by=$2
     WHERE id=$1 RETURNING *`,
    [tabId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'tab_not_found' }
  return { ok: true, tab: rows[0] }
}

// ── Table links ───────────────────────────────────────────────────────────────
export async function linkOrderToTable(orderId, tableId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'tables' }
  }
  const order = await query('SELECT tenant_id, venue_id FROM pos360_orders WHERE id=$1', [orderId])
  if (!order.rows.length) return { ok: false, error: 'order_not_found' }
  const { tenant_id, venue_id } = order.rows[0]
  await query(`UPDATE pos360_order_table_links SET is_active=FALSE, unlinked_at=NOW() WHERE order_id=$1`, [orderId])
  await query(
    `INSERT INTO pos360_order_table_links (tenant_id, venue_id, order_id, table_id, linked_by)
     VALUES ($1,$2,$3,$4,$5)`,
    [tenant_id, venue_id, orderId, tableId, actor.actorId ?? null]
  )
  await query(`UPDATE pos360_orders SET table_id=$2, updated_at=NOW() WHERE id=$1`, [orderId, tableId])
  await auditLog(venue_id, tenant_id, ORDER_EVENTS.TABLE_LINKED, 'order', orderId, orderId, actor, null, { tableId })
  return { ok: true }
}

export async function moveOrderToTable(orderId, newTableId, actor = {}) {
  return linkOrderToTable(orderId, newTableId, actor)
}

export async function getTableOrders(venueId, tableId, filters = {}) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, orders: [], message: 'No active orders found for this venue.' }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_orders WHERE venue_id=$1 AND table_id=$2 AND is_active=TRUE AND status NOT IN ('closed','canceled','voided') ORDER BY created_at DESC`,
    [venueId, tableId]
  )
  return { ok: true, orders: rows }
}

// ── Guest links ───────────────────────────────────────────────────────────────
export async function linkGuestToOrder(orderId, guestId, tabId = null, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'guests' }
  }
  const order = await query('SELECT tenant_id, venue_id FROM pos360_orders WHERE id=$1', [orderId])
  if (!order.rows.length) return { ok: false, error: 'order_not_found' }
  const { tenant_id, venue_id } = order.rows[0]
  await query(
    `INSERT INTO pos360_order_guest_links (tenant_id, venue_id, order_id, guest_id, tab_id, linked_by)
     VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING`,
    [tenant_id, venue_id, orderId, guestId, tabId, actor.actorId ?? null]
  )
  await query(`UPDATE pos360_orders SET guest_id=$2, updated_at=NOW() WHERE id=$1`, [orderId, guestId])
  await auditLog(venue_id, tenant_id, ORDER_EVENTS.GUEST_LINKED, 'order', orderId, orderId, actor, null, { guestId })
  return { ok: true }
}

export async function getGuestOrders(venueId, guestId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, orders: [], message: 'No active orders found for this venue.' }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_orders WHERE venue_id=$1 AND guest_id=$2 AND is_active=TRUE ORDER BY created_at DESC`,
    [venueId, guestId]
  )
  return { ok: true, orders: rows }
}

export async function getGuestOpenTabs(venueId, guestId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, tabs: [], message: 'No active tabs.' }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_order_tabs WHERE venue_id=$1 AND guest_id=$2 AND status IN ('open','held','payment_pending')`,
    [venueId, guestId]
  )
  return { ok: true, tabs: rows }
}

// ── SmokeCraft links ──────────────────────────────────────────────────────────
export async function linkSmokecraftToOrder(orderId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'smokecraft' }
  }
  const order = await query('SELECT tenant_id, venue_id FROM pos360_orders WHERE id=$1', [orderId])
  if (!order.rows.length) return { ok: false, error: 'order_not_found' }
  const { tenant_id, venue_id } = order.rows[0]
  const { rows } = await query(
    `INSERT INTO pos360_order_smokecraft_links
      (tenant_id, venue_id, order_id, smokecraft_session_id, guest_id, pairing_note, recommendation_item, linked_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [tenant_id, venue_id, orderId, body.smokecraftSessionId ?? null, body.guestId ?? null,
     body.pairingNote ?? null,
     body.recommendationItem ? JSON.stringify(body.recommendationItem) : null,
     actor.actorId ?? null]
  )
  await auditLog(venue_id, tenant_id, ORDER_EVENTS.SMOKECRAFT_LINKED, 'order', orderId, orderId, actor, null, { smokecraftSessionId: body.smokecraftSessionId })
  return { ok: true, link: rows[0] }
}

export async function getOrderSmokecraftContext(orderId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, message: 'SmokeCraft order context not connected.', links: [] }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_order_smokecraft_links WHERE order_id=$1 AND is_active=TRUE ORDER BY linked_at DESC`,
    [orderId]
  )
  return { ok: true, links: rows }
}

export async function addSmokecraftRecommendationHook(orderId, recommendation = {}, actor = {}) {
  return { ok: false, localPreview: true, message: 'SmokeCraft recommendation-to-order hook not yet connected.' }
}

// ── Loyalty links ─────────────────────────────────────────────────────────────
export async function linkLoyaltyToOrder(orderId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'loyalty' }
  }
  const order = await query('SELECT tenant_id, venue_id FROM pos360_orders WHERE id=$1', [orderId])
  if (!order.rows.length) return { ok: false, error: 'order_not_found' }
  const { tenant_id, venue_id } = order.rows[0]
  const { rows } = await query(
    `INSERT INTO pos360_order_loyalty_links
      (tenant_id, venue_id, order_id, loyalty_profile_id, guest_id, linked_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [tenant_id, venue_id, orderId, body.loyaltyProfileId, body.guestId ?? null, actor.actorId ?? null]
  )
  await auditLog(venue_id, tenant_id, ORDER_EVENTS.LOYALTY_LINKED, 'order', orderId, orderId, actor, null, { loyaltyProfileId: body.loyaltyProfileId })
  return { ok: true, link: rows[0] }
}

export async function getOrderLoyaltyContext(orderId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, message: 'Loyalty order context not connected.', links: [] }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_order_loyalty_links WHERE order_id=$1 AND is_active=TRUE ORDER BY linked_at DESC`,
    [orderId]
  )
  return { ok: true, links: rows }
}

export async function applyLoyaltyPricingHook(orderId, body = {}, actor = {}) {
  return { ok: false, localPreview: true, message: 'Loyalty pricing hook not yet connected.' }
}

// ── Hold / Fire ───────────────────────────────────────────────────────────────
async function recordHoldFireEvent(venueId, tenantId, orderId, itemId, courseId, eventType, actor, extra = {}) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_order_hold_fire_events
      (tenant_id, venue_id, order_id, order_item_id, course_id, event_type, actor_id, actor_role, device_id, fire_time, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [tenantId, venueId, orderId, itemId ?? null, courseId ?? null, eventType,
     actor?.actorId ?? null, actor?.actorRole ?? null, extra.deviceId ?? null,
     extra.fireTime ?? null, extra.notes ?? null]
  )
}

export async function holdItem(itemId, body = {}, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'hold_fire' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_items SET status='held', held_at=NOW(), updated_at=NOW(), updated_by=$2 WHERE id=$1 RETURNING *`,
    [itemId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'item_not_found' }
  const item = rows[0]
  await recordHoldFireEvent(item.venue_id, item.tenant_id, item.order_id, itemId, null, 'hold_item', actor, body)
  await auditLog(item.venue_id, item.tenant_id, ORDER_EVENTS.HOLD_APPLIED, 'order_item', itemId, item.order_id, actor, null, { status: 'held' })
  return { ok: true, item }
}

export async function fireItem(itemId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'hold_fire' }
  }
  const { rows } = await query(
    `UPDATE pos360_order_items SET status='fired', fired_at=NOW(), updated_at=NOW(), updated_by=$2 WHERE id=$1 RETURNING *`,
    [itemId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'item_not_found' }
  const item = rows[0]
  await recordHoldFireEvent(item.venue_id, item.tenant_id, item.order_id, itemId, null, 'fire_item', actor)
  await auditLog(item.venue_id, item.tenant_id, ORDER_EVENTS.FIRE_EXECUTED, 'order_item', itemId, item.order_id, actor, null, { status: 'fired' })
  return { ok: true, item }
}

export async function holdOrder(orderId, body = {}, actor = {}) {
  const result = await changeOrderStatus(orderId, 'held', actor, 'order held')
  if (result.ok) {
    const o = result.order
    await recordHoldFireEvent(o.venue_id, o.tenant_id, orderId, null, null, 'hold_order', actor, body)
  }
  return result
}

export async function fireOrder(orderId, actor = {}) {
  const result = await changeOrderStatus(orderId, 'fired', actor, 'order fired')
  if (result.ok) {
    const o = result.order
    await recordHoldFireEvent(o.venue_id, o.tenant_id, orderId, null, null, 'fire_order', actor)
    // Fire all held/draft items
    await query(
      `UPDATE pos360_order_items SET status='fired', fired_at=NOW(), updated_at=NOW()
       WHERE order_id=$1 AND status IN ('draft','added','held')`,
      [orderId]
    )
  }
  return result
}

export async function scheduleFireTime(orderId, fireAt, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'hold_fire' }
  }
  const { rows } = await query(
    `UPDATE pos360_orders SET fire_time=$2, status='held', updated_at=NOW(), updated_by=$3 WHERE id=$1 RETURNING *`,
    [orderId, fireAt, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'order_not_found' }
  const o = rows[0]
  await recordHoldFireEvent(o.venue_id, o.tenant_id, orderId, null, null, 'schedule_fire', actor, { fireTime: fireAt })
  return { ok: true, order: o }
}

export async function cancelHold(orderId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, error: 'database_not_configured', area: 'hold_fire' }
  }
  const { rows } = await query(
    `UPDATE pos360_orders SET fire_time=NULL, status='open', held_at=NULL, updated_at=NOW(), updated_by=$2 WHERE id=$1 RETURNING *`,
    [orderId, actor.actorId ?? null]
  )
  if (!rows.length) return { ok: false, error: 'order_not_found' }
  const o = rows[0]
  await recordHoldFireEvent(o.venue_id, o.tenant_id, orderId, null, null, 'cancel_hold', actor)
  return { ok: true, order: o }
}

export async function getHoldFireHistory(orderId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, events: [] }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_order_hold_fire_events WHERE order_id=$1 ORDER BY created_at DESC`,
    [orderId]
  )
  return { ok: true, events: rows }
}

// ── Routing execution ─────────────────────────────────────────────────────────
export async function resolveOrderRouting(orderId) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, message: 'Routing could not be resolved for this item.', area: 'routing' }
  }
  const { rows: items } = await query(
    `SELECT oi.*, mir.station_type as resolved_station_type, mir.station_id as resolved_station_id
     FROM pos360_order_items oi
     LEFT JOIN pos360_menu_item_routing mir ON mir.menu_item_id = oi.menu_item_id AND mir.is_active = TRUE
     WHERE oi.order_id = $1 AND oi.is_active = TRUE AND oi.status IN ('draft','added','fired','refired')`,
    [orderId]
  )
  return { ok: true, items, unresolved: items.filter(i => !i.resolved_station_type) }
}

export async function routeOrderToProduction(orderId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, message: 'Routing could not be resolved for this item.', area: 'routing' }
  }
  const routing = await resolveOrderRouting(orderId)
  if (!routing.ok) return routing

  const order = await query('SELECT * FROM pos360_orders WHERE id=$1', [orderId])
  if (!order.rows.length) return { ok: false, error: 'order_not_found' }
  const o = order.rows[0]

  // Group items by station
  const byStation = {}
  for (const item of routing.items) {
    const station = item.resolved_station_type ?? item.station_type ?? 'kitchen'
    if (!byStation[station]) byStation[station] = []
    byStation[station].push(item)
  }

  const results = []
  for (const [stationType, stationItems] of Object.entries(byStation)) {
    // Create production ticket via pos360_production_tickets
    let ticketId = null
    try {
      const ticket = await query(
        `INSERT INTO pos360_production_tickets
          (tenant_id, venue_id, location_id, order_id, station_id, ticket_number, status,
           table_number, server_name, rush_flag, vip_flags, allergy_flags, smokecraft_flags, eat_context,
           created_by)
         VALUES ($1,$2,$3,$4,
           (SELECT id FROM pos360_production_stations WHERE venue_id=$2 AND station_type=$5 AND is_active=TRUE LIMIT 1),
           nextval('pos360_production_tickets_ticket_number_seq'), 'queued',
           $6,$7,$8,$9,$10,$11,$12,$13)
         RETURNING id`,
        [o.tenant_id, o.venue_id, o.location_id, orderId, stationType,
         o.table_id ? String(o.table_id).slice(-4) : null, actor.actorId ?? null,
         o.rush_flag, JSON.stringify(o.vip_flag ? { vip: true } : {}),
         o.allergy_flags ? JSON.stringify(o.allergy_flags) : null,
         o.smokecraft_session_id ? JSON.stringify({ session: o.smokecraft_session_id }) : null,
         null, actor.actorId ?? null]
      )
      ticketId = ticket.rows[0]?.id ?? null
    } catch (err) {
      ticketId = null
    }

    for (const item of stationItems) {
      // Create production ticket item
      let productionItemId = null
      if (ticketId) {
        try {
          const pItem = await query(
            `INSERT INTO pos360_production_ticket_items
              (tenant_id, venue_id, ticket_id, menu_item_id, item_name, quantity,
               station_type, notes, allergy_flags, smokecraft_flags, status, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'queued',$11) RETURNING id`,
            [o.tenant_id, o.venue_id, ticketId, item.menu_item_id ?? null,
             item.item_name, item.quantity, stationType, item.notes ?? null,
             item.allergy_flags ? JSON.stringify(item.allergy_flags) : null,
             item.smokecraft_flags ? JSON.stringify(item.smokecraft_flags) : null,
             actor.actorId ?? null]
          )
          productionItemId = pItem.rows[0]?.id ?? null
        } catch { productionItemId = null }
      }

      // Update order item with routing info
      await query(
        `UPDATE pos360_order_items
         SET status='routed', routed_at=NOW(), routing_resolved=TRUE,
             production_ticket_id=$2, production_item_id=$3,
             routing_station_id=(SELECT id FROM pos360_production_stations WHERE venue_id=$4 AND station_type=$5 AND is_active=TRUE LIMIT 1),
             updated_at=NOW()
         WHERE id=$1`,
        [item.id, ticketId, productionItemId, o.venue_id, stationType]
      )

      // Record routing event
      await query(
        `INSERT INTO pos360_order_routing_events
          (tenant_id, venue_id, order_id, order_item_id, station_type,
           production_ticket_id, production_item_id, routing_status, resolved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'routed',NOW())`,
        [o.tenant_id, o.venue_id, orderId, item.id, stationType, ticketId, productionItemId]
      )

      results.push({ itemId: item.id, stationType, ticketId, productionItemId, routed: true })
      await auditLog(o.venue_id, o.tenant_id, ORDER_EVENTS.ITEM_ROUTED_TO_STATION, 'order_item', item.id, orderId, actor,
        null, { stationType, ticketId })
    }

    if (ticketId) {
      await auditLog(o.venue_id, o.tenant_id, ORDER_EVENTS.PRODUCTION_TICKET_CREATED, 'production_ticket', ticketId, orderId, actor,
        null, { ticketId, stationType })
    }
  }

  await changeOrderStatus(orderId, 'in_production', actor, 'routed to production')
  await auditLog(o.venue_id, o.tenant_id, ORDER_EVENTS.ROUTED_TO_PRODUCTION, 'order', orderId, orderId, actor, null, { routingResults: results })

  return { ok: true, routed: results, unresolved: routing.unresolved }
}

export async function routeItemToProduction(itemId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, message: 'Routing could not be resolved for this item.', area: 'routing' }
  }
  const { rows } = await query('SELECT * FROM pos360_order_items WHERE id=$1', [itemId])
  if (!rows.length) return { ok: false, error: 'item_not_found' }
  // Delegate to order routing for a single item
  return routeOrderToProduction(rows[0].order_id, actor)
}

export async function createProductionTicketFromOrder(orderId, stationType, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, message: 'Production ticket was not created. Check routing configuration.' }
  }
  return routeOrderToProduction(orderId, actor)
}

export async function getRoutingStatus(orderId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, events: [], message: 'Routing status unavailable.' }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_order_routing_events WHERE order_id=$1 ORDER BY created_at DESC`,
    [orderId]
  )
  return { ok: true, events: rows }
}

export async function retryFailedRouting(orderId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, message: 'Routing could not be resolved for this item.' }
  }
  // Reset failed items to 'added' and retry routing
  await query(
    `UPDATE pos360_order_items SET status='added', routing_resolved=FALSE, updated_at=NOW()
     WHERE order_id=$1 AND status IN ('draft','added') AND routing_resolved=FALSE`,
    [orderId]
  )
  return routeOrderToProduction(orderId, actor)
}

// ── Handheld integration ──────────────────────────────────────────────────────
export async function getHandheldOrderState(venueId, staffUserId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, orders: [], message: 'No active orders found for this venue.' }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_orders WHERE venue_id=$1 AND staff_user_id=$2 AND is_active=TRUE AND status NOT IN ('closed','canceled','voided')
     ORDER BY created_at DESC LIMIT 20`,
    [venueId, staffUserId]
  )
  return { ok: true, orders: rows }
}

export async function saveHandheldOrder(orderId, body = {}, actor = {}) {
  return updateOrder(orderId, body, actor)
}

export async function submitHandheldOrderToProduction(orderId, actor = {}) {
  if (!isDbAvailable()) {
    return { ok: false, localPreview: true, message: 'Production ticket was not created. Check routing configuration.' }
  }
  await changeOrderStatus(orderId, 'fired', actor, 'submitted from handheld')
  return routeOrderToProduction(orderId, actor)
}

// ── Audit ─────────────────────────────────────────────────────────────────────
export async function getOrderAuditTimeline(orderId) {
  if (!isDbAvailable()) {
    return { ok: true, localPreview: true, entries: [] }
  }
  const { rows } = await query(
    `SELECT * FROM pos360_order_audit WHERE order_id=$1 ORDER BY created_at DESC LIMIT 200`,
    [orderId]
  )
  return { ok: true, entries: rows }
}
