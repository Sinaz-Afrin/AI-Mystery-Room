export function notFound(_req, _res, next) {
  const error = new Error('The requested resource was not found.')
  error.status = 404
  error.code = 'NOT_FOUND'
  next(error)
}
