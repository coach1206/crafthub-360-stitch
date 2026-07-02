/**
 * Venue Onboarding Controller
 * Handles HTTP requests for venue onboarding, settings, and readiness.
 */

import {
  createVenueProfile, updateVenueProfile, getVenueProfile,
  getVenueOnboardingStatus, calculateVenueReadinessScore,
  getVenueReadinessWarnings, markOnboardingStepComplete,
  getRequiredOnboardingSteps, getVenueOperatingMode,
  getVenueCommerceReadiness, logVenueOnboardingAction,
} from '../services/venue/venueOnboardingEngine.js'
import {
  getVenueOperatingSettings, updateVenueOperatingSettings,
  getVenuePOSPreferences, updateVenuePOSPreferences,
  getVenuePartnerSpecialsSettings, updateVenuePartnerSpecialsSettings,
  getVenueStaffPolicySettings, updateVenueStaffPolicySettings,
  getVenueFeatureMatrix,
} from '../services/venue/venueSettingsService.js'
import {
  enablePartnerSpecialsTrial, requestPartnerSpecialsCancellation,
  cancelPartnerSpecials, canVenueDisplayPartnerSpecials,
  canVenueAcceptPartnerVendorOrders,
} from '../services/venue/venuePartnerSpecialsLifecycleService.js'
import { validateStaffAction, getStaffPolicy } from '../services/venue/venueStaffPolicyEngine.js'
import { getFullVenueReadiness } from '../services/venue/venueReadinessAggregator.js'

function venueId(req) {
  return req.params.venueId ?? req.body?.venueId ?? req.query?.venueId
}

export async function handleCreateVenueProfile(req, res) {
  try {
    const result = await createVenueProfile({ venueId: venueId(req), ...req.body })
    if (!result.ok) return res.status(400).json(result)
    return res.status(201).json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetVenueProfile(req, res) {
  try {
    const result = await getVenueProfile(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleUpdateVenueProfile(req, res) {
  try {
    const result = await updateVenueProfile(venueId(req), req.body)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetOnboardingStatus(req, res) {
  try {
    const result = await getVenueOnboardingStatus(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetReadinessScore(req, res) {
  try {
    const result = await calculateVenueReadinessScore(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetReadinessWarnings(req, res) {
  try {
    const result = await getVenueReadinessWarnings(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleMarkStepComplete(req, res) {
  try {
    const { stepName } = req.body
    if (!stepName) return res.status(400).json({ ok: false, message: 'stepName is required.' })
    const result = await markOnboardingStepComplete(venueId(req), stepName)
    if (!result.ok) return res.status(400).json(result)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetRequiredSteps(req, res) {
  try {
    const steps = getRequiredOnboardingSteps(venueId(req))
    return res.json({ venueId: venueId(req), steps })
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetOperatingMode(req, res) {
  try {
    const result = await getVenueOperatingMode(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetCommerceReadiness(req, res) {
  try {
    const result = await getVenueCommerceReadiness(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetFullReadiness(req, res) {
  try {
    const result = await getFullVenueReadiness(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetFeatureMatrix(req, res) {
  try {
    const result = await getVenueFeatureMatrix(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetOperatingSettings(req, res) {
  try {
    const result = await getVenueOperatingSettings(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleUpdateOperatingSettings(req, res) {
  try {
    const result = await updateVenueOperatingSettings(venueId(req), req.body)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetPOSPreferences(req, res) {
  try {
    const result = await getVenuePOSPreferences(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleUpdatePOSPreferences(req, res) {
  try {
    const result = await updateVenuePOSPreferences(venueId(req), req.body)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetPartnerSpecialsSettings(req, res) {
  try {
    const result = await getVenuePartnerSpecialsSettings(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleEnablePartnerSpecialsTrial(req, res) {
  try {
    const result = await enablePartnerSpecialsTrial(venueId(req), req.body?.actorId)
    if (!result.ok) return res.status(400).json(result)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleRequestPartnerSpecialsCancellation(req, res) {
  try {
    const result = await requestPartnerSpecialsCancellation(venueId(req), req.body?.actorId)
    if (!result.ok) return res.status(400).json(result)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleCancelPartnerSpecials(req, res) {
  try {
    const result = await cancelPartnerSpecials(venueId(req), req.body?.actorId)
    if (!result.ok) return res.status(400).json(result)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleCanDisplayPartnerSpecials(req, res) {
  try {
    const result = await canVenueDisplayPartnerSpecials(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleCanAcceptPartnerOrders(req, res) {
  try {
    const result = await canVenueAcceptPartnerVendorOrders(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleGetStaffPolicy(req, res) {
  try {
    const result = await getStaffPolicy(venueId(req))
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleUpdateStaffPolicy(req, res) {
  try {
    const result = await updateVenueStaffPolicySettings(venueId(req), req.body)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleValidateStaffAction(req, res) {
  try {
    const { role, actionType } = req.body
    if (!role || !actionType) return res.status(400).json({ ok: false, message: 'role and actionType are required.' })
    const result = await validateStaffAction(venueId(req), role, actionType)
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}

export async function handleLogOnboardingAction(req, res) {
  try {
    const result = await logVenueOnboardingAction({ venueId: venueId(req), ...req.body })
    return res.json(result)
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message })
  }
}
