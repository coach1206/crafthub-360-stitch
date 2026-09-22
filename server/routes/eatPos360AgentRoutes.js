import { Router } from 'express'
import { requireAuth } from '../middleware/authMiddleware.js'
import { requireManager } from '../middleware/roleMiddleware.js'
import { runPOS360Agent } from '../services/pos360AgentService.js'
import { runEATSystemAgent } from '../services/eatSystemAgentService.js'
import { getHospitalityIntelligence } from '../services/hospitalityIntelligenceService.js'

const router=Router()
router.use(requireAuth,requireManager)
router.get('/pos360/:providerKey',async(req,res)=>res.json(await runPOS360Agent(req.params.providerKey)))
router.get('/eat/:providerKey',async(req,res)=>res.json(await runEATSystemAgent(req.params.providerKey)))
router.get('/hospitality/:providerKey',async(req,res)=>res.json(await getHospitalityIntelligence(req.params.providerKey)))
export default router
