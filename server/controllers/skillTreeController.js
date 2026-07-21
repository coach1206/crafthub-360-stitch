import * as svc from '../services/smokecraft/skillTreeService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = { identity_required: 400, node_not_found: 404 }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}

function guestRef(req) {
  return req.goldenBoxGuestReference || null
}

export async function handleGetSkillTree(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const results = await svc.recalculate(ref)
    const completed = results.filter(r => r.learnerState.state === 'completed').length
    res.json({
      success: true,
      nodes: results.map(r => ({
        nodeKey: r.node.node_key,
        title: r.node.display_title,
        description: r.node.description,
        category: r.node.category,
        phaseReference: r.node.phase_reference,
        prerequisites: r.node.prerequisite_node_keys,
        xpReward: r.node.xp_reward,
        goldenBoxRelevance: r.node.golden_box_relevance,
        displayOrder: r.node.display_order,
        state: r.learnerState.state,
        reason: r.reason,
        missingRequirements: r.missingRequirements,
        completedAt: r.learnerState.completed_at,
      })),
      summary: { totalNodes: results.length, completedNodes: completed, completionPercent: Math.round((completed / results.length) * 100) },
    })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetNode(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const r = await svc.getNodeDetail(ref, req.params.nodeKey)
    res.json({
      success: true,
      node: {
        nodeKey: r.node.node_key, title: r.node.display_title, description: r.node.description,
        category: r.node.category, phaseReference: r.node.phase_reference,
        prerequisites: r.node.prerequisite_node_keys, xpReward: r.node.xp_reward,
        goldenBoxRelevance: r.node.golden_box_relevance,
        state: r.learnerState.state, reason: r.reason, missingRequirements: r.missingRequirements,
        completedAt: r.learnerState.completed_at,
      },
    })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRecalculate(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const results = await svc.recalculate(ref)
    res.json({
      success: true,
      changeSummary: results.map(r => ({ nodeKey: r.node.node_key, state: r.learnerState.state })),
    })
  } catch (err) { sendError(res, err, 500) }
}
