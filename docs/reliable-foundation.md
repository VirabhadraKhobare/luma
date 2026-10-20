# Reliable Assistant Foundation

The first release is intentionally limited to a dependable authenticated chat loop:

1. A user registers or signs in through the backend.
2. The server issues short-lived access and rotating refresh sessions.
3. Browser writes include the CSRF token from the server-issued cookie.
4. Chat requests are authorized before model selection or retrieval.
5. PostgreSQL stores the conversation and messages inside user-scoped transactions.
6. Row-level security and owner predicates protect persisted data.
7. The model provider is called only from the server.
8. Responses stream over SSE and terminate with an explicit `done` or `error` event.
9. Usage is recorded and daily token quotas are enforced.
10. The frontend loads saved conversations from the authenticated API rather than treating seed data as durable history.

## Deliberate non-goals

The stable slice does not claim that voice, arbitrary file uploads, autonomous tools, memory, planner execution, or external side effects are complete. Those features should be added only after the authenticated chat path has staging evidence for persistence, authorization, provider failure recovery, and cost controls.

## Local development modes

- Without `DATABASE_URL`, the API can start for liveness checks, but `/health/ready` returns `503` and authenticated operations are unavailable.
- Without `AI_API_KEY` and a model setting, chat returns an explicit `503`; it never returns a canned answer.
- Production startup refuses insecure session configuration.
