# Luma

[![CI](https://github.com/VirabhadraKhobare/luma/actions/workflows/backend.yml/badge.svg)](https://github.com/VirabhadraKhobare/luma/actions/workflows/backend.yml)
[![Deploy](https://github.com/VirabhadraKhobare/luma/actions/workflows/deploy.yml/badge.svg)](https://github.com/VirabhadraKhobare/luma/actions/workflows/deploy.yml)
[![Live application](https://img.shields.io/badge/live_application-visit-6d5dfc)](https://frontend-omega-three-63.vercel.app/)

Luma is a provider-neutral, full-stack AI assistant designed for conversational work, persistent conversations, document context, and verified tool-assisted answers.

> **Project status:** Active development. The current [release gates](docs/release-gates.md) identify PostgreSQL staging validation, AI-provider contract tests, upload-security testing, performance evidence, and accessibility automation as incomplete. Luma should not be described as production-ready until those gates are resolved.

## Live resources

- **Application:** [luma-eight-sepia.vercel.app](https://luma-eight-sepia.vercel.app)
- **Repository:** [github.com/VirabhadraKhobare/luma](https://github.com/VirabhadraKhobare/luma)
- **API reference:** [`docs/api.md`](docs/api.md)
- **Deployment guide:** [`docs/deployment.md`](docs/deployment.md)
- **Intelligence-layer contract:** [`docs/intelligence-layer.md`](docs/intelligence-layer.md)
- **Privacy and data controls:** [`docs/privacy-notice.md`](docs/privacy-notice.md)
- **Evaluation set:** [`evals/benchmark-v1.json`](evals/benchmark-v1.json)

## What Luma provides

- Streaming assistant responses through Server-Sent Events
- Provider-neutral integration with OpenAI-compatible APIs
- Observable model routing for fast, conversational, and deeper reasoning tasks
- Persistent conversations and messages backed by PostgreSQL
- Email/password authentication with optional Google OIDC
- HTTP-only access and refresh cookies with CSRF protection
- Per-user rate limits and daily token quotas
- Document ingestion from extracted text with bounded chunk retrieval
- Optional Tavily web search for current-information requests
- A validated arithmetic calculator
- Account export and scheduled account deletion
- Retention cleanup, audit events, ownership checks, and PostgreSQL row-level security
- Markdown assistant-message rendering and responsive frontend controls

## Architecture

```text
Vercel frontend
  |
  +-- React 18 + Vite + TypeScript
  |      +-- Browser chat experience
  |      +-- Cookie-based authentication
  |      +-- SSE stream rendering
  |
  +-- Render backend
         +-- Node.js + TypeScript HTTP API
         +-- Authentication and session management
         +-- Model provider adapter and route selection
         +-- Calculator, search, and document tools
         +-- PostgreSQL persistence and row-level security
         +-- Health, account, retention, and audit endpoints
```

The browser calls `/api/chat`; provider credentials remain in the backend process and are never exposed through frontend `VITE_*` variables. Provider and tool failures are returned explicitly rather than replaced with fabricated answers.

## Technology

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, React DOM, Vite 6, TypeScript, Lucide React |
| Backend | Node.js, TypeScript, `tsx`, `zod`, `jose`, `pg` |
| Database | PostgreSQL with migrations and row-level security |
| AI integration | OpenAI-compatible `/chat/completions` and optional `/embeddings` |
| Web search | Tavily, optional |
| Frontend hosting | Vercel |
| Backend hosting | Render |
| Automation | GitHub Actions |

## Repository structure

```text
.
├── backend/
│   ├── migrations/       PostgreSQL schema, RLS, and Google OIDC migrations
│   ├── server/           API, auth, database, providers, and tools
│   └── tests/            Backend regression and security tests
├── frontend/
│   └── src/              React application and UI components
├── docs/                 API, deployment, privacy, operations, and release guidance
├── evals/                Benchmark inputs for intelligence evaluation
├── .github/workflows/    CI and deployment automation
└── render.yaml           Render backend service definition
```

## Requirements

- Node.js 22, matching the GitHub Actions workflow
- npm
- PostgreSQL for persistence
- An OpenAI-compatible provider key and chat model
- Optional Google OAuth credentials
- Optional Tavily API key for web search

## Configuration

Copy the tracked example files into the runtime environments that execute the frontend and backend:

- [`backend/.env.example`](backend/.env.example)
- [`frontend/.env.example`](frontend/.env.example)

### Backend variables

| Variable | Purpose |
| --- | --- |
| `PORT` | Backend listening port; defaults to `8787`. |
| `NODE_ENV` | Runtime environment. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `DATABASE_SSL` | Enables TLS for PostgreSQL connections when set to `true`. |
| `SESSION_SECRET` | Secret used to protect sessions; required in production. |
| `COOKIE_SECURE` | Enables secure cookies for HTTPS deployments. |
| `COOKIE_SAME_SITE` | SameSite policy for authentication cookies. |
| `ALLOWED_ORIGIN` | Exact frontend origin permitted by the backend. |
| `GOOGLE_CLIENT_ID` | Optional Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Optional Google OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | Google OAuth callback URL. |
| `MAX_BODY_BYTES` | Maximum request body size. |
| `RATE_LIMIT_PER_MINUTE` | Per-user request limit. |
| `DAILY_TOKEN_QUOTA` | Per-user daily token budget. |
| `RETENTION_DAYS` | Retention period for eligible operational data. |
| `AI_PROVIDER` | Provider adapter label; defaults to `openai-compatible`. |
| `AI_BASE_URL` | OpenAI-compatible provider base URL. |
| `AI_API_KEY` | Server-side provider credential. |
| `AI_CHAT_MODEL` | Default chat model. |
| `AI_FAST_MODEL` | Low-latency model route. |
| `AI_DEEP_MODEL` | Deeper-reasoning model route. |
| `AI_EMBEDDING_MODEL` | Optional embedding model. |
| `TAVILY_API_KEY` | Optional web-search credential. |
| `MAX_CONTEXT_TOKENS` | Maximum model context budget. |
| `DATA_DIR` | Backend data directory setting. |

### Frontend variables

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | Public backend URL used by the deployed frontend. |
| `VITE_DEV_API_URL` | Backend target used by the Vite development proxy. |

Never commit runtime `.env` files, provider keys, database credentials, OAuth secrets, or session secrets. Only intentionally public `VITE_*` values belong in frontend configuration.

## Setup and development

Install the workspace dependencies:

```bash
npm install
```

Apply the PostgreSQL migrations in order:

```bash
psql "$DATABASE_URL" -f backend/migrations/001_initial.sql
psql "$DATABASE_URL" -f backend/migrations/002_rls.sql
psql "$DATABASE_URL" -f backend/migrations/003_google_oidc.sql
```

Run the frontend and backend using the repository scripts:

```bash
npm run dev:api
npm run dev
```

The Vite configuration proxies `/api` and `/health` to the backend during development. For provider setup and intelligence behavior, see [`docs/intelligence-layer.md`](docs/intelligence-layer.md).

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the frontend development server. |
| `npm run dev:api` | Start the backend development server. |
| `npm run build` | Build the frontend application. |
| `npm run build:frontend` | Build the frontend application explicitly. |
| `npm run test` | Run backend tests. |
| `npm run typecheck:backend` | Type-check the backend. |
| `npm run preview` | Preview the frontend production build. |

The backend package also exposes `npm start`, `npm test`, and `npm run typecheck` for service-level execution.

## API contract

All responses use either:

```json
{ "data": "..." }
```

or:

```json
{ "error": { "code": "...", "message": "..." } }
```

Errors do not include stack traces, provider keys, cookies, prompts, completions, or document contents.

### Core endpoints

| Method | Route | Authentication | Description |
| --- | --- | --- | --- |
| `GET` | `/health/live` | None | Process liveness check. |
| `GET` | `/health/ready` | None | PostgreSQL readiness and safe provider configuration status. |
| `POST` | `/api/auth/register` | None | Register with email, password, and display name. |
| `POST` | `/api/auth/login` | None | Authenticate an account. |
| `POST` | `/api/auth/refresh` | Refresh cookie | Refresh the access session. |
| `POST` | `/api/auth/logout` | Access cookie + CSRF | Revoke the active session. |
| `GET` | `/api/auth/me` | Access cookie | Return the authenticated user. |
| `POST` | `/api/chat` | User | Stream `meta`, `token`, `done`, or `error` SSE events. |
| `POST` | `/api/calculate` | User | Evaluate a bounded arithmetic expression. |
| `POST` | `/api/documents` | User | Store extracted document text for retrieval. |
| `DELETE` | `/api/documents/:id` | Owner | Delete an owned document. |
| `GET` | `/api/account/export` | User | Export account data. |
| `POST` | `/api/account/deletion-request` | User | Schedule seven-day account deletion. |
| `POST` | `/api/admin/retention` | Admin | Run retention cleanup. |

For request bodies, authentication details, SSE event shapes, and security behavior, see [`docs/api.md`](docs/api.md).

## Deployment

Luma has two independently deployable applications:

### Backend on Render

The tracked [`render.yaml`](render.yaml) configures:

- Service name: `luma-backend`
- Runtime: Node
- Root directory: `backend`
- Build command: `npm ci`
- Start command: `npm start`
- Health check: `/health/live`
- Automatic deploys: enabled

Configure the backend variables from [`backend/.env.example`](backend/.env.example). In production, set `ALLOWED_ORIGIN` to the Vercel frontend origin and set the Google callback to:

```text
https://<render-service>.onrender.com/api/auth/google/callback
```

### Frontend on Vercel

Import the repository into Vercel with `frontend` as the root directory. Set:

```text
VITE_API_URL=https://<render-service>.onrender.com
```

Then configure the backend `ALLOWED_ORIGIN` and add the same Google callback URL to the OAuth client.

### GitHub Actions

- [`CI`](.github/workflows/backend.yml) runs backend dependency auditing, backend tests, backend type-checking, and the frontend production build on pushes and pull requests targeting `main`.
- [`Deploy`](.github/workflows/deploy.yml) can trigger Vercel and Render deployments from `main` when the required repository secrets are configured.

Deployment automation uses:

```text
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
RENDER_DEPLOY_HOOK_URL
```

## Security and privacy

Luma's security model includes:

- Provider credentials restricted to the backend environment
- HTTP-only access and refresh cookies
- CSRF validation for browser writes
- Passwords stored as salted scrypt hashes
- Generic login errors that do not reveal whether an email exists
- Rate limiting, quotas, bounded request sizes, and provider timeouts
- Tenant ownership checks and PostgreSQL row-level security
- Audited administrative actions
- Operational logs that omit raw prompts, completions, cookies, tokens, and file contents
- Account export and deletion controls
- Memory disabled by default and requiring explicit consent

The privacy behavior is an engineering baseline, not a jurisdiction-specific legal notice. Review [`docs/privacy-notice.md`](docs/privacy-notice.md) with qualified counsel before launch.

Uploaded files must be parsed and scanned by a quarantined worker before extracted text is sent to the document endpoint. Raw uploads must not be passed to the model process.

## Quality and release readiness

The repository includes:

- Backend regression and security tests
- Dependency auditing in CI
- Frontend production builds in CI
- An intelligence benchmark dataset
- Release gates for build, tests, security, API auth, persistence/RLS, AI-provider behavior, RAG, performance, accessibility, and backup/restore

The latest published QA audit reports passing build, unit, dependency, and partial UI smoke checks, while marking the release **blocked** pending staging, provider, security, performance, accessibility, and persistence evidence. See [`docs/qa-report-2026-10-20.md`](docs/qa-report-2026-10-20.md) and [`docs/release-gates.md`](docs/release-gates.md).

## Contributing

1. Create a focused branch from `main`.
2. Keep credentials and generated runtime files out of commits.
3. Update the relevant API, deployment, privacy, or intelligence documentation when behavior changes.
4. Run the applicable tests, type checks, build, and dependency audit before opening a pull request.
5. Include validation evidence for changes that affect authentication, persistence, provider calls, tools, or deployment.

## License

No license is currently declared in this repository. Add an appropriate license before redistributing Luma.
