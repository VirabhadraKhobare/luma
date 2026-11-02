# Luma

Luma is a full-stack AI chat application with a focused chat experience, persistent conversations, optional Google sign-in, document context, web search, and model routing for fast, conversational, and deeper reasoning tasks.

## Features

- Streaming assistant responses over Server-Sent Events
- Email/password authentication and optional Google OIDC
- Secure session cookies, CSRF protection, rate limiting, and daily token quotas
- Conversation history backed by PostgreSQL
- Document ingestion and relevant-chunk retrieval
- Calculator and optional Tavily web-search tools
- OpenAI-compatible model providers
- Markdown-rendered assistant messages
- Health checks for deployment platforms
- Data export, deletion requests, retention cleanup, and audit events
- Responsive React UI with light/dark theme controls

## Architecture

```text
Browser
  |
  +-- Vite development server / static build
  |      +-- /api and /health proxy in development
  |
  +-- Node.js API (backend/server)
         +-- Authentication and session management
         +-- Chat streaming and model selection
         +-- Calculator, web search, and document tools
         +-- PostgreSQL persistence and row-level security
         +-- Health, account, and admin endpoints
```

### Project layout

```text
.
+-- backend/
|   +-- migrations/       PostgreSQL schema and security migrations
|   +-- server/           HTTP API, auth, database, tools, and providers
|   +-- tests/            Backend tests
+-- frontend/
|   +-- src/              React application and components
|   +-- vite.config.ts    Development API proxy
+-- .github/workflows/    CI and deployment workflows
+-- render.yaml           Render backend service definition
```

## Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- PostgreSQL 14 or newer for persistent storage
- An API key for an OpenAI-compatible provider
- Optional: Google OAuth credentials and a Tavily API key

## Quick start

### 1. Install dependencies

```bash
npm install
```

The root project uses npm workspaces for `frontend` and `backend`.

### 2. Configure the backend

```bash
cp backend/.env.example backend/.env
```

On Windows PowerShell, use:

```powershell
Copy-Item backend\.env.example backend\.env
```

At minimum, set:

```dotenv
DATABASE_URL=postgres://user:password@localhost:5432/luma
SESSION_SECRET=replace-with-a-long-random-secret
AI_API_KEY=your-provider-key
AI_CHAT_MODEL=gpt-4o
```

Apply the migrations in order:

```bash
psql "$DATABASE_URL" -f backend/migrations/001_initial.sql
psql "$DATABASE_URL" -f backend/migrations/002_rls.sql
psql "$DATABASE_URL" -f backend/migrations/003_google_oidc.sql
```

If you are using PowerShell, replace `"$DATABASE_URL"` with your PostgreSQL connection string or configured `psql` variable.

### 3. Start the API and frontend

Use two terminals:

```bash
npm run dev:api
npm run dev
```

The API runs at `http://localhost:8787` and the Vite app runs at `http://localhost:5173`. In development, Vite proxies `/api` and `/health` to the API.

Open [http://localhost:5173](http://localhost:5173).

## Configuration

Backend configuration lives in [`backend/.env.example`](./backend/.env.example). Frontend configuration lives in [`frontend/.env.example`](./frontend/.env.example).

### Backend variables

| Variable | Required | Description |
| --- | --- | --- |
| `PORT` | No | API port. Defaults to `8787`. |
| `NODE_ENV` | No | Use `production` in deployment. |
| `DATABASE_URL` | Production | PostgreSQL connection string. |
| `DATABASE_SSL` | No | Set to `true` for hosted PostgreSQL. |
| `SESSION_SECRET` | Production | Secret used to protect sessions. |
| `ALLOWED_ORIGIN` | Production | Public frontend origin. |
| `COOKIE_SECURE` | Production | Set to `true` when serving over HTTPS. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Enables Google sign-in when configured. |
| `GOOGLE_REDIRECT_URI` | No | OAuth callback URL. |
| `AI_PROVIDER` | No | Provider label; defaults to `openai-compatible`. |
| `AI_BASE_URL` | No | OpenAI-compatible API base URL. |
| `AI_API_KEY` | Yes for chat | Provider API key. |
| `AI_CHAT_MODEL` | Yes for chat | Default chat model. |
| `AI_FAST_MODEL` | No | Low-latency model route. |
| `AI_DEEP_MODEL` | No | Reasoning model route. |
| `AI_EMBEDDING_MODEL` | No | Embedding model for document workflows. |
| `TAVILY_API_KEY` | No | Enables web search for current or time-sensitive questions. |
| `RATE_LIMIT_PER_MINUTE` | No | Per-user request limit. |
| `DAILY_TOKEN_QUOTA` | No | Per-user daily token budget. |
| `RETENTION_DAYS` | No | Retention period for usage and audit data. |

### Frontend variables

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Public backend URL in production. Leave empty for local development. |
| `VITE_DEV_API_URL` | Local API target for the Vite proxy. Defaults to `http://localhost:8787`. |

Never commit `.env` files or API keys. Only `VITE_*` values are exposed to browser code.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health/live` | Liveness check |
| `GET` | `/health/ready` | Readiness and database check |
| `POST` | `/api/auth/register` | Create an account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/auth/google` | Start Google sign-in |
| `GET` | `/api/auth/me` | Get the current user |
| `POST` | `/api/auth/refresh` | Refresh the session |
| `POST` | `/api/auth/logout` | End the session |
| `GET` | `/api/conversations` | List saved conversations |
| `POST` | `/api/chat` | Stream an assistant response |
| `POST` | `/api/calculate` | Evaluate a validated arithmetic expression |
| `POST` | `/api/documents` | Add document context |
| `DELETE` | `/api/documents/:id` | Delete a document |
| `GET` | `/api/account/export` | Export account data |
| `POST` | `/api/account/deletion-request` | Request account deletion |
| `POST` | `/api/admin/retention` | Run retention cleanup as an admin |

Authenticated state is stored in HTTP-only cookies. Mutating requests use the CSRF token issued by the API.

## Development commands

Run these commands from the repository root:

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite frontend |
| `npm run dev:api` | Start the backend with `tsx` |
| `npm run build` | Type-check and build the frontend |
| `npm run test` | Run backend tests |
| `npm run typecheck:backend` | Type-check backend code |
| `npm run preview` | Preview the production frontend build |

Backend-only commands are also available from `backend/`:

```bash
npm test
npm run typecheck
```

## Deployment

The included [`render.yaml`](./render.yaml) defines the backend as a Render web service. It:

- Builds from `backend/` with `npm ci`
- Starts with `npm start`
- Uses `/health/live` for health checks
- Expects database, authentication, and AI secrets to be configured in Render

Build the frontend with:

```bash
npm run build
```

Deploy the generated `frontend/dist` directory to a static host such as Vercel. Set `VITE_API_URL` to the public backend URL and set the backend `ALLOWED_ORIGIN` to the public frontend origin. For production, use HTTPS, `COOKIE_SECURE=true`, and `DATABASE_SSL=true` when required by the database provider.

## Security notes

- Keep `SESSION_SECRET`, `DATABASE_URL`, OAuth secrets, and AI keys server-side.
- Use a unique, high-entropy `SESSION_SECRET` in every production environment.
- Keep `ALLOWED_ORIGIN` restricted to the deployed frontend origin.
- Apply all PostgreSQL migrations, including row-level security.
- Configure quotas and rate limits for the expected traffic.
- Do not treat model output or retrieved document content as trusted instructions.

## License

No license has been declared for this repository yet. Add a license before distributing Luma outside the project.
