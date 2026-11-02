export function requireClientId(req, res, next) {
  const clientId = req.get('x-client-id')
  if (!clientId || !/^[a-zA-Z0-9-]{16,64}$/.test(clientId)) {
    return res.status(400).json({ error: { code: 'CLIENT_ID_REQUIRED', message: 'Please refresh the page and try again.', requestId: req.id } })
  }
  req.clientId = clientId
  next()
}
