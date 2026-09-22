/**
 * E.A.T. System AI Agent.
 * Converts the POS/E.A.T. operational snapshot into explainable,
 * approval-gated venue recommendations.
 */
import { syncPOS3ToEAT } from './eatPos3BridgeService.js'

export async function runEATSystemAgent(providerKey='prototype') {
  const s=await syncPOS3ToEAT(providerKey)
  if (!s?.success) return s
  const recommendations=[]
  const env=s.environment||{}
  const assets=s.assets||{}
  const tx=s.transactions||{}
  if ((env.occupancyPct||0)>=80) recommendations.push({domain:'environment',action:'PREPARE_PEAK_SERVICE',priority:'HIGH',evidence:{occupancyPct:env.occupancyPct,servicePace:env.servicePace},requiresApproval:true})
  if ((assets.lowStockCount||0)>0) recommendations.push({domain:'inventory',action:'REVIEW_REORDER_QUEUE',priority:'HIGH',evidence:{lowStockCount:assets.lowStockCount},requiresApproval:true})
  if ((tx.upsellOpportunities||0)>0) recommendations.push({domain:'service',action:'SURFACE_PAIRING_OPPORTUNITIES',priority:'MEDIUM',evidence:{count:tx.upsellOpportunities},requiresApproval:true})
  return {success:true,agent:'EAT_SYSTEM_AGENT',provider:providerKey,generatedAt:new Date().toISOString(),opportunityScore:s.opportunityScore,recommendations}
}
