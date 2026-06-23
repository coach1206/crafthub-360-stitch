// SmokeCraft 360 — Scoring / XP / Winner-category module surface.
//
// Phase 2 module separation note: XP_AWARDS, RANKS and the winner-category
// evaluators are real, working logic used by ~25 existing screens and
// services (src/constants/session.js, src/services/smokecraft/
// smokeWinnerService.js). Rewriting every one of those import sites in this
// phase would be a large, unnecessarily risky refactor for a documentation/
// foundations phase. Instead, this file re-exports the existing canonical
// implementations under one reusable module entry point — new code (and any
// future Novi OS read access) should import from here; existing screens are
// left untouched and continue to work exactly as before.
//
// A full migration of existing import sites to this module path is a
// candidate for Phase 3, once the module boundary itself is approved.

export {
  XP_AWARDS,
  RANKS,
  getRankFromXP,
  SMOKECRAFT_FLOW,
  getNextSmokecraftRoute,
  getLastSmokecraftRoute,
} from '../../constants/session.js'

export {
  STATUS as WINNER_STATUS,
  getWinnerCategories,
  getWinnerCategoryStatus,
  calculateWinnerEligibility,
  getTopEligibleCategory,
  assignWinnerCategory,
  getWinnerProgress,
  getWinnerDataRequirements,
  getLockedWinnerCategories,
  getPendingWinnerCategories,
} from '../../services/smokecraft/smokeWinnerService.js'
