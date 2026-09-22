/**
 * POS 360 AI Agent.
 * Deterministic operational agent. It only recommends actions from verified
 * provider data; it does not fabricate provider state or execute payments.
 */
import { syncPOS3ToEAT } from './eatPos3BridgeService.js'

export async function runPOS360Agent(providerKey='prototype') {
  const snapshot = await syncPOS3ToEAT(providerKey)
  if (!snapshot?.success) return snapshot
  const actions=[]
  for (const item of snapshot.assets?.reorderAlerts || []) {
    actions.push({type:'REORDER_REVIEW',priority:item.stock<=0?'CRITICAL':'HIGH',entity:item.name,reason:`Stock ${item.stock}, threshold ${item.threshold}`,requiresApproval:true})
  }
  for (const item of snapshot.transactions?.upsellDetails || []) {
    actions.push({type:'SERVICE_OPPORTUNITY',priority:'MEDIUM',entity:item.orderId,table:item.table,reason:'Open check has a low item count and may warrant staff attention.',requiresApproval:true})
  }
  if (snapshot.environment?.servicePace==='STRETCHED') {
    actions.push({type:'STAFF_REBALANCE',priority:'HIGH',reason:'Occupied-table load per active staff is stretched.',requiresApproval:true})
  }
  return {success:true,agent:'POS360_AGENT',provider:providerKey,generatedAt:new Date().toISOString(),snapshot,actions}
}
