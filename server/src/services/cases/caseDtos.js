export function toPublicEvidence(evidence) {
  const { rationale: _privateRationale, classification: _privateClassification, ...publicEvidence } = evidence.toObject?.() ?? evidence
  return publicEvidence
}

export function toPublicCase(record, accusation = null) {
  const value = record.toObject ? record.toObject() : record
  return {
    id: String(value._id),
    status: accusation ? 'accused' : value.status,
    title: value.title,
    premise: value.premise,
    briefing: value.briefing,
    difficulty: value.difficulty,
    tone: value.tone,
    createdAt: value.createdAt,
    suspects: value.suspects.map(({ _id: _id, ...suspect }) => suspect),
    timeline: value.timeline,
    evidence: value.evidence.map(toPublicEvidence),
    playerState: { reviewedEvidenceIds: value.playerState?.reviewedEvidenceIds ?? [] },
    accusation: accusation ? { suspectId: accusation.suspectId, submittedAt: accusation.createdAt } : null,
  }
}

export function toReveal(record, accusation) {
  const value = record.toObject ? record.toObject() : record
  const solution = value.solutionPrivate
  const culprit = value.suspects.find(({ id }) => id === solution.culpritSuspectId)
  const selected = value.suspects.find(({ id }) => id === accusation.suspectId)
  const evidenceById = new Map(value.evidence.map((item) => [item.id, item]))
  return {
    correct: accusation.isCorrect,
    selectedSuspect: selected ? { id: selected.id, name: selected.name } : null,
    culprit: culprit ? { id: culprit.id, name: culprit.name, role: culprit.role } : null,
    reasoning: solution.reasoning,
    decisiveEvidence: solution.decisiveEvidenceIds.map((id) => evidenceById.get(id)).filter(Boolean).map(toPublicEvidence),
    redHerringExplanations: solution.redHerringExplanations.map((item) => ({ ...item, evidence: toPublicEvidence(evidenceById.get(item.evidenceId) ?? {}) })),
    timeline: value.timeline,
    finalNarrative: solution.finalNarrative,
    submittedAt: accusation.createdAt,
  }
}
