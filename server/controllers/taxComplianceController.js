/**
 * Tax Compliance Controller
 */

import {
  getVenueTaxProfile, createOrUpdateVenueTaxProfile,
  getVenueTaxJurisdictions, createOrUpdateVenueTaxJurisdiction,
  getVenueTaxCategories, createOrUpdateVenueTaxCategory,
  getVenueTaxRules, createOrUpdateVenueTaxRule,
  getPartnerVendorTaxProfile, createOrUpdatePartnerVendorTaxProfile,
} from '../services/tax/taxConfigService.js'
import {
  getVenueTaxComplianceReadiness, getPartnerTaxComplianceReadiness,
  getOrderTaxReadiness, buildTaxReadinessScore,
} from '../services/tax/taxComplianceReadinessEngine.js'
import { calculateOrderTax, buildTaxPreview, validateTaxCalculationInput } from '../services/tax/taxCalculationEngine.js'
import { getTaxAuditTrail } from '../services/tax/taxAuditService.js'

// ── Venue Tax Profile ─────────────────────────────────────────────────────

export async function handleGetVenueTaxProfile(req, res) {
  try { return res.json(await getVenueTaxProfile(req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCreateOrUpdateVenueTaxProfile(req, res) {
  try { return res.json(await createOrUpdateVenueTaxProfile(req.params.venueId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

// ── Jurisdictions ─────────────────────────────────────────────────────────

export async function handleGetVenueTaxJurisdictions(req, res) {
  try { return res.json(await getVenueTaxJurisdictions(req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCreateOrUpdateVenueTaxJurisdiction(req, res) {
  try { return res.json(await createOrUpdateVenueTaxJurisdiction(req.params.venueId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

// ── Categories ────────────────────────────────────────────────────────────

export async function handleGetVenueTaxCategories(req, res) {
  try { return res.json(await getVenueTaxCategories(req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCreateOrUpdateVenueTaxCategory(req, res) {
  try { return res.json(await createOrUpdateVenueTaxCategory(req.params.venueId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

// ── Rules ─────────────────────────────────────────────────────────────────

export async function handleGetVenueTaxRules(req, res) {
  try { return res.json(await getVenueTaxRules(req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCreateOrUpdateVenueTaxRule(req, res) {
  try { return res.json(await createOrUpdateVenueTaxRule(req.params.venueId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

// ── Readiness ─────────────────────────────────────────────────────────────

export async function handleGetVenueTaxReadiness(req, res) {
  try {
    const [compliance, score] = await Promise.all([
      getVenueTaxComplianceReadiness(req.params.venueId),
      buildTaxReadinessScore(req.params.venueId),
    ])
    return res.json({ ...compliance, taxReadinessScore: score.taxReadinessScore, maxScore: score.maxScore, checks: score.checks })
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

// ── Partner Tax ───────────────────────────────────────────────────────────

export async function handleGetPartnerTaxProfile(req, res) {
  try { return res.json(await getPartnerVendorTaxProfile(req.params.partnerId, req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleCreateOrUpdatePartnerTaxProfile(req, res) {
  try { return res.json(await createOrUpdatePartnerVendorTaxProfile(req.params.partnerId, req.params.venueId, req.body)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleGetPartnerTaxReadiness(req, res) {
  try { return res.json(await getPartnerTaxComplianceReadiness(req.params.partnerId, req.params.venueId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

// ── Calculation ───────────────────────────────────────────────────────────

export async function handleCalculateTax(req, res) {
  try {
    const result = await calculateOrderTax(req.body, req.body.taxContext ?? {})
    if (!result.ok) return res.status(400).json(result)
    return res.json(result)
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleTaxPreview(req, res) {
  try {
    const result = await buildTaxPreview(req.body, req.body.taxContext ?? {})
    return res.json(result)
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

export async function handleValidateOrder(req, res) {
  try {
    const validation = validateTaxCalculationInput(req.body)
    const taxReadiness = await getOrderTaxReadiness(req.body)
    return res.json({ ...validation, ...taxReadiness })
  } catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}

// ── Audit ─────────────────────────────────────────────────────────────────

export async function handleGetAuditTrail(req, res) {
  try { return res.json(await getTaxAuditTrail(req.params.entityType, req.params.entityId)) }
  catch (err) { return res.status(500).json({ ok: false, error: err.message }) }
}
