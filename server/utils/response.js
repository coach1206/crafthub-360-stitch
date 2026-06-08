/**
 * Response helpers — consistent JSON envelope for all API responses.
 *
 * Success shape:   { success: true,  data: {...} }
 * Failure shape:   { success: false, message: "..." }
 */

/** 200 OK with data payload. */
export const ok = (res, data, status = 200) =>
  res.status(status).json({ success: true, data })

/** 201 Created with data payload. */
export const created = (res, data) =>
  res.status(201).json({ success: true, data })

/** 400-level client error. */
export const fail = (res, message = 'Bad request', status = 400) =>
  res.status(status).json({ success: false, message })

/** 404 Not Found. */
export const notFound = (res, resource = 'Resource') =>
  res.status(404).json({ success: false, message: `${resource} not found` })

/** 500 server error — strips stack traces in production. */
export const serverError = (res, err, context = '') => {
  const isDev = process.env.NODE_ENV !== 'production'
  const message = isDev
    ? `[${context}] ${err?.message || String(err)}`
    : 'Internal server error'
  if (isDev) console.error(`[NOVEE OS] ${context}:`, err)
  res.status(500).json({ success: false, message })
}
