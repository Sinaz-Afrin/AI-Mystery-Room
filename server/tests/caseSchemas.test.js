import test from 'node:test'
import assert from 'node:assert/strict'
import { createMockCase } from '../src/services/caseGeneration/mockGenerator.js'
import { generationRequestSchema, validateGeneratedCase } from '../src/validators/caseSchemas.js'
import { toPublicCase, toPublicEvidence, toReveal } from '../src/services/cases/caseDtos.js'
import { makeGeminiOutputSchema } from '../src/services/caseGeneration/geminiSchema.js'

const request = {
  premise: 'A rare artifact vanished from the old observatory during a private evening reception.',
  difficulty: 'medium', tone: 'classic_detective', evidenceVolume: 'standard',
}

test('scenario validation enforces limits and supplies settings defaults', () => {
  assert.equal(generationRequestSchema.safeParse({ premise: 'too short' }).success, false)
  assert.deepEqual(generationRequestSchema.parse({ premise: request.premise }), { premise: request.premise, difficulty: 'medium', tone: 'classic_detective', evidenceVolume: 'standard' })
})

test('mock cases meet the structural and fairness contract at every volume', () => {
  for (const evidenceVolume of ['compact', 'standard', 'detailed']) {
    const generated = validateGeneratedCase(createMockCase(request.premise, { ...request, evidenceVolume }), evidenceVolume)
    assert.ok(generated.suspects.length >= 3 && generated.suspects.length <= 5)
    assert.ok(generated.evidence.length >= 5)
  }
})

test('case validator rejects duplicate IDs and references to absent suspects', () => {
  const generated = createMockCase(request.premise, request)
  generated.suspects[1].id = generated.suspects[0].id
  assert.throws(() => validateGeneratedCase(generated), /unique/)

  const badReferences = createMockCase(request.premise, request)
  badReferences.timeline[0].relatedSuspectIds = ['not-a-suspect']
  assert.throws(() => validateGeneratedCase(badReferences), /invalid reference/)
})

test('case validator rejects unexplained red herrings and out-of-order timeline entries', () => {
  const missingExplanation = createMockCase(request.premise, request)
  missingExplanation.solutionPrivate.redHerringExplanations = []
  assert.throws(() => validateGeneratedCase(missingExplanation), /red herring needs/)

  const outOfOrder = createMockCase(request.premise, request)
  outOfOrder.timeline[2].timestamp = '8:00 PM'
  assert.throws(() => validateGeneratedCase(outOfOrder), /chronological order/)
})

test('case validator reconciles valid one-sided suspect/evidence references', () => {
  const generated = createMockCase(request.premise, request)
  generated.suspects[0].evidenceIds = generated.suspects[0].evidenceIds.filter((id) => id !== 'wax-trace')
  generated.evidence.find(({ id }) => id === 'service-key').relatedSuspectIds = []
  const validated = validateGeneratedCase(generated)
  assert.ok(validated.suspects[0].evidenceIds.includes('wax-trace'))
  assert.ok(validated.evidence.find(({ id }) => id === 'service-key').relatedSuspectIds.includes('jonas-reed'))
})

test('public case and evidence DTOs keep the solution and private rationale hidden', () => {
  const generated = validateGeneratedCase(createMockCase(request.premise, request))
  const publicCase = toPublicCase({ ...generated, _id: 'case-id', status: 'playable', createdAt: new Date(), playerState: { reviewedEvidenceIds: [] } })
  assert.equal('solutionPrivate' in publicCase, false)
  assert.equal('rationale' in publicCase.evidence[0], false)
  assert.equal('classification' in publicCase.evidence[0], false)
  assert.equal('rationale' in toPublicEvidence(generated.evidence[0]), false)
  assert.equal('classification' in toPublicEvidence(generated.evidence[0]), false)
})

test('reveal DTO resolves stored canonical solution and clue references', () => {
  const generated = validateGeneratedCase(createMockCase(request.premise, request))
  const reveal = toReveal({ ...generated, _id: 'case-id', status: 'accused', createdAt: new Date(), playerState: { reviewedEvidenceIds: [] } }, { suspectId: 'mara-vale', isCorrect: true, createdAt: new Date() })
  assert.equal(reveal.culprit.id, 'mara-vale')
  assert.equal(reveal.correct, true)
  assert.equal(reveal.decisiveEvidence.length, 3)
  assert.equal('rationale' in reveal.decisiveEvidence[0], false)
})

test('Gemini structured-output schema contains only supported JSON Schema keywords', () => {
  const schema = makeGeminiOutputSchema()
  const supported = new Set(['$id', '$defs', '$ref', '$anchor', 'type', 'format', 'title', 'description', 'enum', 'items', 'prefixItems', 'minimum', 'maximum', 'anyOf', 'oneOf', 'properties', 'additionalProperties', 'required', 'propertyOrdering'])
  function inspect(value, schemaNode = true) {
    if (Array.isArray(value)) return value.forEach((child) => inspect(child, true))
    if (!value || typeof value !== 'object') return
    if (!schemaNode) return Object.values(value).forEach((child) => inspect(child, true))
    for (const [key, child] of Object.entries(value)) {
      if (key === 'properties' || key === '$defs') {
        inspect(child, false)
        continue
      }
      assert.ok(supported.has(key), `unsupported Gemini schema keyword: ${key}`)
      inspect(child, true)
    }
  }
  inspect(schema)
  assert.deepEqual(Object.keys(schema.properties), ['title', 'briefing', 'suspects', 'timeline', 'evidence', 'solutionPrivate'])
  assert.equal(schema.$schema, undefined)
  assert.equal(JSON.stringify(schema).includes('"format"'), false)
  assert.equal(JSON.stringify(schema).includes('"maxItems"'), false)
  assert.equal(JSON.stringify(schema).includes('"minItems"'), false)
  assert.ok(schema.properties.evidence.items.properties.image.properties.fictionalLabel.enum)
})
