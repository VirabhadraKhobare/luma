# AI Assistant Product and Implementation Plan

## 1. Product Vision

Build a trustworthy, fast, task-oriented AI assistant that helps people understand information, create outputs, and complete bounded workflows across web and mobile. The product should optimize for measurable outcomes rather than broad claims: answer quality on a defined evaluation set, time-to-first-token, successful task completion, citation correctness, and user effort.

### Target users

- Knowledge workers who research, summarize, draft, and transform documents.
- Developers who need code explanation, debugging, and repository-aware assistance.
- Small teams that need shared workspaces, controlled knowledge, and auditable outputs.
- Enterprise teams that require tenant isolation, retention controls, SSO, and usage budgets.

### Core problems

1. Users cannot reliably tell when an answer is uncertain or unsupported.
2. Context is fragmented across chats, files, and tools.
3. Model quality, speed, and cost vary by task, but most products expose little control.
4. Long-running tasks fail opaquely and require repeated manual work.
5. Teams need privacy, governance, and measurable quality without building an AI platform.

### Differentiators to validate

- **Evidence-first answers:** citations, quoted source spans, freshness indicators, and explicit uncertainty.
- **Task completion:** structured plans, progress events, approvals, resumable jobs, and verifiable outputs.
- **Adaptive model routing:** choose a model using task complexity, latency budget, policy, and cost.
- **User control:** inspect and edit context, memory, tools, and permissions.
- **Evaluation loop:** every major capability has offline test sets, online metrics, and regression gates.

These are hypotheses. No competitive-outperformance claim is made until an evaluation shows a statistically meaningful improvement against agreed baselines.

## 2. Scope and Non-Goals

### MVP scope

- Account creation, login, logout, and tenant/workspace isolation.
- Streaming text chat with conversation history and regeneration.
- Provider-independent chat and embedding adapters.
- File upload for a small supported set of formats, extraction, chunking, and citations.
- Hybrid retrieval over a user's authorized files.
- Usage limits, cost telemetry, basic feedback, and admin visibility.
- Responsive web application; mobile API compatibility and a thin mobile client can follow immediately after web validation.

### Non-goals for MVP

- Autonomous actions with irreversible side effects.
- Training or fine-tuning a foundation model.
- Open-ended browser automation.
- Multi-region active-active deployment.
- Storing raw provider prompts or responses without an explicit retention policy.

## 3. Proposed Architecture

The architecture is documented in [architecture-diagram.md](../.github/modernize/assessment/engines/facts/architecture-diagram.md). The first deployable unit is a modular monolith with independent API and worker processes. Modules communicate through typed application interfaces and domain events. This avoids premature microservices while preserving extraction boundaries.

### Request flow

1. Client authenticates and sends a conversation request with an idempotency key.
2. Gateway applies WAF, request size, abuse, and rate-limit policies.
3. API validates tenant access and loads conversation state.
4. Assistant service classifies the task and requests retrieval when needed.
5. Model gateway selects a provider/model under policy and budget constraints.
6. API streams normalized events to the client.
7. Usage, latency, model, safety, and feedback events are recorded asynchronously.

### Long-running flow

1. API creates a durable job and returns a job identifier.
2. Worker claims the job with a lease, processes it with bounded retries, and emits progress.
3. Client subscribes through SSE or WebSocket and can reconnect from an event cursor.
4. Terminal state is persisted; failures expose a reason, retryability, and support correlation ID.

## 4. Technology Decisions

| Decision | Recommendation | Reason |
|---|---|---|
| Web | Next.js, React, TypeScript | Strong routing, streaming support, SSR, ecosystem, shared types |
| Mobile | React Native with Expo | Faster cross-platform delivery and shared API/domain types |
| API | Python 3.12+, FastAPI, Pydantic | Good AI ecosystem, async I/O, typed contracts, low ceremony |
| Database | PostgreSQL 16+, SQLAlchemy, Alembic | Transactions, mature tooling, JSONB, full-text, pgvector |
| Cache | Redis 7+ | Atomic counters, locks, streams, and low-latency ephemeral state |
| Queue | Redis-backed worker initially; managed queue when needed | Low MVP complexity with a clear durable-job abstraction |
| Object storage | S3-compatible managed storage | Cheap durable blobs, lifecycle policies, signed URLs |
| Search | PostgreSQL FTS plus pgvector | Fewer systems initially; migrate only from measured limits |
| Auth | Managed OIDC provider | MFA, social login, SSO, token lifecycle, reduced security ownership |
| AI providers | At least two adapters behind one interface | Availability, price, latency, and capability portability |
| Deployment | Containers, managed container platform, managed PostgreSQL and Redis | Operational simplicity and independent API/worker scaling |
| Observability | OpenTelemetry with managed logs, metrics, and traces | Correlate user request, model call, tool, cost, and failure |

The model interface should normalize: `generate`, `stream`, `embed`, tool-call events, token usage, finish reason, provider request ID, and capability metadata. Provider-specific features must be opt-in extensions, not leaked into core business logic.

## 5. Folder Structure

