# AI Mystery Room

AI Mystery Room turns a short premise into a fictional detective case. Players inspect evidence, review suspects and a timeline, make one accusation, then see the stored solution and explanation.

## Run locally

Requirements: Node.js 20.19+ (22 LTS recommended), npm 10+, and MongoDB.

1. Copy `.env.example` to `.env` and set `MONGODB_URI` if MongoDB is not running at the default local address.
2. Run `npm install`.
3. Run `npm run dev` and open `http://localhost:5173`.

The API is available at `http://localhost:5000/api/v1`; health is at `/health`. Local development defaults to the explicitly identified fictional mock generator, so case creation works without an API key or paid model request. Mock cases use the same validation, persistence, and accusation flows as Gemini cases.

To use Gemini, set `GENERATION_MODE=gemini`, `GEMINI_API_KEY`, and `GEMINI_MODEL` in the server `.env`. Gemini is called only on the server. Production requires Gemini mode and an explicit MongoDB URI. Never put secrets in `client/` or a `VITE_` variable.

## Commands

- `npm run dev` — start frontend and API.
- `npm run dev:client` / `npm run dev:server` — start one workspace.
- `npm run build` — type-check and build the frontend.
- `npm test` — run server validation and DTO tests.
- `npm start` — start the API in production configuration.

## Architecture

- `client/` — React, TypeScript, Vite, React Router, responsive plain CSS.
- `server/` — Express API, Zod request/model validation, Gemini integration, MongoDB/Mongoose persistence.
- `docs/SPEC.md` — product and engineering specification.
- `docs/API.md` — route contract and client ownership behavior.
- `docs/DECISIONS.md` — implementation choices and limits.

The browser gets an anonymous ID stored in localStorage; the API scopes case files to that ID. This is device/browser-local convenience, not secure account ownership. Do not expose an unauthenticated deployment as a multi-user service.

All people and evidence are fictional. Image evidence uses a labelled text illustration fallback; no image-generation provider is required.
