# Implementation decisions

- Use npm workspaces for a single repository and shared root scripts. The client is TypeScript/React/Vite; the API is modern JavaScript/Express.
- Use plain CSS, keeping one styling system and avoiding an extra UI framework.
- Use a MongoDB `MysteryCase` collection with the canonical solution in a `select: false` field and a separate unique-per-case `Accusation` collection.
- Use a browser-generated local ID in `X-Client-Id` to scope no-auth MVP case lists. This is convenience isolation only, not secure identity or a production authorization boundary.
- Default local development to an explicit fictional mock generator so the complete gameplay loop works without a Gemini key or paid request. The mock case passes the same contract/fairness validation and MongoDB persistence. Production rejects mock mode.
- Gemini mode requires the server environment to provide both `GEMINI_API_KEY` and `GEMINI_MODEL`; the model identifier is not hard-coded as a fallback. Gemini structured JSON is parsed and validated before storage.
- Image generation remains optional. Image evidence carries a fictional image prompt and alt text and renders a labelled text illustration placeholder.
- Hide evidence rationale and classification from case/evidence endpoints; expose the stored reasoning only in the post-accusation reveal.
- Apply rate limiting to case generation, not to ordinary evidence review or reading.
- Delete case and accusation together. No automatic retention period is configured for this local MVP.

## Known MVP limits

- No authentication, durable user accounts, cross-device sync, or secure multi-user ownership.
- No live Gemini request was made during implementation verification, to avoid spending the configured API quota without approval. Gemini is implemented and selectable through environment configuration; mock generation verifies the end-to-end flow.
- Mock content is a repeatable sample scenario; Gemini provides premise-specific generated stories when enabled.
