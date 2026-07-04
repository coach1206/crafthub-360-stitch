/**
 * POS360 Self-Ordering Service — Customer Self-Ordering, QR Menus, Handheld POS Flow,
 * Table Ordering, Guest Checkout Handoff, Age Verification, SmokeCraft Self-Order Hooks,
 * E.A.T. Handoffs & Offline Queue.
 * Falls back gracefully when no database connection is configured.
 * Never prints or logs the database connection string.
 */

import { isDbAvailable, query } from '../../db/connection.js';

const AREA = 'pos360-self-ordering';
const LOCAL = (extra = {}) => ({ ok: false, localPreview: true, error: 'database_not_configured', area: AREA, ...extra });

async function writeAudit(venueId, actorUserId, action, entityType, entityId, opts = {}) {
  if (!isDbAvailable()) return;
  await query(
    `INSERT INTO pos360_guest_checkout_audit
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

function dupCheck(table, venueId, idempotencyKey) {
  return query(
    `SELECT id FROM ${table} WHERE idempotency_key=$1 AND venue_id=$2`,
    [idempotencyKey, venueId]
  );
}

// ── QR Menu Sessions ─────────────────────────────────────────────────────────

export async function createQrMenuSession({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_qr_menu_sessions', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { table_id, section_id, qr_code_token, locale = 'en-US', device_type, guest_profile_id, customer_id } = payload;
  const r = await query(
    `INSERT INTO pos360_qr_menu_sessions
       (venue_id, table_id, section_id, qr_code_token, locale, device_type,
        guest_profile_id, customer_id,
        generated_from_real_order, contains_ai_generated_content,
        exposes_private_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,FALSE,TRUE,$9)
     RETURNING *`,
    [venueId, table_id || null, section_id || null, qr_code_token, locale, device_type || null,
     guest_profile_id || null, customer_id || null, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_qr_session', 'qr_menu_session', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, session: r.rows[0] };
}

export async function getQrMenuSession({ venueId, sessionId }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_qr_menu_sessions WHERE id=$1 AND venue_id=$2`, [sessionId, venueId]);
  return { ok: true, session: r.rows[0] || null };
}

export async function listQrMenuSessions({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `SELECT * FROM pos360_qr_menu_sessions WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`,
    [venueId]
  );
  return { ok: true, sessions: r.rows };
}

