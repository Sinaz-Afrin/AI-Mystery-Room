import crypto from 'node:crypto'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { env } from './config/env.js'
import { errorHandler } from './middleware/errorHandler.js'
import { notFound } from './middleware/notFound.js'
import healthRouter from './routes/health.js'
import casesRouter from './routes/cases.js'

export const app = express()

app.disable('x-powered-by')
app.use((req, res, next) => {
  req.id = crypto.randomUUID()
  res.setHeader('X-Request-Id', req.id)
  next()
})
app.use(helmet())
app.use(cors({ origin: env.CLIENT_ORIGIN }))
app.use(express.json({ limit: '32kb' }))
app.use('/api/v1/health', healthRouter)
app.use('/api/v1/cases', casesRouter)
app.use(notFound)
app.use(errorHandler)
