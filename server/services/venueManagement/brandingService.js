import { getDb } from '../../db/connection.js'
import { getVenueProfile } from './venueProfileService.js'
import { ProfileError } from './venueProfileService.js'

async function assertOwnedActiveMedia(db, venueId, mediaId) {
  const { rows } = await db.query(
    `SELECT id FROM venue_management_media WHERE id = $1 AND venue_id = $2 AND deleted_at IS NULL`,
    [mediaId, venueId]
  )
  if (!rows[0]) throw new ProfileError('media_not_found_or_not_owned')
}

export async function assignBranding(venueId, { slot, mediaId }, actorId) {
  const db = getDb()
  const profile = await getVenueProfile(venueId)
  if (!profile) throw new ProfileError('profile_not_found')
  await assertOwnedActiveMedia(db, venueId, mediaId)

  if (slot === 'logo') {
    await db.query(`UPDATE venue_management_profiles SET logo_media_id=$2, updated_by=$3, version=version+1, updated_at=now() WHERE venue_id=$1 AND is_current`, [venueId, mediaId, actorId])
  } else if (slot === 'hero') {
    await db.query(`UPDATE venue_management_profiles SET hero_media_id=$2, updated_by=$3, version=version+1, updated_at=now() WHERE venue_id=$1 AND is_current`, [venueId, mediaId, actorId])
  } else if (slot === 'gallery') {
    await db.query(
      `UPDATE venue_management_profiles
       SET gallery_media_ids = gallery_media_ids || to_jsonb($2::bigint),
           updated_by=$3, version=version+1, updated_at=now()
       WHERE venue_id=$1 AND is_current AND NOT (gallery_media_ids @> to_jsonb($2::bigint))`,
      [venueId, mediaId, actorId]
    )
  } else {
    throw new ProfileError('invalid_branding_slot')
  }
  await db.query(`UPDATE venue_management_media SET in_use = true WHERE id = $1`, [mediaId])
  return getVenueProfile(venueId)
}

export async function removeBranding(venueId, slot, actorId, mediaId = null) {
  const db = getDb()
  if (slot === 'logo') {
    await db.query(`UPDATE venue_management_profiles SET logo_media_id=NULL, updated_by=$2, version=version+1, updated_at=now() WHERE venue_id=$1 AND is_current`, [venueId, actorId])
  } else if (slot === 'hero') {
    await db.query(`UPDATE venue_management_profiles SET hero_media_id=NULL, updated_by=$2, version=version+1, updated_at=now() WHERE venue_id=$1 AND is_current`, [venueId, actorId])
  } else if (slot === 'gallery' && mediaId) {
    await db.query(
      `UPDATE venue_management_profiles
       SET gallery_media_ids = gallery_media_ids - $2::text, updated_by=$3, version=version+1, updated_at=now()
       WHERE venue_id=$1 AND is_current`,
      [venueId, String(mediaId), actorId]
    )
  } else {
    throw new ProfileError('invalid_branding_removal')
  }
  return getVenueProfile(venueId)
}

export async function reorderGallery(venueId, orderedMediaIds, actorId) {
  const db = getDb()
  await db.query(
    `UPDATE venue_management_profiles SET gallery_media_ids = $2::jsonb, updated_by=$3, version=version+1, updated_at=now()
     WHERE venue_id=$1 AND is_current`,
    [venueId, JSON.stringify(orderedMediaIds), actorId]
  )
  return getVenueProfile(venueId)
}
