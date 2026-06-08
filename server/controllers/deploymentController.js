import { runAllChecks } from '../services/deploymentService.js'

/** GET /api/deployment/checklist — manager+ */
export async function checklist(req, res) {
  try {
    const result = runAllChecks()
    // Non-founders only see status/message, not metadata (risk details)
    const isFounder = req.user?.role === 'founder_level_0'
    const sanitized = isFounder
      ? result
      : {
          ...result,
          checks: result.checks.map(({ key, status, message }) => ({ key, status, message })),
        }
    return res.json({ success: true, data: sanitized })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}

/** POST /api/deployment/run-checks — admin+ */
export async function runChecks(req, res) {
  try {
    const result = runAllChecks()
    return res.json({ success: true, data: result })
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message })
  }
}
