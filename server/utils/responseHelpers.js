/**
 * Standardised JSON response helpers.
 * All API responses follow: { success, message, data }
 */

export function success(res, data = {}, message = 'Success') {
  return res.json({ success: true, message, data })
}

export function error(res, message = 'Something went wrong', status = 400, details = null) {
  return res.status(status).json({ success: false, message, ...(details ? { details } : {}) })
}
