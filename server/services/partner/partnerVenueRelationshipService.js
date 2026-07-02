/**
 * Partner Venue Relationship Service
 * Controls which venues can use which partner vendors.
 */

import { isDbAvailable, query } from '../../db/connection.js'

const relationshipStore = new Map() // key: `${partnerId}::${venueId}`

function key(partnerId, venueId) { return `${partnerId}::${venueId}` }

function defaultRelationship(partnerId, venueId, relationshipType = 'partner_specials') {
  return {
    partner_id: partnerId,
    venue_id: venueId,
    relationship_type: relationshipType,
    approval_status: 'venue_approval_required',
    created_at: new Date().toISOString(),
  }
}

async function dbGetRelationship(partnerId, venueId) {
  if (isDbAvailable()) {
    try {
      const { rows } = await query(
        'SELECT * FROM partner_vendor_venue_relationships WHERE partner_id=$1 AND venue_id=$2 LIMIT 1',
        [partnerId, venueId]
      )
      if (rows[0]) return { ok: true, relationship: rows[0], storageMode: 'postgres' }
    } catch { /* fallback */ }
  }
  const stored = relationshipStore.get(key(partnerId, venueId)) ?? null
  return { ok: true, relationship: stored, storageMode: 'memory_fallback' }
}

export async function requestVenueApproval(partnerId, venueId, payload = {}) {
  const existing = await dbGetRelationship(partnerId, venueId)
  if (existing.relationship?.approval_status === 'partner_approved') {
    return { ok: false, status: 'partner_approved', message: 'Partner already approved for this venue.' }
  }

  const rel = {
    ...defaultRelationship(partnerId, venueId, payload.relationshipType ?? 'partner_specials'),
    approval_status: 'partner_pending_approval',
    updated_at: new Date().toISOString(),
  }

  if (isDbAvailable()) {
    try {
      await query(
        `INSERT INTO partner_vendor_venue_relationships
           (partner_id, venue_id, relationship_type, approval_status)
         VALUES ($1,$2,$3,'partner_pending_approval')
         ON CONFLICT DO NOTHING`,
        [partnerId, venueId, rel.relationship_type]
      )
      return { ok: true, partnerId, venueId, status: 'partner_pending_approval', storageMode: 'postgres' }
    } catch { /* fallback */ }
  }

  relationshipStore.set(key(partnerId, venueId), rel)
  return { ok: true, partnerId, venueId, status: 'partner_pending_approval', storageMode: 'memory_fallback' }
}

async function setRelationshipStatus(partnerId, venueId, status, actorPayload = {}) {
  const now = new Date().toISOString()
  const existing = relationshipStore.get(key(partnerId, venueId)) ?? defaultRelationship(partnerId, venueId)
  const updated = { ...existing, approval_status: status, updated_at: now, ...actorPayload }
  relationshipStore.set(key(partnerId, venueId), updated)
  return { ok: true, partnerId, venueId, status, storageMode: 'memory_fallback' }
}

export async function approvePartnerForVenue(partnerId, venueId, actorPayload = {}) {
  return setRelationshipStatus(partnerId, venueId, 'partner_approved', {
    approved_by: actorPayload.actorId ?? 'system',
    approved_at: new Date().toISOString(),
  })
}

export async function rejectPartnerForVenue(partnerId, venueId, actorPayload = {}) {
  return setRelationshipStatus(partnerId, venueId, 'partner_rejected', {
    rejected_by: actorPayload.actorId ?? 'system',
    rejected_at: new Date().toISOString(),
    rejection_reason: actorPayload.reason ?? null,
  })
}

export async function pausePartnerForVenue(partnerId, venueId, actorPayload = {}) {
  return setRelationshipStatus(partnerId, venueId, 'partner_paused', actorPayload)
}

export async function blockPartnerForVenue(partnerId, venueId, actorPayload = {}) {
  return setRelationshipStatus(partnerId, venueId, 'partner_blocked', actorPayload)
}

export async function getPartnerVenueRelationship(partnerId, venueId) {
  return dbGetRelationship(partnerId, venueId)
}

export async function listPartnersForVenue(venueId) {
  const results = []
  for (const [k, rel] of relationshipStore.entries()) {
    if (rel.venue_id === venueId) results.push(rel)
  }
  return { ok: true, venueId, partners: results, storageMode: 'memory_fallback' }
}

export async function listVenuesForPartner(partnerId) {
  const results = []
  for (const [k, rel] of relationshipStore.entries()) {
    if (rel.partner_id === partnerId) results.push(rel)
  }
  return { ok: true, partnerId, venues: results, storageMode: 'memory_fallback' }
}

export async function canPartnerSellAtVenue(partnerId, venueId) {
  const rel = await dbGetRelationship(partnerId, venueId)
  const canSell = rel.relationship?.approval_status === 'partner_approved'
  return {
    partnerId,
    venueId,
    canSell,
    approvalStatus: rel.relationship?.approval_status ?? 'venue_approval_required',
    reason: canSell ? 'partner_approved' : 'venue_approval_required',
  }
}