```text
ai-assistant/
  apps/
    web/
      app/
      components/
      features/
      lib/
      tests/
    mobile/
      app/
      components/
      features/
      lib/
  services/
    api/
      app/
        api/
        auth/
        conversations/
        assistant/
        files/
        retrieval/
        billing/
        common/
        db/
        providers/
        workers/
      tests/
      migrations/
    worker/
  packages/
    contracts/
    ui/
    config/
  infra/
    terraform-or-bicep/
    docker/
  evals/
    datasets/
    runners/
    graders/
  docs/
  .github/workflows/
```

## 6. Database Schema

All tables include `created_at` and `updated_at` where mutable. Tenant-scoped tables include `tenant_id`; authorization is enforced in application code and PostgreSQL row-level security for defense in depth.

| Table | Important columns | Constraints and indexes |
|---|---|---|
| `users` | `id`, `email`, `display_name`, `status` | Unique normalized email |
| `tenants` | `id`, `name`, `plan`, `retention_days` | Plan and retention policy |
| `memberships` | `tenant_id`, `user_id`, `role` | Unique tenant/user; role check |
| `sessions` | `id`, `user_id`, `refresh_hash`, `expires_at` | Never store raw refresh token |
| `conversations` | `id`, `tenant_id`, `created_by`, `title`, `archived_at` | Tenant and updated-time index |
| `messages` | `id`, `conversation_id`, `role`, `content_json`, `sequence`, `model_id` | Unique conversation/sequence |
| `message_sources` | `message_id`, `file_id`, `chunk_id`, `quote`, `score` | Citation lookup indexes |
| `files` | `id`, `tenant_id`, `object_key`, `mime_type`, `sha256`, `status` | Tenant/hash index; quarantine status |
| `file_chunks` | `id`, `file_id`, `text`, `embedding`, `metadata_json` | Vector index plus file index |
| `jobs` | `id`, `tenant_id`, `type`, `status`, `attempts`, `lease_until` | Status/lease index |
| `model_requests` | `id`, `tenant_id`, `provider`, `model`, `latency_ms`, `input_tokens`, `output_tokens`, `cost` | Time and tenant indexes |
| `feedback` | `id`, `message_id`, `user_id`, `rating`, `reason` | Unique user/message |
| `audit_events` | `id`, `tenant_id`, `actor_id`, `action`, `resource`, `metadata_json` | Append-only tenant/time index |

Retention jobs should delete or anonymize data according to tenant policy. Embeddings and extracted text must follow the same deletion guarantees as source files.

## 7. API Design

Use `/v1` versioning, JSON for ordinary requests, SSE for token/event streaming, and RFC 9457-style problem details for errors. Require an idempotency key on creation and job endpoints.

| Method and route | Purpose |
|---|---|
| `POST /v1/auth/session` | Exchange an OIDC authorization result for an application session |
| `GET /v1/me` | Return current user and tenant memberships |
| `GET /v1/conversations` | Paginated conversation list |
| `POST /v1/conversations` | Create a conversation |
| `GET /v1/conversations/:id` | Read conversation metadata and messages |
| `POST /v1/conversations/:id/messages` | Create a message and return a stream handle |
| `GET /v1/streams/:id` | Resume an SSE stream from an event cursor |
| `POST /v1/messages/:id/regenerate` | Regenerate an assistant response under policy |
| `POST /v1/files/presign` | Authorize a direct upload |
| `POST /v1/files/:id/complete` | Confirm upload and enqueue processing |
| `GET /v1/files/:id` | Read file processing status |
| `POST /v1/search` | Search authorized files with citations |
| `POST /v1/jobs/:id/cancel` | Cancel a cancellable job |
| `POST /v1/messages/:id/feedback` | Submit rating and reason |
| `GET /v1/usage` | Read tenant/user usage and limits |

Security requirements: bearer tokens with short expiry, server-side authorization on every resource, strict request schemas, output encoding, upload MIME and size validation, malware scanning before parsing, SSRF-safe fetch policies, and no secret or raw token logging.

## 8. Feature Roadmap

### MVP: reliable assistant foundation

1. Identity, tenants, roles, and account recovery.
2. Streaming chat with persistence, retry, regeneration, and stop generation.
3. Model gateway with two providers, timeout/fallback policy, and cost tracking.
4. File ingestion, citations, hybrid retrieval, and deletion.
5. Feedback, evaluation harness, usage limits, observability, and admin diagnostics.

### Advanced release

1. Structured task plans with approvals and resumable jobs.
2. Tool calling for safe, read-only integrations.
3. Team knowledge spaces with permissions and freshness workflows.
4. Voice input/output and mobile push notifications.
5. Personal memory with explicit review, edit, and deletion controls.
6. Model routing optimization based on measured quality, latency, and cost.

### Future releases

1. Enterprise SSO, SCIM, data residency, private networking, and customer-managed keys.
2. Sandboxed code execution and deterministic artifact generation.
3. Multi-agent workflows with bounded budgets and human checkpoints.
4. Multi-region disaster recovery and regional provider routing.
5. Domain-specific adapters and customer evaluation packs.

## 9. Milestones

