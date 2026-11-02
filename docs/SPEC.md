# AI Mystery Room --- Master Specification

**Document type:** Single Source of Truth (SSOT) for Spec-Driven Development\
**Version:** 1.0\
**Status:** Initial implementation specification\
**Product name:** AI Mystery Room\
**Primary stack:** MongoDB, Express.js, React, Node.js (MERN)\
**AI provider:** Google Gemini API\
**Primary implementation agent:** OpenAI Codex

------------------------------------------------------------------------

## 1. Purpose and Authority

This document is the authoritative product and engineering specification for AI Mystery Room. Codex must use it to plan, implement, test, and document the application.

### Source-of-truth rules

1.  Treat this document as the canonical product requirement.
2.  Do not silently remove, reinterpret, or add major product features.
3.  If implementation details are unspecified, choose the simplest secure, maintainable solution consistent with this specification and document the decision in `docs/DECISIONS.md`.
4.  Never expose Gemini API keys or other secrets to the browser.
5.  Do not claim a feature works until it is implemented and tested.
6.  Keep `README.md`, `.env.example`, API documentation, tests, and implementation aligned with this specification.
7.  If requirements conflict, security and data integrity take precedence; otherwise prefer the requirements in this document.
8.  Build in small, verifiable phases. Run relevant tests after each phase and report failures honestly.

## 2. Product Overview

AI Mystery Room is an interactive, AI-powered fictional investigation game. A player submits a short scenario, premise, or story idea. The application uses Gemini on the server to transform that input into a playable mystery.

The generated investigation includes: - A fictional case briefing and setting. - A fixed set of suspects, each with a motive, opportunity, and alibi. - A hidden canonical culprit. - A timeline of events. - Evidence artifacts such as fictional chat messages, written statements, images, CCTV-style recordings or transcripts, access logs, and physical clues. - Contradictions, red herrings, and genuine clues. - A final accusation step. - A reveal explaining the culprit and how the evidence supports the solution.

The player examines the available evidence, forms a theory, selects one suspect, and submits an accusation. The application then reveals whether the choice was correct and explains the reasoning.

### Product principles

-   **Fair mystery:** The intended culprit must be inferable from the evidence.
-   **Consistency:** All evidence, timelines, alibis, and the solution must agree with one canonical case record.
-   **Player agency:** Evidence can be opened in any order; the player chooses when to accuse.
-   **Fiction and safety:** All people, messages, locations, records, and events are fictional. Do not impersonate real people or present generated evidence as authentic.
-   **Reliable generation:** Validate AI output before making a case playable.
-   **Privacy:** Do not use submitted scenarios to train or fine-tune a model. Do not log API keys or unnecessary sensitive user input.

## 3. Goals and Non-Goals

### Goals

1.  Let a user create a mystery from a short text premise.
2.  Generate a complete, structured case using Gemini.
3.  Present a polished investigation-room interface with multiple evidence types.
4.  Let players inspect evidence and accuse a suspect.
5.  Evaluate the accusation against a fixed solution.
6.  Provide a spoiler-aware reveal and explanation.
7.  Save and reopen investigations when persistence is enabled.
8.  Handle model failures, malformed responses, loading states, and empty states gracefully.
9.  Make the project straightforward to run locally and deploy.

### Initial non-goals

-   Real-world criminal investigation or legal advice.
-   Real access to WhatsApp, private cameras, social accounts, police databases, or devices.
-   Uploading or analysing real CCTV or private communications.
-   Multiplayer, chat rooms, public leaderboards, or social sharing.
-   Payments, subscriptions, advertisements, or user-generated public case galleries.
-   Training a custom AI model.
-   Generating playable video footage as a mandatory requirement. A clearly labelled fictional CCTV image, storyboard, or transcript is acceptable for the MVP.
-   Complex user accounts and authentication in the MVP unless explicitly added in a later approved change.

## 4. Users and Core User Journey

### Primary user

A person who enjoys puzzles, detective stories, escape rooms, and interactive reasoning.

### Main flow

