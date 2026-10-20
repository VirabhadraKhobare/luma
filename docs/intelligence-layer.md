# Intelligence Layer

The intelligence service lives in [`server/`](../server/) and is intentionally provider-neutral. Browser code calls `/api/chat`; provider credentials are read only by the Node process and are never exposed through Vite or `VITE_*` variables.

## Runtime setup

```bash
copy .env.example .env
# Set AI_API_KEY and AI_CHAT_MODEL in .env
npm run dev:api
npm run dev
```

`AI_BASE_URL` supports OpenAI-compatible APIs, including self-hosted gateways. The service returns HTTP 503 when a required provider is not configured; it never substitutes a hardcoded answer.

## Capability contract

| Capability | Provider requirements | API contract | Failure handling | Tests and measurable success |
|---|---|---|---|---|
| Model completion | OpenAI-compatible `/chat/completions`; `AI_API_KEY`, `AI_CHAT_MODEL` | `POST /api/chat` with `{ message, conversationId? }`; SSE `meta`, `token`, `done`, `error` events | 30-second abort, explicit provider status, no success-shaped fallback | Contract test with a mock provider; p95 first token and final latency targets are set per environment |
| Model routing | Fast, balanced, and deep model env values | Route metadata contains selected model, task, and reason | Falls back between configured route names only; missing configuration is 503 | Routing table tests for current-news, coding, and reasoning prompts; route selection is observable |
| Conversation context | Store available; model context budget | Last 20 messages are included server-side; persisted after completion | Context is bounded; persistence failure returns stream error | Restart persistence test; context-window test proves oldest messages are excluded |
| Web search | `TAVILY_API_KEY` | Search is automatically requested for current-information signals; sources appear in `done` | Missing key or provider error is surfaced; citations are never invented | Mock search test verifies every rendered source has a URL; retrieval precision target is defined on a dated query set |
| Documents and RAG | Text extracted by caller initially; storage/chunking built in | `POST /api/documents` with `{ name, text }`; chunks are persisted and retrieved by lexical relevance | Empty text and malformed input fail visibly | Chunk overlap/size tests; permission tests must be added before multi-tenant storage; recall@k target is measured on a labeled corpus |
| Embeddings | Optional OpenAI-compatible `/embeddings` and `AI_EMBEDDING_MODEL` | Provider `embed(texts, signal)` interface | Embedding failures do not silently mark a document indexed; lexical retrieval remains explicit | Embedding contract test and vector recall benchmark before enabling pgvector |
| Calculator | No external provider | `POST /api/calculate` with `{ expression }` | Rejects non-arithmetic characters, excessive length, non-finite results | Unit tests cover precedence, division, invalid characters, and limits; 100% deterministic result accuracy |
| Tool calls | Tool registry and per-tool policy | Tool results use `{ output, verified, sources? }` | Tool allowlists, bounded input, timeout, retry policy, and approval gate required for side effects | Registry tests prove unknown tools cannot execute; every tool has timeout and audit events |
| Planning | Completion provider | Planner will emit typed steps and approval-required flags | Failed steps stop or retry according to policy; consequential steps require approval | Golden plans verify dependency ordering, retryability, and no execution without approval |
| Voice, image, speech | Compatible transcription, vision, TTS, or image provider | Add adapters beside `Provider`; API should return typed media job events | Unsupported capability is reported as unavailable; no fake transcript or image URL | Fixture-based provider contract tests and latency/error-rate dashboards |
| Memory | Explicit consent and encrypted persistent store | Separate memory CRUD endpoint should expose consent, review, and delete | Memory disabled by default; deletion is destructive and audited | Consent, export, and deletion tests; zero retrieval when consent is absent |

## Safety invariants

1. Provider keys exist only in server environment variables.
2. Search and document references are included only when returned by a tool or retrieval operation.
3. The system prompt instructs the model to distinguish verified information, estimates, and uncertainty.
4. Tool output is untrusted data and cannot grant permissions.
5. Consequential actions require a future approval token; this first slice does not execute external side effects.
6. Every provider call has a timeout and bounded output budget.
7. Errors are sent as explicit SSE `error` events or non-2xx JSON responses.

## Extension points

- Replace `Store` with PostgreSQL repositories without changing the route or provider contracts.
- Add a document extraction worker for PDF, DOCX, XLSX, and CSV. The current `POST /api/documents` contract accepts extracted text so the parser can be introduced behind the same boundary.
- Add pgvector embeddings once corpus size and benchmarked retrieval quality justify the operational dependency.
- Add a typed `ToolRegistry` and approval service before connecting calendar, email, code execution, or other consequential integrations.
