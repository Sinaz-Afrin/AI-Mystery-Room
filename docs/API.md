# API

All routes use `/api/v1`. Requests that access cases require an `X-Client-Id` header containing the browser's anonymous local ID. The ID provides local browser scoping only; it is not authentication or production multi-user access control.

## Routes

- `GET /health` — service and database status.
- `POST /cases` — create a case synchronously. Body: `{ premise, difficulty, tone, evidenceVolume }`. Returns `201` with the public case.
- `GET /cases` — list cases for the browser ID.
- `GET /cases/:caseId` — return the public case without solution or private clue labels.
- `GET /cases/:caseId/evidence/:evidenceId` — return one public evidence artifact.
- `POST /cases/:caseId/reviewed-evidence` — body `{ evidenceId }`; persist review progress.
- `POST /cases/:caseId/accusations` — body `{ suspectId, reasoningNote? }`; accepts one accusation and returns the stored reveal.
- `GET /cases/:caseId/result` — return the reveal after an accusation.
- `DELETE /cases/:caseId` — delete a case and its accusation.

Errors use `{ error: { code, message, requestId } }`. Scenario length is 50–1,500 characters. One final accusation is permitted per case.

## Secret boundary

Case and evidence serializers omit the culprit, solution, evidence rationale, and clue classification. Reveal data is returned only after a valid accusation. Gemini credentials remain on the server.