1.  Open the landing page.
2.  Enter a scenario or story premise.
3.  Choose optional settings such as difficulty, tone, and evidence count.
4.  Submit the form.
5.  See a loading/progress state while the server generates and validates the case.
6.  Enter the investigation room.
7.  Read the briefing and review suspects.
8.  Open evidence artifacts, inspect details, and compare information.
9.  Select a suspect and optionally enter a short reasoning note.
10. Confirm the accusation.
11. View the result and spoiler reveal, including the canonical culprit, decisive evidence, timeline, and explanation.
12. Start a new case or return to the case list.

### Required MVP screens

-   Landing / Create Case
-   Case Generation Loading / Error state
-   Investigation Room
-   Evidence Detail modal, drawer, or panel
-   Accusation confirmation
-   Case Reveal / Results
-   Saved Cases list (may be local-only in a no-auth MVP)
-   Not Found / general error state

## 5. Functional Requirements

### FR-01: Create a mystery

-   Provide a required scenario text area.
-   Recommended input length: 50--1,500 characters; enforce limits on both client and server.
-   Show a character counter and validation message.
-   Reject blank, excessively long, or unsupported inputs with a helpful message.
-   Include optional settings:
    -   Difficulty: Easy, Medium, Hard (default Medium)
    -   Tone: Classic Detective, Suspense, Lighthearted (default Classic Detective)
    -   Evidence volume: Compact, Standard, Detailed (default Standard)
-   Do not let user settings override security rules or fictional-only constraints.
-   A successful submission creates a generation request and eventually a playable case.

### FR-02: Generate a complete case

Gemini must generate one complete case object, not unrelated evidence
fragments on demand. The object must include the case summary, suspects,
culprit ID, timeline, evidence, clue relationships, and solution
explanation.

Generation must: - Use a server-side Gemini SDK/API integration. -
Request structured JSON output where supported. - Parse and validate the
result against a server-defined schema. - Retry a limited number of
times for recoverable malformed output. - Never trust the model output
without validation. - Verify all suspect IDs and evidence references. -
Ensure the canonical culprit matches an existing suspect. - Ensure the
solution is supported by evidence and the timeline is coherent. - Save
the validated case before exposing it to the player. - Return a friendly
error if generation fails; do not create a half-playable case.

### FR-03: Suspects

Each case should normally contain 3--5 suspects. Each suspect must
have: - Stable unique ID within the case - Name - Fictional
role/relationship to the incident - Short profile - Motive -
Opportunity - Alibi - Publicly visible summary - Optional fictional
portrait image or avatar - Evidence references that relate to the
suspect

Do not reveal the culprit field or private solution data in public case
APIs before accusation submission.

### FR-04: Evidence

A Standard case should contain approximately 6--10 artifacts. Compact
and Detailed settings may adjust this count.

Supported evidence types: - `chat`: fictional messaging conversation
resembling a generic chat interface - `image`: fictional scene, object,
or clue image - `cctv`: fictional CCTV still, storyboard, or transcript
with timestamp - `statement`: witness or suspect statement - `document`:
fictional note, report, receipt, or record - `timeline`: event or access
record - `physical`: written description of a physical clue

Every artifact must include: - Stable evidence ID - Type - Title - Short
description - Full content or structured content payload - In-world
timestamp, when applicable - Related suspect IDs - Clue classification:
`key`, `supporting`, or `red_herring` - A short private rationale
explaining its relevance - Optional generated image asset metadata

Rules: - The player must be able to open and review every available
artifact. - Evidence must be labelled as fictional within the product
UI. - Evidence content must be readable and accessible on desktop and
mobile. - Evidence should contain a mix of direct clues, corroborating
details, and plausible red herrings. - Red herrings must be explainable
and must not make the intended solution unfair. - Evidence must not
change after the case becomes playable. - Evidence order must not
determine the solution. - If an image cannot be generated, show a
designed fallback card or text description. Do not block the case. -
Never fabricate a real person's private messages or real surveillance
footage.

### FR-05: Image generation and media

Gemini text generation is mandatory. Image generation is optional and
provider-dependent.

For the MVP: - Generate a descriptive image prompt and alt text for
image-type evidence. - If an image-generation provider is configured,
generate images on the server or through a secure provider
integration. - If no image provider is configured, render a fictional
evidence illustration placeholder using the text description. - Store
generated assets in a configured storage provider or use a safe
temporary/local strategy during development. - Do not expose provider
secrets to the client. - Do not make image generation a prerequisite for
a valid mystery. - Never represent a generated image as authentic
evidence. Show a "AI-generated fictional evidence" label.

