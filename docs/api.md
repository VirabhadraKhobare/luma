# Backend API

All responses use either `{ "data": ... }` or `{ "error": { "code": "...", "message": "..." } }`. Errors never contain stack traces, provider keys, cookies, prompts, completions, or document contents.

Authentication uses `HttpOnly` access and refresh cookies plus a non-HttpOnly CSRF cookie. Browser writes must send `X-CSRF-Token` equal to the CSRF cookie. In production cookies require HTTPS.

## Authentication

| Method | Route | Body | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password, displayName }` | No |
| POST | `/api/auth/login` | `{ email, password }` | No |
| POST | `/api/auth/refresh` | none | Refresh cookie |
| POST | `/api/auth/logout` | none | Access cookie and CSRF |
| GET | `/api/auth/me` | none | Access cookie |

Passwords must be 12-128 characters and are stored as salted scrypt hashes. Login errors intentionally do not reveal whether an email exists.

## Assistant and data

| Method | Route | Body or response | Auth |
|---|---|---|---|
| POST | `/api/chat` | `{ message, conversationId? }`, SSE events | User |
| POST | `/api/calculate` | `{ expression }` | User |
| POST | `/api/documents` | `{ name, mimeType, text }` | User |
| DELETE | `/api/documents/:id` | 204 | User and owner |
| GET | `/api/account/export` | JSON export | User |
| POST | `/api/account/deletion-request` | schedules seven-day deletion | User |

The current document endpoint accepts extracted text. PDF, DOCX, and spreadsheet extraction must be performed by a quarantined worker before sending text to this endpoint; raw uploads must not be passed to the model process.

## Health and administration

- `GET /health/live` checks process liveness.
- `GET /health/ready` checks PostgreSQL readiness and reports provider configuration booleans only.
- `POST /api/admin/retention` requires an admin session and runs retention cleanup.

## SSE events

`meta` includes conversation ID, selected model, route, and verified source metadata. `token` contains an incremental token. `done` contains terminal state and sources. `error` is terminal and contains an actionable safe message.