export async function updateQrMenuSessionStatus({ venueId, sessionId, status, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_qr_menu_sessions SET session_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, sessionId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_qr_session_status', 'qr_menu_session', sessionId, { after: { status } });
  return { ok: true, session: r.rows[0] || null };
}

// ── Self-Order Carts ─────────────────────────────────────────────────────────

export async function createSelfOrderCart({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_self_order_carts', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { qr_session_id, table_id, guest_profile_id, customer_id, locale = 'en-US' } = payload;
  const r = await query(
    `INSERT INTO pos360_self_order_carts
       (venue_id, qr_session_id, table_id, guest_profile_id, customer_id, locale,
        self_order_completed, payment_captured, kds_accepted, inventory_deducted,
        external_sync_completed, age_verified, contains_ai_generated_content,
        exposes_private_data, exposes_financial_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,$7)
     RETURNING *`,
    [venueId, qr_session_id || null, table_id || null, guest_profile_id || null, customer_id || null, locale, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_cart', 'self_order_cart', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, cart: r.rows[0] };
}

export async function getCartById({ venueId, cartId }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_self_order_carts WHERE id=$1 AND venue_id=$2`, [cartId, venueId]);
  return { ok: true, cart: r.rows[0] || null };
}

export async function listSelfOrderCarts({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `SELECT * FROM pos360_self_order_carts WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`,
    [venueId]
  );
  return { ok: true, carts: r.rows };
}

export async function updateCartStatus({ venueId, cartId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_self_order_carts SET cart_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, cartId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_cart_status', 'self_order_cart', cartId, { after: { status }, reason });
  return { ok: true, cart: r.rows[0] || null };
}

// ── Cart Items ───────────────────────────────────────────────────────────────

export async function addCartItem({ venueId, cartId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_self_order_cart_items', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { menu_item_id, inventory_item_id, item_name, item_type = 'food', quantity = 1,
    unit_price_cents = 0, modifier_snapshot, special_instructions, requires_age_verification = false } = payload;
  const r = await query(
    `INSERT INTO pos360_self_order_cart_items
       (venue_id, cart_id, menu_item_id, inventory_item_id, item_name, item_type,
        quantity, unit_price_cents, modifier_snapshot, special_instructions,
        requires_age_verification, age_verified, inventory_deducted, kds_accepted, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,FALSE,FALSE,FALSE,$12)
     RETURNING *`,
    [venueId, cartId, menu_item_id || null, inventory_item_id || null, item_name, item_type,
     quantity, unit_price_cents, modifier_snapshot ? JSON.stringify(modifier_snapshot) : null,
     special_instructions || null, requires_age_verification, idempotencyKey]
  );
  return { ok: true, item: r.rows[0] };
}

export async function listCartItems({ venueId, cartId }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_self_order_cart_items WHERE cart_id=$1 AND venue_id=$2 ORDER BY created_at ASC`, [cartId, venueId]);
  return { ok: true, items: r.rows };
}

export async function updateCartItemStatus({ venueId, cartItemId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_self_order_cart_items SET item_status=$1 WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, cartItemId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_cart_item_status', 'cart_item', cartItemId, { after: { status }, reason });
  return { ok: true, item: r.rows[0] || null };
}

// ── Self-Order Submissions ───────────────────────────────────────────────────

export async function createSelfOrderSubmission({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_self_order_submissions', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { cart_id, table_id, guest_profile_id, customer_id, qr_session_id } = payload;
  const r = await query(
    `INSERT INTO pos360_self_order_submissions
       (venue_id, cart_id, table_id, guest_profile_id, customer_id, qr_session_id,
        staff_acknowledged, kds_accepted, self_order_completed, payment_captured,
        inventory_deducted, external_sync_completed, contains_ai_generated_content,
        exposes_private_data, exposes_financial_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,$7)
     RETURNING *`,
    [venueId, cart_id, table_id || null, guest_profile_id || null, customer_id || null, qr_session_id || null, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_submission', 'self_order_submission', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, submission: r.rows[0] };
}

export async function getSubmission({ venueId, submissionId }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_self_order_submissions WHERE id=$1 AND venue_id=$2`, [submissionId, venueId]);
  return { ok: true, submission: r.rows[0] || null };
}

export async function listSelfOrderSubmissions({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_self_order_submissions WHERE venue_id=$1 ORDER BY submitted_at DESC LIMIT 100`, [venueId]);
  return { ok: true, submissions: r.rows };
}

export async function updateSubmissionStatus({ venueId, submissionId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_self_order_submissions SET submission_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, submissionId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_submission_status', 'self_order_submission', submissionId, { after: { status }, reason });
  return { ok: true, submission: r.rows[0] || null };
}

// ── Handheld POS Sessions ────────────────────────────────────────────────────

export async function createHandheldPosSession({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_handheld_pos_sessions', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { staff_profile_id, device_id, device_type = 'handheld', section_id, table_id } = payload;
  const r = await query(
    `INSERT INTO pos360_handheld_pos_sessions
       (venue_id, staff_profile_id, device_id, device_type, section_id, table_id,
        printer_connected, kds_connected, external_sync_completed,
        contains_ai_generated_content, exposes_private_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,TRUE,$7)
     RETURNING *`,
    [venueId, staff_profile_id || null, device_id || null, device_type, section_id || null, table_id || null, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_handheld_session', 'handheld_pos_session', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, session: r.rows[0] };
}

export async function listHandheldPosSessions({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_handheld_pos_sessions WHERE venue_id=$1 ORDER BY started_at DESC LIMIT 100`, [venueId]);
  return { ok: true, sessions: r.rows };
}

export async function updateHandheldSessionStatus({ venueId, sessionId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_handheld_pos_sessions SET session_status=$1 WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, sessionId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_handheld_status', 'handheld_pos_session', sessionId, { after: { status }, reason });
  return { ok: true, session: r.rows[0] || null };
}

// ── Handheld Order Entries ───────────────────────────────────────────────────

export async function createHandheldOrderEntry({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_handheld_order_entries', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { handheld_session_id, table_id, section_id, order_id, staff_profile_id } = payload;
  const r = await query(
    `INSERT INTO pos360_handheld_order_entries
       (venue_id, handheld_session_id, table_id, section_id, order_id, staff_profile_id,
        kds_sent, kds_accepted, printer_sent, printer_connected, inventory_deducted,
        external_sync_completed, contains_ai_generated_content,
        exposes_private_data, exposes_financial_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,$7)
     RETURNING *`,
    [venueId, handheld_session_id, table_id || null, section_id || null, order_id || null, staff_profile_id || null, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_handheld_entry', 'handheld_order_entry', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, entry: r.rows[0] };
}

export async function listHandheldOrderEntries({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_handheld_order_entries WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`, [venueId]);
  return { ok: true, entries: r.rows };
}

export async function updateHandheldEntryStatus({ venueId, entryId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_handheld_order_entries SET entry_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, entryId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_handheld_entry_status', 'handheld_order_entry', entryId, { after: { status }, reason });
  return { ok: true, entry: r.rows[0] || null };
}

// ── Table Ordering Sessions ──────────────────────────────────────────────────

export async function createTableOrderingSession({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_table_ordering_sessions', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { table_id, section_id, order_id, reservation_id, guest_profile_id, customer_id, staff_profile_id, cover_count = 0 } = payload;
  const r = await query(
    `INSERT INTO pos360_table_ordering_sessions
       (venue_id, table_id, section_id, order_id, reservation_id, guest_profile_id, customer_id,
        staff_profile_id, cover_count,
        kds_connected, printer_connected, inventory_deducted, external_sync_completed,
        contains_ai_generated_content, exposes_private_data, exposes_financial_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,FALSE,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,$10)
     RETURNING *`,
    [venueId, table_id, section_id || null, order_id || null, reservation_id || null,
     guest_profile_id || null, customer_id || null, staff_profile_id || null, cover_count, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_table_session', 'table_ordering_session', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, session: r.rows[0] };
}

export async function listTableOrderingSessions({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_table_ordering_sessions WHERE venue_id=$1 ORDER BY opened_at DESC LIMIT 100`, [venueId]);
  return { ok: true, sessions: r.rows };
}

export async function updateTableSessionStatus({ venueId, sessionId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_table_ordering_sessions SET session_status=$1 WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, sessionId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_table_session_status', 'table_ordering_session', sessionId, { after: { status }, reason });
  return { ok: true, session: r.rows[0] || null };
}

// ── Guest Checkout Handoffs ──────────────────────────────────────────────────

export async function createGuestCheckoutHandoff({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_guest_checkout_handoffs', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { cart_id, submission_id, table_id, order_id, payment_record_id, guest_profile_id, customer_id } = payload;
  const r = await query(
    `INSERT INTO pos360_guest_checkout_handoffs
       (venue_id, cart_id, submission_id, table_id, order_id, payment_record_id,
        guest_profile_id, customer_id,
        payment_captured, checkout_completed, external_sync_completed,
        contains_ai_generated_content, exposes_private_data, exposes_financial_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,$9)
     RETURNING *`,
    [venueId, cart_id || null, submission_id || null, table_id || null, order_id || null,
     payment_record_id || null, guest_profile_id || null, customer_id || null, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_checkout_handoff', 'guest_checkout_handoff', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, handoff: r.rows[0] };
}

export async function listGuestCheckoutHandoffs({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_guest_checkout_handoffs WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`, [venueId]);
  return { ok: true, handoffs: r.rows };
}

export async function updateCheckoutHandoffStatus({ venueId, handoffId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_guest_checkout_handoffs SET handoff_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, handoffId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_checkout_handoff_status', 'guest_checkout_handoff', handoffId, { after: { status }, reason });
  return { ok: true, handoff: r.rows[0] || null };
}

// ── QR Code Registry ─────────────────────────────────────────────────────────

export async function createQrCode({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_qr_code_registry', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { qr_code_token, target_type = 'table', table_id, section_id, menu_version_ref, private_event_id } = payload;
  const r = await query(
    `INSERT INTO pos360_qr_code_registry
       (venue_id, qr_code_token, target_type, table_id, section_id, menu_version_ref, private_event_id,
        contains_secrets, stores_secrets, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,FALSE,$8)
     RETURNING *`,
    [venueId, qr_code_token, target_type, table_id || null, section_id || null, menu_version_ref || null, private_event_id || null, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_qr_code', 'qr_code_registry', r.rows[0].id, { after: r.rows[0], exposes_private_data: false });
  return { ok: true, qrCode: r.rows[0] };
}

export async function listQrCodes({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_qr_code_registry WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`, [venueId]);
  return { ok: true, qrCodes: r.rows };
}

export async function updateQrCodeStatus({ venueId, qrCodeId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_qr_code_registry SET qr_status=$1, updated_at=NOW() WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, qrCodeId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_qr_code_status', 'qr_code_registry', qrCodeId, { after: { status }, reason, exposes_private_data: false });
  return { ok: true, qrCode: r.rows[0] || null };
}

// ── Menu Availability Snapshots ──────────────────────────────────────────────

export async function createMenuAvailabilitySnapshot({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_menu_availability_snapshots', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { qr_session_id, table_id, menu_item_count = 0, unavailable_item_count = 0, snapshot_data } = payload;
  const r = await query(
    `INSERT INTO pos360_menu_availability_snapshots
       (venue_id, qr_session_id, table_id, menu_item_count, unavailable_item_count,
        inventory_deducted, external_sync_completed, contains_ai_generated_content,
        snapshot_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,FALSE,$6,$7)
     RETURNING *`,
    [venueId, qr_session_id || null, table_id || null, menu_item_count, unavailable_item_count,
     snapshot_data ? JSON.stringify(snapshot_data) : null, idempotencyKey]
  );
  return { ok: true, snapshot: r.rows[0] };
}

export async function listMenuAvailabilitySnapshots({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_menu_availability_snapshots WHERE venue_id=$1 ORDER BY taken_at DESC LIMIT 100`, [venueId]);
  return { ok: true, snapshots: r.rows };
}

// ── Age Verification ─────────────────────────────────────────────────────────

export async function createAgeVerificationRecord({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_age_verification_records', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { cart_id, cart_item_id, guest_profile_id, customer_id, verification_method = 'staff_visual_placeholder', staff_profile_id } = payload;
  const r = await query(
    `INSERT INTO pos360_age_verification_records
       (venue_id, cart_id, cart_item_id, guest_profile_id, customer_id,
        verification_method, staff_profile_id,
        age_verified, exposes_private_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7,FALSE,TRUE,$8)
     RETURNING *`,
    [venueId, cart_id || null, cart_item_id || null, guest_profile_id || null, customer_id || null,
     verification_method, staff_profile_id || null, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_age_verification', 'age_verification_record', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, record: r.rows[0] };
}

export async function listAgeVerificationRecords({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_age_verification_records WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`, [venueId]);
  return { ok: true, records: r.rows };
}

export async function updateAgeVerificationStatus({ venueId, recordId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const ageVerified = status === 'verified_placeholder';
  const r = await query(
    `UPDATE pos360_age_verification_records SET verification_status=$1, age_verified=$2, override_reason=$3 WHERE id=$4 AND venue_id=$5 RETURNING *`,
    [status, ageVerified, reason || null, recordId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_age_verification', 'age_verification_record', recordId, { after: { status, ageVerified }, reason });
  return { ok: true, record: r.rows[0] || null };
}

// ── Modifier Selections ──────────────────────────────────────────────────────

export async function addModifierSelection({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_self_order_modifier_selections', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { cart_item_id, modifier_group_id, modifier_option_id, modifier_name, price_adjustment_cents = 0 } = payload;
  const r = await query(
    `INSERT INTO pos360_self_order_modifier_selections
       (venue_id, cart_item_id, modifier_group_id, modifier_option_id, modifier_name,
        price_adjustment_cents, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING *`,
    [venueId, cart_item_id, modifier_group_id || null, modifier_option_id || null,
     modifier_name, price_adjustment_cents, idempotencyKey]
  );
  return { ok: true, selection: r.rows[0] };
}

export async function listModifierSelections({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_self_order_modifier_selections WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 200`, [venueId]);
  return { ok: true, selections: r.rows };
}

// ── Menu Availability Overrides ──────────────────────────────────────────────

export async function createMenuItemAvailabilityOverride({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_menu_item_availability_overrides', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { menu_item_id, inventory_item_id, override_type = '86ed', staff_profile_id, reason, expires_at } = payload;
  const r = await query(
    `INSERT INTO pos360_menu_item_availability_overrides
       (venue_id, menu_item_id, inventory_item_id, override_type, staff_profile_id, reason,
        external_sync_completed, idempotency_key, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE,$7,$8)
     RETURNING *`,
    [venueId, menu_item_id || null, inventory_item_id || null, override_type, staff_profile_id || null,
     reason || null, idempotencyKey, expires_at || null]
  );
  await writeAudit(venueId, actorUserId, 'create_availability_override', 'menu_item_availability_override', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, override: r.rows[0] };
}

export async function listMenuItemAvailabilityOverrides({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_menu_item_availability_overrides WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`, [venueId]);
  return { ok: true, overrides: r.rows };
}

export async function updateMenuItemAvailabilityOverride({ venueId, overrideId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_menu_item_availability_overrides SET override_status=$1 WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, overrideId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_availability_override', 'menu_item_availability_override', overrideId, { after: { status }, reason });
  return { ok: true, override: r.rows[0] || null };
}

// ── SmokeCraft Self-Order Hooks ──────────────────────────────────────────────

export async function createSmokecraftSelfOrderHook({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_smokecraft_self_order_hooks', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { cart_id, cart_item_id, smokecraft_session_id, inventory_item_id } = payload;
  const r = await query(
    `INSERT INTO pos360_smokecraft_self_order_hooks
       (venue_id, cart_id, cart_item_id, smokecraft_session_id, inventory_item_id,
        smokecraft_sync_completed, inventory_deducted, kds_accepted,
        contains_ai_generated_content, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,FALSE,FALSE,$6)
     RETURNING *`,
    [venueId, cart_id || null, cart_item_id || null, smokecraft_session_id || null, inventory_item_id || null, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_smokecraft_hook', 'smokecraft_self_order_hook', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, hook: r.rows[0] };
}

export async function listSmokecraftSelfOrderHooks({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_smokecraft_self_order_hooks WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`, [venueId]);
  return { ok: true, hooks: r.rows };
}

export async function updateSmokecraftHookStatus({ venueId, hookId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_smokecraft_self_order_hooks SET hook_status=$1 WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, hookId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_smokecraft_hook', 'smokecraft_self_order_hook', hookId, { after: { status }, reason });
  return { ok: true, hook: r.rows[0] || null };
}

// ── E.A.T. Self-Order Handoffs ───────────────────────────────────────────────

export async function createEatSelfOrderHandoff({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_eat_self_order_handoffs', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { cart_id, submission_id, order_id } = payload;
  const r = await query(
    `INSERT INTO pos360_eat_self_order_handoffs
       (venue_id, cart_id, submission_id, order_id,
        external_sync_completed, kds_accepted, inventory_deducted,
        contains_ai_generated_content, exposes_private_data, exposes_financial_data, idempotency_key)
     VALUES ($1,$2,$3,$4,FALSE,FALSE,FALSE,FALSE,TRUE,TRUE,$5)
     RETURNING *`,
    [venueId, cart_id || null, submission_id || null, order_id || null, idempotencyKey]
  );
  await writeAudit(venueId, actorUserId, 'create_eat_handoff', 'eat_self_order_handoff', r.rows[0].id, { after: r.rows[0] });
  return { ok: true, handoff: r.rows[0] };
}

export async function listEatSelfOrderHandoffs({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_eat_self_order_handoffs WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`, [venueId]);
  return { ok: true, handoffs: r.rows };
}

export async function updateEatHandoffStatus({ venueId, handoffId, status, actorUserId, reason, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_eat_self_order_handoffs SET eat_handoff_status=$1 WHERE id=$2 AND venue_id=$3 RETURNING *`,
    [status, handoffId, venueId]
  );
  await writeAudit(venueId, actorUserId, 'update_eat_handoff', 'eat_self_order_handoff', handoffId, { after: { status }, reason });
  return { ok: true, handoff: r.rows[0] || null };
}

// ── Visibility Insights ──────────────────────────────────────────────────────

export async function createSelfOrderVisibilityInsight({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_self_order_visibility_insights', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { insight_type = 'cart_abandonment', table_id, section_id, order_id, insight_data } = payload;
  const r = await query(
    `INSERT INTO pos360_self_order_visibility_insights
       (venue_id, insight_type, table_id, section_id, order_id, insight_data,
        contains_ai_generated_content, external_sync_completed, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,$6,FALSE,FALSE,$7)
     RETURNING *`,
    [venueId, insight_type, table_id || null, section_id || null, order_id || null,
     insight_data ? JSON.stringify(insight_data) : null, idempotencyKey]
  );
  return { ok: true, insight: r.rows[0] };
}

export async function listSelfOrderVisibilityInsights({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_self_order_visibility_insights WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`, [venueId]);
  return { ok: true, insights: r.rows };
}

export async function getSelfOrderOperationsSummary({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL({ summary: null, note: 'Self-order operations summary requires database connection. self_order_completed=false, payment_captured=false, kds_accepted=false, inventory_deducted=false' });
  const r = await query(
    `SELECT
       COUNT(*) FILTER (WHERE cart_status='open') AS open_carts,
       COUNT(*) FILTER (WHERE cart_status='submitted') AS submitted_carts,
       COUNT(*) FILTER (WHERE self_order_completed IS true) AS completed_orders,
       COUNT(*) FILTER (WHERE payment_captured IS true) AS payments_captured,
       COUNT(*) FILTER (WHERE kds_accepted IS true) AS kds_accepted_count,
       COUNT(*) FILTER (WHERE inventory_deducted IS true) AS inventory_deducted_count,
       COUNT(*) FILTER (WHERE age_verified IS true) AS age_verified_count
     FROM pos360_self_order_carts WHERE venue_id=$1`,
    [venueId]
  );
  return { ok: true, summary: r.rows[0] };
}

// ── Offline Queue ─────────────────────────────────────────────────────────────

export async function queueSelfOrderOfflineAction({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_self_order_offline_queue', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { action_type, payload: actionPayload = {} } = payload;
  const r = await query(
    `INSERT INTO pos360_self_order_offline_queue
       (venue_id, actor_user_id, action_type, payload,
        contains_secrets, stores_secrets, exposes_private_data, idempotency_key)
     VALUES ($1,$2,$3,$4,FALSE,FALSE,FALSE,$5)
     RETURNING *`,
    [venueId, actorUserId, action_type, JSON.stringify(actionPayload), idempotencyKey]
  );
  return { ok: true, queueEntry: r.rows[0] };
}

export async function listSelfOrderOfflineQueue({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_self_order_offline_queue WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`, [venueId]);
  return { ok: true, queue: r.rows };
}

export async function markSelfOrderOfflineActionSynced({ venueId, offlineActionId, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_self_order_offline_queue SET queue_status='synced', synced_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [offlineActionId, venueId]
  );
  return { ok: true, queueEntry: r.rows[0] || null };
}

export async function queueHandheldOfflineAction({ venueId, payload, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  if (idempotencyKey) {
    const d = await dupCheck('pos360_handheld_offline_queue', venueId, idempotencyKey);
    if (d.rows.length) return { ok: true, duplicate: true, id: d.rows[0].id };
  }
  const { handheld_session_id, action_type, payload: actionPayload = {} } = payload;
  const r = await query(
    `INSERT INTO pos360_handheld_offline_queue
       (venue_id, handheld_session_id, actor_user_id, action_type, payload,
        contains_secrets, stores_secrets, exposes_private_data, idempotency_key)
     VALUES ($1,$2,$3,$4,$5,FALSE,FALSE,FALSE,$6)
     RETURNING *`,
    [venueId, handheld_session_id || null, actorUserId, action_type, JSON.stringify(actionPayload), idempotencyKey]
  );
  return { ok: true, queueEntry: r.rows[0] };
}

export async function listHandheldOfflineQueue({ venueId, filters = {} }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(`SELECT * FROM pos360_handheld_offline_queue WHERE venue_id=$1 ORDER BY created_at DESC LIMIT 100`, [venueId]);
  return { ok: true, queue: r.rows };
}

export async function markHandheldOfflineActionSynced({ venueId, offlineActionId, actorUserId, idempotencyKey }) {
  if (!isDbAvailable()) return LOCAL();
  const r = await query(
    `UPDATE pos360_handheld_offline_queue SET queue_status='synced', synced_at=NOW() WHERE id=$1 AND venue_id=$2 RETURNING *`,
    [offlineActionId, venueId]
  );
  return { ok: true, queueEntry: r.rows[0] || null };
}