### FR-06: Investigation Room

Display: - Case title and case ID - Case briefing and incident summary -
Difficulty and tone labels - Suspect cards - Evidence board or evidence
list - Timeline - Progress indicator showing evidence reviewed, if
tracking is implemented - Accusation action - Clear indication that the
case is fictional

Player capabilities: - Open and close evidence details. - Filter
evidence by type or related suspect. - Sort evidence by time or default
order. - Navigate between suspect profiles. - Return to the case without
losing progress. - Accuse only a suspect belonging to the current case.

Do not display the culprit ID, solution explanation, or hidden rationale
in client-delivered data before the accusation.

### FR-07: Accusation

-   The player must choose one suspect.
-   Show a confirmation dialog before final submission.
-   Optionally allow a short reasoning note; it is not required for
    correctness.
-   The server must validate that the case exists, is playable, and the
    suspect ID belongs to it.
-   The server evaluates the choice against the stored canonical culprit
    ID.
-   Only one final accusation is permitted per case in the MVP. If retry
    attempts are later added, they must be explicitly specified.
-   The response must not expose the solution before the accusation is
    accepted.
-   Prevent duplicate submissions with button disabling and server-side
    idempotency or equivalent duplicate protection.

### FR-08: Reveal and results

After a valid accusation, display: - Correct or incorrect result - The
player's selected suspect - The actual culprit - The decisive clues and
how they connect - A coherent incident timeline - Explanation of each
key clue - Explanation of red herrings - A concise final narrative
explaining what happened - Actions to return to the case list or create
another mystery

The reveal must use the stored canonical solution. Do not ask Gemini to
invent a new answer at reveal time. A pre-generated solution explanation
may be stored privately with the case and revealed after accusation.

### FR-09: Saved cases

MVP behaviour: - Persist cases in MongoDB when configured. - Show the
user's locally available cases if authentication is not implemented;
clearly describe this as device/session-local rather than secure
cross-device user storage. - Provide a way to reopen an existing case
and continue examining it before accusation. - Preserve accusation and
reveal state. - Provide a delete action with confirmation if deletion is
implemented. - Never rely only on React state for durable persistence.

If the project uses no authentication, do not pretend cases are private
user-owned records. Add ownership and access control before supporting
multi-user production deployment.

### FR-10: Error and loading states

Handle: - Missing or invalid scenario - Gemini timeout or rate limit -
Gemini unavailable or invalid output - Database unavailable - Case not
found - Invalid suspect ID - Duplicate accusation - Network
disconnection - Optional image generation failure

Messages must be human-readable and must not expose stack traces,
secrets, internal prompts, or raw provider errors. Provide a retry
action when retrying is safe.

## 6. Case Data Contract

Use a typed, validated internal model. The following is a conceptual
contract; implementation may refine field names but must preserve the
information and security boundaries.

``` json
{
  "caseId": "string",
  "status": "generating | playable | accused | failed",
  "title": "string",
  "premise": "string",
  "briefing": "string",
  "difficulty": "easy | medium | hard",
  "tone": "classic_detective | suspense | lighthearted",
  "createdAt": "ISO-8601 datetime",
  "suspects": [
    {
      "id": "string",
      "name": "string",
      "role": "string",
      "profile": "string",
      "motive": "string",
      "opportunity": "string",
      "alibi": "string",
      "evidenceIds": ["string"]
    }
  ],
  "timeline": [
    {
      "id": "string",
      "timestamp": "ISO-8601 or in-world timestamp",
      "event": "string",
      "relatedSuspectIds": ["string"],
      "evidenceIds": ["string"]
    }
  ],
  "evidence": [
    {
      "id": "string",
      "type": "chat | image | cctv | statement | document | timeline | physical",
      "title": "string",
      "description": "string",
      "content": {},
      "timestamp": "optional timestamp",
      "relatedSuspectIds": ["string"],
      "classification": "key | supporting | red_herring",
      "image": {
        "status": "none | pending | ready | failed",
        "url": "optional safe URL",
        "alt": "string",
        "fictionalLabel": "AI-generated fictional evidence"
      }
    }
  ],
  "solutionPrivate": {
    "culpritSuspectId": "string",
    "reasoning": "string",
    "decisiveEvidenceIds": ["string"],
    "redHerringExplanations": [
      {
        "evidenceId": "string",
        "explanation": "string"
      }
    ],
    "finalNarrative": "string"
  },
  "playerState": {
    "reviewedEvidenceIds": ["string"],
    "accusation": {
      "suspectId": "string",
      "reasoningNote": "optional string",
      "submittedAt": "optional ISO-8601 datetime",
      "isCorrect": "optional boolean"
    }
  }
}
```

