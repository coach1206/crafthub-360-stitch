/**
 * Hospitality intelligence shared by POS360 and E.A.T.
 * Produces explainable operational signals from provider-backed snapshots.
 */
import { syncPOS3ToEAT } from './eatPos3BridgeService.js'

export async function getHospitalityIntelligence(providerKey='prototype') {
  const s=await syncPOS3ToEAT(providerKey)
  if (!s?.success) return s
  const env=s.environment||{}, tx=s.transactions||{}, assets=s.assets||{}
  const zones=Object.entries(env.zoneBreakdown||{}).map(([zone,v])=>({zone,total:v.total,occupied:v.occupied,occupancyPct:v.total?Math.round(v.occupied/v.total*100):0}))
  const attention=[]
  if (env.servicePace==='STRETCHED'||env.servicePace==='BUSY') attention.push({type:'STAFF_CAPACITY',severity:env.servicePace==='STRETCHED'?'HIGH':'MEDIUM',message:`Service pace is ${env.servicePace.toLowerCase()}.`})
  if ((assets.lowStockCount||0)>0) attention.push({type:'INVENTORY_PRESSURE',severity:'HIGH',message:`${assets.lowStockCount} inventory item(s) require reorder review.`})
  if ((tx.upsellOpportunities||0)>0) attention.push({type:'GUEST_ATTENTION',severity:'MEDIUM',message:`${tx.upsellOpportunities} open check(s) have service/pairing opportunities.`})
  return {success:true,provider:providerKey,generatedAt:new Date().toISOString(),occupancy:{currentPct:env.occupancyPct||0,pressure:env.venuePressure||'LOW',zones},staffDeployment:{activeStaff:env.activeStaff||0,servicePace:env.servicePace||'UNKNOWN',staffOpportunities:tx.staffOpportunities||[]},guestAttention:attention,inventoryPressure:{lowStockCount:assets.lowStockCount||0,reorderAlerts:assets.reorderAlerts||[]},forecast:{status:'INSUFFICIENT_HISTORY',message:'Historical time-series persistence is required before a truthful future occupancy forecast can be produced.'}}
}
