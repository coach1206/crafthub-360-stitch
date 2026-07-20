import { getDb } from '../../db/connection.js'

export class ProfileError extends Error {
  constructor(code) { super(code); this.code = code }
}

const EDITABLE_FIELDS = [
  'display_name', 'description', 'reservation_url', 'timezone', 'operating_hours',
  'amenities', 'accessibility_info', 'age_restriction', 'dress_code', 'social_links',
  'logo_media_id', 'hero_media_id', 'gallery_media_ids',
]

export async function getVenueProfile(venueId) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM venue_management_profiles WHERE venue_id = $1 AND is_current LIMIT 1`,
    [venueId]
  )
  return rows[0] || null
}

async function writeVersionRecord(client, { venueId, entityId, versionNumber, status, payload, actorId }) {
  await client.query(
    `INSERT INTO venue_management_content_versions
       (venue_id, entity_type, entity_id, version_number, status, payload, created_by)
     VALUES ($1,'venue_profile',$2,$3,$4,$5,$6)
     ON CONFLICT (venue_id, entity_type, entity_id, version_number) DO NOTHING`,
    [venueId, entityId, versionNumber, status, JSON.stringify(payload), actorId]
  )
}

export async function createVenueProfile(venueId, actorId) {
  const db = getDb()
  const existing = await getVenueProfile(venueId)
  if (existing) return existing
  const { rows } = await db.query(
    `INSERT INTO venue_management_profiles (venue_id, created_by, updated_by)
     VALUES ($1,$2,$2) RETURNING *`,
    [venueId, actorId]
  )
  const profile = rows[0]
  await writeVersionRecord(db, {
    venueId, entityId: String(profile.id), versionNumber: 1, status: 'DRAFT', payload: profile, actorId,
  })
  return profile
}

/**
 * updateVenueProfile — optimistic concurrency: caller must supply the
 * version they last read. A mismatch means someone else saved in the
 * meantime; we reject rather than silently overwrite.
 */
export async function updateVenueProfile(venueId, { expectedVersion, fields, actorId }) {
  const db = getDb()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const { rows: current } = await client.query(
      `SELECT * FROM venue_management_profiles WHERE venue_id = $1 AND is_current LIMIT 1 FOR UPDATE`,
      [venueId]
    )
    const profile = current[0]
    if (!profile) { await client.query('ROLLBACK'); throw new ProfileError('profile_not_found') }
    if (profile.version !== expectedVersion) {
      await client.query('ROLLBACK')
      throw new ProfileError('stale_version')
    }
    if (!['DRAFT', 'REJECTED'].includes(profile.status)) {
      await client.query('ROLLBACK')
      throw new ProfileError('not_editable_in_current_status')
    }

    const updates = {}
    for (const key of EDITABLE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) updates[key] = fields[key]
    }
    if (Object.keys(updates).length === 0) { await client.query('ROLLBACK'); throw new ProfileError('no_fields_provided') }

    const setClauses = Object.keys(updates).map((k, i) => `${k} = $${i + 3}`).join(', ')
    const values = Object.values(updates).map((v) =>
      (typeof v === 'object' && v !== null) ? JSON.stringify(v) : v
    )
    const { rows: updated } = await client.query(
      `UPDATE venue_management_profiles
       SET ${setClauses}, version = version + 1, updated_by = $2, updated_at = now()
       WHERE venue_id = $1 AND is_current RETURNING *`,
      [venueId, actorId, ...values]
    )
    const newProfile = updated[0]
    await writeVersionRecord(client, {
      venueId, entityId: String(newProfile.id), versionNumber: newProfile.version,
      status: newProfile.status, payload: newProfile, actorId,
    })
    await client.query('COMMIT')
    return newProfile
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {})
    throw err
  } finally {
    client.release()
  }
}

async function transitionStatus(venueId, { fromStatuses, toStatus, actorField, actorId, extra = {}, reason = null }) {
  const db = getDb()
  const { rows } = await db.query(
    `SELECT * FROM venue_management_profiles WHERE venue_id = $1 AND is_current LIMIT 1`,
    [venueId]
  )
  const profile = rows[0]
  if (!profile) throw new ProfileError('profile_not_found')
  if (!fromStatuses.includes(profile.status)) throw new ProfileError(`invalid_transition_from_${profile.status}`)

  const extraCols = Object.keys(extra)
  const setClauses = ['status = $3', `${actorField} = $2`, 'updated_at = now()', 'version = version + 1']
  const values = [venueId, actorId, toStatus]
  extraCols.forEach((col, i) => { setClauses.push(`${col} = $${values.length + 1}`); values.push(extra[col]) })
  if (reason !== null) { setClauses.push(`rejection_reason = $${values.length + 1}`); values.push(reason) }

  const { rows: updated } = await db.query(
    `UPDATE venue_management_profiles SET ${setClauses.join(', ')}
     WHERE venue_id = $1 AND is_current RETURNING *`,
    values
  )
  const newProfile = updated[0]
  await writeVersionRecord(db, {
    venueId, entityId: String(newProfile.id), versionNumber: newProfile.version,
    status: newProfile.status, payload: newProfile, actorId,
  })
  return newProfile
}

export const submitProfileForApproval = (venueId, actorId) =>
  transitionStatus(venueId, { fromStatuses: ['DRAFT', 'REJECTED'], toStatus: 'PENDING_APPROVAL', actorField: 'updated_by', actorId })

export const approveProfile = (venueId, actorId) =>
  transitionStatus(venueId, { fromStatuses: ['PENDING_APPROVAL'], toStatus: 'APPROVED', actorField: 'approved_by', actorId, extra: { approved_at: new Date() } })

export const rejectProfile = (venueId, actorId, reason) =>
  transitionStatus(venueId, { fromStatuses: ['PENDING_APPROVAL'], toStatus: 'REJECTED', actorField: 'updated_by', actorId, reason: reason || 'no reason given' })

export const publishProfile = (venueId, actorId) =>
  transitionStatus(venueId, { fromStatuses: ['APPROVED'], toStatus: 'PUBLISHED', actorField: 'published_by', actorId, extra: { published_at: new Date() } })

export const unpublishProfile = (venueId, actorId) =>
  transitionStatus(venueId, { fromStatuses: ['PUBLISHED'], toStatus: 'UNPUBLISHED', actorField: 'updated_by', actorId })

export async function getProfileVersionHistory(venueId) {
  const db = getDb()
  const profile = await getVenueProfile(venueId)
  if (!profile) return []
  const { rows } = await db.query(
    `SELECT version_number, status, created_by, created_at, approved_by, approved_at, published_at
     FROM venue_management_content_versions
     WHERE venue_id = $1 AND entity_type = 'venue_profile' AND entity_id = $2
     ORDER BY version_number DESC`,
    [venueId, String(profile.id)]
  )
  return rows
}

export async function restoreProfileVersion(venueId, versionNumber, actorId) {
  const db = getDb()
  const profile = await getVenueProfile(venueId)
  if (!profile) throw new ProfileError('profile_not_found')
  if (!['DRAFT', 'REJECTED'].includes(profile.status)) throw new ProfileError('not_editable_in_current_status')

  const { rows } = await db.query(
    `SELECT payload FROM venue_management_content_versions
     WHERE venue_id = $1 AND entity_type = 'venue_profile' AND entity_id = $2 AND version_number = $3`,
    [venueId, String(profile.id), versionNumber]
  )
  if (!rows[0]) throw new ProfileError('version_not_found')
  const snapshot = rows[0].payload
  const fields = {}
  for (const key of EDITABLE_FIELDS) if (key in snapshot) fields[key] = snapshot[key]
  return updateVenueProfile(venueId, { expectedVersion: profile.version, fields, actorId })
}
