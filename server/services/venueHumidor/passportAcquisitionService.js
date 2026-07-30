/**
 * Venue Humidor 1B-2B-4 — customer-facing read surface over
 * venue_cigar_passport_acquisitions (the sole acquisition source of
 * truth, written only inside checkoutService.completeOrder()) plus
 * the narrow verified-purchase rating/tasting-note/smoked boundary
 * (venue_cigar_acquisition_notes, migration 112).
 */
import { getDb } from '../../db/connection.js'

export class PassportAcquisitionError extends Error {
  constructor(code) { super(code); this.code = code }
}

export async function listAcquisitions(customerReference) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT a.*, p.name AS product_name, p.brand, p.vitola, p.country, p.strength,
       p.primary_image_url, v.name AS venue_name,
       n.rating, n.tasting_note, n.is_smoked, n.smoked_at
     FROM venue_cigar_passport_acquisitions a
     JOIN venue_cigar_products p ON p.product_id = a.product_id
     JOIN venues v ON v.venue_id = a.venue_id
     LEFT JOIN venue_cigar_acquisition_notes n ON n.acquisition_id = a.acquisition_id
     WHERE a.customer_reference = $1
     ORDER BY a.acquired_at DESC`,
    [customerReference]
  )
  return rows
}

export async function getAcquisitionDetail(customerReference, acquisitionId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT a.*, p.*, v.name AS venue_name, v.city AS venue_city,
       n.rating, n.tasting_note, n.is_smoked, n.smoked_at
     FROM venue_cigar_passport_acquisitions a
     JOIN venue_cigar_products p ON p.product_id = a.product_id
     JOIN venues v ON v.venue_id = a.venue_id
     LEFT JOIN venue_cigar_acquisition_notes n ON n.acquisition_id = a.acquisition_id
     WHERE a.acquisition_id = $1`,
    [acquisitionId]
  )
  const row = rows[0]
  if (!row) return null
  if (row.customer_reference !== customerReference) throw new PassportAcquisitionError('acquisition_not_owned')
  return row
}

async function checkIdempotency(db, idempotencyKey) {
  if (!idempotencyKey) throw new PassportAcquisitionError('idempotency_key_required')
  const { rows } = await db.query(`SELECT * FROM venue_cigar_acquisition_notes WHERE idempotency_key = $1`, [idempotencyKey])
  return rows[0] || null
}

// Verified-purchase rating/tasting-note/smoked boundary — upsert
// semantics (one row per acquisition), requires real ownership of the
// underlying acquisition (which itself only exists after real order
// completion), and a real idempotency key on every mutating call.
export async function saveAcquisitionNote(customerReference, acquisitionId, { rating, tastingNote, isSmoked }, idempotencyKey) {
  const db = getDb()
  const dup = await checkIdempotency(db, idempotencyKey)
  if (dup) return { note: dup, deduplicated: true }

  const { rows: acqRows } = await db.query(`SELECT * FROM venue_cigar_passport_acquisitions WHERE acquisition_id = $1`, [acquisitionId])
  const acquisition = acqRows[0]
  if (!acquisition) throw new PassportAcquisitionError('acquisition_not_found')
  if (acquisition.customer_reference !== customerReference) throw new PassportAcquisitionError('acquisition_not_owned')

  if (rating != null && !(Number.isInteger(rating) && rating >= 1 && rating <= 5)) throw new PassportAcquisitionError('invalid_rating')

  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const dupInLock = await checkIdempotency(client, idempotencyKey)
    if (dupInLock) { await client.query('ROLLBACK'); return { note: dupInLock, deduplicated: true } }

    const { rows: existingRows } = await client.query(`SELECT * FROM venue_cigar_acquisition_notes WHERE acquisition_id = $1 FOR UPDATE`, [acquisitionId])
    const existing = existingRows[0]

    let noteRow
    if (existing) {
      const { rows } = await client.query(
        `UPDATE venue_cigar_acquisition_notes SET
           rating = COALESCE($2, rating), tasting_note = COALESCE($3, tasting_note),
           is_smoked = COALESCE($4, is_smoked), smoked_at = CASE WHEN $4 = true AND is_smoked = false THEN now() ELSE smoked_at END,
           idempotency_key = $5, updated_at = now()
         WHERE acquisition_id = $1 RETURNING *`,
        [acquisitionId, rating ?? null, tastingNote ?? null, isSmoked ?? null, idempotencyKey]
      )
      noteRow = rows[0]
    } else {
      const { rows } = await client.query(
        `INSERT INTO venue_cigar_acquisition_notes (acquisition_id, customer_reference, rating, tasting_note, is_smoked, smoked_at, idempotency_key)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [acquisitionId, customerReference, rating ?? null, tastingNote ?? null, !!isSmoked, isSmoked ? new Date().toISOString() : null, idempotencyKey]
      )
      noteRow = rows[0]
    }
    await client.query('COMMIT')
    return { note: noteRow, deduplicated: false }
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}
