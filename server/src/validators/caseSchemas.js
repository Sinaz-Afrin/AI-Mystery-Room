import { z } from 'zod'

const evidenceType = z.enum(['chat', 'image', 'cctv', 'statement', 'document', 'timeline', 'physical'])
const suspectSchema = z.object({
  id: z.string().min(1).max(40), name: z.string().min(1).max(100), role: z.string().min(1).max(120),
  profile: z.string().min(1).max(1200), motive: z.string().min(1).max(800),
  opportunity: z.string().min(1).max(800), alibi: z.string().min(1).max(800),
  evidenceIds: z.array(z.string().min(1)).max(15),
})
const timelineSchema = z.object({
  id: z.string().min(1).max(40), timestamp: z.string().min(1).max(100), event: z.string().min(1).max(600),
  relatedSuspectIds: z.array(z.string()).max(5), evidenceIds: z.array(z.string()).max(15),
})
const evidenceSchema = z.object({
  id: z.string().min(1).max(40), type: evidenceType, title: z.string().min(1).max(140),
  description: z.string().min(1).max(600), content: z.string().min(1).max(4000),
  timestamp: z.string().max(100).optional(), relatedSuspectIds: z.array(z.string()).max(5),
  classification: z.enum(['key', 'supporting', 'red_herring']), rationale: z.string().min(1).max(800),
  image: z.object({ status: z.enum(['none', 'pending', 'ready', 'failed']).default('none'), prompt: z.string().max(600).optional(), alt: z.string().max(300).default(''), fictionalLabel: z.literal('AI-generated fictional evidence').default('AI-generated fictional evidence') }).optional(),
}).superRefine((value, context) => {
  if (value.type === 'image' && (!value.image?.alt || !value.image?.prompt)) {
    context.addIssue({ code: 'custom', message: 'Image evidence needs descriptive fictional image prompt and alt text.', path: ['image'] })
  }
})

export const generationRequestSchema = z.object({
  premise: z.string().trim().min(50, 'Please provide a scenario with at least 50 characters.').max(1500, 'Please keep the scenario under 1,500 characters.'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  tone: z.enum(['classic_detective', 'suspense', 'lighthearted']).default('classic_detective'),
  evidenceVolume: z.enum(['compact', 'standard', 'detailed']).default('standard'),
})

export const generatedCaseSchema = z.object({
  title: z.string().min(1).max(140), briefing: z.string().min(1).max(3000),
  suspects: z.array(suspectSchema).min(3).max(5),
  timeline: z.array(timelineSchema).min(3).max(12),
  evidence: z.array(evidenceSchema).min(5).max(15),
  solutionPrivate: z.object({
    culpritSuspectId: z.string().min(1), reasoning: z.string().min(1).max(2000),
    decisiveEvidenceIds: z.array(z.string()).min(2).max(8),
    redHerringExplanations: z.array(z.object({ evidenceId: z.string(), explanation: z.string().min(1).max(800) })).max(10),
    finalNarrative: z.string().min(1).max(2000),
  }),
})

export function validateGeneratedCase(raw, requestedVolume = 'standard') {
  const data = generatedCaseSchema.parse(raw)
  const suspectIds = new Set(data.suspects.map((item) => item.id))
  const evidenceIds = new Set(data.evidence.map((item) => item.id))
  if (suspectIds.size !== data.suspects.length) throw new Error('Suspect IDs must be unique.')
  if (evidenceIds.size !== data.evidence.length) throw new Error('Evidence IDs must be unique.')
  if (!suspectIds.has(data.solutionPrivate.culpritSuspectId)) throw new Error('The solution refers to a missing suspect.')
  const requiredEvidence = requestedVolume === 'compact' ? 5 : requestedVolume === 'detailed' ? 10 : 6
  if (data.evidence.length < requiredEvidence) throw new Error(`This case needs at least ${requiredEvidence} evidence items.`)
  for (const suspect of data.suspects) {
    if (suspect.evidenceIds.some((id) => !evidenceIds.has(id))) throw new Error('A suspect refers to missing evidence.')
  }
  let previousMinute = -1
  for (const event of data.timeline) {
    if (event.relatedSuspectIds.some((id) => !suspectIds.has(id)) || event.evidenceIds.some((id) => !evidenceIds.has(id))) throw new Error('The timeline contains an invalid reference.')
    const minute = timelineMinute(event.timestamp)
    if (minute === null || minute < previousMinute) throw new Error('Timeline events must have parseable timestamps in chronological order.')
    previousMinute = minute
  }
  for (const item of data.evidence) {
    if (item.relatedSuspectIds.some((id) => !suspectIds.has(id))) throw new Error('Evidence refers to a missing suspect.')
  }
  // These fields describe the same relationship from opposite directions.
  // Accept a valid one-sided reference and normalize both lists to their union.
  for (const suspect of data.suspects) {
    for (const evidenceId of suspect.evidenceIds) {
      const item = data.evidence.find(({ id }) => id === evidenceId)
      if (!item.relatedSuspectIds.includes(suspect.id)) item.relatedSuspectIds.push(suspect.id)
    }
  }
  for (const item of data.evidence) {
    for (const suspectId of item.relatedSuspectIds) {
      const suspect = data.suspects.find(({ id }) => id === suspectId)
      if (!suspect.evidenceIds.includes(item.id)) suspect.evidenceIds.push(item.id)
    }
  }
  if (data.solutionPrivate.decisiveEvidenceIds.some((id) => !evidenceIds.has(id))) throw new Error('The solution refers to missing evidence.')
  if (data.solutionPrivate.redHerringExplanations.some(({ evidenceId }) => !evidenceIds.has(evidenceId))) throw new Error('A red-herring explanation refers to missing evidence.')
  const explainedRedHerrings = new Set(data.solutionPrivate.redHerringExplanations.map(({ evidenceId }) => evidenceId))
  if (data.evidence.some((item) => item.classification === 'red_herring' && !explainedRedHerrings.has(item.id))) throw new Error('Every red herring needs a stored explanation.')
  const culpritClues = data.evidence.filter((item) => item.relatedSuspectIds.includes(data.solutionPrivate.culpritSuspectId) && ['key', 'supporting'].includes(item.classification))
  if (culpritClues.length < 2) throw new Error('At least two independent clues must support the culprit.')
  const keyClue = culpritClues.some((item) => item.classification === 'key' && data.solutionPrivate.decisiveEvidenceIds.includes(item.id))
  if (!keyClue) throw new Error('At least one decisive key clue must distinguish the culprit.')
  return data
}

function timelineMinute(value) {
  const iso = Date.parse(value)
  if (!Number.isNaN(iso)) return Math.floor(iso / 60000)
  const match = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!match) return null
  let hours = Number(match[1])
  const minutes = Number(match[2])
  if (minutes > 59 || hours > 24 || hours === 24 && minutes !== 0) return null
  if (match[3]) {
    if (hours < 1 || hours > 12) return null
    hours = (hours % 12) + (match[3].toUpperCase() === 'PM' ? 12 : 0)
  }
  return hours * 60 + minutes
}
