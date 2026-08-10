/**
 * cultivationStages.js
 *
 * The 7 required Cultivation stage ids, extracted from
 * src/pages/smokecraft/Cultivation.jsx's STAGES array (Holistic Fix
 * 5A-3E) so the server can verify a submitted "viewed all stages"
 * evidence set against the same real, canonical list the client
 * renders — never trusting a bare "I completed it" claim.
 */
export const CULTIVATION_STAGE_IDS = [
  'seed', 'soil', 'climate', 'harvest', 'curing', 'fermentation', 'aging',
]