### Data contract rules

-   Do not return `solutionPrivate` from normal case, suspect, or
    evidence endpoints before a valid accusation.
-   Do not trust IDs, timestamps, or enum values generated by Gemini.
    Normalize or reject invalid data.
-   Use server-generated MongoDB IDs or validated stable IDs for
    persistence.
-   Validate every evidence-to-suspect and timeline-to-evidence
    reference.
-   Separate public and private serializers/DTOs; do not fetch the whole
    MongoDB document and blindly return it.
-   Treat the schema above as conceptual JSON, not a requirement to
    store every field in exactly one MongoDB document.

## 7. Mystery Fairness and Consistency Rules

A case is playable only if it passes all mandatory checks: 1. There are
3--5 unique suspects. 2. `culpritSuspectId` references one existing
suspect. 3. There are at least 5 usable evidence artifacts. 4. Every
referenced suspect/evidence ID exists. 5. The timeline is
chronologically coherent, or clearly explains uncertainty. 6. At least
two independent clues support the canonical culprit. 7. At least one key
clue distinguishes the culprit from plausible alternatives. 8. The final
narrative does not contradict the timeline or evidence. 9. Red herrings
have a plausible explanation. 10. No public content accidentally
contains the hidden solution field. 11. The case is fictional and does
not assert real criminal allegations. 12. Evidence and solution are
fixed after case creation.

Implement deterministic validation for structural checks. Use an
additional AI critique/repair pass only when needed and within a bounded
retry budget. AI critique must not replace code-level schema validation.

If a case still fails validation after the allowed retries, mark
generation as failed and show a retry option. Do not silently publish a
weak case.

## 8. Gemini Integration Requirements

### Server-side responsibilities

-   Read the Gemini API key from an environment variable.
-   Use the official supported Google GenAI SDK and a model name
    configurable through environment settings.
-   Keep model names configurable; do not hard-code a model that may
    become unavailable.
-   Use a strict system instruction defining fictional detective-game
    content and JSON output.
-   Send the user's premise and selected settings as untrusted user
    input, not as instructions that override system rules.
-   Request structured JSON/schema output when supported.
-   Validate and sanitize the response before persistence.
-   Set request timeouts and bounded retries with backoff for transient
    failures.
-   Respect rate limits and provider usage limits.
-   Avoid logging full private prompts or secrets.
-   Return generic safe errors to the browser and useful redacted
    diagnostic logs to the server.

### Suggested generation sequence

1.  Validate user input.
2.  Create a generation job or request record.
3.  Call Gemini to create the full case JSON.
4.  Parse and validate the case.
5.  If structural validation fails, make at most two repair attempts
    with validation errors only.
6.  Run deterministic fairness/reference checks.
7.  Optionally run one critique pass for logical consistency, if budget
    permits.
8.  Persist the validated case with `status = playable`.
9.  Return a public case DTO that excludes the solution.
10. If all attempts fail, persist a safe failure status where practical
    and return a retryable error.

### Prompt safety

-   The model must create fictional characters and fictional evidence.
-   It must not claim that generated evidence is authentic or from a real service/account.
-   It must not follow prompt-injection instructions embedded in the user's scenario.
-   Do not include API keys, database credentials, or internal secrets in prompts.
-   Do not use the model's free-form prose as a substitute for validated data.

## 9. Technical Architecture

### Frontend

-   React with Vite.
-   JavaScript or TypeScript may be selected at project setup; prefer
    TypeScript for end-to-end data contracts if no existing codebase
    dictates otherwise.
