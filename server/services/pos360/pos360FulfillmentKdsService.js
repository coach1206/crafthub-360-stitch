/**
 * POS360 Fulfillment KDS Service — Kitchen, Bar, Humidor Fulfillment, KDS Queues,
 * Order Routing, Production Stations, Course Firing, Staff Routing, Handoffs,
 * E.A.T. Operational Visibility & SmokeCraft Humidor Visibility.
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js';

const AREA = 'pos360-fulfillment-kds';
const LOCAL = (extra = {}) => ({ ok: false, localPreview: true, error: 'database_not_configured', area: AREA, ...extra });

async function writeAudit(venueId, actorUserId, action, entityType, entityId, opts = {}) {
  if (!isDbAvailable()) return;
  await query(
    `INSERT INTO pos360_production_audit
       (venue_id, actor_user_id, action, entity_type, entity_id,
        before_snapshot, after_snapshot, reason,
        contains_secrets, stores_secrets, exposes_private_data, exposes_financial_data)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,FALSE,$9,$10)`,
    [
      venueId, actorUserId, action, entityType, entityId,
      JSON.stringify(opts.before || {}),
      JSON.stringify(opts.after || {}),
      opts.reason || null,
      opts.exposes_private_data !== false,
      opts.exposes_financial_data === true,
    ]
  ).catch(() => {});
}

async function writeKdsHistory(venueId, queueRecordId, ticketItemId, oldStatus, newStatus, changedBy, reason) {
  if (!isDbAvailable()) return;
  await query(
    `INSERT INTO pos360_kds_queue_item_status_history
       (venue_id, queue_record_id, ticket_item_id, old_status, new_status, changed_by, reason)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [venueId, queueRecordId, ticketItemId, oldStatus, newStatus, changedBy, reason]
  ).catch(() => {});
}

function dupCheck(table, venueId, idempotencyKey) {
  return query(
    `SELECT id FROM ${table} WHERE idempotency_key=$1 AND venue_id=$2`,
    [idempotencyKey, venueId]
  );
}

// ── Station Profiles ─────────────────────────────────────────────────────────

export async function createStationProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_fulfillment_station_profiles', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { station_name, station_type, station_status = 'draft', metadata } = payload;
  const r = await query(
    `INSERT INTO pos360_fulfillment_station_profiles
       (venue_id, station_name, station_type, station_status,
        printer_connected, kds_connected, metadata, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,FALSE,FALSE,$5,$6,$7) RETURNING id`,
    [venueId, station_name, station_type, station_status, JSON.stringify(metadata || {}), idempotencyKey || null, actorUserId]
  );
  await writeAudit(venueId, actorUserId, 'create_station_profile', 'station', r.rows[0].id, {
    after: { station_name, station_type, printer_connected: false, kds_connected: false },
  });
  return { ok: true, id: r.rows[0].id, printer_connected: false, kds_connected: false };
}

export async function getStationProfile({ venueId, stationId }) {
  if (!isDbAvailable()) return LOCAL({ station: null });
  const r = await query('SELECT * FROM pos360_fulfillment_station_profiles WHERE id=$1 AND venue_id=$2', [stationId, venueId]);
  return { ok: true, station: r.rows[0] || null };
}

export async function listStationProfiles({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ stations: [] });
  const r = await query('SELECT * FROM pos360_fulfillment_station_profiles WHERE venue_id=$1 ORDER BY created_at DESC', [venueId]);
  return { ok: true, stations: r.rows };
}

export async function updateStationStatus({ venueId, stationId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_fulfillment_station_profiles', venueId, idempotencyKey);
    if (d.rows.length && d.rows[0].id === stationId) return { ok: true, duplicate: true };
  }
  await query('UPDATE pos360_fulfillment_station_profiles SET station_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 AND venue_id=$4',
    [status, actorUserId, stationId, venueId]);
  await writeAudit(venueId, actorUserId, 'update_station_status', 'station', stationId, { after: { status }, reason });
  return { ok: true };
}

export async function createStationCapability({ venueId, stationId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_fulfillment_station_capabilities', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { capability_key, capability_group, supported_status = 'unknown' } = payload;
  const r = await query(
    `INSERT INTO pos360_fulfillment_station_capabilities
       (venue_id, station_id, capability_key, capability_group, supported_status, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (venue_id, station_id, capability_key) DO UPDATE
       SET supported_status=EXCLUDED.supported_status, updated_at=NOW()
     RETURNING id`,
    [venueId, stationId, capability_key, capability_group, supported_status, idempotencyKey || null]
  );
  await writeAudit(venueId, actorUserId, 'create_station_capability', 'capability', r.rows[0].id);
  return { ok: true, id: r.rows[0].id };
}

export async function listStationCapabilities({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ capabilities: [] });
  const r = await query('SELECT * FROM pos360_fulfillment_station_capabilities WHERE venue_id=$1', [venueId]);
  return { ok: true, capabilities: r.rows };
}

// ── Item Routing Rules ────────────────────────────────────────────────────────

export async function createItemRoutingRule({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_item_routing_rules', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { rule_name, rule_type, source_match_payload, target_station_id, priority = 0 } = payload;
  const r = await query(
    `INSERT INTO pos360_item_routing_rules
       (venue_id, rule_name, rule_type, source_match_payload, target_station_id, priority, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
    [venueId, rule_name, rule_type, JSON.stringify(source_match_payload || {}), target_station_id || null, priority, idempotencyKey || null, actorUserId]
  );
  await writeAudit(venueId, actorUserId, 'create_item_routing_rule', 'routing_rule', r.rows[0].id);
  return { ok: true, id: r.rows[0].id };
}

export async function listItemRoutingRules({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ rules: [] });
  const r = await query('SELECT * FROM pos360_item_routing_rules WHERE venue_id=$1 ORDER BY priority DESC', [venueId]);
  return { ok: true, rules: r.rows };
}

export async function updateItemRoutingRule({ venueId, routingRuleId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_item_routing_rules', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  const { rule_name, rule_type, source_match_payload, target_station_id, priority, active } = payload;
  await query(
    `UPDATE pos360_item_routing_rules SET
       rule_name=COALESCE($1,rule_name), rule_type=COALESCE($2,rule_type),
       source_match_payload=COALESCE($3,source_match_payload),
       target_station_id=COALESCE($4,target_station_id),
       priority=COALESCE($5,priority), active=COALESCE($6,active),
       updated_at=NOW(), updated_by=$7
     WHERE id=$8 AND venue_id=$9`,
    [rule_name, rule_type, source_match_payload ? JSON.stringify(source_match_payload) : null,
     target_station_id, priority, active, actorUserId, routingRuleId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_item_routing_rule', 'routing_rule', routingRuleId);
  return { ok: true };
}

// ── Production Tickets ────────────────────────────────────────────────────────

export async function createProductionTicketPlaceholder({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_order_production_tickets', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const {
    order_id, order_source = 'manual', ticket_number,
    table_id, section_id, reservation_id, waitlist_entry_id,
    private_event_id, package_selection_id, guest_profile_id, customer_id, payment_record_id, staff_profile_id,
  } = payload;
  const r = await query(
    `INSERT INTO pos360_order_production_tickets
       (venue_id, order_id, order_source, ticket_number,
        table_id, section_id, reservation_id, waitlist_entry_id,
        private_event_id, package_selection_id, guest_profile_id, customer_id,
        payment_record_id, staff_profile_id,
        ticket_status, generated_from_real_order, external_sync_completed, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'received_placeholder',FALSE,FALSE,$15,$16)
     RETURNING id`,
    [venueId, order_id||null, order_source, ticket_number||null,
     table_id||null, section_id||null, reservation_id||null, waitlist_entry_id||null,
     private_event_id||null, package_selection_id||null, guest_profile_id||null, customer_id||null,
     payment_record_id||null, staff_profile_id||null, idempotencyKey||null, actorUserId]
  );
  await writeAudit(venueId, actorUserId, 'create_production_ticket', 'ticket', r.rows[0].id, {
    after: { order_source, generated_from_real_order: false, external_sync_completed: false },
    exposes_private_data: true, exposes_financial_data: true,
  });
  return { ok: true, id: r.rows[0].id, generated_from_real_order: false, external_sync_completed: false };
}

export async function getProductionTicket({ venueId, ticketId }) {
  if (!isDbAvailable()) return LOCAL({ ticket: null });
  const r = await query('SELECT * FROM pos360_order_production_tickets WHERE id=$1 AND venue_id=$2', [ticketId, venueId]);
  return { ok: true, ticket: r.rows[0] || null };
}

export async function listProductionTickets({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ tickets: [] });
  const r = await query('SELECT * FROM pos360_order_production_tickets WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100', [venueId]);
  return { ok: true, tickets: r.rows };
}

export async function updateProductionTicketStatus({ venueId, ticketId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_order_production_tickets', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  await query('UPDATE pos360_order_production_tickets SET ticket_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 AND venue_id=$4',
    [status, actorUserId, ticketId, venueId]);
  await writeAudit(venueId, actorUserId, 'update_ticket_status', 'ticket', ticketId, { after: { status }, reason });
  return { ok: true };
}

export async function createProductionTicketItem({ venueId, ticketId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_order_production_ticket_items', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const {
    order_item_id, item_name, item_category, item_type = 'food',
    station_id, course_label, quantity = 1, modifier_payload, allergy_notes, prep_notes, inventory_item_id,
  } = payload;
  const r = await query(
    `INSERT INTO pos360_order_production_ticket_items
       (venue_id, ticket_id, order_item_id, item_name, item_category, item_type,
        item_status, station_id, course_label, quantity,
        modifier_payload, allergy_notes, prep_notes, inventory_item_id,
        inventory_deducted, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'new',$7,$8,$9,$10,$11,$12,$13,FALSE,$14,$15)
     RETURNING id`,
    [venueId, ticketId, order_item_id||null, item_name, item_category||null, item_type,
     station_id||null, course_label||null, quantity,
     JSON.stringify(modifier_payload||{}), allergy_notes||null, prep_notes||null, inventory_item_id||null,
     idempotencyKey||null, actorUserId]
  );
  await writeAudit(venueId, actorUserId, 'create_ticket_item', 'ticket_item', r.rows[0].id, {
    after: { item_type, inventory_deducted: false },
  });
  return { ok: true, id: r.rows[0].id, inventory_deducted: false };
}

export async function listProductionTicketItems({ venueId, ticketId }) {
  if (!isDbAvailable()) return LOCAL({ items: [] });
  const r = await query('SELECT * FROM pos360_order_production_ticket_items WHERE venue_id=$1 AND ticket_id=$2', [venueId, ticketId]);
  return { ok: true, items: r.rows };
}

export async function updateProductionTicketItemStatus({ venueId, ticketItemId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_order_production_ticket_items', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  const old = await query('SELECT item_status FROM pos360_order_production_ticket_items WHERE id=$1', [ticketItemId]);
  const oldStatus = old.rows[0]?.item_status;
  await query('UPDATE pos360_order_production_ticket_items SET item_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 AND venue_id=$4',
    [status, actorUserId, ticketItemId, venueId]);
  await writeAudit(venueId, actorUserId, 'update_ticket_item_status', 'ticket_item', ticketItemId,
    { before: { item_status: oldStatus }, after: { item_status: status }, reason });
  return { ok: true };
}

// ── KDS Queue Records ─────────────────────────────────────────────────────────

export async function createKdsQueueRecord({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_kds_queue_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { station_id, ticket_id, ticket_item_id, queue_type, priority = 'normal', assigned_staff_profile_id } = payload;
  const r = await query(
    `INSERT INTO pos360_kds_queue_records
       (venue_id, station_id, ticket_id, ticket_item_id, queue_type,
        queue_status, priority, assigned_staff_profile_id,
        external_sync_completed, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,'queued',$6,$7,FALSE,$8,$9) RETURNING id`,
    [venueId, station_id, ticket_id, ticket_item_id||null, queue_type,
     priority, assigned_staff_profile_id||null, idempotencyKey||null, actorUserId]
  );
  await writeKdsHistory(venueId, r.rows[0].id, ticket_item_id, null, 'queued', actorUserId, 'created');
  await writeAudit(venueId, actorUserId, 'create_kds_queue_record', 'kds_queue', r.rows[0].id,
    { after: { queue_type, external_sync_completed: false } });
  return { ok: true, id: r.rows[0].id, external_sync_completed: false };
}

export async function listKdsQueueRecords({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ records: [] });
  const r = await query('SELECT * FROM pos360_kds_queue_records WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 200', [venueId]);
  return { ok: true, records: r.rows };
}

export async function updateKdsQueueStatus({ venueId, queueRecordId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_kds_queue_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  const old = await query('SELECT queue_status, ticket_item_id FROM pos360_kds_queue_records WHERE id=$1', [queueRecordId]);
  const oldRow = old.rows[0] || {};
  const updates = { queue_status: status };
  if (status === 'acknowledged') updates.acknowledged_at = 'NOW()';
  if (status === 'ready') updates.ready_at = 'NOW()';
  if (status === 'served') updates.served_at = 'NOW()';
  await query(`UPDATE pos360_kds_queue_records SET queue_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 AND venue_id=$4`,
    [status, actorUserId, queueRecordId, venueId]);
  await writeKdsHistory(venueId, queueRecordId, oldRow.ticket_item_id, oldRow.queue_status, status, actorUserId, reason);
  await writeAudit(venueId, actorUserId, 'update_kds_queue_status', 'kds_queue', queueRecordId,
    { before: { queue_status: oldRow.queue_status }, after: { queue_status: status }, reason });
  return { ok: true };
}

export async function updateKdsQueuePriority({ venueId, queueRecordId, priority, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_kds_queue_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  await query('UPDATE pos360_kds_queue_records SET priority=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 AND venue_id=$4',
    [priority, actorUserId, queueRecordId, venueId]);
  await writeAudit(venueId, actorUserId, 'update_kds_priority', 'kds_queue', queueRecordId, { after: { priority }, reason });
  return { ok: true };
}

// ── Course Fire Controls ──────────────────────────────────────────────────────

export async function createCourseFireControl({ venueId, ticketId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_course_fire_controls', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { course_label, fire_status = 'hold', fire_reason } = payload;
  const r = await query(
    `INSERT INTO pos360_course_fire_controls
       (venue_id, ticket_id, course_label, fire_status, fire_reason,
        requested_by_staff_profile_id, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [venueId, ticketId, course_label, fire_status, fire_reason||null, actorUserId, idempotencyKey||null]
  );
  await writeAudit(venueId, actorUserId, 'create_course_fire_control', 'course_fire', r.rows[0].id,
    { after: { course_label, fire_status } });
  return { ok: true, id: r.rows[0].id };
}

export async function listCourseFireControls({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ controls: [] });
  const r = await query('SELECT * FROM pos360_course_fire_controls WHERE venue_id=$1 ORDER BY created_at DESC', [venueId]);
  return { ok: true, controls: r.rows };
}

export async function updateCourseFireStatus({ venueId, fireControlId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_course_fire_controls', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  await query('UPDATE pos360_course_fire_controls SET fire_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3',
    [status, fireControlId, venueId]);
  await writeAudit(venueId, actorUserId, 'update_course_fire_status', 'course_fire', fireControlId,
    { after: { fire_status: status }, reason });
  return { ok: true };
}

// ── Station Staff Assignments ─────────────────────────────────────────────────

export async function createStationStaffAssignment({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_station_staff_assignments', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { station_id, staff_profile_id, assignment_role } = payload;
  const r = await query(
    `INSERT INTO pos360_station_staff_assignments
       (venue_id, station_id, staff_profile_id, assignment_role, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [venueId, station_id, staff_profile_id||null, assignment_role||null, idempotencyKey||null, actorUserId]
  );
  await writeAudit(venueId, actorUserId, 'create_station_staff_assignment', 'station_assignment', r.rows[0].id,
    { after: { station_id, staff_profile_id }, exposes_private_data: true });
  return { ok: true, id: r.rows[0].id };
}

export async function listStationStaffAssignments({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ assignments: [] });
  const r = await query('SELECT * FROM pos360_station_staff_assignments WHERE venue_id=$1 AND active=TRUE', [venueId]);
  return { ok: true, assignments: r.rows };
}

// ── Production Handoffs ───────────────────────────────────────────────────────

export async function createProductionHandoff({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_production_handoff_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { ticket_id, ticket_item_id, handoff_type, from_staff_profile_id, to_staff_profile_id,
          private_event_id, reservation_id, table_id, handoff_notes } = payload;
  const r = await query(
    `INSERT INTO pos360_production_handoff_records
       (venue_id, ticket_id, ticket_item_id, handoff_type, handoff_status,
        from_staff_profile_id, to_staff_profile_id, private_event_id,
        reservation_id, table_id, handoff_notes, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,'pending',$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
    [venueId, ticket_id, ticket_item_id||null, handoff_type,
     from_staff_profile_id||null, to_staff_profile_id||null, private_event_id||null,
     reservation_id||null, table_id||null, handoff_notes||null, idempotencyKey||null, actorUserId]
  );
  await writeAudit(venueId, actorUserId, 'create_production_handoff', 'handoff', r.rows[0].id,
    { after: { handoff_type, handoff_status: 'pending' }, exposes_private_data: true });
  return { ok: true, id: r.rows[0].id };
}

export async function listProductionHandoffs({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ handoffs: [] });
  const r = await query('SELECT * FROM pos360_production_handoff_records WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100', [venueId]);
  return { ok: true, handoffs: r.rows };
}

export async function updateProductionHandoffStatus({ venueId, handoffId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_production_handoff_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  await query('UPDATE pos360_production_handoff_records SET handoff_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 AND venue_id=$4',
    [status, actorUserId, handoffId, venueId]);
  await writeAudit(venueId, actorUserId, 'update_handoff_status', 'handoff', handoffId, { after: { handoff_status: status }, reason });
  return { ok: true };
}

// ── Item Unavailable Records ──────────────────────────────────────────────────

export async function createItemUnavailableRecord({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_item_unavailable_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { ticket_item_id, inventory_item_id, unavailable_reason } = payload;
  const r = await query(
    `INSERT INTO pos360_item_unavailable_records
       (venue_id, ticket_item_id, inventory_item_id, unavailable_reason,
        unavailable_status, reported_by_staff_profile_id, inventory_deducted, idempotency_key)
     VALUES ($1,$2,$3,$4,'reported',$5,FALSE,$6) RETURNING id`,
    [venueId, ticket_item_id||null, inventory_item_id||null, unavailable_reason||null, actorUserId, idempotencyKey||null]
  );
  await writeAudit(venueId, actorUserId, 'create_item_unavailable', 'item_unavailable', r.rows[0].id,
    { after: { inventory_deducted: false } });
  return { ok: true, id: r.rows[0].id, inventory_deducted: false };
}

export async function listItemUnavailableRecords({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ records: [] });
  const r = await query('SELECT * FROM pos360_item_unavailable_records WHERE venue_id=$1 ORDER BY created_at DESC', [venueId]);
  return { ok: true, records: r.rows };
}

// ── Manager Overrides ─────────────────────────────────────────────────────────

export async function createProductionManagerOverride({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_production_manager_overrides', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { override_type, entity_type, entity_id, reason, before_snapshot } = payload;
  const r = await query(
    `INSERT INTO pos360_production_manager_overrides
       (venue_id, override_type, entity_type, entity_id, override_status,
        requested_by_staff_profile_id, reason, before_snapshot, idempotency_key)
     VALUES ($1,$2,$3,$4,'pending_manager_approval',$5,$6,$7,$8) RETURNING id`,
    [venueId, override_type, entity_type, entity_id||null, actorUserId,
     reason||null, JSON.stringify(before_snapshot||{}), idempotencyKey||null]
  );
  await writeAudit(venueId, actorUserId, 'create_manager_override', 'override', r.rows[0].id,
    { after: { override_type, override_status: 'pending_manager_approval' }, exposes_financial_data: true });
  return { ok: true, id: r.rows[0].id, override_status: 'pending_manager_approval' };
}

export async function decideProductionManagerOverride({ venueId, overrideId, managerUserId, decision, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_production_manager_overrides', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  const status = decision === 'approve' ? 'approved' : 'rejected';
  await query(
    'UPDATE pos360_production_manager_overrides SET override_status=$1, manager_approved_by=$2, updated_at=NOW() WHERE id=$3 AND venue_id=$4',
    [status, managerUserId, overrideId, venueId]
  );
  await writeAudit(venueId, managerUserId, 'decide_manager_override', 'override', overrideId,
    { after: { override_status: status }, reason, exposes_financial_data: true });
  return { ok: true, override_status: status };
}

// ── Refire / Rush / Delay ─────────────────────────────────────────────────────

export async function createProductionRefire({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_production_refire_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { ticket_id, ticket_item_id, station_id, refire_reason } = payload;
  const r = await query(
    `INSERT INTO pos360_production_refire_records
       (venue_id, ticket_id, ticket_item_id, station_id, refire_reason,
        requested_by_staff_profile_id, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [venueId, ticket_id, ticket_item_id||null, station_id||null, refire_reason||null, actorUserId, idempotencyKey||null]
  );
  await writeAudit(venueId, actorUserId, 'create_refire', 'refire', r.rows[0].id);
  return { ok: true, id: r.rows[0].id };
}

export async function listProductionRefires({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ refires: [] });
  const r = await query('SELECT * FROM pos360_production_refire_records WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100', [venueId]);
  return { ok: true, refires: r.rows };
}

export async function createProductionRushDelay({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_production_rush_delay_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { ticket_id, ticket_item_id, action_type, reason } = payload;
  const r = await query(
    `INSERT INTO pos360_production_rush_delay_records
       (venue_id, ticket_id, ticket_item_id, action_type, reason,
        requested_by_staff_profile_id, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [venueId, ticket_id, ticket_item_id||null, action_type, reason||null, actorUserId, idempotencyKey||null]
  );
  await writeAudit(venueId, actorUserId, 'create_rush_delay', 'rush_delay', r.rows[0].id, { after: { action_type } });
  return { ok: true, id: r.rows[0].id };
}

export async function listProductionRushDelayRecords({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ records: [] });
  const r = await query('SELECT * FROM pos360_production_rush_delay_records WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100', [venueId]);
  return { ok: true, records: r.rows };
}

// ── Order Handoffs ────────────────────────────────────────────────────────────

export async function createGuestSelfOrderHandoffPlaceholder({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_guest_self_order_handoff_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { order_id, ticket_id, guest_profile_id, customer_id, table_id, reservation_id, payment_record_id } = payload;
  const r = await query(
    `INSERT INTO pos360_guest_self_order_handoff_records
       (venue_id, order_id, ticket_id, guest_profile_id, customer_id,
        table_id, reservation_id, payment_record_id, handoff_status,
        generated_from_real_order, external_sync_completed, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending',FALSE,FALSE,$9) RETURNING id`,
    [venueId, order_id||null, ticket_id||null, guest_profile_id||null, customer_id||null,
     table_id||null, reservation_id||null, payment_record_id||null, idempotencyKey||null]
  );
  await writeAudit(venueId, actorUserId, 'create_guest_self_order_handoff', 'guest_self_order_handoff', r.rows[0].id,
    { after: { generated_from_real_order: false }, exposes_private_data: true, exposes_financial_data: true });
  return { ok: true, id: r.rows[0].id, generated_from_real_order: false, external_sync_completed: false };
}

export async function listGuestSelfOrderHandoffs({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ handoffs: [] });
  const r = await query('SELECT * FROM pos360_guest_self_order_handoff_records WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100', [venueId]);
  return { ok: true, handoffs: r.rows };
}

export async function createServerOrderHandoffPlaceholder({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_server_order_handoff_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { order_id, ticket_id, staff_profile_id, table_id, section_id, reservation_id,
          waitlist_entry_id, private_event_id, package_selection_id, payment_record_id } = payload;
  const r = await query(
    `INSERT INTO pos360_server_order_handoff_records
       (venue_id, order_id, ticket_id, staff_profile_id, table_id, section_id,
        reservation_id, waitlist_entry_id, private_event_id, package_selection_id,
        payment_record_id, handoff_status, generated_from_real_order, external_sync_completed, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'pending',FALSE,FALSE,$12) RETURNING id`,
    [venueId, order_id||null, ticket_id||null, staff_profile_id||null, table_id||null,
     section_id||null, reservation_id||null, waitlist_entry_id||null, private_event_id||null,
     package_selection_id||null, payment_record_id||null, idempotencyKey||null]
  );
  await writeAudit(venueId, actorUserId, 'create_server_order_handoff', 'server_order_handoff', r.rows[0].id,
    { after: { generated_from_real_order: false }, exposes_private_data: true, exposes_financial_data: true });
  return { ok: true, id: r.rows[0].id, generated_from_real_order: false };
}

export async function listServerOrderHandoffs({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ handoffs: [] });
  const r = await query('SELECT * FROM pos360_server_order_handoff_records WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100', [venueId]);
  return { ok: true, handoffs: r.rows };
}

// ── Humidor Fulfillment ───────────────────────────────────────────────────────

export async function createHumidorFulfillmentRecord({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_humidor_fulfillment_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { ticket_id, ticket_item_id, humidor_station_id, staff_profile_id, cigar_name, cigar_sku,
          pairing_recommendation_id, smokecraft_session_id, smokecraft_guest_link_id, inventory_item_id } = payload;
  const r = await query(
    `INSERT INTO pos360_humidor_fulfillment_records
       (venue_id, ticket_id, ticket_item_id, humidor_station_id, staff_profile_id,
        cigar_name, cigar_sku, pairing_recommendation_id, smokecraft_session_id,
        smokecraft_guest_link_id, fulfillment_status, inventory_item_id,
        inventory_deducted, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'queued',$11,FALSE,$12,$13) RETURNING id`,
    [venueId, ticket_id, ticket_item_id, humidor_station_id||null, staff_profile_id||null,
     cigar_name, cigar_sku||null, pairing_recommendation_id||null,
     smokecraft_session_id||null, smokecraft_guest_link_id||null,
     inventory_item_id||null, idempotencyKey||null, actorUserId]
  );
  await writeAudit(venueId, actorUserId, 'create_humidor_fulfillment', 'humidor_fulfillment', r.rows[0].id,
    { after: { cigar_name, inventory_deducted: false }, exposes_private_data: true });
  return { ok: true, id: r.rows[0].id, inventory_deducted: false };
}

export async function listHumidorFulfillmentRecords({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ records: [] });
  const r = await query('SELECT * FROM pos360_humidor_fulfillment_records WHERE venue_id=$1 ORDER BY created_at DESC', [venueId]);
  return { ok: true, records: r.rows };
}

export async function updateHumidorFulfillmentStatus({ venueId, humidorFulfillmentId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_humidor_fulfillment_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  await query('UPDATE pos360_humidor_fulfillment_records SET fulfillment_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 AND venue_id=$4',
    [status, actorUserId, humidorFulfillmentId, venueId]);
  await writeAudit(venueId, actorUserId, 'update_humidor_fulfillment', 'humidor_fulfillment', humidorFulfillmentId,
    { after: { fulfillment_status: status }, reason });
  return { ok: true };
}

// ── Bar Fulfillment ───────────────────────────────────────────────────────────

export async function createBarFulfillmentRecord({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_bar_fulfillment_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { ticket_id, ticket_item_id, bar_station_id, staff_profile_id, drink_name, inventory_item_id } = payload;
  const r = await query(
    `INSERT INTO pos360_bar_fulfillment_records
       (venue_id, ticket_id, ticket_item_id, bar_station_id, staff_profile_id,
        drink_name, fulfillment_status, inventory_item_id,
        inventory_deducted, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'queued',$7,FALSE,$8,$9) RETURNING id`,
    [venueId, ticket_id, ticket_item_id, bar_station_id||null, staff_profile_id||null,
     drink_name, inventory_item_id||null, idempotencyKey||null, actorUserId]
  );
  await writeAudit(venueId, actorUserId, 'create_bar_fulfillment', 'bar_fulfillment', r.rows[0].id,
    { after: { drink_name, inventory_deducted: false } });
  return { ok: true, id: r.rows[0].id, inventory_deducted: false };
}

export async function listBarFulfillmentRecords({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ records: [] });
  const r = await query('SELECT * FROM pos360_bar_fulfillment_records WHERE venue_id=$1 ORDER BY created_at DESC', [venueId]);
  return { ok: true, records: r.rows };
}

export async function updateBarFulfillmentStatus({ venueId, barFulfillmentId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_bar_fulfillment_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  await query('UPDATE pos360_bar_fulfillment_records SET fulfillment_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 AND venue_id=$4',
    [status, actorUserId, barFulfillmentId, venueId]);
  await writeAudit(venueId, actorUserId, 'update_bar_fulfillment', 'bar_fulfillment', barFulfillmentId,
    { after: { fulfillment_status: status }, reason });
  return { ok: true };
}

// ── Kitchen Fulfillment ───────────────────────────────────────────────────────

export async function createKitchenFulfillmentRecord({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_kitchen_fulfillment_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { ticket_id, ticket_item_id, kitchen_station_id, staff_profile_id, food_item_name, allergy_notes, inventory_item_id } = payload;
  const r = await query(
    `INSERT INTO pos360_kitchen_fulfillment_records
       (venue_id, ticket_id, ticket_item_id, kitchen_station_id, staff_profile_id,
        food_item_name, fulfillment_status, allergy_notes, inventory_item_id,
        inventory_deducted, idempotency_key, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,'queued',$7,$8,FALSE,$9,$10) RETURNING id`,
    [venueId, ticket_id, ticket_item_id, kitchen_station_id||null, staff_profile_id||null,
     food_item_name, allergy_notes||null, inventory_item_id||null, idempotencyKey||null, actorUserId]
  );
  await writeAudit(venueId, actorUserId, 'create_kitchen_fulfillment', 'kitchen_fulfillment', r.rows[0].id,
    { after: { food_item_name, inventory_deducted: false }, exposes_private_data: true });
  return { ok: true, id: r.rows[0].id, inventory_deducted: false };
}

export async function listKitchenFulfillmentRecords({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ records: [] });
  const r = await query('SELECT * FROM pos360_kitchen_fulfillment_records WHERE venue_id=$1 ORDER BY created_at DESC', [venueId]);
  return { ok: true, records: r.rows };
}

export async function updateKitchenFulfillmentStatus({ venueId, kitchenFulfillmentId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_kitchen_fulfillment_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  await query('UPDATE pos360_kitchen_fulfillment_records SET fulfillment_status=$1, updated_at=NOW(), updated_by=$2 WHERE id=$3 AND venue_id=$4',
    [status, actorUserId, kitchenFulfillmentId, venueId]);
  await writeAudit(venueId, actorUserId, 'update_kitchen_fulfillment', 'kitchen_fulfillment', kitchenFulfillmentId,
    { after: { fulfillment_status: status }, reason });
  return { ok: true };
}

// ── External KDS Providers ────────────────────────────────────────────────────

export async function createExternalKdsProviderProfile({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_external_kds_provider_profiles', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { provider_key, provider_name, sync_run_id, provider_profile_id, capability_payload, metadata } = payload;
  const r = await query(
    `INSERT INTO pos360_external_kds_provider_profiles
       (venue_id, provider_key, provider_name, provider_status,
        provider_connected, kds_connected, printer_connected,
        stores_secrets, contains_secrets,
        sync_run_id, provider_profile_id,
        capability_payload, metadata, idempotency_key)
     VALUES ($1,$2,$3,'not_connected',FALSE,FALSE,FALSE,FALSE,FALSE,$4,$5,$6,$7,$8)
     ON CONFLICT (venue_id, provider_key) DO UPDATE
       SET provider_name=EXCLUDED.provider_name, updated_at=NOW()
     RETURNING id`,
    [venueId, provider_key, provider_name, sync_run_id||null, provider_profile_id||null,
     JSON.stringify(capability_payload||{}), JSON.stringify(metadata||{}), idempotencyKey||null]
  );
  await writeAudit(venueId, actorUserId, 'create_external_kds_provider', 'kds_provider', r.rows[0].id,
    { after: { provider_connected: false, kds_connected: false, printer_connected: false, stores_secrets: false } });
  return { ok: true, id: r.rows[0].id, provider_connected: false, kds_connected: false, printer_connected: false };
}

export async function listExternalKdsProviderProfiles({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ providers: [] });
  const r = await query('SELECT * FROM pos360_external_kds_provider_profiles WHERE venue_id=$1', [venueId]);
  return { ok: true, providers: r.rows };
}

export async function updateExternalKdsProviderStatus({ venueId, providerProfileId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_external_kds_provider_profiles', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true };
  }
  await query('UPDATE pos360_external_kds_provider_profiles SET provider_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3',
    [status, providerProfileId, venueId]);
  await writeAudit(venueId, actorUserId, 'update_kds_provider_status', 'kds_provider', providerProfileId,
    { after: { provider_status: status }, reason });
  return { ok: true };
}

// ── Production Visibility Insights ────────────────────────────────────────────

export async function createProductionVisibilityInsightPlaceholder({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_production_visibility_insights', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { insight_type, insight_payload, honest_state, source } = payload;
  const r = await query(
    `INSERT INTO pos360_production_visibility_insights
       (venue_id, insight_type, insight_payload, contains_ai_generated_content,
        honest_state, source, idempotency_key)
     VALUES ($1,$2,$3,FALSE,$4,$5,$6) RETURNING id`,
    [venueId, insight_type, JSON.stringify(insight_payload||{}), honest_state||null, source||null, idempotencyKey||null]
  );
  await writeAudit(venueId, actorUserId, 'create_visibility_insight', 'visibility_insight', r.rows[0].id,
    { after: { insight_type, contains_ai_generated_content: false } });
  return { ok: true, id: r.rows[0].id, contains_ai_generated_content: false };
}

export async function listProductionVisibilityInsights({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ insights: [] });
  const r = await query('SELECT * FROM pos360_production_visibility_insights WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100', [venueId]);
  return { ok: true, insights: r.rows };
}

export async function getProductionOperationsSummary({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ summary: null });
  const [tickets, kds, refires] = await Promise.all([
    query('SELECT ticket_status, COUNT(*) FROM pos360_order_production_tickets WHERE venue_id=$1 GROUP BY ticket_status', [venueId]),
    query('SELECT queue_status, COUNT(*) FROM pos360_kds_queue_records WHERE venue_id=$1 GROUP BY queue_status', [venueId]),
    query('SELECT COUNT(*) FROM pos360_production_refire_records WHERE venue_id=$1', [venueId]),
  ]);
  return {
    ok: true,
    summary: {
      tickets_by_status: tickets.rows,
      kds_by_status: kds.rows,
      total_refires: parseInt(refires.rows[0]?.count || 0),
      external_sync_completed: false,
      contains_ai_generated_content: false,
    },
  };
}

// ── Offline Queue ─────────────────────────────────────────────────────────────

export async function queueOfflineProductionAction({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const { operation, actionPayload } = payload;
  const r = await query(
    `INSERT INTO pos360_production_offline_queue (venue_id, operation, payload)
     VALUES ($1,$2,$3) RETURNING id`,
    [venueId, operation, JSON.stringify(actionPayload || {})]
  );
  return { ok: true, id: r.rows[0].id };
}

export async function listOfflineProductionQueue({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ items: [] });
  const r = await query('SELECT * FROM pos360_production_offline_queue WHERE venue_id=$1 AND processed=FALSE ORDER BY created_at ASC', [venueId]);
  return { ok: true, items: r.rows };
}

export async function markOfflineProductionActionSynced({ venueId, offlineActionId, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  await query('UPDATE pos360_production_offline_queue SET processed=TRUE, processed_at=NOW() WHERE id=$1 AND venue_id=$2',
    [offlineActionId, venueId]);
  return { ok: true };
}
