/**
 * Pilot Controller — Phase 13
 */

import * as svc               from '../services/pilotPartnerService.js'
import { buildPilotPackage }  from '../services/founderPackageService.js'

export async function listPartners(req, res) {
  try {
    const partners = await svc.listPartners()
    return res.json({ success: true, data: partners })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function createPartner(req, res) {
  try {
    const { venueName, contactName, contactEmail, contactPhone, city, state, pilotTier, notes } = req.body
    if (!venueName) return res.status(400).json({ success: false, message: 'venueName required' })
    const partner = await svc.createPartner({ venueName, contactName, contactEmail, contactPhone, city, state, pilotTier, notes })
    return res.json({ success: true, data: partner })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function getPartner(req, res) {
  try {
    const { partnerId } = req.params
    const [partner, reqs] = await Promise.all([svc.getPartner(partnerId), svc.getRequirements(partnerId)])
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' })
    return res.json({ success: true, data: { ...partner, requirements: reqs } })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function updatePartner(req, res) {
  try {
    const { partnerId } = req.params
    const partner = await svc.updatePartner(partnerId, req.body)
    if (!partner) return res.status(404).json({ success: false, message: 'Partner not found' })
    return res.json({ success: true, data: partner })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function setRequirement(req, res) {
  try {
    const { partnerId } = req.params
    const { requirementKey, status, notes } = req.body
    if (!requirementKey || !status) return res.status(400).json({ success: false, message: 'requirementKey and status required' })
    const req_ = await svc.setRequirement(partnerId, requirementKey, status, notes)
    return res.json({ success: true, data: req_ })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}

export async function getPilotPackage(req, res) {
  try {
    const pkg = buildPilotPackage()
    return res.json({ success: true, data: pkg })
  } catch (err) { return res.status(500).json({ success: false, message: err.message }) }
}
