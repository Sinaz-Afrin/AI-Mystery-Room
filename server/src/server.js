import { app } from './app.js'
import { connectDatabase } from './config/database.js'
import { env } from './config/env.js'

try {
  await connectDatabase()
  const server = app.listen(env.PORT, () => {
    console.info(`AI Mystery Room API listening on port ${env.PORT} (${env.GENERATION_MODE} generation)`)
  })

  const shutdown = (signal) => {
    console.info(`${signal} received; shutting down`)
    server.close(() => process.exit(0))
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
} catch (error) {
  console.error('Unable to start API. Check database availability and server configuration.', error.name)
  process.exit(1)
}
