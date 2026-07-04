/**
 * POS360 Venue Menu Builder Service — Phase B.2
 *
 * Fully dynamic menu system. No hardcoded categories, items, or venue types.
 * Supports any hospitality business model.
 *
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 * All audit entries: containsSecrets: false, exposesPrivateData: false.
 */
import { isDbAvailable, query } from '../../db/connection.js'

// ── Internal helpers ──────────────────────────────────────────────────────────

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function dbFallback(area) {
  return { ok: false, localPreview: true, error: 'database_not_configured', area }
}

async function persistEvent(ev) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_menu_events
       (event_id, tenant_id, venue_id, event_type, entity_type, entity_id, actor_id, actor_role, payload)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (event_id) DO NOTHING`,
    [ev.eventId, ev.tenantId ?? null, ev.venueId, ev.eventType,
     ev.entityType ?? null, ev.entityId ?? null,
     ev.actorId ?? null, ev.actorRole ?? null, JSON.stringify(ev.payload ?? {})]
  )
}

async function writeAudit({ venueId, tenantId, locationId, action, entityType, entityId, actorId, actorRole, previousValue = {}, newValue = {} }) {
  if (!isDbAvailable()) return
  await query(
    `INSERT INTO pos360_menu_audit
       (tenant_id, venue_id, location_id, action, entity_type, entity_id,
        actor_id, actor_role, previous_value, new_value, contains_secrets, exposes_private_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false,false)`,
    [tenantId ?? null, venueId, locationId ?? null, action, entityType ?? null, entityId ?? null,
     actorId ?? null, actorRole ?? null, JSON.stringify(previousValue), JSON.stringify(newValue)]
  )
}

function buildUpdateClause(updates, allowed) {
  const sets = []; const vals = []
  for (const k of allowed) {
    if (k in updates) {
      sets.push(`${k} = $${vals.length + 1}`)
      vals.push(typeof updates[k] === 'object' && updates[k] !== null ? JSON.stringify(updates[k]) : updates[k])
    }
  }
  return { sets, vals }
}

// ── Menus ─────────────────────────────────────────────────────────────────────

export async function createMenu({ venueId, tenantId, locationId, menuName, menuDescription, createdBy, metadata = {}, featureFlags = {} }) {
  if (!isDbAvailable()) return dbFallback('menus')
  const menuId = makeId('mnu')
  const row = await query(
    `INSERT INTO pos360_menus (menu_id, tenant_id, venue_id, location_id, menu_name, menu_description, created_by, metadata, feature_flags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [menuId, tenantId ?? null, venueId, locationId ?? null, menuName, menuDescription ?? null, createdBy ?? null, JSON.stringify(metadata), JSON.stringify(featureFlags)]
  )
  const ev = { eventId: makeId('ev'), venueId, tenantId, eventType: 'menu.created', entityType: 'menu', entityId: menuId, actorId: createdBy, payload: { menuName } }
  await persistEvent(ev)
  await writeAudit({ venueId, tenantId, locationId, action: 'menu.created', entityType: 'menu', entityId: menuId, actorId: createdBy, newValue: { menuName } })
  return { ok: true, menu: row.rows[0] }
}

export async function updateMenu({ menuId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('menus')
  const allowed = ['menu_name','menu_description','status','display_order','is_active','is_active_handheld','schedule_start','schedule_end','feature_flags','metadata']
  const { sets, vals } = buildUpdateClause(updates, allowed)
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length+1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, menuId, venueId)
  const row = await query(`UPDATE pos360_menus SET ${sets.join(', ')} WHERE menu_id = $${vals.length-1} AND venue_id = $${vals.length} RETURNING *`, vals)
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.updated', entityType: 'menu', entityId: menuId, actorId: updatedBy, payload: updates })
  await writeAudit({ venueId, action: 'menu.updated', entityType: 'menu', entityId: menuId, actorId: updatedBy, newValue: updates })
  return { ok: true, menu: row.rows[0] }
}

export async function listMenus({ venueId, includeArchived = false }) {
  if (!isDbAvailable()) return { ok: true, menus: [], localPreview: true }
  const row = await query(
    `SELECT * FROM pos360_menus WHERE venue_id = $1 ${includeArchived ? '' : "AND status != 'archived' AND deleted_at IS NULL"} ORDER BY display_order ASC, created_at ASC`,
    [venueId]
  )
  return { ok: true, menus: row.rows }
}

export async function getMenu({ menuId, venueId }) {
  if (!isDbAvailable()) return { ok: true, menu: null, localPreview: true }
  const row = await query(`SELECT * FROM pos360_menus WHERE menu_id = $1 AND venue_id = $2`, [menuId, venueId])
  return { ok: true, menu: row.rows[0] ?? null }
}

export async function archiveMenu({ menuId, venueId, archivedBy }) {
  if (!isDbAvailable()) return dbFallback('menus')
  await query(`UPDATE pos360_menus SET status = 'archived', deleted_at = NOW(), updated_by = $1, updated_at = NOW() WHERE menu_id = $2 AND venue_id = $3`, [archivedBy ?? null, menuId, venueId])
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.archived', entityType: 'menu', entityId: menuId, actorId: archivedBy, payload: {} })
  await writeAudit({ venueId, action: 'menu.archived', entityType: 'menu', entityId: menuId, actorId: archivedBy })
  return { ok: true }
}

export async function restoreMenu({ menuId, venueId, restoredBy }) {
  if (!isDbAvailable()) return dbFallback('menus')
  await query(`UPDATE pos360_menus SET status = 'draft', deleted_at = NULL, updated_by = $1, updated_at = NOW() WHERE menu_id = $2 AND venue_id = $3`, [restoredBy ?? null, menuId, venueId])
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.restored', entityType: 'menu', entityId: menuId, actorId: restoredBy, payload: {} })
  return { ok: true }
}

export async function duplicateMenu({ menuId, venueId, targetVenueId, targetLocationId, newMenuName, duplicatedBy }) {
  if (!isDbAvailable()) return dbFallback('menus')
  const src = await getMenu({ menuId, venueId })
  if (!src.menu) return { ok: false, error: 'source_menu_not_found' }
  const destVenueId = targetVenueId || venueId
  const r = await createMenu({ venueId: destVenueId, tenantId: src.menu.tenant_id, locationId: targetLocationId, menuName: newMenuName || `${src.menu.menu_name} (copy)`, createdBy: duplicatedBy })
  if (!r.ok) return r
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.duplicated', entityType: 'menu', entityId: r.menu.menu_id, actorId: duplicatedBy, payload: { sourceMenuId: menuId, destVenueId } })
  return { ok: true, menu: r.menu, sourceMenuId: menuId }
}