| Milestone | Deliverables | Exit criteria |
|---|---|---|
| M0 Product and security baseline | Personas, threat model, event taxonomy, evaluation datasets, ADRs | Scope approved and risks assigned |
| M1 Vertical slice | Auth, one chat provider, conversation persistence, streaming web UI | A new user completes a chat end to end |
| M2 Provider and reliability layer | Second provider, gateway policy, retries, timeouts, usage events | Provider can be switched by configuration and tests pass |
| M3 Knowledge workflows | Upload, extraction, indexing, retrieval, citations, deletion | Citation evaluation and deletion tests pass |
| M4 Production hardening | Rate limits, abuse controls, backups, tracing, alerts, load tests | SLO and security gates pass in staging |
| M5 Mobile and advanced tasks | Mobile client, job progress, approvals, safe tools | Core mobile parity and resumable job tests pass |

## 10. Cost, Limits, Risks, and Dependencies

### Cost model

The dominant variable cost is model inference, followed by embeddings, storage, egress, logs, and managed database capacity. Use a per-request cost record and report cost per successful task, not just per token. Start with one small production environment and scale by measured concurrency. A realistic early budget should be modeled as:

`monthly_cost = baseline_infrastructure + input_tokens * input_rate + output_tokens * output_rate + embeddings + storage + egress + observability`

Before launch, populate this equation with selected provider prices and expected usage bands: 100, 1,000, and 10,000 monthly active users.

### Initial policy limits

- Request body: 1 MB excluding direct-to-object-storage uploads.
- File size: 25 MB per file in MVP; configurable by tenant plan.
- Conversation context: bounded by a token budget and summarization policy.
- Per-user: configurable requests per minute and concurrent generations.
- Per-tenant: daily token and cost budget with a hard stop or admin override.
- Worker jobs: bounded attempts, exponential backoff, lease timeout, and dead-letter state.

These are starting defaults, not claims about provider quotas. Provider quotas must be checked during capacity planning and enforced below provider limits.

### Key risks and mitigations

| Risk | Mitigation and measurement |
|---|---|
| Hallucination or unsupported claims | Retrieval, citations, abstention policy, golden evaluation set |
| Prompt injection in files or tools | Treat retrieved content as data, tool allowlists, approval gates, isolation |
| Provider outage or model drift | Two adapters, fallback, contract tests, pinned model versions, drift dashboards |
| Runaway cost | Budgets, token caps, model routing, per-task cost alerts |
| Streaming disconnects | Event IDs, resumable streams, durable terminal state |
| Tenant data leakage | Tenant filters, RLS, authorization tests, synthetic cross-tenant tests |
| Queue or database bottlenecks | Load tests, indexes, backpressure, worker autoscaling |
| Sensitive data exposure | Encryption, redaction, retention controls, secret manager, access audit |

External dependencies include the identity provider, two model providers, embedding service, object storage, PostgreSQL, Redis, observability platform, malware scanner, and optional payment provider. Each dependency needs an owner, SLA assumption, timeout, retry policy, and exit strategy.

## 11. Acceptance Criteria

| Capability | Acceptance criteria |
|---|---|
| Authentication | Valid login creates a session; expired/revoked sessions fail; unauthorized tenant access returns 403; no raw tokens appear in logs |
| Streaming chat | First token is emitted within the agreed staging p95 target; reconnect resumes without duplicate message content; stop generation reaches a terminal state |
| Provider gateway | Same contract works with two providers; timeout and retry behavior is tested; fallback never violates tenant/model policy |
| Conversation history | Messages are ordered deterministically, survive refresh, and are isolated by tenant and membership |
| File ingestion | Unsupported, oversized, malicious, and malformed files fail visibly; successful files show processing state and source metadata |
| Retrieval and citations | Authorized sources only; every citation maps to a stored span; offline citation precision/recall thresholds are agreed and met |
| Deletion | Deleting a file removes object, extracted text, chunks, embeddings, and citations within the documented SLA |
| Rate limits and budgets | Limits are enforced consistently across API instances; responses identify retry timing; budget exhaustion is observable |
| Task jobs | Jobs are idempotent, resumable, cancellable when safe, and expose progress plus actionable failure details |
| Observability | A user request correlates across API, retrieval, model call, worker, and cost events; alerts fire for SLO breaches |
| Security | Threat-model controls are tested; dependency and container scans have no unaccepted critical findings; audit events cover admin and data access |
| Evaluation | A versioned benchmark reports answer quality, groundedness, latency, cost, and completion rate against a baseline before each release |

## 12. Measurable Product Scorecard

Define targets with representative workloads before implementation. Suggested launch metrics are:

- Grounded answer rate and citation correctness on a human-reviewed test set.
- Task completion rate for scripted workflows.
- Time to first token and time to final answer at p50 and p95.
- Regeneration rate, user feedback score, and abandonment rate.
- Cost per successful task and fallback frequency.
- Availability, error rate, stream interruption rate, and recovery rate.

Every claimed improvement should include the task definition, dataset version, baseline system, sample size, confidence interval, and release comparison. If evidence is insufficient, report the result as unknown rather than claiming superiority.
