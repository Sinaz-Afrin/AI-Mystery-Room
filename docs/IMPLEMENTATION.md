# Implementation checklist

## Foundation and MVP

- [x] Inspect the empty repository and preserve the supplied spec.
- [x] Create the React/Vite client and Express/MongoDB server.
- [x] Validate environment configuration, use CORS allowlisting, request IDs, safe errors, and a JSON body limit.
- [x] Implement scenario validation, generated-case schema, reference/fairness checks, and private/public serializers.
- [x] Implement mock and server-side Gemini generation paths with bounded retries and timeouts.
- [x] Persist cases and accusations in MongoDB; keep the solution excluded from normal case queries.
- [x] Implement create/list/read/evidence/review/accuse/result/delete API routes.
- [x] Implement create form, saved cases, investigation room, evidence detail, suspect selection, timeline, accusation confirmation, and reveal screens.
- [x] Add fictional image fallback, responsive layouts, visible focus, keyboard-operable native dialogs, and reduced-motion handling.
- [x] Document API, environment settings, local mock mode, and limitations.
- [x] Run case schema/DTO tests and an end-to-end API smoke flow against MongoDB.
- [x] Build the production client.

## Remaining before public multi-user production

- [ ] Add authentication and enforce secure account ownership on every case route.
- [ ] Configure production MongoDB, CORS origin, quotas, abuse monitoring, and privacy disclosures.
- [ ] Run the manual live Gemini smoke test after the operator explicitly chooses to use API quota.