export async function scheduleMenu({ menuId, venueId, scheduleName, scheduleType, daysOfWeek, timeFrom, timeUntil, dateFrom, dateUntil, scheduledBy }) {
  if (!isDbAvailable()) return dbFallback('schedules')
  const scheduleId = makeId('sch')
  const row = await query(
    `INSERT INTO pos360_menu_schedules (schedule_id, venue_id, menu_id, schedule_name, schedule_type, days_of_week, time_from, time_until, date_from, date_until, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [scheduleId, venueId, menuId, scheduleName, scheduleType ?? 'recurring', JSON.stringify(daysOfWeek ?? []), timeFrom ?? null, timeUntil ?? null, dateFrom ?? null, dateUntil ?? null, scheduledBy ?? null]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.scheduled', entityType: 'schedule', entityId: scheduleId, actorId: scheduledBy, payload: { menuId, scheduleType } })
  await writeAudit({ venueId, action: 'menu.scheduled', entityType: 'schedule', entityId: scheduleId, actorId: scheduledBy, newValue: { menuId, scheduleName } })
  return { ok: true, schedule: row.rows[0] }
}

export async function setMenuActiveState({ menuId, venueId, isActive, isActiveHandheld, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('menus')
  const updates = {}
  if (isActive !== undefined) updates.is_active = isActive
  if (isActiveHandheld !== undefined) updates.is_active_handheld = isActiveHandheld
  updates.status = isActive ? 'active' : 'disabled'
  return updateMenu({ menuId, venueId, updates, updatedBy })
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function createCategory({ venueId, tenantId, locationId, menuId, categoryName, categoryDescription, displayOrder = 0, colorHex, icon, ageGated = false, createdBy, metadata = {} }) {
  if (!isDbAvailable()) return dbFallback('categories')
  const categoryId = makeId('cat')
  const row = await query(
    `INSERT INTO pos360_menu_categories (category_id, tenant_id, venue_id, location_id, menu_id, category_name, category_description, display_order, color_hex, icon, age_gated, created_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [categoryId, tenantId ?? null, venueId, locationId ?? null, menuId, categoryName, categoryDescription ?? null, displayOrder, colorHex ?? null, icon ?? null, ageGated, createdBy ?? null, JSON.stringify(metadata)]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.category.created', entityType: 'category', entityId: categoryId, actorId: createdBy, payload: { menuId, categoryName } })
  await writeAudit({ venueId, action: 'menu.category.created', entityType: 'category', entityId: categoryId, actorId: createdBy, newValue: { categoryName } })
  return { ok: true, category: row.rows[0] }
}

export async function updateCategory({ categoryId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('categories')
  const allowed = ['category_name','category_description','display_order','is_active','color_hex','icon','image_url','age_gated','routing_station_id','metadata']
  const { sets, vals } = buildUpdateClause(updates, allowed)
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length+1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, categoryId, venueId)
  const row = await query(`UPDATE pos360_menu_categories SET ${sets.join(', ')} WHERE category_id = $${vals.length-1} AND venue_id = $${vals.length} RETURNING *`, vals)
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.category.updated', entityType: 'category', entityId: categoryId, actorId: updatedBy, payload: updates })
  await writeAudit({ venueId, action: 'menu.category.updated', entityType: 'category', entityId: categoryId, actorId: updatedBy, newValue: updates })
  return { ok: true, category: row.rows[0] }
}

export async function listCategories({ venueId, menuId, includeInactive = false }) {
  if (!isDbAvailable()) return { ok: true, categories: [], localPreview: true }
  let sql = `SELECT * FROM pos360_menu_categories WHERE venue_id = $1`
  const vals = [venueId]
  if (menuId) { vals.push(menuId); sql += ` AND menu_id = $${vals.length}` }
  if (!includeInactive) sql += ` AND is_active = true AND deleted_at IS NULL`
  sql += ` ORDER BY display_order ASC, category_name ASC`
  return { ok: true, categories: (await query(sql, vals)).rows }
}

export async function reorderCategories({ venueId, menuId, orderedIds, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('categories')
  for (let i = 0; i < orderedIds.length; i++) {
    await query(`UPDATE pos360_menu_categories SET display_order = $1, updated_at = NOW() WHERE category_id = $2 AND venue_id = $3`, [i, orderedIds[i], venueId])
  }
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.category.reordered', entityType: 'menu', entityId: menuId, actorId: updatedBy, payload: { orderedIds } })
  await writeAudit({ venueId, action: 'menu.category.reordered', entityType: 'menu', entityId: menuId, actorId: updatedBy, newValue: { orderedIds } })
  return { ok: true }
}

export async function archiveCategory({ categoryId, venueId, archivedBy }) {
  if (!isDbAvailable()) return dbFallback('categories')
  await query(`UPDATE pos360_menu_categories SET is_active = false, deleted_at = NOW(), updated_at = NOW(), updated_by = $1 WHERE category_id = $2 AND venue_id = $3`, [archivedBy ?? null, categoryId, venueId])
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.category.archived', entityType: 'category', entityId: categoryId, actorId: archivedBy, payload: {} })
  return { ok: true }
}

// ── Subcategories ─────────────────────────────────────────────────────────────

export async function createSubcategory({ venueId, tenantId, menuId, categoryId, subcategoryName, subcategoryDescription, displayOrder = 0, createdBy, metadata = {} }) {
  if (!isDbAvailable()) return dbFallback('subcategories')
  const subcategoryId = makeId('sub')
  const row = await query(
    `INSERT INTO pos360_menu_subcategories (subcategory_id, tenant_id, venue_id, menu_id, category_id, subcategory_name, subcategory_description, display_order, created_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [subcategoryId, tenantId ?? null, venueId, menuId, categoryId, subcategoryName, subcategoryDescription ?? null, displayOrder, createdBy ?? null, JSON.stringify(metadata)]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.subcategory.created', entityType: 'subcategory', entityId: subcategoryId, actorId: createdBy, payload: { categoryId, subcategoryName } })
  return { ok: true, subcategory: row.rows[0] }
}

export async function updateSubcategory({ subcategoryId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('subcategories')
  const allowed = ['subcategory_name','subcategory_description','display_order','is_active','icon','color_hex','image_url','age_gated','metadata']
  const { sets, vals } = buildUpdateClause(updates, allowed)
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length+1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, subcategoryId, venueId)
  const row = await query(`UPDATE pos360_menu_subcategories SET ${sets.join(', ')} WHERE subcategory_id = $${vals.length-1} AND venue_id = $${vals.length} RETURNING *`, vals)
  return { ok: true, subcategory: row.rows[0] }
}

export async function listSubcategories({ venueId, categoryId, menuId, includeInactive = false }) {
  if (!isDbAvailable()) return { ok: true, subcategories: [], localPreview: true }
  let sql = `SELECT * FROM pos360_menu_subcategories WHERE venue_id = $1`
  const vals = [venueId]
  if (categoryId) { vals.push(categoryId); sql += ` AND category_id = $${vals.length}` }
  if (menuId)     { vals.push(menuId);     sql += ` AND menu_id = $${vals.length}` }
  if (!includeInactive) sql += ` AND is_active = true AND deleted_at IS NULL`
  sql += ` ORDER BY display_order ASC, subcategory_name ASC`
  return { ok: true, subcategories: (await query(sql, vals)).rows }
}

export async function reorderSubcategories({ venueId, categoryId, orderedIds, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('subcategories')
  for (let i = 0; i < orderedIds.length; i++) {
    await query(`UPDATE pos360_menu_subcategories SET display_order = $1, updated_at = NOW() WHERE subcategory_id = $2 AND venue_id = $3`, [i, orderedIds[i], venueId])
  }
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.subcategory.reordered', entityType: 'category', entityId: categoryId, actorId: updatedBy, payload: { orderedIds } })
  return { ok: true }
}

// ── Items ─────────────────────────────────────────────────────────────────────

export async function createItem({ venueId, tenantId, locationId, menuId, categoryId, subcategoryId, itemName, itemDescription, basePrice = 0, costPrice, sku, barcode, displayOrder = 0, isAgeGated = false, minimumAge, isTaxable = true, preparationNotes, allergenInfo = {}, dietaryTags = [], itemTags = [], smokecraftMeta = {}, eatMeta = {}, loyaltyEligible = false, vipEligible = false, createdBy, metadata = {}, featureFlags = {} }) {
  if (!isDbAvailable()) return dbFallback('items')
  const itemId = makeId('itm')
  const row = await query(
    `INSERT INTO pos360_menu_items
       (item_id, tenant_id, venue_id, location_id, menu_id, category_id, subcategory_id,
        item_name, item_description, base_price, cost_price, sku, barcode,
        display_order, is_age_gated, minimum_age, is_taxable, preparation_notes,
        allergen_info, dietary_tags, item_tags, smokecraft_meta, eat_meta,
        loyalty_eligible, vip_eligible, created_by, metadata, feature_flags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
     RETURNING *`,
    [itemId, tenantId ?? null, venueId, locationId ?? null, menuId, categoryId ?? null, subcategoryId ?? null,
     itemName, itemDescription ?? null, basePrice, costPrice ?? null, sku ?? null, barcode ?? null,
     displayOrder, isAgeGated, minimumAge ?? null, isTaxable, preparationNotes ?? null,
     JSON.stringify(allergenInfo), JSON.stringify(dietaryTags), JSON.stringify(itemTags),
     JSON.stringify(smokecraftMeta), JSON.stringify(eatMeta),
     loyaltyEligible, vipEligible, createdBy ?? null, JSON.stringify(metadata), JSON.stringify(featureFlags)]
  )
  const ev = { eventId: makeId('ev'), venueId, tenantId, eventType: 'menu.item.created', entityType: 'item', entityId: itemId, actorId: createdBy, payload: { itemName, categoryId, menuId } }
  await persistEvent(ev)
  await writeAudit({ venueId, tenantId, locationId, action: 'menu.item.created', entityType: 'item', entityId: itemId, actorId: createdBy, newValue: { itemName, basePrice } })
  return { ok: true, item: row.rows[0] }
}

export async function updateItem({ itemId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('items')
  const allowed = ['item_name','item_description','base_price','cost_price','sku','barcode','status','display_order','is_active','is_featured','is_age_gated','minimum_age','is_taxable','preparation_notes','allergen_info','dietary_tags','item_tags','smokecraft_meta','eat_meta','loyalty_eligible','vip_eligible','feature_flags','metadata','category_id','subcategory_id']
  const { sets, vals } = buildUpdateClause(updates, allowed)
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length+1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, itemId, venueId)
  const row = await query(`UPDATE pos360_menu_items SET ${sets.join(', ')} WHERE item_id = $${vals.length-1} AND venue_id = $${vals.length} RETURNING *`, vals)
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.item.updated', entityType: 'item', entityId: itemId, actorId: updatedBy, payload: updates })
  await writeAudit({ venueId, action: 'menu.item.updated', entityType: 'item', entityId: itemId, actorId: updatedBy, newValue: updates })
  return { ok: true, item: row.rows[0] }
}

export async function listItems({ venueId, menuId, categoryId, subcategoryId, status, includeInactive = false }) {
  if (!isDbAvailable()) return { ok: true, items: [], localPreview: true }
  let sql = `SELECT * FROM pos360_menu_items WHERE venue_id = $1`
  const vals = [venueId]
  if (menuId)       { vals.push(menuId);       sql += ` AND menu_id = $${vals.length}` }
  if (categoryId)   { vals.push(categoryId);   sql += ` AND category_id = $${vals.length}` }
  if (subcategoryId){ vals.push(subcategoryId);sql += ` AND subcategory_id = $${vals.length}` }
  if (status)       { vals.push(status);       sql += ` AND status = $${vals.length}` }
  if (!includeInactive) sql += ` AND is_active = true AND deleted_at IS NULL`
  sql += ` ORDER BY display_order ASC, item_name ASC`
  return { ok: true, items: (await query(sql, vals)).rows }
}

export async function getItem({ itemId, venueId }) {
  if (!isDbAvailable()) return { ok: true, item: null, localPreview: true }
  const row = await query(`SELECT * FROM pos360_menu_items WHERE item_id = $1 AND venue_id = $2`, [itemId, venueId])
  return { ok: true, item: row.rows[0] ?? null }
}

export async function reorderItems({ venueId, categoryId, orderedIds, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('items')
  for (let i = 0; i < orderedIds.length; i++) {
    await query(`UPDATE pos360_menu_items SET display_order = $1, updated_at = NOW() WHERE item_id = $2 AND venue_id = $3`, [i, orderedIds[i], venueId])
  }
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.item.reordered', entityType: 'category', entityId: categoryId, actorId: updatedBy, payload: { orderedIds } })
  return { ok: true }
}

export async function archiveItem({ itemId, venueId, archivedBy }) {
  if (!isDbAvailable()) return dbFallback('items')
  await query(`UPDATE pos360_menu_items SET status = 'archived', is_active = false, deleted_at = NOW(), updated_at = NOW(), updated_by = $1 WHERE item_id = $2 AND venue_id = $3`, [archivedBy ?? null, itemId, venueId])
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.item.archived', entityType: 'item', entityId: itemId, actorId: archivedBy, payload: {} })
  await writeAudit({ venueId, action: 'menu.item.archived', entityType: 'item', entityId: itemId, actorId: archivedBy })
  return { ok: true }
}

export async function restoreItem({ itemId, venueId, restoredBy }) {
  if (!isDbAvailable()) return dbFallback('items')
  await query(`UPDATE pos360_menu_items SET status = 'active', is_active = true, deleted_at = NULL, updated_at = NOW(), updated_by = $1 WHERE item_id = $2 AND venue_id = $3`, [restoredBy ?? null, itemId, venueId])
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.item.restored', entityType: 'item', entityId: itemId, actorId: restoredBy, payload: {} })
  return { ok: true }
}

export async function setItemOutOfStock({ itemId, venueId, outOfStock, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('items')
  const status = outOfStock ? 'out_of_stock' : 'active'
  await query(`UPDATE pos360_menu_items SET status = $1, updated_at = NOW(), updated_by = $2 WHERE item_id = $3 AND venue_id = $4`, [status, updatedBy ?? null, itemId, venueId])
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: outOfStock ? 'menu.item.out_of_stock' : 'menu.item.back_in_stock', entityType: 'item', entityId: itemId, actorId: updatedBy, payload: {} })
  return { ok: true, status }
}

export async function setItemLimitedAvailability({ itemId, venueId, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('items')
  await query(`UPDATE pos360_menu_items SET status = 'limited', updated_at = NOW(), updated_by = $1 WHERE item_id = $2 AND venue_id = $3`, [updatedBy ?? null, itemId, venueId])
  return { ok: true }
}

// ── Item Photos ───────────────────────────────────────────────────────────────

export async function addItemPhoto({ venueId, itemId, photoUrl, altText, isPrimary = false, displayOrder = 0, createdBy }) {
  if (!isDbAvailable()) return dbFallback('photos')
  const photoId = makeId('pht')
  if (isPrimary) {
    await query(`UPDATE pos360_menu_item_photos SET is_primary = false WHERE item_id = $1 AND venue_id = $2`, [itemId, venueId])
  }
  const row = await query(
    `INSERT INTO pos360_menu_item_photos (photo_id, venue_id, item_id, photo_url, alt_text, is_primary, display_order, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [photoId, venueId, itemId, photoUrl, altText ?? null, isPrimary, displayOrder, createdBy ?? null]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.item.photo.added', entityType: 'item', entityId: itemId, actorId: createdBy, payload: { photoId } })
  return { ok: true, photo: row.rows[0] }
}

export async function removeItemPhoto({ photoId, venueId, removedBy }) {
  if (!isDbAvailable()) return dbFallback('photos')
  await query(`UPDATE pos360_menu_item_photos SET deleted_at = NOW() WHERE photo_id = $1 AND venue_id = $2`, [photoId, venueId])
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.item.photo.removed', entityType: 'photo', entityId: photoId, actorId: removedBy, payload: {} })
  return { ok: true }
}

// ── Modifier Groups ───────────────────────────────────────────────────────────

export async function createModifierGroup({ venueId, groupName, groupDescription, selectionType = 'single', minSelections = 0, maxSelections, isRequired = false, createdBy, metadata = {} }) {
  if (!isDbAvailable()) return dbFallback('modifier_groups')
  const groupId = makeId('mdg')
  const row = await query(
    `INSERT INTO pos360_menu_modifier_groups (group_id, venue_id, group_name, group_description, selection_type, min_selections, max_selections, is_required, created_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [groupId, venueId, groupName, groupDescription ?? null, selectionType, minSelections, maxSelections ?? null, isRequired, createdBy ?? null, JSON.stringify(metadata)]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.modifier_group.created', entityType: 'modifier_group', entityId: groupId, actorId: createdBy, payload: { groupName } })
  return { ok: true, modifierGroup: row.rows[0] }
}

export async function updateModifierGroup({ groupId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('modifier_groups')
  const allowed = ['group_name','group_description','selection_type','min_selections','max_selections','is_required','is_active','display_order','metadata']
  const { sets, vals } = buildUpdateClause(updates, allowed)
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length+1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, groupId, venueId)
  const row = await query(`UPDATE pos360_menu_modifier_groups SET ${sets.join(', ')} WHERE group_id = $${vals.length-1} AND venue_id = $${vals.length} RETURNING *`, vals)
  return { ok: true, modifierGroup: row.rows[0] }
}

export async function createModifier({ venueId, groupId, modifierName, modifierDescription, priceDelta = 0, displayOrder = 0, createdBy, metadata = {} }) {
  if (!isDbAvailable()) return dbFallback('modifiers')
  const modifierId = makeId('mod')
  const row = await query(
    `INSERT INTO pos360_menu_modifiers (modifier_id, venue_id, group_id, modifier_name, modifier_description, price_delta, display_order, created_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [modifierId, venueId, groupId, modifierName, modifierDescription ?? null, priceDelta, displayOrder, createdBy ?? null, JSON.stringify(metadata)]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.modifier.created', entityType: 'modifier', entityId: modifierId, actorId: createdBy, payload: { groupId, modifierName } })
  return { ok: true, modifier: row.rows[0] }
}

export async function attachModifierGroup({ itemId, groupId, venueId, displayOrder = 0 }) {
  if (!isDbAvailable()) return dbFallback('modifiers')
  await query(`INSERT INTO pos360_menu_item_modifier_groups (item_id, group_id, display_order) VALUES ($1,$2,$3) ON CONFLICT (item_id, group_id) DO NOTHING`, [itemId, groupId, displayOrder])
  return { ok: true }
}

export async function detachModifierGroup({ itemId, groupId, venueId }) {
  if (!isDbAvailable()) return dbFallback('modifiers')
  await query(`DELETE FROM pos360_menu_item_modifier_groups WHERE item_id = $1 AND group_id = $2`, [itemId, groupId])
  return { ok: true }
}

export async function listModifierGroups({ venueId, includeInactive = false }) {
  if (!isDbAvailable()) return { ok: true, groups: [], localPreview: true }
  const row = await query(`SELECT * FROM pos360_menu_modifier_groups WHERE venue_id = $1 ${includeInactive ? '' : 'AND is_active = true AND deleted_at IS NULL'} ORDER BY display_order ASC`, [venueId])
  return { ok: true, groups: row.rows }
}

export async function listModifiers({ venueId, groupId }) {
  if (!isDbAvailable()) return { ok: true, modifiers: [], localPreview: true }
  const row = await query(`SELECT * FROM pos360_menu_modifiers WHERE venue_id = $1 AND group_id = $2 AND is_active = true AND deleted_at IS NULL ORDER BY display_order ASC`, [venueId, groupId])
  return { ok: true, modifiers: row.rows }
}

// ── Add-ons ───────────────────────────────────────────────────────────────────

export async function createAddon({ venueId, itemId, addonName, addonDescription, price = 0, displayOrder = 0, createdBy, metadata = {} }) {
  if (!isDbAvailable()) return dbFallback('addons')
  const addonId = makeId('adn')
  const row = await query(
    `INSERT INTO pos360_menu_item_addons (addon_id, venue_id, item_id, addon_name, addon_description, price, display_order, created_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [addonId, venueId, itemId, addonName, addonDescription ?? null, price, displayOrder, createdBy ?? null, JSON.stringify(metadata)]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.addon.created', entityType: 'addon', entityId: addonId, actorId: createdBy, payload: { itemId, addonName } })
  return { ok: true, addon: row.rows[0] }
}

export async function updateAddon({ addonId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('addons')
  const allowed = ['addon_name','addon_description','price','is_active','display_order','metadata']
  const { sets, vals } = buildUpdateClause(updates, allowed)
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_at = NOW()`)
  vals.push(addonId, venueId)
  const row = await query(`UPDATE pos360_menu_item_addons SET ${sets.join(', ')} WHERE addon_id = $${vals.length-1} AND venue_id = $${vals.length} RETURNING *`, vals)
  return { ok: true, addon: row.rows[0] }
}

export async function listAddons({ venueId, itemId }) {
  if (!isDbAvailable()) return { ok: true, addons: [], localPreview: true }
  const row = await query(`SELECT * FROM pos360_menu_item_addons WHERE venue_id = $1 AND item_id = $2 AND is_active = true AND deleted_at IS NULL ORDER BY display_order ASC`, [venueId, itemId])
  return { ok: true, addons: row.rows }
}

// ── Bundles / Combos ──────────────────────────────────────────────────────────

export async function createBundle({ venueId, tenantId, menuId, bundleName, bundleDescription, bundleType = 'combo', bundlePrice = 0, createdBy, metadata = {} }) {
  if (!isDbAvailable()) return dbFallback('bundles')
  const bundleId = makeId('bnd')
  const row = await query(
    `INSERT INTO pos360_menu_item_bundles (bundle_id, tenant_id, venue_id, menu_id, bundle_name, bundle_description, bundle_type, bundle_price, created_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [bundleId, tenantId ?? null, venueId, menuId, bundleName, bundleDescription ?? null, bundleType, bundlePrice, createdBy ?? null, JSON.stringify(metadata)]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.bundle.created', entityType: 'bundle', entityId: bundleId, actorId: createdBy, payload: { bundleName, bundleType } })
  await writeAudit({ venueId, action: 'menu.bundle.created', entityType: 'bundle', entityId: bundleId, actorId: createdBy, newValue: { bundleName } })
  return { ok: true, bundle: row.rows[0] }
}

export async function updateBundle({ bundleId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('bundles')
  const allowed = ['bundle_name','bundle_description','bundle_type','bundle_price','is_active','metadata']
  const { sets, vals } = buildUpdateClause(updates, allowed)
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length+1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, bundleId, venueId)
  const row = await query(`UPDATE pos360_menu_item_bundles SET ${sets.join(', ')} WHERE bundle_id = $${vals.length-1} AND venue_id = $${vals.length} RETURNING *`, vals)
  return { ok: true, bundle: row.rows[0] }
}

export async function addItemToBundle({ bundleId, itemId, quantity = 1, priceOverride, displayOrder = 0 }) {
  if (!isDbAvailable()) return dbFallback('bundles')
  const row = await query(
    `INSERT INTO pos360_menu_bundle_items (bundle_id, item_id, quantity, price_override, display_order) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (bundle_id, item_id) DO UPDATE SET quantity = $3, price_override = $4 RETURNING *`,
    [bundleId, itemId, quantity, priceOverride ?? null, displayOrder]
  )
  return { ok: true, bundleItem: row.rows[0] }
}

export async function removeItemFromBundle({ bundleId, itemId }) {
  if (!isDbAvailable()) return dbFallback('bundles')
  await query(`DELETE FROM pos360_menu_bundle_items WHERE bundle_id = $1 AND item_id = $2`, [bundleId, itemId])
  return { ok: true }
}

export async function listBundles({ venueId, menuId, includeInactive = false }) {
  if (!isDbAvailable()) return { ok: true, bundles: [], localPreview: true }
  let sql = `SELECT * FROM pos360_menu_item_bundles WHERE venue_id = $1`
  const vals = [venueId]
  if (menuId) { vals.push(menuId); sql += ` AND menu_id = $${vals.length}` }
  if (!includeInactive) sql += ` AND is_active = true AND deleted_at IS NULL`
  return { ok: true, bundles: (await query(sql, vals)).rows }
}

// ── Pricing Rules ─────────────────────────────────────────────────────────────

export async function createPricingRule({ venueId, tenantId, locationId, itemId, categoryId, menuId, ruleType = 'base_price', ruleName, priceValue, pricePercent, conditions = {}, priority = 0, validFrom, validUntil, daysOfWeek = [], timeFrom, timeUntil, createdBy, metadata = {} }) {
  if (!isDbAvailable()) return dbFallback('pricing')
  const ruleId = makeId('prc')
  const row = await query(
    `INSERT INTO pos360_menu_pricing_rules
       (rule_id, tenant_id, venue_id, location_id, item_id, category_id, menu_id, rule_type, rule_name, price_value, price_percent, conditions, priority, valid_from, valid_until, days_of_week, time_from, time_until, created_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`,
    [ruleId, tenantId ?? null, venueId, locationId ?? null, itemId ?? null, categoryId ?? null, menuId ?? null, ruleType, ruleName, priceValue ?? null, pricePercent ?? null, JSON.stringify(conditions), priority, validFrom ?? null, validUntil ?? null, JSON.stringify(daysOfWeek), timeFrom ?? null, timeUntil ?? null, createdBy ?? null, JSON.stringify(metadata)]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.pricing_rule.created', entityType: 'pricing_rule', entityId: ruleId, actorId: createdBy, payload: { ruleType, ruleName } })
  await writeAudit({ venueId, action: 'menu.pricing_rule.created', entityType: 'pricing_rule', entityId: ruleId, actorId: createdBy, newValue: { ruleType, ruleName, priceValue } })
  return { ok: true, pricingRule: row.rows[0] }
}

export async function updatePricingRule({ ruleId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('pricing')
  const allowed = ['rule_name','rule_type','price_value','price_percent','conditions','priority','is_active','valid_from','valid_until','days_of_week','time_from','time_until','metadata']
  const { sets, vals } = buildUpdateClause(updates, allowed)
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length+1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, ruleId, venueId)
  const row = await query(`UPDATE pos360_menu_pricing_rules SET ${sets.join(', ')} WHERE rule_id = $${vals.length-1} AND venue_id = $${vals.length} RETURNING *`, vals)
  return { ok: true, pricingRule: row.rows[0] }
}

export async function listPricingRules({ venueId, itemId, ruleType, activeOnly = true }) {
  if (!isDbAvailable()) return { ok: true, rules: [], localPreview: true }
  let sql = `SELECT * FROM pos360_menu_pricing_rules WHERE venue_id = $1`
  const vals = [venueId]
  if (itemId)   { vals.push(itemId);   sql += ` AND item_id = $${vals.length}` }
  if (ruleType) { vals.push(ruleType); sql += ` AND rule_type = $${vals.length}` }
  if (activeOnly) sql += ` AND is_active = true AND deleted_at IS NULL`
  sql += ` ORDER BY priority DESC, created_at ASC`
  return { ok: true, rules: (await query(sql, vals)).rows }
}

export async function archivePricingRule({ ruleId, venueId, archivedBy }) {
  if (!isDbAvailable()) return dbFallback('pricing')
  await query(`UPDATE pos360_menu_pricing_rules SET is_active = false, deleted_at = NOW(), updated_at = NOW(), updated_by = $1 WHERE rule_id = $2 AND venue_id = $3`, [archivedBy ?? null, ruleId, venueId])
  return { ok: true }
}

/**
 * Resolve the active price for an item.
 * Checks pricing rules in priority order (highest priority wins).
 * Returns base_price if no matching rule found.
 * Honest: never invents a price.
 */
export async function resolveActivePrice({ itemId, venueId, ruleContext = {} }) {
  const itemRow = await getItem({ itemId, venueId })
  if (!itemRow.item) return { ok: false, error: 'item_not_found' }
  const basePrice = Number(itemRow.item.base_price)
  if (!isDbAvailable()) return { ok: true, price: basePrice, ruleApplied: null, localPreview: true }
  const rules = await listPricingRules({ venueId, itemId, activeOnly: true })
  // Simple resolution: highest-priority time-matched rule wins
  const now = new Date()
  for (const rule of rules.rules) {
    if (rule.rule_type === 'base_price') continue
    if (rule.valid_from && new Date(rule.valid_from) > now) continue
    if (rule.valid_until && new Date(rule.valid_until) < now) continue
    const price = rule.price_value !== null ? Number(rule.price_value) : basePrice * (1 - Number(rule.price_percent || 0))
    return { ok: true, price, ruleApplied: rule.rule_id, ruleType: rule.rule_type }
  }
  return { ok: true, price: basePrice, ruleApplied: null, ruleType: 'base_price' }
}

// ── Tax Rules ─────────────────────────────────────────────────────────────────

export async function createTaxRule({ venueId, tenantId, locationId, taxName, taxRate, appliesTo = 'item', itemId, categoryId, menuId, isInclusive = false, createdBy, metadata = {} }) {
  if (!isDbAvailable()) return dbFallback('tax')
  const taxRuleId = makeId('tax')
  const row = await query(
    `INSERT INTO pos360_menu_tax_rules (tax_rule_id, tenant_id, venue_id, location_id, tax_name, tax_rate, applies_to, item_id, category_id, menu_id, is_inclusive, created_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [taxRuleId, tenantId ?? null, venueId, locationId ?? null, taxName, taxRate, appliesTo, itemId ?? null, categoryId ?? null, menuId ?? null, isInclusive, createdBy ?? null, JSON.stringify(metadata)]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.tax_rule.created', entityType: 'tax_rule', entityId: taxRuleId, actorId: createdBy, payload: { taxName, taxRate } })
  await writeAudit({ venueId, action: 'menu.tax_rule.created', entityType: 'tax_rule', entityId: taxRuleId, actorId: createdBy, newValue: { taxName, taxRate } })
  return { ok: true, taxRule: row.rows[0] }
}

export async function listTaxRules({ venueId, itemId, activeOnly = true }) {
  if (!isDbAvailable()) return { ok: true, taxRules: [], localPreview: true }
  let sql = `SELECT * FROM pos360_menu_tax_rules WHERE venue_id = $1`
  const vals = [venueId]
  if (itemId) { vals.push(itemId); sql += ` AND (item_id = $${vals.length} OR item_id IS NULL)` }
  if (activeOnly) sql += ` AND is_active = true AND deleted_at IS NULL`
  return { ok: true, taxRules: (await query(sql, vals)).rows }
}

export async function resolveTaxForItem({ itemId, venueId }) {
  const rules = await listTaxRules({ venueId, itemId, activeOnly: true })
  const total = rules.taxRules.reduce((sum, r) => sum + Number(r.tax_rate), 0)
  return { ok: true, totalRate: total, rules: rules.taxRules, localPreview: rules.localPreview ?? false }
}

// ── Routing Stations ──────────────────────────────────────────────────────────

export async function createRoutingStation({ venueId, tenantId, locationId, stationName, stationType = 'custom', displayOrder = 0, kdsEnabled = false, printEnabled = false, displayEnabled = false, createdBy, metadata = {} }) {
  if (!isDbAvailable()) return dbFallback('routing')
  const stationId = makeId('stn')
  const row = await query(
    `INSERT INTO pos360_menu_routing_stations (station_id, tenant_id, venue_id, location_id, station_name, station_type, display_order, kds_enabled, print_enabled, display_enabled, created_by, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [stationId, tenantId ?? null, venueId, locationId ?? null, stationName, stationType, displayOrder, kdsEnabled, printEnabled, displayEnabled, createdBy ?? null, JSON.stringify(metadata)]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.routing_station.created', entityType: 'station', entityId: stationId, actorId: createdBy, payload: { stationName, stationType } })
  await writeAudit({ venueId, action: 'menu.routing_station.created', entityType: 'station', entityId: stationId, actorId: createdBy, newValue: { stationName } })
  return { ok: true, station: row.rows[0] }
}

export async function updateRoutingStation({ stationId, venueId, updates, updatedBy }) {
  if (!isDbAvailable()) return dbFallback('routing')
  const allowed = ['station_name','station_type','display_order','is_active','kds_enabled','print_enabled','display_enabled','metadata']
  const { sets, vals } = buildUpdateClause(updates, allowed)
  if (!sets.length) return { ok: false, error: 'no_valid_fields' }
  sets.push(`updated_by = $${vals.length+1}`, `updated_at = NOW()`)
  vals.push(updatedBy ?? null, stationId, venueId)
  const row = await query(`UPDATE pos360_menu_routing_stations SET ${sets.join(', ')} WHERE station_id = $${vals.length-1} AND venue_id = $${vals.length} RETURNING *`, vals)
  return { ok: true, station: row.rows[0] }
}

export async function listRoutingStations({ venueId, includeInactive = false }) {
  if (!isDbAvailable()) return { ok: true, stations: [], localPreview: true }
  const row = await query(`SELECT * FROM pos360_menu_routing_stations WHERE venue_id = $1 ${includeInactive ? '' : 'AND is_active = true AND deleted_at IS NULL'} ORDER BY display_order ASC`, [venueId])
  return { ok: true, stations: row.rows }
}

export async function attachItemRouting({ venueId, itemId, stationId, isPrimary = false, fulfillmentType, prepPriority = 0, routingNotes, createdBy }) {
  if (!isDbAvailable()) return dbFallback('routing')
  if (isPrimary) {
    await query(`UPDATE pos360_menu_item_routing SET is_primary = false WHERE item_id = $1 AND venue_id = $2`, [itemId, venueId])
  }
  const routingId = makeId('rte')
  const row = await query(
    `INSERT INTO pos360_menu_item_routing (routing_id, venue_id, item_id, station_id, is_primary, fulfillment_type, prep_priority, routing_notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [routingId, venueId, itemId, stationId, isPrimary, fulfillmentType ?? null, prepPriority, routingNotes ?? null, createdBy ?? null]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.item.routing_updated', entityType: 'item', entityId: itemId, actorId: createdBy, payload: { stationId, isPrimary } })
  await writeAudit({ venueId, action: 'menu.item.routing_updated', entityType: 'item', entityId: itemId, actorId: createdBy, newValue: { stationId, isPrimary } })
  return { ok: true, routing: row.rows[0] }
}

export async function removeItemRouting({ routingId, venueId }) {
  if (!isDbAvailable()) return dbFallback('routing')
  await query(`UPDATE pos360_menu_item_routing SET deleted_at = NOW(), updated_at = NOW() WHERE routing_id = $1 AND venue_id = $2`, [routingId, venueId])
  return { ok: true }
}

export async function resolveItemRouting({ itemId, venueId }) {
  if (!isDbAvailable()) return { ok: true, routing: [], localPreview: true }
  const row = await query(
    `SELECT r.*, s.station_name, s.station_type, s.kds_enabled, s.print_enabled, s.display_enabled
     FROM pos360_menu_item_routing r
     JOIN pos360_menu_routing_stations s ON s.station_id = r.station_id
     WHERE r.item_id = $1 AND r.venue_id = $2 AND r.deleted_at IS NULL AND s.is_active = true
     ORDER BY r.is_primary DESC, r.prep_priority ASC`,
    [itemId, venueId]
  )
  return { ok: true, routing: row.rows }
}

// ── Import / Export ───────────────────────────────────────────────────────────

export async function exportMenuJson({ menuId, venueId, requestedBy }) {
  if (!isDbAvailable()) return dbFallback('import_export')
  const opId = makeId('iex')
  const [menuRow, catsRow, itemsRow] = await Promise.all([
    query(`SELECT * FROM pos360_menus WHERE menu_id = $1 AND venue_id = $2`, [menuId, venueId]),
    query(`SELECT * FROM pos360_menu_categories WHERE menu_id = $1 AND venue_id = $2 AND deleted_at IS NULL`, [menuId, venueId]),
    query(`SELECT * FROM pos360_menu_items WHERE menu_id = $1 AND venue_id = $2 AND deleted_at IS NULL`, [menuId, venueId]),
  ])
  const payload = { menu: menuRow.rows[0], categories: catsRow.rows, items: itemsRow.rows, exportedAt: new Date().toISOString(), exportedBy: requestedBy }
  await query(
    `INSERT INTO pos360_menu_import_exports (operation_id, venue_id, operation_type, status, source_menu_id, payload, created_by, completed_at) VALUES ($1,$2,'export','completed',$3,$4,$5,NOW())`,
    [opId, venueId, menuId, JSON.stringify({ itemCount: itemsRow.rows.length }), requestedBy ?? null]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.export.completed', entityType: 'menu', entityId: menuId, actorId: requestedBy, payload: { opId } })
  return { ok: true, operation: { operationId: opId }, export: payload }
}

export async function importMenuJson({ venueId, targetLocationId, importData, importedBy }) {
  if (!isDbAvailable()) return dbFallback('import_export')
  const opId = makeId('iex')
  await query(
    `INSERT INTO pos360_menu_import_exports (operation_id, venue_id, operation_type, status, target_venue_id, target_location_id, payload, created_by) VALUES ($1,$2,'import','pending',$2,$3,$4,$5)`,
    [opId, venueId, targetLocationId ?? null, JSON.stringify({ source: 'json_import' }), importedBy ?? null]
  )
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.import.started', entityType: 'import', entityId: opId, actorId: importedBy, payload: {} })
  // Validate basic structure
  if (!importData?.menu?.menu_name) {
    await query(`UPDATE pos360_menu_import_exports SET status = 'failed', completed_at = NOW() WHERE operation_id = $1`, [opId])
    await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.import.failed', entityType: 'import', entityId: opId, actorId: importedBy, payload: { reason: 'invalid_structure' } })
    return { ok: false, error: 'invalid_import_structure', operationId: opId }
  }
  const newMenu = await createMenu({ venueId, menuName: `${importData.menu.menu_name} (imported)`, createdBy: importedBy })
  let itemsImported = 0
  for (const cat of (importData.categories || [])) {
    await createCategory({ venueId, menuId: newMenu.menu.menu_id, categoryName: cat.category_name, createdBy: importedBy })
  }
  for (const item of (importData.items || [])) {
    await createItem({ venueId, menuId: newMenu.menu.menu_id, itemName: item.item_name, basePrice: item.base_price, createdBy: importedBy })
    itemsImported++
  }
  await query(`UPDATE pos360_menu_import_exports SET status = 'completed', result = $1, completed_at = NOW() WHERE operation_id = $2`, [JSON.stringify({ itemsImported, menuId: newMenu.menu.menu_id }), opId])
  await persistEvent({ eventId: makeId('ev'), venueId, eventType: 'menu.import.completed', entityType: 'import', entityId: opId, actorId: importedBy, payload: { itemsImported } })
  return { ok: true, menu: newMenu.menu, itemsImported, operationId: opId }
}

// ── Handheld Dynamic Menu Feed (foundation for Prompt P) ─────────────────────

/**
 * Returns the active menu, its dynamic categories, and items for handheld POS.
 * No hardcoded categories. Returns whatever the venue configured.
 */
export async function getActiveMenuForHandheld({ venueId, locationId }) {
  if (!isDbAvailable()) return { ok: true, activeMenu: null, categories: [], items: [], localPreview: true, message: 'No active menu configured for this venue.' }
  const menuRow = await query(
    `SELECT * FROM pos360_menus WHERE venue_id = $1 AND is_active_handheld = true AND status = 'active' AND deleted_at IS NULL ORDER BY display_order ASC LIMIT 1`,
    [venueId]
  )
  const menu = menuRow.rows[0]
  if (!menu) return { ok: true, activeMenu: null, categories: [], items: [], localPreview: false, message: 'No active menu configured for this venue.' }
  const [catsRow, itemsRow] = await Promise.all([
    query(`SELECT * FROM pos360_menu_categories WHERE menu_id = $1 AND is_active = true AND deleted_at IS NULL ORDER BY display_order ASC`, [menu.menu_id]),
    query(`SELECT * FROM pos360_menu_items WHERE menu_id = $1 AND is_active = true AND status = 'active' AND deleted_at IS NULL ORDER BY category_id, display_order ASC`, [menu.menu_id]),
  ])
  return { ok: true, activeMenu: menu, categories: catsRow.rows, items: itemsRow.rows }
}

export async function getHandheldCategories({ venueId, menuId }) {
  return listCategories({ venueId, menuId })
}

export async function getHandheldItemsByCategory({ venueId, menuId, categoryId }) {
  return listItems({ venueId, menuId, categoryId })
}

export async function searchMenuItems({ venueId, query: searchQuery, menuId }) {
  if (!isDbAvailable()) return { ok: true, items: [], localPreview: true }
  const vals = [venueId, `%${searchQuery}%`]
  let sql = `SELECT * FROM pos360_menu_items WHERE venue_id = $1 AND (item_name ILIKE $2 OR item_description ILIKE $2) AND is_active = true AND deleted_at IS NULL`
  if (menuId) { vals.push(menuId); sql += ` AND menu_id = $${vals.length}` }
  sql += ` ORDER BY item_name ASC LIMIT 50`
  return { ok: true, items: (await query(sql, vals)).rows }
}

export async function getItemDetail({ itemId, venueId }) {
  if (!isDbAvailable()) return { ok: true, item: null, localPreview: true }
  const [item, photos, modGroups, addons, routing] = await Promise.all([
    getItem({ itemId, venueId }),
    query(`SELECT * FROM pos360_menu_item_photos WHERE item_id = $1 AND deleted_at IS NULL ORDER BY display_order ASC`, [itemId]),
    query(`SELECT mg.* FROM pos360_menu_modifier_groups mg JOIN pos360_menu_item_modifier_groups img ON img.group_id = mg.group_id WHERE img.item_id = $1 ORDER BY img.display_order ASC`, [itemId]),
    listAddons({ venueId, itemId }),
    resolveItemRouting({ itemId, venueId }),
  ])
  return {
    ok: true,
    item: item.item,
    photos: photos.rows,
    modifierGroups: modGroups.rows,
    addons: addons.addons,
    routing: routing.routing,
    localPreview: item.localPreview ?? false,
  }
}

export async function resolveItemPriceAndTax({ itemId, venueId, ruleContext = {} }) {
  const [pricing, tax] = await Promise.all([
    resolveActivePrice({ itemId, venueId, ruleContext }),
    resolveTaxForItem({ itemId, venueId }),
  ])
  return { ok: true, price: pricing.price, ruleApplied: pricing.ruleApplied, ruleType: pricing.ruleType, taxRate: tax.totalRate, taxRules: tax.rules }
}