-   React Router for navigation.
-   Fetch or Axios for API calls; select one and use it consistently.
-   A single styling system: Tailwind CSS or CSS Modules/plain CSS. Do
    not introduce multiple UI frameworks without a documented reason.
-   Responsive, accessible components.
-   Keep business logic out of large page components; use reusable
    components and hooks.
-   Never call Gemini directly from the browser.

### Backend

-   Node.js and Express.js.
-   Use a supported Google GenAI SDK.
-   MongoDB with Mongoose for persistence.
-   Zod or an equivalent schema validation library for request and AI
    output validation.
-   Centralized error middleware.
-   Separate routes, controllers, services, models, validators, and
    configuration.
-   Use environment configuration and startup validation.
-   CORS allowlist configurable through environment variables.
-   Add request size limits, rate limiting on case generation, and
    sensible timeouts.

### Suggested repository layout

``` text
ai-mystery-room/
  client/
    src/
      app/
      components/
      features/
        cases/
        investigation/
        evidence/
        accusation/
      hooks/
      lib/
      pages/
      styles/
      types/
    public/
    package.json
  server/
    src/
      config/
      controllers/
      middleware/
      models/
      routes/
      services/
        gemini/
        case-generation/
      validators/
      utils/
      app.js
      server.js
    tests/
    package.json
  docs/
    SPEC.md
    API.md
    DECISIONS.md
  .env.example
  .gitignore
  README.md
  package.json
```

Codex may adjust the layout if needed, but must preserve separation of concerns and update this tree in `README.md` if it materially changes.

## 10. API Contract

Prefix all routes with `/api/v1`. Return consistent JSON and appropriate
HTTP status codes.

### `GET /api/v1/health`

Returns service health. Do not expose secrets, connection strings, or detailed infrastructure information.

### `POST /api/v1/cases`

Request:

``` json
{
  "premise": "A rare diamond vanished during a private museum event...",
  "difficulty": "medium",
  "tone": "classic_detective",
  "evidenceVolume": "standard"
}
```

Behaviour: - Validate input. - Generate, validate, and persist a case. -
Return `201 Created` with the public case DTO when synchronous
generation succeeds. - If asynchronous generation is chosen, return
`202 Accepted` with a generation/job ID and implement the polling
endpoint below. - Do not return the private solution.

### `GET /api/v1/cases`

Returns available cases for the current supported storage/ownership
model. Without authentication, document that this is not secure
multi-user ownership.

### `GET /api/v1/cases/:caseId`

Returns case briefing, suspects, timeline, and evidence
metadata/content, excluding private solution fields until authorized.

### `GET /api/v1/cases/:caseId/evidence/:evidenceId`

Returns one public evidence artifact if it belongs to that case. Never
return private rationale if it would reveal the solution.

### `POST /api/v1/cases/:caseId/accusations`

Request:

``` json
{
  "suspectId": "suspect-id",
  "reasoningNote": "Optional explanation"
}
```

Behaviour: - Validate case state and suspect membership. - Enforce one final accusation in the MVP. - Compare against the stored canonical culprit. - Persist the accusation and result. - Return the result and
reveal only after the accusation is accepted.

### `GET /api/v1/cases/:caseId/result`

Returns the reveal only if an accusation has been submitted and the
caller is authorized under the implemented ownership model.

### `DELETE /api/v1/cases/:caseId`

Optional MVP endpoint. If implemented, require authorization under the
supported ownership model and return a safe response.

### Optional asynchronous generation routes

-   `GET /api/v1/generation/:jobId`
-   Return `pending`, `processing`, `completed`, or `failed` and the
    case ID when completed.
-   Do not return private solution data in job status responses.

