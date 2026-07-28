import * as svc from '../services/smokecraft/collectionsService.js'

function sendError(res, err, fallback = 400) {
  const statusByCode = { identity_required: 400, item_not_found: 404 }
  res.status(statusByCode[err.code] || fallback).json({ success: false, error: err.code || 'internal_error' })
}

function guestRef(req) {
  return req.goldenBoxGuestReference || null
}

function serializeItem(item) {
  return {
    itemKey: item.item_key, title: item.display_name, description: item.description,
    category: item.collection_category, itemType: item.item_type, rarity: item.rarity,
    assetReference: item.asset_reference, earnCondition: item.earn_condition,
    xpValue: item.xp_value, goldenBoxRelevance: item.golden_box_relevance,
    merchandiseEligible: item.merchandise_eligible, displayOrder: item.display_order,
  }
}

export async function handleGetCollections(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { newlyEarned, alreadyOwned, stillLocked, totalActive } = await svc.recalculate(ref)
    const owned = [...newlyEarned, ...alreadyOwned]
    // A staff-reversed item keeps its historical earn record (never
    // deleted) but no longer counts toward the guest's current ownership
    // total/percent — the summary reflects effective current ownership.
    const ownedTotal = owned.filter(o => !o.reversed).length

    const categories = {}
    for (const r of [...owned.map(o => ({ ...o, isOwned: !o.reversed })), ...stillLocked.map(l => ({ ...l, isOwned: false }))]) {
      const cat = r.item.collection_category
      categories[cat] = categories[cat] || { category: cat, total: 0, owned: 0 }
      categories[cat].total += 1
      if (r.isOwned) categories[cat].owned += 1
    }

    res.json({
      success: true,
      items: [
        ...owned.map(o => ({ ...serializeItem(o.item), state: o.reversed ? 'corrected' : 'earned', earnedAt: o.ownedAt })),
        ...stillLocked.map(l => ({ ...serializeItem(l.item), state: 'locked', reason: l.reason })),
      ].sort((a, b) => a.displayOrder - b.displayOrder),
      summary: {
        totalActiveItems: totalActive,
        ownedItems: ownedTotal,
        remainingLocked: totalActive - ownedTotal,
        completionPercent: totalActive === 0 ? 0 : Math.round((ownedTotal / totalActive) * 100),
        categories: Object.values(categories),
      },
    })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleGetItem(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const result = await svc.getItemDetail(ref, req.params.itemKey)
    res.json({
      success: true,
      item: { ...serializeItem(result.item), state: result.owned ? (result.reversed ? 'corrected' : 'earned') : 'locked', earnedAt: result.ownedAt || null, evidence: result.evidence || null, reason: result.reason || null },
    })
  } catch (err) { sendError(res, err, 500) }
}

export async function handleRecalculate(req, res) {
  try {
    const ref = guestRef(req)
    if (!ref) return res.status(400).json({ success: false, error: 'identity_required' })
    const { newlyEarned, alreadyOwned } = await svc.recalculate(ref)
    res.json({
      success: true,
      newlyEarned: newlyEarned.map(o => serializeItem(o.item)),
      alreadyOwned: alreadyOwned.map(o => serializeItem(o.item)),
    })
  } catch (err) { sendError(res, err, 500) }
}
