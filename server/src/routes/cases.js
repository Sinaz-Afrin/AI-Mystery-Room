import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { rateLimit } from 'express-rate-limit'
import { env } from '../config/env.js'
import { Accusation } from '../models/Accusation.js'
import { MysteryCase } from '../models/MysteryCase.js'
import { requireClientId } from '../middleware/requireClientId.js'
import { generateCase } from '../services/caseGeneration/generator.js'
import { toPublicCase, toPublicEvidence, toReveal } from '../services/cases/caseDtos.js'
import { generationRequestSchema } from '../validators/caseSchemas.js'

const router = Router()
router.use(requireClientId)
let activeGenerations = 0
const generationLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  limit: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: { code: 'RATE_LIMITED', message: 'Too many case requests. Please wait a little and try again.', requestId: req.id } }),
})
function limitGenerationConcurrency(_req, res, next) {
  if (activeGenerations >= env.GENERATION_MAX_CONCURRENT) {
    return res.status(503).json({ error: { code: 'GENERATION_BUSY', message: 'Mystery generation is busy. Please retry shortly.', requestId: res.getHeader('X-Request-Id') } })
  }
  activeGenerations += 1
  res.on('finish', () => { activeGenerations = Math.max(0, activeGenerations - 1) })
  next()
}

function notFound() {
  const error = new Error('Case not found.')
  error.status = 404
  error.code = 'CASE_NOT_FOUND'
  return error
}

function invalidId(id) { return !mongoose.isValidObjectId(id) }

router.post('/', generationLimiter, limitGenerationConcurrency, async (req, res) => {
  const parsed = generationRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message ?? 'Please check the scenario and settings.', requestId: req.id } })
  }
  const request = parsed.data
  const generated = await generateCase(request, req.id)
  const record = await MysteryCase.create({
    ownerId: req.clientId, status: 'playable', premise: request.premise, difficulty: request.difficulty,
    tone: request.tone, title: generated.title, briefing: generated.briefing, suspects: generated.suspects,
    timeline: generated.timeline, evidence: generated.evidence, solutionPrivate: generated.solutionPrivate,
    playerState: { reviewedEvidenceIds: [] },
  })
  res.status(201).json({ case: toPublicCase(record) })
})

router.get('/', async (req, res) => {
  const records = await MysteryCase.find({ ownerId: req.clientId }).sort({ createdAt: -1 }).lean()
  const ids = records.map(({ _id }) => _id)
  const accusations = await Accusation.find({ caseId: { $in: ids } }).lean()
  const byCase = new Map(accusations.map((item) => [String(item.caseId), item]))
  res.json({ cases: records.map((item) => toPublicCase(item, byCase.get(String(item._id)) ?? null)) })
})

router.get('/:caseId', async (req, res) => {
  if (invalidId(req.params.caseId)) throw notFound()
  const record = await MysteryCase.findOne({ _id: req.params.caseId, ownerId: req.clientId }).lean()
  if (!record) throw notFound()
  const accusation = await Accusation.findOne({ caseId: record._id }).lean()
  res.json({ case: toPublicCase(record, accusation) })
})

router.get('/:caseId/evidence/:evidenceId', async (req, res) => {
  if (invalidId(req.params.caseId)) throw notFound()
  const record = await MysteryCase.findOne({ _id: req.params.caseId, ownerId: req.clientId }, { evidence: 1 }).lean()
  const evidence = record?.evidence.find(({ id }) => id === req.params.evidenceId)
  if (!evidence) throw notFound()
  res.json({ evidence: toPublicEvidence(evidence) })
})

router.post('/:caseId/reviewed-evidence', async (req, res) => {
  const parsed = z.object({ evidenceId: z.string().min(1).max(40) }).safeParse(req.body)
  if (!parsed.success || invalidId(req.params.caseId)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose evidence from this case.', requestId: req.id } })
  }
  const record = await MysteryCase.findOne({ _id: req.params.caseId, ownerId: req.clientId, 'evidence.id': parsed.data.evidenceId })
  if (!record) throw notFound()
  const reviewedEvidenceIds = record.playerState?.reviewedEvidenceIds ?? []
  if (!reviewedEvidenceIds.includes(parsed.data.evidenceId)) {
    record.playerState = { reviewedEvidenceIds: [...reviewedEvidenceIds, parsed.data.evidenceId] }
    await record.save()
  }
  res.json({ reviewedEvidenceIds: record.playerState.reviewedEvidenceIds })
})

router.post('/:caseId/accusations', async (req, res) => {
  const parsed = z.object({ suspectId: z.string().min(1).max(40), reasoningNote: z.string().trim().max(500).optional() }).safeParse(req.body)
  if (!parsed.success || invalidId(req.params.caseId)) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Choose one of the suspects in this case.', requestId: req.id } })
  }
  const record = await MysteryCase.findOne({ _id: req.params.caseId, ownerId: req.clientId }).select('+solutionPrivate')
  if (!record) throw notFound()
  if (record.status !== 'playable') {
    return res.status(409).json({ error: { code: 'INVALID_CASE_STATE', message: 'This case already has a final accusation.', requestId: req.id } })
  }
  if (!record.suspects.some(({ id }) => id === parsed.data.suspectId)) {
    return res.status(400).json({ error: { code: 'INVALID_SUSPECT', message: 'Choose a suspect listed in this case.', requestId: req.id } })
  }
  const isCorrect = record.solutionPrivate.culpritSuspectId === parsed.data.suspectId
  let accusation
  try {
    accusation = await Accusation.create({ caseId: record._id, suspectId: parsed.data.suspectId, reasoningNote: parsed.data.reasoningNote, isCorrect })
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: { code: 'DUPLICATE_ACCUSATION', message: 'A final accusation has already been submitted for this case.', requestId: req.id } })
    throw error
  }
  record.status = 'accused'
  await record.save()
  res.status(201).json({ reveal: toReveal(record, accusation) })
})

router.get('/:caseId/result', async (req, res) => {
  if (invalidId(req.params.caseId)) throw notFound()
  const record = await MysteryCase.findOne({ _id: req.params.caseId, ownerId: req.clientId }).select('+solutionPrivate')
  if (!record) throw notFound()
  const accusation = await Accusation.findOne({ caseId: record._id })
  if (!accusation) return res.status(409).json({ error: { code: 'REVEAL_LOCKED', message: 'Submit your accusation to reveal the solution.', requestId: req.id } })
  res.json({ reveal: toReveal(record, accusation) })
})

router.delete('/:caseId', async (req, res) => {
  if (invalidId(req.params.caseId)) throw notFound()
  const record = await MysteryCase.findOneAndDelete({ _id: req.params.caseId, ownerId: req.clientId })
  if (!record) throw notFound()
  await Accusation.deleteOne({ caseId: record._id })
  res.status(204).end()
})

export default router