### Standard error response

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please provide a scenario between 50 and 1500 characters.",
    "requestId": "safe-correlation-id"
  }
}
```

Use appropriate status codes: `400` validation, `404` not found, `409`
invalid state/duplicate accusation, `429` rate limit, `502` upstream AI
failure where appropriate, and `500` unexpected server error. Never send
stack traces to the client.

## 11. MongoDB Model Requirements

Create models or equivalent collections for: - **MysteryCase:** public
case data, generation status, settings, timestamps, and private solution
stored separately or in a clearly protected subdocument. -
**Accusation:** case ID, selected suspect ID, optional reasoning note,
result, and timestamp; can be embedded if transaction/state rules remain
clear. - **GenerationJob:** only if asynchronous generation is used.

Requirements: - Add indexes for common case-list and status queries. -
Use schema constraints and validation. - Store timestamps
consistently. - Prevent accidental solution exposure through API
serializers. - Define deletion and retention behaviour. - Use a
connection timeout and fail clearly when a required database is
unavailable. - Do not silently fall back to in-memory storage in
production. A development-only mock mode must be explicit and clearly
documented.

## 12. UI/UX and Visual Direction

### Design concept

A modern detective caseboard: atmospheric and immersive, but legible and
usable. Avoid cluttered "hacker" visuals or excessive glowing effects.

### Suggested visual system

-   Background: deep charcoal/navy.
-   Panels: dark slate or light neutral cards with clear contrast.
-   Accent: amber/gold for clues and active investigation controls.
-   Secondary accent: muted teal for verified supporting clues.
-   Typography: highly readable sans-serif; optional restrained display
    font for case headings.
-   Use consistent spacing, borders, radii, shadows, and icon style.
-   Use animations sparingly and respect reduced-motion preferences.
-   Keep the design original; do not copy a specific game or product UI.

### Landing page

-   Clear product title and concise explanation.
-   Scenario text area.
-   Optional settings controls.
-   Create Mystery button with loading/disabled state.
-   Sample premise suggestions the user can click to populate the input.
-   Clear fictional-content notice.

### Investigation room

-   Header with case title, status, difficulty, and fictional badge.
-   Main area with briefing, evidence board, suspect panel, and
    timeline.
-   Evidence cards visually differentiated by type.
-   Detail view with full artifact content, timestamp, related suspects,
    and source/type label.
-   Accusation action remains easy to find but does not obscure
    evidence.
-   Use tooltips or labels for icons; never rely on colour alone.

### Result screen

-   Clear correct/incorrect feedback.
-   Reveal the actual culprit and decisive evidence.
-   Explain reasoning step by step in a concise, evidence-linked format.
-   Include a "Play another mystery" action.

### Responsive design

-   Support mobile width from approximately 320px and up, tablets, and
    desktop.
-   Stack panels on narrow screens.
-   Avoid horizontal overflow.
-   Ensure dialogs and evidence panels fit the viewport and can be
    dismissed with keyboard controls.

### Accessibility

-   Semantic HTML and correct heading hierarchy.
-   All form controls have labels.
-   Full keyboard navigation.
-   Visible focus indicators.
-   Accessible modal focus handling.
-   Sufficient text contrast.
-   Images have meaningful alt text.
-   Do not communicate evidence meaning through colour alone.
-   Respect reduced-motion settings.

## 13. Security, Privacy, and Abuse Prevention

-   Store `GEMINI_API_KEY` and `MONGODB_URI` only on the server.
-   Commit `.env.example` with placeholders only; never commit `.env`.
-   Validate and sanitize all user input and all model output.
-   Apply rate limiting to generation and accusation endpoints.
-   Limit request body size and generation concurrency.
-   Restrict CORS to configured frontend origins.
-   Use safe error messages and redacted server logs.
-   Avoid rendering untrusted model output as raw HTML; render as text
    or sanitize using a vetted library.
-   Validate external asset URLs and avoid unsafe schemes.
-   Do not allow model output to choose arbitrary filesystem paths,
    execute code, or trigger arbitrary network requests.
-   Add basic prompt-injection resistance.
-   Clearly label all generated evidence as fictional.
-   Do not generate real allegations about identifiable real people.
-   If authentication is introduced, hash passwords with a modern
    password-hashing algorithm, protect sessions/tokens, enforce
    ownership on every case route, and never store plaintext
    credentials.
-   Before public deployment, configure quotas, abuse monitoring,
    provider budget alerts, and appropriate privacy disclosures.

## 14. Environment Configuration

Create `.env.example` with placeholders only. Expected variables may
include:

``` dotenv
NODE_ENV=development
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai_mystery_room
GEMINI_API_KEY=replace_with_your_key
GEMINI_MODEL=replace_with_supported_model_name
GENERATION_TIMEOUT_MS=60000
GENERATION_MAX_RETRIES=2
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10
```

-   Validate required variables at server startup.
-   Keep provider-specific model identifiers configurable.
-   Document which variables are mandatory and which are optional.
-   Do not print secret values at startup.
-   Adjust generation timeouts to the chosen model and response size.

## 15. Testing Requirements

### Unit tests

-   Input validation and character limits.
-   AI response parsing and schema validation.
-   Suspect/evidence/timeline reference integrity.
-   Culprit reference validation.
-   Fairness checks.
-   Public DTO excludes private solution.
-   Accusation correctness and invalid suspect rejection.
-   State transition and duplicate accusation handling.
-   Error response formatting.

### Integration tests

-   Case creation with mocked Gemini and test database.
-   Malformed AI response and retry exhaustion.
-   Database failure.
-   Case fetch and evidence fetch.
-   Accusation and reveal flow.
-   Access control for cases where ownership/authentication exists.
-   Rate limiting and invalid request bodies.

### Frontend tests

-   Scenario form validation.
-   Loading, success, and error states.
-   Evidence open/close and filtering.
-   Suspect selection and confirmation.
-   Reveal visibility only after accusation.
-   Responsive layout smoke checks where tooling permits.

### End-to-end acceptance test

1.  Open the application.
2.  Submit a valid fictional scenario.
3.  Confirm a playable case is created.
4.  Confirm there are 3--5 suspects and at least 5 evidence items.
5.  Inspect multiple evidence artifacts.
6.  Attempt an invalid accusation and confirm it is rejected.
7.  Submit a valid suspect ID.
8.  Confirm the result and reveal are shown.
9.  Confirm the solution is absent from public responses before
    accusation.
10. Refresh and verify persisted state when MongoDB is configured.

Use mocked AI responses in automated tests so tests do not require paid
API calls. Keep a separate manual smoke-test procedure for the live
Gemini integration.

## 16. Definition of Done

The MVP is complete only when: - \[ \] Frontend and backend start using
documented commands. - \[ \] Environment configuration is documented and
secrets are excluded from version control. - \[ \] A user can create a
mystery from a scenario. - \[ \] Gemini generation is server-side and
output is validated. - \[ \] Cases are persisted when MongoDB is
configured. - \[ \] Each playable case contains a coherent briefing,
suspects, timeline, evidence, and canonical solution. - \[ \] Evidence
types render appropriately with fallbacks for unavailable images. - \[
\] A user can inspect evidence and select a suspect. - \[ \] Accusations
are validated and duplicate submissions are prevented. - \[ \] The
reveal is unavailable before an accepted accusation. - \[ \] The final
reveal uses the stored solution. - \[ \] Loading, empty, error, and
retry states work. - \[ \] The UI is responsive and keyboard
accessible. - \[ \] Automated tests pass, or any remaining failures are
explicitly documented. - \[ \] README includes setup, environment
variables, scripts, architecture, API overview, and deployment notes. -
\[ \] No API keys, secrets, or real private evidence are committed. - \[
\] All generated evidence is labelled fictional.

## 17. Implementation Plan for Codex

Work in phases. Do not attempt to build the entire system in one
unreviewed code dump.

### Phase 0 --- Repository inspection and plan

-   Inspect the existing repository before changing files.
-   Identify existing code, scripts, framework versions, and tests.
-   If empty, initialise the repository according to this spec.
-   Create `docs/SPEC.md` from this document, `docs/DECISIONS.md`, and a
    concise implementation checklist.
-   Report assumptions and proposed architecture.
-   Do not overwrite existing user work without inspecting it.

### Phase 1 --- Foundation

-   Set up client and server.
-   Add scripts, environment validation, linting/formatting if selected,
    health endpoint, error middleware, and basic routing.
-   Add MongoDB connection and model skeletons.
-   Confirm both applications start.

### Phase 2 --- Case contract and mock generation

-   Implement request/output schemas, case validation, fairness checks,
    public/private DTO separation, and mocked case generation.
-   Add tests before connecting the real AI provider.
-   Confirm a valid mock case can be created, persisted, fetched, and
    kept secret.

### Phase 3 --- Gemini integration

-   Implement server-side Gemini service, structured output, bounded
    retries, timeout handling, safe logging, and provider error mapping.
-   Validate all generated cases with deterministic checks.
-   Confirm malformed output cannot become playable.

### Phase 4 --- Investigation UI

-   Build landing/create form, loading and error states, investigation
    room, suspect profiles, evidence detail, filters, and timeline.
-   Use realistic fictional mock data for visual development.
-   Connect screens to API endpoints.

### Phase 5 --- Accusation and reveal

-   Implement suspect selection, confirmation, server validation,
    persistent result, and spoiler-safe reveal.
-   Test public/private data boundaries.

### Phase 6 --- Persistence, hardening, and accessibility

-   Complete saved-case behaviour.
-   Add rate limits, CORS restrictions, input limits, safe rendering,
    keyboard support, and responsive polish.
-   Resolve known accessibility issues.

### Phase 7 --- Verification and documentation

-   Run unit, integration, frontend, and build tests.
-   Fix failures rather than merely reporting them.
-   Perform the end-to-end acceptance test.
-   Update README, API docs, environment docs, and decisions.
-   Provide a concise completion report with implemented features, test
    results, run commands, required secrets, and known limitations.

At the end of each phase, report: - What changed - Files/modules created
or updated - Tests run and their actual results - Remaining issues -
Next phase

## 18. Codex Working Rules

Codex must: 1. Read `docs/SPEC.md` before implementation and refer back
to it during each phase. 2. Inspect the repository before making
changes. 3. Prefer small, testable changes over a large rewrite. 4. Use
typed contracts and schema validation at AI/API boundaries. 5. Never put
secrets in source code, client bundles, screenshots, tests, or
documentation. 6. Never expose the canonical culprit before a valid
accusation. 7. Never use unvalidated AI output directly as trusted
database state or HTML. 8. Use mocked AI responses for deterministic
automated tests. 9. Avoid unnecessary dependencies and explain any
significant new dependency. 10. Keep accessible, responsive UI behaviour
in acceptance criteria. 11. Update documentation whenever commands,
routes, configuration, or architecture change. 12. If a requirement
cannot be implemented, explain why and offer the closest safe
alternative rather than silently omitting it. 13. Do not claim tests,
deployment, or integrations succeeded unless actually verified. 14. Do
not deploy, publish secrets, or incur paid usage without explicit user
authorisation. 15. Treat this specification as a living document only
when an intentional requirement change is approved. Record approved
changes and their rationale.

## 19. Initial Product Decisions

The following defaults resolve common ambiguities for the first
implementation: - MVP does not require user accounts. - Cases are
generated as complete, immutable investigations before play. - Standard
cases have 3--5 suspects and 6--10 evidence artifacts. - Gemini is used
for text-based mystery generation. - Realistic-looking images are
optional and must be labelled as AI-generated fiction. - The canonical
solution is stored server-side and revealed only after accusation. - The
MVP allows one final accusation per case. - MongoDB is the persistence
layer; no silent production fallback to in-memory storage. - No
multiplayer, payments, public case sharing, or real-world evidence
ingestion. - React + Vite is the default frontend setup; TypeScript is
preferred for maintainability. - Authentication, multi-user case
ownership, and cross-device private saved cases are future enhancements
unless explicitly approved.

## 20. Future Enhancements --- Not MVP Requirements

Potential later features, requiring a separate approved spec: - User
accounts and private case libraries - Multiple attempts, scoring, hints,
and timed mode - Difficulty calibration based on player performance -
Generated portraits, scene illustrations, and animated CCTV-style
clips - Voice-based witness interviews - Hint system with progressive
spoiler levels - Shareable cases with access controls - Curated prebuilt
cases - Case quality scoring and AI-assisted editorial review -
Multi-language UI and cases - Admin moderation and usage analytics

------------------------------------------------------------------------

## Quick Start Instruction for Codex

**Begin by inspecting the repository. Then implement Phase 0 and Phase 1
only.** Read this spec as the source of truth, create `docs/SPEC.md` and
`docs/DECISIONS.md`, explain the implementation plan, and run the
available checks. Do not jump ahead to the full UI or live Gemini
integration before the foundation and case contract are testable.
