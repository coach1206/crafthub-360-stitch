/**
 * Pilot Partner Service — Phase 13
 * Manages pilot partner records and requirements.
 */

import { query, isDbAvailable } from '../db/connection.js'
import { PILOT_REQUIREMENTS }    from '../config/demoModeConfig.js'

const proto = { partners: [], requirements: [] }
let _seq = 1
const pid  = () => `proto_${_seq++}`
const ppid = () => `pp_${Date.now()}_${Math.random().toString(36).slice(2,6)}`
const now  = () => new Date().toISOString()

export async function listPartners() {
  if (!isDbAvailable()) return [...proto.partners]
  const { rows } = await query(`SELECT * FROM pilot_partners ORDER BY created_at DESC`)
  return rows
}

export async function getPartner(partnerId) {
  if (!isDbAvailable()) return proto.partners.find(p => p.partner_id === partnerId) || null
  const { rows } = await query(`SELECT * FROM pilot_partners WHERE partner_id=$1`, [partnerId])
  return rows[0] || null
}

export async function createPartner({ venueName, contactName, contactEmail, contactPhone, city, state, pilotTier, notes }) {
  if (!isDbAvailable()) {
    const p = { id: pid(), partner_id: ppid(), venue_name: venueName || '', contact_name: contactName || '', contact_email: contactEmail || '', contact_phone: contactPhone || '', city: city || '', state: state || '', status: 'prospect', pilot_tier: pilotTier || 'single_tablet', notes: notes || {}, created_at: now(), updated_at: now() }
    proto.partners.push(p)
    const reqs = PILOT_REQUIREMENTS.map(r => ({ id: pid(), partner_id: p.partner_id, requirement_key: r.key, status: 'pending', notes: '', created_at: now(), updated_at: now() }))
    proto.requirements.push(...reqs)
    return p
  }
  const { rows } = await query(
    `INSERT INTO pilot_partners (venue_name,contact_name,contact_email,contact_phone,city,state,pilot_tier,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [venueName||'',contactName||'',contactEmail||'',contactPhone||'',city||'',state||'',pilotTier||'single_tablet',JSON.stringify(notes||{})]
  )
  const p = rows[0]
  for (const r of PILOT_REQUIREMENTS) {
    await query(`INSERT INTO pilot_requirements (partner_id,requirement_key) VALUES($1,$2) ON CONFLICT DO NOTHING`, [p.partner_id, r.key])
  }
  return p
}

export async function updatePartner(partnerId, updates) {
  if (!isDbAvailable()) {
    const p = proto.partners.find(p => p.partner_id === partnerId)
    if (p) Object.assign(p, updates, { updated_at: now() })
    return p || null
  }
  const allowed = ['venue_name','contact_name','contact_email','contact_phone','city','state','status','pilot_tier','notes']
  const cols = []; const vals = []
  for (const [k, v] of Object.entries(updates)) {
    if (allowed.includes(k)) { cols.push(`${k}=$${cols.length+1}`); vals.push(k === 'notes' ? JSON.stringify(v) : v) }
  }
  if (!cols.length) return getPartner(partnerId)
  vals.push(partnerId)
  const { rows } = await query(`UPDATE pilot_partners SET ${cols.join(',')},updated_at=NOW() WHERE partner_id=$${vals.length} RETURNING *`, vals)
  return rows[0] || null
}

export async function setRequirement(partnerId, requirementKey, status, notes = '') {
  if (!isDbAvailable()) {
    let r = proto.requirements.find(r => r.partner_id === partnerId && r.requirement_key === requirementKey)
    if (!r) { r = { id: pid(), partner_id: partnerId, requirement_key: requirementKey, status, notes, created_at: now(), updated_at: now() }; proto.requirements.push(r) }
    else { r.status = status; r.notes = notes; r.updated_at = now() }
    return r
  }
  const { rows } = await query(
    `INSERT INTO pilot_requirements (partner_id,requirement_key,status,notes) VALUES($1,$2,$3,$4)
     ON CONFLICT (partner_id,requirement_key) DO UPDATE SET status=$3,notes=$4,updated_at=NOW() RETURNING *`,
    [partnerId, requirementKey, status, notes]
  )
  return rows[0]
}

export async function getRequirements(partnerId) {
  if (!isDbAvailable()) return proto.requirements.filter(r => r.partner_id === partnerId)
  const { rows } = await query(`SELECT * FROM pilot_requirements WHERE partner_id=$1`, [partnerId])
  return rows
}
