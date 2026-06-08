/**
 * Global Express error handler.
 * Catches any error passed to next(err) and returns a safe JSON response.
 * Stack traces are only included in development mode.
 */
export function errorHandler(err, req, res, _next) {
  const isDev    = process.env.NODE_ENV !== 'production'
  const status   = err.status || err.statusCode || 500
  const message  = isDev
    ? (err.message || 'Internal server error')
    : 'Internal server error'

  if (isDev) {
    console.error('[NOVEE OS ERROR]', err)
  }

  res.status(status).json({
    success: false,
    message,
    ...(isDev && err.stack ? { stack: err.stack } : {}),
  })
}
