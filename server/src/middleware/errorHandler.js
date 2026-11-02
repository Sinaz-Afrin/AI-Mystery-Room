export function errorHandler(error, req, res, _next) {
  const status = Number.isInteger(error.status) ? error.status : 500
  const code = status === 500 ? 'INTERNAL_ERROR' : (error.code ?? 'REQUEST_ERROR')
  if (status >= 500) console.error({ requestId: req.id, errorName: error.name, code: error.code }, 'Request failed')
  res.status(status).json({
    error: {
      code,
      message: status >= 500 ? 'Something went wrong. Please try again.' : error.message,
      requestId: req.id,
    },
  })
}
